from .alpha_vantage_common import _make_api_request, format_datetime_for_api

# Map commodity symbols to Alpha Vantage NEWS_SENTIMENT topics
COMMODITY_TOPIC_MAP = {
    # Energy commodities
    "WTI": "energy",
    "BRENT": "energy",
    "NATURAL_GAS": "energy",
    
    # Metals
    "COPPER": "technology",  # Copper is heavily used in tech/manufacturing
    "ALUMINUM": "technology",
    
    # Agriculture
    "WHEAT": "economy_macro",  # Agriculture affects macro economy
    "CORN": "economy_macro",
    "SUGAR": "economy_macro",
    "COTTON": "economy_macro",
    "COFFEE": "economy_macro",
}

# Map commodities to search keywords for better context
COMMODITY_KEYWORDS = {
    "WTI": "WTI crude oil",
    "BRENT": "Brent crude oil",
    "NATURAL_GAS": "natural gas",
    "COPPER": "copper commodity",
    "ALUMINUM": "aluminum commodity",
    "WHEAT": "wheat commodity",
    "CORN": "corn commodity",
    "SUGAR": "sugar commodity",
    "COTTON": "cotton commodity",
    "COFFEE": "coffee commodity",
}

# Map crypto symbols to Alpha Vantage NEWS_SENTIMENT topics
CRYPTO_TOPIC_MAP = {
    # Major cryptocurrencies - use blockchain/technology topics
    "BTC": "blockchain",
    "ETH": "blockchain",
    "BNB": "blockchain",
    "XRP": "blockchain",
    "ADA": "blockchain",
    "SOL": "blockchain",
    "DOGE": "blockchain",
    "DOT": "blockchain",
    "MATIC": "blockchain",
    "AVAX": "blockchain",
    "LINK": "blockchain",
    "UNI": "blockchain",
    "ATOM": "blockchain",
    "LTC": "blockchain",
    "BCH": "blockchain",
    "XLM": "blockchain",
    "ALGO": "blockchain",
    "VET": "blockchain",
    "ICP": "blockchain",
    "FIL": "blockchain",
}

# Map crypto symbols to search keywords for better news filtering
CRYPTO_KEYWORDS = {
    "BTC": "Bitcoin BTC cryptocurrency",
    "ETH": "Ethereum ETH cryptocurrency",
    "BNB": "Binance Coin BNB",
    "XRP": "Ripple XRP",
    "ADA": "Cardano ADA",
    "SOL": "Solana SOL",
    "DOGE": "Dogecoin DOGE",
    "DOT": "Polkadot DOT",
    "MATIC": "Polygon MATIC",
    "AVAX": "Avalanche AVAX",
    "LINK": "Chainlink LINK",
    "UNI": "Uniswap UNI",
    "ATOM": "Cosmos ATOM",
    "LTC": "Litecoin LTC",
    "BCH": "Bitcoin Cash BCH",
    "XLM": "Stellar XLM",
    "ALGO": "Algorand ALGO",
    "VET": "VeChain VET",
    "ICP": "Internet Computer ICP",
    "FIL": "Filecoin FIL",
}


def get_news(ticker, start_date, end_date) -> dict[str, str] | str:
    """Returns live and historical market news & sentiment data from premier news outlets worldwide.

    Covers stocks, cryptocurrencies, forex, and topics like fiscal policy, mergers & acquisitions, IPOs.

    Args:
        ticker: Stock symbol for news articles.
        start_date: Start date for news search.
        end_date: End date for news search.

    Returns:
        Dictionary containing news sentiment data or JSON string.
    """

    params = {
        "tickers": ticker,
        "time_from": format_datetime_for_api(start_date),
        "time_to": format_datetime_for_api(end_date),
        "sort": "LATEST",
        "limit": "50",
    }
    
    return _make_api_request("NEWS_SENTIMENT", params)


