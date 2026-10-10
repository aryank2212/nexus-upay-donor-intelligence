export interface User {
  id: number
  username: string
  display_name: string
  role: string
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ContactMessage {
  id: number
  name: string
  email: string
  message: string
  created_at: string
}

export interface PublicStats {
  total_donors: number
  total_donations: number
  total_amount: number
}

export interface Donor {
  id: number
  display_name: string
  primary_email: string | null
  primary_phone: string | null
  status: string
  created_at: string
}

export interface DonorAlias {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  source: string
}

export interface Donation {
  id: number
  campaign: string | null
  amount: number
  txn_date: string
  reference: string | null
  status: string
  source_count: number
  acknowledgement_status: string
}

export interface DonorDetail extends Donor {
  aliases: DonorAlias[]
  donations: Donation[]
  total_given: number
  donation_count: number
}

export interface ImportSummary {
  batch_id: number
  source_type: string
  filename: string
  row_count: number
  error_count: number
  donors_created: number
  donors_matched: number
  donations_reconciled: number
  review_items_created: number
}

export interface ImportRow {
  id: number
  raw_name: string | null
  amount: number | null
  txn_date: string | null
  is_invalid: boolean
  invalid_reason: string | null
  match_status: string
  donor_id: number | null
  donation_id: number | null
}

export interface ReviewItem {
  id: number
  type: 'possible_duplicate' | 'unmatched_bank_credit' | 'import_error'
  status: 'open' | 'resolved'
  title: string
  description: string
  payload: Record<string, unknown>
  resolution: string | null
  created_at: string
  resolved_at: string | null
}

export interface Draft {
  id: number
  donor_id: number | null
  donation_id: number | null
  kind: 'thank_you' | 'update' | 'alert'
  status: 'draft' | 'approved' | 'sent'
  subject: string
  body: string
  sources: string[]
  generated_by: string
  created_at: string
}

export interface DashboardMonthly {
  month: string
  amount: number
}

export interface DashboardData {
  total_donors: number
  total_donations: number
  total_amount: number
  retention_rate: number
  recurring_count: number
  at_risk_count: number
  pending_review_count: number
  pending_drafts_count: number
  monthly: DashboardMonthly[]
}
