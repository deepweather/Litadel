"""
Unified tools for market data and news that work across all asset classes.
These tools automatically route to the correct vendor implementation based on asset class.
"""

from langchain_core.tools import tool
from typing import Annotated, Optional
from tradingagents.dataflows.interface import route_to_vendor


@tool
def get_market_data(
    symbol: Annotated[str, "Asset symbol (AAPL for stocks, BRENT for commodities, BTC for crypto)"],
    start_date: Annotated[str, "Start date in YYYY-mm-dd format"],
    end_date: Annotated[str, "End date in YYYY-mm-dd format"],
    asset_class: Annotated[str, "Asset class: equity, commodity, or crypto"] = "equity",
    interval: Annotated[str, "Data interval: daily, weekly, or monthly (for commodities)"] = "daily",
    market: Annotated[str, "Market currency for crypto (USD, EUR, etc.)"] = "USD",
) -> str:
    """
    Retrieve price data for any asset: stocks, commodities, or cryptocurrencies.
    Automatically routes to the appropriate data source based on asset class.
    
    For stocks: Returns OHLCV data (interval is ignored for stocks)
    For commodities: Returns price data from Alpha Vantage commodity API
    For crypto: Returns OHLCV data with specified market currency
    
    Args:
        symbol: Ticker or symbol (e.g., "AAPL", "BRENT", "BTC")
        start_date: Start date in YYYY-mm-dd format
        end_date: End date in YYYY-mm-dd format
        asset_class: The type of asset (equity, commodity, crypto)
        interval: Data interval (daily, weekly, monthly) - only used for commodities
        market: Market currency for crypto pairs (default: USD) - only used for crypto
    
    Returns:
        CSV-formatted price data with appropriate columns for the asset type
    """
    if asset_class == "crypto":
        return route_to_vendor("get_crypto_data", symbol, start_date, end_date, market)
    elif asset_class == "commodity":
        return route_to_vendor("get_commodity_data", symbol, start_date, end_date, interval)
    else:  # equity
        # Stock data functions only take 3 params (no interval)
        return route_to_vendor("get_stock_data", symbol, start_date, end_date)


@tool
def get_indicators(
    symbol: Annotated[str, "Stock ticker symbol"],
    start_date: Annotated[str, "Start date in YYYY-mm-dd format"],
    end_date: Annotated[str, "End date in YYYY-mm-dd format"],
    indicators: Annotated[str, "Comma-separated list of indicators (sma_20, rsi, macd, etc.)"],
) -> str:
    """
    Calculate technical indicators for stock data.
    Note: Currently only supported for equities.
    
    Supported indicators: sma_X, ema_X, rsi, macd, boll (Bollinger Bands), adx, cci, stoch
    
    Args:
        symbol: Stock ticker symbol
        start_date: Start date in YYYY-mm-dd format
        end_date: End date in YYYY-mm-dd format
        indicators: Comma-separated list of indicator names
    
    Returns:
        CSV-formatted data with requested technical indicators
    """
    # Indicators are equity-specific for now
    return route_to_vendor("get_indicators", symbol, start_date, end_date, indicators)


@tool
def get_asset_news(
    symbol: Annotated[str, "Asset symbol (AAPL for stocks, BRENT for commodities, BTC for crypto)"],
    start_date: Annotated[str, "Start date in YYYY-mm-dd format"],
    end_date: Annotated[str, "End date in YYYY-mm-dd format"],
    asset_class: Annotated[str, "Asset class: equity, commodity, or crypto"] = "equity",
) -> str:
    """
    Retrieve news and sentiment data for any asset type.
    Automatically routes to the appropriate news source based on asset class.
    
    For stocks: Returns ticker-specific news from financial outlets
    For commodities: Returns topic-based news (energy, metals, agriculture)
    For crypto: Returns blockchain/technology news filtered for the specific cryptocurrency
    
    Args:
        symbol: Ticker or symbol
        start_date: Start date in YYYY-mm-dd format
        end_date: End date in YYYY-mm-dd format
        asset_class: The type of asset (equity, commodity, crypto)
    
    Returns:
        JSON-formatted news articles with sentiment scores and metadata
    """
    if asset_class == "crypto":
        return route_to_vendor("get_crypto_news", symbol, start_date, end_date)
    elif asset_class == "commodity":
        return route_to_vendor("get_commodity_news", symbol, start_date, end_date)
    else:  # equity
        return route_to_vendor("get_news", symbol, start_date, end_date)


@tool
def get_global_news(
    curr_date: Annotated[str, "Current date in YYYY-mm-dd format"],
    look_back_days: Annotated[int, "Number of days to look back"] = 7,
    limit: Annotated[Optional[int], "Maximum number of articles (omit to use configured default)"] = None,
) -> str:
    """
    Retrieve global macroeconomic and financial market news.
    
    IMPORTANT: Do NOT specify the 'limit' parameter - omit it to use the configured default.
    The system is configured with an optimal limit based on data source performance.
    
    Args:
        curr_date: Current date in YYYY-mm-dd format
        look_back_days: Number of days to look back (default: 7)
        limit: Leave this parameter unset to use the configured default
    
    Returns:
        JSON-formatted global news articles about macro trends, markets, and economy
    """
    from tradingagents.dataflows.config import get_config
    
    if limit is None:
        limit = get_config().get("global_news_limit", 15)
    
    return route_to_vendor("get_global_news", curr_date, look_back_days, limit)

