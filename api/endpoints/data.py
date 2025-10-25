"""Cached data access endpoints."""

import builtins
import contextlib
import csv
import io
import logging
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.auth import get_current_auth
from api.models.responses import CachedDataResponse, CachedTickerInfo
from cli.asset_detection import detect_asset_class
from litadel.dataflows.interface import route_to_vendor

router = APIRouter(prefix="/api/v1/data", tags=["data"])
logger = logging.getLogger(__name__)

# Data cache directory (resolve to absolute path to avoid cwd issues)
DATA_CACHE_DIR = Path(__file__).parent.parent.parent / "litadel" / "dataflows" / "data_cache"

# In-memory cache to track recent updates (prevents redundant updates in the same session)
# Format: {ticker: last_update_timestamp}
_recent_updates: dict[str, datetime] = {}


def _was_recently_updated(ticker: str, max_age_minutes: int = 5) -> bool:
    """Check if a ticker was updated recently in this session.

    This prevents redundant updates when multiple positions use the same ticker
    in a single page load or API request batch.

    Args:
        ticker: Ticker symbol
        max_age_minutes: Consider update "recent" if within this many minutes

    Returns:
        True if ticker was updated recently
    """
    ticker_upper = ticker.upper()
    if ticker_upper not in _recent_updates:
        return False

    last_update = _recent_updates[ticker_upper]
    age = datetime.now(tz=timezone.utc) - last_update
    return age.total_seconds() < (max_age_minutes * 60)


def _mark_as_updated(ticker: str) -> None:
    """Mark a ticker as recently updated."""
    _recent_updates[ticker.upper()] = datetime.now(tz=timezone.utc)


def _parse_date_range(filename: str) -> dict[str, str] | None:
    """Parse date range from cache filename."""
    try:
        # Format: TICKER-YFin-data-START-END.csv
        parts = filename.replace(".csv", "").split("-")
        if len(parts) >= 5:
            start_date = parts[-2]
            end_date = parts[-1]
            return {"start": start_date, "end": end_date}
    except:
        pass
    return None


def _normalize_ohlcv_rows_from_csv(csv_text: str) -> list[dict[str, str]]:
    """Normalize various vendor CSV formats to standard OHLCV schema.
    Output fields: Date, Close, High, Low, Open, Volume
    """
    rows: list[dict[str, str]] = []
    if not csv_text:
        return rows

    f = io.StringIO(csv_text)
    reader = csv.DictReader(f)

    # Map common header variants to our standard fields
    def get_field(d: dict[str, str], *candidates: str) -> str | None:
        for c in candidates:
            if c in d and d[c] not in (None, ""):
                return d[c]
            # case-insensitive
            for k in d:
                if k is not None and k.lower() == c.lower() and d[k] not in (None, ""):
                    return d[k]
        return None

    for r in reader:
        date_val = get_field(r, "Date", "date", "time", "timestamp")
        open_val = get_field(r, "Open", "open")
        high_val = get_field(r, "High", "high")
        low_val = get_field(r, "Low", "low")
        close_val = get_field(r, "Close", "close")
        volume_val = get_field(r, "Volume", "volume")

        if not date_val:
            continue

        # Fallbacks for single-value series (e.g., commodities time,value)
        if close_val is None:
            close_val = get_field(r, "value", "price")

        # If only a close-like value exists, mirror it to O/H/L so charts render
        if close_val is not None:
            if open_val is None:
                open_val = close_val
            if high_val is None:
                high_val = close_val
            if low_val is None:
                low_val = close_val

        rows.append(
            {
                "Date": str(date_val)[:10],
                "Close": close_val if close_val is not None else "",
                "High": high_val if high_val is not None else "",
                "Low": low_val if low_val is not None else "",
                "Open": open_val if open_val is not None else "",
                "Volume": volume_val if volume_val is not None else "",
            }
        )

    return rows


def _get_last_date_from_cache(cache_file: Path) -> str | None:
    """Get the most recent date from a cache file."""
    try:
        with open(cache_file) as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            if rows:
                # Return the last date (files should be sorted)
                return rows[-1].get("Date", "")[:10]
    except Exception as e:
        logger.warning(f"Failed to read last date from {cache_file.name}: {e}")
    return None


