"""
Sample strategy codes for testing backtesting.py integration.

These are reference implementations that can be used for:
1. Testing the backtesting engine
2. Providing examples to users
3. Training data for the LLM code generator
"""

# Simple SMA Crossover Strategy
SIMPLE_SMA_CROSSOVER = """from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA


class SMACrossover(Strategy):
    '''Simple Moving Average Crossover Strategy

    Buy when fast SMA crosses above slow SMA.
    Sell when fast SMA crosses below slow SMA.
    '''

    # Parameters
    n1 = 20  # Fast SMA period
    n2 = 50  # Slow SMA period

    def init(self):
        # Calculate SMAs
        close = self.data.Close
        self.sma1 = self.I(SMA, close, self.n1)
        self.sma2 = self.I(SMA, close, self.n2)

    def next(self):
        # Buy signal: fast SMA crosses above slow SMA
        if crossover(self.sma1, self.sma2):
            self.buy()

        # Sell signal: fast SMA crosses below slow SMA
        elif crossover(self.sma2, self.sma1):
            self.position.close()
"""

# RSI Mean Reversion with Stop Loss
RSI_MEAN_REVERSION = """from backtesting import Strategy
from backtesting.test import SMA
import pandas as pd
import numpy as np


def RSI(array, n):
    '''Relative Strength Index'''
    delta = pd.Series(array).diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=n).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=n).mean()
    rs = gain / loss
    return (100 - (100 / (1 + rs))).values


class RSIMeanReversion(Strategy):
    '''RSI Mean Reversion Strategy

    Buy when RSI is oversold (< 30) and price is above 50-day SMA.
    Sell when RSI is overbought (> 70) or stop loss is hit.
    '''

    # Parameters
    rsi_period = 14
    rsi_oversold = 30
    rsi_overbought = 70
    sma_period = 50
    stop_loss_pct = 0.03  # 3% stop loss
    take_profit_pct = 0.10  # 10% take profit

    def init(self):
        # Calculate indicators
        close = self.data.Close
        self.rsi = self.I(RSI, close, self.rsi_period)
        self.sma = self.I(SMA, close, self.sma_period)

    def next(self):
        # Entry: RSI oversold and price above SMA
        if not self.position:
            if self.rsi[-1] < self.rsi_oversold and self.data.Close[-1] > self.sma[-1]:
                # Buy with stop loss and take profit
                entry_price = self.data.Close[-1]
                sl = entry_price * (1 - self.stop_loss_pct)
                tp = entry_price * (1 + self.take_profit_pct)
                self.buy(sl=sl, tp=tp)

        # Exit: RSI overbought
        elif self.rsi[-1] > self.rsi_overbought:
            self.position.close()
"""

# MACD Trend Following
MACD_TREND_FOLLOWING = """from backtesting import Strategy
from backtesting.lib import crossover
import pandas as pd


def MACD(close, n_fast=12, n_slow=26, n_signal=9):
    '''MACD indicator'''
    ema_fast = pd.Series(close).ewm(span=n_fast).mean()
    ema_slow = pd.Series(close).ewm(span=n_slow).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=n_signal).mean()
    return macd_line.values, signal_line.values


class MACDTrendFollowing(Strategy):
    '''MACD Trend Following Strategy

    Buy when MACD crosses above signal line.
    Sell when MACD crosses below signal line.
    '''

    # Parameters
    fast_period = 12
    slow_period = 26
    signal_period = 9

    def init(self):
        close = self.data.Close
        macd, signal = MACD(close, self.fast_period, self.slow_period, self.signal_period)
        self.macd = self.I(lambda x: x, macd)
        self.signal = self.I(lambda x: x, signal)

    def next(self):
        # Buy signal: MACD crosses above signal
        if crossover(self.macd, self.signal):
            if not self.position:
                self.buy()

        # Sell signal: MACD crosses below signal
        elif crossover(self.signal, self.macd):
            if self.position:
                self.position.close()
"""

