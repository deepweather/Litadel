# Trading Agents API - Quick Start

Get your API running in **2 simple steps**!

## Prerequisites

- Python 3.10+
- Environment variables set (OPENAI_API_KEY, ALPHA_VANTAGE_API_KEY)

## Setup

### Step 1: Install Dependencies

```bash
cd TradingAgents
pip install -r requirements.txt
```

### Step 2: Start the API

```bash
python -m api.main
```

**That's it!** 🎉

### First Run Auto-Setup

On first run, the API automatically:
- ✅ Creates the database
- ✅ Generates a default API key
- ✅ Displays the key in console logs

**SAVE THE API KEY!** You'll see output like this:

```
======================================================================
FIRST RUN DETECTED - Setting up Trading Agents API
======================================================================

✓ Database initialized successfully!
✓ Default API key created!

======================================================================
YOUR API KEY (save this, it won't be shown again):

  BgA2YyMlxYus2aIGJ5KGCPQO-q8k05WxTirayVZgPrM

======================================================================
Use this key in the X-API-Key header for all API requests.
Manage keys with: python -m api.cli_admin
======================================================================
```

## Test Your API

Open your browser:
- **Interactive Docs**: http://localhost:8001/docs
- **Alternative Docs**: http://localhost:8001/redoc

Or test with curl:

```bash
curl -X POST "http://localhost:8001/api/v1/analyses" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "analysis_date": "2025-10-21",
    "selected_analysts": ["market"],
    "research_depth": 1
  }'
```

## Alternative Startup Methods

```bash
# Option 1: Direct Python (default port 8001)
python -m api.main

# Option 2: Startup script
./run_api.sh

# Option 3: Custom port
API_PORT=8002 python -m api.main

# Option 4: Using uvicorn directly
uvicorn api.main:app --host 0.0.0.0 --port 8001
```

## Managing API Keys

After initial setup, manage keys with the admin CLI:

```bash
# List all API keys
python -m api.cli_admin list-keys

# Create a new API key
python -m api.cli_admin create-key "Frontend App"

# Revoke an API key
python -m api.cli_admin revoke-key 1

# Activate a revoked key
python -m api.cli_admin activate-key 1
```

## Configuration (Optional)

Set these environment variables before starting:

```bash
# Maximum concurrent analyses (default: 4)
export MAX_CONCURRENT_ANALYSES=8

# Custom database location
export API_DATABASE_URL="sqlite:///./my_custom.db"

# Custom port
export API_PORT=8002
```

## Troubleshooting

**"Invalid or inactive API key"**
- Use the exact key from the first-run console output
- Check active keys: `python -m api.cli_admin list-keys`

**Port already in use**
- Change port: `API_PORT=8002 python -m api.main`

**Database already exists but no API key**
- Create one: `python -m api.cli_admin create-key "My Key"`

**Import errors**
- Ensure you're in the TradingAgents directory
- Use: `python -m api.main` (not `python api/main.py`)

## Full Documentation

- Quick Start: `QUICKSTART.md` (one-command setup)
- This Guide: `START_API.md` (you are here)
- Detailed Guide: `API_QUICKSTART.md`
- Full API Docs: `README.md`
- Implementation: `API_IMPLEMENTATION_SUMMARY.md`

## What's Next?

1. Check out the interactive docs at http://localhost:8001/docs
2. Try creating an analysis via the API
3. Build your frontend integration
4. Read the full documentation in `README.md`

Your Trading Agents API is ready! 🚀
