# Claude Code Scaffolding Prompt

Paste the prompt below into Claude Code from the root of this repository. It will scaffold the entire V1 application.

---

I'm building "Wisco Consulting Hub" — a dashboard for the Wisconsin Consulting Club at UW-Madison that aggregates consulting recruiting opportunities and helps members track applications. I'm a sophomore CS student (CS 320 level), so explain non-obvious choices as you go.

## Stack

- Next.js 14 (App Router, TypeScript, Tailwind)
- shadcn/ui components (initialize with: cardinal red `#C5050C` as primary accent, neutral grays, Inter font)
- Supabase (Postgres + Auth)
- Anthropic SDK for AI extraction
- Deploy target: Vercel

## Project Structure

```
/app
  /(public)        — landing, opportunities, resources
  /(auth)          — login, signup (wisc.edu only)
  /dashboard       — personal tracker (auth required)
  /admin           — approval queue, manual entry (officer role required)
  /api
    /extract       — POST, takes URL, returns structured opportunity via Claude
/components        — ui/, opportunities/, shared/
/lib               — supabase.ts, anthropic.ts, types.ts, grad-year-utils.ts
/supabase/migrations — SQL files
```

## Database Schema

Create `/supabase/migrations/0001_initial.sql` with:

- **profiles**: `id` (uuid, FK to auth.users), `email`, `full_name`, `grad_year`, `role` (enum: member, officer, admin), `created_at`
- **opportunities**: `id`, `firm_name`, `firm_tier` (enum: mbb, big4, tier2, boutique, other), `role_title`, `role_type` (enum: full_time, summer_internship, sophomore_program, freshman_program, diversity_program, case_competition, networking_event), `target_grad_years` (int[]), `deadline` (timestamptz), `posted_date`, `location`, `remote_eligible` (bool), `application_url`, `eligibility_notes`, `application_steps` (text[]), `tips`, `source_url`, `last_verified`, `status` (enum: active, expired, archived), `created_at`, `updated_at`
- **pending_opportunities**: same shape as opportunities + `submitted_by`, `submission_source` (enum: manual, ai_extraction, member_submission), `reviewed_by`, `reviewed_at`
- **resources**: `id`, `title`, `category` (enum: case_prep, resume, behavioral, networking, firm_research, market_sizing), `url`, `description`, `recommended_by`, `created_at`
- **user_applications**: `id`, `user_id` (FK profiles), `opportunity_id` (FK opportunities), `status` (enum: interested, applied, oa_received, oa_completed, first_round, final_round, offer, rejected, withdrew), `applied_date`, `notes`, `updated_at`

Add RLS policies: opportunities/resources public read; user_applications only owner; admin tables only officers.

## Key Utility: grad-year-utils.ts

Build a function `getEligibleRoleTypes(gradYear: number, currentDate: Date)` that returns which role types a student is realistically eligible for. E.g., a 2028 student in April 2026 is eligible for: sophomore_program, diversity_program, summer_internship (early recruit), case_competition. A 2027 student is in prime summer internship season. A 2026 student is full-time. Comment the logic clearly.

## Pages

1. `/` — Hero ("Your launchpad to consulting"), stats row (X live opportunities, Y deadlines this week), featured deadlines
2. `/opportunities` — Sticky filter sidebar (grad year multi-select, role type, firm tier, deadline range, search), card grid sorted by deadline ASC by default. Each card: firm name, role title, deadline countdown badge (red if <7 days), grad year badges, "View" + "Quick Apply" buttons
3. `/opportunities/[id]` — Full detail, application steps as numbered list, tips section, "Save to my tracker" button
4. `/resources` — Tabbed by category, card per resource
5. `/dashboard` — Personal kanban (interested → applied → interviewing → decided), upcoming deadlines for saved opportunities
6. `/admin` — Tabs: "Pending Approval" (queue from pending_opportunities with approve/edit/reject), "Add Manually" (paste URL → AI extract → review → save)

## AI Extraction Endpoint (`/app/api/extract/route.ts`)

- POST `{ url: string }`
- Server-side fetch the URL with realistic User-Agent
- Strip HTML to text (use `node-html-parser`)
- Send to Claude with this system prompt: *"You extract consulting job posting details into structured JSON. Return ONLY valid JSON matching the schema. If a field is unclear, use null. For target_grad_years, infer from role_type: sophomore programs target current sophomores (2 years from grad), summer internships target juniors (1 year from grad), full-time targets seniors. Today's date is [inject current date]."*
- Use `claude-sonnet-4` model
- Return parsed JSON to client for review before saving

## Seed Data

`/supabase/seed.sql` with 20 realistic opportunities:
- 3 MBB summer internships (target 2027), 2 MBB sophomore programs (target 2028)
- McKinsey Achievement Award, BCG Bridge to BCG, Bain Building Entrepreneurial Leaders (real programs, target 2028/2029)
- 3 Big 4 strategy roles (Deloitte S&O, EY-P, Strategy&)
- 5 tier-2 (Oliver Wyman, LEK, Kearney, ZS, Putnam)
- 3 case competitions
- 2 boutique opportunities

Plus 12 resources (Case in Point, Victor Cheng LOMS, MConsultingPrep, Management Consulted blog, MBB official prep guides, Wisconsin School of Business case prep guide, etc.)

## Styling Notes

- Linear/Notion-inspired: lots of whitespace, subtle borders, no heavy shadows
- Cardinal red ONLY as accent (CTAs, badges, highlights) — not backgrounds
- Use `lucide-react` for icons
- Mobile-responsive (members will check on phones)
- Loading states with skeleton components
- Empty states with helpful copy

## After Scaffolding

Walk me through, in this order:
1. Setting up Supabase (create project, run migrations, set env vars)
2. Setting up Anthropic API key
3. Running locally with `npm run dev`
4. Deploying to Vercel
5. What to build first (suggest the smallest end-to-end slice that proves the concept works)

Stop and ask me before installing anything beyond the initial setup. Build the schema and folder structure first, then we'll iterate page by page.
