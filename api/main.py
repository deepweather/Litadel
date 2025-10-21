"""FastAPI Trading Agents API application."""

import logging
import sys
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

from api.database import init_db
from api.endpoints import analyses, data, tickers
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
    init_db()
    get_executor()
    logger.info("Trading Agents API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Trading Agents API...")
    shutdown_executor()
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
app.include_router(analyses.router)
app.include_router(tickers.router)
app.include_router(data.router)
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


if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("API_PORT", "8002"))  # Default to 8001 instead of 8000
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )

