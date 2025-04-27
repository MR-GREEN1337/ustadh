from datetime import datetime, timedelta
from fastapi import HTTPException
from typing import Tuple


def parse_time_range(time_range: str) -> Tuple[datetime, datetime]:
    """Parse the time range string and return start and end dates."""
    end_date = datetime.utcnow()

    if time_range == "week":
        start_date = end_date - timedelta(weeks=1)
    elif time_range == "month":
        start_date = end_date - timedelta(days=30)
    elif time_range == "semester":
        start_date = end_date - timedelta(
            days=180
        )  # Assuming a semester is roughly 6 months
    elif time_range == "year":
        start_date = end_date - timedelta(days=365)
    else:
        raise HTTPException(status_code=400, detail="Invalid time range specified")

    return start_date, end_date
