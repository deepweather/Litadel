"""Authentication endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.auth import (
    LoginRequest,
    LoginResponse,
    UserResponse,
    create_access_token,
    get_current_user_jwt,
    verify_password,
)
from api.database import User, get_db

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate with username and password, returns JWT token.
    """
    # Find user by username
    user = db.query(User).filter(User.username == request.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Generate JWT token
    access_token, expires_in = create_access_token(user.id, user.username)

    logger.info(f"User '{user.username}' logged in successfully")

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=user.username,
        expires_in=expires_in,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user: User = Depends(get_current_user_jwt),
):
    """
    Get current user information (JWT authentication only).
    """
    return UserResponse(
        id=user.id,
        username=user.username,
        created_at=user.created_at,
        is_active=user.is_active,
    )


@router.post("/register", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def register():
    """
    User registration endpoint (not implemented yet).
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="User registration is not implemented. Contact administrator to create an account.",
    )
