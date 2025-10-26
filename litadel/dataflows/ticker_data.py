"""Centralized ticker data fetching - single source of truth."""

import pandas as pd

from cli.asset_detection import detect_asset_class, normalize_ticker
from litadel.default_config import DEFAULT_CONFIG

from .config import set_config
from .interface import route_to_vendor


def get_ticker_data(
    symbol: str,
    start_date: str,
    end_date: str,
    asset_class: str | None = None,
) -> tuple[pd.DataFrame, str]:
    """
    Fetch OHLCV data for any ticker (stocks, crypto, commodities).

    This is the SINGLE function that all systems should use for market data.

    Args:
        symbol: Ticker symbol (AAPL, BTC, BRENT, etc.)
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        asset_class: Asset class (auto-detected if None)

    Returns:
        Tuple of (DataFrame with OHLCV data, data_source)
        DataFrame has DatetimeIndex and columns: Open, High, Low, Close, Volume

    Raises:
        ValueError: If data cannot be fetched
    """
    # Auto-detect asset class if not provided
    if asset_class is None:
        asset_class = detect_asset_class(symbol)

    # Normalize ticker for the vendor
    normalized_symbol = normalize_ticker(symbol, asset_class)

    # Initialize config
    config = DEFAULT_CONFIG.copy()
    set_config(config)

    # Route to appropriate vendor
    try:
        if asset_class == "crypto":
            csv_data = route_to_vendor("get_stock_data", normalized_symbol, start_date, end_date)
        elif asset_class == "commodity":
            csv_data = route_to_vendor("get_commodity_data", normalized_symbol, start_date, end_date, "daily")
        else:  # equity
            csv_data = route_to_vendor("get_stock_data", normalized_symbol, start_date, end_date)
    except Exception as e:
        raise ValueError(f"Failed to fetch data for {symbol}: {e}") from e

    # Parse CSV
    import io

    lines = csv_data.strip().split("\n")
    csv_lines = [line for line in lines if not line.startswith("#")]
    csv_string = "\n".join(csv_lines)

    df = pd.read_csv(io.StringIO(csv_string))

    # Standardize column names
    column_mapping = {
        "Date": "Date",
        "date": "Date",
        "time": "Date",
        "timestamp": "Date",
        "Open": "Open",
        "open": "Open",
        "High": "High",
        "high": "High",
        "Low": "Low",
        "low": "Low",
        "Close": "Close",
        "close": "Close",
        "Volume": "Volume",
        "volume": "Volume",
        "Adj Close": "Adj_Close",
        "value": "Close",  # For commodities
    }
    df = df.rename(columns=column_mapping)

    # Create OHLC from Close for commodities with single value
    if "Close" in df.columns and "Open" not in df.columns:
        df["Open"] = df["Close"]
        df["High"] = df["Close"]
        df["Low"] = df["Close"]

    # Ensure required columns
    required_cols = ["Open", "High", "Low", "Close"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}. Available: {df.columns.tolist()}")

    if "Date" not in df.columns:
        raise ValueError(f"No Date column found. Available: {df.columns.tolist()}")

    # Set date as index
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.set_index("Date")
    df = df.sort_index()

    # Filter by requested date range
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    df = df[(df.index >= start_dt) & (df.index <= end_dt)]

    if df.empty:
        raise ValueError(f"No data available for {symbol} in date range {start_date} to {end_date}")

    # Select OHLCV columns only
    columns_to_keep = ["Open", "High", "Low", "Close"]
    if "Volume" in df.columns:
        columns_to_keep.append("Volume")
    else:
        df["Volume"] = 0
        columns_to_keep.append("Volume")

    df = df[columns_to_keep]
    df = df.dropna()

    # Convert to numeric
    for col in columns_to_keep:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna()

    if df.empty:
        raise ValueError(f"No valid data after processing for {symbol}")

    return df, "cache"  # Vendors handle caching
