"""FastAPI Trading Agents API application."""

import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

from api.auth import create_api_key
from api.backtest_executor import get_backtest_executor, shutdown_backtest_executor
from api.database import SessionLocal, init_db
from api.endpoints import analyses, auth, backtest_execution, backtests, data, portfolios, tickers
from api.state_manager import get_executor, shutdown_executor
from api.websockets import status

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Initializing Trading Agents API...")

    # Check if this is first run (database doesn't exist)
    db_path = Path(os.getenv("API_DATABASE_URL", "sqlite:///./api_database.db").replace("sqlite:///", ""))
    is_first_run = not db_path.exists()

    # Initialize database
    init_db()

    # If first run, create a default API key
    if is_first_run:
        logger.info("=" * 70)
        logger.info("FIRST RUN DETECTED - Setting up Trading Agents API")
        logger.info("=" * 70)

        db = SessionLocal()
        try:
            plain_key, _db_key = create_api_key(db, "Default API Key")
            logger.info("")
            logger.info("✓ Database initialized successfully!")
            logger.info("✓ Default API key created!")
            logger.info("")
            logger.info("=" * 70)
            logger.info("YOUR API KEY (save this, it won't be shown again):")
            logger.info("")
            logger.info(f"  {plain_key}")
            logger.info("")
            logger.info("=" * 70)
            logger.info("Use this key in the X-API-Key header for all API requests.")
            logger.info("Manage keys with: python -m api.cli_admin")
            logger.info("=" * 70)
            logger.info("")
        except Exception as e:
            logger.exception(f"Failed to create default API key: {e}")
        finally:
            db.close()

    get_executor()
    get_backtest_executor()
    logger.info("Trading Agents API started successfully")
    logger.info(f"API Documentation: http://localhost:{os.getenv('API_PORT', '8001')}/docs")

    yield

    # Shutdown
    logger.info("Shutting down Trading Agents API...")
    shutdown_executor()
    shutdown_backtest_executor()
    logger.info("Trading Agents API shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Trading Agents API",
    description="REST API for managing multi-agent trading analyses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth.router)
app.include_router(analyses.router)
app.include_router(tickers.router)
app.include_router(data.router)
app.include_router(portfolios.router)
app.include_router(backtests.router)
app.include_router(backtest_execution.router)
app.include_router(status.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Trading Agents API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


def run_api():
    """Entry point for running the API via CLI command."""
    port = int(os.getenv("API_PORT", "8002"))
    # Reload disabled by default to prevent shutdown issues during analysis
    # Set API_RELOAD=true in environment to enable auto-reload during development
    reload = os.getenv("API_RELOAD", "false").lower() == "true"

    if reload:
        logger.warning("Auto-reload is enabled - analyses will be cancelled if code changes are detected")

    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        log_level="info",
    )


if __name__ == "__main__":
    run_api()
