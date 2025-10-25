"""Alpha Intelligence™ tools for earnings estimates and market movers."""

from langchain_core.tools import tool

from litadel.dataflows.alpha_vantage_intelligence import (
    get_earnings_estimates as get_earnings_estimates_impl,
)
from litadel.dataflows.alpha_vantage_intelligence import (
    get_market_movers as get_market_movers_impl,
)


@tool
def get_earnings_estimates(ticker: str) -> str:
    """
    Retrieve analyst earnings estimates and consensus for a stock ticker.

    Shows expected EPS (Earnings Per Share), revenue estimates, and estimate revisions.
    Helps identify potential earnings beats/misses and understand market expectations.

    Critical for:
    - Evaluating if current price reflects expectations
    - Identifying potential earnings surprises
    - Understanding analyst sentiment trends
    - Comparing historical beat/miss rates

    Args:
        ticker: Stock ticker symbol (e.g., "AAPL", "TSLA", "NVDA")

    Returns:
        str: Earnings estimates with quarterly and annual data, beat/miss history,
             and analyst consensus

    Example:
        >>> estimates = get_earnings_estimates("AAPL")
        >>> # Returns quarterly earnings, estimates, surprises, beat rate
    """
    try:
        result = get_earnings_estimates_impl(ticker)
        return result
    except Exception as e:
        return f"Error retrieving earnings estimates for {ticker}: {e!s}"


@tool
def get_market_movers() -> str:
    """
    Retrieve today's top gaining and losing stocks in the market.

    Provides real-time view of market momentum and sentiment.
    Useful for:
    - Identifying sector trends and rotations
    - Gauging overall market sentiment
    - Finding potential opportunities
    - Risk assessment (sector weakness)
    - Understanding market dynamics

    Returns:
        str: Top 10 gainers and losers with price, change, % change, and volume

    Example:
        >>> movers = get_market_movers()
        >>> # Returns tables of top gainers and losers with current stats
    """
    try:
        result = get_market_movers_impl()
        return result
    except Exception as e:
        return f"Error retrieving market movers: {e!s}"
