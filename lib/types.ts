// Central type definitions — keep in sync with supabase/migrations/0001_initial.sql

export type UserRole = 'member' | 'officer' | 'admin'

export type FirmTier = 'mbb' | 'big4' | 'tier2' | 'boutique' | 'other'

export type RoleType =
  | 'full_time'
  | 'summer_internship'
  | 'sophomore_program'
  | 'freshman_program'
  | 'diversity_program'
  | 'case_competition'
  | 'networking_event'

export type OpportunityStatus = 'active' | 'expired' | 'archived'

export type SubmissionSource =
  | 'manual'
  | 'greenhouse'
  | 'lever'
  | 'ai_extraction'
  | 'member_submission'

export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'oa_received'
  | 'oa_completed'
  | 'first_round'
  | 'final_round'
  | 'offer'
  | 'rejected'
  | 'withdrew'

export type ResourceCategory =
  | 'case_prep'
  | 'resume'
  | 'behavioral'
  | 'networking'
  | 'firm_research'
  | 'market_sizing'

export type IntroRequestStatus = 'pending' | 'sent' | 'declined'

// ─── Database row types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string
  grad_year: number
  role: UserRole
  created_at: string
}

export interface Opportunity {
  id: string
  firm_name: string
  firm_tier: FirmTier
  role_title: string
  role_type: RoleType
  target_grad_years: number[]
  deadline: string | null        // ISO timestamptz
  posted_date: string | null
  location: string | null
  remote_eligible: boolean
  application_url: string | null
  eligibility_notes: string | null
  application_steps: string[]
  tips: string | null
  source_url: string | null
  last_verified: string | null
  status: OpportunityStatus
  created_at: string
  updated_at: string
}

export interface PendingOpportunity extends Omit<Opportunity, 'status'> {
  submitted_by: string | null
  submission_source: SubmissionSource
  reviewed_by: string | null
  reviewed_at: string | null
}

export interface Alumni {
  id: string
  full_name: string
  grad_year: number
  current_firm: string
  current_role: string
  previous_firms: string[]
  linkedin_url: string | null
  email: string | null
  open_to_chat: boolean
  areas_of_expertise: string[]
  notes: string | null
  verified: boolean
  created_at: string
}

export interface Resource {
  id: string
  title: string
  category: ResourceCategory
  url: string
  description: string | null
  recommended_by: string | null
  created_at: string
}

export interface UserApplication {
  id: string
  user_id: string
  opportunity_id: string
  status: ApplicationStatus
  applied_date: string | null
  notes: string | null
  updated_at: string
  // joined
  opportunity?: Opportunity
}

export interface IntroRequest {
  id: string
  requester_id: string
  alumni_id: string
  message: string
  status: IntroRequestStatus
  created_at: string
}

// ─── API / form shapes ────────────────────────────────────────────────────────

/** Shape Claude returns from the /api/extract endpoint */
export interface ExtractedOpportunity {
  firm_name: string | null
  firm_tier: FirmTier | null
  role_title: string | null
  role_type: RoleType | null
  target_grad_years: number[] | null
  deadline: string | null
  location: string | null
  remote_eligible: boolean | null
  application_url: string | null
  eligibility_notes: string | null
  application_steps: string[] | null
  tips: string | null
}
