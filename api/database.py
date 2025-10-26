"""Database models and connection management."""

import os
from collections.abc import Generator
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker

# Database file location
DATABASE_URL = os.getenv("API_DATABASE_URL", "sqlite:///./api_database.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class Analysis(Base):
    """Analysis metadata and configuration."""

    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    analysis_date = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, running, completed, failed, cancelled
    config_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    progress_percentage = Column(Integer, default=0)
    current_agent = Column(String, nullable=True)

    # User ownership (nullable for backward compatibility with API keys)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Relationships
    logs = relationship("AnalysisLog", back_populates="analysis", cascade="all, delete-orphan")
    reports = relationship("AnalysisReport", back_populates="analysis", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="analyses")


class AnalysisLog(Base):
    """Log entries from analysis execution."""

    __tablename__ = "analysis_logs"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    agent_name = Column(String, nullable=False, index=True)  # NEW: Agent that generated this log
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    log_type = Column(String, nullable=False)  # Tool Call, Reasoning, System
    content = Column(Text, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="logs")


class AnalysisReport(Base):
    """Report sections from analysis."""

    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    report_type = Column(String, nullable=False)  # market_report, news_report, etc.
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="reports")


class APIKey(Base):
    """API keys for authentication."""

    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key_hash = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class User(Base):
    """User accounts for username/password authentication."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    analyses = relationship("Analysis", back_populates="owner")
    portfolios = relationship("Portfolio", back_populates="owner")
    backtests = relationship("Backtest", back_populates="owner")


class Portfolio(Base):
    """User's portfolio definition."""

    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    positions = relationship("Position", back_populates="portfolio", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="portfolios")


class Position(Base):
    """Individual position in a portfolio."""

    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False, index=True)
    ticker = Column(String, nullable=False, index=True)
    asset_class = Column(String, nullable=False)  # stock, crypto, commodity
    quantity = Column(Float, nullable=False)  # Number of shares/units
    entry_price = Column(Float, nullable=False)  # Price at entry
    entry_date = Column(DateTime, nullable=False)  # Date of entry
    exit_price = Column(Float, nullable=True)  # Price at exit (if closed)
    exit_date = Column(DateTime, nullable=True)  # Date of exit (if closed)
    status = Column(String, nullable=False, default="open")  # open, closed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="positions")


class Backtest(Base):
    """Backtest configuration and results."""

    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Strategy definition
    strategy_description = Column(Text, nullable=False)  # Natural language description
    strategy_code_python = Column(Text, nullable=False)  # Python strategy code using backtesting.py
    strategy_type = Column(String, nullable=False, default="single_ticker")  # single_ticker or portfolio
    ticker_list = Column(Text, nullable=False)  # JSON array of tickers

    # Date range
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    # Capital
    initial_capital = Column(Float, nullable=False)

    # Execution config
    rebalance_frequency = Column(String, nullable=False)  # daily, weekly, monthly
    position_sizing = Column(String, nullable=False)  # equal_weight, risk_parity, kelly
    max_positions = Column(Integer, nullable=False)

    # Status
    status = Column(String, nullable=False, default="pending")  # pending, running, completed, failed
    progress_percentage = Column(Integer, default=0)

    # Results (computed after completion)
    final_portfolio_value = Column(Float, nullable=True)
    total_return = Column(Float, nullable=True)
    total_return_pct = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    max_drawdown_pct = Column(Float, nullable=True)
    win_rate = Column(Float, nullable=True)
    total_trades = Column(Integer, nullable=True)
    avg_trade_duration_days = Column(Float, nullable=True)

    # Execution metadata (new fields for backtest engine)
    asset_class = Column(String, nullable=True)  # equity, crypto, commodity
    commission = Column(Float, nullable=True)  # Commission rate used
    data_source = Column(String, nullable=True)  # "cache" or "live"
    execution_time_seconds = Column(Float, nullable=True)  # Time taken to execute
    error_traceback = Column(Text, nullable=True)  # Full traceback if failed
    execution_id = Column(Integer, nullable=True)  # Link to execution engine record

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    trades = relationship("BacktestTrade", back_populates="backtest", cascade="all, delete-orphan")
    snapshots = relationship("BacktestSnapshot", back_populates="backtest", cascade="all, delete-orphan")
    equity_curve = relationship("BacktestEquityCurve", back_populates="backtest", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="backtests")


class BacktestTrade(Base):
    """Individual trade executed during backtest."""

    __tablename__ = "backtest_trades"

    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False, index=True)

    ticker = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)  # BUY, SELL
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    trade_date = Column(DateTime, nullable=False, index=True)

    # Trade timing (new fields for backtest engine)
    entry_time = Column(DateTime, nullable=True)
    exit_time = Column(DateTime, nullable=True)
    duration_days = Column(Float, nullable=True)

    # Link to analysis that triggered this trade
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=True)
    decision_confidence = Column(Float, nullable=True)
    decision_rationale = Column(Text, nullable=True)

    # P&L (for closed trades)
    pnl = Column(Float, nullable=True)
    pnl_pct = Column(Float, nullable=True)
    return_pct = Column(Float, nullable=True)  # Duplicate of pnl_pct for clarity

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    backtest = relationship("Backtest", back_populates="trades")


class BacktestSnapshot(Base):
    """Portfolio snapshot at each rebalancing point."""

    __tablename__ = "backtest_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False, index=True)
    snapshot_date = Column(DateTime, nullable=False, index=True)

    # Portfolio state
    cash = Column(Float, nullable=False)
    positions_value = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)

    # Performance metrics at this point
    cumulative_return = Column(Float, nullable=False)
    cumulative_return_pct = Column(Float, nullable=False)
    drawdown = Column(Float, nullable=False)
    drawdown_pct = Column(Float, nullable=False)

    # Holdings at this snapshot (JSON)
    positions = Column(Text, nullable=False)  # JSON: {ticker: {quantity, value, price}}

    # Relationships
    backtest = relationship("Backtest", back_populates="snapshots")


class BacktestEquityCurve(Base):
    """Equity curve data points for backtest visualization."""

    __tablename__ = "backtest_equity_curve"

    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    equity = Column(Float, nullable=False)
    drawdown_pct = Column(Float, nullable=False)

    # Relationships
    backtest = relationship("Backtest", back_populates="equity_curve")


def init_db():
    """Initialize database and create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
