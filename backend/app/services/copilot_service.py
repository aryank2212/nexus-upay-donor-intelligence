from sqlalchemy.orm import Session

from app import models
from app.config import get_settings
from app.services.impact_service import impact_for_amount

settings = get_settings()


def _choose_channel(donor: models.Donor) -> models.DraftChannel:
    # WhatsApp needs a number to send to - that's the real, simple rule.
    return models.DraftChannel.whatsapp if donor.primary_phone else models.DraftChannel.email


def _template_thank_you(
    donor: models.Donor, donation: models.Donation | None, channel: models.DraftChannel
) -> tuple[str, str]:
    first_name = donor.display_name.split(" ")[0]

    if not donation:
        subject = "Thank you for supporting UPAY"
        body = (
            f"Dear {first_name},\n\n"
            "Thank you for being part of UPAY's community of supporters. Your generosity helps us "
            "bring education to underprivileged children across our learning centres.\n\n"
            "With gratitude,\nTeam UPAY"
        )
        return subject, body

    impact = impact_for_amount(float(donation.amount), donation.campaign)
    subject = f"Thank you for your {donation.campaign or 'gift'} to UPAY"

    if channel == models.DraftChannel.whatsapp:
        body = (
            f"Hi {first_name}! \U0001f64f\n\n"
            f"Your ₹{float(donation.amount):,.0f} gift to UPAY's {donation.campaign or 'ongoing work'} "
            f"just came through — {impact['sentence']}.\n\n"
            "Thank you for being part of this. – Team UPAY"
        )
    else:
        body = (
            f"Dear {first_name},\n\n"
            f"Thank you for your generous contribution of ₹{float(donation.amount):,.0f} "
            f"to UPAY's {donation.campaign or 'ongoing work'} on "
            f"{donation.txn_date.strftime('%d %b %Y')}. That's {impact['sentence']} — your "
            "support helps keep our open classrooms running and gives children in slum and street "
            "communities a place to learn.\n\n"
            "With gratitude,\nTeam UPAY"
        )
    return subject, body


def _template_update(
    donor: models.Donor, donation: models.Donation | None, channel: models.DraftChannel
) -> tuple[str, str]:
    first_name = donor.display_name.split(" ")[0]
    campaign = donation.campaign if donation else "our programmes"
    subject = f"An update from UPAY on {campaign}"
    if channel == models.DraftChannel.whatsapp:
        body = (
            f"Hi {first_name}, quick update from UPAY — {campaign} is reaching more children "
            "than ever thanks to supporters like you. More soon! – Team UPAY"
        )
    else:
        body = (
            f"Dear {first_name},\n\n"
            f"Thanks to supporters like you, {campaign} is reaching more children than ever. "
            "We wanted to share a quick update on the impact your giving has made this term.\n\n"
            "Warmly,\nTeam UPAY"
        )
    return subject, body


def _sources_for(donor: models.Donor, donation: models.Donation | None) -> list[str]:
    sources = ["donor profile"]
    if donation:
        sources.append("donation record")
        if donation.campaign:
            sources.append("campaign data")
        sources.append("impact model")
    return sources


def _generate_with_llm(
    donor: models.Donor, donation: models.Donation | None, kind: str
) -> tuple[str, str] | None:
    if not settings.anthropic_api_key:
        return None
    try:
        import anthropic
    except ImportError:
        return None

    facts = {
        "donor_name": donor.display_name,
        "amount": float(donation.amount) if donation else None,
        "campaign": donation.campaign if donation else None,
        "date": str(donation.txn_date) if donation else None,
    }
    prompt = (
        "You are drafting a short donor communication for an NGO called UPAY. "
        "Use ONLY the facts given below - never invent amounts, dates, or names. "
        f"Kind of message: {kind}. Facts: {facts}. "
        "Respond with two lines: first line is the subject, then a blank line, then the body "
        "(under 120 words, warm but concise, signed 'Team UPAY')."
    )
    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        subject, _, body = text.partition("\n")
        return subject.strip() or f"A note for {donor.display_name}", body.strip() or text
    except Exception:
        return None


def generate_draft(
    db: Session, donor: models.Donor, donation: models.Donation | None, kind: str = "thank_you"
) -> models.Draft:
    channel = _choose_channel(donor)
    llm_result = _generate_with_llm(donor, donation, kind)
    if llm_result:
        subject, body = llm_result
        generated_by = "llm"
    else:
        template_fn = _template_update if kind == "update" else _template_thank_you
        subject, body = template_fn(donor, donation, channel)
        generated_by = "template"

    draft = models.Draft(
        donor_id=donor.id,
        donation_id=donation.id if donation else None,
        kind=models.DraftKind(kind),
        channel=channel,
        status=models.DraftStatus.draft,
        subject=subject,
        body=body,
        sources=_sources_for(donor, donation),
        generated_by=generated_by,
    )
    db.add(draft)
    db.flush()

    if donation:
        donation.acknowledgement_status = models.AckStatus.queued

    return draft
