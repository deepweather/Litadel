"""Portfolio request and response models."""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


# Request Models
class CreatePortfolioRequest(BaseModel):
    """Request to create a new portfolio."""

    name: str = Field(..., description="Portfolio name", min_length=1, max_length=100)
    description: str | None = Field(None, description="Portfolio description")


class UpdatePortfolioRequest(BaseModel):
    """Request to update portfolio metadata."""

    name: str | None = Field(None, description="Portfolio name", min_length=1, max_length=100)
    description: str | None = Field(None, description="Portfolio description")
    is_active: bool | None = Field(None, description="Portfolio active status")


class CreatePositionRequest(BaseModel):
    """Request to create a new position."""

    ticker: str = Field(..., description="Ticker symbol", min_length=1, max_length=20)
    quantity: float = Field(..., description="Number of shares/units", gt=0)
    entry_price: float = Field(..., description="Entry price per unit", gt=0)
    entry_date: str = Field(..., description="Entry date in YYYY-MM-DD format")
    asset_class: str | None = Field(None, description="Asset class (auto-detected if not provided)")
    notes: str | None = Field(None, description="Optional notes about the position")

    @field_validator("ticker")
    @classmethod
    def ticker_uppercase(cls, v: str) -> str:
        """Convert ticker to uppercase."""
        return v.upper().strip()

    @field_validator("entry_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        """Validate date format."""
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as e:
            msg = "Date must be in YYYY-MM-DD format"
            raise ValueError(msg) from e
        return v


class UpdatePositionRequest(BaseModel):
    """Request to update a position."""

    quantity: float | None = Field(None, description="Number of shares/units", gt=0)
    exit_price: float | None = Field(None, description="Exit price per unit", gt=0)
    exit_date: str | None = Field(None, description="Exit date in YYYY-MM-DD format")
    status: str | None = Field(None, description="Position status (open/closed)")
    notes: str | None = Field(None, description="Optional notes about the position")

    @field_validator("exit_date")
    @classmethod
    def validate_date_format(cls, v: str | None) -> str | None:
        """Validate date format if provided."""
        if v is not None:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError as e:
                msg = "Date must be in YYYY-MM-DD format"
                raise ValueError(msg) from e
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        """Validate status value."""
        if v is not None and v not in ["open", "closed"]:
            msg = "Status must be either 'open' or 'closed'"
            raise ValueError(msg)
        return v


# Response Models
class PositionResponse(BaseModel):
    """Position details with calculated metrics."""

    id: int = Field(..., description="Position ID")
    portfolio_id: int = Field(..., description="Portfolio ID")
    ticker: str = Field(..., description="Ticker symbol")
    asset_class: str = Field(..., description="Asset class")
    quantity: float = Field(..., description="Number of shares/units")
    entry_price: float = Field(..., description="Entry price per unit")
    entry_date: datetime = Field(..., description="Entry date")
    exit_price: float | None = Field(None, description="Exit price per unit")
    exit_date: datetime | None = Field(None, description="Exit date")
    status: str = Field(..., description="Position status (open/closed)")
    notes: str | None = Field(None, description="Optional notes")
    current_price: float | None = Field(None, description="Current market price")
    unrealized_pnl: float | None = Field(None, description="Unrealized P&L (for open positions)")
    realized_pnl: float | None = Field(None, description="Realized P&L (for closed positions)")
    pnl_percentage: float | None = Field(None, description="P&L percentage")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class PortfolioResponse(BaseModel):
    """Full portfolio details with positions and metrics."""

    id: int = Field(..., description="Portfolio ID")
    name: str = Field(..., description="Portfolio name")
    description: str | None = Field(None, description="Portfolio description")
    positions: list[PositionResponse] = Field(default_factory=list, description="All positions")
    total_value: float = Field(..., description="Total portfolio value")
    total_cost_basis: float = Field(..., description="Total cost basis")
    total_pnl: float = Field(..., description="Total profit/loss")
    total_pnl_percentage: float = Field(..., description="Total P&L percentage")
    position_count: int = Field(..., description="Number of positions")
    is_active: bool = Field(..., description="Portfolio active status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class PortfolioSummary(BaseModel):
    """Lightweight portfolio summary for list views."""

    id: int = Field(..., description="Portfolio ID")
    name: str = Field(..., description="Portfolio name")
    description: str | None = Field(None, description="Portfolio description")
    position_count: int = Field(..., description="Number of positions")
    total_value: float = Field(..., description="Total portfolio value")
    total_pnl: float = Field(..., description="Total profit/loss")
    total_pnl_percentage: float = Field(..., description="Total P&L percentage")
    is_active: bool = Field(..., description="Portfolio active status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
