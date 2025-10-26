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

    system_prompt = """You are an expert Python code generator for algorithmic trading strategies
using the backtesting.py library.

Your ONLY task is to generate clean, executable Python code for backtesting.py Strategy classes.
DO NOT chat or explain - output ONLY code.

**Required Output Format:**

```python
from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA

class {{StrategyName}}(Strategy):
    # Strategy parameters (can be optimized)
    param1 = 10
    param2 = 20

    def init(self):
        # Initialize indicators
        self.sma = self.I(SMA, self.data.Close, self.param1)

    def next(self):
        # Trading logic
        if not self.position:
            self.buy()
```

**Key Guidelines:**

1. **Imports**: ALWAYS include these imports at the start:
   ```python
   from backtesting import Strategy
   from backtesting.lib import crossover
   from backtesting.test import SMA
   ```
   - `from backtesting import Strategy` - REQUIRED
   - `from backtesting.lib import crossover` - REQUIRED (always include for MA strategies)
   - `from backtesting.test import SMA` - ONLY SMA is available in backtesting.test
   - DO NOT import EMA, RSI, MACD, BBANDS from backtesting.test - they don't exist there!
   - If you need other indicators, define them yourself or just use SMA

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

**SMA Crossover (ALWAYS use this pattern for MA strategies):**
```python
from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA

class SmaCrossover(Strategy):
    n1 = 10  # Fast SMA period
    n2 = 20  # Slow SMA period

    def init(self):
        close = self.data.Close
        self.sma1 = self.I(SMA, close, self.n1)
        self.sma2 = self.I(SMA, close, self.n2)

    def next(self):
        if crossover(self.sma1, self.sma2):
            if not self.position:
                self.buy()
        elif crossover(self.sma2, self.sma1):
            if self.position:
                self.position.close()
```

**RSI Mean Reversion (custom RSI since not in backtesting.test):**
```python
from backtesting import Strategy
import pandas as pd

def RSI(array, period=14):
    \"\"\"Calculate RSI indicator.\"\"\"
    series = pd.Series(array)
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return (100 - (100 / (1 + rs))).values

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

**Price Change / Momentum Strategy (CORRECT WAY):**
```python
from backtesting import Strategy

class PriceChangeStrategy(Strategy):
    lookback_period = 5
    threshold = 0.02  # 2% change threshold

    def init(self):
        # DON'T calculate in init - data arrays don't support pandas methods
        pass

    def next(self):
        # Skip first few bars to avoid index errors
        if len(self.data) < self.lookback_period + 1:
            return

        # Calculate price change manually using array indexing
        current_price = self.data.Close[-1]
        past_price = self.data.Close[-self.lookback_period]

        # Calculate percentage change
        price_change_pct = (current_price - past_price) / past_price

        if not self.position:
            # Buy if price dropped significantly (contrarian)
            if price_change_pct <= -self.threshold:
                self.buy()
        else:
            # Sell if price increased significantly
            if price_change_pct >= self.threshold:
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

1. **ALWAYS start with these imports** (even if not all used):
   ```python
   from backtesting import Strategy
   from backtesting.lib import crossover
   from backtesting.test import SMA
   ```
2. **Output ONLY Python code** - no markdown fences, no explanations
3. **First line must be** - `from backtesting import Strategy`
4. **Second line must be** - `from backtesting.lib import crossover`
5. **Use exact backtesting.py API** - don't invent methods
6. **Include proper indentation** - use 4 spaces
7. **Add brief comments** - explain key logic points
8. **Make parameters configurable** - use class variables
9. **Handle edge cases** - check `if self.position` before closing
10. **Use proper array indexing** - `[-1]` for current bar, `[-2]` for previous
11. **Keep it simple** - one clear strategy per class

**CRITICAL: Data Access in backtesting.py**

The data arrays (`self.data.Close`, `self.data.Open`, etc.) are NOT pandas Series - they are special arrays.

**DO NOT use pandas methods:**
- ❌ `self.data.Close.diff()` - WRONG! No .diff() method
- ❌ `self.data.Close.shift()` - WRONG! No .shift() method
- ❌ `self.data.Close.pct_change()` - WRONG! No .pct_change() method
- ❌ `self.data.Close.rolling()` - WRONG! No .rolling() method

**DO use array indexing:**
- ✅ `self.data.Close[-1]` - Current close price
- ✅ `self.data.Close[-2]` - Previous close price
- ✅ `self.data.Close[-5]` - Close price 5 bars ago

**For calculations, use indicators in init():**
```python
def init(self):
    # For moving averages, use SMA/EMA
    self.sma = self.I(SMA, self.data.Close, 20)

    # For momentum/changes, use RSI or calculate manually in next()
    self.rsi = self.I(RSI, self.data.Close, 14)

def next(self):
    # Calculate price change manually
    current_price = self.data.Close[-1]
    prev_price = self.data.Close[-2]
    price_change_pct = (current_price - prev_price) / prev_price

    # Or use lookback
    price_5_bars_ago = self.data.Close[-5]
    change_over_5_bars = (current_price - price_5_bars_ago) / price_5_bars_ago
```

**What NOT to do:**

- ❌ Don't use `print()` statements
- ❌ Don't use `pd.DataFrame` operations or pandas methods like .diff(), .shift(), .pct_change()
- ❌ Don't use `.diff()`, `.shift()`, or `.rolling()` on data arrays - they don't have these methods!
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


def execute_and_validate_code(code_string: str) -> tuple[bool, str]:
    """
    Execute code in SECURE Docker sandbox to check for runtime errors.

    REQUIRES: Docker must be installed and running.
    Install: https://docs.docker.com/get-docker/

    Args:
        code_string: The Python code to test

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        from llm_sandbox import SandboxSession

        # Validation test code
        test_code = f"""
{code_string}

# Validation checks
import inspect

# Find Strategy class
strategy_class = None
for name, obj in list(globals().items()):
    if inspect.isclass(obj) and name != 'Strategy':
        try:
            if issubclass(obj, Strategy) and obj is not Strategy:
                strategy_class = obj
                break
        except:
            pass

if not strategy_class:
    raise ValueError("No Strategy class found")

if not hasattr(strategy_class, 'init'):
    raise ValueError("Strategy missing init() method")

if not hasattr(strategy_class, 'next'):
    raise ValueError("Strategy missing next() method")

print("VALIDATION_SUCCESS")
"""

        # Run in secure sandbox
        with SandboxSession(lang="python", verbose=False) as session:
            result = session.run(test_code, libraries=["backtesting", "pandas", "numpy"])

            if result.stderr:
                # Extract error message
                error_lines = result.stderr.strip().split("\n")
                for line in reversed(error_lines):
                    if "Error:" in line or "NameError" in line or "AttributeError" in line:
                        return False, line.strip()
                return False, result.stderr.split("\n")[-1].strip()

            if "VALIDATION_SUCCESS" in result.stdout:
                return True, "Valid (Docker sandbox)"
            return False, "Validation failed"

    except ImportError:
        import logging

        logging.exception("llm-sandbox not installed on server. Install with: uv add 'llm-sandbox[docker]'")
        return False, "Server configuration error - sandbox not available"
    except Exception as e:
        error_msg = str(e)
        if (
            "Docker" in error_msg
            or "Connection" in error_msg
            or "socket" in error_msg
            or "FileNotFoundError" in error_msg
        ):
            import logging

            logging.exception(f"Docker not available on server: {e}")
            logging.exception("Start Docker on the server: https://docs.docker.com/get-docker/")
            return False, "Server configuration error - Docker not available"
        return False, f"Validation error: {e}"


