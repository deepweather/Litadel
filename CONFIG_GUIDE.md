# Configuration Guide

TradingAgents supports configuration through multiple methods with the following priority:

**Priority (highest to lowest):**
1. Environment variables
2. `config.ini` file
3. Built-in defaults

## Quick Start

### Option 1: Using config.ini (Recommended)

1. Copy the example configuration:
   ```bash
   cp config.example.ini config.ini
   ```

2. Edit `config.ini` with your preferences:
   ```ini
   [llm]
   provider = openai
   deep_think_llm = o1-mini
   quick_think_llm = gpt-4o-mini
   
   [analysis]
   research_depth = 1
   default_analysts = market,news,social
   
   [data]
   global_news_limit = 15
   ```

3. Run the CLI - it will use your defaults and skip prompting for configured values:
   ```bash
   uv run python -m cli.main
   ```

### Option 2: Using Environment Variables

Set environment variables in your shell or `.env` file:

```bash
export LLM_PROVIDER=openai
export DEEP_THINK_LLM=o1-mini
export QUICK_THINK_LLM=gpt-4o-mini
export RESEARCH_DEPTH=1
export GLOBAL_NEWS_LIMIT=20
```

## Configuration Options

### LLM Settings

| Config Key | Env Variable | Description | Default |
|------------|--------------|-------------|---------|
| `provider` | `LLM_PROVIDER` | LLM provider (openai, anthropic, google, ollama) | `openai` |
| `backend_url` | `LLM_BACKEND_URL` | API endpoint URL | `https://api.openai.com/v1` |
| `deep_think_llm` | `DEEP_THINK_LLM` | Model for complex analysis (gpt-5, o1, o3, etc.) | `o1-mini` |
| `quick_think_llm` | `QUICK_THINK_LLM` | Model for simple tasks (gpt-5, gpt-4o-mini, etc.) | `gpt-4o-mini` |

### Analysis Settings

| Config Key | Env Variable | Description | Default |
|------------|--------------|-------------|---------|
| `research_depth` | `RESEARCH_DEPTH` | Depth level (1=shallow, 2=medium, 3=deep) | `1` |
| `default_analysts` | `DEFAULT_ANALYSTS` | Comma-separated list of analysts | `market,news,social` |

### Data Settings

| Config Key | Env Variable | Description | Default |
|------------|--------------|-------------|---------|
| `global_news_limit` | `GLOBAL_NEWS_LIMIT` | Number of global news articles to fetch | `15` |
| `commodity_news_limit` | `COMMODITY_NEWS_LIMIT` | Number of commodity news articles | `50` |

### Data Vendors

Configure which data sources to use:

| Config Key | Env Variable | Description | Options |
|------------|--------------|-------------|---------|
| `stock` | `DATA_VENDOR_STOCK` | Stock price data | yfinance, alpha_vantage |
| `indicators` | `DATA_VENDOR_INDICATORS` | Technical indicators | yfinance, alpha_vantage |
| `fundamentals` | `DATA_VENDOR_FUNDAMENTALS` | Fundamental data | alpha_vantage, openai |
| `news` | `DATA_VENDOR_NEWS` | News data | alpha_vantage, openai, google |
| `commodity` | `DATA_VENDOR_COMMODITY` | Commodity data | alpha_vantage |

## Examples

### Example 1: Minimal config.ini for quick daily use

```ini
[llm]
provider = openai
deep_think_llm = o1-mini
quick_think_llm = gpt-4o-mini

[analysis]
research_depth = 1
default_analysts = market,news
```

**Result:** When you run the CLI, you'll **only be prompted for**:
- ✅ Ticker symbol
- ✅ Analysis date

**Auto-configured (no prompts)**:
- ✅ LLM provider (OpenAI)
- ✅ Models (o1-mini & gpt-4o-mini)
- ✅ Research depth (Shallow)
- ✅ Analysts (Market & News)

Everything else uses your configured defaults!

### Example 2: Using GPT-5

```ini
[llm]
provider = openai
deep_think_llm = gpt-5
quick_think_llm = gpt-5

[analysis]
research_depth = 2
default_analysts = market,news,social
```

### Example 3: Power user with custom news limits

```ini
[llm]
provider = anthropic
deep_think_llm = claude-3-5-sonnet-20241022
quick_think_llm = claude-3-5-haiku-20241022

[analysis]
research_depth = 3
default_analysts = market,news,social,fundamentals

[data]
global_news_limit = 30
commodity_news_limit = 100

[vendors]
news = openai
stock = alpha_vantage
```

### Example 4: Using environment variables

```bash
# In your ~/.zshrc or ~/.bashrc
export LLM_PROVIDER=openai
export DEEP_THINK_LLM=o1-mini
export QUICK_THINK_LLM=gpt-4o-mini
export GLOBAL_NEWS_LIMIT=20
```

## Configuration Priority Example

If you have:
- `config.ini` with `global_news_limit = 15`
- Environment variable `GLOBAL_NEWS_LIMIT=30`

The system will use **30** (environment variable wins).

## How It Works

When you run the CLI with a `config.ini` file, you'll see output like this:

```
Step 1: Ticker Symbol
Enter the ticker symbol to analyze
> AAPL

→ Detected asset class: Equity

Step 2: Analysis date
Enter the analysis date (YYYY-MM-DD)
> 2025-01-15

→ Using configured analysts: market, news, social
→ Using configured research depth: Shallow
→ Using configured LLM provider: OPENAI (https://api.openai.com/v1)
→ Using configured models:
  Quick thinking: gpt-4o-mini
  Deep thinking: o1-mini
```

The `→` lines show values being used from your config, skipping the prompts!

## Tips

1. **Start with config.ini** - Easier to manage than environment variables
2. **Use env vars for secrets** - Keep API keys in environment variables, not config files
3. **Version control** - Add `config.ini` to `.gitignore`, commit `config.example.ini`
4. **Test changes** - Run CLI after changing config to verify your settings work
5. **Partial config is OK** - You can configure only some values; the rest will be prompted

## Troubleshooting

**CLI still prompts for everything:**
- Check that `config.ini` exists in the TradingAgents directory
- Verify the file has the correct structure (see `config.example.ini`)
- Check for typos in section names and keys

**Wrong model being used:**
- Check priority: env vars override config.ini
- Verify model names match your provider's API exactly
- Check logs for which config values are being loaded

**News limit not working:**
- Limits are read from config on each run
- Clear Python cache: `find . -type d -name "__pycache__" -exec rm -rf {} +`
- Check the tool logs to see what limit is actually being used

