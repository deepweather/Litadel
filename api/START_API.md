# Quick Start - Trading Agents API

## 1. Install Dependencies (if not already done)

```bash
cd TradingAgents
pip install -r requirements.txt
```

## 2. Initialize Database & Create API Key

```bash
# Initialize the database
python -m api.cli_admin init-database

# Create your first API key
python -m api.cli_admin create-key "My Development Key"
```

**IMPORTANT**: Save the API key that's displayed! You'll need it for all requests.

## 3. Start the API

```bash
python -m api.main
```

Or use the startup script:
```bash
./run_api.sh
```

The API will start at: **http://localhost:8001**

## 4. Test It

Open your browser to see the interactive API documentation:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## 5. Create Your First Analysis

Using curl (replace `YOUR_API_KEY` with the key from step 2):

```bash
curl -X POST "http://localhost:8001/api/v1/analyses" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "analysis_date": "2025-10-21",
    "selected_analysts": ["market", "news"],
    "research_depth": 1
  }'
```

You'll get back an `analysis_id`. Use it to check status:

```bash
curl "http://localhost:8001/api/v1/analyses/YOUR_ANALYSIS_ID/status" \
  -H "X-API-Key: YOUR_API_KEY"
```

## Configuration (Optional)

Set environment variables before starting:

```bash
# Maximum concurrent analyses (default: 4)
export MAX_CONCURRENT_ANALYSES=8

# Your LLM API keys (if not already set)
export OPENAI_API_KEY="your-key"
export ALPHA_VANTAGE_API_KEY="your-key"

# Then start the API
python -m api.main
```

## Common Commands

```bash
# List all API keys
python -m api.cli_admin list-keys

# Create a new API key
python -m api.cli_admin create-key "Frontend App"

# Revoke an API key (use ID from list-keys)
python -m api.cli_admin revoke-key 1
```

## Full Documentation

- Quick Start: `API_QUICKSTART.md`
- Full API Docs: `api/README.md`
- Implementation Details: `API_IMPLEMENTATION_SUMMARY.md`

## Troubleshooting

**"Invalid or inactive API key"**
- Make sure you're using the exact key from step 2
- Check: `python -m api.cli_admin list-keys`

**Import errors**
- Make sure you're in the TradingAgents directory
- Use: `python -m api.main` (not `python api/main.py`)

**Port 8001 already in use**
- Change port: `API_PORT=8002 python -m api.main`
- Or: `python -m uvicorn api.main:app --port 8002`

That's it! Your API is ready to use. 🚀

