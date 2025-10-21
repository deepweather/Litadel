# Trading Agents REST API

FastAPI-based REST API for managing multi-agent trading analyses with real-time WebSocket support.

## Features

- **REST API** for creating, monitoring, and managing trading analyses
- **WebSocket** support for real-time status updates
- **Parallel execution** of multiple analyses (configurable concurrency)
- **SQLite database** for persistent storage
- **API key authentication** for secure access
- **Complete analysis history** with logs and reports

## Installation

1. Install API dependencies:
```bash
cd TradingAgents
pip install -r requirements-api.txt
```

2. Initialize the database and create an API key:
```bash
python -m api.cli_admin init-database
python -m api.cli_admin create-key "My First Key"
```

Save the generated API key - you'll need it for all API requests.

## Running the API

Start the API server:
```bash
python -m api.main
```

Or with uvicorn directly:
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Quick Start

### 1. Create an Analysis

```bash
curl -X POST "http://localhost:8000/api/v1/analyses" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "analysis_date": "2025-10-21",
    "selected_analysts": ["market", "news", "social", "fundamentals"],
    "research_depth": 1
  }'
```

Response:
```json
{
  "id": "uuid-here",
  "ticker": "AAPL",
  "analysis_date": "2025-10-21",
  "status": "pending",
  "progress_percentage": 0,
  ...
}
```

### 2. Monitor via WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/analyses/{analysis_id}');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(`Status: ${update.status}, Progress: ${update.progress_percentage}%`);
};
```

### 3. Get Analysis Results

```bash
curl "http://localhost:8000/api/v1/analyses/{analysis_id}" \
  -H "X-API-Key: YOUR_API_KEY"
```

## API Endpoints

### Analyses

- `POST /api/v1/analyses` - Create and start new analysis
- `GET /api/v1/analyses` - List all analyses (with filtering)
- `GET /api/v1/analyses/{id}` - Get full analysis details
- `GET /api/v1/analyses/{id}/status` - Get current status
- `GET /api/v1/analyses/{id}/reports` - Get all reports
- `GET /api/v1/analyses/{id}/reports/{type}` - Get specific report
- `GET /api/v1/analyses/{id}/logs` - Get execution logs
- `DELETE /api/v1/analyses/{id}` - Cancel/delete analysis

### Tickers

- `GET /api/v1/tickers` - List all tickers with analysis counts
- `GET /api/v1/tickers/{ticker}/analyses` - Get all analyses for ticker
- `GET /api/v1/tickers/{ticker}/latest` - Get latest analysis for ticker

### Data

- `GET /api/v1/data/cache` - List cached ticker data
- `GET /api/v1/data/cache/{ticker}` - Get cached market data

### WebSocket

- `WS /api/v1/ws/analyses/{id}` - Real-time status updates

## API Key Management

### Create API Key
```bash
python -m api.cli_admin create-key "Description"
```

### List API Keys
```bash
python -m api.cli_admin list-keys
```

### Revoke API Key
```bash
python -m api.cli_admin revoke-key <key_id>
```

### Activate API Key
```bash
python -m api.cli_admin activate-key <key_id>
```

## Configuration

### Environment Variables

- `API_DATABASE_URL` - Database connection string (default: `sqlite:///./api_database.db`)
- `MAX_CONCURRENT_ANALYSES` - Maximum parallel analyses (default: `4`)
- Standard TradingAgents config (LLM providers, API keys, etc.)

## Architecture

```
api/
├── main.py              # FastAPI application
├── database.py          # SQLAlchemy models
├── auth.py              # API key authentication
├── state_manager.py     # Analysis execution manager
├── models/              # Pydantic request/response models
├── endpoints/           # REST endpoint handlers
└── websockets/          # WebSocket handlers
```

## Database Schema

- **analyses** - Analysis metadata and status
- **analysis_logs** - Execution logs (tool calls, reasoning)
- **analysis_reports** - Generated reports (by type)
- **api_keys** - Authentication keys

## Parallel Execution

The API uses a `ThreadPoolExecutor` to run multiple analyses concurrently:

- Default: 4 concurrent analyses
- Configurable via `MAX_CONCURRENT_ANALYSES` env var
- Each analysis runs in its own thread
- Database writes are thread-safe
- Cached data is read-only (thread-safe)

## Example Frontend Integration

```javascript
class TradingAnalysisClient {
  constructor(apiKey, baseURL = 'http://localhost:8000') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async createAnalysis(ticker, date, analysts = ['market', 'news']) {
    const response = await fetch(`${this.baseURL}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker,
        analysis_date: date,
        selected_analysts: analysts,
        research_depth: 1,
      }),
    });
    return await response.json();
  }

  connectWebSocket(analysisId, onUpdate) {
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/analyses/${analysisId}`);
    ws.onmessage = (event) => onUpdate(JSON.parse(event.data));
    return ws;
  }

  async getAnalysis(analysisId) {
    const response = await fetch(
      `${this.baseURL}/api/v1/analyses/${analysisId}`,
      { headers: { 'X-API-Key': this.apiKey } }
    );
    return await response.json();
  }
}
```

## Troubleshooting

### Database locked error
SQLite has limited concurrent write support. If you get database locked errors:
- Reduce `MAX_CONCURRENT_ANALYSES`
- Or switch to PostgreSQL by changing `API_DATABASE_URL`

### Import errors
Make sure you're running from the TradingAgents root directory:
```bash
cd TradingAgents
python -m api.main
```

### WebSocket connection refused
Check that the server is running and CORS is properly configured for your frontend origin.

## Production Deployment

For production use:

1. **Use PostgreSQL** instead of SQLite
2. **Secure CORS** - Set specific allowed origins in `main.py`
3. **HTTPS/WSS** - Use reverse proxy (nginx) with SSL
4. **Monitoring** - Add logging, metrics, and health checks
5. **Rate limiting** - Add rate limiting middleware
6. **Backup** - Regular database backups

## License

Same as TradingAgents/Litadel main project.

