"""Cryptocurrency technical indicators calculator.

Uses stockstats library to calculate indicators on crypto OHLCV data
fetched from Alpha Vantage (or other sources).
"""

import io
import os
from datetime import datetime
from typing import Annotated

import pandas as pd
from dateutil.relativedelta import relativedelta
from stockstats import wrap

from .config import get_config


def get_crypto_indicators(
    symbol: Annotated[str, "Crypto symbol like BTC, ETH, SOL"],
    indicator: Annotated[str, "Technical indicator to calculate"],
    curr_date: Annotated[str, "The current trading date you are analyzing, YYYY-mm-dd"],
    look_back_days: Annotated[int, "How many days to look back"],
    market: Annotated[str, "Market currency like USD, EUR"] = "USD",
) -> str:
    """
    Calculate technical indicators for cryptocurrency data.

    This function fetches crypto OHLCV data and calculates technical indicators
    using the same stockstats library used for equities.

    Args:
        symbol: Cryptocurrency symbol (e.g., "BTC", "ETH", "SOL")
        indicator: Technical indicator name (e.g., "rsi", "macd", "close_50_sma")
        curr_date: Current date for analysis in YYYY-mm-dd format
        look_back_days: Number of days to look back for the indicator window
        market: Market currency (default "USD")

    Returns:
        Formatted string with indicator values for each date in the window

    Supported indicators: Same as stocks - sma_X, ema_X, rsi, macd, boll, adx, cci, stoch, etc.
    """
    # Indicator descriptions (same as stocks)
    best_ind_params = {
        # Moving Averages
        "close_50_sma": (
            "50 SMA: A medium-term trend indicator. "
            "Usage: Identify trend direction and serve as dynamic support/resistance. "
            "Tips: It lags price; combine with faster indicators for timely signals."
        ),
        "close_200_sma": (
            "200 SMA: A long-term trend benchmark. "
            "Usage: Confirm overall market trend and identify golden/death cross setups. "
            "Tips: It reacts slowly; best for strategic trend confirmation rather than frequent trading entries."
        ),
        "close_10_ema": (
            "10 EMA: A responsive short-term average. "
            "Usage: Capture quick shifts in momentum and potential entry points. "
            "Tips: Prone to noise in choppy markets; use alongside longer averages for filtering false signals."
        ),
        # MACD Related
        "macd": (
            "MACD: Computes momentum via differences of EMAs. "
            "Usage: Look for crossovers and divergence as signals of trend changes. "
            "Tips: Confirm with other indicators in low-volatility or sideways markets."
        ),
        "macds": (
            "MACD Signal: An EMA smoothing of the MACD line. "
            "Usage: Use crossovers with the MACD line to trigger trades. "
            "Tips: Should be part of a broader strategy to avoid false positives."
        ),
        "macdh": (
            "MACD Histogram: Shows the gap between the MACD line and its signal. "
            "Usage: Visualize momentum strength and spot divergence early. "
            "Tips: Can be volatile; complement with additional filters in fast-moving markets."
        ),
        # Momentum Indicators
        "rsi": (
            "RSI: Measures momentum to flag overbought/oversold conditions. "
            "Usage: Apply 70/30 thresholds and watch for divergence to signal reversals. "
            "Tips: In strong trends, RSI may remain extreme; always cross-check with trend analysis. "
            "For crypto: Consider 80/20 thresholds due to higher volatility."
        ),
        # Volatility Indicators
        "boll": (
            "Bollinger Middle: A 20 SMA serving as the basis for Bollinger Bands. "
            "Usage: Acts as a dynamic benchmark for price movement. "
            "Tips: Combine with the upper and lower bands to effectively spot breakouts or reversals."
        ),
        "boll_ub": (
            "Bollinger Upper Band: Typically 2 standard deviations above the middle line. "
            "Usage: Signals potential overbought conditions and breakout zones. "
            "Tips: Confirm signals with other tools; prices may ride the band in strong trends. "
            "Crypto note: High volatility may cause frequent band touches."
        ),
        "boll_lb": (
            "Bollinger Lower Band: Typically 2 standard deviations below the middle line. "
            "Usage: Indicates potential oversold conditions. "
            "Tips: Use additional analysis to avoid false reversal signals."
        ),
        "atr": (
            "ATR: Averages true range to measure volatility. "
            "Usage: Set stop-loss levels and adjust position sizes based on current market volatility. "
            "Tips: It's a reactive measure, so use it as part of a broader risk management strategy. "
            "Crypto note: Expect higher ATR values due to 24/7 trading and volatility."
        ),
        # Volume-Based Indicators
        "vwma": (
            "VWMA: A moving average weighted by volume. "
            "Usage: Confirm trends by integrating price action with volume data. "
            "Tips: Watch for skewed results from volume spikes; use in combination with other volume analyses."
        ),
        "mfi": (
            "MFI: The Money Flow Index is a momentum indicator that uses both price and volume to measure buying and selling pressure. "
            "Usage: Identify overbought (>80) or oversold (<20) conditions and confirm the strength of trends or reversals. "
            "Tips: Use alongside RSI or MACD to confirm signals; divergence between price and MFI can indicate potential reversals."
        ),
    }

    if indicator not in best_ind_params:
        msg = f"Indicator {indicator} is not supported. Please choose from: {list(best_ind_params.keys())}"
        raise ValueError(msg)

    end_date = curr_date
    curr_date_dt = datetime.strptime(curr_date, "%Y-%m-%d")
    before = curr_date_dt - relativedelta(days=look_back_days)

    # Optimized: Get crypto data once and calculate indicators for all dates
    try:
        indicator_data = _get_crypto_stats_bulk(symbol, indicator, curr_date, market)

        # Generate the date range we need
        current_dt = curr_date_dt
        date_values = []

        while current_dt >= before:
            date_str = current_dt.strftime("%Y-%m-%d")

            # Look up the indicator value for this date
            if date_str in indicator_data:
                indicator_value = indicator_data[date_str]
            else:
                # For crypto, weekends are trading days, so N/A means genuinely missing data
                indicator_value = "N/A: Data not available for this date"

            date_values.append((date_str, indicator_value))
            current_dt = current_dt - relativedelta(days=1)

        # Build the result string
        ind_string = ""
        for date_str, value in date_values:
            ind_string += f"{date_str}: {value}\n"

    except Exception as e:
        # Return error details for debugging
        return f"Error calculating crypto indicator {indicator} for {symbol}: {e!s}"

    return (
        f"## {indicator} values for {symbol} from {before.strftime('%Y-%m-%d')} to {end_date}:\n\n"
        + ind_string
        + "\n\n"
        + best_ind_params.get(indicator, "No description available.")
    )


