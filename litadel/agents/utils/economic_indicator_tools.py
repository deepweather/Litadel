"""Economic indicator tools for macro analysis."""

from langchain_core.tools import tool

from litadel.dataflows.alpha_vantage_economic import get_all_economic_indicators


@tool
def get_economic_indicators(current_date: str) -> str:
    """
    Retrieve key macroeconomic indicators including GDP, CPI, unemployment,
    federal funds rate, treasury yields, and retail sales.

    Provides comprehensive economic context for trading decisions across all asset classes.
    Helps understand the broader economic environment that influences market movements.

    IMPORTANT: Filters economic indicators to only include data released on or before
    current_date to prevent look-ahead bias in backtesting.

    Args:
        current_date: Current date in YYYY-MM-DD format. Only indicators published
                      on or before this date will be included.

    Returns:
        str: Comprehensive report of economic indicators with recent trends and implications

    Example:
        >>> indicators = get_economic_indicators("2024-10-24")
        >>> # Returns GDP growth, inflation, unemployment, etc. available as of 2024-10-24
    """
    try:
        return get_all_economic_indicators(max_date=current_date)
    except Exception as e:
        return f"Error retrieving economic indicators: {e!s}"
