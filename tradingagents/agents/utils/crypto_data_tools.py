"""Cryptocurrency data tools for LangChain agents."""

from langchain_core.tools import tool
from typing import Annotated
from tradingagents.dataflows.interface import route_to_vendor


@tool
def get_crypto_data(
    symbol: Annotated[str, "Crypto symbol like BTC, ETH, SOL, BNB"],
    start_date: Annotated[str, "Start date in YYYY-mm-dd format"],
    end_date: Annotated[str, "End date in YYYY-mm-dd format"],
    market: Annotated[str, "Market currency like USD, EUR"] = "USD",
) -> str:
    """
    Retrieve cryptocurrency OHLCV (Open, High, Low, Close, Volume) price data.
    
    This tool fetches historical cryptocurrency price data for analysis.
    Supports major cryptocurrencies like Bitcoin (BTC), Ethereum (ETH), Solana (SOL), etc.
    
    Args:
        symbol: Cryptocurrency symbol (e.g., "BTC", "ETH", "SOL")
        start_date: Start date in YYYY-mm-dd format
        end_date: End date in YYYY-mm-dd format
        market: Market currency (default "USD", can also be "EUR", "GBP")
    
    Returns:
        CSV string with columns: time,open,high,low,close,volume
    
    Example:
        get_crypto_data("BTC", "2025-01-01", "2025-01-31", "USD")
    """
    return route_to_vendor("get_crypto_data", symbol, start_date, end_date, market)