def _is_cache_stale(cache_file: Path, max_age_days: int = 1) -> bool:
    """Check if cache needs updating based on the last date in the file.

    This function is smart about weekends and market hours:
    - If cache has today's date, it's fresh
    - If today is weekend, checks if cache has Friday's data
    - Otherwise checks if cache is older than max_age_days trading days

    Args:
        cache_file: Path to the cache CSV file
        max_age_days: Maximum age in trading days before cache is considered stale

    Returns:
        True if cache is stale and needs updating
    """
    last_date_str = _get_last_date_from_cache(cache_file)
    if not last_date_str:
        return True  # Can't determine, consider stale

    try:
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
        today = datetime.now(tz=timezone.utc).date()

        # If cache has today's data, it's fresh
        if last_date == today:
            logger.debug(f"Cache has today's data ({last_date}), considering fresh")
            return False

        # Get the day of week (0=Monday, 6=Sunday)
        today_weekday = today.weekday()

        # If today is Saturday (5) or Sunday (6), cache is fresh if it has Friday's data
        if today_weekday == 5:  # Saturday
            expected_last_trading_day = today - timedelta(days=1)  # Friday
            if last_date >= expected_last_trading_day:
                logger.debug(f"Weekend: cache has Friday data ({last_date}), considering fresh")
                return False
            return True
        if today_weekday == 6:  # Sunday
            expected_last_trading_day = today - timedelta(days=2)  # Friday
            if last_date >= expected_last_trading_day:
                logger.debug(f"Weekend: cache has Friday data ({last_date}), considering fresh")
                return False
            return True

        # For weekdays (Monday-Friday), check if we have recent data
        # Allow some buffer for early morning checks before market opens
        age_days = (today - last_date).days

        # If it's Monday and we have Friday's data, that's acceptable (3 calendar days)
        if today_weekday == 0 and age_days <= 3:  # Monday, and last date is Fri/Sat/Sun
            last_date_weekday = last_date.weekday()
            if last_date_weekday == 4:  # Last date was Friday
                logger.debug(f"Monday: cache has Friday data ({last_date}), considering fresh")
                return False

        # Otherwise, cache is stale if older than max_age_days
        is_stale = age_days > max_age_days
        if is_stale:
            logger.debug(f"Cache is {age_days} days old (last: {last_date}, today: {today}), considering stale")
        return is_stale

    except Exception as e:
        logger.warning(f"Failed to parse date {last_date_str}: {e}")
        return True  # If we can't parse, consider stale


