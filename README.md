# NEXUS — From fragmented donations to intelligent fundraising

**Samadhan 2026-27 · Track 2: Tech-Enabled Impact Solutions · Team 4RottenRats**

NEXUS is a prototype donor & donation management layer for UPAY NGO. It ingests messy
donor data from Razorpay, bank statements, and manual spreadsheets, builds one verified
donor identity across sources, reconciles payments to gifts, and gives the fundraising
team a dashboard, a review queue for anything uncertain, and an AI Copilot that drafts
thank-yous grounded only in verified records — nothing sends without a human approving it.
A public landing page explains the pitch; the console itself sits behind a real login.

This repo is the working prototype behind the pitch deck (`Samadhan_4RottenRats.pptx`).

## Architecture

```
┌─────────────┐      ┌──────────────────────────────────────────┐      ┌────────────┐
│  CSV inputs │ ───▶ │  FastAPI backend (PostgreSQL)              │ ───▶ │  React UI  │
│  Razorpay   │      │                                            │      │  Landing   │
│  Bank stmt  │      │  Auth → Ingest → Dedupe → Reconcile         │      │  Login     │
│  UPAY sheet │      │  Review Queue ← uncertain cases             │      │  Dashboard │
└─────────────┘      │  AI Copilot → grounded drafts               │      │  Review Q. │
                      └──────────────────────────────────────────┘      │  Copilot   │
                                                                          │  Donors    │
                                                                          └────────────┘
```

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL. `rapidfuzz` powers donor-identity
  matching; a deterministic, grounded-template AI Copilot ships by default so the demo
  runs fully offline, with an optional real LLM call (Anthropic) if `ANTHROPIC_API_KEY`
  is set. Auth is real: bcrypt-hashed passwords, signed opaque session tokens stored
  server-side (so logout genuinely revokes them), and every data route requires a valid
  session.
- **Frontend:** React + TypeScript + Vite + Tailwind + Recharts + Framer Motion.
- **Data model:** `User` / `Session` (real auth) · `Donor` (canonical identity) ←
  `DonorAlias` (raw name/email/phone seen per source) · `ImportBatch` / `RawRecord`
  (staging area for uploads) · `Donation` (the reconciled gift, can absorb RawRecords
  from multiple sources) · `ReviewItem` (possible-duplicate / unmatched-bank-credit /
  bad-import) · `Draft` (AI Copilot + automation log — nothing sends unapproved) ·
  `ContactMessage` (real submissions from the public landing page).

### The pipeline

1. **Ingest** — a CSV is parsed and normalized (case, phone format, email).
2. **Dedupe** — exact email/phone match wins outright; a close-but-not-exact name match
   is sent to the Review Queue instead of guessing; a reference/amount/date match against
   an already-known transaction (e.g. a bank narration corroborating a Razorpay payment)
   resolves identity with more confidence than a name fragment alone.
3. **Reconcile** — payments are matched to donations by amount, date window, and
   reference-token overlap. An unmatched bank credit becomes a review item rather than a
   guess.
4. **Donor 360** — every donor's merged identity, aliases by source, and full donation
   history.
5. **Automation** — the moment a donation reconciles, a thank-you draft is queued for
   staff approval (never sent automatically).

## Prerequisites

- Docker (for PostgreSQL)
- Python 3.13+ and Node 20+

## Running it

**1. Start Postgres**

```bash
docker compose up -d postgres
```

