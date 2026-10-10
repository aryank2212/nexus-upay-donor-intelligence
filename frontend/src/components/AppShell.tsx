import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { IcClose, IcGrid, IcLogout, IcMenu, IcShieldCheck, IcSpark, IcUpload, IcUsers } from './Icons'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: IcGrid },
  { to: '/app/review-queue', label: 'Review Queue', icon: IcShieldCheck },
  { to: '/app/copilot', label: 'AI Copilot', icon: IcSpark },
  { to: '/app/donors', label: 'Donors', icon: IcUsers },
  { to: '/app/import', label: 'Import Data', icon: IcUpload },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

/**
 * Adapted from Aceternity UI's "Sidebar" block: a desktop rail that expands
 * on hover (icon-only -> icon + label), plus a real mobile drawer. Both are
 * functional, not decorative — they drive the same NavLink routing either way.
 */
function NavList({ onNavigate, expanded }: { onNavigate?: () => void; expanded: boolean }) {
  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app'}
          onClick={onNavigate}
          className={({ isActive }) => `nav-item ${isActive ? 'on' : ''}`}
          style={{ overflow: 'hidden' }}
        >
          <Icon size={16} className="flex-none" />
          {expanded && <span className="whitespace-nowrap">{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand({ expanded }: { expanded: boolean }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden px-[18px] py-6">
      <div
        className="serif flex h-9 w-9 flex-none items-center justify-center rounded-xl text-base font-semibold"
        style={{ background: 'var(--accent)', color: 'var(--navy)' }}
      >
        N
      </div>
      {expanded && (
        <div className="whitespace-nowrap">
          <div className="text-base font-semibold leading-tight tracking-tight">NEXUS</div>
          <div className="text-[11px] leading-tight" style={{ color: 'var(--navy-text-2)' }}>
            UPAY Donor Intelligence
          </div>
        </div>
      )}
    </div>
  )
}

function Footer({ expanded, onLogout }: { expanded: boolean; onLogout: () => void }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div
      className="flex items-center gap-2.5 overflow-hidden px-3 py-4"
      style={{ borderTop: '1px solid var(--navy-border)' }}
    >
      <div
        className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold uppercase"
        style={{ background: 'var(--accent-soft)', color: 'var(--navy)' }}
      >
        {initials(user.display_name) || user.username[0]}
      </div>
      {expanded && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-white">{user.display_name}</div>
          <div className="truncate text-[10.5px]" style={{ color: 'var(--navy-text-2)' }}>
            @{user.username}
          </div>
        </div>
      )}
      <button
        onClick={onLogout}
        title="Sign out"
        className="flex h-7 w-7 flex-none items-center justify-center rounded-lg"
        style={{ color: 'var(--navy-text-2)' }}
      >
        <IcLogout size={15} />
      </button>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* Desktop hover-expand rail */}
      <motion.aside
        className="relative hidden h-full shrink-0 flex-col text-white md:flex"
        style={{ background: 'var(--navy)' }}
        animate={{ width: expanded ? 248 : 72 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <Brand expanded={expanded} />
        <NavList expanded={expanded} />
        <Footer expanded={expanded} onLogout={handleLogout} />
      </motion.aside>

      {/* Mobile topbar */}
      <div
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden"
        style={{ background: 'var(--navy)' }}
      >
        <div className="flex items-center gap-2 text-white">
          <div
            className="serif flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--navy)' }}
          >
            N
          </div>
          <span className="text-sm font-semibold">NEXUS</span>
        </div>
        <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--navy-text-2)' }}>
          <IcMenu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(18,26,61,.55)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-full w-64 flex-col text-white"
              style={{ background: 'var(--navy)' }}
            >
              <div className="flex items-center justify-between px-3 pt-3">
                <div />
                <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--navy-text-2)' }} className="p-2">
                  <IcClose size={18} />
                </button>
              </div>
              <Brand expanded />
              <NavList expanded onNavigate={() => setMobileOpen(false)} />
              <Footer expanded onLogout={handleLogout} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  )
}
