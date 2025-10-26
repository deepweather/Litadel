"""Backtest execution engine using backtesting.py library."""

import time
from typing import Any

import pandas as pd
from backtesting import Backtest

from cli.asset_detection import detect_asset_class

from .data import fetch_ohlcv_data
from .types import BacktestConfig, BacktestResult, EquityPoint, TradeRecord


class BacktestEngine:
    """Standalone backtest execution engine."""

    def __init__(self):
        """Initialize the backtest engine."""

    def execute(self, config: BacktestConfig) -> BacktestResult:
        """
        Execute a backtest with the given configuration.

        Args:
            config: Backtest configuration

        Returns:
            BacktestResult with all metrics, trades, and equity curve

        Raises:
            ValueError: If config is invalid or execution fails
        """
        start_time = time.time()

        # Auto-detect asset class if not specified
        asset_class = config.asset_class
        if asset_class is None:
            asset_class = detect_asset_class(config.symbol)

        # Fetch OHLCV data (uses cache if available)
        df, data_source = fetch_ohlcv_data(config.symbol, config.start_date, config.end_date, asset_class)

        # Compile and validate strategy code
        strategy_class = self._compile_strategy(config.strategy_class_code)

        # Run backtest
        bt = Backtest(
            df,
            strategy_class,
            cash=config.initial_capital,
            commission=config.commission,
            exclusive_orders=True,
        )

        stats = bt.run()

        # Extract strategy name
        strategy_name = strategy_class.__name__

        # Convert trades
        trades = self._extract_trades(stats)

        # Convert equity curve
        equity_curve = self._extract_equity_curve(stats)

        # Calculate execution time
        execution_time = time.time() - start_time

        # Build result
        result = BacktestResult(
            symbol=config.symbol,
            strategy_name=strategy_name,
            initial_capital=config.initial_capital,
            final_value=float(stats["Equity Final [$]"]),
            total_return_pct=float(stats["Return [%]"]),
            buy_hold_return_pct=float(stats["Buy & Hold Return [%]"]),
            sharpe_ratio=float(stats["Sharpe Ratio"]) if not pd.isna(stats["Sharpe Ratio"]) else None,
            max_drawdown_pct=float(stats["Max. Drawdown [%]"]),
            num_trades=int(stats["# Trades"]),
            win_rate=float(stats["Win Rate [%]"]) if not pd.isna(stats["Win Rate [%]"]) else None,
            avg_trade_duration=str(stats["Avg. Trade Duration"]) if not pd.isna(stats["Avg. Trade Duration"]) else None,
            exposure_time_pct=float(stats["Exposure Time [%]"]),
            profit_factor=float(stats["Profit Factor"]) if not pd.isna(stats["Profit Factor"]) else None,
            sortino_ratio=float(stats["Sortino Ratio"]) if not pd.isna(stats["Sortino Ratio"]) else None,
            calmar_ratio=float(stats["Calmar Ratio"]) if not pd.isna(stats["Calmar Ratio"]) else None,
            trades=trades,
            equity_curve=equity_curve,
            execution_time_seconds=execution_time,
            data_source=data_source,
        )

        return result

    def _compile_strategy(self, strategy_code: str) -> type:
        """
        Compile strategy code and extract Strategy class.

        Args:
            strategy_code: Python code defining a Strategy class

        Returns:
            Strategy class

        Raises:
            ValueError: If code cannot be compiled or Strategy class not found
        """
        # Create a namespace for execution
        namespace: dict[str, Any] = {}

        # Import necessary modules into namespace
        namespace["Strategy"] = __import__("backtesting").Strategy
        namespace["pd"] = pd

        # Try to compile and execute the code
        try:
            exec(strategy_code, namespace)
        except Exception as e:
            raise ValueError(f"Failed to compile strategy code: {e}") from e

        # Find Strategy subclass in namespace
        strategy_class = None
        for name, obj in namespace.items():
            if isinstance(obj, type) and issubclass(obj, namespace["Strategy"]) and obj is not namespace["Strategy"]:
                strategy_class = obj
                break

        if strategy_class is None:
            raise ValueError("No Strategy subclass found in provided code")

        return strategy_class

    def _extract_trades(self, stats) -> list[TradeRecord]:
        """Extract trade records from backtesting.py stats."""
        trades = []

        if hasattr(stats, "_trades") and not stats._trades.empty:
            trades_df = stats._trades.copy()

            # Convert datetime columns to strings
            for col in trades_df.columns:
                if trades_df[col].dtype == "datetime64[ns]":
                    trades_df[col] = trades_df[col].astype(str)
                elif pd.api.types.is_numeric_dtype(trades_df[col]):
                    trades_df[col] = trades_df[col].astype(float)

            # Convert to records
            for _, row in trades_df.iterrows():
                trade = TradeRecord(
                    size=float(row.get("Size", 0)),
                    entry_price=float(row.get("EntryPrice", 0)),
                    exit_price=float(row.get("ExitPrice", 0)),
                    entry_time=str(row.get("EntryTime", "")),
                    exit_time=str(row.get("ExitTime", "")),
                    pnl=float(row.get("PnL", 0)),
                    return_pct=float(row.get("ReturnPct", 0)),
                    duration=str(row.get("Duration", "")),
                    entry_bar=int(row.get("EntryBar")) if not pd.isna(row.get("EntryBar")) else None,
                    exit_bar=int(row.get("ExitBar")) if not pd.isna(row.get("ExitBar")) else None,
                    stop_loss=float(row.get("SL")) if not pd.isna(row.get("SL")) else None,
                    take_profit=float(row.get("TP")) if not pd.isna(row.get("TP")) else None,
                    commission=float(row.get("Commission")) if not pd.isna(row.get("Commission")) else None,
                )
                trades.append(trade)

        return trades

    def _extract_equity_curve(self, stats) -> list[EquityPoint]:
        """Extract equity curve from backtesting.py stats."""
        equity_curve = []

        if hasattr(stats, "_equity_curve") and stats._equity_curve is not None:
            equity_df = stats._equity_curve.copy()
            equity_df = equity_df.reset_index()

            # Find date column
            date_col = None
            for col in ["Date", "date", "index"]:
                if col in equity_df.columns:
                    date_col = col
                    break

            if date_col is None:
                date_col = equity_df.columns[0]

            # Convert to records
            for _, row in equity_df.iterrows():
                point = EquityPoint(
                    date=str(row[date_col]),
                    equity=float(row.get("Equity", 0)),
                    drawdown_pct=float(row.get("DrawdownPct", 0)),
                )
                equity_curve.append(point)

        return equity_curve
