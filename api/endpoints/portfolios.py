"""Portfolio management endpoints."""

import csv
import io
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from api.auth.dependencies import get_current_user_jwt
from api.database import Portfolio, Position, User, get_db
from api.models import (
    CreatePortfolioRequest,
    CreatePositionRequest,
    PortfolioResponse,
    PortfolioSummary,
    PositionResponse,
    UpdatePortfolioRequest,
    UpdatePositionRequest,
)
from cli.asset_detection import detect_asset_class

router = APIRouter(prefix="/api/v1/portfolios", tags=["portfolios"])
logger = logging.getLogger(__name__)


def _verify_portfolio_ownership(portfolio_id: int, user_id: int, db: Session) -> Portfolio:
    """Verify that the portfolio belongs to the user."""
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio {portfolio_id} not found",
        )

    if portfolio.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this portfolio",
        )

    return portfolio


def _get_current_price(ticker: str, db: Session) -> float | None:
    """Get current price for a ticker from cached data."""
    try:
        # Import here to avoid circular dependency
        import csv
        from pathlib import Path

        from api.endpoints.data import _ensure_cached_data

        # Ensure data is cached
        DATA_CACHE_DIR = Path(__file__).parent.parent.parent / "litadel" / "dataflows" / "data_cache"
        _ensure_cached_data(ticker, None, None)

        # Find cache file
        pattern = f"{ticker.upper()}-YFin-data-*.csv"
        matching_files = list(DATA_CACHE_DIR.glob(pattern))

        if not matching_files:
            return None

        # Read the last row (most recent date) from the CSV
        csv_file = matching_files[0]
        with open(csv_file) as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            if rows:
                last_row = rows[-1]
                close_price = last_row.get("Close", "")
                if close_price:
                    return float(close_price)
    except Exception as e:
        logger.warning(f"Failed to get current price for {ticker}: {e}")
    return None


def _calculate_position_metrics(position: Position, current_price: float | None) -> dict:
    """Calculate P&L metrics for a position."""
    metrics = {
        "current_price": current_price,
        "unrealized_pnl": None,
        "realized_pnl": None,
        "pnl_percentage": None,
    }

    if position.status == "open" and current_price is not None:
        # Calculate unrealized P&L
        cost_basis = position.entry_price * position.quantity
        current_value = current_price * position.quantity
        metrics["unrealized_pnl"] = current_value - cost_basis
        metrics["pnl_percentage"] = (metrics["unrealized_pnl"] / cost_basis) * 100 if cost_basis > 0 else 0
    elif position.status == "closed" and position.exit_price is not None:
        # Calculate realized P&L
        cost_basis = position.entry_price * position.quantity
        exit_value = position.exit_price * position.quantity
        metrics["realized_pnl"] = exit_value - cost_basis
        metrics["pnl_percentage"] = (metrics["realized_pnl"] / cost_basis) * 100 if cost_basis > 0 else 0

    return metrics


def _build_position_response(position: Position, db: Session) -> PositionResponse:
    """Build a position response with calculated metrics."""
    current_price = _get_current_price(position.ticker, db)
    metrics = _calculate_position_metrics(position, current_price)

    return PositionResponse(
        id=position.id,
        portfolio_id=position.portfolio_id,
        ticker=position.ticker,
        asset_class=position.asset_class,
        quantity=position.quantity,
        entry_price=position.entry_price,
        entry_date=position.entry_date,
        exit_price=position.exit_price,
        exit_date=position.exit_date,
        status=position.status,
        notes=position.notes,
        current_price=metrics["current_price"],
        unrealized_pnl=metrics["unrealized_pnl"],
        realized_pnl=metrics["realized_pnl"],
        pnl_percentage=metrics["pnl_percentage"],
        created_at=position.created_at,
        updated_at=position.updated_at,
    )


