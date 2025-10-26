"""Strategy Code Generator Agent.

This agent generates pure Python code for backtesting.py Strategy classes.
It does NOT chat - it only generates code based on structured requirements.
"""

from langchain_core.prompts import ChatPromptTemplate


def create_strategy_code_generator(llm):
    """
    Create a strategy code generator agent.

    Args:
        llm: The language model to use for generation

    Returns:
        A function that takes strategy requirements and returns Python code
    """

    system_prompt = """You are an expert Python code generator for algorithmic trading strategies using the backtesting.py library.

Your ONLY task is to generate clean, executable Python code for backtesting.py Strategy classes. DO NOT chat or explain - output ONLY code.

**Required Output Format:**

```python
from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA, EMA, RSI, MACD, STOCH, BBANDS

class {{StrategyName}}(Strategy):
    # Strategy parameters (can be optimized)
    param1 = 10
    param2 = 20

    def init(self):
        # Initialize indicators
        pass

    def next(self):
        # Trading logic
        pass
```

**Key Guidelines:**

1. **Imports**: Always include necessary imports from backtesting.py
   - `from backtesting import Strategy`
   - `from backtesting.lib import crossover` (for MA crossovers)
   - `from backtesting.test import SMA, EMA, RSI, MACD, STOCH, BBANDS` (import only what you use)

2. **Class Definition**: Strategy class inheriting from `Strategy`
   - Use descriptive class names (e.g., `SmaCrossover`, `RsiMeanReversion`)
   - Add class-level parameters for optimization

3. **init() Method**: Initialize indicators using `self.I()`
   - Store indicators as instance variables
   - Example: `self.sma = self.I(SMA, self.data.Close, self.n)`
   - Use `self.data.Close`, `self.data.Open`, `self.data.High`, `self.data.Low`, `self.data.Volume`

4. **next() Method**: Implement trading logic
   - **Entry**: Use `self.buy()` to open long positions
   - **Exit**: Use `self.position.close()` to close positions
   - **Stop Loss**: Use `sl=` parameter in buy(): `self.buy(sl=stop_price)`
   - **Take Profit**: Use `tp=` parameter in buy(): `self.buy(tp=target_price)`
   - **Position Sizing**: Use `size=` parameter: `self.buy(size=0.95)` for 95% of capital
   - **Conditional Logic**: Use if/elif/else for different scenarios

5. **Helper Functions** from backtesting.lib:
   - `crossover(series1, series2)` - Detects when series1 crosses above series2
   - Use this for MA crossovers, signal line crosses, etc.

6. **Position Management**:
   - Check if in position: `if self.position:`
   - Check if not in position: `if not self.position:`
   - Close position: `self.position.close()`
   - Get position size: `self.position.size`
   - Get entry price: `self.position.pl` for P&L

7. **Common Patterns**:

**SMA Crossover:**
```python
from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA

class SmaCrossover(Strategy):
    n1 = 10  # Fast SMA period
    n2 = 20  # Slow SMA period

    def init(self):
        self.sma1 = self.I(SMA, self.data.Close, self.n1)
        self.sma2 = self.I(SMA, self.data.Close, self.n2)

    def next(self):
        if crossover(self.sma1, self.sma2):
            self.buy()
        elif crossover(self.sma2, self.sma1):
            self.position.close()
```

**RSI Mean Reversion:**
```python
from backtesting import Strategy
from backtesting.test import RSI

class RsiMeanReversion(Strategy):
    rsi_period = 14
    rsi_oversold = 30
    rsi_overbought = 70
    stop_loss_pct = 0.05  # 5% stop loss

    def init(self):
        self.rsi = self.I(RSI, self.data.Close, self.rsi_period)

    def next(self):
        if not self.position:
            if self.rsi[-1] < self.rsi_oversold:
                # Calculate stop loss price
                stop_price = self.data.Close[-1] * (1 - self.stop_loss_pct)
                self.buy(sl=stop_price)
        else:
            if self.rsi[-1] > self.rsi_overbought:
                self.position.close()
```

**MACD Trend Following:**
```python
from backtesting import Strategy
from backtesting.lib import crossover

def MACD(close, n_fast=12, n_slow=26, n_signal=9):
    from backtesting.test import EMA
    ema_fast = EMA(close, n_fast)
    ema_slow = EMA(close, n_slow)
    macd_line = ema_fast - ema_slow
    signal_line = EMA(macd_line, n_signal)
    return macd_line, signal_line

class MacdStrategy(Strategy):
    def init(self):
        self.macd, self.signal = self.I(MACD, self.data.Close)

    def next(self):
        if crossover(self.macd, self.signal):
            if not self.position:
                self.buy()
        elif crossover(self.signal, self.macd):
            if self.position:
                self.position.close()
```

**Bollinger Bands Breakout:**
```python
from backtesting import Strategy
from backtesting.test import BBANDS

class BollingerBreakout(Strategy):
    bb_period = 20
    bb_std = 2

    def init(self):
        self.bb_upper, self.bb_middle, self.bb_lower = self.I(
            BBANDS, self.data.Close, self.bb_period, self.bb_std
        )

    def next(self):
        if not self.position:
            # Buy on lower band touch (oversold)
            if self.data.Close[-1] <= self.bb_lower[-1]:
                self.buy()
        else:
            # Sell on upper band touch (overbought)
            if self.data.Close[-1] >= self.bb_upper[-1]:
                self.position.close()
```

**Multi-Indicator Strategy:**
```python
from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA, RSI

class MultiIndicatorStrategy(Strategy):
    sma_period = 20
    rsi_period = 14
    rsi_oversold = 35
    rsi_overbought = 65

    def init(self):
        self.sma = self.I(SMA, self.data.Close, self.sma_period)
        self.rsi = self.I(RSI, self.data.Close, self.rsi_period)

    def next(self):
        price = self.data.Close[-1]

        if not self.position:
            # Buy if: price above SMA AND RSI oversold
            if price > self.sma[-1] and self.rsi[-1] < self.rsi_oversold:
                self.buy()
        else:
            # Sell if: RSI overbought
            if self.rsi[-1] > self.rsi_overbought:
                self.position.close()
```

**Risk Management with Trailing Stop:**
```python
from backtesting import Strategy
from backtesting.test import SMA

class TrendFollowingWithTrailingStop(Strategy):
    sma_period = 50
    risk_pct = 0.02  # 2% risk per trade
    trailing_stop_pct = 0.10  # 10% trailing stop

    def init(self):
        self.sma = self.I(SMA, self.data.Close, self.sma_period)
        self.highest_price = 0

    def next(self):
        price = self.data.Close[-1]

        if not self.position:
            # Buy when price crosses above SMA
            if price > self.sma[-1]:
                # Position size based on risk
                stop_price = price * (1 - self.risk_pct)
                self.buy(sl=stop_price, size=0.95)  # Use 95% of capital
                self.highest_price = price
        else:
            # Update trailing stop
            if price > self.highest_price:
                self.highest_price = price

            trailing_stop = self.highest_price * (1 - self.trailing_stop_pct)

            # Exit if price falls below trailing stop
            if price < trailing_stop:
                self.position.close()
```

**CRITICAL RULES:**

1. **Output ONLY Python code** - no markdown fences, no explanations
2. **Start directly with imports** - first line must be `from backtesting import Strategy`
3. **Use exact backtesting.py API** - don't invent methods
4. **Include proper indentation** - use 4 spaces
5. **Add brief comments** - explain key logic points
6. **Make parameters configurable** - use class variables
7. **Handle edge cases** - check `if self.position` before closing
8. **Use proper array indexing** - `[-1]` for current bar, `[-2]` for previous
9. **Keep it simple** - one clear strategy per class
10. **Test common scenarios** - ensure buy/sell logic is sound

**What NOT to do:**

- ❌ Don't use `print()` statements
- ❌ Don't use `pd.DataFrame` operations (use backtesting.py API)
- ❌ Don't create multiple strategy classes in one output
- ❌ Don't add example usage code (bt = Backtest(...))
- ❌ Don't use complex custom indicators without defining them
- ❌ Don't forget to check `if self.position` before closing

Now generate the requested strategy code based on the requirements provided.
"""

    class StrategyCodeGenerator:
        """Strategy code generator with streaming support."""

        def __init__(self, llm):
            self.llm = llm

        def _build_prompt(
            self,
            strategy_description: str,
            ticker: str,
            indicators: list[str],
            entry_conditions: dict,
            exit_conditions: dict,
            risk_params: dict,
        ) -> str:
            """Build the user prompt with strategy requirements."""

            prompt_parts = [
                f"Generate a backtesting.py Strategy class for {ticker}.",
                f"\n**Strategy Description:** {strategy_description}",
            ]

            if indicators:
                prompt_parts.append(f"\n**Indicators:** {', '.join(indicators)}")

            if entry_conditions:
                prompt_parts.append("\n**Entry Conditions:**")
                for key, value in entry_conditions.items():
                    prompt_parts.append(f"  - {key}: {value}")

            if exit_conditions:
                prompt_parts.append("\n**Exit Conditions:**")
                for key, value in exit_conditions.items():
                    prompt_parts.append(f"  - {key}: {value}")

            if risk_params:
                prompt_parts.append("\n**Risk Management:**")
                for key, value in risk_params.items():
                    prompt_parts.append(f"  - {key}: {value}")

            prompt_parts.append("\n\nGenerate ONLY the Python code. No explanations, no markdown fences.")

            return "\n".join(prompt_parts)

        def _clean_code_output(self, code_output: str) -> str:
            """Clean the generated code output."""
            # Remove markdown code fences if present
            code_output = code_output.strip()

            if code_output.startswith("```python"):
                code_output = code_output[len("```python") :]
            elif code_output.startswith("```"):
                code_output = code_output[len("```") :]

            if code_output.endswith("```"):
                code_output = code_output[: -len("```")]

            return code_output.strip()

        def __call__(
            self,
            strategy_description: str,
            ticker: str = "AAPL",
            indicators: list[str] | None = None,
            entry_conditions: dict | None = None,
            exit_conditions: dict | None = None,
            risk_params: dict | None = None,
        ) -> str:
            """
            Generate Python code from strategy requirements.

            Args:
                strategy_description: Natural language description of the strategy
                ticker: Ticker symbol (for context)
                indicators: List of indicators to use (e.g., ["RSI", "SMA", "MACD"])
                entry_conditions: Entry rules (e.g., {"RSI": "< 30", "SMA": "crossover"})
                exit_conditions: Exit rules (e.g., {"RSI": "> 70", "stop_loss": "5%"})
                risk_params: Risk management (e.g., {"position_size": "95%", "stop_loss": "2%"})

            Returns:
                Python code string
            """
            indicators = indicators or []
            entry_conditions = entry_conditions or {}
            exit_conditions = exit_conditions or {}
            risk_params = risk_params or {}

            user_prompt = self._build_prompt(
                strategy_description, ticker, indicators, entry_conditions, exit_conditions, risk_params
            )

            prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", user_prompt)])

            chain = prompt | self.llm
            result = chain.invoke({})

            # Extract content
            if hasattr(result, "content"):
                code_output = result.content
            else:
                code_output = str(result)

            return self._clean_code_output(code_output)

        def stream(
            self,
            strategy_description: str,
            ticker: str = "AAPL",
            indicators: list[str] | None = None,
            entry_conditions: dict | None = None,
            exit_conditions: dict | None = None,
            risk_params: dict | None = None,
        ):
            """
            Stream Python code generation in real-time.

            Args:
                Same as __call__

            Yields:
                String chunks as they're generated by the LLM
            """
            indicators = indicators or []
            entry_conditions = entry_conditions or {}
            exit_conditions = exit_conditions or {}
            risk_params = risk_params or {}

            user_prompt = self._build_prompt(
                strategy_description, ticker, indicators, entry_conditions, exit_conditions, risk_params
            )

            prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", user_prompt)])

            chain = prompt | self.llm

            # Track if we need to strip markdown fences
            accumulated = ""

            # Stream chunks from the LLM
            for chunk in chain.stream({}):
                if hasattr(chunk, "content"):
                    content = chunk.content
                else:
                    content = str(chunk)

                if content:
                    accumulated += content
                    # Clean and yield
                    # For streaming, we'll yield raw content and clean at the end
                    yield content

    return StrategyCodeGenerator(llm)


def validate_strategy_code(code_string: str) -> tuple[bool, str]:
    """
    Validate that the generated code is syntactically correct and safe.

    Args:
        code_string: The Python code to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Check for required imports
        if "from backtesting import Strategy" not in code_string:
            return False, "Missing required import: from backtesting import Strategy"

        # Check for Strategy class
        if "class " not in code_string or "(Strategy)" not in code_string:
            return False, "Missing Strategy class definition"

        # Check for init method
        if "def init(self):" not in code_string:
            return False, "Missing init() method"

        # Check for next method
        if "def next(self):" not in code_string:
            return False, "Missing next() method"

        # Try to compile the code (syntax check)
        compile(code_string, "<string>", "exec")

        return True, "Valid"

    except SyntaxError as e:
        return False, f"Syntax error: {e!s}"
    except Exception as e:
        return False, f"Validation error: {e!s}"
