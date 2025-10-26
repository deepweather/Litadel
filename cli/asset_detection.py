"""Asset class detection utilities for the CLI."""

# Known commodities from Alpha Vantage
KNOWN_COMMODITIES = {
    "WTI",
    "BRENT",
    "NATURAL_GAS",
    "COPPER",
    "ALUMINUM",
    "WHEAT",
    "CORN",
    "SUGAR",
    "COTTON",
    "COFFEE",
}

# Known cryptocurrencies supported by Alpha Vantage
KNOWN_CRYPTOS = {
    "BTC",
    "ETH",
    "BNB",
    "XRP",
    "ADA",
    "SOL",
    "DOGE",
    "DOT",
    "MATIC",
    "AVAX",
    "LINK",
    "UNI",
    "ATOM",
    "LTC",
    "BCH",
    "XLM",
    "ALGO",
    "VET",
    "ICP",
    "FIL",
}


def detect_asset_class(symbol: str) -> str:
    """
    Automatically detect if a symbol is a commodity, crypto, or equity.

    Args:
        symbol: The ticker symbol (e.g., "BRENT", "BTC", "BTC-USD", "AAPL")

    Returns:
        "commodity", "crypto", or "equity" based on the symbol
    """
    symbol_upper = symbol.upper()

    # Check exact match first
    if symbol_upper in KNOWN_COMMODITIES:
        return "commodity"
    if symbol_upper in KNOWN_CRYPTOS:
        return "crypto"

    # Check if it's crypto with suffix (e.g., BTC-USD, ETH-USD)
    # Remove common crypto suffixes
    for suffix in ["-USD", "-USDT", "-EUR", "-GBP"]:
        if symbol_upper.endswith(suffix):
            base_symbol = symbol_upper[: -len(suffix)]
            if base_symbol in KNOWN_CRYPTOS:
                return "crypto"

    return "equity"


def get_asset_class_display_name(asset_class: str) -> str:
    """Get a human-friendly display name for the asset class."""
    return asset_class.capitalize()


def normalize_ticker(symbol: str, asset_class: str | None = None) -> str:
    """
    Normalize ticker symbol for the appropriate data vendor.

    For crypto: Ensures -USD suffix for yfinance compatibility
    For stocks/commodities: Returns as-is

    Args:
        symbol: Ticker symbol (BTC, BTC-USD, AAPL, etc.)
        asset_class: Asset class (auto-detected if None)

    Returns:
        Normalized ticker symbol
    """
    if asset_class is None:
        asset_class = detect_asset_class(symbol)

    if asset_class == "crypto":
        # Add -USD suffix if not present
        if not symbol.upper().endswith(("-USD", "-USDT", "-EUR", "-GBP")):
            return f"{symbol}-USD"

    return symbol
