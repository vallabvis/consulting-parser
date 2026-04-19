# Consulting Parser

A dashboard for the **Wisconsin Consulting Club** at UW–Madison that aggregates consulting recruiting opportunities, tracks deadlines, and helps members manage their applications.

## What It Does

- **Opportunity database** with filters by graduation year, role type, firm tier, and deadline
- **Deadline tracking** with visual countdowns and a "this week" urgent panel
- **Personal application tracker** (interested → applied → interviewing → decided)
- **Curated resources** for case prep, resume, behavioral, and firm research
- **AI-assisted ingestion**: officers paste a job URL, Claude extracts structured details for review

## Tech Stack

- **Frontend:** Next.js 14 (App Router, TypeScript), Tailwind CSS, shadcn/ui
- **Database:** Supabase (Postgres + Auth)
- **AI extraction:** Anthropic Claude API (Sonnet)
- **Deployment:** Vercel

## Getting Started

This repo is currently a planning scaffold. To build out the actual app, see [`docs/CLAUDE_CODE_PROMPT.md`](docs/CLAUDE_CODE_PROMPT.md) — paste it into Claude Code in this directory and it will scaffold the entire project.

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account (use your `.edu` email)
- An [Anthropic API key](https://console.anthropic.com)
- A [Vercel](https://vercel.com) account for deployment (free tier)

### Quick Start (once scaffolded)

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## Project Status

🚧 **Pre-alpha** — Planning and scaffolding stage.

### V1 Scope

- [x] Project planning
- [ ] Database schema + migrations
- [ ] Opportunity browse + filter UI
- [ ] Deadline countdown views
- [ ] Personal application tracker
- [ ] Resources page
- [ ] AI extraction endpoint
- [ ] Officer admin panel

### Cut From V1 (revisit later)

- Alumni directory — needs 30+ alumni and outreach work before launching
- Greenhouse/Lever auto-poller — AI extraction covers this for now
- Email reminders — in-app countdowns first, email in v1.5

## Contributing

This is a Wisconsin Consulting Club project. If you're a member and want to contribute, reach out to the project lead.

## License

MIT — see [`LICENSE`](LICENSE).
