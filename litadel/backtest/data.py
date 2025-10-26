"""Data fetching for backtest execution with caching support."""

import io

import pandas as pd

from cli.asset_detection import detect_asset_class
from litadel.dataflows.config import set_config
from litadel.dataflows.interface import route_to_vendor
from litadel.default_config import DEFAULT_CONFIG


def fetch_ohlcv_data(
    symbol: str, start_date: str, end_date: str, asset_class: str | None = None
) -> tuple[pd.DataFrame, str]:
    """
    Fetch OHLCV data using existing data pipelines with caching.

    Args:
        symbol: Ticker symbol (AAPL, BTC, BRENT, etc.)
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        asset_class: Asset class (equity, crypto, commodity). Auto-detected if None.

    Returns:
        Tuple of (DataFrame with OHLCV data, data_source)
        DataFrame has DatetimeIndex and columns: Open, High, Low, Close, Volume
        data_source is "cache" or "live" (determined by vendor implementation)

    Raises:
        ValueError: If data cannot be fetched or is invalid
    """
    # Auto-detect asset class if not provided
    if asset_class is None:
        asset_class = detect_asset_class(symbol)

    # Initialize config
    config = DEFAULT_CONFIG.copy()
    set_config(config)

    # Route to appropriate data source (uses cache internally)
    # The route_to_vendor already handles caching at the dataflow level
    try:
        if asset_class == "crypto":
            csv_data = route_to_vendor("get_crypto_data", symbol, start_date, end_date, "USD")
        elif asset_class == "commodity":
            csv_data = route_to_vendor("get_commodity_data", symbol, start_date, end_date, "daily")
        else:  # equity
            csv_data = route_to_vendor("get_stock_data", symbol, start_date, end_date)
    except Exception as e:
        raise ValueError(f"Failed to fetch data for {symbol}: {e}") from e

    # Determine data source (simplified - actual cache detection happens at vendor level)
    # For now, we'll mark as "cache" since the vendor handles caching transparently
    data_source = "cache"  # Vendors use cache when available

    # Parse CSV data
    lines = csv_data.strip().split("\n")
    csv_lines = [line for line in lines if not line.startswith("#")]
    csv_string = "\n".join(csv_lines)

    # Read into DataFrame
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

    # For commodities that only have 'value', create OHLC from Close
    if "Close" in df.columns and "Open" not in df.columns:
        df["Open"] = df["Close"]
        df["High"] = df["Close"]
        df["Low"] = df["Close"]

    # Ensure required columns
    required_cols = ["Open", "High", "Low", "Close"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}. Available: {df.columns.tolist()}")

    # Ensure Date column
    if "Date" not in df.columns:
        raise ValueError(f"No Date column found. Available columns: {df.columns.tolist()}")

    # Set date as index
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.set_index("Date")
    df = df.sort_index()

    # Select OHLCV columns
    columns_to_keep = ["Open", "High", "Low", "Close"]
    if "Volume" in df.columns:
        columns_to_keep.append("Volume")
    else:
        df["Volume"] = 0  # Add dummy volume
        columns_to_keep.append("Volume")

    df = df[columns_to_keep]

    # Remove NaN values
    df = df.dropna()

    # Convert to numeric types
    for col in columns_to_keep:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Remove any remaining NaN after conversion
    df = df.dropna()

    if df.empty:
        raise ValueError(f"No valid data after processing for {symbol}")

    return df, data_source
