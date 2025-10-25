from datetime import datetime, timedelta, timezone
from typing import Annotated

import pandas as pd

SavePathType = Annotated[str, "File path to save data. If None, data is not saved."]

# Constants
SATURDAY_WEEKDAY = 5  # datetime.weekday() returns 5 for Saturday


def save_output(data: pd.DataFrame, tag: str, save_path: SavePathType = None) -> None:
    if save_path:
        data.to_csv(save_path)
        print(f"{tag} saved to {save_path}")


def get_current_date():
    return datetime.now(tz=timezone.utc).date().strftime("%Y-%m-%d")


def decorate_all_methods(decorator):
    def class_decorator(cls):
        for attr_name, attr_value in cls.__dict__.items():
            if callable(attr_value):
                setattr(cls, attr_name, decorator(attr_value))
        return cls

    return class_decorator


def get_next_weekday(date):
    if not isinstance(date, datetime):
        date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

    if date.weekday() >= SATURDAY_WEEKDAY:
        days_to_add = 7 - date.weekday()
        return date + timedelta(days=days_to_add)
    return date
