"""Strategy DSL Generator Agent.

This agent translates natural language trading strategy descriptions into
structured YAML DSL format that can be parsed and executed by the backtesting engine.
"""

from langchain_core.prompts import ChatPromptTemplate


def create_strategy_dsl_generator(llm):
    """
    Create a strategy DSL generator agent.

    Args:
        llm: The language model to use for generation

    Returns:
        A function that takes strategy parameters and returns YAML DSL
    """

    system_prompt = """You are an expert trading strategy architect. Your task is to translate natural language trading strategy descriptions into a structured YAML DSL (Domain-Specific Language) format.

The DSL format should follow this structure:

```yaml
# Metadata section (REQUIRED)
metadata:
  strategy_type: "agent_managed"  # or "technical_dsl"
  # agent_managed: High-level preferences, AI makes trading decisions
  # technical_dsl: Specific rules with indicators and thresholds
  created_at: "2024-01-01"
  version: "1.0"

strategy:
  name: "Strategy Name"
  description: "Brief description"

  # Trading universe
  universe:
    - TICKER1
    - TICKER2
    # OR for AI-managed assets:
    # universe: "AI_MANAGED"  # AI will select assets based on analysis

  # Entry rules (when to open positions)
  entry_rules:
    - type: "indicator"  # or "fundamental", "sentiment", "pattern", "conditional", "flexible"
      indicator: "RSI"
      condition: "<"
      value: 30
      description: "Buy when oversold"

    - type: "sentiment"
      source: "news"
      condition: "positive"
      threshold: 0.6
      description: "Positive news sentiment"

    # Conditional (if-else) entry example:
    - type: "conditional"
      conditions:
        - if:
            indicator: "RSI"
            condition: "<"
            value: 30
          then:
            action: "buy"
            size: 0.15  # 15% position
            description: "Strong buy signal on oversold"
        - else_if:
            price: "below_52w_low"
            threshold: 1.05  # Within 5% of 52-week low
          then:
            action: "buy"
            size: 0.10
            description: "Buy near yearly low"
        - else:
            action: "hold"
            description: "Wait for better entry"

  # Exit rules (when to close positions)
  exit_rules:
    - type: "indicator"
      indicator: "RSI"
      condition: ">"
      value: 70
      description: "Sell when overbought"

    - type: "stop_loss"
      value: 0.05
      description: "5% stop loss"

    # Conditional exit example:
    - type: "conditional"
      conditions:
        - if:
            price_change: ">"
            value: 0.20  # 20% gain
          then:
            action: "sell"
            size: 0.50  # Sell half position
            description: "Take partial profits at 20% gain"
        - else_if:
            indicator: "RSI"
            condition: ">"
            value: 80
          then:
            action: "sell"
            size: 1.0  # Sell entire position
            description: "Exit on extreme overbought"

  # Risk management
  risk_management:
    max_position_size: 0.20  # Maximum 20% of portfolio per position
    stop_loss: 0.05  # 5% stop loss
    take_profit: 0.15  # Optional: 15% take profit
    max_drawdown: 0.20  # Maximum 20% portfolio drawdown
    position_sizing: "equal_weight"  # or "risk_parity", "kelly"

  # Additional parameters
  parameters:
    rebalance_frequency: "weekly"  # daily, weekly, monthly
    lookback_period: 90  # days for indicator calculation
    min_volume: 1000000  # Minimum daily volume

  # Trading preferences
  preferences:
    asset_classes: ["equity"]  # equity, crypto, commodity
    sectors: ["technology", "healthcare"]  # Optional sector filter
    market_cap: "large"  # small, mid, large, mega
    risk_tolerance: "moderate"  # conservative, moderate, aggressive
```

**Key Guidelines:**
1. **Assess Strategy Specificity**: Determine if the user wants a specific algorithmic strategy or a broad investment approach

2. **For SPECIFIC/ALGORITHMIC strategies** (e.g., "Buy when RSI < 30", "Use MACD crossover"):
   - Be precise and explicit with entry/exit conditions
   - Convert vague terms into specific thresholds:
     * "low RSI" → RSI < 30
     * "high momentum" → MACD positive crossover
     * "risk-averse" → stop_loss: 0.03, max_position_size: 0.10
   - Define clear technical rules

3. **For BROAD/FLEXIBLE strategies** (e.g., "I like Tesla and Apple", "Invest in crypto", "I'm risk-friendly"):
   - Keep entry_rules and exit_rules MINIMAL or use "flexible" type
   - Focus on preferences, risk_tolerance, and universe instead of rigid conditions
   - Give the AI trading agents room to make intelligent decisions based on real-time analysis
   - Use broad guidelines rather than specific thresholds
   - Example for flexible strategy:
     ```yaml
     entry_rules:
       - type: "flexible"
         description: "AI agents will analyze market conditions, sentiment, and fundamentals to identify optimal entry points"
     exit_rules:
       - type: "flexible"
         description: "AI agents will monitor positions and exit based on market analysis and risk assessment"
     ```

4. Support multiple types of conditions:
   - Technical indicators: RSI, MACD, Moving Averages, Bollinger Bands
   - Fundamentals: P/E ratio, dividend yield, revenue growth
   - Sentiment: News sentiment, social media sentiment
   - Patterns: Support/resistance, trend following
   - Flexible: Let AI agents decide based on comprehensive analysis
   - **Conditional (if-else)**: Multi-level decision logic based on different thresholds/scenarios

5. **CONDITIONAL LOGIC** (if-else rules):
   - Use `type: "conditional"` when user specifies different actions at different price points/thresholds
   - Support multiple conditions: `if`, `else_if`, `else`
   - Each condition can check: indicators, prices, price_change, fundamentals
   - Actions can specify position size (0.0 to 1.0) for partial entries/exits
   - Examples of user intent requiring conditionals:
     * "Buy 50% at $100, another 25% at $90"
     * "Sell half when up 20%, sell rest at 50%"
     * "If RSI < 20 buy more, else if RSI < 30 buy less"
     * "Take profit at 15%, or cut losses at 5%"

6. **AI-MANAGED UNIVERSE**:
   - Use `universe: "AI_MANAGED"` when user wants AI to select assets
   - Trigger phrases: "pick stocks for me", "you choose", "manage my portfolio", "find the best assets"
   - In this mode, specify preferences (sectors, asset_classes, risk_tolerance) instead of tickers
   - AI agents will dynamically select and rebalance assets based on analysis
   - Example preferences for AI-managed:
     ```yaml
     universe: "AI_MANAGED"
     preferences:
       asset_classes: ["equity", "crypto"]
       sectors: ["technology", "healthcare"]
       market_cap: "large"
       max_assets: 10
     ```

7. **CRITICAL**: Match the specificity to the user's intent:
   - Vague/high-level description → Broad, flexible strategy
   - Specific technical requirements → Precise, rule-based strategy
   - Multiple price levels/thresholds → Conditional (if-else) logic
   - No specific assets mentioned + wants AI to manage → AI_MANAGED universe

8. Include descriptions for each rule to make strategy transparent

**Examples of Strategy Types:**

Example 1 - AGENT-MANAGED Strategy (user says: "I like Tesla and want to invest in crypto, I'm aggressive with 50k"):
```yaml
metadata:
  strategy_type: "agent_managed"
  created_at: "2024-01-01"
  version: "1.0"

strategy:
  name: "Tech & Crypto Growth Strategy"
  description: "Aggressive growth-focused strategy in tech stocks and crypto"
  universe:
    - TSLA
    - BTC-USD
    - ETH-USD
  entry_rules:
    - type: "flexible"
      description: "AI agents will identify optimal entry points based on market analysis, sentiment, and technical indicators"
  exit_rules:
    - type: "flexible"
      description: "AI agents will manage exits based on comprehensive market analysis and risk signals"
  risk_management:
    max_position_size: 0.30  # Aggressive: up to 30% per position
    stop_loss: 0.12  # 12% stop loss for aggressive approach
    position_sizing: "equal_weight"
  preferences:
    risk_tolerance: "aggressive"
```

Example 2 - TECHNICAL DSL Strategy (user says: "Buy when RSI < 30 and sell when RSI > 70, use 5% stop loss"):
```yaml
metadata:
  strategy_type: "technical_dsl"
  created_at: "2024-01-01"
  version: "1.0"

strategy:
  name: "RSI Mean Reversion Strategy"
  description: "Technical strategy based on RSI oversold/overbought signals"
  entry_rules:
    - type: "indicator"
      indicator: "RSI"
      condition: "<"
      value: 30
      description: "Buy when RSI indicates oversold conditions"
  exit_rules:
    - type: "indicator"
      indicator: "RSI"
      condition: ">"
      value: 70
      description: "Sell when RSI indicates overbought conditions"
    - type: "stop_loss"
      value: 0.05
      description: "5% stop loss"
  risk_management:
    stop_loss: 0.05
    position_sizing: "equal_weight"
```

Example 3 - CONDITIONAL Strategy (user says: "Buy Tesla in stages: 30% at $200, 40% at $180, 30% at $160. Sell half at 25% profit, rest at 50%"):
```yaml
metadata:
  strategy_type: "technical_dsl"
  created_at: "2024-01-01"
  version: "1.0"

strategy:
  name: "Tesla Scaled Entry/Exit Strategy"
  description: "Multi-level conditional entries and profit-taking for TSLA"
  universe:
    - TSLA
  entry_rules:
    - type: "conditional"
      conditions:
        - if:
            price: "<="
            value: 160
          then:
            action: "buy"
            size: 0.30
            description: "Buy 30% position at $160 (deep value)"
        - else_if:
            price: "<="
            value: 180
          then:
            action: "buy"
            size: 0.40
            description: "Buy 40% position at $180 (moderate value)"
        - else_if:
            price: "<="
            value: 200
          then:
            action: "buy"
            size: 0.30
            description: "Buy 30% position at $200 (initial entry)"
  exit_rules:
    - type: "conditional"
      conditions:
        - if:
            price_change: ">="
            value: 0.50  # 50% gain
          then:
            action: "sell"
            size: 1.0
            description: "Sell remaining position at 50% profit"
        - else_if:
            price_change: ">="
            value: 0.25  # 25% gain
          then:
            action: "sell"
            size: 0.50
            description: "Take partial profits - sell half at 25% gain"
  risk_management:
    stop_loss: 0.15
    position_sizing: "custom"  # Using conditional sizing
```

Example 4 - AI-MANAGED Universe (user says: "Build me a tech portfolio with 100k, pick the best stocks and crypto, I want high growth"):
```yaml
strategy:
  name: "AI-Managed Tech Growth Portfolio"
  description: "AI agents will select and manage optimal tech & crypto assets for high growth"
  universe: "AI_MANAGED"
  entry_rules:
    - type: "flexible"
      description: "AI agents will identify and enter high-growth tech and crypto opportunities based on comprehensive market analysis"
  exit_rules:
    - type: "flexible"
      description: "AI agents will manage exits based on technical signals, sentiment shifts, and risk assessment"
  risk_management:
    max_position_size: 0.20
    stop_loss: 0.10
    position_sizing: "risk_parity"
  parameters:
    rebalance_frequency: "weekly"
  preferences:
    asset_classes: ["equity", "crypto"]
    sectors: ["technology", "software", "semiconductors"]
    market_cap: "large"
    risk_tolerance: "aggressive"
    max_assets: 8
    investment_style: "growth"
```

**Output Format:**
- Return ONLY the YAML code
- Do not include markdown code fences or extra commentary
- Ensure proper YAML indentation (2 spaces)
- Validate that all numeric values are reasonable
"""

    class StrategyDSLGenerator:
        """Strategy DSL generator with streaming support."""

        def __init__(self, llm_chain):
            self.llm = llm_chain

        def _build_context(
            self,
            strategy_description: str,
            ticker_list: list[str],
            initial_capital: float,
            rebalance_frequency: str,
            position_sizing: str,
            max_positions: int,
            strategy_type: str = "agent_managed",
        ) -> str:
            """Build the context string for the LLM."""
            if ticker_list and len(ticker_list) > 0:
                universe_text = f"- Universe: {', '.join(ticker_list)}"
                instruction = ""
            else:
                universe_text = (
                    "- Universe: Not specified - please extract tickers from the strategy description OR use AI_MANAGED"
                )
                if strategy_type == "agent_managed":
                    instruction = '\n\n**IMPORTANT**: This is an AGENT-MANAGED strategy. The user has not provided specific tickers. You should use `universe: "AI_MANAGED"` so AI agents can dynamically select assets based on the user\'s preferences. Include sector preferences, asset classes, and risk tolerance in the preferences section.'
                else:
                    instruction = "\n\n**IMPORTANT**: The user has not explicitly provided a ticker list. You MUST extract ticker symbols from the strategy description. For example:\n- 'Tesla' or 'tesla' → TSLA\n- 'Apple' or 'apple' → AAPL\n- 'Bitcoin' or 'bitcoin' → BTC-USD\n- 'tech stocks' → [AAPL, MSFT, GOOGL, NVDA, TSLA]\n- If no specific stocks are mentioned, infer appropriate tickers based on the strategy type and sectors mentioned."

            strategy_type_instruction = f"\n\n**CRITICAL**: This is a **{strategy_type.upper().replace('_', '-')}** strategy. Set `metadata.strategy_type: \"{strategy_type}\"` in your output."

            if strategy_type == "agent_managed":
                strategy_type_instruction += "\n- Use FLEXIBLE entry/exit rules (type: 'flexible')\n- Focus on preferences and risk tolerance\n- Let AI agents make intelligent trading decisions\n- Use broad guidelines, not rigid thresholds"
            else:
                strategy_type_instruction += "\n- Use SPECIFIC technical indicators and thresholds\n- Define precise entry/exit conditions\n- Include clear numeric values for all rules"

            return f"""
User Configuration:
- Strategy Type: {strategy_type}
{universe_text}
- Initial Capital: ${initial_capital:,.2f}
- Rebalance Frequency: {rebalance_frequency}
- Position Sizing: {position_sizing}
- Max Positions: {max_positions}

User's Strategy Description:
{strategy_description}
{instruction}
{strategy_type_instruction}
"""

        def _clean_yaml_output(self, yaml_output: str) -> str:
            """Clean up YAML output by removing markdown fences."""
            yaml_output = yaml_output.strip()
            if yaml_output.startswith("```yaml"):
                yaml_output = yaml_output[7:]
            elif yaml_output.startswith("```"):
                yaml_output = yaml_output[3:]

            if yaml_output.endswith("```"):
                yaml_output = yaml_output[:-3]

            return yaml_output.strip()

        def __call__(
            self,
            strategy_description: str,
            ticker_list: list[str],
            initial_capital: float,
            rebalance_frequency: str,
            position_sizing: str,
            max_positions: int,
            strategy_type: str = "agent_managed",
        ) -> str:
            """
            Generate YAML DSL from natural language strategy description.

            Args:
                strategy_description: Natural language description of the strategy
                ticker_list: List of tickers to trade (can be empty - will extract from description)
                initial_capital: Starting capital
                rebalance_frequency: How often to rebalance (daily/weekly/monthly)
                position_sizing: Position sizing method (equal_weight/risk_parity/kelly)
                max_positions: Maximum number of positions
                strategy_type: "agent_managed" or "technical_dsl"

            Returns:
                YAML DSL string
            """
            context = self._build_context(
                strategy_description,
                ticker_list,
                initial_capital,
                rebalance_frequency,
                position_sizing,
                max_positions,
                strategy_type,
            )

            prompt = ChatPromptTemplate.from_messages(
                [("system", system_prompt), ("human", context + "\n\nPlease generate the YAML DSL for this strategy:")]
            )

            chain = prompt | llm
            result = chain.invoke({})

            # Extract content
            if hasattr(result, "content"):
                yaml_output = result.content
            else:
                yaml_output = str(result)

            return self._clean_yaml_output(yaml_output)

        def stream(
            self,
            strategy_description: str,
            ticker_list: list[str],
            initial_capital: float,
            rebalance_frequency: str,
            position_sizing: str,
            max_positions: int,
            strategy_type: str = "agent_managed",
        ):
            """
            Stream YAML DSL generation in real-time.

            Args:
                Same as __call__

            Yields:
                String chunks as they're generated by the LLM
            """
            context = self._build_context(
                strategy_description,
                ticker_list,
                initial_capital,
                rebalance_frequency,
                position_sizing,
                max_positions,
                strategy_type,
            )

            prompt = ChatPromptTemplate.from_messages(
                [("system", system_prompt), ("human", context + "\n\nPlease generate the YAML DSL for this strategy:")]
            )

            chain = prompt | llm

            # Stream chunks from the LLM
            for chunk in chain.stream({}):
                if hasattr(chunk, "content"):
                    content = chunk.content
                else:
                    content = str(chunk)

                if content:
                    yield content

    return StrategyDSLGenerator(llm)


