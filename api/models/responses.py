"""Response models for API endpoints."""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")


class ReportResponse(BaseModel):
    """Single report section."""

    report_type: str = Field(..., description="Type of report")
    content: str = Field(..., description="Report content in markdown")
    created_at: datetime = Field(..., description="When the report was created")


class LogEntry(BaseModel):
    """Single log entry."""

    timestamp: datetime = Field(..., description="When the log was created")
    log_type: str = Field(..., description="Type of log (Tool Call, Reasoning, System)")
    content: str = Field(..., description="Log content")


class AnalysisStatusResponse(BaseModel):
    """Lightweight analysis status."""

    id: str = Field(..., description="Analysis ID")
    status: str = Field(..., description="Current status")
    progress_percentage: int = Field(..., description="Progress percentage (0-100)")
    current_agent: Optional[str] = Field(None, description="Currently active agent")
    updated_at: datetime = Field(..., description="Last update timestamp")


class AnalysisSummary(BaseModel):
    """Summary view of an analysis."""

    id: str = Field(..., description="Analysis ID")
    ticker: str = Field(..., description="Ticker symbol")
    analysis_date: str = Field(..., description="Analysis date")
    status: str = Field(..., description="Current status")
    created_at: datetime = Field(..., description="Creation timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class AnalysisResponse(BaseModel):
    """Full analysis details."""

    id: str = Field(..., description="Analysis ID")
    ticker: str = Field(..., description="Ticker symbol")
    analysis_date: str = Field(..., description="Analysis date")
    status: str = Field(..., description="Current status")
    config: Dict = Field(..., description="Analysis configuration")
    reports: List[ReportResponse] = Field(
        default_factory=list, description="All report sections"
    )
    progress_percentage: int = Field(..., description="Progress percentage (0-100)")
    current_agent: Optional[str] = Field(None, description="Currently active agent")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class TickerInfo(BaseModel):
    """Ticker information summary."""

    ticker: str = Field(..., description="Ticker symbol")
    analysis_count: int = Field(..., description="Number of analyses")
    latest_date: Optional[str] = Field(None, description="Most recent analysis date")


class CachedDataResponse(BaseModel):
    """Cached market data response."""

    ticker: str = Field(..., description="Ticker symbol")
    date_range: Dict[str, str] = Field(..., description="Start and end dates")
    data: List[Dict] = Field(..., description="OHLCV data records")


class CachedTickerInfo(BaseModel):
    """Information about cached ticker data."""

    ticker: str = Field(..., description="Ticker symbol")
    date_range: Dict[str, str] = Field(..., description="Start and end dates")
    record_count: int = Field(..., description="Number of records")

