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
import type { Anomaly, AtRiskDonor, DashboardData, ImpactWall } from '../api/types'
import {
  IcAlertTriangle,
  IcAnomaly,
  IcCalendar,
  IcHeartHand,
  IcHeartPulse,
  IcUsers,
} from '../components/Icons'
import { Card, Chip, Kpi, PageHead } from '../components/ui'

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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null)
  const [atRisk, setAtRisk] = useState<AtRiskDonor[] | null>(null)
  const [impact, setImpact] = useState<ImpactWall | null>(null)

  const load = () => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
    api.anomalies().then(setAnomalies).catch(() => {})
    api.atRisk(4).then(setAtRisk).catch(() => {})
    api.impactWall().then(setImpact).catch(() => {})
  }

  useEffect(load, [])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!data) return <div className="dim">Loading dashboard...</div>

  const chartData = data.monthly.map((m) => ({ month: monthLabel(m.month), amount: m.amount }))

  return (
    <div>
      <PageHead eyebrow="Fundraising health" title="Dashboard" lead="Everything the team checks first thing in the morning." />

      <div className="enter-list grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi
          index={0}
          icon={<IcUsers size={16} />}
          label="Total donors"
          value={data.total_donors.toLocaleString()}
          tone="sky"
        />
        <Kpi
          index={1}
          icon={<IcHeartPulse size={16} />}
          label="Retention rate"
          value={`${data.retention_rate}%`}
          sub="gave more than once"
          tone="sage"
        />
        <Kpi
          index={2}
          icon={<IcCalendar size={16} />}
          label="Recurring donors"
          value={data.recurring_count.toLocaleString()}
          sub="active in 2+ months"
          tone="lilac"
        />
        <Kpi
          index={3}
          icon={<IcAlertTriangle size={16} />}
          label="At risk"
          value={data.at_risk_count.toLocaleString()}
          sub="no gift in 90+ days"
          tone="amber"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card pad className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="serif text-base">Donations by month</h2>
              <div className="dim mt-0.5 text-xs">Reconciled gifts, last 6 months</div>
            </div>
            <div className="text-right">
              <div className="serif num text-lg">{formatInr(data.total_amount)}</div>
              <div className="dim text-xs">total reconciled</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line-soft)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--ink-3)', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--ink-3)', fontSize: 12 }}
                tickFormatter={(v) => formatInr(v)}
                width={48}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                formatter={(v) => [formatInr(Number(v)), 'Donations']}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  boxShadow: 'var(--sh-2)',
                }}
              />
              <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="flex flex-col gap-4">
          <Card pad lift>
            <h2 className="serif text-base">Needs your review</h2>
            <div className="serif num mt-2.5 text-3xl">{data.pending_review_count}</div>
            <p className="dim mt-1.5 text-xs leading-relaxed">
              Possible duplicates, unmatched bank credits, and bad imports waiting on staff.
            </p>
            <Link
              to="/app/review-queue"
              className="mt-3.5 inline-block text-sm font-semibold"
              style={{ color: 'var(--accent-strong)' }}
            >
              Open review queue &rarr;
            </Link>
          </Card>
          <Card pad lift>
            <h2 className="serif text-base">AI drafts waiting</h2>
            <div className="serif num mt-2.5 text-3xl">{data.pending_drafts_count}</div>
            <p className="dim mt-1.5 text-xs leading-relaxed">
              Thank-yous and updates drafted from verified records, awaiting approval.
            </p>
            <Link
              to="/app/copilot"
              className="mt-3.5 inline-block text-sm font-semibold"
              style={{ color: 'var(--accent-strong)' }}
            >
              Open AI Copilot &rarr;
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card pad>
          <div className="flex items-center justify-between">
            <h2 className="serif text-base">Who to re-engage</h2>
            <Link to="/app/donors" className="text-xs font-semibold" style={{ color: 'var(--accent-strong)' }}>
              All donors &rarr;
            </Link>
          </div>
          <p className="dim mt-1 text-xs">
            Ranked by urgency — history and value lost to silence, not just days.
          </p>
          {atRisk === null ? (
            <div className="dim mt-4 text-sm">Loading...</div>
          ) : atRisk.length === 0 ? (
            <div className="dim mt-4 text-sm">No one urgent right now.</div>
          ) : (
            <div className="mt-3 space-y-1.5">
              {atRisk.map((r) => (
                <Link
                  key={r.donor_id}
                  to={`/app/donors/${r.donor_id}`}
                  className="flex items-center justify-between rounded-xl border px-3 py-2.5 hover:bg-[var(--surface-2)]"
                  style={{ borderColor: 'var(--line-soft)' }}
                >
                  <div>
                    <div className="text-sm font-semibold">{r.donor_name}</div>
                    <div className="dim text-xs">
                      {r.donation_count} gift{r.donation_count !== 1 ? 's' : ''} &middot; silent{' '}
                      {r.days_since_last_gift}d &middot; last: {r.last_campaign ?? 'General Fund'}
                    </div>
                  </div>
                  <Chip tone="amber">score {r.urgency_score}</Chip>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card pad>
          <div className="flex items-center gap-2">
            <span className="kpi-ic" style={{ background: 'var(--clay-bg)', color: 'var(--clay-ink)' }}>
              <IcAnomaly size={15} />
            </span>
            <h2 className="serif text-base">Anomalies</h2>
          </div>
          <p className="dim mt-1 text-xs">Patterns worth a second look, scanned fresh each visit.</p>
          {anomalies === null ? (
            <div className="dim mt-4 text-sm">Loading...</div>
          ) : anomalies.length === 0 ? (
            <div className="mt-4 text-sm" style={{ color: 'var(--sage-ink)' }}>
              All clear — nothing unusual detected.
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              {anomalies.map((a, i) => (
                <div key={i} className="rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--clay-line)', background: 'var(--clay-bg)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--clay-ink)' }}>
                    {a.title}
                  </div>
                  <div className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--clay-ink)' }}>
                    {a.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card pad className="mt-5">
        <div className="flex items-center gap-2">
          <span className="kpi-ic" style={{ background: 'var(--sage-bg)', color: 'var(--sage-ink)' }}>
            <IcHeartHand size={15} />
          </span>
          <h2 className="serif text-base">Total reconciled donations</h2>
        </div>
        <p className="muted mt-2 text-sm">
          {data.total_donations.toLocaleString()} gifts reconciled across Razorpay, bank
          statements, and manual sheets &mdash; one clean record per donor.
          {impact && (
            <>
              {' '}That's <strong>≈ {impact.total_units.toLocaleString()} {impact.total_unit_label}</strong> funded,
              by the same illustrative unit-cost model used throughout NEXUS.
            </>
          )}
        </p>
      </Card>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card card-pad" style={{ borderColor: 'var(--blush-line)', background: 'var(--blush-bg)' }}>
      <div className="font-semibold" style={{ color: 'var(--blush-ink)' }}>
        Could not load data
      </div>
      <div className="mt-1 text-sm" style={{ color: 'var(--blush-ink)' }}>
        {message}
      </div>
      <button onClick={onRetry} className="btn btn-primary btn-sm mt-3">
        Retry
      </button>
    </div>
  )
}