def fix_code_with_llm(llm, code: str, error: str, attempt: int) -> str:
    """Use LLM to fix code based on error message."""
    from langchain_core.prompts import ChatPromptTemplate

    fix_prompt = f"""Fix this backtesting.py strategy code. It has an error.

ORIGINAL CODE:
```python
{code}
```

ERROR:
{error}

RULES:
- Always include: from backtesting.lib import crossover (if using crossover)
- Always include: from backtesting.test import SMA, EMA, RSI (import what you use)
- Use self.I() for indicators
- Use array indexing self.data.Close[-1], NOT pandas methods
- Output ONLY the fixed Python code, no explanations

FIXED CODE:"""

    prompt = ChatPromptTemplate.from_messages([("human", fix_prompt)])
    chain = prompt | llm
    result = chain.invoke({})

    if hasattr(result, "content"):
        fixed_code = result.content
    else:
        fixed_code = str(result)

    # Clean markdown fences
    if "```python" in fixed_code:
        fixed_code = fixed_code.split("```python")[1].split("```")[0]
    elif "```" in fixed_code:
        fixed_code = fixed_code.split("```")[1].split("```")[0]

    return fixed_code.strip()


def auto_fix_common_issues(code_string: str) -> str:
    """Auto-fix common import issues without needing LLM."""
    lines = code_string.split("\n")
    imports_needed = []

    # Check for missing crossover import
    if "crossover(" in code_string and not any("from backtesting.lib import crossover" in line for line in lines):
        imports_needed.append("from backtesting.lib import crossover")

    # Check for missing Strategy import
    if not any("from backtesting import Strategy" in line for line in lines):
        imports_needed.append("from backtesting import Strategy")

    # Check for missing indicator imports
    indicators_found = []
    for indicator in ["SMA", "EMA", "RSI", "MACD", "BBANDS"]:
        if (f"{indicator}(" in code_string or f"self.I({indicator}" in code_string) and indicator not in str(
            lines[:10]
        ):
            indicators_found.append(indicator)

    if indicators_found:
        # Only add SMA as it's the only one in backtesting.test
        if "SMA" in indicators_found and not any(
            "from backtesting.test import" in line and "SMA" in line for line in lines
        ):
            imports_needed.append("from backtesting.test import SMA")

    # Add imports at the top
    if imports_needed:
        # Insert after any existing imports or at the start
        insert_pos = 0
        for i, line in enumerate(lines):
            if (
                line.strip()
                and not line.strip().startswith("#")
                and not line.strip().startswith("from")
                and not line.strip().startswith("import")
            ):
                insert_pos = i
                break

        for imp in reversed(imports_needed):
            if imp not in code_string:
                lines.insert(insert_pos, imp)

        code_string = "\n".join(lines)

    return code_string


