"""Alpha Vantage Economic Indicators API integration with smart caching."""

import json
from pathlib import Path

from .alpha_vantage_common import _make_api_request
from .cache_manager import SmartCache

# Initialize cache for economic data
_economic_cache_dir = Path(__file__).parent / "data_cache" / "economic"
_economic_cache = SmartCache(str(_economic_cache_dir))

# Default TTL values (in seconds)
DEFAULT_TTL = {
    "gdp": 90 * 24 * 3600,  # 90 days (quarterly release)
    "cpi": 30 * 24 * 3600,  # 30 days (monthly release)
    "unemployment": 30 * 24 * 3600,  # 30 days
    "federal_funds_rate": 30 * 24 * 3600,  # 30 days
    "treasury_yield": 24 * 3600,  # 1 day (daily data)
    "retail_sales": 30 * 24 * 3600,  # 30 days
}


def get_real_gdp(max_date: str | None = None) -> str:
    """
    Retrieve Real GDP data from Alpha Vantage with smart caching.

    IMPORTANT: Filters to only include data released on or before max_date.

    Args:
        max_date: Maximum date to include (YYYY-MM-DD). If None, includes all data.

    Returns:
        str: Formatted GDP data with recent trends
    """
    from datetime import datetime

    cache_key = "real_gdp_raw"  # Cache raw JSON data
    ttl = DEFAULT_TTL["gdp"]

    # Check cache first for raw data
    cached_response = _economic_cache.get_cached(cache_key, ttl)

    if cached_response:
        response = cached_response
    else:
        # Fetch from API only if not cached
        params = {"interval": "quarterly"}
        response = _make_api_request("REAL_GDP", params)
        # Cache the raw response
        _economic_cache.set_cached(cache_key, response, ttl)

    try:
        data = json.loads(response)

        # Format the data for LLM consumption
        if "data" in data:
            all_data = data["data"]

            # Filter by max_date if provided (prevent look-ahead bias)
            if max_date:
                max_dt = datetime.strptime(max_date, "%Y-%m-%d")
                all_data = [entry for entry in all_data if datetime.strptime(entry["date"], "%Y-%m-%d") <= max_dt]

            recent_data = all_data[:8]  # Last 2 years (8 quarters)

            formatted = "Real GDP (Quarterly, Billions of Dollars):\n\n"
            for entry in recent_data:
                formatted += f"  {entry['date']}: ${entry['value']} billion\n"

            # Calculate growth trend
            if len(recent_data) >= 2:
                latest = float(recent_data[0]["value"])
                previous = float(recent_data[1]["value"])
                growth = ((latest - previous) / previous) * 100
                formatted += f"\nLatest Quarter-over-Quarter Growth: {growth:.2f}%\n"

            return formatted
        return f"GDP data structure unexpected: {response[:500]}"

    except json.JSONDecodeError:
        return f"Error parsing GDP data: {response[:500]}"


def get_cpi(max_date: str | None = None) -> str:
    """
    Retrieve Consumer Price Index (CPI) data from Alpha Vantage with smart caching.

    IMPORTANT: Filters to only include data released on or before max_date.

    Args:
        max_date: Maximum date to include (YYYY-MM-DD). If None, includes all data.

    Returns:
        str: Formatted CPI data with inflation trends
    """
    from datetime import datetime

    cache_key = "cpi_raw"  # Cache raw JSON data
    ttl = DEFAULT_TTL["cpi"]

    # Check cache first for raw data
    cached_response = _economic_cache.get_cached(cache_key, ttl)

    if cached_response:
        response = cached_response
    else:
        # Fetch from API only if not cached
        params = {"interval": "monthly"}
        response = _make_api_request("CPI", params)
        # Cache the raw response
        _economic_cache.set_cached(cache_key, response, ttl)

    try:
        data = json.loads(response)

        if "data" in data:
            all_data = data["data"]

            # Filter by max_date if provided (prevent look-ahead bias)
            if max_date:
                max_dt = datetime.strptime(max_date, "%Y-%m-%d")
                all_data = [entry for entry in all_data if datetime.strptime(entry["date"], "%Y-%m-%d") <= max_dt]

            recent_data = all_data[:12]  # Last 12 months

            formatted = "Consumer Price Index (Monthly):\n\n"
            for entry in recent_data:
                formatted += f"  {entry['date']}: {entry['value']}\n"

            # Calculate year-over-year inflation
            if len(recent_data) >= 12:
                latest = float(recent_data[0]["value"])
                year_ago = float(recent_data[11]["value"])
                inflation = ((latest - year_ago) / year_ago) * 100
                formatted += f"\nYear-over-Year Inflation Rate: {inflation:.2f}%\n"

            return formatted
        return f"CPI data structure unexpected: {response[:500]}"

    except json.JSONDecodeError:
        return f"Error parsing CPI data: {response[:500]}"


