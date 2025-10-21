from langchain_core.tools import tool
from typing import Annotated
from tradingagents.dataflows.interface import route_to_vendor

@tool
def get_news(
    ticker: Annotated[str, "Ticker symbol"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """
    Retrieve news data for a given ticker symbol.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol
        start_date (str): Start date in yyyy-mm-dd format
        end_date (str): End date in yyyy-mm-dd format
    Returns:
        str: A formatted string containing news data
    """
    return route_to_vendor("get_news", ticker, start_date, end_date)

@tool
def get_global_news(
    curr_date: Annotated[str, "Current date in yyyy-mm-dd format"],
    look_back_days: Annotated[int, "Number of days to look back"] = 7,
    limit: Annotated[int, "Number of articles (leave unset to use configured default, typically 15-20)"] = None,
) -> str:
    """
    Retrieve global news data.
    DO NOT specify limit parameter - it will use the system-configured optimal value.
    Only override if you have a specific reason to fetch more/fewer articles.
    
    Args:
        curr_date (str): Current date in yyyy-mm-dd format
        look_back_days (int): Number of days to look back (default 7)
        limit (int): OPTIONAL - Number of articles (omit to use configured default)
    Returns:
        str: A formatted string containing global news data
    """
    # Use config default if not specified
    if limit is None:
        from tradingagents.dataflows.config import get_config
        limit = get_config().get("global_news_limit", 15)
    
    return route_to_vendor("get_global_news", curr_date, look_back_days, limit)

@tool
def get_commodity_news(
    commodity: Annotated[str, "Commodity symbol like BRENT, WTI, COPPER"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """
    Retrieve news data for a commodity (oil, metals, agriculture).
    Uses topic-based search since commodities don't have stock tickers.
    Searches news by relevant topics (energy, economy, etc.) and filters for the commodity.
    
    Args:
        commodity (str): Commodity symbol (e.g., "BRENT", "WTI", "COPPER")
        start_date (str): Start date in yyyy-mm-dd format
        end_date (str): End date in yyyy-mm-dd format
    Returns:
        str: A formatted string containing commodity-related news data
    """
    return route_to_vendor("get_commodity_news", commodity, start_date, end_date)

@tool
def get_crypto_news(
    crypto: Annotated[str, "Crypto symbol like BTC, ETH, SOL"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """
    Retrieve news data for a cryptocurrency (Bitcoin, Ethereum, etc.).
    Uses topic-based search since crypto doesn't have traditional stock tickers.
    Searches news by blockchain/technology topics and filters for the specific cryptocurrency.
    
    Args:
        crypto (str): Cryptocurrency symbol (e.g., "BTC", "ETH", "SOL")
        start_date (str): Start date in yyyy-mm-dd format
        end_date (str): End date in yyyy-mm-dd format
    Returns:
        str: A formatted string containing crypto-related news data
    """
    return route_to_vendor("get_crypto_news", crypto, start_date, end_date)

@tool
def get_insider_sentiment(
    ticker: Annotated[str, "ticker symbol for the company"],
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"],
) -> str:
    """
    Retrieve insider sentiment information about a company.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A report of insider sentiment data
    """
    return route_to_vendor("get_insider_sentiment", ticker, curr_date)

@tool
def get_insider_transactions(
    ticker: Annotated[str, "ticker symbol"],
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"],
) -> str:
    """
    Retrieve insider transaction information about a company.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A report of insider transaction data
    """
    return route_to_vendor("get_insider_transactions", ticker, curr_date)
