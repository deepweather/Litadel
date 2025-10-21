from .alpha_vantage_common import _make_api_request
from datetime import datetime, timedelta

# Map human-friendly names to Alpha Vantage commodity functions
FUNCTIONS = {
    "WTI": "WTI",
    "BRENT": "BRENT",
    "NATURAL_GAS": "NATURAL_GAS",
    "COPPER": "COPPER",
    "ALUMINUM": "ALUMINUM",
    "WHEAT": "WHEAT",
    "CORN": "CORN",
    "SUGAR": "SUGAR",
    "COTTON": "COTTON",
    "COFFEE": "COFFEE",
}


def get_commodity(
    commodity: str,
    start_date: str,
    end_date: str,
    interval: str = "monthly",
) -> str:
    """
    Fetch commodity price series from Alpha Vantage and return as CSV with columns time,value.

    Args:
        commodity: e.g. WTI, BRENT, NATURAL_GAS, COPPER
        start_date: YYYY-mm-dd
        end_date: YYYY-mm-dd
        interval: daily|weekly|monthly (depends on AV endpoint support)

    Returns:
        CSV string with headers time,value
    """
    func = FUNCTIONS.get(commodity.upper())
    if not func:
        raise ValueError(f"Unsupported commodity: {commodity}")

    params = {
        "interval": interval,
        "datatype": "json",
    }

    raw = _make_api_request(func, params)

    # Convert AV JSON payload to simple CSV
    import json
    import io

    try:
        payload = json.loads(raw)
        series = payload.get("data") or []

        s_dt = datetime.strptime(start_date, "%Y-%m-%d")
        e_dt = datetime.strptime(end_date, "%Y-%m-%d")

        # If user passed a very narrow window (e.g., single day) on a monthly/weekly series,
        # widen to a reasonable historical window to ensure data presence.
        if interval == "monthly" and (e_dt - s_dt).days < 28:
            s_dt = e_dt - timedelta(days=365)
        elif interval == "weekly" and (e_dt - s_dt).days < 7:
            s_dt = e_dt - timedelta(days=180)

        rows = []
        for item in series:
            # items are like {"date": "2025-05-01", "value": "xxxx"}
            d = datetime.strptime(item["date"], "%Y-%m-%d")
            if s_dt <= d <= e_dt:
                rows.append((item["date"], item.get("value")))

        out = io.StringIO()
        out.write("time,value\n")
        for d, v in sorted(rows):
            out.write(f"{d},{v}\n")
        csv_text = out.getvalue()
        # If still empty after widening, return header + latest few rows without filtering
        if csv_text.strip() == "time,value":
            out = io.StringIO()
            out.write("time,value\n")
            for item in series[:24]:  # last ~2 years monthly
                out.write(f"{item['date']},{item.get('value')}\n")
            return out.getvalue()
        return csv_text
    except Exception:
        # Fallback: return raw payload for debugging
        return raw
