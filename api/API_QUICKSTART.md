# Trading Agents API - Quick Start Guide

This guide will get your FastAPI Trading Agents API up and running in minutes.

## Prerequisites

- Python 3.10+
- TradingAgents installed and configured
- Required environment variables (OPENAI_API_KEY, ALPHA_VANTAGE_API_KEY, etc.)

## Setup (5 minutes)

### 1. Install API Dependencies

```bash
cd TradingAgents
pip install -r requirements-api.txt
```

### 2. Initialize Database

```bash
python -m api.cli_admin init-database
```

### 3. Create Your First API Key

```bash
python -m api.cli_admin create-key "Development Key"
```

**IMPORTANT**: Save the API key that's displayed. You won't be able to see it again!

Example output:
```
✓ API Key created successfully!

Name: Development Key
Created: 2025-10-21 14:30:00

API Key (save this, it won't be shown again):
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Use this key in the X-API-Key header for all API requests.
```

### 4. Start the API Server

```bash
python -m api.main
```

Or use the startup script:
```bash
./run_api.sh
```

The API will start at: `http://localhost:8000`

## Test Your API (2 minutes)

### View API Documentation

Open your browser to:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Create Your First Analysis

Replace `YOUR_API_KEY` with the key you created:

```bash
curl -X POST "http://localhost:8000/api/v1/analyses" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "analysis_date": "2025-10-21",
    "selected_analysts": ["market", "news"],
    "research_depth": 1
  }'
```

You'll get a response with an `analysis_id`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ticker": "AAPL",
  "status": "pending",
  ...
}
```

### Check Status

```bash
curl "http://localhost:8000/api/v1/analyses/YOUR_ANALYSIS_ID/status" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Get Results

```bash
curl "http://localhost:8000/api/v1/analyses/YOUR_ANALYSIS_ID" \
  -H "X-API-Key: YOUR_API_KEY"
```

## Using the Python Client

### Install Additional Dependencies

```bash
pip install httpx websockets
```

### Run Example Client

Edit `api/example_client.py` and replace `YOUR_API_KEY`, then:

```bash
python -m api.example_client
```

This will:
1. Create an analysis for AAPL
2. Monitor it via WebSocket
3. Display the results

## Next Steps

### Multiple Parallel Analyses

Create multiple analyses at once - they'll run in parallel:

```bash
# Start 3 analyses
for ticker in AAPL MSFT GOOGL; do
  curl -X POST "http://localhost:8000/api/v1/analyses" \
    -H "X-API-Key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"ticker\": \"$ticker\", \"analysis_date\": \"2025-10-21\", \"selected_analysts\": [\"market\", \"news\"], \"research_depth\": 1}"
done
```

### List All Analyses

```bash
curl "http://localhost:8000/api/v1/analyses" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Get Analyses for Specific Ticker

```bash
curl "http://localhost:8000/api/v1/tickers/AAPL/analyses" \
  -H "X-API-Key: YOUR_API_KEY"
```

### View Cached Market Data

```bash
# List all cached tickers
curl "http://localhost:8000/api/v1/data/cache" \
  -H "X-API-Key: YOUR_API_KEY"

# Get data for specific ticker
curl "http://localhost:8000/api/v1/data/cache/AAPL" \
  -H "X-API-Key: YOUR_API_KEY"
```

## WebSocket Real-Time Monitoring

### JavaScript Example

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/analyses/YOUR_ANALYSIS_ID');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(`Status: ${update.status}, Progress: ${update.progress_percentage}%`);
  
  if (update.status === 'completed') {
    console.log('Analysis finished!');
    ws.close();
  }
};

ws.onerror = (error) => console.error('WebSocket error:', error);
```

### Python Example

```python
import asyncio
import websockets
import json

async def monitor_analysis(analysis_id, api_key):
    uri = f"ws://localhost:8000/api/v1/ws/analyses/{analysis_id}"
    
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            
            print(f"Status: {data['status']}, Progress: {data['progress_percentage']}%")
            
            if data['status'] in ['completed', 'failed', 'cancelled']:
                break

asyncio.run(monitor_analysis('YOUR_ANALYSIS_ID', 'YOUR_API_KEY'))
```

## API Key Management

### List All Keys

```bash
python -m api.cli_admin list-keys
```

### Create Additional Key

```bash
python -m api.cli_admin create-key "Frontend App"
```

### Revoke a Key

```bash
python -m api.cli_admin revoke-key 1
```

### Activate a Key

```bash
python -m api.cli_admin activate-key 1
```

## Configuration

### Environment Variables

Set these before starting the API:

```bash
# Maximum concurrent analyses (default: 4)
export MAX_CONCURRENT_ANALYSES=8

# Database URL (default: SQLite in current directory)
export API_DATABASE_URL="sqlite:///./api_database.db"

# Or use PostgreSQL for production
export API_DATABASE_URL="postgresql://user:pass@localhost/trading_agents"

# Standard TradingAgents config
export OPENAI_API_KEY="your-key"
export ALPHA_VANTAGE_API_KEY="your-key"
```

## Troubleshooting

### "Invalid or inactive API key"
- Make sure you're using the exact key that was displayed when you created it
- Check that the key hasn't been revoked: `python -m api.cli_admin list-keys`

### "Analysis not found"
- The analysis ID must be exactly as returned from the create endpoint
- Check available analyses: `curl "http://localhost:8000/api/v1/analyses" -H "X-API-Key: YOUR_KEY"`

### Database locked
- SQLite has limited concurrency
- Reduce `MAX_CONCURRENT_ANALYSES` to 2-3
- Or switch to PostgreSQL

### Import errors
- Make sure you're in the TradingAgents directory
- Run with: `python -m api.main` (not `python api/main.py`)

## Full API Reference

See `api/README.md` for complete documentation of all endpoints and features.

## Production Deployment

For production use, see the deployment section in `api/README.md`. Key points:

1. Use PostgreSQL instead of SQLite
2. Configure CORS for your frontend domain
3. Use HTTPS/WSS with reverse proxy
4. Add rate limiting
5. Set up monitoring and logging

## Support

For issues or questions:
- Check the full documentation: `api/README.md`
- Review the main TradingAgents README
- Check the interactive docs: http://localhost:8000/docs