def validate_strategy_code(code_string: str, llm=None) -> tuple[bool, str, str]:
    """
    Validate code by executing in sandbox. Use LLM to fix errors if they occur.

    Args:
        code_string: The Python code to validate
        llm: Optional LLM to use for fixing errors

    Returns:
        Tuple of (is_valid, message, final_code)
    """
    max_attempts = 3
    current_code = code_string

    # First, try simple auto-fixes
    current_code = auto_fix_common_issues(current_code)

    for attempt in range(max_attempts):
        # Try to execute the code
        is_valid, error = execute_and_validate_code(current_code)

        # Check if sandbox is not available (server configuration issue)
        if not is_valid and "Server configuration error" in error:
            # Can't validate securely, but let code through with warning
            return True, f"Warning: {error} - Code not validated in sandbox", current_code

        if is_valid:
            msg = "Valid"
            if current_code != code_string:
                msg += " (auto-fixed imports)"
            return True, msg, current_code

        # If we have an LLM and attempts left, try to fix
        if llm and attempt < max_attempts - 1:
            try:
                current_code = fix_code_with_llm(llm, current_code, error, attempt + 1)
            except Exception:
                return False, f"Failed to fix: {error}", current_code
        else:
            return False, error, current_code

    return False, f"Failed after {max_attempts} attempts", current_code
