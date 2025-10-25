"""Alpha Intelligence™ features: earnings estimates, market movers, and analytics."""

import json
from pathlib import Path

from .alpha_vantage_common import _make_api_request
from .cache_manager import SmartCache

# Initialize cache for intelligence data
_intelligence_cache_dir = Path(__file__).parent / "data_cache" / "intelligence"
_intelligence_cache = SmartCache(str(_intelligence_cache_dir))

# TTL for earnings estimates (7 days)
EARNINGS_ESTIMATES_TTL = 7 * 24 * 3600


def get_earnings_estimates(ticker: str) -> str:
    """
    Retrieve analyst earnings estimates for a given ticker.

    Args:
        ticker: Stock ticker symbol

    Returns:
        str: Formatted earnings estimates with consensus and revisions
    """
    cache_key = f"earnings_estimates_{ticker}"
    ttl = EARNINGS_ESTIMATES_TTL

    # Check cache first
    cached_data = _intelligence_cache.get_cached(cache_key, ttl)
    if cached_data:
        return cached_data

    # Fetch from API - Using EARNINGS function which includes estimates
    params = {"symbol": ticker}
    response = _make_api_request("EARNINGS", params)

    try:
        data = json.loads(response)

        formatted = f"Earnings Estimates for {ticker.upper()}:\n\n"

        # Check for quarterly earnings data
        if "quarterlyEarnings" in data:
            quarterly = data["quarterlyEarnings"][:4]  # Last 4 quarters

            formatted += "Recent Quarterly Earnings:\n"
            for q in quarterly:
                fiscal_date = q.get("fiscalDateEnding", "N/A")
                reported_eps = q.get("reportedEPS", "N/A")
                estimated_eps = q.get("estimatedEPS", "N/A")
                surprise = q.get("surprise", "N/A")
                surprise_pct = q.get("surprisePercentage", "N/A")

                formatted += f"\n  Quarter: {fiscal_date}\n"
                formatted += f"    Reported EPS: ${reported_eps}\n"
                formatted += f"    Estimated EPS: ${estimated_eps}\n"

                if surprise != "N/A" and surprise_pct != "N/A":
                    try:
                        surprise_val = float(surprise)
                        surprise_pct_val = float(surprise_pct)
                        beat_miss = "Beat" if surprise_val > 0 else "Miss"
                        formatted += f"    Surprise: ${surprise_val:.2f} ({surprise_pct_val:.2f}%) - {beat_miss}\n"
                    except (ValueError, TypeError):
                        formatted += f"    Surprise: {surprise} ({surprise_pct}%)\n"

            # Calculate beat/miss rate
            beats = sum(1 for q in quarterly if q.get("surprise") and float(q.get("surprise", 0)) > 0)
            total = len([q for q in quarterly if q.get("surprise") and q.get("surprise") != "None"])
            if total > 0:
                beat_rate = (beats / total) * 100
                formatted += f"\n  Beat Rate (Last 4 Quarters): {beat_rate:.0f}% ({beats}/{total})\n"

        # Check for annual earnings data
        if "annualEarnings" in data:
            annual = data["annualEarnings"][:3]  # Last 3 years

            formatted += "\n\nAnnual Earnings:\n"
            for a in annual:
                fiscal_year = a.get("fiscalDateEnding", "N/A")
                reported_eps = a.get("reportedEPS", "N/A")
                formatted += f"  {fiscal_year}: ${reported_eps} EPS\n"

        # If no data available
        if "quarterlyEarnings" not in data and "annualEarnings" not in data:
            formatted += f"No earnings data available for {ticker}.\n"
            formatted += f"Response: {str(data)[:200]}...\n"

        # Cache the formatted result
        _intelligence_cache.set_cached(cache_key, formatted, ttl)

    except json.JSONDecodeError:
        return f"Error parsing earnings data for {ticker}: {response[:500]}"
    except Exception as e:
        return f"Error retrieving earnings estimates for {ticker}: {e!s}"
    else:
        return formatted