def get_commodity_news(commodity: str, start_date: str, end_date: str) -> dict[str, str] | str:
    """Returns news data for commodities using topic-based search.
    
    Since Alpha Vantage NEWS_SENTIMENT doesn't support commodity symbols directly,
    this function uses the 'topics' parameter to find relevant news.
    
    Args:
        commodity: Commodity symbol (e.g., "BRENT", "WTI", "COPPER")
        start_date: Start date for news search.
        end_date: End date for news search.
    
    Returns:
        Dictionary containing news sentiment data or JSON string.
    """
    commodity_upper = commodity.upper()
    topic = COMMODITY_TOPIC_MAP.get(commodity_upper, "economy_macro")
    keyword = COMMODITY_KEYWORDS.get(commodity_upper, commodity)
    
    # Use topics parameter instead of tickers for commodities
    from .config import get_config
    limit = get_config().get("commodity_news_limit", 50)
    
    params = {
        "topics": topic,
        "time_from": format_datetime_for_api(start_date),
        "time_to": format_datetime_for_api(end_date),
        "sort": "LATEST",
        "limit": str(limit),  # Get more results to filter for commodity-specific news
    }
    
    result = _make_api_request("NEWS_SENTIMENT", params)
    
    # Add metadata to help the LLM understand this is commodity-filtered news
    import json
    try:
        data = json.loads(result) if isinstance(result, str) else result
        if isinstance(data, dict) and "feed" in data:
            # Add a note about the commodity and topic used
            data["_commodity_context"] = {
                "commodity": commodity,
                "topic": topic,
                "keyword_filter": keyword,
                "note": f"News filtered by topic '{topic}'. Look for articles mentioning '{keyword}' for most relevant results."
            }
            return json.dumps(data)
    except (json.JSONDecodeError, TypeError):
        pass
    
    return result


def get_crypto_news(crypto: str, start_date: str, end_date: str) -> dict[str, str] | str:
    """Returns news data for cryptocurrencies using Alpha Vantage ticker format.
    
    Alpha Vantage supports crypto-specific tickers in the format CRYPTO:BTC.
    
    Args:
        crypto: Cryptocurrency symbol (e.g., "BTC", "ETH", "SOL")
        start_date: Start date for news search.
        end_date: End date for news search.
    
    Returns:
        Dictionary containing news sentiment data or JSON string.
    """
    crypto_upper = crypto.upper()
    
    # Use CRYPTO:XXX ticker format
    ticker = f"CRYPTO:{crypto_upper}"
    
    from .config import get_config
    limit = get_config().get("commodity_news_limit", 50)
    
    params = {
        "tickers": ticker,
        "time_from": format_datetime_for_api(start_date),
        "time_to": format_datetime_for_api(end_date),
        "sort": "LATEST",
        "limit": str(limit),
    }
    
    result = _make_api_request("NEWS_SENTIMENT", params)
    
    # Add metadata to help the LLM understand this is crypto-filtered news
    import json
    try:
        data = json.loads(result) if isinstance(result, str) else result
        if isinstance(data, dict) and "feed" in data:
            keyword = CRYPTO_KEYWORDS.get(crypto_upper, f"{crypto} cryptocurrency")
            data["_crypto_context"] = {
                "cryptocurrency": crypto,
                "ticker_used": ticker,
                "keyword_filter": keyword,
                "note": f"News filtered by ticker '{ticker}'. Articles tagged with {ticker}."
            }
            return json.dumps(data)
    except (json.JSONDecodeError, TypeError):
        pass
    
    return result


def get_insider_transactions(symbol: str) -> dict[str, str] | str:
    """Returns latest and historical insider transactions by key stakeholders.

    Covers transactions by founders, executives, board members, etc.

    Args:
        symbol: Ticker symbol. Example: "IBM".

    Returns:
        Dictionary containing insider transaction data or JSON string.
    """

    params = {
        "symbol": symbol,
    }

    return _make_api_request("INSIDER_TRANSACTIONS", params)