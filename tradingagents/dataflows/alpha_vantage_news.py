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
    params = {
        "topics": topic,
        "time_from": format_datetime_for_api(start_date),
        "time_to": format_datetime_for_api(end_date),
        "sort": "LATEST",
        "limit": "50",  # Get more results to filter for commodity-specific news
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