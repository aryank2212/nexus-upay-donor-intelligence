import { Link } from 'react-router-dom'
import { IcArrowRight } from '../Icons'

export function CTASection() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-16"
      style={{ background: 'var(--navy)' }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        style={{ background: 'var(--accent)', opacity: 0.18, filter: 'blur(60px)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full"
        style={{ background: 'var(--sky-ink)', opacity: 0.16, filter: 'blur(60px)' }}
      />
      <div className="relative">
        <h2 className="serif text-3xl text-white sm:text-4xl">
          See the pipeline work on real UPAY data
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--navy-text-2)' }}>
          Sign in, click <span className="font-semibold text-white">Load demo data</span>, and
          watch messy CSVs from three sources become one clean donor view — reconciled,
          deduplicated, and ready for a thank-you.
        </p>
        <Link
          to="/login"
          className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--navy)' }}
        >
          Sign in to NEXUS
          <IcArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}
