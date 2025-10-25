"""Centralized configuration for analyst tools and prompts based on asset class."""

from langchain_core.tools import BaseTool


class AnalystConfig:
    """Configuration for analysts based on asset class."""

    def __init__(self, asset_class: str = "equity"):
        self.asset_class = asset_class.lower()

    def get_tools_for_analyst(self, analyst_type: str) -> list[BaseTool]:
        """Get the appropriate tools for a given analyst based on asset class.

        Args:
            analyst_type: One of 'market', 'news', 'social', 'fundamentals'

        Returns:
            List of tools for that analyst
        """
        # Import here to avoid circular dependencies
        from litadel.agents.utils.agent_utils import (
            get_balance_sheet,
            get_cashflow,
            get_commodity_news,
            get_fundamentals,
            get_global_news,
            get_income_statement,
            get_indicators,
            get_insider_sentiment,
            get_insider_transactions,
            get_news,
            get_stock_data,
        )
        from litadel.agents.utils.commodity_data_tools import get_commodity_data

        tools_map = {
            "equity": {
                "market": [get_stock_data, get_indicators],
                "news": [get_news, get_global_news, get_insider_sentiment, get_insider_transactions],
                "social": [get_news, get_global_news],
                "fundamentals": [get_fundamentals, get_balance_sheet, get_cashflow, get_income_statement],
            },
            "commodity": {
                "market": [get_commodity_data],
                "news": [get_commodity_news, get_global_news],
                "social": [get_commodity_news, get_global_news],
                "fundamentals": [],  # Not applicable for commodities
            },
        }

        return tools_map.get(self.asset_class, tools_map["equity"]).get(analyst_type, [])

    def get_prompt_config(self, analyst_type: str) -> dict[str, str]:
        """Get prompt configuration for a given analyst based on asset class.

        Returns a dict with prompt templates and asset-specific terminology.
        """
        if self.asset_class == "commodity":
            return {
                "asset_term": "commodity",
                "asset_name_var": "ticker",  # Still use ticker variable name for compatibility
                "market": {
                    "focus": "supply/demand factors, geopolitical events, weather impacts (for agriculture), and macroeconomic trends",
                    "data_tool": "get_commodity_data",
                    "instructions": "call get_commodity_data to retrieve commodity price data",
                },
                "news": {
                    "focus": "supply/demand factors, geopolitical events, weather impacts (for agriculture), and macroeconomic trends",
                    "primary_tool": "get_commodity_news(commodity, start_date, end_date)",
                    "primary_note": "searches by topic like 'energy' for oil, 'economy_macro' for agriculture",
                    "fallback_note": "If get_commodity_news returns limited results, make sure to use get_global_news to provide additional market context.",
                },
                "social": {
                    "focus": "trader sentiment, supply/demand expectations, geopolitical concerns, and market psychology",
                    "primary_tool": "get_commodity_news(commodity, start_date, end_date)",
                    "primary_note": "searches by topic like 'energy' for oil",
                    "fallback_note": "If get_commodity_news returns limited results, supplement with get_global_news(curr_date, look_back_days, limit) for broader market context.",
                },
            }
        # equity
        return {
            "asset_term": "company",
            "asset_name_var": "ticker",
            "market": {
                "focus": "price trends, volume, volatility, and technical indicators",
                "data_tool": "get_stock_data and get_indicators",
                "instructions": "call get_stock_data first to retrieve historical price data, then get_indicators for technical analysis",
            },
            "news": {
                "focus": "company-specific events, earnings, product launches, and market sentiment",
                "primary_tool": "get_news(ticker, start_date, end_date)",
                "primary_note": "for company-specific or targeted news searches",
                "fallback_note": "Use get_global_news(curr_date, look_back_days, limit) for broader macroeconomic context.",
            },
            "social": {
                "focus": "social media discussions, public sentiment, and community perception",
                "primary_tool": "get_news(ticker, start_date, end_date)",
                "primary_note": "to search for company-specific news and social media discussions",
                "fallback_note": "If needed, use get_global_news(curr_date, look_back_days, limit) for broader market context.",
            },
        }


# Singleton instance can be created per graph
_config_instance = None


def get_analyst_config(asset_class: str = "equity") -> AnalystConfig:
    """Get or create analyst configuration for the given asset class."""
    return AnalystConfig(asset_class)