def _calculate_portfolio_metrics(positions: list[Position], db: Session) -> dict:
    """Calculate aggregated portfolio metrics."""
    total_value = 0.0
    total_cost_basis = 0.0
    total_pnl = 0.0

    for position in positions:
        cost_basis = position.entry_price * position.quantity
        total_cost_basis += cost_basis

        if position.status == "open":
            current_price = _get_current_price(position.ticker, db)
            if current_price is not None:
                current_value = current_price * position.quantity
                total_value += current_value
                total_pnl += current_value - cost_basis
            else:
                # If we can't get current price, use cost basis
                total_value += cost_basis
        elif position.status == "closed" and position.exit_price is not None:
            exit_value = position.exit_price * position.quantity
            total_pnl += exit_value - cost_basis
            # Closed positions don't contribute to current value

    total_pnl_percentage = (total_pnl / total_cost_basis * 100) if total_cost_basis > 0 else 0.0

    return {
        "total_value": total_value,
        "total_cost_basis": total_cost_basis,
        "total_pnl": total_pnl,
        "total_pnl_percentage": total_pnl_percentage,
        "position_count": len(positions),
    }


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    request: CreatePortfolioRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Create a new portfolio."""
    portfolio = Portfolio(
        user_id=user.id,
        name=request.name,
        description=request.description,
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    logger.info(f"User {user.username} created portfolio {portfolio.id}: {portfolio.name}")

    # Return empty portfolio with zero metrics
    return PortfolioResponse(
        id=portfolio.id,
        name=portfolio.name,
        description=portfolio.description,
        positions=[],
        total_value=0.0,
        total_cost_basis=0.0,
        total_pnl=0.0,
        total_pnl_percentage=0.0,
        position_count=0,
        is_active=portfolio.is_active,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at,
    )


@router.get("", response_model=list[PortfolioSummary])
async def list_portfolios(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """List all portfolios for the current user."""
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user.id).order_by(Portfolio.created_at.desc()).all()

    results = []
    for portfolio in portfolios:
        positions = db.query(Position).filter(Position.portfolio_id == portfolio.id).all()
        metrics = _calculate_portfolio_metrics(positions, db)

        results.append(
            PortfolioSummary(
                id=portfolio.id,
                name=portfolio.name,
                description=portfolio.description,
                position_count=metrics["position_count"],
                total_value=metrics["total_value"],
                total_pnl=metrics["total_pnl"],
                total_pnl_percentage=metrics["total_pnl_percentage"],
                is_active=portfolio.is_active,
                created_at=portfolio.created_at,
                updated_at=portfolio.updated_at,
            )
        )

    return results


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Get detailed portfolio information."""
    portfolio = _verify_portfolio_ownership(portfolio_id, user.id, db)

    # Get all positions
    positions = db.query(Position).filter(Position.portfolio_id == portfolio_id).all()

    # Build position responses with metrics
    position_responses = [_build_position_response(pos, db) for pos in positions]

    # Calculate portfolio-level metrics
    metrics = _calculate_portfolio_metrics(positions, db)

    return PortfolioResponse(
        id=portfolio.id,
        name=portfolio.name,
        description=portfolio.description,
        positions=position_responses,
        total_value=metrics["total_value"],
        total_cost_basis=metrics["total_cost_basis"],
        total_pnl=metrics["total_pnl"],
        total_pnl_percentage=metrics["total_pnl_percentage"],
        position_count=metrics["position_count"],
        is_active=portfolio.is_active,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at,
    )


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: int,
    request: UpdatePortfolioRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Update portfolio metadata."""
    portfolio = _verify_portfolio_ownership(portfolio_id, user.id, db)

    # Update fields if provided
    if request.name is not None:
        portfolio.name = request.name
    if request.description is not None:
        portfolio.description = request.description
    if request.is_active is not None:
        portfolio.is_active = request.is_active

    portfolio.updated_at = datetime.now(tz=timezone.utc)
    db.commit()
    db.refresh(portfolio)

    logger.info(f"User {user.username} updated portfolio {portfolio.id}")

    # Return full portfolio response
    return await get_portfolio(portfolio_id, db, user)


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Delete a portfolio and all its positions."""
    portfolio = _verify_portfolio_ownership(portfolio_id, user.id, db)

    logger.info(f"User {user.username} deleting portfolio {portfolio.id}: {portfolio.name}")

    db.delete(portfolio)
    db.commit()


