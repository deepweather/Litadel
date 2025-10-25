"""Cached data access endpoints."""

import csv
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.auth import APIKey, get_current_api_key
from api.models.responses import CachedDataResponse, CachedTickerInfo
from cli.asset_detection import detect_asset_class
from litadel.dataflows.interface import route_to_vendor

router = APIRouter(prefix="/api/v1/data", tags=["data"])
logger = logging.getLogger(__name__)

# Data cache directory (resolve to absolute path to avoid cwd issues)
DATA_CACHE_DIR = Path(__file__).parent.parent.parent / "litadel" / "dataflows" / "data_cache"


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
    import io

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


def _ensure_cached_data(ticker: str, start_date: str | None, end_date: str | None) -> Path | None:
    """Ensure OHLCV cache exists for ticker. If missing, fetch via vendor and write cache.
    Returns the cache file path if created, else None.
    """
    # Determine date window if not provided: last ~15 years
    today = datetime.utcnow().date()
    default_start = (today - timedelta(days=365 * 15)).strftime("%Y-%m-%d")
    default_end = today.strftime("%Y-%m-%d")
    start = start_date or default_start
    end = end_date or default_end

    pattern = f"{ticker.upper()}-YFin-data-*.csv"
    existing = list(DATA_CACHE_DIR.glob(pattern))
    if existing:
        return None  # already present

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
        logger.error(f"Failed to fetch data for {ticker}: {e}")
        return None

    try:
        rows = _normalize_ohlcv_rows_from_csv(csv_text)
    except Exception as e:
        # Log CSV parsing errors
        logger.error(f"Failed to parse CSV data for {ticker}: {e}")
        return None

    if not rows:
        logger.warning(f"No data rows returned for {ticker}")
        return None

    # Sort by date to be safe
    rows.sort(key=lambda r: r.get("Date", ""))
    return _write_cache_csv(ticker, start, end, rows)


@router.get("/cache", response_model=list[CachedTickerInfo])
async def list_cached_tickers(
    api_key: APIKey = Depends(get_current_api_key),
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
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get cached market data for a ticker."""
    logger.info(f"Fetching cached data for {ticker} from {DATA_CACHE_DIR}")

    # Ensure cache exists (auto-fetches if missing for crypto/commodities/stocks)
    _ensure_cached_data(ticker, start_date, end_date)

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
                        try:
                            row[field] = float(row[field])
                        except:
                            pass
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
            try:
                os.remove(csv_file)
            except Exception:
                pass
            # Recreate
            _ensure_cached_data(ticker, start_date, end_date)
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
        )

    return CachedDataResponse(
        ticker=ticker.upper(),
        date_range=date_range,
        data=data,
    )
