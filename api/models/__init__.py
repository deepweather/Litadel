"""Pydantic models for API requests and responses."""

from api.models.backtest import (
    BacktestPerformanceMetrics,
    BacktestResponse,
    BacktestSnapshotResponse,
    BacktestSummary,
    BacktestTradeResponse,
    CreateBacktestRequest,
    EquityCurveDataPoint,
    UpdateBacktestRequest,
)
from api.models.portfolio import (
    CreatePortfolioRequest,
    CreatePositionRequest,
    PortfolioResponse,
    PortfolioSummary,
    PositionResponse,
    UpdatePortfolioRequest,
    UpdatePositionRequest,
)
from api.models.requests import CreateAnalysisRequest, UpdateAnalysisRequest
from api.models.responses import (
    AnalysisResponse,
    AnalysisStatusResponse,
    AnalysisSummary,
    CachedDataResponse,
    ErrorResponse,
    LogEntry,
    ReportResponse,
    TickerInfo,
    TradingDecision,
)

__all__ = [
    "AnalysisResponse",
    "AnalysisStatusResponse",
    "AnalysisSummary",
    "BacktestPerformanceMetrics",
    "BacktestResponse",
    "BacktestSnapshotResponse",
    "BacktestSummary",
    "BacktestTradeResponse",
    "CachedDataResponse",
    "CreateAnalysisRequest",
    "CreateBacktestRequest",
    "CreatePortfolioRequest",
    "CreatePositionRequest",
    "EquityCurveDataPoint",
    "ErrorResponse",
    "LogEntry",
    "PortfolioResponse",
    "PortfolioSummary",
    "PositionResponse",
    "ReportResponse",
    "TickerInfo",
    "TradingDecision",
    "UpdateAnalysisRequest",
    "UpdateBacktestRequest",
    "UpdatePortfolioRequest",
    "UpdatePositionRequest",
]
