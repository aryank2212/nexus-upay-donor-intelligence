"""Lightweight anomaly detection over real donor/donation rows.

Nothing here is pre-canned - each check runs a real query against the
current database state and returns only what it actually finds.
"""

from collections import defaultdict
from datetime import timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models


def shared_contact_anomalies(db: Session) -> list[dict]:
    """Two distinct active donors sharing the same phone or email usually means
    either a missed dedupe merge, or one contact method genuinely used by more
    than one person (a family phone, a shared office line)."""
    findings: list[dict] = []

    for field, col in (("phone", models.Donor.primary_phone), ("email", models.Donor.primary_email)):
        rows = (
            db.query(col, func.count(models.Donor.id))
            .filter(models.Donor.status == models.DonorStatus.active, col.is_not(None), col != "")
            .group_by(col)
            .having(func.count(models.Donor.id) > 1)
            .all()
        )
        for value, cnt in rows:
            donors = (
                db.query(models.Donor)
                .filter(col == value, models.Donor.status == models.DonorStatus.active)
                .all()
            )
            findings.append(
                {
                    "type": "shared_contact",
                    "field": field,
                    "value": value,
                    "donor_ids": [d.id for d in donors],
                    "donor_names": [d.display_name for d in donors],
                    "title": f"{cnt} donors share the same {field}",
                    "description": (
                        f'"{value}" is on file for {", ".join(d.display_name for d in donors)}. '
                        "Worth checking whether this is one person under two identities, or a "
                        "genuinely shared contact."
                    ),
                }
            )
    return findings


def rapid_fire_anomalies(db: Session, window_hours: int = 48, min_count: int = 3) -> list[dict]:
    """A donor with an unusually tight burst of gifts - more often a data-entry
    duplicate than real giving behaviour."""
    findings: list[dict] = []
    donations = (
        db.query(models.Donation)
        .filter(models.Donation.status == models.DonationStatus.reconciled)
        .order_by(models.Donation.donor_id, models.Donation.txn_date)
        .all()
    )
    by_donor: dict[int, list[models.Donation]] = defaultdict(list)
    for d in donations:
        by_donor[d.donor_id].append(d)

    window = timedelta(hours=window_hours)
    for donor_id, gifts in by_donor.items():
        gifts = sorted(gifts, key=lambda g: g.txn_date)
        for i in range(len(gifts) - min_count + 1):
            cluster = gifts[i : i + min_count]
            span = cluster[-1].txn_date - cluster[0].txn_date
            if span <= window:
                donor = db.get(models.Donor, donor_id)
                if not donor:
                    continue
                findings.append(
                    {
                        "type": "rapid_fire",
                        "donor_id": donor_id,
                        "donor_name": donor.display_name,
                        "count": len(cluster),
                        "title": f"{donor.display_name}: {len(cluster)} gifts in {window_hours}h",
                        "description": (
                            f"{len(cluster)} reconciled gifts from {donor.display_name} landed within "
                            f"a {window_hours}-hour window — worth a quick sanity check before reporting."
                        ),
                    }
                )
                break
    return findings


def conflicting_identity_anomalies(db: Session) -> list[dict]:
    """A donor merged via name-similarity (not an exact email/phone match)
    whose linked records actually carry two different phone numbers or
    emails - worth a second look at whether that merge was correct."""
    findings: list[dict] = []
    donors = (
        db.query(models.Donor)
        .filter(models.Donor.status == models.DonorStatus.active)
        .all()
    )
    for donor in donors:
        if len(donor.aliases) < 2:
            continue
        phones = {a.phone for a in donor.aliases if a.phone}
        emails = {a.email for a in donor.aliases if a.email}
        conflicts = []
        if len(phones) > 1:
            conflicts.append(f"phones {', '.join(sorted(phones))}")
        if len(emails) > 1:
            conflicts.append(f"emails {', '.join(sorted(emails))}")
        if conflicts:
            findings.append(
                {
                    "type": "conflicting_identity",
                    "donor_id": donor.id,
                    "donor_name": donor.display_name,
                    "title": f"{donor.display_name}: merged records disagree",
                    "description": (
                        f'"{donor.display_name}" combines records with different '
                        f"{' and '.join(conflicts)} — worth confirming this merge was correct."
                    ),
                }
            )
    return findings


def scan(db: Session) -> list[dict]:
    return (
        shared_contact_anomalies(db)
        + rapid_fire_anomalies(db)
        + conflicting_identity_anomalies(db)
    )
