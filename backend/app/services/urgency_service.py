"""Ranks lapsing donors by how urgent re-engagement is, instead of just
counting them. A donor who gave five times and then went quiet is a bigger
loss than someone who gave once and never came back - the score reflects
that, computed from real donation history each time it's requested.
"""

import math
from datetime import date

from app import models


def rank_at_risk(donors_with_donations: list[tuple[models.Donor, list[models.Donation]]], today: date | None = None) -> list[dict]:
    today = today or date.today()
    ranked = []

    for donor, donations in donors_with_donations:
        reconciled = [d for d in donations if d.status == models.DonationStatus.reconciled]
        if not reconciled:
            continue
        reconciled.sort(key=lambda d: d.txn_date)
        last_gift = reconciled[-1].txn_date
        days_since = (today - last_gift).days
        if days_since <= 90:
            continue

        count = len(reconciled)
        total = sum(float(d.amount) for d in reconciled)
        # More history + more value lost to silence => more urgent to win back.
        score = days_since * math.log(1 + count) * math.log(1 + total / 1000)

        ranked.append(
            {
                "donor_id": donor.id,
                "donor_name": donor.display_name,
                "days_since_last_gift": days_since,
                "donation_count": count,
                "total_given": round(total, 2),
                "last_campaign": reconciled[-1].campaign,
                "urgency_score": round(score, 1),
            }
        )

    ranked.sort(key=lambda r: r["urgency_score"], reverse=True)
    return ranked
