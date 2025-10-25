"""Backtest request and response models."""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


# Request Models
class CreateBacktestRequest(BaseModel):
    """Request to create a new backtest."""

    name: str = Field(..., description="Backtest name", min_length=1, max_length=200)
    description: str | None = Field(None, description="Backtest description")
    strategy_description: str = Field(..., description="Natural language strategy description", min_length=1)
    strategy_dsl_yaml: str | None = Field(
        None, description="YAML DSL strategy definition (auto-generated if not provided)"
    )
    ticker_list: list[str] = Field(
        default_factory=list,
        description="List of tickers to trade (optional - random tickers will be selected if empty)",
    )
    start_date: str = Field(..., description="Backtest start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="Backtest end date in YYYY-MM-DD format")
    initial_capital: float = Field(..., description="Initial capital", gt=0)
    rebalance_frequency: str = Field(..., description="Rebalancing frequency (daily, weekly, monthly)")
    position_sizing: str = Field(..., description="Position sizing strategy (equal_weight, risk_parity, kelly)")
    max_positions: int = Field(..., description="Maximum number of positions", ge=1, le=50)

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        """Validate date format."""
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as e:
            msg = "Date must be in YYYY-MM-DD format"
            raise ValueError(msg) from e
        return v

    @field_validator("rebalance_frequency")
    @classmethod
    def validate_rebalance_frequency(cls, v: str) -> str:
        """Validate rebalance frequency."""
        if v not in ["daily", "weekly", "monthly"]:
            msg = "Rebalance frequency must be 'daily', 'weekly', or 'monthly'"
            raise ValueError(msg)
        return v

    @field_validator("position_sizing")
    @classmethod
    def validate_position_sizing(cls, v: str) -> str:
        """Validate position sizing strategy."""
        if v not in ["equal_weight", "risk_parity", "kelly"]:
            msg = "Position sizing must be 'equal_weight', 'risk_parity', or 'kelly'"
            raise ValueError(msg)
        return v

    @field_validator("ticker_list")
    @classmethod
    def validate_tickers(cls, v: list[str]) -> list[str]:
        """Convert tickers to uppercase. Empty list is allowed for random strategy."""
        if not v:
            return []  # Allow empty list for random strategy
        return [ticker.upper().strip() for ticker in v if ticker.strip()]


class UpdateBacktestRequest(BaseModel):
    """Request to update backtest metadata (only for pending backtests)."""

    name: str | None = Field(None, description="Backtest name", min_length=1, max_length=200)
    description: str | None = Field(None, description="Backtest description")
    strategy_description: str | None = Field(None, description="Natural language strategy description")
    strategy_dsl_yaml: str | None = Field(None, description="YAML DSL strategy definition")
    ticker_list: list[str] | None = Field(None, description="List of tickers to trade")
    start_date: str | None = Field(None, description="Backtest start date in YYYY-MM-DD format")
    end_date: str | None = Field(None, description="Backtest end date in YYYY-MM-DD format")
    initial_capital: float | None = Field(None, description="Initial capital", gt=0)
    rebalance_frequency: str | None = Field(None, description="Rebalancing frequency")
    position_sizing: str | None = Field(None, description="Position sizing strategy")
    max_positions: int | None = Field(None, description="Maximum number of positions", ge=1, le=50)


# Response Models
class BacktestTradeResponse(BaseModel):
    """Trade details with calculated P&L."""

    id: int = Field(..., description="Trade ID")
    backtest_id: int = Field(..., description="Backtest ID")
    ticker: str = Field(..., description="Ticker symbol")
    action: str = Field(..., description="Trade action (BUY/SELL)")
    quantity: float = Field(..., description="Number of shares/units")
    price: float = Field(..., description="Execution price")
    trade_date: datetime = Field(..., description="Trade execution date")
    analysis_id: str | None = Field(None, description="Linked analysis ID")
    decision_confidence: float | None = Field(None, description="AI decision confidence")
    decision_rationale: str | None = Field(None, description="Trade rationale")
    pnl: float | None = Field(None, description="Profit/Loss (for closed positions)")
    pnl_pct: float | None = Field(None, description="P&L percentage")
    created_at: datetime = Field(..., description="Creation timestamp")


class BacktestSnapshotResponse(BaseModel):
    """Portfolio snapshot at a point in time."""

    id: int = Field(..., description="Snapshot ID")
    backtest_id: int = Field(..., description="Backtest ID")
    snapshot_date: datetime = Field(..., description="Snapshot date")
    cash: float = Field(..., description="Cash available")
    positions_value: float = Field(..., description="Total value of positions")
    total_value: float = Field(..., description="Total portfolio value")
    cumulative_return: float = Field(..., description="Cumulative return (absolute)")
    cumulative_return_pct: float = Field(..., description="Cumulative return (%)")
    drawdown: float = Field(..., description="Drawdown (absolute)")
    drawdown_pct: float = Field(..., description="Drawdown (%)")
    positions: dict = Field(..., description="Holdings at this point")


class BacktestPerformanceMetrics(BaseModel):
    """Comprehensive backtest performance metrics."""

    total_return: float | None = Field(None, description="Total return (absolute)")
    total_return_pct: float | None = Field(None, description="Total return (%)")
    sharpe_ratio: float | None = Field(None, description="Sharpe ratio")
    max_drawdown: float | None = Field(None, description="Maximum drawdown (absolute)")
    max_drawdown_pct: float | None = Field(None, description="Maximum drawdown (%)")
    win_rate: float | None = Field(None, description="Win rate (%)")
    total_trades: int | None = Field(None, description="Total number of trades")
    avg_trade_duration_days: float | None = Field(None, description="Average trade duration (days)")
    profit_factor: float | None = Field(None, description="Profit factor (gross profit / gross loss)")
    avg_win: float | None = Field(None, description="Average winning trade")
    avg_loss: float | None = Field(None, description="Average losing trade")
    win_count: int | None = Field(None, description="Number of winning trades")
    loss_count: int | None = Field(None, description="Number of losing trades")


class BacktestSummary(BaseModel):
    """Lightweight backtest summary for list views."""

    id: int = Field(..., description="Backtest ID")
    name: str = Field(..., description="Backtest name")
    description: str | None = Field(None, description="Backtest description")
    ticker_list: list[str] = Field(..., description="List of tickers")
    start_date: datetime = Field(..., description="Backtest start date")
    end_date: datetime = Field(..., description="Backtest end date")
    initial_capital: float = Field(..., description="Initial capital")
    status: str = Field(..., description="Backtest status")
    progress_percentage: int = Field(..., description="Progress percentage")
    total_return_pct: float | None = Field(None, description="Total return (%)")
    sharpe_ratio: float | None = Field(None, description="Sharpe ratio")
    max_drawdown_pct: float | None = Field(None, description="Maximum drawdown (%)")
    total_trades: int | None = Field(None, description="Total number of trades")
    created_at: datetime = Field(..., description="Creation timestamp")
    completed_at: datetime | None = Field(None, description="Completion timestamp")
    owner_username: str | None = Field(None, description="Owner username")


class BacktestResponse(BaseModel):
    """Full backtest details with embedded data."""

    id: int = Field(..., description="Backtest ID")
    name: str = Field(..., description="Backtest name")
    description: str | None = Field(None, description="Backtest description")
    strategy_description: str = Field(..., description="Natural language strategy description")
    strategy_dsl_yaml: str = Field(..., description="YAML DSL strategy definition")
    ticker_list: list[str] = Field(..., description="List of tickers")
    start_date: datetime = Field(..., description="Backtest start date")
    end_date: datetime = Field(..., description="Backtest end date")
    initial_capital: float = Field(..., description="Initial capital")
    rebalance_frequency: str = Field(..., description="Rebalancing frequency")
    position_sizing: str = Field(..., description="Position sizing strategy")
    max_positions: int = Field(..., description="Maximum number of positions")
    status: str = Field(..., description="Backtest status")
    progress_percentage: int = Field(..., description="Progress percentage")
    final_portfolio_value: float | None = Field(None, description="Final portfolio value")
    total_return: float | None = Field(None, description="Total return (absolute)")
    total_return_pct: float | None = Field(None, description="Total return (%)")
    sharpe_ratio: float | None = Field(None, description="Sharpe ratio")
    max_drawdown: float | None = Field(None, description="Maximum drawdown (absolute)")
    max_drawdown_pct: float | None = Field(None, description="Maximum drawdown (%)")
    win_rate: float | None = Field(None, description="Win rate (%)")
    total_trades: int | None = Field(None, description="Total number of trades")
    avg_trade_duration_days: float | None = Field(None, description="Average trade duration (days)")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    completed_at: datetime | None = Field(None, description="Completion timestamp")
    owner_username: str | None = Field(None, description="Owner username")


class EquityCurveDataPoint(BaseModel):
    """Single data point for equity curve visualization."""

    date: datetime = Field(..., description="Date")
    portfolio_value: float = Field(..., description="Portfolio value")
    cash: float = Field(..., description="Cash")
    positions_value: float = Field(..., description="Positions value")
    cumulative_return_pct: float = Field(..., description="Cumulative return (%)")
    drawdown_pct: float = Field(..., description="Drawdown (%)")
