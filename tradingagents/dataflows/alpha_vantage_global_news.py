"""Global news fetcher using Alpha Vantage NEWS_SENTIMENT with topics."""

from .alpha_vantage_common import _make_api_request, format_datetime_for_api
from datetime import datetime, timedelta


def get_global_news_alpha_vantage(curr_date: str, look_back_days: int = 7, limit: int = 15) -> str:
    """
    Fetch global macroeconomic news using Alpha Vantage NEWS_SENTIMENT.
    
    Uses broad topics to get general market and economic news.
    
    Args:
        curr_date: Current date in YYYY-mm-dd format
        look_back_days: Number of days to look back (default 7)
        limit: Number of articles to return (default 15)
    
    Returns:
        JSON string with news articles
    """
    # Calculate start date
    curr_dt = datetime.strptime(curr_date, "%Y-%m-%d")
    start_dt = curr_dt - timedelta(days=look_back_days)
    start_date = start_dt.strftime("%Y-%m-%d")
    
    # Use broad topics for global news
    # Combine multiple topics: economy_macro, finance, earnings, ipo, mergers_and_acquisitions
    topics = "economy_macro,finance,earnings"
    
    params = {
        "topics": topics,
        "time_from": format_datetime_for_api(start_date),
        "time_to": format_datetime_for_api(curr_date),
        "sort": "LATEST",
        "limit": str(limit),
    }
    
    return _make_api_request("NEWS_SENTIMENT", params)

