"""Backtest performance metrics calculation."""

import math


def calculate_total_return(snapshots: list) -> tuple[float | None, float | None]:
    """
    Calculate total return from backtest snapshots.

    Args:
        snapshots: List of BacktestSnapshot objects

    Returns:
        Tuple of (absolute_return, percentage_return)
    """
    if not snapshots or len(snapshots) < 2:
        return None, None

    # Sort by date to ensure proper ordering
    sorted_snapshots = sorted(snapshots, key=lambda s: s.snapshot_date)

    initial_value = sorted_snapshots[0].total_value
    final_value = sorted_snapshots[-1].total_value

    if initial_value == 0:
        return None, None

    absolute_return = final_value - initial_value
    percentage_return = (absolute_return / initial_value) * 100

    return absolute_return, percentage_return


def calculate_sharpe_ratio(snapshots: list, risk_free_rate: float = 0.02) -> float | None:
    """
    Calculate annualized Sharpe ratio from snapshots.

    Args:
        snapshots: List of BacktestSnapshot objects
        risk_free_rate: Annual risk-free rate (default 2%)

    Returns:
        Sharpe ratio or None if insufficient data
    """
    if not snapshots or len(snapshots) < 2:
        return None

    # Calculate returns series
    returns = _calculate_returns_series(snapshots)

    if not returns or len(returns) < 2:
        return None

    # Calculate average and standard deviation of returns
    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
    std_dev = math.sqrt(variance)

    if std_dev == 0:
        return None

    # Annualize the Sharpe ratio
    # Assuming daily snapshots for now, adjust based on actual frequency
    days_per_year = 252  # Trading days
    annualized_return = mean_return * days_per_year
    annualized_std = std_dev * math.sqrt(days_per_year)

    sharpe = (annualized_return - risk_free_rate) / annualized_std

    return sharpe


def calculate_max_drawdown(snapshots: list) -> tuple[float | None, float | None]:
    """
    Calculate maximum drawdown from snapshots.

    Args:
        snapshots: List of BacktestSnapshot objects

    Returns:
        Tuple of (max_drawdown_absolute, max_drawdown_percentage)
    """
    if not snapshots or len(snapshots) < 2:
        return None, None

    # Sort by date
    sorted_snapshots = sorted(snapshots, key=lambda s: s.snapshot_date)

    max_value = sorted_snapshots[0].total_value
    max_drawdown_abs = 0.0
    max_drawdown_pct = 0.0

    for snapshot in sorted_snapshots:
        current_value = snapshot.total_value

        # Update peak
        max_value = max(current_value, max_value)

        # Calculate drawdown from peak
        if max_value > 0:
            drawdown_abs = max_value - current_value
            drawdown_pct = (drawdown_abs / max_value) * 100

            # Update max drawdown
            if drawdown_abs > max_drawdown_abs:
                max_drawdown_abs = drawdown_abs
                max_drawdown_pct = drawdown_pct

    return max_drawdown_abs, max_drawdown_pct


def calculate_win_rate(trades: list) -> float | None:
    """
    Calculate win rate from closed trades.

    Args:
        trades: List of BacktestTrade objects

    Returns:
        Win rate as percentage or None if no closed trades
    """
    if not trades:
        return None

    # Filter trades with P&L (closed trades)
    closed_trades = [t for t in trades if t.pnl is not None]

    if not closed_trades:
        return None

    winning_trades = sum(1 for t in closed_trades if t.pnl > 0)
    total_trades = len(closed_trades)

    if total_trades == 0:
        return None

    win_rate = (winning_trades / total_trades) * 100

    return win_rate


def calculate_avg_trade_duration(trades: list) -> float | None:
    """
    Calculate average trade duration in days.

    Args:
        trades: List of BacktestTrade objects

    Returns:
        Average duration in days or None if insufficient data
    """
    if not trades or len(trades) < 2:
        return None

    # Match buy and sell trades to calculate durations
    trade_pairs = _identify_trade_pairs(trades)

    if not trade_pairs:
        return None

    durations = []
    for buy_trade, sell_trade in trade_pairs:
        duration = (sell_trade.trade_date - buy_trade.trade_date).days
        durations.append(duration)

    if not durations:
        return None

    avg_duration = sum(durations) / len(durations)

    return avg_duration


