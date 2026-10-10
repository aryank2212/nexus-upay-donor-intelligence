import type { CSSProperties, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  pad = false,
  lift = false,
  style,
}: {
  children: ReactNode
  className?: string
  pad?: boolean
  lift?: boolean
  style?: CSSProperties
}) {
  return (
    <div className={`card ${pad ? 'card-pad' : ''} ${lift ? 'lift' : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}

export function CardHead({
  title,
  sub,
  right,
  icon,
}: {
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="card-hd">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="dim flex">{icon}</span>}
        <div className="min-w-0">
          <h3>{title}</h3>
          {sub && <div className="dim mt-0.5 text-xs">{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  )
}

const TONES = ['sage', 'amber', 'clay', 'sky', 'lilac', 'blush'] as const
export type Tone = (typeof TONES)[number]

export function Chip({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`chip ${tone ? `chip-${tone}` : ''}`}>{children}</span>
}

export function Kpi({
  icon,
  label,
  value,
  sub,
  tone = 'sky',
  index = 0,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
  index?: number
}) {
  return (
    <div className="card card-pad lift" style={{ ['--i' as string]: index }}>
      <div className="flex items-center gap-2.5">
        <span
          className="kpi-ic"
          style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-ink)` }}
        >
          {icon}
        </span>
        <div className="eyebrow">{label}</div>
      </div>
      <div className="serif num kpi-val">{value}</div>
      {sub && <div className="dim mt-1.5 text-xs">{sub}</div>}
    </div>
  )
}

export function PageHead({
  eyebrow,
  title,
  lead,
  right,
}: {
  eyebrow: string
  title: string
  lead?: ReactNode
  right?: ReactNode
}) {
  return (
    <header className="enter mb-6 flex flex-wrap items-start justify-between gap-6">
      <div className="min-w-0">
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h1 className="serif">{title}</h1>
        {lead && <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">{lead}</p>}
      </div>
      {right && <div className="flex-none">{right}</div>}
    </header>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="card card-quiet dim px-5 py-9 text-center text-sm">{children}</div>
  )
}

export function Bar({ value, tone = 'var(--accent)', height = 7 }: { value: number; tone?: string; height?: number }) {
  return (
    <div className="bar-track" style={{ height }}>
      <div
        className="bar-fill"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: tone }}
      />
    </div>
  )
}
