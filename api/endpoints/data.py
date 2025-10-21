"""Cached data access endpoints."""

import csv
import glob
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

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