def validate_strategy_dsl(yaml_string: str) -> tuple[bool, str]:
    """
    Validate that the generated YAML DSL is well-formed.

    Args:
        yaml_string: The YAML DSL to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        import yaml

        parsed = yaml.safe_load(yaml_string)

        # Check for required top-level keys
        if "strategy" not in parsed:
            return False, "Missing 'strategy' top-level key"

        if "metadata" not in parsed:
            return False, "Missing 'metadata' top-level key"

        # Validate metadata
        metadata = parsed["metadata"]
        if "strategy_type" not in metadata:
            return False, "Missing 'strategy_type' in metadata"

        if metadata["strategy_type"] not in ["agent_managed", "technical_dsl"]:
            return (
                False,
                f"Invalid strategy_type: {metadata['strategy_type']} (must be 'agent_managed' or 'technical_dsl')",
            )

        strategy = parsed["strategy"]

        # Check for required fields
        required_fields = ["name", "description"]
        for field in required_fields:
            if field not in strategy:
                return False, f"Missing required field: {field}"

        # Validate structure (basic checks)
        if "entry_rules" in strategy and not isinstance(strategy["entry_rules"], list):
            return False, "entry_rules must be a list"

        if "exit_rules" in strategy and not isinstance(strategy["exit_rules"], list):
            return False, "exit_rules must be a list"

        return True, "Valid"

    except yaml.YAMLError as e:
        return False, f"YAML parsing error: {e!s}"
    except Exception as e:
        return False, f"Validation error: {e!s}"