# Bollinger Bands Breakout
BOLLINGER_BANDS_BREAKOUT = """from backtesting import Strategy
import pandas as pd
import numpy as np


def BBANDS(close, n=20, k=2):
    '''Bollinger Bands'''
    sma = pd.Series(close).rolling(window=n).mean()
    std = pd.Series(close).rolling(window=n).std()
    upper = sma + (k * std)
    lower = sma - (k * std)
    return upper.values, sma.values, lower.values


class BollingerBandsBreakout(Strategy):
    '''Bollinger Bands Breakout Strategy

    Buy when price breaks above upper band.
    Sell when price crosses back below middle band (SMA).
    '''

    # Parameters
    bb_period = 20
    bb_std = 2
    position_size_pct = 0.2  # Use 20% of capital per trade

    def init(self):
        close = self.data.Close
        upper, middle, lower = BBANDS(close, self.bb_period, self.bb_std)
        self.bb_upper = self.I(lambda x: x, upper)
        self.bb_middle = self.I(lambda x: x, middle)
        self.bb_lower = self.I(lambda x: x, lower)

    def next(self):
        # Calculate position size
        cash = self.equity * self.position_size_pct
        size = cash / self.data.Close[-1]

        # Entry: Price breaks above upper band
        if not self.position:
            if self.data.Close[-1] > self.bb_upper[-1]:
                self.buy(size=size)

        # Exit: Price crosses back below middle band
        elif self.data.Close[-1] < self.bb_middle[-1]:
            self.position.close()
"""

# Multi-Indicator Strategy
MULTI_INDICATOR_STRATEGY = """from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA
import pandas as pd
import numpy as np


def RSI(array, n):
    '''Relative Strength Index'''
    delta = pd.Series(array).diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=n).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=n).mean()
    rs = gain / loss
    return (100 - (100 / (1 + rs))).values


def ATR(high, low, close, n=14):
    '''Average True Range'''
    tr1 = high - low
    tr2 = abs(high - pd.Series(close).shift())
    tr3 = abs(low - pd.Series(close).shift())
    tr = pd.concat([pd.Series(tr1), tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=n).mean().values


class MultiIndicatorStrategy(Strategy):
    '''Multi-Indicator Strategy combining SMA, RSI, and ATR

    Entry conditions (all must be true):
    - Price above 50-day SMA (uptrend)
    - RSI between 40-60 (not overbought/oversold)
    - ATR-based stop loss

    Exit conditions:
    - Price crosses below SMA
    - ATR-based trailing stop
    '''

    # Parameters
    sma_period = 50
    rsi_period = 14
    rsi_lower = 40
    rsi_upper = 60
    atr_period = 14
    atr_multiplier = 2.0  # Stop loss = entry - (2 * ATR)

    def init(self):
        close = self.data.Close
        high = self.data.High
        low = self.data.Low

        self.sma = self.I(SMA, close, self.sma_period)
        self.rsi = self.I(RSI, close, self.rsi_period)
        self.atr = self.I(ATR, high, low, close, self.atr_period)

    def next(self):
        # Entry conditions
        if not self.position:
            # Check all conditions
            price_above_sma = self.data.Close[-1] > self.sma[-1]
            rsi_in_range = self.rsi_lower < self.rsi[-1] < self.rsi_upper

            if price_above_sma and rsi_in_range:
                # Calculate stop loss using ATR
                entry_price = self.data.Close[-1]
                stop_loss = entry_price - (self.atr_multiplier * self.atr[-1])
                self.buy(sl=stop_loss)

        # Exit: Price crosses below SMA
        elif self.data.Close[-1] < self.sma[-1]:
            self.position.close()
"""

# Buy and Hold (Baseline)
BUY_AND_HOLD = """from backtesting import Strategy


class BuyAndHold(Strategy):
    '''Simple Buy and Hold Strategy

    Buy on first day and hold until the end.
    Useful as a baseline for comparison.
    '''

    def init(self):
        pass

    def next(self):
        # Buy on the first trading day
        if not self.position:
            self.buy()
"""

# Dictionary of all strategies
STRATEGIES = {
    "sma_crossover": SIMPLE_SMA_CROSSOVER,
    "rsi_mean_reversion": RSI_MEAN_REVERSION,
    "macd_trend_following": MACD_TREND_FOLLOWING,
    "bollinger_bands_breakout": BOLLINGER_BANDS_BREAKOUT,
    "multi_indicator": MULTI_INDICATOR_STRATEGY,
    "buy_and_hold": BUY_AND_HOLD,
}


def get_strategy(name: str) -> str:
    """Get strategy code by name.

    Args:
        name: Strategy name (sma_crossover, rsi_mean_reversion, etc.)

    Returns:
        Python code string

    Raises:
        KeyError: If strategy name not found
    """
    return STRATEGIES[name]


def list_strategies() -> list[str]:
    """List all available strategy names."""
    return list(STRATEGIES.keys())
