from typing import Annotated

from langchain_core.tools import tool

from litadel.dataflows.interface import route_to_vendor


@tool
def get_commodity_data(
    commodity: Annotated[str, "name like WTI, BRENT, NATURAL_GAS, COPPER"],
    start_date: Annotated[str, "YYYY-mm-dd"],
    end_date: Annotated[str, "YYYY-mm-dd"],
    interval: Annotated[str, "daily|weekly|monthly"] = "monthly",
) -> str:
    """
    Retrieve commodity price data for a given commodity symbol.
    Uses the configured commodity_data vendor.
    """
    return route_to_vendor("get_commodity_data", commodity, start_date, end_date, interval)
