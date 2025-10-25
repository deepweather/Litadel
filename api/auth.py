"""API key authentication."""

import secrets
import warnings

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

# Suppress the known passlib/bcrypt compatibility warning
with warnings.catch_warnings():
    warnings.filterwarnings("ignore", message=".*trapped.*")
    from passlib.context import CryptContext

from sqlalchemy.orm import Session

from api.database import APIKey, get_db

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# API key header scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)


def hash_api_key(api_key: str) -> str:
    """Hash an API key."""
    return pwd_context.hash(api_key)


def verify_api_key_hash(api_key: str, key_hash: str) -> bool:
    """Verify an API key against its hash."""
    return pwd_context.verify(api_key, key_hash)


def generate_api_key() -> str:
    """Generate a new random API key."""
    return secrets.token_urlsafe(32)


def create_api_key(db: Session, name: str) -> tuple[str, APIKey]:
    """
    Create a new API key in the database.

    Returns:
        tuple: (plain_key, db_record)
    """
    plain_key = generate_api_key()
    key_hash = hash_api_key(plain_key)

    db_key = APIKey(key_hash=key_hash, name=name, is_active=True)
    db.add(db_key)
    db.commit()
    db.refresh(db_key)

    return plain_key, db_key


def get_api_key_by_hash(db: Session, key_hash: str) -> APIKey | None:
    """Get an API key record by its hash."""
    return db.query(APIKey).filter(APIKey.key_hash == key_hash).first()


def verify_api_key_from_db(db: Session, api_key: str) -> APIKey | None:
    """
    Verify an API key against the database.

    Returns:
        APIKey record if valid and active, None otherwise
    """
    # Get all active keys
    active_keys = db.query(APIKey).filter(APIKey.is_active).all()

    # Check each one
    for key_record in active_keys:
        if verify_api_key_hash(api_key, key_record.key_hash):
            return key_record

    return None


async def get_current_api_key(
    api_key: str = Security(api_key_header),
    db: Session = Depends(get_db),
) -> APIKey:
    """
    Dependency to verify API key and return the key record.

    Raises:
        HTTPException: If API key is invalid or inactive
    """
    key_record = verify_api_key_from_db(db, api_key)

    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key",
        )

    return key_record
