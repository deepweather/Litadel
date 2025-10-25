"""Response models for API endpoints."""

from datetime import datetime

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(..., description="Error message")
    detail: str | None = Field(None, description="Additional error details")


class ReportResponse(BaseModel):
    """Single report section."""

    report_type: str = Field(..., description="Type of report")
    content: str = Field(..., description="Report content in markdown")
    created_at: datetime = Field(..., description="When the report was created")


class LogEntry(BaseModel):
    """Single log entry."""

    id: str = Field(..., description="Unique log identifier")
    agent_name: str = Field(..., description="Agent that generated this log")
    timestamp: datetime = Field(..., description="When the log was created")
    log_type: str = Field(..., description="Type of log (Tool Call, Reasoning, System)")
    content: str = Field(..., description="Log content")


class AnalysisStatusResponse(BaseModel):
    """Lightweight analysis status."""

    id: str = Field(..., description="Analysis ID")
    status: str = Field(..., description="Current status")
    progress_percentage: int = Field(..., description="Progress percentage (0-100)")
    current_agent: str | None = Field(None, description="Currently active agent")
    updated_at: datetime = Field(..., description="Last update timestamp")


class TradingDecision(BaseModel):
    """Trading decision extracted from analysis reports."""

    decision: str = Field(..., description="Trading decision (BUY/SELL/HOLD)")
    confidence: int | None = Field(None, description="Confidence percentage")
    rationale: str | None = Field(None, description="Brief rationale for the decision")


class AnalysisSummary(BaseModel):
    """Summary view of an analysis."""

    id: str = Field(..., description="Analysis ID")
    ticker: str = Field(..., description="Ticker symbol")
    analysis_date: str = Field(..., description="Analysis date")
    status: str = Field(..., description="Current status")
    selected_analysts: list[str] = Field(default_factory=list, description="Selected analysts for this analysis")
    created_at: datetime = Field(..., description="Creation timestamp")
    completed_at: datetime | None = Field(None, description="Completion timestamp")
    error_message: str | None = Field(None, description="Error message if failed")
    trading_decision: TradingDecision | None = Field(None, description="Extracted trading decision")
    owner_username: str | None = Field(None, description="Username of the owner (if owned by a user)")


class AnalysisResponse(BaseModel):
    """Full analysis details."""

    id: str = Field(..., description="Analysis ID")
    ticker: str = Field(..., description="Ticker symbol")
    analysis_date: str = Field(..., description="Analysis date")
    status: str = Field(..., description="Current status")
    config: dict = Field(..., description="Analysis configuration")
    selected_analysts: list[str] = Field(default_factory=list, description="Selected analysts for this analysis")
    reports: list[ReportResponse] = Field(default_factory=list, description="All report sections")
    progress_percentage: int = Field(..., description="Progress percentage (0-100)")
    current_agent: str | None = Field(None, description="Currently active agent")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    completed_at: datetime | None = Field(None, description="Completion timestamp")
    error_message: str | None = Field(None, description="Error message if failed")
    trading_decision: TradingDecision | None = Field(None, description="Extracted trading decision")
    owner_username: str | None = Field(None, description="Username of the owner (if owned by a user)")


class TickerInfo(BaseModel):
    """Ticker information summary."""

    ticker: str = Field(..., description="Ticker symbol")
    analysis_count: int = Field(..., description="Number of analyses")
    latest_date: str | None = Field(None, description="Most recent analysis date")


class CachedDataResponse(BaseModel):
    """Cached market data response."""

    ticker: str = Field(..., description="Ticker symbol")
    date_range: dict[str, str] = Field(..., description="Start and end dates")
    data: list[dict] = Field(..., description="OHLCV data records")


class CachedTickerInfo(BaseModel):
    """Information about cached ticker data."""

    ticker: str = Field(..., description="Ticker symbol")
    date_range: dict[str, str] = Field(..., description="Start and end dates")
    record_count: int = Field(..., description="Number of records")
