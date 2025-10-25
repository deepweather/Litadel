import configparser
import os
from pathlib import Path


def _load_user_config():
    """Load configuration from config.ini if it exists."""
    config_path = Path(__file__).parent.parent / "config.ini"
    if not config_path.exists():
        return {}

    parser = configparser.ConfigParser()
    parser.read(config_path)

    user_config = {}

    # LLM settings
    if parser.has_section("llm"):
        user_config["llm_provider"] = parser.get("llm", "provider", fallback=None)
        user_config["backend_url"] = parser.get("llm", "backend_url", fallback=None)
        user_config["deep_think_llm"] = parser.get("llm", "deep_think_llm", fallback=None)
        user_config["quick_think_llm"] = parser.get("llm", "quick_think_llm", fallback=None)

    # Analysis settings
    if parser.has_section("analysis"):
        depth = parser.get("analysis", "research_depth", fallback=None)
        if depth:
            user_config["max_debate_rounds"] = int(depth)
            user_config["max_risk_discuss_rounds"] = int(depth)

        analysts = parser.get("analysis", "default_analysts", fallback=None)
        if analysts:
            user_config["default_analysts"] = [a.strip() for a in analysts.split(",")]

    # Data settings
    if parser.has_section("data"):
        limit = parser.get("data", "global_news_limit", fallback=None)
        if limit:
            user_config["global_news_limit"] = int(limit)

        commodity_limit = parser.get("data", "commodity_news_limit", fallback=None)
        if commodity_limit:
            user_config["commodity_news_limit"] = int(commodity_limit)

    # Vendor settings
    if parser.has_section("vendors"):
        vendors = {}
        if parser.has_option("vendors", "stock"):
            vendors["core_stock_apis"] = parser.get("vendors", "stock")
        if parser.has_option("vendors", "indicators"):
            vendors["technical_indicators"] = parser.get("vendors", "indicators")
        if parser.has_option("vendors", "fundamentals"):
            vendors["fundamental_data"] = parser.get("vendors", "fundamentals")
        if parser.has_option("vendors", "news"):
            vendors["news_data"] = parser.get("vendors", "news")
        if parser.has_option("vendors", "commodity"):
            vendors["commodity_data"] = parser.get("vendors", "commodity")
        if parser.has_option("vendors", "crypto"):
            vendors["crypto_data"] = parser.get("vendors", "crypto")

        if vendors:
            user_config["data_vendors"] = vendors

    # Storage settings
    if parser.has_section("storage"):
        results = parser.get("storage", "results_dir", fallback=None)
        if results:
            user_config["results_dir"] = results

    # Remove None values
    return {k: v for k, v in user_config.items() if v is not None}


# Load user config from config.ini
_user_config = _load_user_config()

# Base defaults
_base_config = {
    "project_dir": os.path.abspath(os.path.join(os.path.dirname(__file__), ".")),
    "results_dir": "./results",
    "data_dir": "/Users/yluo/Documents/Code/ScAI/FR1-data",
    "data_cache_dir": os.path.join(
        os.path.abspath(os.path.join(os.path.dirname(__file__), ".")),
        "dataflows/data_cache",
    ),
    "economic_cache_dir": os.path.join(
        os.path.abspath(os.path.join(os.path.dirname(__file__), ".")),
        "dataflows/data_cache/economic",
    ),
    # Smart cache TTL (Time To Live) in seconds
    "cache_ttl": {
        "gdp": 90 * 24 * 3600,  # 90 days (quarterly release)
        "cpi": 30 * 24 * 3600,  # 30 days (monthly release)
        "unemployment": 30 * 24 * 3600,  # 30 days
        "federal_funds_rate": 30 * 24 * 3600,  # 30 days
        "treasury_yield": 24 * 3600,  # 1 day (daily data)
        "retail_sales": 30 * 24 * 3600,  # 30 days
        "earnings_estimates": 7 * 24 * 3600,  # 7 days
    },
    # LLM settings
    "llm_provider": "openai",
    "deep_think_llm": "o1-mini",
    "quick_think_llm": "gpt-4o-mini",
    "backend_url": "https://api.openai.com/v1",
    # Asset class (equity | commodity)
    "asset_class": "equity",
    # Debate and discussion settings
    "max_debate_rounds": 1,
    "max_risk_discuss_rounds": 1,
    "max_recur_limit": 100,
    # News limits
    "global_news_limit": 15,
    "commodity_news_limit": 50,
    # Data vendor configuration
    "data_vendors": {
        "core_stock_apis": "yfinance",
        "technical_indicators": "yfinance",
        "crypto_indicators": "alpha_vantage",
        "fundamental_data": "alpha_vantage",
        "news_data": "alpha_vantage",
        "commodity_data": "alpha_vantage",
        "crypto_data": "alpha_vantage",
    },
    # Tool-level configuration (takes precedence over category-level)
    "tool_vendors": {},
}

# Merge with environment variables
_env_overrides = {
    "llm_provider": os.getenv("LLM_PROVIDER"),
    "deep_think_llm": os.getenv("DEEP_THINK_LLM"),
    "quick_think_llm": os.getenv("QUICK_THINK_LLM"),
    "backend_url": os.getenv("LLM_BACKEND_URL"),
    "results_dir": os.getenv("TRADINGAGENTS_RESULTS_DIR"),
    "global_news_limit": os.getenv("GLOBAL_NEWS_LIMIT"),
    "commodity_news_limit": os.getenv("COMMODITY_NEWS_LIMIT"),
}
_env_overrides = {k: v for k, v in _env_overrides.items() if v is not None}

# Convert string numbers to int
if "global_news_limit" in _env_overrides:
    _env_overrides["global_news_limit"] = int(_env_overrides["global_news_limit"])
if "commodity_news_limit" in _env_overrides:
    _env_overrides["commodity_news_limit"] = int(_env_overrides["commodity_news_limit"])

# Priority: env vars > config.ini > base defaults
DEFAULT_CONFIG = {**_base_config, **_user_config, **_env_overrides}

# Update data_vendors if user config has partial vendors
if "data_vendors" in _user_config:
    DEFAULT_CONFIG["data_vendors"] = {**_base_config["data_vendors"], **_user_config["data_vendors"]}
