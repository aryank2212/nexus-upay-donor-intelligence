/**
 * Adapted from Aceternity UI's "Logo Clouds" — an infinite marquee of the
 * systems NEXUS actually reads from. Rendered as plain wordmarks rather than
 * copied brand artwork, since NEXUS has no affiliation with these companies.
 */
const SOURCES = [
  'Razorpay',
  'Bank statements (CSV)',
  'Google Sheets',
  'UPI / NEFT',
  'PostgreSQL',
  'FastAPI',
]

export function LogoCloud() {
  const loop = [...SOURCES, ...SOURCES]
  return (
    <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
      <div className="logo-marquee flex w-max items-center gap-14 py-2">
        {loop.map((name, i) => (
          <span
            key={i}
            className="serif whitespace-nowrap text-xl font-medium"
            style={{ color: 'var(--ink-4)' }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
