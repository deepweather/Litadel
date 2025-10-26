# Import from vendor-specific modules
from .alpha_vantage import (
    get_all_economic_indicators as get_alpha_vantage_economic_indicators,
)
from .alpha_vantage import (
    get_balance_sheet as get_alpha_vantage_balance_sheet,
)
from .alpha_vantage import (
    get_cashflow as get_alpha_vantage_cashflow,
)
from .alpha_vantage import (
    get_commodity as get_alpha_vantage_commodity,
)
from .alpha_vantage import (
    get_commodity_news as get_alpha_vantage_commodity_news,
)
from .alpha_vantage import (
    get_crypto as get_alpha_vantage_crypto,
)
from .alpha_vantage import (
    get_crypto_news as get_alpha_vantage_crypto_news,
)
from .alpha_vantage import (
    get_earnings_estimates as get_alpha_vantage_earnings_estimates,
)
from .alpha_vantage import (
    get_fundamentals as get_alpha_vantage_fundamentals,
)
from .alpha_vantage import (
    get_global_news_alpha_vantage,
)
from .alpha_vantage import (
    get_income_statement as get_alpha_vantage_income_statement,
)
from .alpha_vantage import (
    get_indicator as get_alpha_vantage_indicator,
)
from .alpha_vantage import (
    get_insider_transactions as get_alpha_vantage_insider_transactions,
)
from .alpha_vantage import (
    get_market_movers as get_alpha_vantage_market_movers,
)
from .alpha_vantage import (
    get_news as get_alpha_vantage_news,
)
from .alpha_vantage import (
    get_stock as get_alpha_vantage_stock,
)
from .alpha_vantage_common import AlphaVantageRateLimitError

# Configuration and routing logic
from .config import get_config
from .crypto_indicators import get_crypto_indicators
from .google import get_google_news
from .local import (
    get_finnhub_company_insider_sentiment,
    get_finnhub_company_insider_transactions,
    get_finnhub_news,
    get_reddit_company_news,
    get_reddit_global_news,
    get_simfin_balance_sheet,
    get_simfin_cashflow,
    get_simfin_income_statements,
    get_YFin_data,
)
from .openai import get_fundamentals_openai, get_global_news_openai, get_stock_news_openai
from .y_finance import (
    get_balance_sheet as get_yfinance_balance_sheet,
)
from .y_finance import (
    get_cashflow as get_yfinance_cashflow,
)
from .y_finance import (
    get_income_statement as get_yfinance_income_statement,
)
from .y_finance import (
    get_insider_transactions as get_yfinance_insider_transactions,
)
from .y_finance import (
    get_stock_stats_indicators_window,
    get_YFin_data_online,
)

# Tools organized by category
TOOLS_CATEGORIES = {
    "core_stock_apis": {"description": "OHLCV stock price data", "tools": ["get_stock_data"]},
    "commodity_data": {"description": "Commodity price data", "tools": ["get_commodity_data"]},
    "crypto_data": {"description": "Cryptocurrency price data", "tools": ["get_crypto_data"]},
    "technical_indicators": {"description": "Technical analysis indicators", "tools": ["get_indicators"]},
    "crypto_indicators": {"description": "Cryptocurrency technical indicators", "tools": ["get_crypto_indicators"]},
    "fundamental_data": {
        "description": "Company fundamentals",
        "tools": ["get_fundamentals", "get_balance_sheet", "get_cashflow", "get_income_statement"],
    },
    "news_data": {
        "description": "News (public/insiders, original/processed)",
        "tools": [
            "get_news",
            "get_commodity_news",
            "get_crypto_news",
            "get_global_news",
            "get_insider_sentiment",
            "get_insider_transactions",
        ],
    },
    "economic_indicators": {
        "description": "Macroeconomic indicators (GDP, CPI, unemployment, interest rates)",
        "tools": ["get_economic_indicators"],
    },
    "alpha_intelligence": {
        "description": "Alpha Intelligence™ features (earnings estimates, market movers)",
        "tools": ["get_earnings_estimates", "get_market_movers"],
    },
}

VENDOR_LIST = ["local", "yfinance", "openai", "google"]

