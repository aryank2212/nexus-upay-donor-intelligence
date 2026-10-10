import { useEffect, useState, type CSSProperties } from 'react'
import { api } from '../api/client'
import type { ReviewItem } from '../api/types'
import { IcAlertTriangle, IcCopy, IcFileWarning } from '../components/Icons'
import { Card, Chip, Empty, PageHead, type Tone } from '../components/ui'

const TYPE_META: Record<ReviewItem['type'], { label: string; tone: Tone; icon: typeof IcCopy }> = {
  possible_duplicate: { label: 'Possible duplicate', tone: 'amber', icon: IcCopy },
  unmatched_bank_credit: { label: 'Unmatched bank credit', tone: 'clay', icon: IcAlertTriangle },
  import_error: { label: 'Import needs fixing', tone: 'sky', icon: IcFileWarning },
}

export default function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[] | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    api
      .reviewQueue()
      .then(setItems)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [])

  const resolve = async (id: number, action: string) => {
    setBusyId(id)
    setError(null)
    try {
      await api.resolveReviewItem(id, action)
      setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Human in the loop"
        title="Review Queue"
        lead="Staff resolve only what's unclear — the system never guesses."
      />

      {error && (
        <div
          className="card card-pad mb-4 text-sm"
          style={{ borderColor: 'var(--blush-line)', background: 'var(--blush-bg)', color: 'var(--blush-ink)' }}
        >
          {error}
        </div>
      )}

      {items === null ? (
        <div className="dim">Loading...</div>
      ) : items.length === 0 ? (
        <Empty>Nothing needs your review right now.</Empty>
      ) : (
        <div className="enter-list space-y-3">
          {items.map((item, i) => (
            <ReviewCard
              key={item.id}
              item={item}
              index={i}
              busy={busyId === item.id}
              onResolve={(action) => resolve(item.id, action)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({
  item,
  index,
  busy,
  onResolve,
}: {
  item: ReviewItem
  index: number
  busy: boolean
  onResolve: (action: string) => void
}) {
  const meta = TYPE_META[item.type]
  const Icon = meta.icon
  return (
    <Card pad lift className="flex items-start justify-between gap-4" style={{ ['--i' as string]: index } as CSSProperties}>
      <div className="flex min-w-0 gap-3.5">
        <span
          className="kpi-ic mt-0.5"
          style={{ background: `var(--${meta.tone}-bg)`, color: `var(--${meta.tone}-ink)` }}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <Chip tone={meta.tone}>{meta.label}</Chip>
          <div className="mt-2 text-base font-semibold">{item.title}</div>
          <p className="dim mt-1 max-w-2xl text-sm leading-relaxed">{item.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {item.type === 'possible_duplicate' && (
          <>
            <button className="btn" disabled={busy} onClick={() => onResolve('not_same')}>
              {busy ? '...' : 'Not same'}
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={() => onResolve('merge')}>
              {busy ? '...' : 'Merge'}
            </button>
          </>
        )}
        {item.type === 'unmatched_bank_credit' && (
          <button className="btn btn-primary" disabled={busy} onClick={() => onResolve('resolved')}>
            {busy ? '...' : 'Resolve'}
          </button>
        )}
        {item.type === 'import_error' && (
          <button className="btn btn-primary" disabled={busy} onClick={() => onResolve('fixed')}>
            {busy ? '...' : 'Fix rows'}
          </button>
        )}
      </div>
    </Card>
  )
}
