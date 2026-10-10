import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useEffect, useState, type CSSProperties } from 'react'
import { api } from '../api/client'
import type { ReviewItem } from '../api/types'
import { IcAlertTriangle, IcCopy, IcFileWarning, IcSwipe } from '../components/Icons'
import { Card, Chip, Empty, PageHead, type Tone } from '../components/ui'

const TYPE_META: Record<
  ReviewItem['type'],
  { label: string; tone: Tone; icon: typeof IcCopy; primary: { action: string; label: string }; secondary?: { action: string; label: string } }
> = {
  possible_duplicate: {
    label: 'Possible duplicate',
    tone: 'amber',
    icon: IcCopy,
    primary: { action: 'merge', label: 'Merge' },
    secondary: { action: 'not_same', label: 'Not same' },
  },
  unmatched_bank_credit: {
    label: 'Unmatched bank credit',
    tone: 'clay',
    icon: IcAlertTriangle,
    primary: { action: 'resolved', label: 'Resolve' },
  },
  import_error: {
    label: 'Import needs fixing',
    tone: 'sky',
    icon: IcFileWarning,
    primary: { action: 'fixed', label: 'Fix rows' },
  },
}

const SWIPE_THRESHOLD = 120

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
        <>
          <div className="dim mb-3 flex items-center gap-1.5 text-xs">
            <IcSwipe size={13} />
            Drag a card right to confirm, left to dismiss — or just use the buttons.
          </div>
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
        </>
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
  const x = useMotionValue(0)
  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (busy) return
    if (info.offset.x >= SWIPE_THRESHOLD) {
      onResolve(meta.primary.action)
    } else if (meta.secondary && info.offset.x <= -SWIPE_THRESHOLD) {
      onResolve(meta.secondary.action)
    }
  }

  return (
    <div className="relative" style={{ ['--i' as string]: index } as CSSProperties}>
      <motion.div
        className="absolute inset-0 flex items-center justify-end rounded-[var(--r)] pr-6 text-sm font-semibold"
        style={{ opacity: rightOpacity, background: 'var(--sage-bg)', color: 'var(--sage-ink)' }}
      >
        {meta.primary.label} &rarr;
      </motion.div>
      {meta.secondary && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start rounded-[var(--r)] pl-6 text-sm font-semibold"
          style={{ opacity: leftOpacity, background: 'var(--clay-bg)', color: 'var(--clay-ink)' }}
        >
          &larr; {meta.secondary.label}
        </motion.div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.75}
        style={{ x }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.015, boxShadow: 'var(--sh-pop)' }}
        className="relative"
      >
        <Card pad lift className="flex items-start justify-between gap-4" style={{ cursor: busy ? 'default' : 'grab' }}>
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
            {meta.secondary && (
              <button className="btn" disabled={busy} onClick={() => onResolve(meta.secondary!.action)}>
                {busy ? '...' : meta.secondary.label}
              </button>
            )}
            <button className="btn btn-primary" disabled={busy} onClick={() => onResolve(meta.primary.action)}>
              {busy ? '...' : meta.primary.label}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
