"""Backtest management endpoints."""

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.auth.dependencies import get_current_user_jwt
from api.backtest_executor import get_backtest_executor
from api.backtest_metrics import (
    calculate_avg_trade_duration,
    calculate_max_drawdown,
    calculate_profit_factor,
    calculate_sharpe_ratio,
    calculate_total_return,
    calculate_trade_statistics,
    calculate_win_rate,
)
from api.database import Backtest, BacktestSnapshot, BacktestTrade, User, get_db
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
from litadel.agents.utils.parameter_extraction_agent import create_parameter_extraction_agent
from litadel.agents.utils.strategy_dsl_agent import create_strategy_dsl_generator, validate_strategy_dsl
from litadel.default_config import DEFAULT_CONFIG

router = APIRouter(prefix="/api/v1/backtests", tags=["backtests"])
logger = logging.getLogger(__name__)


# Request model for strategy DSL generation
class GenerateStrategyDSLRequest(BaseModel):
    """Request to generate strategy DSL YAML."""

    strategy_description: str = Field(..., description="Natural language strategy description")
    ticker_list: list[str] = Field(
        default_factory=list, description="List of tickers to trade (optional - will extract from description if empty)"
    )
    initial_capital: float = Field(..., description="Initial capital", gt=0)
    rebalance_frequency: str = Field(..., description="Rebalancing frequency")
    position_sizing: str = Field(..., description="Position sizing strategy")
    max_positions: int = Field(..., description="Maximum number of positions")
    strategy_type: str = Field(default="agent_managed", description="Strategy type: agent_managed or technical_dsl")


# Request models for conversational trading interface
class ClarificationQuestion(BaseModel):
    """A clarification question for missing parameters."""

    question: str = Field(..., description="The question to ask")
    field: str = Field(..., description="The field this question is about")
    suggestions: list = Field(default_factory=list, description="Suggested values")
    field_type: str = Field(..., description="Input type: text, textarea, number, date, array, select")


class ExtractParametersRequest(BaseModel):
    """Request to extract parameters from natural language."""

    user_message: str = Field(..., description="User's natural language input")
    conversation_history: list[dict] = Field(default_factory=list, description="Previous messages for context")


class ExtractParametersResponse(BaseModel):
    """Extracted parameters from natural language."""

    intent: str = Field(..., description="Detected intent: backtest, live_trading, analysis, unclear")
    extracted: dict = Field(..., description="Extracted parameters")
    missing: list[str] = Field(..., description="Required fields that are missing")
    confidence: dict = Field(..., description="Confidence scores (0-1) for each extracted field")
    needs_clarification: bool = Field(..., description="Whether clarification is needed")
    clarification_questions: list[ClarificationQuestion] = Field(
        default_factory=list, description="Questions to ask user"
    )
    suggested_defaults: dict = Field(default_factory=dict, description="Smart defaults for missing fields")


class ExecuteTradingIntentRequest(BaseModel):
    """Request to execute a trading intent."""

    intent: str = Field(..., description="Intent: backtest, live_trading, analysis")
    parameters: dict = Field(..., description="All parameters")
    strategy_dsl_yaml: str | None = Field(None, description="Pre-generated YAML (optional)")


def _get_llm_for_strategy_generation():
    """Initialize the LLM for strategy DSL generation.

    Uses quick_think_llm for faster generation while maintaining quality.
    """
    config = DEFAULT_CONFIG
    llm_provider = config.get("llm_provider", "openai").lower()

    try:
        if llm_provider == "openai" or llm_provider == "ollama" or llm_provider == "openrouter":
            return ChatOpenAI(
                model=config.get("quick_think_llm", "gpt-4o-mini"),  # Use faster model
                base_url=config.get("backend_url", "https://api.openai.com/v1"),
                # Let model use its default temperature (typically 1.0)
                # Some models don't support custom temperature values
            )
        if llm_provider == "anthropic":
            return ChatAnthropic(
                model=config.get("quick_think_llm", "claude-3-haiku-20240307"),  # Faster Anthropic model
                base_url=config.get("backend_url"),
                # Let model use its default temperature
            )
        if llm_provider == "google":
            return ChatGoogleGenerativeAI(
                model=config.get("quick_think_llm", "gemini-1.5-flash"),  # Faster Google model
                # Let model use its default temperature
            )
        # Default to OpenAI if unsupported provider
        return ChatOpenAI(
            model="gpt-4o-mini",
        )
    except Exception as e:
        logger.error(f"Failed to initialize LLM: {e}")
        # Fallback to basic OpenAI configuration
        return ChatOpenAI(model="gpt-4o-mini")


