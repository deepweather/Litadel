"""Type definitions for backtest execution engine."""

from dataclasses import dataclass


@dataclass
class TradeRecord:
    """Record of a single trade execution."""

    size: float
    entry_price: float
    exit_price: float
    entry_time: str
    exit_time: str
    pnl: float
    return_pct: float
    duration: str
    # Optional fields from backtesting.py
    entry_bar: int | None = None
    exit_bar: int | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    commission: float | None = None


@dataclass
class EquityPoint:
    """Single point in equity curve."""

    date: str
    equity: float
    drawdown_pct: float


@dataclass
class BacktestConfig:
    """Configuration for backtest execution."""

    symbol: str
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    strategy_class_code: str  # Python code defining Strategy class
    initial_capital: float = 10000.0
    commission: float = 0.002  # 0.2%
    asset_class: str | None = None  # Auto-detected if None


@dataclass
class BacktestResult:
    """Complete backtest execution results."""

    # Identification
    symbol: str
    strategy_name: str

    # Capital
    initial_capital: float
    final_value: float

    # Returns
    total_return_pct: float
    buy_hold_return_pct: float

    # Risk metrics
    sharpe_ratio: float | None
    max_drawdown_pct: float

    # Trading metrics
    num_trades: int
    win_rate: float | None
    avg_trade_duration: str | None
    exposure_time_pct: float

    # Additional metrics
    profit_factor: float | None = None
    sortino_ratio: float | None = None
    calmar_ratio: float | None = None

    # Detailed data
    trades: list[TradeRecord] = None
    equity_curve: list[EquityPoint] = None

    # Metadata
    execution_time_seconds: float = 0.0
    data_source: str = "unknown"  # "cache" or "live"

    def __post_init__(self):
        """Initialize mutable defaults."""
        if self.trades is None:
            self.trades = []
        if self.equity_curve is None:
            self.equity_curve = []
