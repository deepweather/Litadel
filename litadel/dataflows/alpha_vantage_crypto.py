"""Alpha Vantage cryptocurrency data fetcher."""

from .alpha_vantage_common import _make_api_request
from datetime import datetime, timedelta
import json
import io

# Map crypto symbols to full names for better context
CRYPTO_NAMES = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "BNB": "Binance Coin",
    "XRP": "Ripple",
    "ADA": "Cardano",
    "SOL": "Solana",
    "DOGE": "Dogecoin",
    "DOT": "Polkadot",
    "MATIC": "Polygon",
    "AVAX": "Avalanche",
    "LINK": "Chainlink",
    "UNI": "Uniswap",
    "ATOM": "Cosmos",
    "LTC": "Litecoin",
    "BCH": "Bitcoin Cash",
    "XLM": "Stellar",
    "ALGO": "Algorand",
    "VET": "VeChain",
    "ICP": "Internet Computer",
    "FIL": "Filecoin",
}


def get_crypto(
    symbol: str,
    start_date: str,
    end_date: str,
    market: str = "USD",
) -> str:
    """
    Fetch cryptocurrency OHLCV data from Alpha Vantage.
    
    Uses the DIGITAL_CURRENCY_DAILY function to get daily crypto prices.
    
    Args:
        symbol: Cryptocurrency symbol (e.g., "BTC", "ETH", "SOL")
        start_date: Start date in YYYY-mm-dd format
        end_date: End date in YYYY-mm-dd format
        market: Market currency (default "USD", can also be "EUR", "GBP", etc.)
    
    Returns:
        CSV string with columns: time,open,high,low,close,volume
    """
    symbol_upper = symbol.upper()
    market_upper = market.upper()
    
    # Alpha Vantage uses DIGITAL_CURRENCY_DAILY
    params = {
        "symbol": symbol_upper,
        "market": market_upper,
    }
    
    raw = _make_api_request("DIGITAL_CURRENCY_DAILY", params)
    
    # Parse the JSON response and convert to CSV
    try:
        payload = json.loads(raw)
        
        # Alpha Vantage returns data in "Time Series (Digital Currency Daily)" key
        time_series_key = "Time Series (Digital Currency Daily)"
        
        if time_series_key not in payload:
            # If key not found, return raw for debugging
            return raw
        
        time_series = payload[time_series_key]
        
        # Parse date range
        s_dt = datetime.strptime(start_date, "%Y-%m-%d")
        e_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        # If very narrow window, widen to get more context
        if (e_dt - s_dt).days < 7:
            s_dt = e_dt - timedelta(days=90)  # 90 days for crypto (more volatile)
        
        # DEBUG: Check what keys are available in the first data point
        if time_series:
            first_date = next(iter(time_series))
            first_data = time_series[first_date]
            print(f"DEBUG: Available keys in crypto data: {list(first_data.keys())}")
        
        # Build rows within date range
        rows = []
        for date_str, values in time_series.items():
            try:
                d = datetime.strptime(date_str, "%Y-%m-%d")
                if s_dt <= d <= e_dt:
                    # Alpha Vantage crypto keys - try multiple formats
                    # Format 1: "1a. open (USD)" - standard format
                    # Format 2: "1b. open (USD)" - alternate
                    # Format 3: "1. open" - fallback
                    
                    def find_value(patterns):
                        """Try multiple key patterns and return first match."""
                        for pattern in patterns:
                            if pattern in values:
                                return values[pattern]
                        return ""
                    
                    open_price = find_value([
                        f"1a. open ({market_upper})",
                        f"1b. open ({market_upper})",
                        "1a. open",
                        "1. open"
                    ])
                    high_price = find_value([
                        f"2a. high ({market_upper})",
                        f"2b. high ({market_upper})",
                        "2a. high",
                        "2. high"
                    ])
                    low_price = find_value([
                        f"3a. low ({market_upper})",
                        f"3b. low ({market_upper})",
                        "3a. low",
                        "3. low"
                    ])
                    close_price = find_value([
                        f"4a. close ({market_upper})",
                        f"4b. close ({market_upper})",
                        "4a. close",
                        "4. close"
                    ])
                    volume = values.get("5. volume", "")
                    
                    rows.append((
                        date_str,
                        open_price,
                        high_price,
                        low_price,
                        close_price,
                        volume
                    ))
            except ValueError:
                # Skip invalid dates
                continue
        
        # Sort by date (oldest first)
        rows.sort(key=lambda x: x[0])
        
        # Convert to CSV
        out = io.StringIO()
        out.write("time,open,high,low,close,volume\n")
        for row in rows:
            out.write(f"{row[0]},{row[1]},{row[2]},{row[3]},{row[4]},{row[5]}\n")
        
        csv_text = out.getvalue()
        
        # If still empty after widening, return recent data without filtering
        if csv_text.strip() == "time,open,high,low,close,volume":
            out = io.StringIO()
            out.write("time,open,high,low,close,volume\n")
            # Get last 90 days
            sorted_dates = sorted(time_series.keys(), reverse=True)[:90]
            
            def find_value(vals, patterns):
                """Try multiple key patterns and return first match."""
                for pattern in patterns:
                    if pattern in vals:
                        return vals[pattern]
                return ""
            
            for date_str in reversed(sorted_dates):
                values = time_series[date_str]
                
                open_price = find_value(values, [
                    f"1a. open ({market_upper})",
                    f"1b. open ({market_upper})",
                    "1a. open",
                    "1. open"
                ])
                high_price = find_value(values, [
                    f"2a. high ({market_upper})",
                    f"2b. high ({market_upper})",
                    "2a. high",
                    "2. high"
                ])
                low_price = find_value(values, [
                    f"3a. low ({market_upper})",
                    f"3b. low ({market_upper})",
                    "3a. low",
                    "3. low"
                ])
                close_price = find_value(values, [
                    f"4a. close ({market_upper})",
                    f"4b. close ({market_upper})",
                    "4a. close",
                    "4. close"
                ])
                
                out.write(
                    f"{date_str},"
                    f"{open_price},"
                    f"{high_price},"
                    f"{low_price},"
                    f"{close_price},"
                    f"{values.get('5. volume', '')}\n"
                )
            return out.getvalue()
        
        return csv_text
        
    except (json.JSONDecodeError, KeyError, Exception) as e:
        # Fallback: return raw payload for debugging
        return f"Error parsing crypto data: {str(e)}\n\nRaw response:\n{raw}"

