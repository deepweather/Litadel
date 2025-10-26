"""Backtest execution and state management with async support."""

import logging
import os
import threading
import traceback
from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import datetime
from typing import Any

from api.database import (
    Backtest,
    BacktestEquityCurve,
    BacktestTrade,
    SessionLocal,
)
from litadel.backtest import BacktestConfig, BacktestEngine

logger = logging.getLogger(__name__)


class BacktestExecutor:
    """Manages backtest execution with thread pool and state tracking."""

    def __init__(self, max_workers: int | None = None):
        """
        Initialize the executor.

        Args:
            max_workers: Maximum concurrent backtests (default: from env or 2)
        """
        if max_workers is None:
            max_workers = int(os.getenv("MAX_CONCURRENT_BACKTESTS", "2"))

        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.active_backtests: dict[int, Future] = {}
        self.status_callbacks: dict[int, list[Callable]] = {}
        self._lock = threading.Lock()
        self._shutdown_flag = threading.Event()
        self._running_backtest_ids: set = set()

    def register_status_callback(self, backtest_id: int, callback: Callable):
        """Register a callback for status updates."""
        with self._lock:
            if backtest_id not in self.status_callbacks:
                self.status_callbacks[backtest_id] = []
            self.status_callbacks[backtest_id].append(callback)

    def unregister_status_callbacks(self, backtest_id: int):
        """Remove all callbacks for a backtest."""
        with self._lock:
            if backtest_id in self.status_callbacks:
                del self.status_callbacks[backtest_id]

    def _notify_callbacks(self, backtest_id: int, status_data: dict[str, Any]):
        """Notify all registered callbacks."""
        with self._lock:
            callbacks = self.status_callbacks.get(backtest_id, [])

        for callback in callbacks:
            try:
                callback(status_data)
            except Exception as e:
                logger.error(f"Error in status callback: {e}")

    def start_validation(self, backtest_id: int) -> int:
        """
        Start strategy code validation in the background.

        Args:
            backtest_id: Database ID of the backtest to validate

        Returns:
            backtest_id
        """
        future = self.executor.submit(self._validate_strategy, backtest_id)

        with self._lock:
            self.active_backtests[backtest_id] = future

        # Cleanup when done
        future.add_done_callback(lambda f: self._cleanup_backtest(backtest_id))

        return backtest_id

    def start_backtest(self, backtest_id: int, config: BacktestConfig) -> int:
        """
        Start a new backtest in the background.

        Args:
            backtest_id: Database ID of the backtest
            config: Backtest configuration

        Returns:
            backtest_id
        """
        future = self.executor.submit(self._run_backtest, backtest_id, config)

        with self._lock:
            self.active_backtests[backtest_id] = future

        # Cleanup when done
        future.add_done_callback(lambda f: self._cleanup_backtest(backtest_id))

        return backtest_id

    def _cleanup_backtest(self, backtest_id: int):
        """Clean up after backtest completes."""
        # Small delay to ensure final status update is broadcast before cleanup
        import time

        time.sleep(0.5)  # Wait for final WebSocket broadcast

        with self._lock:
            if backtest_id in self.active_backtests:
                del self.active_backtests[backtest_id]
        self.unregister_status_callbacks(backtest_id)

    def cancel_backtest(self, backtest_id: int) -> bool:
        """
        Attempt to cancel a running backtest.

        Returns:
            True if cancelled, False if not found or already completed
        """
        with self._lock:
            future = self.active_backtests.get(backtest_id)

        if future and not future.done():
            cancelled = future.cancel()
            if cancelled:
                # Update database status
                db = SessionLocal()
                try:
                    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
                    if backtest:
                        backtest.status = "cancelled"
                        backtest.updated_at = datetime.utcnow()
                        db.commit()
                finally:
                    db.close()
            return cancelled
        return False

    def get_status(self, backtest_id: int) -> dict[str, Any] | None:
        """Get current status of a backtest."""
        db = SessionLocal()
        try:
            backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
            if not backtest:
                return None

            return {
                "id": backtest.id,
                "status": backtest.status,
                "progress_percentage": backtest.progress_percentage,
                "updated_at": backtest.updated_at,
            }
        finally:
            db.close()

    def _update_status(
        self,
        backtest_id: int,
        status: str | None = None,
        progress: int | None = None,
        error_message: str | None = None,
    ):
        """Update backtest status in database and notify callbacks."""
        db = SessionLocal()
        try:
            backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
            if not backtest:
                return

            if status:
                backtest.status = status
            if progress is not None:
                backtest.progress_percentage = progress
            if error_message:
                backtest.error_traceback = error_message

            backtest.updated_at = datetime.utcnow()

            if status == "completed":
                backtest.completed_at = datetime.utcnow()
                backtest.progress_percentage = 100

            db.commit()
            db.refresh(backtest)

            # Notify callbacks
            status_data = {
                "type": "status_update",
                "backtest_id": backtest.id,
                "status": backtest.status,
                "progress_percentage": backtest.progress_percentage,
                "timestamp": backtest.updated_at.isoformat(),
            }
            self._notify_callbacks(backtest_id, status_data)

        finally:
            db.close()

    def _validate_strategy(self, backtest_id: int):
        """Validate strategy code in background thread."""
        from langchain_openai import ChatOpenAI

        from litadel.agents.utils.strategy_code_generator_agent import validate_strategy_code
        from litadel.default_config import DEFAULT_CONFIG

        logger.info(f"Validating strategy code for backtest {backtest_id}...")

        db = SessionLocal()
        try:
            backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
            if not backtest:
                logger.error(f"Backtest {backtest_id} not found for validation")
                return

            # Update status with WebSocket broadcast
            self._update_status(backtest_id, status="validating", progress=10)

            # Initialize LLM for self-healing
            llm = ChatOpenAI(
                model=DEFAULT_CONFIG.get("quick_think_llm", "gpt-4o-mini"),
                base_url=DEFAULT_CONFIG.get("backend_url", "https://api.openai.com/v1"),
            )

            # Update progress
            self._update_status(backtest_id, progress=30)

            # Validate with self-healing
            is_valid, message, fixed_code = validate_strategy_code(backtest.strategy_code_python, llm)

            # Get fresh instance
            backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
            if not backtest:
                return

            if is_valid:
                # Update with validated/fixed code
                backtest.strategy_code_python = fixed_code
                backtest.updated_at = datetime.utcnow()
                db.commit()

                # Broadcast success
                self._update_status(backtest_id, status="pending", progress=100)
                logger.info(
                    f"Backtest {backtest_id} validated successfully. Auto-fixed: {fixed_code != backtest.strategy_code_python}"
                )
            else:
                # Validation failed
                backtest.error_traceback = f"Strategy validation failed: {message}"
                backtest.updated_at = datetime.utcnow()
                db.commit()

                # Broadcast failure
                self._update_status(backtest_id, status="failed", error_message=message)
                logger.error(f"Backtest {backtest_id} validation failed: {message}")

        except Exception as e:
            logger.exception(f"Validation error for backtest {backtest_id}: {e}")
            # Broadcast error
            self._update_status(backtest_id, status="failed", error_message=f"Validation error: {e!s}")
        finally:
            db.close()

    def _run_backtest(self, backtest_id: int, config: BacktestConfig):
        """Execute the backtest (runs in thread pool)."""
        logger.info(f"Starting backtest {backtest_id} for {config.symbol}")

        # Register as running
        with self._lock:
            self._running_backtest_ids.add(backtest_id)

        try:
            # Check if shutdown was requested
            if self._shutdown_flag.is_set():
                logger.info(f"Backtest {backtest_id} cancelled before start due to shutdown")
                self._update_status(backtest_id, status="cancelled", error_message="Cancelled due to shutdown")
                return

            # Update status to running
            self._update_status(backtest_id, status="running", progress=0)
            logger.info(f"Backtest {backtest_id}: Initializing engine...")

            # Execute backtest
            engine = BacktestEngine()
            result = engine.execute(config)

            # Store results in database
            logger.info(f"Backtest {backtest_id}: Storing results...")
            self._store_results(backtest_id, result, config)

            # Mark as completed
            logger.info(f"Backtest {backtest_id} completed successfully")
            self._update_status(backtest_id, status="completed", progress=100)

        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()
            logger.exception(f"Backtest {backtest_id} failed: {error_msg}")
            self._update_status(backtest_id, status="failed", error_message=error_trace)

        finally:
            # Unregister from running set
            with self._lock:
                self._running_backtest_ids.discard(backtest_id)

    def _store_results(self, backtest_id: int, result, config: BacktestConfig):
        """Store backtest results in database."""
        db = SessionLocal()
        try:
            backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
            if not backtest:
                raise ValueError(f"Backtest {backtest_id} not found")

            # Update metrics
            backtest.final_portfolio_value = result.final_value
            backtest.total_return = result.final_value - result.initial_capital
            backtest.total_return_pct = result.total_return_pct
            backtest.sharpe_ratio = result.sharpe_ratio
            backtest.max_drawdown = (
                result.max_drawdown_pct * result.initial_capital / 100 if result.max_drawdown_pct else None
            )
            backtest.max_drawdown_pct = result.max_drawdown_pct
            backtest.win_rate = result.win_rate
            backtest.total_trades = result.num_trades

            # Parse avg_trade_duration to days
            if result.avg_trade_duration:
                try:
                    # Extract days from "X days HH:MM:SS" format
                    duration_str = str(result.avg_trade_duration)
                    if "days" in duration_str:
                        days_part = duration_str.split("days")[0].strip()
                        backtest.avg_trade_duration_days = float(days_part)
                    else:
                        backtest.avg_trade_duration_days = 0.0
                except:
                    backtest.avg_trade_duration_days = None

            # Store execution metadata
            backtest.asset_class = config.asset_class
            backtest.commission = config.commission
            backtest.data_source = result.data_source
            backtest.execution_time_seconds = result.execution_time_seconds

            db.commit()

            # Store trades - create BOTH entry and exit records
            for trade_record in result.trades:
                try:
                    entry_time = datetime.fromisoformat(trade_record.entry_time)
                except:
                    entry_time = None

                try:
                    exit_time = datetime.fromisoformat(trade_record.exit_time)
                except:
                    exit_time = None

                # Parse duration to days
                duration_days = None
                if trade_record.duration:
                    try:
                        duration_str = str(trade_record.duration)
                        if "days" in duration_str:
                            days_part = duration_str.split("days")[0].strip()
                            duration_days = float(days_part)
                    except:
                        pass

                # Create ENTRY trade (BUY)
                entry_trade = BacktestTrade(
                    backtest_id=backtest_id,
                    ticker=config.symbol,
                    action="BUY",
                    quantity=trade_record.size,
                    price=trade_record.entry_price,
                    trade_date=entry_time or datetime.utcnow(),
                    entry_time=entry_time,
                    exit_time=exit_time,
                    duration_days=duration_days,
                    pnl=None,  # P&L only on exit
                    pnl_pct=None,
                    return_pct=None,
                )
                db.add(entry_trade)

                # Create EXIT trade (SELL)
                if exit_time:  # Only add exit if trade was closed
                    exit_trade = BacktestTrade(
                        backtest_id=backtest_id,
                        ticker=config.symbol,
                        action="SELL",
                        quantity=trade_record.size,
                        price=trade_record.exit_price,
                        trade_date=exit_time,
                        entry_time=entry_time,
                        exit_time=exit_time,
                        duration_days=duration_days,
                        pnl=trade_record.pnl,
                        pnl_pct=trade_record.return_pct,
                        return_pct=trade_record.return_pct,
                    )
                    db.add(exit_trade)

            # Store equity curve
            for point in result.equity_curve:
                try:
                    date = datetime.fromisoformat(point.date)
                except:
                    # Try pandas timestamp format
                    try:
                        date = datetime.fromisoformat(point.date.split()[0])
                    except:
                        continue  # Skip invalid dates

                equity_point = BacktestEquityCurve(
                    backtest_id=backtest_id,
                    date=date,
                    equity=point.equity,
                    drawdown_pct=point.drawdown_pct,
                )
                db.add(equity_point)

            db.commit()
            logger.info(
                f"Backtest {backtest_id}: Stored {len(result.trades)} trades and {len(result.equity_curve)} equity points"
            )

        finally:
            db.close()

    def shutdown(self, timeout: int = 5):
        """
        Shutdown the executor and cancel all running backtests.

        Args:
            timeout: Maximum seconds to wait for backtests to stop
        """
        logger.info("Shutdown requested - cancelling running backtests...")

        # Set shutdown flag
        self._shutdown_flag.set()

        # Mark all running backtests as cancelled
        db = SessionLocal()
        try:
            with self._lock:
                running_ids = list(self._running_backtest_ids)

            for backtest_id in running_ids:
                backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
                if backtest and backtest.status == "running":
                    backtest.status = "cancelled"
                    backtest.error_traceback = "Cancelled due to shutdown"
                    backtest.updated_at = datetime.utcnow()
                    logger.info(f"Marked backtest {backtest_id} as cancelled")

            db.commit()
        except Exception as e:
            logger.exception(f"Error marking backtests as cancelled: {e}")
        finally:
            db.close()

        # Cancel futures
        with self._lock:
            for backtest_id in list(self.active_backtests.keys()):
                self.cancel_backtest(backtest_id)

        # Shutdown executor - wait for running threads to finish
        logger.info(f"Shutting down executor (timeout: {timeout}s)...")
        try:
            self.executor.shutdown(wait=True, cancel_futures=True)
            logger.info("Executor shutdown complete")
        except Exception as e:
            logger.warning(f"Error during executor shutdown: {e}")

        logger.info("Shutdown complete")


# Global executor instance
_executor: BacktestExecutor | None = None


def get_backtest_executor() -> BacktestExecutor:
    """Get the global executor instance."""
    global _executor
    if _executor is None:
        _executor = BacktestExecutor()
    return _executor


def shutdown_backtest_executor():
    """Shutdown the global executor."""
    global _executor
    if _executor:
        _executor.shutdown()
        _executor = None
