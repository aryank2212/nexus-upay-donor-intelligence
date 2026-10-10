import { useEffect, useState, type CSSProperties } from 'react'
import { api } from '../api/client'
import type { Donor, Draft } from '../api/types'
import { IcCheck, IcMail, IcWhatsapp } from '../components/Icons'
import { Card, Chip, Empty, PageHead } from '../components/ui'

export default function Copilot() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null)
  const [sentDrafts, setSentDrafts] = useState<Draft[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)

  const load = () => {
    api.drafts('draft').then(setDrafts).catch((e) => setError(e.message))
    api.drafts('sent').then(setSentDrafts).catch(() => {})
  }

  useEffect(load, [])

  const approve = async (id: number) => {
    setBusyId(id)
    try {
      await api.approveDraft(id)
      setDrafts((prev) => prev?.filter((d) => d.id !== id) ?? prev)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Grounded, never autonomous"
        title="AI Copilot"
        lead="Drafts for people, never sends alone. Every message cites the verified record it was built from."
        right={
          <button onClick={() => setShowGenerate((v) => !v)} className="btn btn-primary">
            {showGenerate ? 'Close' : '+ Draft a message'}
          </button>
        }
      />

      {error && (
        <div
          className="card card-pad mb-4 text-sm"
          style={{ borderColor: 'var(--blush-line)', background: 'var(--blush-bg)', color: 'var(--blush-ink)' }}
        >
          {error}
        </div>
      )}

      {showGenerate && (
        <div className="mb-5">
          <GenerateForm
            onGenerated={() => {
              setShowGenerate(false)
              load()
            }}
          />
        </div>
      )}

      <div>
        <h2 className="eyebrow mb-3">Waiting for approval {drafts ? `(${drafts.length})` : ''}</h2>
        {drafts === null ? (
          <div className="dim">Loading...</div>
        ) : drafts.length === 0 ? (
          <Empty>No drafts waiting right now.</Empty>
        ) : (
          <div className="enter-list grid grid-cols-1 gap-4 lg:grid-cols-2">
            {drafts.map((d, i) => (
              <DraftCard key={d.id} draft={d} index={i} busy={busyId === d.id} onApprove={() => approve(d.id)} />
            ))}
          </div>
        )}
      </div>

      {sentDrafts && sentDrafts.length > 0 && (
        <div className="mt-6">
          <h2 className="eyebrow mb-3">Sent ({sentDrafts.length})</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sentDrafts.slice(0, 6).map((d) => (
              <DraftCard key={d.id} draft={d} index={0} busy={false} onApprove={undefined} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DraftCard({
  draft,
  index,
  busy,
  onApprove,
}: {
  draft: Draft
  index: number
  busy: boolean
  onApprove?: () => void
}) {
  const isWhatsapp = draft.channel === 'whatsapp'

  return (
    <Card pad lift className="flex flex-col" style={{ ['--i' as string]: index } as CSSProperties}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Chip tone={isWhatsapp ? 'sage' : 'sky'}>
            {isWhatsapp ? <IcWhatsapp size={11} /> : <IcMail size={11} />}
            {isWhatsapp ? 'WhatsApp' : 'Email'}
          </Chip>
          <Chip tone="lilac">
            {draft.kind === 'thank_you' ? 'Thank-you' : draft.kind === 'update' ? 'Update' : 'Alert'}
          </Chip>
        </div>
        <Chip tone={draft.generated_by === 'llm' ? 'sage' : undefined}>
          {draft.generated_by === 'llm' ? 'LLM draft' : 'Grounded template'}
        </Chip>
      </div>

      {isWhatsapp ? (
        <div
          className="mt-3 flex-1 rounded-2xl p-3"
          style={{ background: 'repeating-linear-gradient(135deg, var(--surface-2) 0 14px, var(--surface-3) 14px 28px)' }}
        >
          <div
            className="relative max-w-[88%] rounded-lg rounded-tl-none px-3 py-2 text-[13px] leading-relaxed shadow-sm"
            style={{ background: 'var(--sage-mid)', color: '#0b3d1f' }}
          >
            <p className="whitespace-pre-line">{draft.body}</p>
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
              {draft.status === 'sent' && <IcCheck size={11} />}
              {draft.status === 'sent' ? 'Sent' : 'Draft'}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="serif mt-3 text-[15px] font-medium">{draft.subject}</div>
          <p className="muted mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed">{draft.body}</p>
        </>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--line-soft)' }}>
        <div className="dim text-xs">Sources: {draft.sources.join(', ') || 'donor profile'}</div>
        {onApprove && (
          <button onClick={onApprove} disabled={busy} className="btn btn-accent btn-sm">
            {busy ? 'Sending...' : 'Approve and send'}
          </button>
        )}
        {!onApprove && (
          <span className="text-xs font-semibold" style={{ color: 'var(--sage-ink)' }}>
            Sent
          </span>
        )}
      </div>
    </Card>
  )
}

function GenerateForm({ onGenerated }: { onGenerated: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Donor[]>([])
  const [selected, setSelected] = useState<Donor | null>(null)
  const [kind, setKind] = useState<'thank_you' | 'update'>('thank_you')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      api.donors(query).then(setResults).catch(() => {})
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  const generate = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await api.generateDraft(selected.id, kind)
      onGenerated()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card pad>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_auto]">
        <div className="relative">
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
            Donor
          </label>
          <input
            value={selected ? selected.display_name : query}
            onChange={(e) => {
              setSelected(null)
              setQuery(e.target.value)
            }}
            placeholder="Search donor by name, email or phone"
            className="input"
          />
          {results.length > 0 && !selected && (
            <div
              className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border bg-white shadow-lg"
              style={{ borderColor: 'var(--line)' }}
            >
              {results.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelected(d)
                    setResults([])
                  }}
                  className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-[var(--surface-2)]"
                >
                  <div className="font-medium">{d.display_name}</div>
                  <div className="dim text-xs">{d.primary_email ?? d.primary_phone ?? 'no contact on file'}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
            Kind
          </label>
          <select value={kind} onChange={(e) => setKind(e.target.value as 'thank_you' | 'update')} className="select">
            <option value="thank_you">Thank-you</option>
            <option value="update">Programme update</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={generate} disabled={!selected || loading} className="btn btn-primary w-full md:w-auto">
            {loading ? 'Drafting...' : 'Draft it'}
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-3 text-sm" style={{ color: 'var(--blush-ink)' }}>
          {error}
        </div>
      )}
    </Card>
  )
}
