"""
Date validation utilities to prevent look-ahead bias in backtesting.

This module ensures that all data requests are strictly bounded by the analysis date,
preventing any accidental access to future data that would invalidate backtesting results.
"""

from collections.abc import Callable
from datetime import datetime, timezone
from functools import wraps
from typing import Any


class LookAheadBiasError(ValueError):
    """Exception raised when a data request would cause look-ahead bias."""


def validate_date_bounds(
    start_date: str | None,
    end_date: str | None,
    max_date: str,
    param_name: str = "date",
) -> None:
    """
    Validate that requested dates don't exceed the maximum allowed date.

    Args:
        start_date: Start date in YYYY-MM-DD format (can be None)
        end_date: End date in YYYY-MM-DD format (can be None)
        max_date: Maximum allowed date (typically the trade_date)
        param_name: Name of the parameter for error messages

    Raises:
        LookAheadBiasError: If any date exceeds max_date
    """
    max_dt = datetime.strptime(max_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        if start_dt > max_dt:
            raise LookAheadBiasError(
                f"Look-ahead bias detected: {param_name} start_date '{start_date}' "
                f"is after analysis date '{max_date}'. "
                f"Cannot request future data in backtesting mode."
            )

    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        if end_dt > max_dt:
            raise LookAheadBiasError(
                f"Look-ahead bias detected: {param_name} end_date '{end_date}' "
                f"is after analysis date '{max_date}'. "
                f"Cannot request future data in backtesting mode."
            )


def enforce_max_date(max_date_param: str = "curr_date"):
    """
    Decorator to enforce date bounds on data fetching functions.

    This decorator automatically validates that start_date and end_date parameters
    don't exceed the specified maximum date parameter.

    Args:
        max_date_param: Name of the parameter that contains the maximum allowed date

    Example:
        @enforce_max_date("trade_date")
        def get_data(symbol, start_date, end_date, trade_date):
            # This will be validated automatically
            pass
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Get the max_date value
            import inspect

            sig = inspect.signature(func)
            bound_args = sig.bind(*args, **kwargs)
            bound_args.apply_defaults()

            max_date = bound_args.arguments.get(max_date_param)

            if max_date:
                # Validate start_date and end_date if present
                start_date = bound_args.arguments.get("start_date")
                end_date = bound_args.arguments.get("end_date")

                validate_date_bounds(start_date, end_date, max_date, func.__name__)

            return func(*args, **kwargs)

        return wrapper

    return decorator


def cap_date_at_max(date_str: str | None, max_date: str) -> str | None:
    """
    Cap a date at the maximum allowed date.

    If date_str is after max_date, returns max_date instead.
    This is useful for silently preventing look-ahead bias.

    Args:
        date_str: Date to potentially cap
        max_date: Maximum allowed date

    Returns:
        The earlier of date_str or max_date
    """
    if not date_str:
        return date_str

    date_dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    max_dt = datetime.strptime(max_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

    if date_dt > max_dt:
        return max_date

    return date_str


def filter_dataframe_by_date(df: Any, date_column: str, max_date: str) -> Any:
    """
    Filter a pandas DataFrame to only include rows on or before max_date.

    Args:
        df: Pandas DataFrame to filter
        date_column: Name of the date column
        max_date: Maximum allowed date in YYYY-MM-DD format

    Returns:
        Filtered DataFrame
    """
    import pandas as pd

    # Ensure the date column is datetime type
    df[date_column] = pd.to_datetime(df[date_column])

    # Convert max_date to datetime
    max_dt = pd.to_datetime(max_date)

    # Filter
    return df[df[date_column] <= max_dt].copy()


def filter_csv_by_date(csv_string: str, date_column: str, max_date: str) -> str:
    """
    Filter CSV string to only include rows on or before max_date.

    Args:
        csv_string: CSV data as string
        date_column: Name of the date column (e.g., "Date", "timestamp")
        max_date: Maximum allowed date in YYYY-MM-DD format

    Returns:
        Filtered CSV string
    """
    import io

    import pandas as pd

    try:
        # Parse CSV
        df = pd.read_csv(io.StringIO(csv_string))

        # Check if date column exists
        if date_column not in df.columns:
            # Try common date column names
            for col_name in ["Date", "date", "timestamp", "Timestamp"]:
                if col_name in df.columns:
                    date_column = col_name
                    break
            else:
                # No date column found, return as-is
                return csv_string

        # Filter by date
        filtered_df = filter_dataframe_by_date(df, date_column, max_date)

        # Convert back to CSV
        return filtered_df.to_csv(index=False)

    except Exception:
        # If filtering fails, return original
        # This ensures the system doesn't break on edge cases
        return csv_string