**2. Backend**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optional: add ANTHROPIC_API_KEY to enable live LLM drafts
uvicorn app.main:app --reload --port 8000
```

On first boot the backend seeds one real account so the login screen isn't a dead end:
username `staff`, password `upay2026`. Anyone can also create their own account from the
login page — registration is a genuine, working signup, not a mock-up.

**3. Frontend** (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on `:8000`.

**4. Load the demo data**

Sign in, then click **Load demo data** on the Import page (or `POST /api/seed/demo`,
authenticated). This imports the three sample CSVs in `backend/app/seed_data/` — ~64 rows
across Razorpay, bank, and sheet sources — in the order a real pipeline would see them,
producing ~34 donors, several multi-source reconciliations, a possible-duplicate case, two
unmatched bank credits, and an import with bad phone numbers, so every screen has
something real to show. **Reset all data** clears the donor/donation tables back to empty
(it does not touch accounts or contact messages).

## Demo script (maps to the pitch deck)

0. **Landing page** (`/`) → the pitch, live counts pulled from `/api/public/stats` (no
   fabricated numbers), and a real contact form that writes to the database.
1. **Sign in** (`/login`) → use the seeded `staff` / `upay2026` account, or register a
   fresh one — both are real, working auth against the FastAPI backend.
2. **Import Data** → Load demo data. Watch the three batches land, including the sheet
   import flagging "3 rows: invalid phone number."
3. **Donors** → search "Nikhil" → open his Donor 360. One donor, ₹1,000 reconciled,
   **matched from 3 records** — Razorpay (full identity), the UPAY sheet ("N. Kumar",
   phone match), and the bank statement ("NIKHIL K", matched by reference + amount +
   date). This is the exact "messy data in, clean donor out" story from the deck.
4. **Review Queue** → four open items: two unmatched bank credits, one bad import, and
   "Deepak Verma" vs "Deepak Sharma" flagged as a possible duplicate (80% name
   similarity) — **Merge** or **Not same**, staff decides, the system never guesses.
5. **AI Copilot** → thank-you drafts waiting, each citing its sources (donor profile,
   donation record, campaign data). **Approve and send** on one. Use **+ Draft a
   message** to generate an on-demand thank-you or programme update for any donor.
6. **Dashboard** → total donors, retention rate, recurring vs. at-risk segments, and
   monthly giving — the fundraising health view staff would check every morning.

## Project layout

```
backend/
  app/
    models.py           SQLAlchemy models (incl. User, Session, ContactMessage)
    schemas.py           Pydantic response/request models
    services/
      auth_service.py      password hashing + opaque session tokens
      normalize.py          name/email/phone/amount cleanup
      dedupe_service.py     identity matching (exact + fuzzy + transaction corroboration)
      reconcile_service.py  payment ↔ donation matching
      copilot_service.py    grounded draft generation (template + optional LLM)
      import_service.py     CSV parsing orchestration
    routers/              REST API endpoints (auth, contact, public, + the app's own)
    seed_data/             demo CSVs
    seed.py                 demo loader + reset + demo-user bootstrap
frontend/
  src/
    api/                   typed fetch client (attaches the session token, handles 401)
    auth/                  AuthContext + ProtectedRoute
    components/
      blocks/                 landing-page sections adapted from Aceternity UI:
                               TextGenerateEffect, LogoCloud, FAQAccordion,
                               ContactSection, CTASection
      AppShell.tsx             hover-expand sidebar (Aceternity "Sidebars" pattern)
      ui.tsx                   Card / Chip / Kpi / PageHead design-system primitives
    pages/
      Landing.tsx              public marketing page
      Auth.tsx                 login / signup (Aceternity signup-form pattern)
      Dashboard, ReviewQueue, Copilot, Donors, DonorDetail, Import   the console
docker-compose.yml        PostgreSQL for local dev
```

### Where the Aceternity UI blocks ended up

The brief named eight specific Aceternity blocks. Each has a genuine, working home:

| Block | Where |
|---|---|
| Text animations | `TextGenerateEffect` — the landing page hero headline |
| Logo clouds | `LogoCloud` — infinite marquee of the systems NEXUS reads from (rendered as wordmarks, not copied trademark art, since NEXUS has no affiliation with these companies) |
| CTA sections | `CTASection` — landing page, links to sign-in |
| FAQs | `FAQAccordion` — real, accurate Q&A about the product, not placeholder copy |
| Contact sections | `ContactSection` — a real form that `POST`s to `/api/contact` and is readable back out of Postgres |
| Login and signup sections / Signup form | `Auth.tsx` — real bcrypt-hashed accounts, real sessions, the Aceternity "bottom gradient" button and labeled-input styling |
| Sidebars | `AppShell.tsx` — the console's hover-to-expand rail, plus a real mobile drawer |

## Notes on scope

This is a regional-round prototype, not a production system — per the brief, it
demonstrates the core idea and doesn't need to be market-ready. Session tokens are
opaque, server-verified strings (not JWTs) stored in `localStorage`, which is standard
for an SPA prototype but would move to an httpOnly cookie in a production hardening pass.
Matching thresholds are tuned against the demo data rather than exhaustively validated
against real UPAY records, which the roadmap addresses in weeks 1–2 (get sample data from
UPAY, re-tune thresholds).
