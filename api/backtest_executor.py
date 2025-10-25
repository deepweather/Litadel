"""Backtest execution and state management."""

import csv
import json
import logging
import os
import random
import threading
import traceback
from collections import defaultdict
from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from api.backtest_metrics import (
    calculate_avg_trade_duration,
    calculate_max_drawdown,
    calculate_profit_factor,
    calculate_sharpe_ratio,
    calculate_total_return,
    calculate_trade_statistics,
    calculate_win_rate,
)
from api.database import Backtest, BacktestSnapshot, BacktestTrade, SessionLocal
from cli.asset_detection import detect_asset_class

logger = logging.getLogger(__name__)

# Data cache directory
DATA_CACHE_DIR = Path(__file__).parent.parent / "litadel" / "dataflows" / "data_cache"

# Random ticker pool for truly random backtests
# Mix of liquid stocks, crypto, and commodities with good historical data
RANDOM_TICKER_POOL = [
    # Tech stocks (2010+)
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "META",
    "NVDA",
    "TSLA",
    "NFLX",
    "ADBE",
    "CRM",
    "INTC",
    "AMD",
    "ORCL",
    "IBM",
    "CSCO",
    "QCOM",
    # Financial (2000+)
    "JPM",
    "BAC",
    "WFC",
    "GS",
    "MS",
    "V",
    "MA",
    "C",
    "AXP",
    # Consumer (2000+)
    "WMT",
    "HD",
    "NKE",
    "MCD",
    "SBUX",
    "DIS",
    "COST",
    "PG",
    "KO",
    "PEP",
    # Healthcare (2000+)
    "JNJ",
    "UNH",
    "PFE",
    "ABBV",
    "TMO",
    "MRK",
    "LLY",
    # Energy & Industrial (2000+)
    "XOM",
    "CVX",
    "BA",
    "CAT",
    "GE",
    # Crypto (BTC 2014+, ETH 2015+, others 2017+)
    "BTC-USD",
    "ETH-USD",
    "BNB-USD",
    "XRP-USD",
    "ADA-USD",
    "SOL-USD",
    "DOGE-USD",
    "LTC-USD",
    "MATIC-USD",
    "DOT-USD",
    # Commodities (Alpha Vantage)
    "BRENT",
    "WTI",
    "COPPER",
    "WHEAT",
    "CORN",
]


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

    def start_backtest(self, backtest_id: int) -> int:
        """
        Start a new backtest in the background.

        Args:
            backtest_id: Backtest ID

        Returns:
            backtest_id
        """
        future = self.executor.submit(self._run_backtest, backtest_id)

        with self._lock:
            self.active_backtests[backtest_id] = future

        # Cleanup when done
        future.add_done_callback(lambda f: self._cleanup_backtest(backtest_id))

        return backtest_id

    def _cleanup_backtest(self, backtest_id: int):
        """Clean up after backtest completes."""
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
                        backtest.updated_at = datetime.now(tz=timezone.utc)
                        db.commit()
                finally:
                    db.close()
            return cancelled
        return False

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
                logger.error(f"Backtest {backtest_id} error: {error_message}")

            backtest.updated_at = datetime.now(tz=timezone.utc)

            if status == "completed":
                backtest.completed_at = datetime.now(tz=timezone.utc)
                backtest.progress_percentage = 100

            db.commit()
            db.refresh(backtest)

            # Notify callbacks (WebSocket)
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

    def _filter_ticker_pool_by_date(self, start_date: datetime) -> list[str]:
        """Filter ticker pool to only include tickers likely to have data for the given start date.

        Args:
            start_date: Backtest start date

        Returns:
            List of tickers that should have data available
        """
        start_year = start_date.year
        filtered = []

        for ticker in RANDOM_TICKER_POOL:
            ticker_upper = ticker.upper()

            # Crypto availability based on launch dates
            if ticker_upper.endswith("-USD"):
                base = ticker_upper.replace("-USD", "")
                # BTC: 2014+
                if (
                    (base == "BTC" and start_year >= 2014)
                    or (base == "ETH" and start_year >= 2015)
                    or (base in ["LTC", "XRP", "BNB"] and start_year >= 2017)
                    or (base in ["ADA", "DOT", "MATIC", "SOL", "DOGE"] and start_year >= 2020)
                ):
                    filtered.append(ticker)
            # Commodities: generally available 2000+
            elif ticker_upper in ["BRENT", "WTI", "COPPER", "WHEAT", "CORN"]:
                if start_year >= 2000:
                    filtered.append(ticker)
            # Stocks: most are available 2000+, tech stocks 2010+
            # Tech IPOs have specific dates
            elif (
                (ticker_upper == "META" and start_year >= 2012)
                or (ticker_upper == "TSLA" and start_year >= 2010)
                or (ticker_upper == "NVDA" and start_year >= 1999)
                or start_year >= 2000
            ):
                filtered.append(ticker)

        return filtered

    def _fetch_historical_prices(
        self, tickers: list[str], start_date: datetime, end_date: datetime
    ) -> dict[str, dict[str, float]]:
        """
        Fetch historical prices for tickers.

        Args:
            tickers: List of ticker symbols
            start_date: Start date
            end_date: End date

        Returns:
            Dict mapping ticker -> date_string -> close_price
        """
        import time

        from api.endpoints.data import _ensure_cached_data

        price_data = {}
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        successful_count = 0
        failed_tickers = []

        for ticker in tickers:
            ticker_upper = ticker.upper()
            try:
                logger.info(f"Fetching historical data for {ticker_upper} from {start_str} to {end_str}")

                # Detect asset class for logging
                asset_class = detect_asset_class(ticker_upper)
                logger.info(f"{ticker_upper} detected as asset class: {asset_class}")

                # Try to ensure data is cached (with retry logic for network issues)
                max_retries = 2
                cache_created = False

                for attempt in range(max_retries):
                    try:
                        _ensure_cached_data(ticker_upper, start_str, end_str, update_stale=True)
                        cache_created = True
                        break
                    except Exception as e:
                        if attempt < max_retries - 1:
                            logger.warning(
                                f"Attempt {attempt + 1}/{max_retries} failed for {ticker_upper}: {e}. Retrying..."
                            )
                            time.sleep(1)  # Brief delay before retry
                        else:
                            logger.warning(f"All {max_retries} attempts failed for {ticker_upper}: {e}")
                            raise  # Re-raise to be caught by outer except

                # Find cache file - ALL asset classes use the same pattern
                pattern = f"{ticker_upper}-YFin-data-*.csv"
                matching_files = list(DATA_CACHE_DIR.glob(pattern))

                if not matching_files:
                    logger.warning(f"No cached data found for {ticker_upper} (pattern: {pattern})")
                    failed_tickers.append(ticker_upper)
                    continue

                # Use the most recent cache file (in case of multiple)
                csv_file = max(matching_files, key=lambda p: p.stat().st_mtime)
                logger.debug(f"Using cache file: {csv_file.name}")

                # Verify file has content
                file_size = csv_file.stat().st_size
                if file_size < 100:  # Less than 100 bytes = likely empty or header only
                    logger.warning(
                        f"Cache file for {ticker_upper} is too small ({file_size} bytes). "
                        f"Data source may have returned empty results."
                    )
                    failed_tickers.append(ticker_upper)
                    continue

                # Read and parse CSV
                ticker_prices = {}
                with open(csv_file) as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        date_str = row.get("Date", "")[:10]  # YYYY-MM-DD
                        close_price = row.get("Close", "")

                        if date_str and close_price:
                            try:
                                # Filter by date range
                                if start_str <= date_str <= end_str:
                                    ticker_prices[date_str] = float(close_price)
                            except ValueError:
                                continue

                if not ticker_prices:
                    logger.warning(
                        f"No price data for {ticker_upper} in date range {start_str} to {end_str}. "
                        f"Ticker may not have existed during this period or data is unavailable."
                    )
                    failed_tickers.append(ticker_upper)
                    continue

                price_data[ticker_upper] = ticker_prices
                successful_count += 1
                logger.info(f"✓ Successfully loaded {len(ticker_prices)} price points for {ticker_upper}")

            except Exception as e:
                logger.warning(f"Failed to fetch prices for {ticker}: {e}. Skipping this ticker.")
                failed_tickers.append(ticker_upper)
                continue

        # Log summary
        logger.info(f"Price data fetch complete: {successful_count}/{len(tickers)} tickers successful")
        if failed_tickers:
            logger.warning(f"Failed tickers: {', '.join(failed_tickers)}")

        return price_data

    def _get_price(self, price_data: dict[str, dict[str, float]], ticker: str, date: datetime) -> float | None:
        """
        Get price for a ticker on a specific date.

        If exact date not found, uses last available price before that date.

        Args:
            price_data: Price data dictionary
            ticker: Ticker symbol
            date: Date to get price for

        Returns:
            Price or None if not available
        """
        ticker_upper = ticker.upper()
        if ticker_upper not in price_data:
            return None

        ticker_prices = price_data[ticker_upper]
        date_str = date.strftime("%Y-%m-%d")

        # Try exact match first
        if date_str in ticker_prices:
            return ticker_prices[date_str]

        # Find closest date before target date
        available_dates = sorted([d for d in ticker_prices.keys() if d <= date_str])
        if available_dates:
            closest_date = available_dates[-1]
            return ticker_prices[closest_date]

        return None

    def _generate_random_trades(
        self,
        backtest_id: int,
        tickers: list[str],
        start_date: datetime,
        end_date: datetime,
        initial_capital: float,
        max_positions: int,
        price_data: dict[str, dict[str, float]],
    ) -> list[dict]:
        """
        Generate random trades with BUY/SELL pairing.

        Args:
            backtest_id: Backtest ID
            tickers: List of tickers
            start_date: Start date
            end_date: End date
            initial_capital: Initial capital
            max_positions: Maximum positions
            price_data: Historical price data

        Returns:
            List of trade dictionaries
        """
        # Calculate number of trades based on date range
        days = (end_date - start_date).days
        num_trade_pairs = min(max(10, days // 10), 50)  # 10-50 trade pairs

        trades = []
        open_positions = defaultdict(list)  # ticker -> list of (buy_date, quantity, buy_price)

        # Generate trading dates (business days only)
        all_dates = []
        current = start_date
        while current <= end_date:
            # Simple business day filter (exclude weekends)
            if current.weekday() < 5:
                all_dates.append(current)
            current += timedelta(days=1)

        if not all_dates:
            logger.warning("No trading dates available")
            return []

        # Phase 1: Generate BUY trades
        logger.info(f"Generating {num_trade_pairs} random trade pairs")

        for i in range(num_trade_pairs):
            # Respect max_positions
            if len(open_positions) >= max_positions:
                # Pick from existing positions
                ticker = random.choice(list(open_positions.keys()))
            else:
                # Randomly select ticker
                ticker = random.choice(tickers).upper()

            # Random date in first 70% of date range (to allow time for exits)
            buy_window_end = int(len(all_dates) * 0.7)
            if buy_window_end < 1:
                buy_window_end = len(all_dates) - 1

            buy_date = random.choice(all_dates[:buy_window_end])
            buy_price = self._get_price(price_data, ticker, buy_date)

            if buy_price is None or buy_price <= 0:
                logger.warning(f"No price available for {ticker} on {buy_date}, skipping")
                continue

            # Calculate quantity (5-15% of capital per trade)
            allocation_pct = random.uniform(0.05, 0.15)
            quantity = int((initial_capital * allocation_pct) / buy_price)

            quantity = max(quantity, 1)

            # Record BUY trade
            trades.append(
                {
                    "ticker": ticker,
                    "action": "BUY",
                    "quantity": quantity,
                    "price": buy_price,
                    "trade_date": buy_date,
                }
            )

            # Track open position
            open_positions[ticker].append((buy_date, quantity, buy_price))

        # Phase 2: Generate SELL trades for open positions
        for ticker, positions in open_positions.items():
            for buy_date, quantity, buy_price in positions:
                # Random date after buy (in remaining date range)
                available_sell_dates = [d for d in all_dates if d > buy_date]

                if not available_sell_dates:
                    # If no dates available, use last date
                    available_sell_dates = [all_dates[-1]]

                sell_date = random.choice(available_sell_dates)
                sell_price = self._get_price(price_data, ticker, sell_date)

                if sell_price is None or sell_price <= 0:
                    logger.warning(f"No price available for {ticker} on {sell_date}, using buy price")
                    sell_price = buy_price

                # Calculate P&L
                pnl = (sell_price - buy_price) * quantity
                pnl_pct = ((sell_price - buy_price) / buy_price) * 100

                # Record SELL trade
                trades.append(
                    {
                        "ticker": ticker,
                        "action": "SELL",
                        "quantity": quantity,
                        "price": sell_price,
                        "trade_date": sell_date,
                        "pnl": pnl,
                        "pnl_pct": pnl_pct,
                    }
                )

        # Sort trades by date
        trades.sort(key=lambda t: t["trade_date"])

        logger.info(f"Generated {len(trades)} total trades")
        return trades

    def _execute_portfolio_simulation(
        self,
        backtest_id: int,
        trades: list[dict],
        initial_capital: float,
        start_date: datetime,
        end_date: datetime,
        rebalance_frequency: str,
        price_data: dict[str, dict[str, float]],
        db: Any,
    ):
        """
        Simulate portfolio day-by-day with proper accounting.

        Args:
            backtest_id: Backtest ID
            trades: List of trades
            initial_capital: Starting capital
            start_date: Start date
            end_date: End date
            rebalance_frequency: Rebalancing frequency (daily/weekly/monthly)
            price_data: Historical price data
            db: Database session
        """
        # Initialize portfolio state
        cash = initial_capital
        positions = defaultdict(float)  # ticker -> quantity
        peak_value = initial_capital

        # Group trades by date
        trades_by_date = defaultdict(list)
        for trade in trades:
            date_str = trade["trade_date"].strftime("%Y-%m-%d")
            trades_by_date[date_str].append(trade)

        # Determine snapshot frequency
        snapshot_days = {"daily": 1, "weekly": 7, "monthly": 30}.get(rebalance_frequency, 7)

        snapshots = []
        current_date = start_date
        last_snapshot_date = None

        logger.info(f"Starting portfolio simulation from {start_date} to {end_date}")

        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")

            # Execute trades for this date
            if date_str in trades_by_date:
                for trade in trades_by_date[date_str]:
                    if trade["action"] == "BUY":
                        cost = trade["price"] * trade["quantity"]
                        if cash >= cost:
                            cash -= cost
                            positions[trade["ticker"]] += trade["quantity"]
                        else:
                            logger.warning(f"Insufficient cash for BUY {trade['ticker']} on {date_str}, skipping")
                    elif trade["action"] == "SELL":
                        cash += trade["price"] * trade["quantity"]
                        positions[trade["ticker"]] -= trade["quantity"]
                        if positions[trade["ticker"]] <= 0:
                            del positions[trade["ticker"]]

            # Mark-to-market positions
            positions_value = 0.0
            positions_detail = {}

            for ticker, quantity in positions.items():
                if quantity > 0:
                    price = self._get_price(price_data, ticker, current_date)
                    if price:
                        value = price * quantity
                        positions_value += value
                        positions_detail[ticker] = {
                            "quantity": quantity,
                            "price": price,
                            "value": value,
                        }

            total_value = cash + positions_value

            # Calculate returns and drawdown
            cumulative_return = total_value - initial_capital
            cumulative_return_pct = (cumulative_return / initial_capital) * 100

            peak_value = max(total_value, peak_value)

            drawdown = peak_value - total_value
            drawdown_pct = (drawdown / peak_value) * 100 if peak_value > 0 else 0.0

            # Create snapshot based on frequency
            should_snapshot = False
            if last_snapshot_date is None:
                should_snapshot = True
            else:
                days_since_last = (current_date - last_snapshot_date).days
                should_snapshot = days_since_last >= snapshot_days

            if should_snapshot:
                snapshot = BacktestSnapshot(
                    backtest_id=backtest_id,
                    snapshot_date=current_date,
                    cash=cash,
                    positions_value=positions_value,
                    total_value=total_value,
                    cumulative_return=cumulative_return,
                    cumulative_return_pct=cumulative_return_pct,
                    drawdown=drawdown,
                    drawdown_pct=drawdown_pct,
                    positions=json.dumps(positions_detail),
                )
                snapshots.append(snapshot)
                last_snapshot_date = current_date

            # Move to next day
            current_date += timedelta(days=1)

        # Save snapshots in batches
        logger.info(f"Saving {len(snapshots)} snapshots")
        for i in range(0, len(snapshots), 100):
            batch = snapshots[i : i + 100]
            db.add_all(batch)
            db.commit()
            self._update_status(backtest_id, progress=70 + int((i / len(snapshots)) * 20))

        logger.info("Portfolio simulation complete")

    def _calculate_and_store_metrics(self, backtest_id: int, db: Any):
        """
        Calculate final performance metrics and update backtest.

        Args:
            backtest_id: Backtest ID
            db: Database session
        """
        logger.info("Calculating performance metrics")

        # Load backtest
        backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
        if not backtest:
            return

        # Load snapshots and trades
        snapshots = db.query(BacktestSnapshot).filter(BacktestSnapshot.backtest_id == backtest_id).all()
        trades = db.query(BacktestTrade).filter(BacktestTrade.backtest_id == backtest_id).all()

        if not snapshots:
            logger.warning("No snapshots available for metrics calculation")
            return

        # Calculate metrics
        total_return, total_return_pct = calculate_total_return(snapshots)
        sharpe_ratio = calculate_sharpe_ratio(snapshots)
        max_dd, max_dd_pct = calculate_max_drawdown(snapshots)
        win_rate = calculate_win_rate(trades)
        avg_duration = calculate_avg_trade_duration(trades)
        profit_factor = calculate_profit_factor(trades)
        trade_stats = calculate_trade_statistics(trades)

        # Get final portfolio value
        final_value = snapshots[-1].total_value if snapshots else backtest.initial_capital

        # Update backtest
        backtest.final_portfolio_value = final_value
        backtest.total_return = total_return
        backtest.total_return_pct = total_return_pct
        backtest.sharpe_ratio = sharpe_ratio
        backtest.max_drawdown = max_dd
        backtest.max_drawdown_pct = max_dd_pct
        backtest.win_rate = win_rate
        backtest.total_trades = len(trades) if trades else 0
        backtest.avg_trade_duration_days = avg_duration

        db.commit()

        # Format metrics with None handling
        return_str = f"{total_return_pct:.2f}%" if total_return_pct is not None else "N/A"
        sharpe_str = f"{sharpe_ratio:.2f}" if sharpe_ratio is not None else "N/A"
        maxdd_str = f"{max_dd_pct:.2f}%" if max_dd_pct is not None else "N/A"
        winrate_str = f"{win_rate:.2f}%" if win_rate is not None else "N/A"

        logger.info(f"Metrics: Return={return_str}, Sharpe={sharpe_str}, " f"MaxDD={maxdd_str}, WinRate={winrate_str}")

    def _run_backtest(self, backtest_id: int):
        """Execute the backtest (runs in thread pool)."""
        logger.info(f"Starting backtest execution for ID {backtest_id}")

        # Register as running
        with self._lock:
            self._running_backtest_ids.add(backtest_id)

        db = SessionLocal()

        try:
            # Check for shutdown
            if self._shutdown_flag.is_set():
                logger.info(f"Backtest {backtest_id} cancelled before start due to shutdown")
                self._update_status(backtest_id, status="cancelled")
                return

            # Load backtest config
            backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
            if not backtest:
                logger.error(f"Backtest {backtest_id} not found")
                return

            # Update status to running
            self._update_status(backtest_id, status="running", progress=0)

            # Parse config
            start_date = backtest.start_date
            end_date = backtest.end_date
            initial_capital = backtest.initial_capital
            max_positions = backtest.max_positions
            rebalance_frequency = backtest.rebalance_frequency

            # Validate dates (no future dates allowed)
            today = datetime.now()
            if end_date > today:
                logger.warning(f"End date {end_date} is in the future, adjusting to today")
                end_date = today
                # Update in database
                backtest.end_date = end_date
                db.commit()

            if start_date >= end_date:
                raise ValueError(
                    f"Invalid date range: start_date ({start_date.date()}) must be before end_date ({end_date.date()})"
                )

            # RANDOM STRATEGY: Ignore user's ticker_list and pick random tickers
            # Filter ticker pool based on date range to ensure data availability
            filtered_pool = self._filter_ticker_pool_by_date(start_date)

            if not filtered_pool:
                raise ValueError(
                    f"No suitable tickers available for date range starting {start_date.date()}. "
                    f"Try a more recent start date (2010 or later recommended)."
                )

            # Randomly select tickers - try to fetch more than needed since some may fail
            # Target: 3-10 successful tickers
            target_num = min(random.randint(3, 10), max_positions)
            # Try to fetch 50% more than target to account for potential failures
            num_to_try = min(int(target_num * 1.5), len(filtered_pool))
            tickers = random.sample(filtered_pool, num_to_try)

            logger.info(
                f"RANDOM BACKTEST: Filtered pool has {len(filtered_pool)} tickers for date range starting {start_date.date()}"
            )
            logger.info(
                f"RANDOM BACKTEST: Attempting to fetch {num_to_try} tickers (target: {target_num} successful): {tickers}"
            )
            logger.info(
                f"Config: dates={start_date.date()} to {end_date.date()}, "
                f"capital=${initial_capital}, max_positions={max_positions}"
            )

            # Step 1: Fetch historical prices (0-20%)
            self._update_status(backtest_id, progress=5)
            price_data = self._fetch_historical_prices(tickers, start_date, end_date)

            # Require at least 2 tickers to have data for meaningful backtest
            if not price_data:
                error_msg = (
                    f"Failed to fetch price data for any ticker in the random selection. "
                    f"Attempted tickers: {', '.join(tickers)}. "
                    f"Date range: {start_date.date()} to {end_date.date()}. "
                    f"This may be due to: (1) Data source temporarily unavailable, (2) Selected date range too old, "
                    f"or (3) Network issues. Please try again or select a different date range (2010-2024 recommended)."
                )
                raise ValueError(error_msg)

            if len(price_data) < 2:
                logger.warning(
                    f"Only {len(price_data)} ticker(s) had valid data. "
                    f"Backtests work better with 2+ tickers, but continuing anyway."
                )

            # Log which tickers succeeded/failed
            successful_tickers = list(price_data.keys())
            failed_tickers = [t.upper() for t in tickers if t.upper() not in successful_tickers]

            if failed_tickers:
                logger.warning(
                    f"Backtest {backtest_id}: Could not fetch data for {len(failed_tickers)} ticker(s): "
                    f"{', '.join(failed_tickers)}. Continuing with {len(successful_tickers)} ticker(s): "
                    f"{', '.join(successful_tickers)}"
                )

            self._update_status(backtest_id, progress=20)

            # Step 2: Generate random trades (20-40%)
            # Only use tickers that have data
            available_tickers = list(price_data.keys())

            trades = self._generate_random_trades(
                backtest_id,
                available_tickers,
                start_date,
                end_date,
                initial_capital,
                max_positions,
                price_data,
            )

            if not trades:
                raise ValueError("Failed to generate trades")

            self._update_status(backtest_id, progress=40)

            # Step 3: Save trades to database (40-50%)
            logger.info(f"Saving {len(trades)} trades to database")
            for i, trade in enumerate(trades):
                db_trade = BacktestTrade(
                    backtest_id=backtest_id,
                    ticker=trade["ticker"],
                    action=trade["action"],
                    quantity=trade["quantity"],
                    price=trade["price"],
                    trade_date=trade["trade_date"],
                    pnl=trade.get("pnl"),
                    pnl_pct=trade.get("pnl_pct"),
                )
                db.add(db_trade)

                if i % 50 == 0:
                    db.commit()
                    self._update_status(backtest_id, progress=40 + int((i / len(trades)) * 10))

            db.commit()
            self._update_status(backtest_id, progress=50)

            # Step 4: Execute portfolio simulation (50-90%)
            self._execute_portfolio_simulation(
                backtest_id,
                trades,
                initial_capital,
                start_date,
                end_date,
                rebalance_frequency,
                price_data,
                db,
            )

            self._update_status(backtest_id, progress=90)

            # Step 5: Calculate metrics (90-100%)
            self._calculate_and_store_metrics(backtest_id, db)

            # Mark as completed
            self._update_status(backtest_id, status="completed", progress=100)
            logger.info(f"Backtest {backtest_id} completed successfully")

        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()
            logger.exception(f"Backtest {backtest_id} failed: {error_msg}")
            logger.error(f"Traceback:\n{error_trace}")
            self._update_status(backtest_id, status="failed", error_message=error_msg)

        finally:
            # Unregister from running set
            with self._lock:
                self._running_backtest_ids.discard(backtest_id)
            db.close()

    def shutdown(self, timeout: int = 5):
        """
        Shutdown the executor and cancel all running backtests.

        Args:
            timeout: Maximum seconds to wait for backtests to stop (default: 5)
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
                    backtest.updated_at = datetime.now(tz=timezone.utc)
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

        # Shutdown executor
        logger.info(f"Shutting down executor (timeout: {timeout}s)...")
        try:
            self.executor.shutdown(wait=False, cancel_futures=True)
            logger.info("Executor shutdown initiated")
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
