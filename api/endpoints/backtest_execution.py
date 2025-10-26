"""Backtest execution endpoints - separate from strategy generation endpoints."""

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.auth.dependencies import get_current_user_jwt
from api.backtest_executor import get_backtest_executor
from api.database import Backtest, BacktestEquityCurve, BacktestTrade, User, get_db
from litadel.backtest import BacktestConfig

router = APIRouter(prefix="/api/v1/backtest-execution", tags=["backtest-execution"])
logger = logging.getLogger(__name__)


# Request/Response Models
class ExecuteBacktestRequest(BaseModel):
    """Request to execute a backtest."""

    backtest_id: int = Field(..., description="ID of the backtest to execute")


class BacktestStatusResponse(BaseModel):
    """Backtest status response."""

    id: int
    status: str
    progress_percentage: int
    updated_at: datetime


class BacktestTradeResponse(BaseModel):
    """Individual trade from backtest."""

    id: int
    ticker: str
    entry_time: datetime | None
    exit_time: datetime | None
    entry_price: float | None = None
    quantity: float
    price: float
    pnl: float | None
    return_pct: float | None
    duration_days: float | None


class EquityCurvePoint(BaseModel):
    """Single equity curve data point."""

    date: datetime
    equity: float
    drawdown_pct: float


class BacktestResultsResponse(BaseModel):
    """Complete backtest results."""

    id: int
    name: str
    symbol: str
    status: str

    # Configuration
    start_date: datetime
    end_date: datetime
    initial_capital: float
    commission: float | None
    asset_class: str | None

    # Results
    final_portfolio_value: float | None
    total_return_pct: float | None
    sharpe_ratio: float | None
    max_drawdown_pct: float | None
    win_rate: float | None
    total_trades: int | None
    avg_trade_duration_days: float | None

    # Metadata
    execution_time_seconds: float | None
    data_source: str | None
    created_at: datetime
    completed_at: datetime | None

    # Detailed data
    trades: list[BacktestTradeResponse] = []
    equity_curve: list[EquityCurvePoint] = []


@router.post("", response_model=BacktestStatusResponse, status_code=status.HTTP_201_CREATED)
async def execute_backtest(
    request: ExecuteBacktestRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """
    Start a backtest execution.

    Executes an existing backtest record by ID.
    """
    # Fetch existing backtest
    backtest = db.query(Backtest).filter(Backtest.id == request.backtest_id).first()

    if not backtest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Backtest {request.backtest_id} not found")

    # Validate ownership
    if backtest.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to execute this backtest"
        )

    # Validate single ticker
    ticker_list = json.loads(backtest.ticker_list)
    if len(ticker_list) > 1:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Multi-ticker backtests are not yet supported. Please use a single ticker.",
        )

    if len(ticker_list) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No tickers specified in backtest")

    symbol = ticker_list[0]

    # Build config from backtest record
    config = BacktestConfig(
        symbol=symbol,
        start_date=backtest.start_date.strftime("%Y-%m-%d"),
        end_date=backtest.end_date.strftime("%Y-%m-%d"),
        strategy_class_code=backtest.strategy_code_python,
        initial_capital=backtest.initial_capital,
        commission=0.002,
        asset_class=backtest.asset_class,
    )

    # Submit for execution
    executor = get_backtest_executor()
    try:
        executor.start_backtest(backtest.id, config)
        logger.info(f"Backtest {backtest.id} submitted for execution")
    except Exception as e:
        logger.exception(f"Failed to start backtest {backtest.id}: {e!s}")
        backtest.status = "failed"
        backtest.error_traceback = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to start backtest: {e!s}"
        ) from e

    return BacktestStatusResponse(
        id=backtest.id,
        status=backtest.status,
        progress_percentage=backtest.progress_percentage,
        updated_at=backtest.updated_at,
    )


@router.get("/{backtest_id}/status", response_model=BacktestStatusResponse)
async def get_backtest_status(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get current status of a backtest."""
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    if not backtest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Backtest {backtest_id} not found")

    # Check ownership
    if backtest.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this backtest"
        )

    return BacktestStatusResponse(
        id=backtest.id,
        status=backtest.status,
        progress_percentage=backtest.progress_percentage,
        updated_at=backtest.updated_at,
    )


@router.get("/{backtest_id}/results", response_model=BacktestResultsResponse)
async def get_backtest_results(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get full backtest results including trades and equity curve."""
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    if not backtest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Backtest {backtest_id} not found")

    # Check ownership
    if backtest.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this backtest"
        )

    # Get trades
    trades = db.query(BacktestTrade).filter(BacktestTrade.backtest_id == backtest_id).all()
    trade_responses = [
        BacktestTradeResponse(
            id=t.id,
            ticker=t.ticker,
            entry_time=t.entry_time,
            exit_time=t.exit_time,
            entry_price=None,  # Not stored directly
            quantity=t.quantity,
            price=t.price,
            pnl=t.pnl,
            return_pct=t.return_pct,
            duration_days=t.duration_days,
        )
        for t in trades
    ]

    # Get equity curve
    equity_points = (
        db.query(BacktestEquityCurve)
        .filter(BacktestEquityCurve.backtest_id == backtest_id)
        .order_by(BacktestEquityCurve.date)
        .all()
    )

    equity_curve = [
        EquityCurvePoint(
            date=point.date,
            equity=point.equity,
            drawdown_pct=point.drawdown_pct,
        )
        for point in equity_points
    ]

    # Parse ticker from ticker_list
    ticker_list = json.loads(backtest.ticker_list)
    symbol = ticker_list[0] if ticker_list else "UNKNOWN"

    return BacktestResultsResponse(
        id=backtest.id,
        name=backtest.name,
        symbol=symbol,
        status=backtest.status,
        start_date=backtest.start_date,
        end_date=backtest.end_date,
        initial_capital=backtest.initial_capital,
        commission=backtest.commission,
        asset_class=backtest.asset_class,
        final_portfolio_value=backtest.final_portfolio_value,
        total_return_pct=backtest.total_return_pct,
        sharpe_ratio=backtest.sharpe_ratio,
        max_drawdown_pct=backtest.max_drawdown_pct,
        win_rate=backtest.win_rate,
        total_trades=backtest.total_trades,
        avg_trade_duration_days=backtest.avg_trade_duration_days,
        execution_time_seconds=backtest.execution_time_seconds,
        data_source=backtest.data_source,
        created_at=backtest.created_at,
        completed_at=backtest.completed_at,
        trades=trade_responses,
        equity_curve=equity_curve,
    )


@router.delete("/{backtest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_backtest(
    backtest_id: int,
    permanent: bool = Query(False, description="Permanently delete from database"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Cancel and/or delete a backtest."""
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    if not backtest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Backtest {backtest_id} not found")

    # Check ownership
    if backtest.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this backtest"
        )

    # Try to cancel if running
    if backtest.status in ["pending", "running"]:
        executor = get_backtest_executor()
        executor.cancel_backtest(backtest_id)

    # Delete from database if requested
    if permanent:
        db.delete(backtest)
        db.commit()
    elif backtest.status not in ["cancelled", "failed", "completed"]:
        # Just mark as cancelled
        backtest.status = "cancelled"
        backtest.updated_at = datetime.utcnow()
        db.commit()
