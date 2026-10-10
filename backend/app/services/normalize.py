import re


def normalize_name(raw: str | None) -> str | None:
    if not raw:
        return None
    cleaned = re.sub(r"\s+", " ", raw.strip())
    return cleaned.title() if cleaned else None


def normalize_email(raw: str | None) -> str | None:
    if not raw:
        return None
    cleaned = raw.strip().lower()
    return cleaned or None


def normalize_phone(raw: str | None) -> str | None:
    """Keep only digits, drop a leading country code (91) if present, keep last 10 digits."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    if len(digits) > 10:
        digits = digits[-10:]
    return digits


def normalize_amount(raw: str | None) -> float | None:
    if raw is None or raw == "":
        return None
    cleaned = re.sub(r"[₹,\s]", "", str(raw))
    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_reference_tokens(raw: str | None) -> set[str]:
    """Pull out numeric/alphanumeric tokens from a reference string for fuzzy overlap checks.

    e.g. "pay_98231" -> {"98231"}, "UPI/98231/RAHUL S" -> {"98231", "RAHUL", "S"}
    """
    if not raw:
        return set()
    tokens = re.split(r"[^A-Za-z0-9]+", raw.upper())
    return {t for t in tokens if len(t) >= 3}