def get_top_gainers() -> str:
    """
    Retrieve today's top gaining stocks from the market.

    Note: Always fetches fresh data (no caching) as market movers change throughout the day.

    Returns:
        str: Formatted list of top gaining stocks with price changes
    """
    # No caching for market movers - always fresh data

    # Fetch from API
    params = {}
    response = _make_api_request("TOP_GAINERS_LOSERS", params)

    try:
        data = json.loads(response)

        formatted = "Top Gaining Stocks Today:\n\n"

        if "top_gainers" in data:
            gainers = data["top_gainers"][:10]  # Top 10

            formatted += f"{'Ticker':<8} {'Price':<10} {'Change':<10} {'% Change':<12} {'Volume':<15}\n"
            formatted += "=" * 65 + "\n"

            for stock in gainers:
                ticker = stock.get("ticker", "N/A")
                price = stock.get("price", "N/A")
                change = stock.get("change_amount", "N/A")
                change_pct = stock.get("change_percentage", "N/A")
                volume = stock.get("volume", "N/A")

                # Format change_pct (remove % if present)
                if isinstance(change_pct, str) and "%" in change_pct:
                    change_pct = change_pct.replace("%", "")

                formatted += f"{ticker:<8} ${price:<9} ${change:<9} {change_pct:<11}% {volume:<15}\n"

            return formatted
        return f"No top gainers data available. Response: {str(data)[:300]}"

    except json.JSONDecodeError:
        return f"Error parsing top gainers data: {response[:500]}"
    except Exception as e:
        return f"Error retrieving top gainers: {e!s}"


def get_top_losers() -> str:
    """
    Retrieve today's top losing stocks from the market.

    Note: Always fetches fresh data (no caching) as market movers change throughout the day.

    Returns:
        str: Formatted list of top losing stocks with price changes
    """
    # No caching for market movers - always fresh data

    # Fetch from API
    params = {}
    response = _make_api_request("TOP_GAINERS_LOSERS", params)

    try:
        data = json.loads(response)

        formatted = "Top Losing Stocks Today:\n\n"

        if "top_losers" in data:
            losers = data["top_losers"][:10]  # Top 10

            formatted += f"{'Ticker':<8} {'Price':<10} {'Change':<10} {'% Change':<12} {'Volume':<15}\n"
            formatted += "=" * 65 + "\n"

            for stock in losers:
                ticker = stock.get("ticker", "N/A")
                price = stock.get("price", "N/A")
                change = stock.get("change_amount", "N/A")
                change_pct = stock.get("change_percentage", "N/A")
                volume = stock.get("volume", "N/A")

                # Format change_pct (remove % if present)
                if isinstance(change_pct, str) and "%" in change_pct:
                    change_pct = change_pct.replace("%", "")

                formatted += f"{ticker:<8} ${price:<9} ${change:<9} {change_pct:<11}% {volume:<15}\n"

            return formatted
        return f"No top losers data available. Response: {str(data)[:300]}"

    except json.JSONDecodeError:
        return f"Error parsing top losers data: {response[:500]}"
    except Exception as e:
        return f"Error retrieving top losers: {e!s}"


def get_market_movers() -> str:
    """
    Retrieve both top gainers and losers in one consolidated report.

    Returns:
        str: Formatted report of market movers (gainers and losers)
    """
    report = "=== MARKET MOVERS REPORT ===\n\n"

    report += get_top_gainers() + "\n\n"
    report += "=" * 65 + "\n\n"
    report += get_top_losers() + "\n"

    return report


def get_earnings_call_transcript(ticker: str, _quarter: str | None = None) -> str:
    """
    Retrieve earnings call transcript for a ticker (if available).

    Note: This is a placeholder for future implementation when Alpha Vantage
    adds earnings call transcript endpoints.

    Args:
        ticker: Stock ticker symbol
        _quarter: Quarter in format YYYY-Q# (e.g., "2024-Q3") - currently unused

    Returns:
        str: Earnings call transcript or unavailability message
    """
    return f"Earnings call transcripts for {ticker} are not yet available through this API endpoint. This feature will be added when Alpha Vantage releases the EARNINGS_CALL_TRANSCRIPT function."
