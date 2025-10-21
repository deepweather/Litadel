"""Request models for API endpoints."""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class CreateAnalysisRequest(BaseModel):
    """Request to create a new analysis."""

    ticker: str = Field(..., description="Ticker symbol to analyze")
    analysis_date: str = Field(..., description="Analysis date in YYYY-MM-DD format")
    selected_analysts: List[str] = Field(
        default=["market", "news", "social", "fundamentals"],
        description="List of analysts to run (market, news, social, fundamentals)",
    )
    research_depth: int = Field(
        default=1,
        ge=1,
        le=5,
        description="Research depth (1=shallow, 3=medium, 5=deep)",
    )
    llm_provider: Optional[str] = Field(
        default=None,
        description="LLM provider (openai, anthropic, google). Uses default if not specified.",
    )
    backend_url: Optional[str] = Field(
        default=None,
        description="Backend URL for LLM. Uses default if not specified.",
    )
    quick_think_llm: Optional[str] = Field(
        default=None,
        description="Model for quick thinking. Uses default if not specified.",
    )
    deep_think_llm: Optional[str] = Field(
        default=None,
        description="Model for deep thinking. Uses default if not specified.",
    )

    @field_validator("ticker")
    @classmethod
    def ticker_uppercase(cls, v: str) -> str:
        """Convert ticker to uppercase."""
        return v.upper().strip()

    @field_validator("selected_analysts")
    @classmethod
    def validate_analysts(cls, v: List[str]) -> List[str]:
        """Validate analyst selections."""
        valid_analysts = {"market", "news", "social", "fundamentals"}
        for analyst in v:
            if analyst not in valid_analysts:
                raise ValueError(
                    f"Invalid analyst: {analyst}. Must be one of {valid_analysts}"
                )
        if not v:
            raise ValueError("At least one analyst must be selected")
        return v


class UpdateAnalysisRequest(BaseModel):
    """Request to update analysis metadata."""

    status: Optional[str] = Field(
        default=None,
        description="New status (pending, running, completed, failed, cancelled)",
    )

