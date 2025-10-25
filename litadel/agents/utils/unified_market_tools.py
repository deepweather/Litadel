"""
Unified tools for market data and news that work across all asset classes.
These tools automatically route to the correct vendor implementation based on asset class.

IMPORTANT: All tools include date validation to prevent look-ahead bias in backtesting.
"""

from typing import Annotated

from langchain_core.tools import tool

from litadel.dataflows.date_validator import validate_date_bounds
from litadel.dataflows.interface import route_to_vendor


@tool
def get_market_data(
    symbol: Annotated[str, "Asset symbol (AAPL for stocks, BRENT for commodities, BTC for crypto)"],
    start_date: Annotated[str, "Start date in YYYY-mm-dd format"],
    end_date: Annotated[str, "End date in YYYY-mm-dd format"],
    asset_class: Annotated[str, "Asset class: equity, commodity, or crypto"] = "equity",
    interval: Annotated[str, "Data interval: daily, weekly, or monthly (for commodities)"] = "daily",
    market: Annotated[str, "Market currency for crypto (USD, EUR, etc.)"] = "USD",
    max_date: Annotated[str | None, "Maximum date for backtesting (INTERNAL - set by system)"] = None,
) -> str:
    """
    Retrieve price data for any asset: stocks, commodities, or cryptocurrencies.
    Automatically routes to the appropriate data source based on asset class.

    IMPORTANT: Date validation is enforced to prevent look-ahead bias in backtesting.
    The end_date cannot exceed the current analysis date.

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
        max_date: Internal parameter used by the system for date validation

    Returns:
        CSV-formatted price data with appropriate columns for the asset type

    Raises:
        LookAheadBiasError: If end_date exceeds max_date (when max_date is set)
    """
    # Validate dates to prevent look-ahead bias (if max_date is provided by the system)
    if max_date:
        validate_date_bounds(start_date, end_date, max_date, "get_market_data")

    if asset_class == "crypto":
        return route_to_vendor("get_crypto_data", symbol, start_date, end_date, market)
    if asset_class == "commodity":
        return route_to_vendor("get_commodity_data", symbol, start_date, end_date, interval)
    # equity
    # Stock data functions only take 3 params (no interval)
    return route_to_vendor("get_stock_data", symbol, start_date, end_date)


@tool
def get_indicators(
    symbol: Annotated[str, "Stock ticker symbol"],
    start_date: Annotated[str, "Start date in YYYY-mm-dd format"],
    end_date: Annotated[str, "End date in YYYY-mm-dd format"],
    indicators: Annotated[str, "Comma-separated list of indicators (sma_20, rsi, macd, etc.)"],
    max_date: Annotated[str | None, "Maximum date for backtesting (INTERNAL - set by system)"] = None,
) -> str:
    """
    Calculate technical indicators for stock data.
    Note: Currently only supported for equities.

    IMPORTANT: Date validation is enforced to prevent look-ahead bias in backtesting.
    The end_date cannot exceed the current analysis date.

    Supported indicators: sma_X, ema_X, rsi, macd, boll (Bollinger Bands), adx, cci, stoch

    Args:
        symbol: Stock ticker symbol
        start_date: Start date in YYYY-mm-dd format
        end_date: End date in YYYY-mm-dd format
        indicators: Comma-separated list of indicator names
        max_date: Internal parameter used by the system for date validation

    Returns:
        CSV-formatted data with requested technical indicators

    Raises:
        LookAheadBiasError: If end_date exceeds max_date (when max_date is set)
    """
    # Validate dates to prevent look-ahead bias (if max_date is provided by the system)
    if max_date:
        validate_date_bounds(start_date, end_date, max_date, "get_indicators")

    # Adapter: Translate new unified signature to old vendor signature
    # Old signature: (symbol, indicator, curr_date, look_back_days)
    # New signature: (symbol, start_date, end_date, indicators)

    from datetime import datetime

    # Calculate look_back_days from date range
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    look_back_days = (end_dt - start_dt).days

    # Parse comma-separated indicators
    indicator_list = [ind.strip() for ind in indicators.split(",")]

    # Call vendor for each indicator and combine results
    results = []
    for indicator in indicator_list:
        if indicator:  # Skip empty strings
            result = route_to_vendor("get_indicators", symbol, indicator, end_date, look_back_days)
            results.append(result)

    # Combine results with separators
    if len(results) == 1:
        return results[0]
    return "\n\n" + "=" * 80 + "\n\n".join(results)


@tool
def get_asset_news(
    symbol: Annotated[str, "Asset symbol (AAPL for stocks, BRENT for commodities, BTC for crypto)"],
    start_date: Annotated[str, "Start date in YYYY-mm-dd format"],
    end_date: Annotated[str, "End date in YYYY-mm-dd format"],
    asset_class: Annotated[str, "Asset class: equity, commodity, or crypto"] = "equity",
    max_date: Annotated[str | None, "Maximum date for backtesting (INTERNAL - set by system)"] = None,
) -> str:
    """
    Retrieve news and sentiment data for any asset type.
    Automatically routes to the appropriate news source based on asset class.

    IMPORTANT: Date validation is enforced to prevent look-ahead bias in backtesting.
    The end_date cannot exceed the current analysis date.

    For stocks: Returns ticker-specific news from financial outlets
    For commodities: Returns topic-based news (energy, metals, agriculture)
    For crypto: Returns blockchain/technology news filtered for the specific cryptocurrency

    Args:
        symbol: Ticker or symbol
        start_date: Start date in YYYY-mm-dd format
        end_date: End date in YYYY-mm-dd format
        asset_class: The type of asset (equity, commodity, crypto)
        max_date: Internal parameter used by the system for date validation

    Returns:
        JSON-formatted news articles with sentiment scores and metadata

    Raises:
        LookAheadBiasError: If end_date exceeds max_date (when max_date is set)
    """
    # Validate dates to prevent look-ahead bias (if max_date is provided by the system)
    if max_date:
        validate_date_bounds(start_date, end_date, max_date, "get_asset_news")

    if asset_class == "crypto":
        return route_to_vendor("get_crypto_news", symbol, start_date, end_date)
    if asset_class == "commodity":
        return route_to_vendor("get_commodity_news", symbol, start_date, end_date)
    # equity
    return route_to_vendor("get_news", symbol, start_date, end_date)


@tool
def get_global_news(
    curr_date: Annotated[str, "Current date in YYYY-mm-dd format"],
    look_back_days: Annotated[int, "Number of days to look back"] = 7,
    limit: Annotated[int | None, "Maximum number of articles (omit to use configured default)"] = None,
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
    from litadel.dataflows.config import get_config

    if limit is None:
        limit = get_config().get("global_news_limit", 15)

    return route_to_vendor("get_global_news", curr_date, look_back_days, limit)
