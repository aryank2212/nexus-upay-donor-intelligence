import type {
  AuthResponse,
  ContactMessage,
  DashboardData,
  Donor,
  DonorDetail,
  Draft,
  ImportRow,
  ImportSummary,
  PublicStats,
  ReviewItem,
  User,
} from './types'

const BASE = '/api'
const TOKEN_KEY = 'nexus_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable (private mode etc.) - session just won't persist
  }
}

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    setToken(null)
    onUnauthorized?.()
    throw new Error('401: Session expired — please sign in again')
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail ?? JSON.stringify(data)
    } catch {
      // ignore
    }
    throw new Error(`${res.status}: ${detail}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  publicStats: () => request<PublicStats>('/public/stats'),

  register: (username: string, password: string, display_name: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, display_name }),
    }),
  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<User>('/auth/me'),
  logout: () => request<{ status: string }>('/auth/logout', { method: 'POST' }),

  submitContact: (name: string, email: string, message: string) =>
    request<ContactMessage>('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, message }),
    }),

  dashboard: () => request<DashboardData>('/dashboard'),

  donors: (q?: string) =>
    request<Donor[]>(`/donors${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  donor: (id: number) => request<DonorDetail>(`/donors/${id}`),

  reviewQueue: () => request<ReviewItem[]>('/review-queue'),
  resolveReviewItem: (id: number, action: string) =>
    request<ReviewItem>(`/review-queue/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  drafts: (status?: string) =>
    request<Draft[]>(`/copilot/drafts${status ? `?status=${status}` : ''}`),
  generateDraft: (donor_id: number, kind: string, donation_id?: number) =>
    request<Draft>('/copilot/drafts', {
      method: 'POST',
      body: JSON.stringify({ donor_id, kind, donation_id }),
    }),
  approveDraft: (id: number) =>
    request<Draft>(`/copilot/drafts/${id}/approve`, { method: 'POST' }),

  imports: () => request<ImportSummary[]>('/imports'),
  importRows: (batchId: number) => request<ImportRow[]>(`/imports/${batchId}/rows`),
  uploadImport: (sourceType: string, file: File) => {
    const form = new FormData()
    form.append('source_type', sourceType)
    form.append('file', file)
    return request<ImportSummary>('/imports', { method: 'POST', body: form })
  },

  seedDemo: () => request<ImportSummary[]>('/seed/demo', { method: 'POST' }),
  resetDemo: () => request<{ status: string }>('/seed/reset', { method: 'POST' }),
}
