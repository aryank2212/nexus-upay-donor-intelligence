import { useState } from 'react'
import { api } from '../../api/client'
import { IcCheck } from '../Icons'

export function ContactSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      await api.submitContact(name, email, message)
      setStatus('sent')
      setName('')
      setEmail('')
      setMessage('')
    } catch (e) {
      setStatus('error')
      setError((e as Error).message.replace(/^\d+:\s*/, ''))
    }
  }

  if (status === 'sent') {
    return (
      <div className="card card-pad mx-auto max-w-lg text-center">
        <div
          className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: 'var(--sage-bg)', color: 'var(--sage-ink)' }}
        >
          <IcCheck size={20} />
        </div>
        <h3 className="serif text-lg">Message received</h3>
        <p className="muted mt-1.5 text-sm">
          Thanks — your note has been logged for the UPAY fundraising team. For anything urgent,
          reach them directly at{' '}
          <a href="mailto:samadhan@upayngo.com" style={{ color: 'var(--accent-strong)' }}>
            samadhan@upayngo.com
          </a>
          .
        </p>
        <button className="btn mt-4" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card card-pad mx-auto max-w-lg space-y-4">
      <div className="field flex flex-col gap-1.5">
        <label className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
          Name
        </label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
      </div>
      <div className="field flex flex-col gap-1.5">
        <label className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
          Email
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
        />
      </div>
      <div className="field flex flex-col gap-1.5">
        <label className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
          Message
        </label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input"
          style={{ height: 110, paddingTop: 10, resize: 'vertical' }}
          placeholder="Tell us about your NGO, or what you'd want NEXUS to do..."
        />
      </div>
      {error && (
        <div className="text-sm" style={{ color: 'var(--blush-ink)' }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={status === 'sending'} className="btn btn-accent w-full">
        {status === 'sending' ? 'Sending...' : 'Send message'}
      </button>
    </form>
  )
}
