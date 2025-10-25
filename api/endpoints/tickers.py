"""Ticker history endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.auth import get_current_auth
from api.auth.dependencies import get_current_user_jwt
from api.database import Analysis, Position, User, get_db
from api.endpoints.analyses import get_analysis
from api.models import AnalysisResponse, AnalysisSummary, TickerInfo
from cli.asset_detection import detect_asset_class

router = APIRouter(prefix="/api/v1/tickers", tags=["tickers"])


@router.get("", response_model=list[TickerInfo])
async def list_tickers(
    db: Session = Depends(get_db),
    auth=Depends(get_current_auth),
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
    auth=Depends(get_current_auth),
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
    auth=Depends(get_current_auth),
):
    """Get the most recent analysis for a ticker."""
    analysis = db.query(Analysis).filter(Analysis.ticker == ticker.upper()).order_by(Analysis.created_at.desc()).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analyses found for ticker {ticker}",
        )

    # Use the existing get_analysis function
    return await get_analysis(analysis.id, db, auth)


@router.get("/{ticker}/summary", response_model=dict)
async def get_ticker_summary(
    ticker: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """
    Get comprehensive summary for a ticker including:
    - Basic info (ticker, asset class)
    - Current price
    - Analysis history and statistics
    - Portfolio holdings across all user's portfolios
    """
    ticker = ticker.upper()

    # Get asset class
    asset_class = detect_asset_class(ticker)

    # Get current price
    from api.endpoints.portfolios import _get_current_price

    current_price = _get_current_price(ticker, db)

    # Get analysis statistics (only user's analyses)
    analyses = (
        db.query(Analysis)
        .filter(Analysis.ticker == ticker, Analysis.user_id == user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )

    analysis_count = len(analyses)
    completed_analyses = [a for a in analyses if a.status == "completed"]
    latest_analysis = analyses[0] if analyses else None

    # Count decisions (BUY/SELL/HOLD)
    from api.database import AnalysisReport
    from api.utils import extract_trading_decision

    decision_counts = {"BUY": 0, "SELL": 0, "HOLD": 0}
    latest_decision = None

    for analysis in completed_analyses:
        reports = db.query(AnalysisReport).filter(AnalysisReport.analysis_id == analysis.id).all()
        if reports:
            decision = extract_trading_decision(reports)
            if decision and decision.decision:
                decision_type = decision.decision.upper()
                if decision_type in decision_counts:
                    decision_counts[decision_type] += 1

                # Get latest decision
                if latest_decision is None and analysis == latest_analysis:
                    latest_decision = {
                        "decision": decision.decision,
                        "confidence": decision.confidence,
                        "rationale": decision.rationale,
                        "analysis_date": analysis.analysis_date,
                    }

    # Get portfolio holdings (only user's portfolios)
    from api.database import Portfolio

    positions = db.query(Position).join(Portfolio).filter(Portfolio.user_id == user.id, Position.ticker == ticker).all()

    # Calculate aggregate portfolio metrics
    total_quantity = 0.0
    total_cost_basis = 0.0
    open_positions_count = 0
    closed_positions_count = 0
    total_unrealized_pnl = 0.0
    total_realized_pnl = 0.0

    for position in positions:
        if position.status == "open":
            open_positions_count += 1
            total_quantity += position.quantity
            cost_basis = position.entry_price * position.quantity
            total_cost_basis += cost_basis

            if current_price:
                current_value = current_price * position.quantity
                total_unrealized_pnl += current_value - cost_basis
        else:
            closed_positions_count += 1
            if position.exit_price:
                cost_basis = position.entry_price * position.quantity
                exit_value = position.exit_price * position.quantity
                total_realized_pnl += exit_value - cost_basis

    avg_entry_price = total_cost_basis / total_quantity if total_quantity > 0 else None
    current_value = current_price * total_quantity if current_price and total_quantity > 0 else None
    total_pnl = total_unrealized_pnl + total_realized_pnl

    return {
        "ticker": ticker,
        "asset_class": asset_class,
        "current_price": current_price,
        "analyses": {
            "total_count": analysis_count,
            "completed_count": len(completed_analyses),
            "latest_date": latest_analysis.analysis_date if latest_analysis else None,
            "latest_status": latest_analysis.status if latest_analysis else None,
            "decision_counts": decision_counts,
            "latest_decision": latest_decision,
        },
        "holdings": {
            "total_positions": len(positions),
            "open_positions": open_positions_count,
            "closed_positions": closed_positions_count,
            "total_quantity": total_quantity,
            "avg_entry_price": avg_entry_price,
            "current_value": current_value,
            "total_pnl": total_pnl,
            "unrealized_pnl": total_unrealized_pnl,
            "realized_pnl": total_realized_pnl,
        },
    }


@router.get("/{ticker}/positions", response_model=list[dict])
async def get_ticker_positions(
    ticker: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get all positions for a ticker across all user's portfolios."""
    ticker = ticker.upper()

    from api.database import Portfolio
    from api.endpoints.portfolios import _build_position_response

    # Get all positions for this ticker from user's portfolios
    positions = (
        db.query(Position)
        .join(Portfolio)
        .filter(Portfolio.user_id == user.id, Position.ticker == ticker)
        .order_by(Position.entry_date.desc())
        .all()
    )

    result = []
    for position in positions:
        portfolio = db.query(Portfolio).filter(Portfolio.id == position.portfolio_id).first()
        position_response = _build_position_response(position, db)

        result.append(
            {
                "position": position_response.dict(),
                "portfolio_id": portfolio.id,
                "portfolio_name": portfolio.name,
            }
        )

    return result
