"""Shared helpers for converting SEAD's years-BP dating convention into display labels.

Confirmed against sead_staging: age_older/age_younger are years Before Present (BP, 1950
baseline) -- e.g. age_older=1925 pairs with the age_name "CAL_25-175_AD" since 1950-1925=25.
"Oldest" means the largest BP value; "closest to today" means the smallest.
"""

BP_BASELINE = 1950


def bp_to_calendar_year(bp: float) -> int:
    return BP_BASELINE - round(bp)


def calendar_label(bp: float | None) -> str:
    if bp is None or bp != bp:  # NaN check without importing math/numpy
        return "unknown"
    year = bp_to_calendar_year(bp)
    if year < 0:
        return f"{abs(year)} BC"
    if year == 0:
        return "1 BC/AD"
    return f"{year} AD"
