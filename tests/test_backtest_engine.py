"""Unit tests for backtest engine."""

import pytest

from litadel.backtest import BacktestConfig, BacktestEngine

# Sample strategy for testing
SAMPLE_STRATEGY = """
from backtesting import Strategy

class TestStrategy(Strategy):
    def init(self):
        pass

    def next(self):
        if not self.position:
            self.buy()
"""


def test_backtest_config_creation():
    """Test BacktestConfig creation."""
    config = BacktestConfig(
        symbol="AAPL",
        start_date="2023-01-01",
        end_date="2023-12-31",
        strategy_class_code=SAMPLE_STRATEGY,
        initial_capital=10000.0,
        commission=0.002,
    )

    assert config.symbol == "AAPL"
    assert config.start_date == "2023-01-01"
    assert config.end_date == "2023-12-31"
    assert config.initial_capital == 10000.0
    assert config.commission == 0.002


def test_backtest_engine_strategy_compilation():
    """Test strategy code compilation."""
    engine = BacktestEngine()
    strategy_class = engine._compile_strategy(SAMPLE_STRATEGY)

    assert strategy_class is not None
    assert strategy_class.__name__ == "TestStrategy"
    assert hasattr(strategy_class, "init")
    assert hasattr(strategy_class, "next")


def test_backtest_engine_invalid_strategy():
    """Test that invalid strategy code raises error."""
    engine = BacktestEngine()

    invalid_code = "this is not valid python code @#$%"

    with pytest.raises(ValueError):
        engine._compile_strategy(invalid_code)


def test_backtest_engine_no_strategy_class():
    """Test that code without Strategy class raises error."""
    engine = BacktestEngine()

    code_without_strategy = """
def some_function():
    return 42
"""

    with pytest.raises(ValueError, match="No Strategy subclass found"):
        engine._compile_strategy(code_without_strategy)


@pytest.mark.integration
def test_backtest_execution_aapl():
    """Integration test: Execute backtest on AAPL data."""
    config = BacktestConfig(
        symbol="AAPL",
        start_date="2023-01-01",
        end_date="2023-03-31",
        strategy_class_code=SAMPLE_STRATEGY,
        initial_capital=10000.0,
        commission=0.002,
    )

    engine = BacktestEngine()
    result = engine.execute(config)

    # Verify result structure
    assert result.symbol == "AAPL"
    assert result.strategy_name == "TestStrategy"
    assert result.initial_capital == 10000.0
    assert result.final_value > 0
    assert result.execution_time_seconds >= 0
    assert result.data_source in ["cache", "live"]

    # Verify metrics exist
    assert isinstance(result.total_return_pct, float)
    assert isinstance(result.max_drawdown_pct, float)
    assert isinstance(result.num_trades, int)

    # Verify collections
    assert isinstance(result.trades, list)
    assert isinstance(result.equity_curve, list)


@pytest.mark.integration
def test_backtest_execution_with_trades():
    """Integration test: Verify trades are recorded."""
    # Strategy that makes trades
    strategy_with_trades = """
from backtesting import Strategy

class TradingStrategy(Strategy):
    def init(self):
        self.trade_count = 0

    def next(self):
        # Simple strategy: alternate between buy and sell
        if len(self.data) < 20:
            return

        if not self.position and self.trade_count < 3:
            self.buy()
            self.trade_count += 1
        elif self.position:
            self.position.close()
"""

    config = BacktestConfig(
        symbol="AAPL",
        start_date="2023-01-01",
        end_date="2023-06-30",
        strategy_class_code=strategy_with_trades,
        initial_capital=10000.0,
        commission=0.002,
    )

    engine = BacktestEngine()
    result = engine.execute(config)

    # Verify trades were executed
    assert result.num_trades > 0
    assert len(result.trades) > 0

    # Verify trade structure
    first_trade = result.trades[0]
    assert hasattr(first_trade, "entry_price")
    assert hasattr(first_trade, "exit_price")
    assert hasattr(first_trade, "pnl")
    assert hasattr(first_trade, "return_pct")


@pytest.mark.integration
def test_backtest_equity_curve():
    """Integration test: Verify equity curve is generated."""
    config = BacktestConfig(
        symbol="AAPL",
        start_date="2023-01-01",
        end_date="2023-03-31",
        strategy_class_code=SAMPLE_STRATEGY,
        initial_capital=10000.0,
        commission=0.002,
    )

    engine = BacktestEngine()
    result = engine.execute(config)

    # Verify equity curve exists and has data
    assert len(result.equity_curve) > 0

    # Verify equity curve structure
    first_point = result.equity_curve[0]
    assert hasattr(first_point, "date")
    assert hasattr(first_point, "equity")
    assert hasattr(first_point, "drawdown_pct")

    # Verify equity values
    assert first_point.equity > 0
    assert isinstance(first_point.drawdown_pct, float)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