def _verify_backtest_ownership(backtest_id: int, user_id: int, db: Session) -> Backtest:
    """Verify that the backtest belongs to the user."""
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    if not backtest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Backtest {backtest_id} not found",
        )

    if backtest.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this backtest",
        )

    return backtest


@router.post("", response_model=BacktestResponse, status_code=status.HTTP_201_CREATED)
async def create_backtest(
    request: CreateBacktestRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Create a new backtest."""
    # Parse dates
    start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(request.end_date, "%Y-%m-%d")

    # Validate date range
    if end_date <= start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date",
        )

    # Auto-generate DSL if not provided (placeholder for future LLM integration)
    dsl_yaml = request.strategy_dsl_yaml
    if not dsl_yaml:
        # TODO: Call LLM agent to generate DSL from strategy_description
        # For now, create a basic placeholder
        dsl_yaml = f"""# Auto-generated placeholder
# Strategy: {request.name}
# Description: {request.strategy_description}
#
# This DSL will be generated by an LLM agent when execution engine is implemented.
strategy:
  name: "{request.name}"
  description: "{request.strategy_description}"
  universe: {json.dumps(request.ticker_list)}
  auto_generated: true
"""

    # Create backtest
    backtest = Backtest(
        user_id=user.id,
        name=request.name,
        description=request.description,
        strategy_description=request.strategy_description,
        strategy_dsl_yaml=dsl_yaml,
        ticker_list=json.dumps(request.ticker_list),
        start_date=start_date,
        end_date=end_date,
        initial_capital=request.initial_capital,
        rebalance_frequency=request.rebalance_frequency,
        position_sizing=request.position_sizing,
        max_positions=request.max_positions,
        status="pending",
        progress_percentage=0,
    )

    db.add(backtest)
    db.commit()
    db.refresh(backtest)

    logger.info(f"User {user.username} created backtest {backtest.id}: {backtest.name}")

    return BacktestResponse(
        id=backtest.id,
        name=backtest.name,
        description=backtest.description,
        strategy_description=backtest.strategy_description,
        strategy_dsl_yaml=backtest.strategy_dsl_yaml,
        ticker_list=json.loads(backtest.ticker_list),
        start_date=backtest.start_date,
        end_date=backtest.end_date,
        initial_capital=backtest.initial_capital,
        rebalance_frequency=backtest.rebalance_frequency,
        position_sizing=backtest.position_sizing,
        max_positions=backtest.max_positions,
        status=backtest.status,
        progress_percentage=backtest.progress_percentage,
        final_portfolio_value=backtest.final_portfolio_value,
        total_return=backtest.total_return,
        total_return_pct=backtest.total_return_pct,
        sharpe_ratio=backtest.sharpe_ratio,
        max_drawdown=backtest.max_drawdown,
        max_drawdown_pct=backtest.max_drawdown_pct,
        win_rate=backtest.win_rate,
        total_trades=backtest.total_trades,
        avg_trade_duration_days=backtest.avg_trade_duration_days,
        created_at=backtest.created_at,
        updated_at=backtest.updated_at,
        completed_at=backtest.completed_at,
        owner_username=user.username,
    )


@router.get("", response_model=list[BacktestSummary])
async def list_backtests(
    status_filter: str | None = Query(None, description="Filter by status"),
    ticker: str | None = Query(None, description="Filter by ticker"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """List all backtests for the current user."""
    query = db.query(Backtest).filter(Backtest.user_id == user.id)

    # Apply filters
    if status_filter:
        query = query.filter(Backtest.status == status_filter)

    if ticker:
        # Search in ticker_list JSON
        ticker_upper = ticker.upper()
        query = query.filter(Backtest.ticker_list.like(f"%{ticker_upper}%"))

    # Order by created_at descending
    backtests = query.order_by(Backtest.created_at.desc()).all()

    results = []
    for backtest in backtests:
        results.append(
            BacktestSummary(
                id=backtest.id,
                name=backtest.name,
                description=backtest.description,
                ticker_list=json.loads(backtest.ticker_list),
                start_date=backtest.start_date,
                end_date=backtest.end_date,
                initial_capital=backtest.initial_capital,
                status=backtest.status,
                progress_percentage=backtest.progress_percentage,
                total_return_pct=backtest.total_return_pct,
                sharpe_ratio=backtest.sharpe_ratio,
                max_drawdown_pct=backtest.max_drawdown_pct,
                total_trades=backtest.total_trades,
                created_at=backtest.created_at,
                completed_at=backtest.completed_at,
                owner_username=user.username,
            )
        )

    return results


@router.get("/{backtest_id}", response_model=BacktestResponse)
async def get_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get full backtest details."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    return BacktestResponse(
        id=backtest.id,
        name=backtest.name,
        description=backtest.description,
        strategy_description=backtest.strategy_description,
        strategy_dsl_yaml=backtest.strategy_dsl_yaml,
        ticker_list=json.loads(backtest.ticker_list),
        start_date=backtest.start_date,
        end_date=backtest.end_date,
        initial_capital=backtest.initial_capital,
        rebalance_frequency=backtest.rebalance_frequency,
        position_sizing=backtest.position_sizing,
        max_positions=backtest.max_positions,
        status=backtest.status,
        progress_percentage=backtest.progress_percentage,
        final_portfolio_value=backtest.final_portfolio_value,
        total_return=backtest.total_return,
        total_return_pct=backtest.total_return_pct,
        sharpe_ratio=backtest.sharpe_ratio,
        max_drawdown=backtest.max_drawdown,
        max_drawdown_pct=backtest.max_drawdown_pct,
        win_rate=backtest.win_rate,
        total_trades=backtest.total_trades,
        avg_trade_duration_days=backtest.avg_trade_duration_days,
        created_at=backtest.created_at,
        updated_at=backtest.updated_at,
        completed_at=backtest.completed_at,
        owner_username=user.username,
    )


@router.put("/{backtest_id}", response_model=BacktestResponse)
async def update_backtest(
    backtest_id: int,
    request: UpdateBacktestRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Update backtest metadata (only for pending backtests)."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    # Only allow updates if status is pending
    if backtest.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update pending backtests",
        )

    # Update fields if provided
    if request.name is not None:
        backtest.name = request.name
    if request.description is not None:
        backtest.description = request.description
    if request.strategy_description is not None:
        backtest.strategy_description = request.strategy_description
    if request.strategy_dsl_yaml is not None:
        backtest.strategy_dsl_yaml = request.strategy_dsl_yaml
    if request.ticker_list is not None:
        backtest.ticker_list = json.dumps(request.ticker_list)
    if request.start_date is not None:
        backtest.start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
    if request.end_date is not None:
        backtest.end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
    if request.initial_capital is not None:
        backtest.initial_capital = request.initial_capital
    if request.rebalance_frequency is not None:
        backtest.rebalance_frequency = request.rebalance_frequency
    if request.position_sizing is not None:
        backtest.position_sizing = request.position_sizing
    if request.max_positions is not None:
        backtest.max_positions = request.max_positions

    backtest.updated_at = datetime.now(tz=timezone.utc)
    db.commit()
    db.refresh(backtest)

    logger.info(f"User {user.username} updated backtest {backtest.id}")

    return await get_backtest(backtest_id, db, user)


@router.delete("/{backtest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Delete a backtest and all its data."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    logger.info(f"User {user.username} deleting backtest {backtest.id}: {backtest.name}")

    db.delete(backtest)
    db.commit()


@router.get("/{backtest_id}/trades", response_model=list[BacktestTradeResponse])
async def get_backtest_trades(
    backtest_id: int,
    ticker: str | None = Query(None, description="Filter by ticker"),
    action: str | None = Query(None, description="Filter by action (BUY/SELL)"),
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get all trades for a backtest."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    query = db.query(BacktestTrade).filter(BacktestTrade.backtest_id == backtest.id)

    # Apply filters
    if ticker:
        query = query.filter(BacktestTrade.ticker == ticker.upper())
    if action:
        query = query.filter(BacktestTrade.action == action.upper())

    # Order by trade date
    trades = query.order_by(BacktestTrade.trade_date).offset(offset).limit(limit).all()

    return [
        BacktestTradeResponse(
            id=trade.id,
            backtest_id=trade.backtest_id,
            ticker=trade.ticker,
            action=trade.action,
            quantity=trade.quantity,
            price=trade.price,
            trade_date=trade.trade_date,
            analysis_id=trade.analysis_id,
            decision_confidence=trade.decision_confidence,
            decision_rationale=trade.decision_rationale,
            pnl=trade.pnl,
            pnl_pct=trade.pnl_pct,
            created_at=trade.created_at,
        )
        for trade in trades
    ]


@router.get("/{backtest_id}/snapshots", response_model=list[BacktestSnapshotResponse])
async def get_backtest_snapshots(
    backtest_id: int,
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get portfolio snapshots for a backtest."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    snapshots = (
        db.query(BacktestSnapshot)
        .filter(BacktestSnapshot.backtest_id == backtest.id)
        .order_by(BacktestSnapshot.snapshot_date)
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        BacktestSnapshotResponse(
            id=snapshot.id,
            backtest_id=snapshot.backtest_id,
            snapshot_date=snapshot.snapshot_date,
            cash=snapshot.cash,
            positions_value=snapshot.positions_value,
            total_value=snapshot.total_value,
            cumulative_return=snapshot.cumulative_return,
            cumulative_return_pct=snapshot.cumulative_return_pct,
            drawdown=snapshot.drawdown,
            drawdown_pct=snapshot.drawdown_pct,
            positions=json.loads(snapshot.positions),
        )
        for snapshot in snapshots
    ]


@router.get("/{backtest_id}/performance", response_model=BacktestPerformanceMetrics)
async def get_backtest_performance(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get calculated performance metrics for a backtest."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    # Get snapshots and trades
    snapshots = db.query(BacktestSnapshot).filter(BacktestSnapshot.backtest_id == backtest.id).all()
    trades = db.query(BacktestTrade).filter(BacktestTrade.backtest_id == backtest.id).all()

    # Calculate metrics
    total_return, total_return_pct = calculate_total_return(snapshots)
    sharpe_ratio = calculate_sharpe_ratio(snapshots)
    max_dd, max_dd_pct = calculate_max_drawdown(snapshots)
    win_rate = calculate_win_rate(trades)
    avg_duration = calculate_avg_trade_duration(trades)
    profit_factor = calculate_profit_factor(trades)
    trade_stats = calculate_trade_statistics(trades)

    return BacktestPerformanceMetrics(
        total_return=total_return,
        total_return_pct=total_return_pct,
        sharpe_ratio=sharpe_ratio,
        max_drawdown=max_dd,
        max_drawdown_pct=max_dd_pct,
        win_rate=win_rate,
        total_trades=len(trades) if trades else 0,
        avg_trade_duration_days=avg_duration,
        profit_factor=profit_factor,
        avg_win=trade_stats.get("avg_win"),
        avg_loss=trade_stats.get("avg_loss"),
        win_count=trade_stats.get("win_count", 0),
        loss_count=trade_stats.get("loss_count", 0),
    )


@router.get("/{backtest_id}/equity-curve", response_model=list[EquityCurveDataPoint])
async def get_backtest_equity_curve(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get equity curve data points for visualization."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    snapshots = (
        db.query(BacktestSnapshot)
        .filter(BacktestSnapshot.backtest_id == backtest.id)
        .order_by(BacktestSnapshot.snapshot_date)
        .all()
    )

    return [
        EquityCurveDataPoint(
            date=snapshot.snapshot_date,
            portfolio_value=snapshot.total_value,
            cash=snapshot.cash,
            positions_value=snapshot.positions_value,
            cumulative_return_pct=snapshot.cumulative_return_pct,
            drawdown_pct=snapshot.drawdown_pct,
        )
        for snapshot in snapshots
    ]


@router.get("/{backtest_id}/strategy", response_model=dict)
async def get_backtest_strategy(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get strategy DSL YAML for review."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    return {
        "strategy_description": backtest.strategy_description,
        "strategy_dsl_yaml": backtest.strategy_dsl_yaml,
    }


@router.post("/{backtest_id}/validate-strategy", response_model=dict)
async def validate_strategy(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Validate DSL syntax."""
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    # Validate the strategy DSL YAML
    is_valid, message = validate_strategy_dsl(backtest.strategy_dsl_yaml)

    return {
        "valid": is_valid,
        "message": message,
    }


@router.post("/generate-strategy-dsl")
async def generate_strategy_dsl(
    request: GenerateStrategyDSLRequest = Body(...),
    user: User = Depends(get_current_user_jwt),
):
    """
    Generate strategy DSL YAML from natural language description using LLM.

    This endpoint streams the generated YAML in real-time as the LLM produces it,
    providing immediate feedback to the user.
    """

    async def generate_stream():
        import asyncio

        try:
            logger.info(f"User {user.username} requested strategy DSL generation (streaming)")

            # Send initial heartbeat
            yield 'data: {"type": "start"}\n\n'

            # Initialize LLM
            llm = _get_llm_for_strategy_generation()

            # Create the strategy DSL generator agent
            generator = create_strategy_dsl_generator(llm)

            # Stream the generation
            accumulated_yaml = ""
            chunk_count = 0

            for chunk in generator.stream(
                strategy_description=request.strategy_description,
                ticker_list=request.ticker_list,
                initial_capital=request.initial_capital,
                rebalance_frequency=request.rebalance_frequency,
                position_sizing=request.position_sizing,
                max_positions=request.max_positions,
                strategy_type=request.strategy_type,
            ):
                accumulated_yaml += chunk
                chunk_count += 1

                # Send each chunk as Server-Sent Event
                chunk_data = json.dumps({"type": "chunk", "content": chunk})
                yield f"data: {chunk_data}\n\n"

                # Yield control to event loop to prevent buffering
                await asyncio.sleep(0)

            logger.info(f"Streamed {chunk_count} chunks for user {user.username}")

            # Validate the final YAML
            is_valid, validation_message = validate_strategy_dsl(accumulated_yaml)

            # Send completion event with validation result
            complete_data = json.dumps(
                {
                    "type": "complete",
                    "valid": is_valid,
                    "validation_message": validation_message,
                    "full_yaml": accumulated_yaml,
                }
            )
            yield f"data: {complete_data}\n\n"

            logger.info(f"Successfully streamed strategy DSL for user {user.username}")

        except Exception as e:
            logger.exception(f"Failed to generate strategy DSL: {e}")
            # Send error event
            error_data = json.dumps({"type": "error", "message": f"Failed to generate strategy DSL: {e!s}"})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.post("/{backtest_id}/execute", status_code=status.HTTP_202_ACCEPTED)
async def execute_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Start backtest execution in background."""
    # Verify ownership
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    # Check status (only execute pending backtests)
    if backtest.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only execute pending backtests (current status: {backtest.status})",
        )

    # Queue for execution
    executor = get_backtest_executor()
    executor.start_backtest(backtest_id)

    logger.info(f"User {user.username} queued backtest {backtest_id} for execution")

    return {
        "message": "Backtest queued for execution",
        "backtest_id": backtest_id,
        "status": "running",
    }


@router.post("/{backtest_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Cancel a running backtest."""
    # Verify ownership
    backtest = _verify_backtest_ownership(backtest_id, user.id, db)

    # Check status
    if backtest.status not in ["pending", "running"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel backtest with status: {backtest.status}",
        )

    # Attempt to cancel
    executor = get_backtest_executor()
    cancelled = executor.cancel_backtest(backtest_id)

    if cancelled or backtest.status == "pending":
        # Update status if it was pending
        if backtest.status == "pending":
            backtest.status = "cancelled"
            backtest.updated_at = datetime.now(tz=timezone.utc)
            db.commit()

        logger.info(f"User {user.username} cancelled backtest {backtest_id}")
        return {"message": "Backtest cancelled", "backtest_id": backtest_id}
    return {"message": "Backtest already completed or could not be cancelled", "backtest_id": backtest_id}


@router.post("/extract-parameters", response_model=ExtractParametersResponse)
async def extract_backtest_parameters(
    request: ExtractParametersRequest,
    user: User = Depends(get_current_user_jwt),
):
    """
    Extract trading parameters from natural language using LLM.

    This endpoint analyzes the user's message to extract:
    - Trading intent (backtest, live trading, analysis)
    - Strategy description
    - Capital amount
    - Date range
    - Other optional parameters

    Returns extracted values, missing fields, confidence scores, and clarification questions.
    """
    try:
        # Initialize LLM and create agent
        llm = _get_llm_for_strategy_generation()
        agent = create_parameter_extraction_agent(llm)

        # Extract parameters using the agent
        result = agent(user_message=request.user_message, conversation_history=request.conversation_history)

        # Structure response
        response = ExtractParametersResponse(
            intent=result.get("intent", "unclear"),
            extracted=result.get("extracted", {}),
            missing=result.get("missing", []),
            confidence=result.get("confidence", {}),
            needs_clarification=result.get("needs_clarification", False),
            clarification_questions=[ClarificationQuestion(**q) for q in result.get("clarification_questions", [])],
            suggested_defaults=result.get("suggested_defaults", {}),
        )

        logger.info(
            f"User {user.username} extracted parameters - Intent: {response.intent}, Missing: {response.missing}"
        )

        return response

    except Exception as e:
        logger.exception(f"Error in parameter extraction: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Extraction failed: {e!s}")


@router.post("/execute-intent", status_code=status.HTTP_202_ACCEPTED)
async def execute_trading_intent(
    request: ExecuteTradingIntentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """
    Execute a trading intent (backtest, live trading, or analysis).

    Based on the detected intent and parameters, this endpoint will:
    - Backtest: Create and execute a backtest
    - Live Trading: (Future) Set up live trading strategy
    - Analysis: Create an analysis request
    """
    intent = request.intent
    params = request.parameters

    logger.info(f"User {user.username} executing intent: {intent}")

    if intent == "backtest":
        # Validate required parameters for backtest
        required_fields = ["strategy_description", "capital", "start_date", "end_date"]
        missing = [f for f in required_fields if f not in params or not params[f]]

        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing required fields for backtest: {missing}"
            )

        # Parse dates
        try:
            start_date = datetime.strptime(params["start_date"], "%Y-%m-%d")
            end_date = datetime.strptime(params["end_date"], "%Y-%m-%d")
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid date format (use YYYY-MM-DD): {e}"
            )

        # Validate date range
        if end_date <= start_date:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

        # Apply smart defaults
        ticker_list = params.get("ticker_list", [])
        rebalance_frequency = params.get("rebalance_frequency", "weekly")
        position_sizing = params.get("position_sizing", "equal_weight")
        max_positions = params.get("max_positions", 10)

        # Auto-generate name if not provided
        strategy_summary = params["strategy_description"][:50]
        name = params.get("name", f"{strategy_summary} - {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        # Use provided YAML or create placeholder
        dsl_yaml = request.strategy_dsl_yaml
        if not dsl_yaml:
            dsl_yaml = f"""# Auto-generated for: {name}
strategy:
  name: "{name}"
  description: "{params['strategy_description']}"
  universe: {json.dumps(ticker_list) if ticker_list else '"AI_MANAGED"'}
"""

        # Create backtest
        backtest = Backtest(
            user_id=user.id,
            name=name,
            description=params.get("description", params["strategy_description"]),
            strategy_description=params["strategy_description"],
            strategy_dsl_yaml=dsl_yaml,
            ticker_list=json.dumps(ticker_list),
            start_date=start_date,
            end_date=end_date,
            initial_capital=params["capital"],
            rebalance_frequency=rebalance_frequency,
            position_sizing=position_sizing,
            max_positions=max_positions,
            status="pending",
            progress_percentage=0,
        )

        db.add(backtest)
        db.commit()
        db.refresh(backtest)

        logger.info(f"User {user.username} created backtest {backtest.id} via chat interface")

        # Queue for execution
        executor = get_backtest_executor()
        executor.start_backtest(backtest.id)

        return {
            "success": True,
            "backtest_id": backtest.id,
            "message": f"Backtest '{name}' created and queued for execution",
        }

    if intent == "live_trading":
        # Future implementation
        logger.info(f"User {user.username} requested live trading (not yet implemented)")
        return {
            "success": False,
            "message": "Live trading functionality is coming soon! For now, you can run a backtest to test your strategy.",
        }

    if intent == "analysis":
        # Create analysis request
        # Import here to avoid circular dependency
        from api.database import Analysis

        # Extract ticker from parameters
        ticker = None
        if params.get("ticker_list"):
            ticker = params["ticker_list"][0]  # Use first ticker
        elif "strategy_description" in params:
            # Try to extract ticker from description
            desc = params["strategy_description"].upper()
            # Simple extraction (could be improved)
            common_tickers = ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN", "NVDA", "META", "BTC-USD", "ETH-USD"]
            for t in common_tickers:
                if t in desc or t.replace("-USD", "") in desc:
                    ticker = t
                    break

        if not ticker:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not determine which asset to analyze. Please specify a ticker symbol.",
            )

        # Create analysis
        analysis_id = f"{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        analysis = Analysis(
            id=analysis_id,
            user_id=user.id,
            ticker=ticker,
            analysis_date=datetime.now(tz=timezone.utc).date(),
            status="pending",
        )

        db.add(analysis)
        db.commit()

        logger.info(f"User {user.username} created analysis {analysis_id} for {ticker} via chat interface")

        return {
            "success": True,
            "analysis_id": analysis_id,
            "message": f"Analysis for {ticker} has been created and will start shortly",
        }

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown or unclear intent: {intent}")
