"""FastAPI authentication dependencies."""

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from api.auth.api_key_auth import verify_api_key_from_db
from api.auth.jwt_handler import verify_token
from api.database import APIKey, User, get_db

# Security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_api_key(
    api_key: str = Security(api_key_header),
    db: Session = Depends(get_db),
) -> APIKey:
    """
    Dependency to verify API key and return the key record.

    Raises:
        HTTPException: If API key is invalid or inactive
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
        )

    key_record = verify_api_key_from_db(db, api_key)

    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key",
        )

    return key_record


async def get_current_user_jwt(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to verify JWT token and return the user.

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token_data = verify_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    user = db.query(User).filter(User.id == token_data.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_current_auth(
    api_key: str = Security(api_key_header),
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | APIKey:
    """
    Hybrid authentication dependency that accepts EITHER JWT or API key.

    Tries JWT first, then falls back to API key.

    Returns:
        User object (if JWT) or APIKey object (if API key)

    Raises:
        HTTPException: If neither authentication method is valid
    """
    # Try JWT authentication first
    if credentials:
        try:
            token_data = verify_token(credentials.credentials)
            user = db.query(User).filter(User.id == token_data.user_id).first()

            if user and user.is_active:
                return user
        except JWTError:
            pass  # Fall through to try API key

    # Try API key authentication
    if api_key:
        key_record = verify_api_key_from_db(db, api_key)
        if key_record:
            return key_record

    # Neither authentication method worked
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication credentials. Provide either a valid Bearer token or X-API-Key header.",
        headers={"WWW-Authenticate": "Bearer"},
    )
