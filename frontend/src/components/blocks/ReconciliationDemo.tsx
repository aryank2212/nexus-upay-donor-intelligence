import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { IcCheck, IcLandmark, IcUsers } from '../Icons'

/**
 * An illustrative walkthrough of the ingest -> dedupe -> reconcile pipeline.
 * The donor and figures here are fictional, made up for this animation —
 * not a live pull from real (and potentially private) donor records, which
 * is why this lives on the public landing page while the real equivalent
 * (any actual donor's page) sits behind login.
 */
const SOURCES = [
  {
    icon: IcCheck,
    tone: 'sky' as const,
    label: 'Razorpay export',
    lines: ['Priya Mehta', 'priya.mehta@gmail.com', '₹1,500 · pay_55102'],
  },
  {
    icon: IcLandmark,
    tone: 'clay' as const,
    label: 'Bank statement',
    lines: ['UPI/55102/PRIYA M', '14 Sep · ₹1,500'],
  },
  {
    icon: IcUsers,
    tone: 'sage' as const,
    label: 'UPAY sheet',
    lines: ['P. Mehta', '98XXXXXX10 · ₹1,500', 'Winter Drive'],
  },
]

export function ReconciliationDemo() {
  const [key, setKey] = useState(0)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Chip />
        <button onClick={() => setKey((k) => k + 1)} className="btn btn-sm">
          Replay
        </button>
      </div>
      <div key={key} className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-3">
          {SOURCES.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="card card-pad flex items-start gap-3"
            >
              <span className="kpi-ic" style={{ background: `var(--${s.tone}-bg)`, color: `var(--${s.tone}-ink)` }}>
                <s.icon size={15} />
              </span>
              <div className="min-w-0">
                <div className="dim text-[11px] font-semibold uppercase tracking-wide">{s.label}</div>
                {s.lines.map((l) => (
                  <div key={l} className="truncate text-sm">
                    {l}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="hidden items-center justify-center md:flex">
          <motion.svg
            width="64"
            height="140"
            viewBox="0 0 64 140"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            {[18, 70, 122].map((y, i) => (
              <motion.path
                key={y}
                d={`M0 ${y} C 32 ${y}, 32 70, 64 70`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.75 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
              />
            ))}
          </motion.svg>
        </div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="card card-pad"
            style={{ borderColor: 'var(--sage-line)', background: 'var(--sage-bg)' }}
          >
            <div className="flex items-center gap-2">
              <span className="kpi-ic" style={{ background: 'var(--sage-mid)', color: 'var(--sage-ink)' }}>
                <IcCheck size={15} />
              </span>
              <div className="eyebrow" style={{ color: 'var(--sage-ink)' }}>
                One verified donor
              </div>
            </div>
            <div className="serif mt-2 text-lg">Priya Mehta</div>
            <div className="num mt-1 text-sm" style={{ color: 'var(--sage-ink)' }}>
              ₹1,500 reconciled · Winter Drive
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="dim mt-2 text-xs"
            >
              Matched from 3 records — same reference, amount, and date
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="faint mt-4 text-xs">
        Illustrative example with fictional data — not a real donor record. See a real one after
        signing in.
      </p>
    </div>
  )
}

function Chip() {
  return (
    <span className="eyebrow inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: 'var(--line)' }}>
      Illustrative example
    </span>
  )
}
