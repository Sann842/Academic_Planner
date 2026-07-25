import re
from nepali_datetime import date as bsdate
from datetime import date as ad_date
from django.core.exceptions import ValidationError

# Strict YYYY-MM-DD shape check before we even try to build a BS date
BS_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_bs_date(bs_str: str) -> bsdate:
    """Parse a 'YYYY-MM-DD' string as a real BS calendar date.

    Raises ValueError if the string is malformed or isn't a real day in the
    BS calendar (e.g. day 30 in a 29-day month). Deliberately does NOT rely
    on Python's built-in `date` type, since that only understands Gregorian
    month lengths and would wrongly reject valid BS dates like day 31/32.
    """
    if not isinstance(bs_str, str) or not BS_DATE_RE.match(bs_str):
        raise ValueError(f"'{bs_str}' is not in YYYY-MM-DD format")
    y, m, d = map(int, bs_str.split("-"))
    return bsdate(y, m, d)  # nepali_datetime validates real BS day/month ranges


def validate_bs_date(value: str) -> None:
    """Django-style field validator for BS date strings."""
    try:
        parse_bs_date(value)
    except (ValueError, TypeError) as exc:
        raise ValidationError(
            f"'{value}' is not a valid BS date (expected YYYY-MM-DD): {exc}"
        )


def bs_to_ad(bs_str: str) -> ad_date:
    """Convert BS (YYYY-MM-DD) → AD date"""
    bs = parse_bs_date(bs_str)
    return bs.to_datetime_date()


def ad_to_bs_str(ad: ad_date) -> str:
    """Convert AD → BS string (YYYY-MM-DD)"""
    bs = bsdate.from_datetime_date(ad)
    return f"{bs.year:04d}-{bs.month:02d}-{bs.day:02d}"