# Mapping of methods to their vendor-specific implementations
VENDOR_METHODS = {
    # core_stock_apis
    "get_stock_data": {
        "alpha_vantage": get_alpha_vantage_stock,
        "yfinance": get_YFin_data_online,
        "local": get_YFin_data,
    },
    # commodity_data
    "get_commodity_data": {
        "alpha_vantage": get_alpha_vantage_commodity,
    },
    # crypto_data
    "get_crypto_data": {
        "alpha_vantage": get_alpha_vantage_crypto,
    },
    # technical_indicators
    "get_indicators": {
        "alpha_vantage": get_alpha_vantage_indicator,
        "yfinance": get_stock_stats_indicators_window,
        "local": get_stock_stats_indicators_window,
    },
    # crypto_indicators
    "get_crypto_indicators": {
        "alpha_vantage": get_crypto_indicators,
        "local": get_crypto_indicators,
    },
    # fundamental_data
    "get_fundamentals": {
        "alpha_vantage": get_alpha_vantage_fundamentals,
        "openai": get_fundamentals_openai,
    },
    "get_balance_sheet": {
        "alpha_vantage": get_alpha_vantage_balance_sheet,
        "yfinance": get_yfinance_balance_sheet,
        "local": get_simfin_balance_sheet,
    },
    "get_cashflow": {
        "alpha_vantage": get_alpha_vantage_cashflow,
        "yfinance": get_yfinance_cashflow,
        "local": get_simfin_cashflow,
    },
    "get_income_statement": {
        "alpha_vantage": get_alpha_vantage_income_statement,
        "yfinance": get_yfinance_income_statement,
        "local": get_simfin_income_statements,
    },
    # news_data
    "get_news": {
        "alpha_vantage": get_alpha_vantage_news,
        "openai": get_stock_news_openai,
        "google": get_google_news,
        "local": [get_finnhub_news, get_reddit_company_news, get_google_news],
    },
    "get_commodity_news": {
        "alpha_vantage": get_alpha_vantage_commodity_news,
        "openai": get_stock_news_openai,  # Fallback to OpenAI web search
    },
    "get_crypto_news": {
        "alpha_vantage": get_alpha_vantage_crypto_news,
        "openai": get_stock_news_openai,  # Fallback to OpenAI web search
    },
    "get_global_news": {
        "alpha_vantage": get_global_news_alpha_vantage,
        "openai": get_global_news_openai,
        "local": get_reddit_global_news,
    },
    "get_insider_sentiment": {"local": get_finnhub_company_insider_sentiment},
    "get_insider_transactions": {
        "alpha_vantage": get_alpha_vantage_insider_transactions,
        "yfinance": get_yfinance_insider_transactions,
        "local": get_finnhub_company_insider_transactions,
    },
    # economic_indicators
    "get_economic_indicators": {
        "alpha_vantage": get_alpha_vantage_economic_indicators,
    },
    # alpha_intelligence
    "get_earnings_estimates": {
        "alpha_vantage": get_alpha_vantage_earnings_estimates,
    },
    "get_market_movers": {
        "alpha_vantage": get_alpha_vantage_market_movers,
    },
}


def get_category_for_method(method: str) -> str:
    """Get the category that contains the specified method."""
    for category, info in TOOLS_CATEGORIES.items():
        if method in info["tools"]:
            return category
    msg = f"Method '{method}' not found in any category"
    raise ValueError(msg)


def get_vendor(category: str, method: str | None = None) -> str:
    """Get the configured vendor for a data category or specific tool method.
    Tool-level configuration takes precedence over category-level.
    """
    config = get_config()

    # Check tool-level configuration first (if method provided)
    if method:
        tool_vendors = config.get("tool_vendors", {})
        if method in tool_vendors:
            return tool_vendors[method]

    # Fall back to category-level configuration
    return config.get("data_vendors", {}).get(category, "default")


