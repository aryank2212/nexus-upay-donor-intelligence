import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { PublicStats } from '../api/types'
import { CTASection } from '../components/blocks/CTASection'
import { ContactSection } from '../components/blocks/ContactSection'
import { FAQAccordion } from '../components/blocks/FAQAccordion'
import { LogoCloud } from '../components/blocks/LogoCloud'
import { ReconciliationDemo } from '../components/blocks/ReconciliationDemo'
import { TextGenerateEffect } from '../components/blocks/TextGenerateEffect'
import {
  IcAlertTriangle,
  IcAnomaly,
  IcCrown,
  IcLink,
  IcMapPin,
  IcShieldCheck,
  IcSpark,
  IcUpload,
  IcWhatsapp,
} from '../components/Icons'

const SMART_FEATURES = [
  {
    icon: IcCrown,
    tone: 'lilac' as const,
    title: 'Donor personas',
    body: 'Every donor is classified from real giving history — Champion, Steady Monthly, Crisis Responder — not a guess.',
  },
  {
    icon: IcAnomaly,
    tone: 'clay' as const,
    title: 'Anomaly detection',
    body: 'Flags merges that disagree with themselves and unusually tight gift clusters — scanned fresh, not a one-off check.',
  },
  {
    icon: IcMapPin,
    tone: 'amber' as const,
    title: 'Who to re-engage',
    body: 'Lapsing donors ranked by real urgency — history and value lost to silence, not just a day count.',
  },
  {
    icon: IcWhatsapp,
    tone: 'sage' as const,
    title: 'WhatsApp-native drafts',
    body: 'Thank-yous route to WhatsApp when a donor has a phone on file, email otherwise — wherever the message actually gets read.',
  },
]

const FEATURES = [
  {
    icon: IcUpload,
    tone: 'sky' as const,
    title: 'Ingest',
    body: 'CSV from Razorpay, bank statements, and manual sheets — normalized on the way in.',
  },
  {
    icon: IcLink,
    tone: 'sage' as const,
    title: 'Dedupe & reconcile',
    body: 'One verified donor identity, with payments matched to gifts across every source.',
  },
  {
    icon: IcAlertTriangle,
    tone: 'amber' as const,
    title: 'Review queue',
    body: 'Uncertain matches wait for a human. The system never silently guesses.',
  },
  {
    icon: IcSpark,
    tone: 'lilac' as const,
    title: 'AI Copilot',
    body: 'Thank-yous drafted from verified records, queued for approval — never sent alone.',
  },
]

function formatInr(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toFixed(0)}`
}

export default function Landing() {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    api.publicStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div style={{ background: 'var(--paper)' }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div
            className="serif flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold"
            style={{ background: 'var(--navy)', color: 'var(--accent)' }}
          >
            N
          </div>
          <span className="serif text-lg">NEXUS</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/impact" className="btn">
            Impact Wall
          </Link>
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------ hero */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-10 text-center sm:pt-16">
        <div className="eyebrow mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: 'var(--line)' }}>
          UPAY NGO &middot; Samadhan 2026-27 &middot; Track 2
        </div>
        <TextGenerateEffect
          words="From fragmented donations to intelligent fundraising"
          className="serif text-4xl leading-tight sm:text-5xl"
          highlight={['intelligent', 'fundraising']}
          highlightClassName=""
        />
        <p className="muted mx-auto mt-5 max-w-xl text-base leading-relaxed">
          NEXUS turns donor data scattered across Razorpay, bank statements, and spreadsheets
          into one clean, reconciled view — with a human approving every message that goes out.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login" className="btn btn-accent btn-lg">
            Sign in to NEXUS
          </Link>
          <a href="#how-it-works" className="btn btn-lg">
            See how it works
          </a>
        </div>

        <div className="mx-auto mt-14 grid max-w-lg grid-cols-3 divide-x" style={{ borderColor: 'var(--line)' }}>
          <StatCell label="donors tracked" value={stats ? stats.total_donors.toLocaleString() : '—'} />
          <StatCell
            label="gifts reconciled"
            value={stats ? stats.total_donations.toLocaleString() : '—'}
          />
          <StatCell label="total reconciled" value={stats ? formatInr(stats.total_amount) : '—'} />
        </div>
        <p className="faint mt-3 text-xs">Live counts from the running demo instance.</p>
      </section>

      {/* -------------------------------------------------------- logo cloud */}
      <section className="border-y py-10" style={{ borderColor: 'var(--line-soft)' }}>
        <p className="eyebrow mb-6 text-center">Reads directly from the tools UPAY already uses</p>
        <LogoCloud />
      </section>

      {/* ---------------------------------------------------------- features */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="serif text-3xl">Messy data in, clean donor out</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-pad lift">
              <span
                className="kpi-ic"
                style={{ background: `var(--${f.tone}-bg)`, color: `var(--${f.tone}-ink)` }}
              >
                <f.icon size={16} />
              </span>
              <h3 className="serif mt-3 text-base">{f.title}</h3>
              <p className="dim mt-1.5 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- see it work */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <div className="eyebrow mb-3">Watch it happen</div>
          <h2 className="serif text-3xl">The same gift, seen three ways, made one</h2>
        </div>
        <div className="card card-pad">
          <ReconciliationDemo />
        </div>
      </section>

      {/* ------------------------------------------------------- smart layer */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mx-auto max-w-xl text-center">
          <div className="eyebrow mb-3">Beyond reconciliation</div>
          <h2 className="serif text-3xl">Smart enough to notice, not just tidy</h2>
          <p className="muted mt-3 text-sm leading-relaxed">
            Every one of these runs on real donor data already in NEXUS &mdash; nothing below is a
            mock-up.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SMART_FEATURES.map((f) => (
            <div key={f.title} className="card card-pad lift">
              <span
                className="kpi-ic"
                style={{ background: `var(--${f.tone}-bg)`, color: `var(--${f.tone}-ink)` }}
              >
                <f.icon size={16} />
              </span>
              <h3 className="serif mt-3 text-base">{f.title}</h3>
              <p className="dim mt-1.5 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/impact" className="text-sm font-semibold" style={{ color: 'var(--accent-strong)' }}>
            See the real aggregate numbers on the Impact Wall &rarr;
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <CTASection />
      </section>

      {/* --------------------------------------------------------------- faq */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-10 text-center">
          <div className="eyebrow mb-3">Questions</div>
          <h2 className="serif text-3xl">Frequently asked</h2>
        </div>
        <FAQAccordion />
      </section>

      {/* ----------------------------------------------------------- contact */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <div className="eyebrow mb-3 inline-flex items-center gap-1.5">
            <IcShieldCheck size={13} />
            Get in touch
          </div>
          <h2 className="serif text-3xl">Want to pilot this at your NGO?</h2>
          <p className="muted mx-auto mt-2 max-w-md text-sm">
            Tell us about your setup — we'll follow up.
          </p>
        </div>
        <ContactSection />
      </section>

      <footer className="border-t px-6 py-8 text-center" style={{ borderColor: 'var(--line-soft)' }}>
        <p className="dim text-xs">
          Built by Team 4RottenRats for Samadhan 2026-27, a challenge by UPAY NGO. Not an official
          UPAY product. &middot; <Link to="/impact" className="hover:underline">Impact Wall</Link>
        </p>
      </footer>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3">
      <div className="serif num text-2xl">{value}</div>
      <div className="dim mt-1 text-[11px] leading-tight">{label}</div>
    </div>
  )
}
