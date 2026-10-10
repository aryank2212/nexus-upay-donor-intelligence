import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { DonorDetail as DonorDetailType } from '../api/types'
import { Card, Chip, type Tone } from '../components/ui'

function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

const DONATION_TONE: Record<string, Tone> = {
  reconciled: 'sage',
  pending_review: 'amber',
}

const ACK_TONE: Record<string, Tone | undefined> = {
  none: undefined,
  queued: 'amber',
  sent: 'sage',
}

export default function DonorDetail() {
  const { id } = useParams<{ id: string }>()
  const [donor, setDonor] = useState<DonorDetailType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .donor(Number(id))
      .then(setDonor)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <div style={{ color: 'var(--blush-ink)' }}>{error}</div>
  if (!donor) return <div className="dim">Loading...</div>

  return (
    <div>
      <Link to="/app/donors" className="dim mb-4 inline-block text-sm hover:underline">
        &larr; Back to donors
      </Link>

      <Card pad>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="serif">{donor.display_name}</h1>
              <Chip tone={donor.persona.tone as Tone}>{donor.persona.label}</Chip>
            </div>
            <p className="dim text-xs">{donor.persona.blurb}</p>
            <div className="dim mt-1.5 flex flex-wrap gap-4 text-sm">
              <span>{donor.primary_email ?? 'no email on file'}</span>
              <span>{donor.primary_phone ?? 'no phone on file'}</span>
            </div>
          </div>
          <Chip tone="sage">{donor.status}</Chip>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-5 border-t pt-5 sm:grid-cols-3" style={{ borderColor: 'var(--line-soft)' }}>
          <div>
            <div className="eyebrow">Total given</div>
            <div className="serif num mt-1 text-xl">{formatInr(donor.total_given)}</div>
          </div>
          <div>
            <div className="eyebrow">Donations</div>
            <div className="serif num mt-1 text-xl">{donor.donation_count}</div>
          </div>
          <div>
            <div className="eyebrow">Identity matched from</div>
            <div className="serif num mt-1 text-xl">
              {donor.aliases.length} record{donor.aliases.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {donor.total_impact && (
          <div className="mt-4 rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: 'var(--sage-line)', background: 'var(--sage-bg)', color: 'var(--sage-ink)' }}>
            {donor.total_impact.sentence}
          </div>
        )}
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card pad>
          <h2 className="serif mb-3 text-base">Donation history</h2>
          {donor.donations.length === 0 ? (
            <div className="dim text-sm">No donations yet.</div>
          ) : (
            <div className="space-y-2">
              {[...donor.donations]
                .sort((a, b) => b.txn_date.localeCompare(a.txn_date))
                .map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                    style={{ borderColor: 'var(--line-soft)' }}
                  >
                    <div>
                      <div className="num text-sm font-semibold">
                        {formatInr(d.amount)}{' '}
                        <span className="dim font-normal">&middot; {d.campaign ?? 'General Fund'}</span>
                      </div>
                      <div className="dim text-xs">
                        {d.txn_date} &middot; {d.source_count} source
                        {d.source_count !== 1 ? 's' : ''} matched
                      </div>
                      {d.impact && (
                        <div className="mt-1 text-xs font-medium" style={{ color: 'var(--sage-ink)' }}>
                          {d.impact.sentence}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Chip tone={DONATION_TONE[d.status]}>{d.status.replace('_', ' ')}</Chip>
                      <Chip tone={ACK_TONE[d.acknowledgement_status]}>ack: {d.acknowledgement_status}</Chip>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card pad>
          <h2 className="serif mb-3 text-base">Identity sources</h2>
          {donor.aliases.length === 0 ? (
            <div className="dim text-sm">No linked records.</div>
          ) : (
            <div className="space-y-2">
              {donor.aliases.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                  style={{ borderColor: 'var(--line-soft)' }}
                >
                  <div>
                    <div className="text-sm font-semibold">{a.name ?? '(no name)'}</div>
                    <div className="dim text-xs">{a.email ?? a.phone ?? 'no contact fragment'}</div>
                  </div>
                  <Chip tone="sky">{a.source}</Chip>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
