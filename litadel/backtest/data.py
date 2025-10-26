"""Data fetching for backtest execution with caching support."""

import pandas as pd

from litadel.dataflows.ticker_data import get_ticker_data


def fetch_ohlcv_data(
    symbol: str, start_date: str, end_date: str, asset_class: str | None = None
) -> tuple[pd.DataFrame, str]:
    """
    Fetch OHLCV data for backtesting.

    This is a thin wrapper around the centralized get_ticker_data function,
    adding the crypto μBTC conversion for fractional trading.

    Args:
        symbol: Ticker symbol (AAPL, BTC, BRENT, etc.)
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        asset_class: Asset class (equity, crypto, commodity). Auto-detected if None.

    Returns:
        Tuple of (DataFrame with OHLCV data, data_source)
        DataFrame has DatetimeIndex and columns: Open, High, Low, Close, Volume

    Raises:
        ValueError: If data cannot be fetched or is invalid
    """
    from cli.asset_detection import detect_asset_class as detect_class

    # Auto-detect if not provided
    if asset_class is None:
        asset_class = detect_class(symbol)

    # Use centralized function to fetch data
    df, data_source = get_ticker_data(symbol, start_date, end_date, asset_class)

    # CRYPTO FIX: Convert to μBTC (micro bitcoin) to enable fractional trading
    # BTC costs ~$100k+, which is too expensive for normal capital amounts
    # Convert prices to per-micro-BTC (1e-6 BTC) so backtesting.py can handle it
    if asset_class == "crypto":
        df = df.copy()
        df["Open"] = df["Open"] / 1e6
        df["High"] = df["High"] / 1e6
        df["Low"] = df["Low"] / 1e6
        df["Close"] = df["Close"] / 1e6
        if "Volume" in df.columns:
            df["Volume"] = df["Volume"] * 1e6

    return df, data_source
