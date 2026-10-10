"""Translates a rupee amount into a concrete, countable unit of UPAY's work.

These per-unit costs are an illustrative model (same spirit as the pitch deck's
own cost estimates), not figures sourced from UPAY's actual accounts. The
number is always computed live from the real donation amount - nothing here
is a canned string per donor.
"""

CAMPAIGN_UNITS: dict[str, tuple[float, str, str]] = {
    # campaign -> (cost per unit in INR, singular unit label, plural unit label)
    "Winter Drive": (120, "winter kit", "winter kits"),
    "Open Classroom Fund": (80, "open-classroom session", "open-classroom sessions"),
    "Back to School": (300, "school supply kit", "school supply kits"),
    "Monsoon Relief": (150, "relief kit", "relief kits"),
    "General Fund": (50, "day of learning support", "days of learning support"),
}
DEFAULT_UNIT = (50, "day of learning support", "days of learning support")


def impact_for_amount(amount: float, campaign: str | None) -> dict:
    rate, singular, plural = CAMPAIGN_UNITS.get(campaign or "", DEFAULT_UNIT)
    units = max(1, int(amount // rate))
    label = singular if units == 1 else plural
    return {
        "units": units,
        "label": label,
        "rate": rate,
        "sentence": f"≈ {units} {label} funded",
    }
