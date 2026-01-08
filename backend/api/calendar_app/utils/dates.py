from nepali_datetime import date as bsdate
from datetime import date as ad_date


def bs_to_ad(bs_str: str) -> ad_date:
    """Convert BS (YYYY-MM-DD) → AD date"""
    y, m, d = map(int, bs_str.split("-"))
    bs = bsdate(y, m, d)
    return bs.to_datetime_date()


def ad_to_bs_str(ad: ad_date) -> str:
    """Convert AD → BS string (YYYY-MM-DD)"""
    bs = bsdate.from_datetime_date(ad)
    return f"{bs.year:04d}-{bs.month:02d}-{bs.day:02d}"