def route_to_vendor(method: str, *args, **kwargs):
    """Route method calls to appropriate vendor implementation with fallback support."""
    category = get_category_for_method(method)
    vendor_config = get_vendor(category, method)

    # Handle comma-separated vendors
    primary_vendors = [v.strip() for v in vendor_config.split(",")]

    if method not in VENDOR_METHODS:
        msg = f"Method '{method}' not supported"
        raise ValueError(msg)

    # Get all available vendors for this method for fallback
    all_available_vendors = list(VENDOR_METHODS[method].keys())

    # Create fallback vendor list: primary vendors first, then remaining vendors as fallbacks
    fallback_vendors = primary_vendors.copy()
    for vendor in all_available_vendors:
        if vendor not in fallback_vendors:
            fallback_vendors.append(vendor)

    # Debug: Print fallback ordering
    primary_str = " → ".join(primary_vendors)
    fallback_str = " → ".join(fallback_vendors)
    print(f"DEBUG: {method} - Primary: [{primary_str}] | Full fallback order: [{fallback_str}]")

    # Track results and execution state
    results = []
    vendor_attempt_count = 0

    for vendor in fallback_vendors:
        if vendor not in VENDOR_METHODS[method]:
            if vendor in primary_vendors:
                print(f"INFO: Vendor '{vendor}' not supported for method '{method}', falling back to next vendor")
            continue

        vendor_impl = VENDOR_METHODS[method][vendor]
        is_primary_vendor = vendor in primary_vendors
        vendor_attempt_count += 1

        # Track if we attempted any primary vendor
        if is_primary_vendor:
            pass

        # Debug: Print current attempt
        vendor_type = "PRIMARY" if is_primary_vendor else "FALLBACK"
        print(f"DEBUG: Attempting {vendor_type} vendor '{vendor}' for {method} (attempt #{vendor_attempt_count})")

        # Handle list of methods for a vendor
        if isinstance(vendor_impl, list):
            vendor_methods = [(impl, vendor) for impl in vendor_impl]
            print(f"DEBUG: Vendor '{vendor}' has multiple implementations: {len(vendor_methods)} functions")
        else:
            vendor_methods = [(vendor_impl, vendor)]

        # Run methods for this vendor
        vendor_results = []
        for impl_func, vendor_name in vendor_methods:
            try:
                print(f"DEBUG: Calling {impl_func.__name__} from vendor '{vendor_name}'...")
                result = impl_func(*args, **kwargs)
                vendor_results.append(result)
                print(f"SUCCESS: {impl_func.__name__} from vendor '{vendor_name}' completed successfully")

            except AlphaVantageRateLimitError as e:
                if vendor == "alpha_vantage":
                    print("RATE_LIMIT: Alpha Vantage rate limit exceeded")
                    print(f"DEBUG: Rate limit details: {e}")
                    # For rate limits, we should stop trying rather than hammer other vendors
                    # The user needs to wait or upgrade their plan
                    print("INFO: Stopping execution due to rate limit. Please wait or upgrade your Alpha Vantage plan.")
                    # Still try to fall back to local cache if available, but don't continue to online vendors
                    # Only allow fallback to 'local' vendor for cache
                    remaining_vendors = fallback_vendors[fallback_vendors.index(vendor) + 1 :]
                    if "local" not in remaining_vendors:
                        # No local cache available, stop here
                        raise RuntimeError(
                            f"Alpha Vantage rate limit exceeded and no local cache available: {e}"
                        ) from e
                    # Continue only to local vendor for cache lookup
                    print("INFO: Attempting to use local cache as fallback...")
                continue
            except Exception as e:
                # Log error but continue with other implementations
                print(f"FAILED: {impl_func.__name__} from vendor '{vendor_name}' failed: {e}")
                continue

        # Add this vendor's results
        if vendor_results:
            results.extend(vendor_results)
            result_summary = f"Got {len(vendor_results)} result(s)"
            print(f"SUCCESS: Vendor '{vendor}' succeeded - {result_summary}")

            # Stopping logic: Stop after first successful vendor for single-vendor configs
            # Multiple vendor configs (comma-separated) may want to collect from multiple sources
            if len(primary_vendors) == 1:
                print(f"DEBUG: Stopping after successful vendor '{vendor}' (single-vendor config)")
                break
        else:
            print(f"FAILED: Vendor '{vendor}' produced no results")

    # Final result summary
    if not results:
        print(f"FAILURE: All {vendor_attempt_count} vendor attempts failed for method '{method}'")
        msg = f"All vendor implementations failed for method '{method}'"
        raise RuntimeError(msg)
    print(
        f"FINAL: Method '{method}' completed with {len(results)} result(s) from {vendor_attempt_count} vendor attempt(s)"
    )

    # Return single result if only one, otherwise concatenate as string
    if len(results) == 1:
        return results[0]
    # Convert all results to strings and concatenate
    return "\n".join(str(result) for result in results)
