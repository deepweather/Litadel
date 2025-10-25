"""Smart cache manager with TTL (Time To Live) support for economic and market data."""

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class SmartCache:
    """Cache manager with TTL support for different data types."""

    def __init__(self, cache_dir: str):
        """
        Initialize the smart cache manager.

        Args:
            cache_dir: Directory path for storing cache files
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, key: str) -> Path:
        """Get the file path for a cache key."""
        # Sanitize key to be filesystem-safe
        safe_key = key.replace("/", "_").replace("\\", "_").replace(":", "_")
        return self.cache_dir / f"{safe_key}.json"

    def get_cached(self, key: str, ttl: int) -> Any | None:
        """
        Retrieve cached data if it exists and hasn't expired.

        Args:
            key: Cache key identifier
            ttl: Time to live in seconds

        Returns:
            Cached data if valid, None if expired or doesn't exist
        """
        cache_path = self._get_cache_path(key)

        if not cache_path.exists():
            return None

        try:
            with open(cache_path) as f:
                cache_entry = json.load(f)

            timestamp = cache_entry.get("timestamp", 0)
            current_time = time.time()

            # Check if cache has expired
            if current_time - timestamp > ttl:
                # Cache expired, remove it
                cache_path.unlink(missing_ok=True)
                return None

            return cache_entry.get("data")

        except (json.JSONDecodeError, KeyError, OSError):
            # If cache is corrupted, remove it
            cache_path.unlink(missing_ok=True)
            return None

    def set_cached(self, key: str, data: Any, ttl: int) -> None:
        """
        Store data in cache with timestamp and TTL.

        Args:
            key: Cache key identifier
            data: Data to cache
            ttl: Time to live in seconds (stored for reference)
        """
        cache_path = self._get_cache_path(key)

        cache_entry = {
            "data": data,
            "timestamp": time.time(),
            "ttl": ttl,
            "cached_at": datetime.now(tz=timezone.utc).isoformat(),
        }

        try:
            with open(cache_path, "w") as f:
                json.dump(cache_entry, f, indent=2)
        except OSError as e:
            # If cache write fails, just continue without caching
            print(f"Warning: Failed to write cache for {key}: {e}")

    def is_expired(self, key: str, ttl: int) -> bool:
        """
        Check if a cache entry has expired.

        Args:
            key: Cache key identifier
            ttl: Time to live in seconds

        Returns:
            True if expired or doesn't exist, False if still valid
        """
        cache_path = self._get_cache_path(key)

        if not cache_path.exists():
            return True

        try:
            with open(cache_path) as f:
                cache_entry = json.load(f)

            timestamp = cache_entry.get("timestamp", 0)
            current_time = time.time()

            return (current_time - timestamp) > ttl

        except (json.JSONDecodeError, KeyError, OSError):
            return True

    def clear_cache(self, key: str | None = None) -> None:
        """
        Clear cache entries.

        Args:
            key: Specific key to clear, or None to clear all
        """
        if key:
            cache_path = self._get_cache_path(key)
            cache_path.unlink(missing_ok=True)
        else:
            # Clear all cache files
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink(missing_ok=True)

    def get_cache_info(self, key: str) -> dict[str, Any] | None:
        """
        Get metadata about a cache entry.

        Args:
            key: Cache key identifier

        Returns:
            Dictionary with cache metadata or None if doesn't exist
        """
        cache_path = self._get_cache_path(key)

        if not cache_path.exists():
            return None

        try:
            with open(cache_path) as f:
                cache_entry = json.load(f)

            timestamp = cache_entry.get("timestamp", 0)
            ttl = cache_entry.get("ttl", 0)
            age = time.time() - timestamp

            return {
                "key": key,
                "cached_at": cache_entry.get("cached_at"),
                "age_seconds": age,
                "ttl_seconds": ttl,
                "expired": age > ttl,
                "size_bytes": cache_path.stat().st_size,
            }

        except (json.JSONDecodeError, KeyError, OSError):
            return None
