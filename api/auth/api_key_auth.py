"""API key authentication utilities (moved from api/auth.py)."""

import secrets

from sqlalchemy.orm import Session

from api.auth.password import hash_password, verify_password
from api.database import APIKey


def hash_api_key(api_key: str) -> str:
    """Hash an API key using bcrypt."""
    return hash_password(api_key)


def verify_api_key_hash(api_key: str, key_hash: str) -> bool:
    """Verify an API key against its hash."""
    return verify_password(api_key, key_hash)


def generate_api_key() -> str:
    """Generate a new random API key (32 bytes, URL-safe)."""
    return secrets.token_urlsafe(32)


def create_api_key(db: Session, name: str) -> tuple[str, APIKey]:
    """
    Create a new API key in the database.

    Args:
        db: Database session
        name: Human-readable name for the API key

    Returns:
        Tuple of (plain_key, db_record)
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

    Args:
        db: Database session
        api_key: Plain API key to verify

    Returns:
        APIKey record if valid and active, None otherwise
    """
    # Get all active keys
    active_keys = db.query(APIKey).filter(APIKey.is_active).all()

    # Check each one against the provided key
    for key_record in active_keys:
        if verify_api_key_hash(api_key, key_record.key_hash):
            return key_record

    return None