@router.post("/{portfolio_id}/positions", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def add_position(
    portfolio_id: int,
    request: CreatePositionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Add a new position to the portfolio."""
    portfolio = _verify_portfolio_ownership(portfolio_id, user.id, db)

    # Auto-detect asset class if not provided
    asset_class = request.asset_class or detect_asset_class(request.ticker)

    # Parse entry date
    entry_date = datetime.strptime(request.entry_date, "%Y-%m-%d")

    position = Position(
        portfolio_id=portfolio.id,
        ticker=request.ticker,
        asset_class=asset_class,
        quantity=request.quantity,
        entry_price=request.entry_price,
        entry_date=entry_date,
        notes=request.notes,
        status="open",
    )
    db.add(position)
    db.commit()
    db.refresh(position)

    # Update portfolio timestamp
    portfolio.updated_at = datetime.now(tz=timezone.utc)
    db.commit()

    logger.info(f"User {user.username} added position {position.id} ({position.ticker}) to portfolio {portfolio.id}")

    return _build_position_response(position, db)


@router.put("/{portfolio_id}/positions/{position_id}", response_model=PositionResponse)
async def update_position(
    portfolio_id: int,
    position_id: int,
    request: UpdatePositionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Update a position."""
    portfolio = _verify_portfolio_ownership(portfolio_id, user.id, db)

    position = db.query(Position).filter(Position.id == position_id, Position.portfolio_id == portfolio_id).first()

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found in portfolio {portfolio_id}",
        )

    # Update fields if provided
    if request.quantity is not None:
        position.quantity = request.quantity
    if request.exit_price is not None:
        position.exit_price = request.exit_price
    if request.exit_date is not None:
        position.exit_date = datetime.strptime(request.exit_date, "%Y-%m-%d")
    if request.status is not None:
        position.status = request.status
    if request.notes is not None:
        position.notes = request.notes

    position.updated_at = datetime.now(tz=timezone.utc)
    portfolio.updated_at = datetime.now(tz=timezone.utc)
    db.commit()
    db.refresh(position)

    logger.info(f"User {user.username} updated position {position.id} in portfolio {portfolio.id}")

    return _build_position_response(position, db)


@router.delete("/{portfolio_id}/positions/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    portfolio_id: int,
    position_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """Delete a position from the portfolio."""
    portfolio = _verify_portfolio_ownership(portfolio_id, user.id, db)

    position = db.query(Position).filter(Position.id == position_id, Position.portfolio_id == portfolio_id).first()

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found in portfolio {portfolio_id}",
        )

    logger.info(
        f"User {user.username} deleting position {position.id} ({position.ticker}) from portfolio {portfolio.id}"
    )

    db.delete(position)
    portfolio.updated_at = datetime.now(tz=timezone.utc)
    db.commit()


# Helper endpoints for UX enhancements


@router.get("/helpers/historical-price", response_model=dict)
async def get_historical_price(
    ticker: str = Query(..., description="Ticker symbol"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    """Get historical closing price for a ticker on a specific date."""
    try:
        # Import here to avoid circular dependency
        from pathlib import Path

        # Ensure data is cached
        from api.endpoints.data import _ensure_cached_data

        DATA_CACHE_DIR = Path(__file__).parent.parent.parent / "litadel" / "dataflows" / "data_cache"
        _ensure_cached_data(ticker, None, None)

        # Find cache file
        pattern = f"{ticker.upper()}-YFin-data-*.csv"
        matching_files = list(DATA_CACHE_DIR.glob(pattern))

        if not matching_files:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No data available for ticker {ticker}",
            )

        # Read CSV and find the date
        csv_file = matching_files[0]
        target_date = date  # Already in YYYY-MM-DD format

        with open(csv_file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("Date", "")[:10] == target_date:
                    close_price = row.get("Close", "")
                    if close_price:
                        return {
                            "ticker": ticker.upper(),
                            "date": target_date,
                            "price": float(close_price),
                            "source": "cached_data",
                        }

        # If exact date not found, find closest date
        with open(csv_file) as f:
            reader = csv.DictReader(f)
            all_rows = list(reader)

            # Find closest date (before or on the target date)
            closest_row = None
            for row in reversed(all_rows):
                if row.get("Date", "")[:10] <= target_date:
                    closest_row = row
                    break

            if closest_row and closest_row.get("Close"):
                return {
                    "ticker": ticker.upper(),
                    "date": closest_row.get("Date", "")[:10],
                    "price": float(closest_row.get("Close")),
                    "source": "cached_data",
                    "note": "Exact date not found, using closest available date",
                }

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No price data found for {ticker} on or before {date}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get historical price for {ticker} on {date}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch historical price: {e!s}",
        ) from e


@router.get("/helpers/validate-ticker", response_model=dict)
async def validate_ticker(
    ticker: str = Query(..., description="Ticker symbol to validate"),
    user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    """Validate ticker and return basic information."""
    try:
        ticker = ticker.upper().strip()

        # Auto-detect asset class
        asset_class = detect_asset_class(ticker)

        # Try to get current price (this will cache data if needed)
        current_price = _get_current_price(ticker, db)

        if current_price is None:
            # If we can't get price, the ticker might be invalid
            return {
                "ticker": ticker,
                "valid": False,
                "message": f"Could not fetch data for ticker {ticker}. Please verify it's correct.",
            }

        return {
            "ticker": ticker,
            "valid": True,
            "asset_class": asset_class,
            "current_price": current_price,
        }
    except Exception as e:
        logger.warning(f"Ticker validation failed for {ticker}: {e}")
        return {
            "ticker": ticker.upper(),
            "valid": False,
            "message": f"Could not validate ticker: {e!s}",
        }


@router.post("/{portfolio_id}/positions/bulk-import", response_model=dict)
async def bulk_import_positions(
    portfolio_id: int,
    file: UploadFile = File(..., description="CSV file with positions"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_jwt),
):
    """
    Bulk import positions from CSV file.

    Expected CSV columns: ticker, quantity, entry_price, entry_date, notes (optional)
    """
    portfolio = _verify_portfolio_ownership(portfolio_id, user.id, db)

    try:
        # Read CSV file
        contents = await file.read()
        csv_text = contents.decode("utf-8")
        csv_file = io.StringIO(csv_text)
        reader = csv.DictReader(csv_file)

        added_positions = []
        errors = []

        for row_num, row in enumerate(reader, start=2):  # Start at 2 (after header)
            try:
                # Extract and validate required fields
                ticker = row.get("ticker", "").strip().upper()
                quantity_str = row.get("quantity", "").strip()
                entry_price_str = row.get("entry_price", "").strip()
                entry_date_str = row.get("entry_date", "").strip()
                notes = row.get("notes", "").strip() or None

                if not ticker:
                    errors.append(f"Row {row_num}: Missing ticker")
                    continue

                if not quantity_str:
                    errors.append(f"Row {row_num}: Missing quantity")
                    continue

                if not entry_price_str:
                    errors.append(f"Row {row_num}: Missing entry_price")
                    continue

                if not entry_date_str:
                    errors.append(f"Row {row_num}: Missing entry_date")
                    continue

                # Parse numeric values
                try:
                    quantity = float(quantity_str)
                    if quantity <= 0:
                        errors.append(f"Row {row_num}: Quantity must be positive")
                        continue
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid quantity '{quantity_str}'")
                    continue

                try:
                    entry_price = float(entry_price_str)
                    if entry_price <= 0:
                        errors.append(f"Row {row_num}: Entry price must be positive")
                        continue
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid entry_price '{entry_price_str}'")
                    continue

                # Parse date
                try:
                    entry_date = datetime.strptime(entry_date_str, "%Y-%m-%d")
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid date format '{entry_date_str}' (use YYYY-MM-DD)")
                    continue

                # Auto-detect asset class
                asset_class = detect_asset_class(ticker)

                # Create position
                position = Position(
                    portfolio_id=portfolio.id,
                    ticker=ticker,
                    asset_class=asset_class,
                    quantity=quantity,
                    entry_price=entry_price,
                    entry_date=entry_date,
                    notes=notes,
                    status="open",
                )
                db.add(position)
                added_positions.append(
                    {
                        "ticker": ticker,
                        "quantity": quantity,
                        "entry_price": entry_price,
                        "entry_date": entry_date_str,
                    }
                )

            except Exception as e:
                errors.append(f"Row {row_num}: {e!s}")
                continue

        # Update portfolio timestamp
        portfolio.updated_at = datetime.now(tz=timezone.utc)
        db.commit()

        logger.info(f"User {user.username} bulk imported {len(added_positions)} positions to portfolio {portfolio.id}")

        return {
            "success": True,
            "added_count": len(added_positions),
            "error_count": len(errors),
            "added_positions": added_positions,
            "errors": errors,
        }

    except Exception as e:
        db.rollback()
        logger.exception(f"Bulk import failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import positions: {e!s}",
        ) from e
