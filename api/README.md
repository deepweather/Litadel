# Litadel REST API

FastAPI-based REST API for managing multi-agent trading analyses with real-time WebSocket support.

## Features

- **REST API** for creating, monitoring, and managing trading analyses
- **WebSocket** support for real-time status updates
- **Parallel execution** of multiple analyses
- **SQLite database** for persistent storage
- **API key authentication** for secure access

## Quick Start

### 1. Start the API

```bash
uv run litadel-api
```

The API will be available at `http://localhost:8002`

On first run, a default API key will be generated and shown in the console. **Save this key!**

### 2. API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8002/docs
- **ReDoc**: http://localhost:8002/redoc

### 3. Create an Analysis

```bash
curl -X POST "http://localhost:8002/api/v1/analyses" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "selected_analysts": ["macro", "market", "news", "fundamentals"]
  }'
```

### 4. Monitor via WebSocket

Connect to `ws://localhost:8002/api/v1/ws/analyses/{analysis_id}` for real-time updates.

## API Key Management

Use the admin CLI to manage API keys:

```bash
# Create a new API key
uv run litadel-admin create-key "My Key Name"

# List all API keys
uv run litadel-admin list-keys

# Revoke an API key
uv run litadel-admin revoke-key <key_id>

# Activate a revoked key
uv run litadel-admin activate-key <key_id>

# Initialize database (usually automatic)
uv run litadel-admin init-database
```

## Main Endpoints

### Analyses
- `POST /api/v1/analyses` - Create and start new analysis
- `GET /api/v1/analyses` - List all analyses
- `GET /api/v1/analyses/{id}` - Get analysis details
- `DELETE /api/v1/analyses/{id}` - Delete analysis

### Reports & Logs
- `GET /api/v1/analyses/{id}/reports` - Get all reports
- `GET /api/v1/analyses/{id}/logs` - Get execution logs

### Market Data
- `GET /api/v1/data/cache` - List cached tickers
- `GET /api/v1/data/cache/{ticker}` - Get cached market data

### Real-time Updates
- `WS /api/v1/ws/analyses/{id}` - WebSocket for live status updates

## Configuration

Environment variables:
- `API_PORT` - Port to run on (default: 8002)
- `API_DATABASE_URL` - Database connection string (default: sqlite:///./api_database.db)
- `API_RELOAD` - Enable auto-reload during development (default: false)

Example:
```bash
API_PORT=8000 API_RELOAD=true uv run litadel-api
```

## Architecture

- **FastAPI** - Web framework
- **SQLAlchemy** - ORM for database
- **ThreadPoolExecutor** - Parallel analysis execution
- **WebSockets** - Real-time updates
- **Pydantic** - Request/response validation
