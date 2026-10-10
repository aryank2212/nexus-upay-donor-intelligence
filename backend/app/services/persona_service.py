"""Classifies a donor's giving pattern from their real, reconciled donation
history. Every label is derived from actual rows in the database - there is
no random or placeholder assignment.
"""

from collections import Counter
from datetime import date
from statistics import pstdev

from app import models

PERSONAS = {
    "new_supporter": ("New Supporter", "sky", "One gift so far, within the last month"),
    "one_time": ("One-Time Giver", "slate", "A single gift, a while back"),
    "steady_monthly": ("Steady Monthly", "sage", "Gives on a regular, predictable rhythm"),
    "crisis_responder": ("Crisis Responder", "clay", "Gives in response to a specific appeal"),
    "champion": ("Champion", "lilac", "Among the largest cumulative givers"),
    "lapsing": ("Lapsing", "amber", "Used to give regularly; it's been 90+ days"),
    "regular": ("Regular Supporter", "sky", "Gives more than once, no single strong pattern"),
}

CRISIS_CAMPAIGNS = {"Monsoon Relief", "Winter Drive"}


def classify(donations: list[models.Donation], champion_threshold: float, today: date | None = None) -> dict:
    today = today or date.today()
    reconciled = [d for d in donations if d.status == models.DonationStatus.reconciled]

    if not reconciled:
        key = "new_supporter" if donations else "new_supporter"
        label, tone, blurb = PERSONAS[key]
        return {"key": key, "label": label, "tone": tone, "blurb": blurb}

    reconciled.sort(key=lambda d: d.txn_date)
    count = len(reconciled)
    total = sum(float(d.amount) for d in reconciled)
    last_gift = reconciled[-1].txn_date
    days_since_last = (today - last_gift).days
    months = {(d.txn_date.year, d.txn_date.month) for d in reconciled}
    campaigns = Counter(d.campaign for d in reconciled if d.campaign)

    key: str
    if count == 1 and days_since_last <= 30:
        key = "new_supporter"
    elif total >= champion_threshold and count >= 2:
        key = "champion"
    elif days_since_last > 90:
        key = "lapsing"
    elif count == 1:
        key = "one_time"
    elif campaigns and campaigns.most_common(1)[0][0] in CRISIS_CAMPAIGNS and (
        campaigns.most_common(1)[0][1] / count >= 0.6
    ):
        key = "crisis_responder"
    elif len(months) >= 3:
        gaps = []
        dates = sorted(d.txn_date for d in reconciled)
        for a, b in zip(dates, dates[1:]):
            gaps.append((b - a).days)
        if gaps and pstdev(gaps) < (sum(gaps) / len(gaps)) * 0.6:
            key = "steady_monthly"
        else:
            key = "regular"
    else:
        key = "regular"

    label, tone, blurb = PERSONAS[key]
    return {"key": key, "label": label, "tone": tone, "blurb": blurb}