def get_unemployment_rate(max_date: str | None = None) -> str:
    """
    Retrieve Unemployment Rate data from Alpha Vantage with smart caching.

    IMPORTANT: Filters to only include data released on or before max_date.

    Args:
        max_date: Maximum date to include (YYYY-MM-DD). If None, includes all data.

    Returns:
        str: Formatted unemployment rate data
    """
    from datetime import datetime

    cache_key = "unemployment_raw"  # Cache raw JSON data
    ttl = DEFAULT_TTL["unemployment"]

    # Check cache first for raw data
    cached_response = _economic_cache.get_cached(cache_key, ttl)

    if cached_response:
        response = cached_response
    else:
        # Fetch from API only if not cached
        params = {}
        response = _make_api_request("UNEMPLOYMENT", params)
        # Cache the raw response
        _economic_cache.set_cached(cache_key, response, ttl)

    try:
        data = json.loads(response)

        if "data" in data:
            all_data = data["data"]

            # Filter by max_date if provided (prevent look-ahead bias)
            if max_date:
                max_dt = datetime.strptime(max_date, "%Y-%m-%d")
                all_data = [entry for entry in all_data if datetime.strptime(entry["date"], "%Y-%m-%d") <= max_dt]

            recent_data = all_data[:12]  # Last 12 months

            formatted = "Unemployment Rate (Monthly, %):\n\n"
            for entry in recent_data:
                formatted += f"  {entry['date']}: {entry['value']}%\n"

            # Calculate trend
            if len(recent_data) >= 6:
                recent_avg = sum(float(d["value"]) for d in recent_data[:3]) / 3
                older_avg = sum(float(d["value"]) for d in recent_data[3:6]) / 3
                trend = "improving" if recent_avg < older_avg else "worsening"
                formatted += f"\nRecent Trend: {trend} (3-month avg: {recent_avg:.2f}%)\n"

            return formatted
        return f"Unemployment data structure unexpected: {response[:500]}"

    except json.JSONDecodeError:
        return f"Error parsing unemployment data: {response[:500]}"


def get_federal_funds_rate(max_date: str | None = None) -> str:
    """
    Retrieve Federal Funds Rate data from Alpha Vantage with smart caching.

    IMPORTANT: Filters to only include data released on or before max_date.

    Args:
        max_date: Maximum date to include (YYYY-MM-DD). If None, includes all data.

    Returns:
        str: Formatted federal funds rate data
    """
    from datetime import datetime

    cache_key = "federal_funds_rate_raw"  # Cache raw JSON data
    ttl = DEFAULT_TTL["federal_funds_rate"]

    # Check cache first for raw data
    cached_response = _economic_cache.get_cached(cache_key, ttl)

    if cached_response:
        response = cached_response
    else:
        # Fetch from API only if not cached
        params = {"interval": "monthly"}
        response = _make_api_request("FEDERAL_FUNDS_RATE", params)
        # Cache the raw response
        _economic_cache.set_cached(cache_key, response, ttl)

    try:
        data = json.loads(response)

        if "data" in data:
            all_data = data["data"]

            # Filter by max_date if provided (prevent look-ahead bias)
            if max_date:
                max_dt = datetime.strptime(max_date, "%Y-%m-%d")
                all_data = [entry for entry in all_data if datetime.strptime(entry["date"], "%Y-%m-%d") <= max_dt]

            recent_data = all_data[:12]  # Last 12 months

            formatted = "Federal Funds Rate (Monthly, %):\n\n"
            for entry in recent_data:
                formatted += f"  {entry['date']}: {entry['value']}%\n"

            # Analyze rate changes
            if len(recent_data) >= 2:
                latest = float(recent_data[0]["value"])
                previous = float(recent_data[1]["value"])
                change = latest - previous

                if abs(change) > 0.01:
                    direction = "increased" if change > 0 else "decreased"
                    formatted += f"\nRecent Change: {direction} by {abs(change):.2f}%\n"
                else:
                    formatted += f"\nRecent Change: Unchanged at {latest:.2f}%\n"

            return formatted
        return f"Federal Funds Rate data structure unexpected: {response[:500]}"

    except json.JSONDecodeError:
        return f"Error parsing federal funds rate data: {response[:500]}"


