# Trading Agents API - Quickest Start

## One-Command Setup

```bash
cd TradingAgents && pip install -r requirements.txt && python -m api.main
```

That's it! The API auto-initializes on first run.

## What Happens on First Run

1. ✅ Database is created automatically
2. ✅ Default API key is generated
3. ✅ API key is displayed in the console
4. ✅ Server starts at http://localhost:8001

**Save the API key from the console output!**

## Test It

```bash
# Replace YOUR_API_KEY with the key from console
curl -X POST "http://localhost:8001/api/v1/analyses" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "analysis_date": "2025-10-21",
    "selected_analysts": ["market"],
    "research_depth": 1
  }'
```

## Next Steps

- View interactive docs: http://localhost:8001/docs
- Read full guide: `START_API.md`
- Manage API keys: `python -m api.cli_admin list-keys`

