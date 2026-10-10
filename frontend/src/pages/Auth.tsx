import { useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { IcEye, IcEyeOff, IcLock, IcUsers } from '../components/Icons'

function LabelInputContainer({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-1.5">{children}</div>
}

/** Aceternity signup-form signature: a gradient line that sweeps in under the button on hover. */
function BottomGradient() {
  return (
    <>
      <span
        className="pointer-events-none absolute inset-x-0 -bottom-px block h-px w-full opacity-0 transition duration-500 group-hover/btn:opacity-100"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
      />
      <span
        className="pointer-events-none absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100"
        style={{ background: 'linear-gradient(90deg, transparent, var(--sky-ink), transparent)' }}
      />
    </>
  )
}

export default function Auth() {
  const { user, login, register, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={from} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        await login(username, password)
      } else {
        await register(username, password, displayName || username)
      }
      navigate(from, { replace: true })
    } catch {
      // error already surfaced via auth context
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setMode('signin')
    setUsername('staff')
    setPassword('upay2026')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2" style={{ background: 'var(--paper)' }}>
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: 'var(--navy)' }}
      >
        <div
          className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full"
          style={{ background: 'var(--accent)', opacity: 0.16, filter: 'blur(70px)' }}
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <div
            className="serif flex h-9 w-9 items-center justify-center rounded-xl text-base font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--navy)' }}
          >
            N
          </div>
          <span className="text-lg font-semibold tracking-tight">NEXUS</span>
        </Link>
        <div className="relative">
          <p className="serif text-3xl leading-snug">
            "One clean donor view that automates tracking, thank-yous, and reports."
          </p>
          <p className="mt-4 text-sm" style={{ color: 'var(--navy-text-2)' }}>
            Team 4RottenRats &middot; Track 2: Tech-Enabled Impact Solutions &middot; Samadhan
            2026-27
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="dim mb-8 inline-block text-sm hover:underline lg:hidden">
            &larr; NEXUS
          </Link>

          <div className="seg mb-7 w-full">
            <button
              type="button"
              data-on={mode === 'signin'}
              className="flex-1"
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              data-on={mode === 'signup'}
              className="flex-1"
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>

          <h1 className="serif text-2xl">{mode === 'signin' ? 'Welcome back' : 'Join the team'}</h1>
          <p className="muted mt-1.5 text-sm">
            {mode === 'signin'
              ? 'Sign in to the donor console.'
              : 'Create a real account — this is a working login, not a mock-up.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <LabelInputContainer>
                <label className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                  Your name
                </label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                  placeholder="Aniket Rathour"
                />
              </LabelInputContainer>
            )}
            <LabelInputContainer>
              <label className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                Username
              </label>
              <div className="relative">
                <span className="dim pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                  <IcUsers size={15} />
                </span>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 34 }}
                  placeholder="staff"
                  autoCapitalize="none"
                />
              </div>
            </LabelInputContainer>
            <LabelInputContainer>
              <label className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                Password
              </label>
              <div className="relative">
                <span className="dim pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                  <IcLock size={15} />
                </span>
                <input
                  required
                  minLength={6}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 34, paddingRight: 38 }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="dim absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <IcEyeOff size={15} /> : <IcEye size={15} />}
                </button>
              </div>
            </LabelInputContainer>

            {error && (
              <div
                className="rounded-lg px-3 py-2 text-xs"
                style={{ background: 'var(--blush-bg)', color: 'var(--blush-ink)' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group/btn relative block h-11 w-full rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--navy)' }}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
              <BottomGradient />
            </button>
          </form>

          <div className="mt-6 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <div className="eyebrow mb-1">Demo access</div>
            <p className="dim text-xs leading-relaxed">
              Use the seeded UPAY staff account to explore immediately:{' '}
              <code className="font-mono" style={{ color: 'var(--ink)' }}>staff</code> /{' '}
              <code className="font-mono" style={{ color: 'var(--ink)' }}>upay2026</code>
            </p>
            <button type="button" onClick={fillDemo} className="btn btn-sm mt-2.5">
              Fill demo credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