def get_treasury_yield(maturity: str = "10year", max_date: str | None = None) -> str:
    """
    Retrieve Treasury Yield data from Alpha Vantage with smart caching.

    IMPORTANT: Filters to only include data released on or before max_date.

    Args:
        maturity: Treasury maturity (10year, 2year, 5year, 7year, 30year)
        max_date: Maximum date to include (YYYY-MM-DD). If None, includes all data.

    Returns:
        str: Formatted treasury yield data
    """
    from datetime import datetime

    cache_key = f"treasury_yield_{maturity}_raw"  # Cache raw JSON data
    ttl = DEFAULT_TTL["treasury_yield"]

    # Check cache first for raw data
    cached_response = _economic_cache.get_cached(cache_key, ttl)

    if cached_response:
        response = cached_response
    else:
        # Fetch from API only if not cached
        params = {"interval": "monthly", "maturity": maturity}
        response = _make_api_request("TREASURY_YIELD", params)
        # Cache the raw response
        _economic_cache.set_cached(cache_key, response, ttl)

    try:
        data = json.loads(response)

        if "data" in data:
            all_data = data["data"]

            # Filter by max_date if provided (prevent look-ahead bias)
            if max_date:
                max_dt = datetime.strptime(max_date, "%Y-%m-%d")
                all_data = [entry for entry in all_data if datetime.strptime(entry["date"], "%Y-%m-%d") <= max_dt]

            recent_data = all_data[:6]  # Last 6 months

            formatted = f"Treasury Yield - {maturity.upper()} (Monthly, %):\n\n"
            for entry in recent_data:
                formatted += f"  {entry['date']}: {entry['value']}%\n"

            # Calculate trend
            if len(recent_data) >= 2:
                latest = float(recent_data[0]["value"])
                month_ago = float(recent_data[1]["value"])
                change = latest - month_ago
                direction = "up" if change > 0 else "down"
                formatted += f"\nMonthly Change: {abs(change):.2f}% {direction}\n"

            return formatted
        return f"Treasury yield data structure unexpected: {response[:500]}"

    except json.JSONDecodeError:
        return f"Error parsing treasury yield data: {response[:500]}"


def get_retail_sales(max_date: str | None = None) -> str:
    """
    Retrieve Retail Sales data from Alpha Vantage with smart caching.

    IMPORTANT: Filters to only include data released on or before max_date.

    Args:
        max_date: Maximum date to include (YYYY-MM-DD). If None, includes all data.

    Returns:
        str: Formatted retail sales data
    """
    from datetime import datetime

    cache_key = "retail_sales_raw"  # Cache raw JSON data
    ttl = DEFAULT_TTL["retail_sales"]

    # Check cache first for raw data
    cached_response = _economic_cache.get_cached(cache_key, ttl)

    if cached_response:
        response = cached_response
    else:
        # Fetch from API only if not cached
        params = {}
        response = _make_api_request("RETAIL_SALES", params)
        # Cache the raw response
        _economic_cache.set_cached(cache_key, response, ttl)

    try:
        data = json.loads(response)

        if "data" in data:
            all_data = data["data"]

            # Filter by max_date if provided (prevent look-ahead bias)
            if max_date:
                max_dt = datetime.strptime(max_date, "%Y-%m-%d")
                all_data = [entry for entry in all_data if datetime.strptime(entry["date"], "%Y-%m-%d") <= max_dt]

            recent_data = all_data[:12]  # Last 12 months

            formatted = "Retail Sales (Monthly, Millions of Dollars):\n\n"
            for entry in recent_data:
                formatted += f"  {entry['date']}: ${entry['value']} million\n"

            # Calculate year-over-year growth
            if len(recent_data) >= 12:
                latest = float(recent_data[0]["value"])
                year_ago = float(recent_data[11]["value"])
                growth = ((latest - year_ago) / year_ago) * 100
                formatted += f"\nYear-over-Year Growth: {growth:.2f}%\n"

            return formatted
        return f"Retail sales data structure unexpected: {response[:500]}"

    except json.JSONDecodeError:
        return f"Error parsing retail sales data: {response[:500]}"


def get_all_economic_indicators(max_date: str | None = None) -> str:
    """
    Retrieve all key economic indicators in one consolidated report.

    IMPORTANT: Filters economic data to only include indicators released on or before max_date
    to prevent look-ahead bias in backtesting.

    Args:
        max_date: Maximum date to include data for (YYYY-MM-DD). If None, includes all data.

    Returns:
        str: Comprehensive economic indicators report
    """
    report = "=== MACROECONOMIC INDICATORS REPORT ===\n"

    if max_date:
        report += f"(Data as of {max_date})\n"
    report += "\n"

    report += "1. ECONOMIC GROWTH\n" + "=" * 50 + "\n"
    report += get_real_gdp(max_date) + "\n\n"

    report += "2. INFLATION\n" + "=" * 50 + "\n"
    report += get_cpi(max_date) + "\n\n"

    report += "3. LABOR MARKET\n" + "=" * 50 + "\n"
    report += get_unemployment_rate(max_date) + "\n\n"

    report += "4. MONETARY POLICY\n" + "=" * 50 + "\n"
    report += get_federal_funds_rate(max_date) + "\n\n"

    report += "5. INTEREST RATES\n" + "=" * 50 + "\n"
    report += get_treasury_yield("10year", max_date) + "\n"
    report += get_treasury_yield("2year", max_date) + "\n\n"

    report += "6. CONSUMER SPENDING\n" + "=" * 50 + "\n"
    report += get_retail_sales(max_date) + "\n"

    return report
