"""Parameter Extraction Agent.

This agent extracts trading parameters from natural language input,
detects user intent (backtest, live trading, analysis), and generates
clarification questions for missing required fields.
"""

import json
import logging
from datetime import datetime, timedelta

from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)


def create_parameter_extraction_agent(llm):
    """
    Create a parameter extraction agent.

    Args:
        llm: The language model to use for extraction

    Returns:
        A callable agent that extracts parameters from natural language
    """

    # Calculate date context
    today = datetime.now()
    current_year = today.year
    ytd_start = f"{current_year}-01-01"
    last_year_start = f"{current_year - 1}-01-01"
    last_year_end = f"{current_year - 1}-12-31"
    two_years_ago = f"{current_year - 2}-01-01"
    six_months_ago = (today - timedelta(days=180)).strftime("%Y-%m-%d")
    today_str = today.strftime("%Y-%m-%d")

    # System prompt with properly escaped JSON examples
    system_prompt = f"""You are a parameter extraction agent for a trading platform. Today's date is {today_str}.

Your task is to extract trading parameters from natural language and detect the user's FLOW TYPE FIRST.

**STEP 1: DETECT FLOW TYPE (CRITICAL - DO THIS FIRST!)**

There are 3 distinct flows:

1. 🤖 **AGENT_MANAGED** - AI agent trades for the user
   - Triggers: "I like...", "trade for me", "aggressive", "conservative", vague preferences
   - Examples: "I like crypto", "stonks", "safe investments", "tech stocks"
   - User gives HIGH-LEVEL preferences, AI makes trading decisions
   - DEFAULT to this if unclear!

2. 📊 **TECHNICAL_DSL** - Execute user's specific trading rules
   - Triggers: RSI, MACD, SMA, EMA, %, thresholds, "when X then Y", "buy when", "sell when"
   - Examples: "Buy when RSI < 30", "sell at 10% profit", "MACD crosses above signal"
   - User defines EXACT rules, system executes them

3. 💡 **ANALYSIS** - AI analyzes and gives opinion
   - Triggers: "what do you think", "analyze", "opinion on", "thoughts on"
   - Examples: "What do you think about Bitcoin?", "Analyze TSLA"
   - User wants AI's analysis/opinion on an asset

**STEP 2: EXTRACT PARAMETERS BASED ON FLOW TYPE**

For AGENT_MANAGED:
- Required:
  * strategy_description: User's preferences/style (e.g., "I like crypto, aggressive")
  * capital: How much money
  * asset_preferences: What to trade OR "you choose" for AI selection
  * start_date, end_date: When to backtest (ALWAYS ASK if not specified!)

For TECHNICAL_DSL:
- Required:
  * strategy_description: Detailed technical rules with conditions
  * capital: How much money
  * start_date, end_date: Backtest period (ALWAYS ASK if not specified!)
- Optional:
  * ticker_list: Specific tickers if mentioned

For ANALYSIS:
- Required:
  * strategy_description: What to analyze (ticker or topic)
- Optional: Everything else

**IMPORTANT:**
- ALWAYS ask for asset_preferences if not specified (never default to stocks!)
- ALWAYS ask for start_date and end_date if not specified (never auto-fill with defaults!)
- For agent_managed: Accept SHORT preferences like "I like tech" - don't demand details!
- For technical_dsl: Demand specific rules with indicators and thresholds
- Set strategy_type: "agent_managed" or "technical_dsl" based on detected flow
- REJECT SLANG: If user says just "stonks", "stocks", ask what KIND of stocks/assets (tech? crypto? blue chip? or let AI choose?)
- Accept "no", "you", "you choose", "doesn't matter" as valid responses meaning AI should choose

**Optional Parameters (auto-defaulted):**
- ticker_list: List of ticker symbols (can extract from description)
  - If user says "you choose", "AI-managed", "doesn't matter": Leave ticker_list empty (AI will manage)
  - If user mentions categories like "tech stocks", "crypto": Note in strategy_description, leave tickers empty
  - Only set specific tickers if user explicitly names them (e.g., "AAPL, MSFT")
- rebalance_frequency: daily/weekly/monthly (default: weekly)
- position_sizing: equal_weight/risk_parity/kelly (default: equal_weight)
- max_positions: 1-50 (default: 10)
- name: Backtest name (auto-generated if not provided)

**Intent Detection:**
- "backtest", "test", "historical", "performance" → "backtest"
- "trade live", "start trading", "go live", "deploy" → "live_trading"
- "analyze", "research", "what do you think", "opinion" → "analysis"
- If unclear → "unclear"

**Extraction Rules:**
1. Company names → ticker symbols:
   - Tesla/tesla → TSLA
   - Apple/apple → AAPL
   - Microsoft → MSFT
   - Google/Alphabet → GOOGL
   - Amazon → AMZN
   - Nvidia → NVDA
   - Meta/Facebook → META
   - Bitcoin → BTC-USD
   - Ethereum → ETH-USD

2. Capital parsing:
   - $50k/$50K → 50000
   - $1m/$1M → 1000000
   - $100,000 → 100000
   - 50000 → 50000

3. Date parsing (ONLY if user explicitly mentions - otherwise mark as missing!):
   - "last 2 years" → {two_years_ago} to {today_str}
   - "last year" → {last_year_start} to {last_year_end}
   - "YTD" / "this year" → {ytd_start} to {today_str}
   - "last 6 months" → {six_months_ago} to {today_str}
   - Specific months: "Jan 2023" → "2023-01-01"
   - Year only: "2023" → "2023-01-01" to "2023-12-31"
   - **NEVER auto-fill dates if user doesn't mention them!**

4. Strategy extraction:
   - Extract the full strategy description including any mentioned indicators, rules, or criteria
   - If vague (e.g., "momentum"), still extract it but mark confidence as lower
   - Ask follow-up questions to clarify vague strategies

**Plausibility Validation:**
- Capital < $1000 → Ask "Did you mean $X,000?"
- Capital > $10,000,000 → Ask "That's $X million - is this correct?"
- Dates in the future → "Future dates aren't valid for backtesting"
- End date before start date → "End date must be after start date"
- Strategy too vague → Ask for specifics (e.g., "momentum" → "Which indicators? Entry/exit rules?")
- Contradictions → Point them out ("You said low risk but also aggressive?")

**Confidence Scoring (0.0 to 1.0):**
- 1.0: Explicitly stated (e.g., "AAPL", "$50,000", "2023-01-01")
- 0.8-0.9: Inferred with high confidence (e.g., "Apple" → AAPL, "last year")
- 0.6-0.7: Reasonable inference (e.g., "tech stocks" → [AAPL, MSFT, GOOGL])
- 0.3-0.5: Low confidence (e.g., vague strategy description)

**Clarification Questions:**
Generate specific questions for missing required fields:
- For capital: Provide suggestions [10000, 50000, 100000]
- For dates: Provide presets ["Last 2 Years", "Last Year", "YTD", "Last 6 Months", "Custom"]
- For strategy: Ask for more specifics about entry/exit rules

**Output Format (JSON only, no markdown):**
{{{{
  "intent": "backtest",
  "extracted": {{{{
    "strategy_description": "momentum strategy for TSLA and AAPL",
    "capital": 50000,
    "start_date": "2022-01-01",
    "end_date": "2023-12-31",
    "ticker_list": ["TSLA", "AAPL"]
  }}}},
  "missing": ["field1"],
  "confidence": {{{{
    "strategy_description": 0.8,
    "capital": 1.0,
    "start_date": 0.9
  }}}},
  "needs_clarification": false,
  "clarification_questions": [
    {{{{
      "question": "What initial capital would you like to use?",
      "field": "capital",
      "suggestions": [10000, 50000, 100000],
      "field_type": "number"
    }}}}
  ],
  "suggested_defaults": {{{{
    "rebalance_frequency": "weekly",
    "position_sizing": "equal_weight",
    "max_positions": 10
  }}}}
}}}}

**Important:**
- Return ONLY valid JSON, no markdown code blocks
- Include confidence scores for all extracted fields
- Generate helpful clarification questions for missing fields
- For backtest intent, start_date and end_date are required
- For live_trading intent, dates are optional (ongoing)
- For analysis intent, only strategy_description (or ticker) is needed
- Use double curly braces {{{{}}}} in JSON examples to escape them"""

    class ParameterExtractionAgent:
        """Parameter extraction agent with conversation context support."""

        def __init__(self, llm_instance):
            self.llm = llm_instance
            self.system_prompt = system_prompt

        def _build_conversation_context(self, conversation_history: list[dict]) -> str:
            """Build conversation context string from message history."""
            if not conversation_history:
                return ""

            context = "\n\nConversation history:\n"
            # Use last 5 messages for context
            for msg in conversation_history[-5:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                context += f"{role}: {content}\n"

            return context

        def _clean_json_response(self, response_text: str) -> str:
            """Clean up response text to extract valid JSON."""
            response_text = response_text.strip()

            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            return response_text

        def _generate_clarification_questions(self, missing_fields: list[str]) -> list[dict]:
            """Generate clarification questions for missing fields."""
            questions = []

            for field in missing_fields:
                if field == "strategy_description":
                    questions.append(
                        {
                            "question": "Please describe your trading strategy (e.g., 'Momentum strategy for tech stocks' or 'Buy when RSI < 30, sell when RSI > 70')",
                            "field": "strategy_description",
                            "suggestions": [],
                            "field_type": "textarea",
                        }
                    )
                elif field == "capital":
                    questions.append(
                        {
                            "question": "What initial capital would you like to use?",
                            "field": "capital",
                            "suggestions": [10000, 50000, 100000],
                            "field_type": "number",
                        }
                    )
                elif field == "asset_preferences":
                    questions.append(
                        {
                            "question": "What would you like to trade? (e.g., 'AAPL, MSFT' or 'tech stocks' or 'crypto' or 'you choose')",
                            "field": "asset_preferences",
                            "suggestions": ["Tech Stocks", "Crypto", "Blue Chips", "You Choose (AI-Managed)"],
                            "field_type": "text",
                        }
                    )
                elif field in ["start_date", "end_date", "dates"]:
                    if "dates" not in [q["field"] for q in questions]:  # Avoid duplicates
                        questions.append(
                            {
                                "question": "What time period for the backtest?",
                                "field": "dates",
                                "suggestions": ["Last 2 Years", "Last Year", "YTD", "Custom"],
                                "field_type": "select",
                            }
                        )

            return questions

        def _validate_plausibility(self, result_dict: dict) -> dict:
            """Validate extracted parameters for plausibility and add clarification questions."""
            from datetime import datetime, timedelta

            extracted = result_dict["extracted"]
            questions = result_dict["clarification_questions"]

            # Validate capital
            capital = extracted.get("capital")
            if capital is not None:
                if capital < 1000:
                    # Very low capital - likely a mistake
                    result_dict["needs_clarification"] = True
                    questions.insert(
                        0,
                        {
                            "question": f"You specified ${capital} capital. Did you mean ${capital},000? For backtesting, typical amounts are $10k-$100k+.",
                            "field": "capital_confirmation",
                            "suggestions": [capital * 1000, 10000, 50000],
                            "field_type": "number",
                        },
                    )
                elif capital > 10000000:
                    # Very high capital - confirm
                    result_dict["needs_clarification"] = True
                    questions.insert(
                        0,
                        {
                            "question": f"You specified ${capital:,} (${capital/1000000:.1f} million). Is this correct? That's a very large amount for backtesting.",
                            "field": "capital_confirmation",
                            "suggestions": [],
                            "field_type": "text",
                        },
                    )

            # Validate dates
            start_date = extracted.get("start_date")
            end_date = extracted.get("end_date")
            today = datetime.now()

            if start_date:
                try:
                    start_dt = datetime.strptime(start_date, "%Y-%m-%d")

                    # Future date check
                    if start_dt > today:
                        result_dict["needs_clarification"] = True
                        questions.insert(
                            0,
                            {
                                "question": f"Start date {start_date} is in the future. Backtests can only use historical data. Did you mean a past date?",
                                "field": "start_date",
                                "suggestions": [],
                                "field_type": "date",
                            },
                        )
                        # Remove invalid date
                        del extracted["start_date"]

                    # Very old date check (> 20 years)
                    if start_dt < today - timedelta(days=365 * 20):
                        result_dict["needs_clarification"] = True
                        questions.insert(
                            0,
                            {
                                "question": f"Start date {start_date} is over 20 years ago. Limited data may be available. Is this intentional?",
                                "field": "date_confirmation",
                                "suggestions": [],
                                "field_type": "text",
                            },
                        )
                except:
                    pass

            if end_date:
                try:
                    end_dt = datetime.strptime(end_date, "%Y-%m-%d")

                    # Future date check
                    if end_dt > today:
                        result_dict["needs_clarification"] = True
                        questions.insert(
                            0,
                            {
                                "question": f"End date {end_date} is in the future. Backtests can only use historical data. Did you mean today's date ({today.strftime('%Y-%m-%d')})?",
                                "field": "end_date",
                                "suggestions": [],
                                "field_type": "date",
                            },
                        )
                        # Remove invalid date
                        del extracted["end_date"]
                except:
                    pass

            # Check date ordering
            if start_date and end_date:
                try:
                    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                    end_dt = datetime.strptime(end_date, "%Y-%m-%d")

                    if end_dt <= start_dt:
                        result_dict["needs_clarification"] = True
                        questions.insert(
                            0,
                            {
                                "question": f"End date ({end_date}) must be after start date ({start_date}). Please provide valid date range.",
                                "field": "dates",
                                "suggestions": ["Last 2 Years", "Last Year", "YTD", "Custom"],
                                "field_type": "select",
                            },
                        )
                        # Remove invalid dates
                        if "start_date" in extracted:
                            del extracted["start_date"]
                        if "end_date" in extracted:
                            del extracted["end_date"]

                    # Very short period check (< 30 days)
                    elif (end_dt - start_dt).days < 30:
                        result_dict["needs_clarification"] = True
                        questions.insert(
                            0,
                            {
                                "question": f"Your date range is only {(end_dt - start_dt).days} days. This is very short for a backtest. Did you mean a longer period?",
                                "field": "date_confirmation",
                                "suggestions": ["Last 6 Months", "Last Year", "Last 2 Years"],
                                "field_type": "select",
                            },
                        )
                except:
                    pass

            # Validate strategy description vagueness (for technical strategies)
            strategy_desc = extracted.get("strategy_description", "")
            strategy_type = extracted.get("strategy_type")

            if strategy_type == "technical_dsl" and strategy_desc:
                # Check if strategy is too vague for technical DSL
                vague_terms = ["momentum", "value", "growth", "trend", "swing"]
                if any(term in strategy_desc.lower() for term in vague_terms):
                    # Check if it has specifics (indicators, numbers, etc.)
                    has_specifics = any(
                        term in strategy_desc.lower()
                        for term in [
                            "rsi",
                            "macd",
                            "ema",
                            "sma",
                            "bollinger",
                            "stochastic",
                            "%",
                            "threshold",
                            "cross",
                            "above",
                            "below",
                            ">=",
                            "<=",
                            "<",
                            ">",
                        ]
                    )

                    if not has_specifics:
                        result_dict["needs_clarification"] = True
                        questions.insert(
                            0,
                            {
                                "question": f"Your strategy '{strategy_desc}' sounds like you want specific technical rules. Could you specify:\n• Which indicators? (RSI, MACD, moving averages, etc.)\n• Entry thresholds? (e.g., RSI < 30)\n• Exit rules? (profit target, stop loss, indicator levels)",
                                "field": "strategy_details",
                                "suggestions": [],
                                "field_type": "textarea",
                            },
                        )

            return result_dict

        def __call__(self, user_message: str, conversation_history: list[dict] | None = None) -> dict:
            """
            Extract parameters from natural language input.

            Args:
                user_message: The user's natural language input
                conversation_history: Previous messages for context (optional)

            Returns:
                Dictionary with extracted parameters, intent, missing fields, etc.
            """
            conversation_history = conversation_history or []
            conversation_context = self._build_conversation_context(conversation_history)

            # Create prompt
            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", self.system_prompt),
                    ("human", "{user_message}{conversation_context}"),
                ]
            )

            try:
                chain = prompt | self.llm
                result = chain.invoke({"user_message": user_message, "conversation_context": conversation_context})

                # Extract content
                if hasattr(result, "content"):
                    response_text = result.content
                else:
                    response_text = str(result)

                # Clean and parse JSON
                cleaned_response = self._clean_json_response(response_text)
                parsed = json.loads(cleaned_response)

                # Validate structure
                result_dict = {
                    "intent": parsed.get("intent", "unclear"),
                    "extracted": parsed.get("extracted", {}),
                    "missing": parsed.get("missing", []),
                    "confidence": parsed.get("confidence", {}),
                    "needs_clarification": parsed.get("needs_clarification", False),
                    "clarification_questions": parsed.get("clarification_questions", []),
                    "suggested_defaults": parsed.get("suggested_defaults", {}),
                }

                # Validate strategy_description based on flow type
                strategy_desc = result_dict["extracted"].get("strategy_description", "")
                strategy_type = result_dict["extracted"].get("strategy_type", "agent_managed")
                intent = result_dict.get("intent", "unclear")

                # Different validation based on flow type
                if strategy_type == "agent_managed":
                    # For agent-managed, even short preferences are OK (e.g., "I like stonks")
                    if not strategy_desc or len(strategy_desc.strip()) < 3:
                        if "strategy_description" in result_dict["extracted"]:
                            del result_dict["extracted"]["strategy_description"]

                        if "strategy_description" not in result_dict["missing"]:
                            result_dict["missing"].append("strategy_description")
                            result_dict["needs_clarification"] = True

                            has_strategy_question = any(
                                q.get("field") == "strategy_description" for q in result_dict["clarification_questions"]
                            )
                            if not has_strategy_question:
                                result_dict["clarification_questions"].insert(
                                    0,
                                    {
                                        "question": "What are your trading preferences? (e.g., 'I like crypto', 'aggressive tech stocks', 'safe blue chips')",
                                        "field": "strategy_description",
                                        "suggestions": [
                                            "Aggressive growth",
                                            "Conservative value",
                                            "Tech & crypto",
                                            "Blue chip stocks",
                                        ],
                                        "field_type": "text",
                                    },
                                )

                elif strategy_type == "technical_dsl":
                    # For technical DSL, demand detailed rules
                    if not strategy_desc or len(strategy_desc.strip()) < 15:
                        if "strategy_description" in result_dict["extracted"]:
                            del result_dict["extracted"]["strategy_description"]

                        if "strategy_description" not in result_dict["missing"]:
                            result_dict["missing"].append("strategy_description")
                            result_dict["needs_clarification"] = True

                            has_strategy_question = any(
                                q.get("field") == "strategy_description" for q in result_dict["clarification_questions"]
                            )
                            if not has_strategy_question:
                                result_dict["clarification_questions"].insert(
                                    0,
                                    {
                                        "question": "Please describe your technical strategy with specific rules (e.g., 'Buy when RSI < 30 and MACD crosses, sell at 10% profit or 5% stop-loss')",
                                        "field": "strategy_description",
                                        "suggestions": [],
                                        "field_type": "textarea",
                                    },
                                )

                elif intent == "analysis":
                    # For analysis, just need what to analyze
                    if not strategy_desc:
                        if "strategy_description" in result_dict["extracted"]:
                            del result_dict["extracted"]["strategy_description"]

                        if "strategy_description" not in result_dict["missing"]:
                            result_dict["missing"].append("strategy_description")
                            result_dict["needs_clarification"] = True

                            has_strategy_question = any(
                                q.get("field") == "strategy_description" for q in result_dict["clarification_questions"]
                            )
                            if not has_strategy_question:
                                result_dict["clarification_questions"].insert(
                                    0,
                                    {
                                        "question": "What would you like me to analyze? (e.g., 'Bitcoin', 'AAPL', 'tech sector')",
                                        "field": "strategy_description",
                                        "suggestions": [],
                                        "field_type": "text",
                                    },
                                )

                # Validate asset preferences (skip for analysis intent)
                if intent != "analysis":
                    ticker_list = result_dict["extracted"].get("ticker_list", [])
                    asset_prefs = result_dict["extracted"].get("asset_preferences", "")

                    # Convert list to string if needed
                    if isinstance(asset_prefs, list):
                        asset_prefs = " ".join(asset_prefs) if asset_prefs else ""

                    # Check if user said "you choose", "AI managed", "no", etc.
                    ai_managed_phrases = [
                        "you choose",
                        "ai-managed",
                        "ai managed",
                        "doesn't matter",
                        "don't care",
                        "up to you",
                        "surprise me",
                        "you",
                        "no preference",
                        "no",
                    ]
                    is_ai_managed = (
                        any(phrase in asset_prefs.lower().strip() for phrase in ai_managed_phrases)
                        if asset_prefs
                        else False
                    )

                    # Slang terms that need clarification
                    slang_terms = ["stonk", "stonks", "stock", "stocks"]
                    is_slang_only = asset_prefs.lower().strip() in slang_terms if asset_prefs else False

                    # Check if description mentions specific tickers
                    desc_lower = strategy_desc.lower() if strategy_desc else ""
                    has_tickers_in_desc = any(
                        term in desc_lower
                        for term in ["aapl", "msft", "tsla", "googl", "amzn", "btc", "eth", "spy", "qqq"]
                    )

                    # Check for clear asset class preferences (not slang)
                    has_clear_preference = any(
                        term in desc_lower
                        for term in [
                            "tech stock",
                            "technology stock",
                            "crypto",
                            "cryptocurrency",
                            "blue chip",
                            "small cap",
                            "large cap",
                            "etf",
                            "s&p 500",
                            "nasdaq",
                            "bitcoin",
                            "ethereum",
                        ]
                    )

                    # Check if description only contains slang (like "I like stonks")
                    desc_has_only_slang = (
                        any(word in desc_lower for word in ["stonk", "stonks"])
                        and not has_clear_preference
                        and not has_tickers_in_desc
                    )

                    # Slang only is not enough - need clarification
                    if is_slang_only or desc_has_only_slang:
                        has_asset_info = False
                        # Remove slang from extracted
                        if "asset_preferences" in result_dict["extracted"]:
                            del result_dict["extracted"]["asset_preferences"]
                    else:
                        has_asset_info = ticker_list or is_ai_managed or has_tickers_in_desc or has_clear_preference

                        # For agent_managed, if they said something like "I like crypto", that's enough
                        if strategy_type == "agent_managed" and has_clear_preference:
                            has_asset_info = True

                    if not has_asset_info or is_slang_only or desc_has_only_slang:
                        # Need to ask about assets
                        if "asset_preferences" not in result_dict["missing"]:
                            result_dict["missing"].append("asset_preferences")
                            result_dict["needs_clarification"] = True

                            # Add clarification question if not already present
                            has_asset_question = any(
                                q.get("field") == "asset_preferences" for q in result_dict["clarification_questions"]
                            )
                            if not has_asset_question:
                                if strategy_type == "agent_managed":
                                    if is_slang_only or desc_has_only_slang:
                                        result_dict["clarification_questions"].append(
                                            {
                                                "question": "What kind of assets would you like to trade?",
                                                "field": "asset_preferences",
                                                "suggestions": ["Tech Stocks", "Crypto", "Blue Chips", "You Choose"],
                                                "field_type": "select",
                                            }
                                        )
                                    else:
                                        result_dict["clarification_questions"].append(
                                            {
                                                "question": "What would you like to trade?",
                                                "field": "asset_preferences",
                                                "suggestions": ["Tech Stocks", "Crypto", "Blue Chips", "You Choose"],
                                                "field_type": "select",
                                            }
                                        )
                                else:
                                    result_dict["clarification_questions"].append(
                                        {
                                            "question": "What tickers would you like to trade? (e.g., 'AAPL, MSFT')",
                                            "field": "asset_preferences",
                                            "suggestions": [],
                                            "field_type": "text",
                                        }
                                    )
                    elif is_ai_managed:
                        # User wants AI to manage - update strategy description to reflect this
                        if "AI will select" not in strategy_desc and "AI-managed" not in strategy_desc:
                            result_dict["extracted"]["strategy_description"] = f"{strategy_desc} (AI-managed portfolio)"
                        # Ensure ticker_list is empty for AI-managed
                        result_dict["extracted"]["ticker_list"] = []
                        # Remove asset_preferences from missing if it's there
                        if "asset_preferences" in result_dict["missing"]:
                            result_dict["missing"].remove("asset_preferences")

                # Plausibility checks
                result_dict = self._validate_plausibility(result_dict)

                logger.info(
                    f"Parameter extraction successful - Intent: {result_dict['intent']}, "
                    f"Extracted: {len(result_dict['extracted'])} fields, "
                    f"Missing: {len(result_dict['missing'])} fields"
                )

                return result_dict

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                logger.error(f"Response text: {cleaned_response[:500] if 'cleaned_response' in locals() else 'N/A'}")

                # Fallback response - only include description if it's meaningful
                extracted = {}
                missing = ["strategy_description", "capital", "start_date", "end_date"]
                confidence = {}

                if user_message and len(user_message.strip()) > 10:
                    extracted["strategy_description"] = user_message
                    missing.remove("strategy_description")
                    confidence["strategy_description"] = 0.5

                return {
                    "intent": "unclear",
                    "extracted": extracted,
                    "missing": missing,
                    "confidence": confidence,
                    "needs_clarification": True,
                    "clarification_questions": self._generate_clarification_questions(missing),
                    "suggested_defaults": {},
                }

            except Exception as e:
                logger.exception(f"Error in parameter extraction: {e}")
                raise

    return ParameterExtractionAgent(llm)
