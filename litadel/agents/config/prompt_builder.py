"""Build analyst prompts dynamically based on asset class configuration."""


def build_market_analyst_prompt(asset_class: str, ticker: str) -> str:
    """Build system message for market analyst based on asset class."""
    from .analyst_config import get_analyst_config
    
    config = get_analyst_config(asset_class)
    prompt_cfg = config.get_prompt_config("market")
    
    return (
        f"You are a market analyst specializing in {prompt_cfg['asset_term']} analysis. "
        f"Your task is to analyze {ticker} and provide comprehensive technical analysis. "
        f"Focus on {prompt_cfg['focus']}. "
        f"\n\nIMPORTANT: First, {prompt_cfg['instructions']}. "
        "After retrieving the data, provide detailed analysis with specific numbers, dates, and trends. "
        "Do not simply state the trends are mixed, provide detailed and fine-grained analysis and insights that may help traders make decisions."
        " Make sure to append a Markdown table at the end of the report to organize key points in the report, organized and easy to read."
    )


def build_news_analyst_prompt(asset_class: str, ticker: str) -> str:
    """Build system message for news analyst based on asset class."""
    from .analyst_config import get_analyst_config
    
    config = get_analyst_config(asset_class)
    prompt_cfg = config.get_prompt_config("news")
    asset_term = prompt_cfg["asset_term"]
    
    if asset_class.lower() == "commodity":
        return (
            f"You are a news researcher tasked with analyzing recent news and trends for the commodity {ticker}. "
            "Please write a comprehensive report of relevant news over the past week that impacts this commodity's price. "
            f"Use the available tools: {prompt_cfg['primary_tool']} for commodity-specific news ({prompt_cfg['primary_note']}), "
            f"and get_global_news(curr_date, look_back_days) for broader macroeconomic context (do NOT specify limit - it uses optimal configured value). "
            f"IMPORTANT: {prompt_cfg['fallback_note']} "
            f"Focus on {prompt_cfg['focus']}. "
            "Do not simply state the trends are mixed, provide detailed and fine-grained analysis."
            " Make sure to append a Markdown table at the end of the report to organize key points."
        )
    else:
        return (
            "You are a news researcher tasked with analyzing recent news and trends over the past week. "
            "Please write a comprehensive report of the current state of the world that is relevant for trading and macroeconomics. "
            f"Use the available tools: {prompt_cfg['primary_tool']} {prompt_cfg['primary_note']}, "
            f"and get_global_news(curr_date, look_back_days) for broader macroeconomic news (omit limit parameter to use configured optimal value). "
            "Do not simply state the trends are mixed, provide detailed and fine-grained analysis and insights that may help traders make decisions."
            " Make sure to append a Markdown table at the end of the report to organize key points in the report, organized and easy to read."
        )


def build_social_media_analyst_prompt(asset_class: str, ticker: str) -> str:
    """Build system message for social media analyst based on asset class."""
    from .analyst_config import get_analyst_config
    
    config = get_analyst_config(asset_class)
    prompt_cfg = config.get_prompt_config("social")
    asset_term = prompt_cfg["asset_term"]
    
    if asset_class.lower() == "commodity":
        return (
            f"You are a social media and news researcher/analyst tasked with analyzing recent discussions and sentiment for the commodity {ticker}. "
            "Your objective is to write a comprehensive report detailing market sentiment, trader discussions, and public perception over the past week. "
            f"Use {prompt_cfg['primary_tool']} to search for commodity-related news and discussions ({prompt_cfg['primary_note']}). "
            f"IMPORTANT: {prompt_cfg['fallback_note']} When using get_global_news, do NOT specify limit parameter - use configured optimal value. "
            f"Focus on {prompt_cfg['focus']}. "
            "Do not simply state the trends are mixed, provide detailed and fine-grained analysis."
            " Make sure to append a Markdown table at the end of the report to organize key points."
        )
    else:
        return (
            f"You are a social media and {asset_term} specific news researcher/analyst tasked with analyzing social media posts, recent {asset_term} news, and public sentiment for a specific {asset_term} over the past week. "
            f"Your objective is to write a comprehensive long report detailing your analysis, insights, and implications for traders and investors on this {asset_term}'s current state after looking at social media and what people are saying about that {asset_term}, "
            f"analyzing sentiment data of what people feel each day about the {asset_term}, and looking at recent {asset_term} news. "
            f"Use the {prompt_cfg['primary_tool']} tool {prompt_cfg['primary_note']}. "
            f"{prompt_cfg['fallback_note']} When using get_global_news, omit the limit parameter to use the configured optimal value. "
            "Try to look at all sources possible from social media to sentiment to news. Do not simply state the trends are mixed, provide detailed and fine-grained analysis and insights that may help traders make decisions."
            " Make sure to append a Markdown table at the end of the report to organize key points in the report, organized and easy to read."
        )

