"""Cached data access endpoints."""

import csv
import glob
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from cli.asset_detection import detect_asset_class
from tradingagents.dataflows.interface import route_to_vendor

from api.auth import APIKey, get_current_api_key
from api.models.responses import CachedDataResponse, CachedTickerInfo

router = APIRouter(prefix="/api/v1/data", tags=["data"])

# Data cache directory
DATA_CACHE_DIR = Path("./tradingagents/dataflows/data_cache")


def _parse_date_range(filename: str) -> Optional[Dict[str, str]]:
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


def _normalize_ohlcv_rows_from_csv(csv_text: str) -> List[Dict[str, str]]:
    """Normalize various vendor CSV formats to standard OHLCV schema.
    Output fields: Date, Close, High, Low, Open, Volume
    """
    import io

    rows: List[Dict[str, str]] = []
    if not csv_text:
        return rows

    f = io.StringIO(csv_text)
    reader = csv.DictReader(f)

    # Map common header variants to our standard fields
    def get_field(d: Dict[str, str], *candidates: str) -> Optional[str]:
        for c in candidates:
            if c in d and d[c] not in (None, ""):
                return d[c]
            # case-insensitive
            for k in d.keys():
                if k.lower() == c.lower() and d[k] not in (None, ""):
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
            # Skip rows without date
            continue

        rows.append({
            "Date": str(date_val)[:10],  # ensure YYYY-MM-DD
            "Close": close_val if close_val is not None else "",
            "High": high_val if high_val is not None else "",
            "Low": low_val if low_val is not None else "",
            "Open": open_val if open_val is not None else "",
            "Volume": volume_val if volume_val is not None else "",
        })

    return rows


def _write_cache_csv(ticker: str, start_date: str, end_date: str, rows: List[Dict[str, str]]) -> Path:
    """Write normalized OHLCV rows to cache using standard filename pattern."""
    DATA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_CACHE_DIR / f"{ticker.upper()}-YFin-data-{start_date}-{end_date}.csv"
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Date", "Close", "High", "Low", "Open", "Volume"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    return out_path


def _ensure_cached_data(ticker: str, start_date: Optional[str], end_date: Optional[str]) -> Optional[Path]:
    """Ensure OHLCV cache exists for ticker. If missing, fetch via vendor and write cache.
    Returns the cache file path if created, else None.
    """
    # Determine date window if not provided: last ~15 years
    today = datetime.utcnow().date()
    default_start = (today - timedelta(days=365 * 15)).strftime("%Y-%m-%d")
    default_end = today.strftime("%Y-%m-%d")
    start = (start_date or default_start)
    end = (end_date or default_end)

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
        # If vendor fetch fails, don't block
        return None

    rows = _normalize_ohlcv_rows_from_csv(csv_text)
    if not rows:
        return None

    # Sort by date to be safe
    rows.sort(key=lambda r: r.get("Date", ""))
    return _write_cache_csv(ticker, start, end, rows)


@router.get("/cache", response_model=List[CachedTickerInfo])
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
                with open(csv_file, "r") as f:
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
    start_date: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get cached market data for a ticker."""
    # Ensure cache exists (auto-fetches if missing for crypto/commodities/stocks)
    _ensure_cached_data(ticker, start_date, end_date)

    # Find matching file
    pattern = f"{ticker.upper()}-YFin-data-*.csv"
    matching_files = list(DATA_CACHE_DIR.glob(pattern))
    
    if not matching_files:
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
    try:
        with open(csv_file, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Filter by date if specified
                row_date = row.get("Date", "")
                if start_date and row_date < start_date:
                    continue
                if end_date and row_date > end_date:
                    continue
                
                # Convert numeric fields
                for field in ["Close", "High", "Low", "Open", "Volume"]:
                    if field in row and row[field]:
                        try:
                            row[field] = float(row[field])
                        except:
                            pass
                
                data.append(row)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading cache file: {str(e)}",
        )
    
    return CachedDataResponse(
        ticker=ticker.upper(),
        date_range=date_range,
        data=data,
    )

