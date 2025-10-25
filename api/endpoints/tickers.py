"""Ticker history endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.auth import APIKey, get_current_api_key
from api.database import Analysis, get_db
from api.endpoints.analyses import get_analysis
from api.models import AnalysisResponse, AnalysisSummary, TickerInfo

router = APIRouter(prefix="/api/v1/tickers", tags=["tickers"])


@router.get("", response_model=list[TickerInfo])
async def list_tickers(
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """List all tickers with analysis count."""
    # Query for ticker stats
    results = (
        db.query(
            Analysis.ticker,
            func.count(Analysis.id).label("analysis_count"),
            func.max(Analysis.analysis_date).label("latest_date"),
        )
        .group_by(Analysis.ticker)
        .order_by(Analysis.ticker)
        .all()
    )

    return [
        TickerInfo(
            ticker=r.ticker,
            analysis_count=r.analysis_count,
            latest_date=r.latest_date,
        )
        for r in results
    ]


@router.get("/{ticker}/analyses", response_model=list[AnalysisSummary])
async def get_ticker_analyses(
    ticker: str,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get all analyses for a ticker."""
    analyses = db.query(Analysis).filter(Analysis.ticker == ticker.upper()).order_by(Analysis.created_at.desc()).all()

    return [
        AnalysisSummary(
            id=a.id,
            ticker=a.ticker,
            analysis_date=a.analysis_date,
            status=a.status,
            created_at=a.created_at,
            completed_at=a.completed_at,
            error_message=a.error_message,
        )
        for a in analyses
    ]


@router.get("/{ticker}/latest", response_model=AnalysisResponse)
async def get_ticker_latest_analysis(
    ticker: str,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get the most recent analysis for a ticker."""
    analysis = db.query(Analysis).filter(Analysis.ticker == ticker.upper()).order_by(Analysis.created_at.desc()).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analyses found for ticker {ticker}",
        )

    # Use the existing get_analysis function
    return await get_analysis(analysis.id, db, api_key)
