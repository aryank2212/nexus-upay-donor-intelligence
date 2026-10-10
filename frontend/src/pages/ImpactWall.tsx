import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import type { ImpactWall as ImpactWallData } from '../api/types'
import { Bar as MeterBar, Card, Chip, type Tone } from '../components/ui'

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
}

function monthLabel(ym: string) {
  const [, m] = ym.split('-')
  return MONTH_LABELS[m] ?? ym
}

function formatInr(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toFixed(0)}`
}

export default function ImpactWall() {
  const [data, setData] = useState<ImpactWallData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.impactWall().then(setData).catch((e) => setError(e.message))
  }, [])

  const maxCampaign = data ? Math.max(...data.campaigns.map((c) => c.amount), 1) : 1
  const maxPersona = data ? Math.max(...data.personas.map((p) => p.count), 1) : 1
  const chartData = data ? data.monthly.map((m) => ({ month: monthLabel(m.month), amount: m.amount })) : []

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="serif flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold"
            style={{ background: 'var(--navy)', color: 'var(--accent)' }}
          >
            N
          </div>
          <span className="serif text-lg">NEXUS</span>
        </Link>
        <Link to="/login" className="btn btn-primary">
          Sign in
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-24 pt-6">
        <div className="eyebrow mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: 'var(--line)' }}>
          Public &middot; updates live &middot; no donor names or contact details shown
        </div>
        <h1 className="serif text-4xl">The Impact Wall</h1>
        <p className="muted mt-3 max-w-xl text-base leading-relaxed">
          Every number here is a real aggregate pulled straight from NEXUS's reconciled gifts —
          not a projection, not a mock-up.
        </p>

        {error && (
          <div className="mt-6 text-sm" style={{ color: 'var(--blush-ink)' }}>
            {error}
          </div>
        )}

        {!data ? (
          <div className="dim mt-10">Loading live data...</div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Donors" value={data.total_donors.toLocaleString()} />
              <StatTile label="Gifts reconciled" value={data.total_donations.toLocaleString()} />
              <StatTile label="Total raised" value={formatInr(data.total_amount)} />
              <StatTile
                label="Illustrative impact"
                value={data.total_units.toLocaleString()}
                sub={data.total_unit_label}
                accent
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card pad>
                <h2 className="serif text-base">Giving by month</h2>
                <div className="dim mt-0.5 text-xs">Last 6 months, reconciled gifts</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line-soft)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 12 }} tickFormatter={formatInr} width={46} />
                    <Tooltip
                      cursor={{ fill: 'var(--surface-2)' }}
                      formatter={(v) => [formatInr(Number(v)), 'Raised']}
                      contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                    <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card pad>
                <h2 className="serif text-base">Where it went</h2>
                <div className="dim mt-0.5 text-xs">By campaign, with the same unit-cost model used across NEXUS</div>
                <div className="mt-4 space-y-3.5">
                  {data.campaigns.map((c) => (
                    <div key={c.campaign}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.campaign}</span>
                        <span className="dim">{formatInr(c.amount)}</span>
                      </div>
                      <div className="mt-1.5">
                        <MeterBar value={c.amount / maxCampaign} tone="var(--accent)" />
                      </div>
                      <div className="dim mt-1 text-xs">
                        ≈ {c.units.toLocaleString()} {c.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card pad className="mt-5">
              <h2 className="serif text-base">Who's giving</h2>
              <div className="dim mt-0.5 text-xs">
                Behavioural personas, computed from real giving patterns &mdash; no PII, just counts.
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.personas.map((p) => (
                  <div key={p.key} className="flex items-center gap-3">
                    <Chip tone={p.tone as Tone}>{p.label}</Chip>
                    <div className="flex-1">
                      <MeterBar value={p.count / maxPersona} tone={`var(--${p.tone}-line)`} />
                    </div>
                    <span className="num dim w-8 text-right text-xs">{p.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <p className="faint mt-6 text-xs leading-relaxed">
              Per-kit and per-session costs are an illustrative model for translating rupees into
              countable impact, in the same spirit as the project's own cost estimates — they are
              not sourced from UPAY's audited accounts.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="card card-pad">
      <div className="eyebrow">{label}</div>
      <div className="serif num mt-2 text-2xl" style={accent ? { color: 'var(--accent-strong)' } : undefined}>
        {value}
      </div>
      {sub && <div className="dim mt-0.5 text-xs">{sub}</div>}
    </div>
  )
}
