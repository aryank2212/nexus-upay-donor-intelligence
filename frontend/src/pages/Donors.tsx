import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Donor } from '../api/types'
import { IcSearch } from '../components/Icons'
import { Card, Chip, PageHead } from '../components/ui'

export default function Donors() {
  const [donors, setDonors] = useState<Donor[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .donors(query || undefined)
        .then(setDonors)
        .catch((e) => setError(e.message))
    }, 200)
    return () => clearTimeout(handle)
  }, [query])

  return (
    <div>
      <PageHead
        eyebrow={donors ? `${donors.length} shown` : 'Loading'}
        title="Donors"
        lead="One verified identity per donor, across every channel."
      />

      <div className="relative mb-4 max-w-md">
        <span className="dim pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          <IcSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone"
          className="input"
          style={{ paddingLeft: 34 }}
        />
      </div>

      {error && (
        <div className="mb-3 text-sm" style={{ color: 'var(--blush-ink)' }}>
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {donors === null ? (
              <tr>
                <td colSpan={4} className="dim text-center">
                  Loading...
                </td>
              </tr>
            ) : donors.length === 0 ? (
              <tr>
                <td colSpan={4} className="dim text-center">
                  No donors found.
                </td>
              </tr>
            ) : (
              donors.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link to={`/app/donors/${d.id}`} className="font-semibold hover:underline" style={{ color: 'var(--ink)' }}>
                      {d.display_name}
                    </Link>
                  </td>
                  <td className="dim">{d.primary_email ?? '—'}</td>
                  <td className="dim">{d.primary_phone ?? '—'}</td>
                  <td>
                    <Chip tone="sage">{d.status}</Chip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