def _update_cache_incrementally(cache_file: Path, ticker: str, asset_class: str) -> Path | None:
    """Update an existing cache file with new data since the last cached date.

    Args:
        cache_file: Path to existing cache file
        ticker: Ticker symbol
        asset_class: Asset class (equity, crypto, commodity)

    Returns:
        Updated cache file path or None if update failed
    """
    last_date_str = _get_last_date_from_cache(cache_file)
    if not last_date_str:
        logger.warning(f"Cannot determine last date for {ticker}, skipping update")
        return None

    # Fetch data from the day after last cached date to today
    try:
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
        start_date = (last_date + timedelta(days=1)).strftime("%Y-%m-%d")
        end_date = datetime.now(tz=timezone.utc).date().strftime("%Y-%m-%d")

        # Don't fetch if we're already up to date
        if start_date > end_date:
            logger.info(f"Cache for {ticker} is already up to date (last date: {last_date_str})")
            return cache_file

        logger.info(f"Updating cache for {ticker} from {start_date} to {end_date}")

        # Read existing dates to prevent duplicates
        existing_dates = set()
        with open(cache_file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                date_str = row.get("Date", "")[:10]
                if date_str:
                    existing_dates.add(date_str)

        # Fetch new data
        if asset_class == "crypto":
            csv_text = route_to_vendor("get_crypto_data", ticker.upper(), start_date, end_date, "USD")
        elif asset_class == "commodity":
            csv_text = route_to_vendor("get_commodity_data", ticker.upper(), start_date, end_date, "daily")
        else:
            csv_text = route_to_vendor("get_stock_data", ticker.upper(), start_date, end_date)

        # Parse new rows and filter out duplicates
        new_rows = _normalize_ohlcv_rows_from_csv(csv_text)

        # Filter out rows that already exist in the cache
        unique_new_rows = [row for row in new_rows if row.get("Date", "")[:10] not in existing_dates]

        if not unique_new_rows:
            logger.info(f"No new data available for {ticker} (all dates already cached)")
            return cache_file

        # Append only unique new rows to existing cache file
        with open(cache_file, "a", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["Date", "Close", "High", "Low", "Open", "Volume"])
            for row in unique_new_rows:
                writer.writerow(row)

        logger.info(f"Successfully appended {len(unique_new_rows)} new rows to {cache_file.name}")
        return cache_file

    except Exception as e:
        logger.exception(f"Failed to update cache for {ticker}: {e}")
        return None


def _deduplicate_cache_file(cache_file: Path) -> bool:
    """Remove duplicate dates from a cache file, keeping the last occurrence.

    Args:
        cache_file: Path to cache file to deduplicate

    Returns:
        True if duplicates were removed, False otherwise
    """
    try:
        # Read all rows
        with open(cache_file) as f:
            reader = csv.DictReader(f)
            all_rows = list(reader)

        # Track seen dates and keep last occurrence of each date
        seen_dates = {}
        for row in all_rows:
            date_str = row.get("Date", "")[:10]
            if date_str:
                seen_dates[date_str] = row  # Later occurrences overwrite earlier ones

        # Convert back to list and sort by date
        unique_rows = list(seen_dates.values())
        unique_rows.sort(key=lambda r: r.get("Date", ""))

        # Check if we removed any duplicates
        had_duplicates = len(unique_rows) < len(all_rows)

        if had_duplicates:
            logger.info(f"Removing {len(all_rows) - len(unique_rows)} duplicate dates from {cache_file.name}")
            # Rewrite file with unique rows
            with open(cache_file, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["Date", "Close", "High", "Low", "Open", "Volume"])
                writer.writeheader()
                for row in unique_rows:
                    writer.writerow(row)

        return had_duplicates

    except Exception as e:
        logger.warning(f"Failed to deduplicate {cache_file.name}: {e}")
        return False


def _write_cache_csv(ticker: str, start_date: str, end_date: str, rows: list[dict[str, str]]) -> Path:
    """Write normalized OHLCV rows to cache using standard filename pattern."""
    DATA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_CACHE_DIR / f"{ticker.upper()}-YFin-data-{start_date}-{end_date}.csv"
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Date", "Close", "High", "Low", "Open", "Volume"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    return out_path


def _ensure_cached_data(
    ticker: str, start_date: str | None, end_date: str | None, update_stale: bool = True
) -> Path | None:
    """Ensure OHLCV cache exists for ticker and is up to date.

    If cache exists but is stale (more than 1 day old), updates it incrementally.
    If cache doesn't exist, fetches full history and creates it.

    Uses in-memory tracking to prevent redundant updates when multiple positions
    use the same ticker in a single request batch.

    Args:
        ticker: Ticker symbol
        start_date: Start date for initial fetch (if creating new cache)
        end_date: End date for initial fetch (if creating new cache)
        update_stale: If True, updates existing stale caches incrementally

    Returns:
        Path to cache file if created/updated, None if already up to date
    """
    ticker_upper = ticker.upper()

    # Check if we already updated this ticker recently (in the last 5 minutes)
    # This prevents redundant updates when loading a portfolio with multiple positions of the same ticker
    if update_stale and _was_recently_updated(ticker_upper):
        logger.debug(f"Using cached data for {ticker} - already checked in last 5 minutes")
        return None

    # Determine date window if not provided: last ~15 years
    today = datetime.now(tz=timezone.utc).date()
    default_start = (today - timedelta(days=365 * 15)).strftime("%Y-%m-%d")
    default_end = today.strftime("%Y-%m-%d")
    start = start_date or default_start
    end = end_date or default_end

    pattern = f"{ticker_upper}-YFin-data-*.csv"
    existing = list(DATA_CACHE_DIR.glob(pattern))

    # If cache exists, check if it's stale
    if existing:
        cache_file = existing[0]

        # First, deduplicate the cache file if it has duplicates
        # This fixes any duplicates from previous updates
        _deduplicate_cache_file(cache_file)

        if update_stale and _is_cache_stale(cache_file, max_age_days=1):
            logger.info(f"Cache for {ticker} is stale, updating incrementally")
            asset_class = detect_asset_class(ticker)
            result = _update_cache_incrementally(cache_file, ticker, asset_class)
            # Mark as updated to prevent redundant updates in this session
            _mark_as_updated(ticker_upper)
            return result
        # Cache exists and is fresh - mark as checked to prevent redundant staleness checks
        if update_stale:
            _mark_as_updated(ticker_upper)
        return None

    # Cache doesn't exist, create it
    logger.info(f"Creating new cache for {ticker} from {start} to {end}")

    # Detect asset class and fetch
    asset_class = detect_asset_class(ticker)
    try:
        if asset_class == "crypto":
            csv_text = route_to_vendor("get_crypto_data", ticker.upper(), start, end, "USD")
        elif asset_class == "commodity":
            csv_text = route_to_vendor("get_commodity_data", ticker.upper(), start, end, "daily")
        else:
            csv_text = route_to_vendor("get_stock_data", ticker.upper(), start, end)
    except Exception as e:
        # Log the error for debugging
        logger.exception(f"Failed to fetch data for {ticker}: {e}")
        return None

    try:
        rows = _normalize_ohlcv_rows_from_csv(csv_text)
    except Exception as e:
        # Log CSV parsing errors
        logger.exception(f"Failed to parse CSV data for {ticker}: {e}")
        return None

    if not rows:
        logger.warning(f"No data rows returned for {ticker}")
        return None

    # Sort by date to be safe
    rows.sort(key=lambda r: r.get("Date", ""))
    result = _write_cache_csv(ticker, start, end, rows)
    # Mark as updated to prevent redundant updates in this session
    _mark_as_updated(ticker_upper)
    return result


@router.get("/cache", response_model=list[CachedTickerInfo])
async def list_cached_tickers(
    auth=Depends(get_current_auth),
):
    """List all cached tickers with date ranges."""
    if not DATA_CACHE_DIR.exists():
        return []

    cached_tickers = []

    for csv_file in DATA_CACHE_DIR.glob("*-YFin-data-*.csv"):
        ticker = csv_file.name.split("-")[0]
        date_range = _parse_date_range(csv_file.name)

        if date_range:
            # Count records
            try:
                with open(csv_file) as f:
                    record_count = sum(1 for _ in f) - 1  # Subtract header
            except:
                record_count = 0

            cached_tickers.append(
                CachedTickerInfo(
                    ticker=ticker,
                    date_range=date_range,
                    record_count=record_count,
                )
            )

    return sorted(cached_tickers, key=lambda x: x.ticker)


@router.get("/cache/{ticker}", response_model=CachedDataResponse)
async def get_cached_data(
    ticker: str,
    start_date: str | None = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: str | None = Query(None, description="Filter to date (YYYY-MM-DD)"),
    auth=Depends(get_current_auth),
):
    """Get cached market data for a ticker."""
    logger.info(f"Fetching cached data for {ticker} from {DATA_CACHE_DIR}")

    # Ensure cache exists and is up to date
    _ensure_cached_data(ticker, start_date, end_date, update_stale=True)

    # Find matching file
    pattern = f"{ticker.upper()}-YFin-data-*.csv"
    matching_files = list(DATA_CACHE_DIR.glob(pattern))

    logger.info(f"Cache dir exists: {DATA_CACHE_DIR.exists()}, pattern: {pattern}, found: {len(matching_files)} files")

    if not matching_files:
        # Log available files for debugging
        all_files = list(DATA_CACHE_DIR.glob("*.csv")) if DATA_CACHE_DIR.exists() else []
        logger.warning(f"No match for {ticker}. Available files: {[f.name for f in all_files[:5]]}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cached data found for ticker {ticker}",
        )

    # Use the first matching file (should only be one)
    csv_file = matching_files[0]
    date_range = _parse_date_range(csv_file.name)

    if not date_range:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not parse date range from cache file",
        )

    # Read CSV data
    data = []

    def _read_csv_to_rows(file_path: Path) -> list[dict[str, str]]:
        rows: list[dict[str, str]] = []
        with open(file_path) as f:
            reader = csv.DictReader(f)
            for row in reader:
                row_date = row.get("Date", "")
                if start_date and row_date < start_date:
                    continue
                if end_date and row_date > end_date:
                    continue
                for field in ["Close", "High", "Low", "Open", "Volume"]:
                    if row.get(field):
                        with contextlib.suppress(builtins.BaseException):
                            row[field] = float(row[field])
                rows.append(row)
        return rows

    try:
        data = _read_csv_to_rows(csv_file)
        # Self-heal: if all numeric fields are empty, regenerate cache once
        has_any_price = any(
            isinstance(r.get("Close"), (int, float)) or str(r.get("Close", "")) not in ("",) for r in data
        )
        if not has_any_price:
            # Delete and regenerate cache
            with contextlib.suppress(Exception):
                os.remove(csv_file)
            # Recreate (don't check for stale since we just deleted it)
            _ensure_cached_data(ticker, start_date, end_date, update_stale=False)
            # Re-discover and re-read
            matching_files = list(DATA_CACHE_DIR.glob(pattern))
            if not matching_files:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No cached data found for ticker {ticker}",
                )
            csv_file = matching_files[0]
            data = _read_csv_to_rows(csv_file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading cache file: {e!s}",
        ) from e

    return CachedDataResponse(
        ticker=ticker.upper(),
        date_range=date_range,
        data=data,
    )
