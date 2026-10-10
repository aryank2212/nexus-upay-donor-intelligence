import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import type { User } from '../api/types'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearSession = () => {
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession())
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => clearSession())
      .finally(() => setLoading(false))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = async (username: string, password: string) => {
    setError(null)
    try {
      const res = await api.login(username, password)
      setToken(res.token)
      setUser(res.user)
    } catch (e) {
      setError((e as Error).message.replace(/^\d+:\s*/, ''))
      throw e
    }
  }

  const register = async (username: string, password: string, displayName: string) => {
    setError(null)
    try {
      const res = await api.register(username, password, displayName)
      setToken(res.token)
      setUser(res.user)
    } catch (e) {
      setError((e as Error).message.replace(/^\d+:\s*/, ''))
      throw e
    }
  }

  const logout = () => {
    api.logout().catch(() => {})
    clearSession()
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
