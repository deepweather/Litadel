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


def detect_asset_class(symbol: str) -> str:
    """
    Automatically detect if a symbol is a commodity or equity.
    
    Args:
        symbol: The ticker symbol (e.g., "BRENT", "AAPL")
    
    Returns:
        "commodity" if the symbol matches a known commodity, "equity" otherwise
    """
    return "commodity" if symbol.upper() in KNOWN_COMMODITIES else "equity"


def get_asset_class_display_name(asset_class: str) -> str:
    """Get a human-friendly display name for the asset class."""
    return asset_class.capitalize()

