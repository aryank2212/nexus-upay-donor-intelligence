import { useRef, useState, type CSSProperties } from 'react'
import { api } from '../api/client'
import type { ImportRow, ImportSummary } from '../api/types'
import { IcCheck, IcLandmark, IcUsers } from '../components/Icons'
import { Card, Chip, PageHead } from '../components/ui'

const SOURCES = [
  { value: 'razorpay', label: 'Razorpay export', hint: 'name, email, phone, amount, date, payment_id, campaign', icon: IcCheck },
  { value: 'bank', label: 'Bank statement', hint: 'txn_date, narration, amount', icon: IcLandmark },
  { value: 'sheet', label: 'UPAY sheet', hint: 'name, phone, amount, campaign, date', icon: IcUsers },
]

export default function Import() {
  const [sourceType, setSourceType] = useState('razorpay')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<ImportSummary[]>([])
  const [rowsByBatch, setRowsByBatch] = useState<Record<number, ImportRow[]>>({})
  const fileInput = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    const file = fileInput.current?.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const summary = await api.uploadImport(sourceType, file)
      setSummaries((prev) => [summary, ...prev])
      if (summary.error_count > 0) {
        const rows = await api.importRows(summary.batch_id)
        setRowsByBatch((prev) => ({ ...prev, [summary.batch_id]: rows.filter((r) => r.is_invalid) }))
      }
      if (fileInput.current) fileInput.current.value = ''
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const loadDemo = async () => {
    setSeeding(true)
    setError(null)
    try {
      const results = await api.seedDemo()
      setSummaries((prev) => [...results.reverse(), ...prev])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSeeding(false)
    }
  }

  const resetAll = async () => {
    setResetting(true)
    setError(null)
    try {
      await api.resetDemo()
      setSummaries([])
      setRowsByBatch({})
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Pipeline entry point"
        title="Import Data"
        lead="Messy data in, clean donor out. Upload a CSV from any source, or load the demo set."
        right={
          <div className="flex gap-2">
            <button onClick={resetAll} disabled={resetting} className="btn">
              {resetting ? 'Resetting...' : 'Reset all data'}
            </button>
            <button onClick={loadDemo} disabled={seeding} className="btn btn-accent">
              {seeding ? 'Loading demo data...' : 'Load demo data'}
            </button>
          </div>
        }
      />

      <Card pad>
        <h2 className="eyebrow mb-4">Upload a CSV</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {SOURCES.map((s) => {
            const Icon = s.icon
            const on = sourceType === s.value
            return (
              <button
                key={s.value}
                onClick={() => setSourceType(s.value)}
                className="rounded-2xl border p-3.5 text-left transition-colors"
                style={{
                  borderColor: on ? 'var(--accent)' : 'var(--line)',
                  background: on ? 'var(--accent-soft)' : 'var(--surface)',
                }}
              >
                <span
                  className="kpi-ic mb-2"
                  style={{ background: on ? 'var(--accent)' : 'var(--surface-3)', color: on ? 'var(--navy)' : 'var(--ink-3)' }}
                >
                  <Icon size={16} />
                </span>
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="dim mt-1 text-xs">{s.hint}</div>
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept=".csv"
            className="input flex-1 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--surface-3)] file:px-3 file:py-1.5 file:text-sm"
            style={{ paddingTop: 6, paddingBottom: 6 }}
          />
          <button onClick={handleUpload} disabled={loading} className="btn btn-primary">
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </Card>

      {error && (
        <div
          className="card card-pad mt-4 text-sm"
          style={{ borderColor: 'var(--blush-line)', background: 'var(--blush-bg)', color: 'var(--blush-ink)' }}
        >
          {error}
        </div>
      )}

      {summaries.length > 0 && (
        <div className="enter-list mt-5 space-y-3">
          <h2 className="eyebrow">Import results</h2>
          {summaries.map((s, i) => (
            <Card pad key={s.batch_id} style={{ ['--i' as string]: i } as CSSProperties}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {s.filename} <span className="dim font-normal">({s.source_type})</span>
                  </div>
                  <div className="dim mt-1 text-xs">
                    {s.row_count} rows &middot; {s.donors_created} new donors &middot; {s.donors_matched} matched &middot;{' '}
                    {s.donations_reconciled} reconciled
                    {s.review_items_created > 0 && <> &middot; {s.review_items_created} sent to review</>}
                  </div>
                </div>
                {s.error_count > 0 ? (
                  <Chip tone="clay">{s.error_count} rows need fixing</Chip>
                ) : (
                  <Chip tone="sage">clean import</Chip>
                )}
              </div>
              {rowsByBatch[s.batch_id]?.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--line-soft)' }}>
                  {rowsByBatch[s.batch_id].map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="dim">{r.raw_name ?? '(no name)'}</span>
                      <span className="font-medium" style={{ color: 'var(--clay-ink)' }}>
                        {r.invalid_reason}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
