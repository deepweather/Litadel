from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import time
import json
from tradingagents.agents.utils.agent_utils import get_news, get_commodity_news, get_global_news
from tradingagents.dataflows.config import get_config


def create_social_media_analyst(llm):
    def social_media_analyst_node(state):
        current_date = state["trade_date"]
        ticker = state["company_of_interest"]
        asset_class = state.get("asset_class", "equity")
        is_commodity = asset_class.lower() == "commodity"

        # Branch tools based on asset class
        if is_commodity:
            tools = [
                get_commodity_news,
                get_global_news,
            ]
            system_message = (
                f"You are a social media and news researcher/analyst tasked with analyzing recent discussions and sentiment for the commodity {ticker}. "
                "Your objective is to write a comprehensive report detailing market sentiment, trader discussions, and public perception over the past week. "
                "Use get_commodity_news(commodity, start_date, end_date) to search for commodity-related news and discussions (searches by topic like 'energy' for oil). "
                "IMPORTANT: If get_commodity_news returns limited results, supplement with get_global_news(curr_date, look_back_days, limit) for broader market context. "
                "Focus on trader sentiment, supply/demand expectations, geopolitical concerns, and market psychology. "
                "Do not simply state the trends are mixed, provide detailed and fine-grained analysis."
                + """ Make sure to append a Markdown table at the end of the report to organize key points."""
            )
        else:
            tools = [
                get_news,
                get_global_news,
            ]
            system_message = (
                "You are a social media and company specific news researcher/analyst tasked with analyzing social media posts, recent company news, and public sentiment for a specific company over the past week. "
                "Your objective is to write a comprehensive long report detailing your analysis, insights, and implications for traders and investors on this company's current state after looking at social media and what people are saying about that company, "
                "analyzing sentiment data of what people feel each day about the company, and looking at recent company news. "
                "Use the get_news(ticker, start_date, end_date) tool to search for company-specific news and social media discussions. "
                "If needed, use get_global_news(curr_date, look_back_days, limit) for broader market context. "
                "Try to look at all sources possible from social media to sentiment to news. Do not simply state the trends are mixed, provide detailed and fine-grained analysis and insights that may help traders make decisions."
                + """ Make sure to append a Markdown table at the end of the report to organize key points in the report, organized and easy to read."""
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
                    "For your reference, the current date is {current_date}. The current company we want to analyze is {ticker}",
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
            "sentiment_report": report,
        }

    return social_media_analyst_node
