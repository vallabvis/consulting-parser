# Roadmap

## V1 — Ship in 3 weeks

The goal of V1 is the smallest tool that's genuinely useful: someone visits the site, finds 5 consulting opportunities they didn't know about, and bookmarks deadlines.

### Week 1 — Foundation + Opportunity DB
- Supabase project + schema migration
- Next.js scaffold + shadcn/ui setup
- `/opportunities` page with filter sidebar + card grid
- Seed 20 real opportunities manually
- Deploy to Vercel with a real URL to share

### Week 2 — Personal tracker + Resources
- Supabase Auth (wisc.edu only)
- `/dashboard` kanban view
- `/resources` page
- Deadline countdown badges (red <7 days, yellow <14 days)

### Week 3 — Admin + AI extraction
- `/admin` panel with approval queue
- AI extraction endpoint (paste URL → structured opportunity)
- Officer onboarding doc

## V1.5 — After first feedback round

- Email reminders via Resend (3-day and 1-day before deadline)
- "This week" urgent panel on landing page
- Better empty states + loading skeletons
- Mobile polish

## V2 — If V1 gets traction

- **Alumni directory** — needs 30+ alumni signups via outreach first
- **Greenhouse/Lever auto-poller** — only if AI extraction is too manual
- **Case prep practice partner matching**
- **Interview experience submissions** (anonymous "I interviewed at X, here's what they asked")
- **Discord/Slack integration** for new opportunity notifications

## Explicitly cut from V1 (and why)

- **Alumni directory:** Chicken-and-egg problem. Embarrassing with <30 alumni, requires multi-week outreach to seed properly. LinkedIn already covers this. Add when an officer commits to the outreach work.
- **Greenhouse/Lever poller:** Most MBB and elite boutiques don't use these platforms. AI extraction is more flexible. Build only if we find ourselves manually pasting the same firms repeatedly.
- **Email reminders:** In-app countdowns get 80% of the value. Add email once we have real users asking for it.
- **Scraping firm career pages directly:** They block scrapers, ToS issues, pages change constantly. Not worth the engineering pain.

## Success metrics for V1

- 50+ club members create accounts in first month
- 100+ opportunities in database by end of recruiting season
- 20+ members actively using the personal tracker
- At least 1 member reports landing a role they found through the site
