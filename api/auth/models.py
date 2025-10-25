"""Pydantic models for authentication."""

from datetime import datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Login request with username and password."""

    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class LoginResponse(BaseModel):
    """Login response with JWT token."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    username: str = Field(..., description="Username")
    expires_in: int = Field(..., description="Token expiration in seconds")


class TokenData(BaseModel):
    """Data extracted from JWT token."""

    user_id: int
    username: str


class UserResponse(BaseModel):
    """User information response."""

    id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    created_at: datetime = Field(..., description="Account creation timestamp")
    is_active: bool = Field(..., description="Whether the account is active")