def calculate_profit_factor(trades: list) -> float | None:
    """
    Calculate profit factor (gross profit / gross loss).

    Args:
        trades: List of BacktestTrade objects

    Returns:
        Profit factor or None if no losing trades
    """
    if not trades:
        return None

    # Filter trades with P&L
    closed_trades = [t for t in trades if t.pnl is not None]

    if not closed_trades:
        return None

    gross_profit = sum(t.pnl for t in closed_trades if t.pnl > 0)
    gross_loss = abs(sum(t.pnl for t in closed_trades if t.pnl < 0))

    if gross_loss == 0:
        return None  # Avoid division by zero

    profit_factor = gross_profit / gross_loss

    return profit_factor


def calculate_trade_statistics(trades: list) -> dict:
    """
    Calculate comprehensive trade statistics.

    Args:
        trades: List of BacktestTrade objects

    Returns:
        Dictionary with avg_win, avg_loss, win_count, loss_count
    """
    if not trades:
        return {
            "avg_win": None,
            "avg_loss": None,
            "win_count": 0,
            "loss_count": 0,
        }

    # Filter trades with P&L
    closed_trades = [t for t in trades if t.pnl is not None]

    if not closed_trades:
        return {
            "avg_win": None,
            "avg_loss": None,
            "win_count": 0,
            "loss_count": 0,
        }

    winning_trades = [t.pnl for t in closed_trades if t.pnl > 0]
    losing_trades = [t.pnl for t in closed_trades if t.pnl < 0]

    avg_win = sum(winning_trades) / len(winning_trades) if winning_trades else None
    avg_loss = sum(losing_trades) / len(losing_trades) if losing_trades else None

    return {
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "win_count": len(winning_trades),
        "loss_count": len(losing_trades),
    }


# Helper Functions


def _calculate_returns_series(snapshots: list) -> list[float]:
    """
    Calculate period-over-period returns from snapshots.

    Args:
        snapshots: List of BacktestSnapshot objects

    Returns:
        List of returns (as decimals, not percentages)
    """
    if not snapshots or len(snapshots) < 2:
        return []

    # Sort by date
    sorted_snapshots = sorted(snapshots, key=lambda s: s.snapshot_date)

    returns = []
    for i in range(1, len(sorted_snapshots)):
        prev_value = sorted_snapshots[i - 1].total_value
        curr_value = sorted_snapshots[i].total_value

        if prev_value == 0:
            continue

        period_return = (curr_value - prev_value) / prev_value
        returns.append(period_return)

    return returns


def _identify_trade_pairs(trades: list) -> list[tuple]:
    """
    Match buy trades with corresponding sell trades.

    Uses FIFO (First In First Out) to match trades.

    Args:
        trades: List of BacktestTrade objects

    Returns:
        List of tuples (buy_trade, sell_trade)
    """
    if not trades:
        return []

    # Sort trades by date
    sorted_trades = sorted(trades, key=lambda t: t.trade_date)

    # Group by ticker
    trades_by_ticker = {}
    for trade in sorted_trades:
        if trade.ticker not in trades_by_ticker:
            trades_by_ticker[trade.ticker] = {"buys": [], "sells": []}

        if trade.action == "BUY":
            trades_by_ticker[trade.ticker]["buys"].append(trade)
        elif trade.action == "SELL":
            trades_by_ticker[trade.ticker]["sells"].append(trade)

    # Match buys with sells using FIFO
    trade_pairs = []
    for ticker, ticker_trades in trades_by_ticker.items():
        buys = ticker_trades["buys"].copy()
        sells = ticker_trades["sells"].copy()

        while buys and sells:
            buy_trade = buys.pop(0)
            sell_trade = sells.pop(0)
            trade_pairs.append((buy_trade, sell_trade))

    return trade_pairs
