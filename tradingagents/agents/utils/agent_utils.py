from langchain_core.messages import HumanMessage, RemoveMessage

# Import tools from separate utility files
from tradingagents.agents.utils.core_stock_tools import (
    get_stock_data
)
# Note: get_indicators is imported from unified_market_tools (see below)
# The old technical_indicators_tools version is deprecated
from tradingagents.agents.utils.fundamental_data_tools import (
    get_fundamentals,
    get_balance_sheet,
    get_cashflow,
    get_income_statement
)
from tradingagents.agents.utils.news_data_tools import (
    get_news,
    get_commodity_news,
    get_crypto_news,
    get_insider_sentiment,
    get_insider_transactions,
    get_global_news
)
from tradingagents.agents.utils.crypto_data_tools import (
    get_crypto_data
)
# Unified tools provide a consistent interface across asset classes
from tradingagents.agents.utils.unified_market_tools import (
    get_market_data,
    get_asset_news,
    get_indicators,  # Uses new unified signature with adapter for old vendor implementations
    get_global_news as get_global_news_unified,
)

def create_msg_delete():
    def delete_messages(state):
        """Clear messages and add placeholder for Anthropic compatibility"""
        messages = state["messages"]
        
        # Remove all messages
        removal_operations = [RemoveMessage(id=m.id) for m in messages]
        
        # Add a minimal placeholder message
        placeholder = HumanMessage(content="Continue")
        
        return {"messages": removal_operations + [placeholder]}
    
    return delete_messages


        