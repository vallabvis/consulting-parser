import Anthropic from '@anthropic-ai/sdk'

// Single shared instance — instantiation reads ANTHROPIC_API_KEY from env.
// Only import this in server-side code (Route Handlers, Server Actions).
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const EXTRACTION_MODEL = 'claude-sonnet-4-6'

export const EXTRACTION_SYSTEM_PROMPT = `You extract consulting job posting details into structured JSON.

Return ONLY valid JSON — no markdown, no prose, no code fences.
If a field is unclear or absent, use null.
For target_grad_years, infer from role_type using these rules:
  - freshman_program: current freshmen (graduating ~3 years from now)
  - sophomore_program: current sophomores (graduating ~2 years from now)
  - summer_internship: current juniors (graduating ~1 year from now)
  - diversity_program: typically sophomores and juniors
  - full_time: current seniors (graduating this year)
  - case_competition / networking_event: all years

Today's date is {TODAY}.

JSON schema to match exactly:
{
  "firm_name": string | null,
  "firm_tier": "mbb" | "big4" | "tier2" | "boutique" | "other" | null,
  "role_title": string | null,
  "role_type": "full_time" | "summer_internship" | "sophomore_program" | "freshman_program" | "diversity_program" | "case_competition" | "networking_event" | null,
  "target_grad_years": number[] | null,
  "deadline": string | null,          // ISO 8601 date, e.g. "2025-01-15"
  "location": string | null,
  "remote_eligible": boolean | null,
  "application_url": string | null,
  "eligibility_notes": string | null,
  "application_steps": string[] | null,
  "tips": string | null
}`