def _get_crypto_stats_bulk(
    symbol: Annotated[str, "Crypto symbol"],
    indicator: Annotated[str, "Technical indicator to calculate"],
    curr_date: Annotated[str, "Current date for reference"],
    market: Annotated[str, "Market currency"] = "USD",
) -> dict:
    """
    Optimized bulk calculation of crypto indicators.
    Fetches data once and calculates indicator for all available dates.
    Returns dict mapping date strings to indicator values.

    IMPORTANT: Only fetches data up to curr_date to prevent look-ahead bias.
    """
    config = get_config()

    # Calculate date range - need enough history for indicator calculation
    curr_date_dt = pd.to_datetime(curr_date)

    # Crypto data: fetch wider range for indicator calculation (need warmup period)
    # Go back 2 years to ensure enough data for long-period indicators like 200 SMA
    end_date = curr_date_dt
    start_date = curr_date_dt - pd.DateOffset(years=2)
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")

    # Check for cached data first
    os.makedirs(config["data_cache_dir"], exist_ok=True)

    cache_file = os.path.join(
        config["data_cache_dir"],
        f"{symbol}-Crypto-data-{start_date_str}-{end_date_str}-{market}.csv",
    )

    if os.path.exists(cache_file):
        # Load from cache
        print(f"DEBUG: Loading cached crypto data from {cache_file}")
        data = pd.read_csv(cache_file)
        # Ensure date column is named consistently
        if "time" in data.columns:
            data = data.rename(columns={"time": "Date"})
        data["Date"] = pd.to_datetime(data["Date"])
    else:
        # Fetch from vendor
        print(f"DEBUG: Fetching crypto data for {symbol} from {start_date_str} to {end_date_str}")

        # Import here to avoid circular import
        from .interface import route_to_vendor

        # Use route_to_vendor to get crypto data (will use Alpha Vantage by default)
        csv_data = route_to_vendor("get_crypto_data", symbol, start_date_str, end_date_str, market)

        # Parse CSV string into DataFrame
        data = pd.read_csv(io.StringIO(csv_data))

        # Standardize column names for stockstats
        # Alpha Vantage crypto returns: time,open,high,low,close,volume
        # Stockstats expects: Date,Open,High,Low,Close,Volume
        column_mapping = {
            "time": "Date",
            "open": "Open",
            "high": "High",
            "low": "Low",
            "close": "Close",
            "volume": "Volume",
        }

        # Only rename columns that exist
        existing_renames = {k: v for k, v in column_mapping.items() if k in data.columns}
        data = data.rename(columns=existing_renames)

        # Ensure Date is datetime
        data["Date"] = pd.to_datetime(data["Date"])

        # Cache for future use
        data.to_csv(cache_file, index=False)
        print(f"DEBUG: Cached crypto data to {cache_file}")

    # CRITICAL: Filter data to only include dates up to curr_date
    # This prevents look-ahead bias in indicator calculations
    data = data[data["Date"] <= pd.to_datetime(curr_date)]

    if data.empty:
        msg = f"No crypto data available for {symbol} up to {curr_date}"
        raise ValueError(msg)

    # Convert numeric columns to float (handle any string artifacts)
    numeric_cols = ["Open", "High", "Low", "Close", "Volume"]
    for col in numeric_cols:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors="coerce")

    # Remove rows with NaN in price data (would break indicators)
    data = data.dropna(subset=["Open", "High", "Low", "Close"])

    # Sort by date (oldest first) - important for indicator calculation
    data = data.sort_values("Date")

    # Wrap with stockstats - this enables automatic indicator calculation
    df = wrap(data)

    # Format date as string for consistent access
    df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

    # Calculate the indicator for all rows at once
    # This triggers stockstats to calculate the indicator column
    df[indicator]

    # Create a dictionary mapping date strings to indicator values
    result_dict = {}
    for _, row in df.iterrows():
        date_str = row["Date"]
        indicator_value = row[indicator]

        # Handle NaN/None values
        if pd.isna(indicator_value):
            result_dict[date_str] = "N/A"
        else:
            # Format to reasonable precision
            result_dict[date_str] = f"{indicator_value:.4f}"

    return result_dict
