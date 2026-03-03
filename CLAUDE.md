# Legenly — AI Context File

## What This Is
Legenly is a SaaS lead marketplace for junk removal contractors. Operators pay $500/month for exclusive territory access. We run Facebook/Instagram ads → leads flow automatically into contractor dashboards in real time. One operator per market.

## Live URLs
- App: https://www.legenly.io
- GitHub: https://github.com/dominick-a11y/legenly
- Railway project: heroic-appreciation

## Stack
- Frontend: React + Tailwind CSS (Vite)
- Backend: Node.js + Express
- DB: SQLite (better-sqlite3)
- Auth: JWT
- Real-time: Socket.io
- Payments: Stripe (test mode — not fully active yet, pending LLC setup)
- SMS: Twilio (configured, needs env vars)
- Hosting: Railway (auto-deploys from GitHub main branch)

## Codebase Location
/home/user/legenly/
- server/index.js — Express + Socket.io entry point
- server/routes/ — auth, leads, admin, webhook, billing, community, waitlist
- server/db/database.js — SQLite setup + seed data
- server/services/notifications.js — Twilio SMS
- client/src/pages/ — Login, Dashboard, Admin, Community, Waitlist, Register, LeadForm
- client/src/components/ — LeadCard, Sidebar, StatsRow, Notification

## Test Accounts
- Admin: admin@legenly.io / admin123
- Subscriber (Hunter): hunter@legenly.io / hunter123 (Forsyth County GA)

## Current Status (March 2026)
- Product is built and deployed
- Hunter is the only active user (testing)
- 30 waitlist signups from a webinar (zero marketing yet)
- Railway builds were failing due to libatomic1 issue — fix was pushed March 2
- /register page exists but Stripe is bypassed until LLC is set up
- Manual account creation via /admin → Add Subscriber
- Facebook lead form → Zapier → POST /api/webhook/lead (webhook is live)

## Priority Right Now
1. Confirm Railway build is green (libatomic1 fix)
2. Connect Hunter's Facebook ads to the webhook via Zapier
3. Test a real lead flowing through end-to-end
4. Hunter demos it on content → drive waitlist traffic
5. April 7 launch target (50 founding members, $500/mo)

## Business Model
- $500/month per exclusive territory
- We run ads ($200-250/month per market)
- Gross margin: ~$250/market
- Lead cost: ~$18-23 CPL (validated with Hunter's campaign)
- Close rate on exclusive leads: ~65-70%

## People
- Dominick Morgan — founder/builder (19, Chicago Heights IL)
- Hunter Patrick — first customer + distribution (Dumpire, Forsyth County GA)
- Nick — team member, cold calling/appointments

## Key Env Vars Needed on Railway
- JWT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER
- WEBHOOK_SECRET
- CLIENT_URL
- ANTHROPIC_API_KEY (for AI sales assist feature)

## Zapier Webhook Format
POST /api/webhook/lead
{
  "name": "John Smith",
  "phone": "770-555-0199",
  "email": "john@test.com",
  "city": "Cumming",
  "state": "GA",
  "jobType": "Garage",
  "description": "Full garage cleanout needed"
}
