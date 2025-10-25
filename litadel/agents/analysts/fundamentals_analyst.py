from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from litadel.agents.utils.agent_utils import (
    get_balance_sheet,
    get_cashflow,
    get_earnings_estimates,
    get_fundamentals,
    get_income_statement,
)


def create_fundamentals_analyst(llm):
    def fundamentals_analyst_node(state):
        current_date = state["trade_date"]
        ticker = state["company_of_interest"]
        state["company_of_interest"]
        asset_class = state.get("asset_class", "equity")

        # Only use earnings estimates for equity (stocks)
        if asset_class == "equity":
            tools = [
                get_fundamentals,
                get_balance_sheet,
                get_cashflow,
                get_income_statement,
                get_earnings_estimates,
            ]

            system_message = (
                "You are a researcher tasked with analyzing fundamental information over the past week about a company. "
                "Please write a comprehensive report of the company's fundamental information such as financial documents, "
                "company profile, basic company financials, and company financial history to gain a full view of the company's "
                "fundamental information to inform traders. Make sure to include as much detail as possible. "
                "Do not simply state the trends are mixed, provide detailed and finegrained analysis and insights that may help traders make decisions."
                "\n\n**IMPORTANT: Analyze analyst earnings estimates** using `get_earnings_estimates(ticker)` to understand market expectations "
                "and identify potential beat/miss scenarios. Compare historical earnings surprises to gauge the company's track record of "
                "meeting or exceeding expectations. This forward-looking analysis is critical for trading decisions."
                "\n\nMake sure to append a Markdown table at the end of the report to organize key points in the report, organized and easy to read."
                " Use the available tools: `get_fundamentals` for comprehensive company analysis, `get_balance_sheet`, `get_cashflow`, "
                "`get_income_statement` for specific financial statements, and `get_earnings_estimates` for analyst expectations and consensus.",
            )
        else:
            # For commodities and crypto, fundamentals analyst doesn't make sense
            # Skip this analyst or provide minimal analysis
            tools = []
            system_message = (
                f"Fundamental analysis is not applicable for {asset_class} assets. "
                "This analyst will skip analysis for non-equity assets."
            )

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a helpful AI assistant, collaborating with other assistants."
                    " Use the provided tools to progress towards answering the question."
                    " If you are unable to fully answer, that's OK; another assistant with different tools"
                    " will help where you left off. Execute what you can to make progress."
                    " If you or any other assistant has the FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL** or deliverable,"
                    " prefix your response with FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL** so the team knows to stop."
                    " You have access to the following tools: {tool_names}.\n{system_message}"
                    "For your reference, the current date is {current_date}. The company we want to look at is {ticker}",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        prompt = prompt.partial(system_message=system_message)
        prompt = prompt.partial(tool_names=", ".join([tool.name for tool in tools]))
        prompt = prompt.partial(current_date=current_date)
        prompt = prompt.partial(ticker=ticker)

        chain = prompt | llm.bind_tools(tools)

        result = chain.invoke(state["messages"])

        report = ""

        if len(result.tool_calls) == 0:
            report = result.content

        return {
            "messages": [result],
            "fundamentals_report": report,
        }

    return fundamentals_analyst_node
