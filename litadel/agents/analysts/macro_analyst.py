"""Macro Economic Analyst - Analyzes macroeconomic indicators for trading context."""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from litadel.agents.utils.agent_utils import get_economic_indicators


def create_macro_analyst(llm):
    """
    Create a macro economic analyst node that analyzes economic indicators.

    The analyst provides macroeconomic context (GDP, CPI, unemployment, interest rates)
    tailored to the specific asset class being analyzed.

    Args:
        llm: Language model to use for analysis

    Returns:
        Callable node function for use in LangGraph workflow
    """

    def macro_analyst_node(state):
        current_date = state["trade_date"]
        ticker = state["company_of_interest"]
        asset_class = state.get("asset_class", "equity")

        tools = [get_economic_indicators]

        # Asset-class-specific system messages
        if asset_class == "equity":
            system_message = (
                "You are a macroeconomic analyst providing economic context for equity trading decisions. "
                "Your role is to analyze key macroeconomic indicators and explain their implications for stock markets.\n\n"
                "Use the available tool: get_economic_indicators(current_date) to retrieve comprehensive economic data "
                "including GDP, CPI (inflation), unemployment rate, federal funds rate, treasury yields, and retail sales.\n\n"
                "For EQUITY markets, focus your analysis on:\n"
                "- **Interest Rates Impact**: How Federal Funds Rate and treasury yields affect stock valuations through discount rates. "
                "Higher rates generally pressure valuations, especially for growth stocks.\n"
                "- **Economic Growth**: How GDP growth indicates corporate earnings potential and consumer demand.\n"
                "- **Inflation Effects**: How CPI trends affect corporate profit margins, pricing power, and real returns. "
                "Moderate inflation is healthy; high inflation pressures margins and triggers rate hikes.\n"
                "- **Employment & Consumer Spending**: How unemployment and retail sales indicate consumer health and spending power.\n"
                "- **Yield Curve**: Relationship between 2-year and 10-year treasury yields as recession indicator.\n\n"
                "Provide a comprehensive macroeconomic backdrop with clear, actionable implications for equity trading. "
                "Explain whether the current environment favors growth vs value stocks, cyclical vs defensive sectors. "
                "Do not simply list the data - provide insightful analysis of trends and trading implications."
                " Make sure to append a Markdown table at the end of the report to organize key points, well-structured and easy to read."
            )
        elif asset_class == "commodity":
            system_message = (
                "You are a macroeconomic analyst providing economic context for commodity trading decisions. "
                "Your role is to analyze key macroeconomic indicators and explain their implications for commodity markets.\n\n"
                "Use the available tool: get_economic_indicators(current_date) to retrieve comprehensive economic data "
                "including GDP, CPI (inflation), unemployment rate, federal funds rate, treasury yields, and retail sales.\n\n"
                "For COMMODITY markets, focus your analysis on:\n"
                "- **Economic Growth & Demand**: How GDP growth drives industrial demand for commodities (oil, metals, agriculture). "
                "Strong growth = higher commodity demand.\n"
                "- **Inflation Correlation**: How inflation trends correlate with commodity prices. Commodities often hedge inflation. "
                "Rising CPI often signals rising commodity prices.\n"
                "- **Dollar Strength**: How interest rates affect US dollar strength, which inversely impacts commodity prices "
                "(stronger dollar = lower commodity prices in dollar terms).\n"
                "- **Supply/Demand Dynamics**: How consumer spending (retail sales) and industrial activity drive commodity consumption.\n"
                "- **Central Bank Policy**: How Federal Reserve actions influence commodity investment flows and speculation.\n\n"
                "Provide comprehensive analysis of how the economic environment affects commodity supply, demand, and pricing. "
                "Explain which economic trends support bullish vs bearish commodity outlooks. "
                "Do not simply list the data - provide insightful analysis of trends and trading implications."
                " Make sure to append a Markdown table at the end of the report to organize key points, well-structured and easy to read."
            )
        else:  # crypto
            system_message = (
                "You are a macroeconomic analyst providing economic context for cryptocurrency trading decisions. "
                "Your role is to analyze key macroeconomic indicators and explain their implications for crypto markets.\n\n"
                "Use the available tool: get_economic_indicators(current_date) to retrieve comprehensive economic data "
                "including GDP, CPI (inflation), unemployment rate, federal funds rate, treasury yields, and retail sales.\n\n"
                "For CRYPTOCURRENCY markets, focus your analysis on:\n"
                "- **Risk Appetite & Rates**: How interest rates affect risk-on/risk-off sentiment. Higher rates typically reduce "
                "crypto appeal as safe assets yield more. Lower rates favor speculative assets like crypto.\n"
                "- **Inflation Hedge Narrative**: How inflation trends affect crypto's value proposition as inflation hedge. "
                "Bitcoin is often viewed as 'digital gold' during high inflation periods.\n"
                "- **Liquidity Conditions**: How Federal Reserve policy (tight vs loose) affects liquidity available for speculative assets.\n"
                "- **Economic Uncertainty**: How GDP volatility and employment trends affect safe-haven flows. Economic stability impacts "
                "crypto adoption vs flight to traditional safe havens.\n"
                "- **Dollar Dynamics**: How dollar strength from rate policy affects crypto (often inversely correlated).\n\n"
                "Provide comprehensive analysis of how the macroeconomic environment affects crypto market sentiment, adoption, "
                "and investment flows. Explain whether economic conditions favor crypto speculation or risk-off behavior. "
                "Do not simply list the data - provide insightful analysis of trends and trading implications."
                " Make sure to append a Markdown table at the end of the report to organize key points, well-structured and easy to read."
            )

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a helpful AI assistant, collaborating with other assistants."
                    " Use the provided tools to progress towards answering the question."
                    " If you are unable to fully answer, that's OK; another assistant with different tools"
                    " will help where you left off. Execute what you can to make progress."
                    " Do not make or imply trading recommendations (no BUY/SELL/HOLD). Focus strictly on macroeconomic analysis to inform downstream decision-makers."
                    " You have access to the following tools: {tool_names}.\n{system_message}"
                    "For your reference, the current date is {current_date}. We are analyzing {ticker} ({asset_class}).",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        prompt = prompt.partial(system_message=system_message)
        prompt = prompt.partial(tool_names=", ".join([tool.name for tool in tools]))
        prompt = prompt.partial(current_date=current_date)
        prompt = prompt.partial(ticker=ticker)
        prompt = prompt.partial(asset_class=asset_class.upper())

        chain = prompt | llm.bind_tools(tools)
        result = chain.invoke(state["messages"])

        report = ""

        if len(result.tool_calls) == 0:
            report = result.content

        return {
            "messages": [result],
            "macro_report": report,
        }

    return macro_analyst_node
