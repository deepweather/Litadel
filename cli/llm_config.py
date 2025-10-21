"""LLM provider and model configuration data for the TradingAgents CLI."""

# LLM provider base URLs
LLM_PROVIDERS = [
    ("OpenAI", "https://api.openai.com/v1"),
    ("Anthropic", "https://api.anthropic.com/"),
    ("Google", "https://generativelanguage.googleapis.com/v1"),
    ("Openrouter", "https://openrouter.ai/api/v1"),
    ("Ollama", "http://localhost:11434/v1"),
]

# Quick-thinking (shallow) model options per provider
SHALLOW_AGENT_OPTIONS = {
    "openai": [
        ("GPT-4o-mini - Fast and efficient for quick tasks", "gpt-4o-mini"),
        ("GPT-4.1-nano - Ultra-lightweight model for basic operations", "gpt-4.1-nano"),
        ("GPT-4.1-mini - Compact model with good performance", "gpt-4.1-mini"),
        ("GPT-4o - Standard model with solid capabilities", "gpt-4o"),
        ("GPT-5 - Next generation model with enhanced capabilities", "gpt-5"),
    ],
    "anthropic": [
        ("Claude Haiku 3.5 - Fast inference and standard capabilities", "claude-3-5-haiku-latest"),
        ("Claude Sonnet 3.5 - Highly capable standard model", "claude-3-5-sonnet-latest"),
        ("Claude Sonnet 3.7 - Exceptional hybrid reasoning and agentic capabilities", "claude-3-7-sonnet-latest"),
        ("Claude Sonnet 4 - High performance and excellent reasoning", "claude-sonnet-4-0"),
    ],
    "google": [
        ("Gemini 2.0 Flash-Lite - Cost efficiency and low latency", "gemini-2.0-flash-lite"),
        ("Gemini 2.0 Flash - Next generation features, speed, and thinking", "gemini-2.0-flash"),
        ("Gemini 2.5 Flash - Adaptive thinking, cost efficiency", "gemini-2.5-flash-preview-05-20"),
    ],
    "openrouter": [
        ("Meta: Llama 4 Scout", "meta-llama/llama-4-scout:free"),
        ("Meta: Llama 3.3 8B Instruct - A lightweight and ultra-fast variant of Llama 3.3 70B", "meta-llama/llama-3.3-8b-instruct:free"),
        ("google/gemini-2.0-flash-exp:free - Gemini Flash 2.0 offers a significantly faster time to first token", "google/gemini-2.0-flash-exp:free"),
    ],
    "ollama": [
        ("llama3.1 local", "llama3.1"),
        ("llama3.2 local", "llama3.2"),
    ]
}

# Deep-thinking model options per provider
DEEP_AGENT_OPTIONS = {
    "openai": [
        ("GPT-4.1-nano - Ultra-lightweight model for basic operations", "gpt-4.1-nano"),
        ("GPT-4.1-mini - Compact model with good performance", "gpt-4.1-mini"),
        ("GPT-4o - Standard model with solid capabilities", "gpt-4o"),
        ("GPT-5 - Next generation model with enhanced capabilities", "gpt-5"),
        ("o4-mini - Specialized reasoning model (compact)", "o4-mini"),
        ("o3-mini - Advanced reasoning model (lightweight)", "o3-mini"),
        ("o3 - Full advanced reasoning model", "o3"),
        ("o1 - Premier reasoning and problem-solving model", "o1"),
    ],
    "anthropic": [
        ("Claude Haiku 3.5 - Fast inference and standard capabilities", "claude-3-5-haiku-latest"),
        ("Claude Sonnet 3.5 - Highly capable standard model", "claude-3-5-sonnet-latest"),
        ("Claude Sonnet 3.7 - Exceptional hybrid reasoning and agentic capabilities", "claude-3-7-sonnet-latest"),
        ("Claude Sonnet 4 - High performance and excellent reasoning", "claude-sonnet-4-0"),
        ("Claude Opus 4 - Most powerful Anthropic model", "	claude-opus-4-0"),
    ],
    "google": [
        ("Gemini 2.0 Flash-Lite - Cost efficiency and low latency", "gemini-2.0-flash-lite"),
        ("Gemini 2.0 Flash - Next generation features, speed, and thinking", "gemini-2.0-flash"),
        ("Gemini 2.5 Flash - Adaptive thinking, cost efficiency", "gemini-2.5-flash-preview-05-20"),
        ("Gemini 2.5 Pro", "gemini-2.5-pro-preview-06-05"),
    ],
    "openrouter": [
        ("DeepSeek V3 - a 685B-parameter, mixture-of-experts model", "deepseek/deepseek-chat-v3-0324:free"),
        ("Deepseek - latest iteration of the flagship chat model family from the DeepSeek team.", "deepseek/deepseek-chat-v3-0324:free"),
    ],
    "ollama": [
        ("llama3.1 local", "llama3.1"),
        ("qwen3", "qwen3"),
    ]
}

