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

export interface Impact {
  units: number
  label: string
  rate: number
  sentence: string
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
  impact: Impact | null
}

export type PersonaKey =
  | 'new_supporter'
  | 'one_time'
  | 'steady_monthly'
  | 'crisis_responder'
  | 'champion'
  | 'lapsing'
  | 'regular'

export interface Persona {
  key: PersonaKey
  label: string
  tone: string
  blurb: string
}

export interface DonorDetail extends Donor {
  aliases: DonorAlias[]
  donations: Donation[]
  total_given: number
  donation_count: number
  persona: Persona
  total_impact: Impact | null
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
  channel: 'whatsapp' | 'email'
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

export interface Anomaly {
  type: 'shared_contact' | 'rapid_fire' | 'conflicting_identity'
  title: string
  description: string
  donor_ids: number[]
}

export interface AtRiskDonor {
  donor_id: number
  donor_name: string
  days_since_last_gift: number
  donation_count: number
  total_given: number
  last_campaign: string | null
  urgency_score: number
}

export interface CampaignImpact {
  campaign: string
  amount: number
  units: number
  label: string
}

export interface PersonaSlice {
  key: PersonaKey
  label: string
  tone: string
  count: number
}

export interface ImpactWall {
  total_donors: number
  total_donations: number
  total_amount: number
  total_units: number
  total_unit_label: string
  campaigns: CampaignImpact[]
  personas: PersonaSlice[]
  monthly: DashboardMonthly[]
}
