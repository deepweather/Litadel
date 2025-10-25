"""Authentication module for Trading Agents API."""

from api.auth.api_key_auth import (
    create_api_key,
    generate_api_key,
    get_api_key_by_hash,
    hash_api_key,
    verify_api_key_from_db,
    verify_api_key_hash,
)
from api.auth.dependencies import get_current_api_key, get_current_auth, get_current_user_jwt
from api.auth.jwt_handler import create_access_token, verify_token
from api.auth.models import LoginRequest, LoginResponse, TokenData, UserResponse
from api.auth.password import hash_password, verify_password

__all__ = [
    # API Key functions
    "create_api_key",
    "generate_api_key",
    "get_api_key_by_hash",
    "hash_api_key",
    "verify_api_key_from_db",
    "verify_api_key_hash",
    # JWT functions
    "create_access_token",
    "verify_token",
    # Password functions
    "hash_password",
    "verify_password",
    # Dependencies
    "get_current_api_key",
    "get_current_user_jwt",
    "get_current_auth",
    # Models
    "LoginRequest",
    "LoginResponse",
    "TokenData",
    "UserResponse",
]
