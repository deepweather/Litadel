"""JWT token generation and verification."""

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from api.auth.models import TokenData

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_DAYS = int(os.getenv("JWT_EXPIRATION_DAYS", "7"))


def create_access_token(user_id: int, username: str) -> tuple[str, int]:
    """
    Create a JWT access token.

    Args:
        user_id: User's database ID
        username: Username

    Returns:
        Tuple of (encoded_token, expiration_seconds)
    """
    expiration = timedelta(days=JWT_EXPIRATION_DAYS)
    expire = datetime.now(timezone.utc) + expiration

    to_encode = {
        "sub": str(user_id),
        "username": username,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    expiration_seconds = int(expiration.total_seconds())

    return encoded_jwt, expiration_seconds


def verify_token(token: str) -> TokenData:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string

    Returns:
        TokenData with user information

    Raises:
        JWTError: If token is invalid or expired
    """
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

    user_id: str = payload.get("sub")
    username: str = payload.get("username")

    if user_id is None or username is None:
        raise JWTError("Invalid token payload")

    return TokenData(user_id=int(user_id), username=username)
