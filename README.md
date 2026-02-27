# Legenly — Junk Removal Lead Marketplace

A real-time lead marketplace platform for junk removal contractors. Subscribers pay $500/mo for exclusive access to homeowner leads in their market territory, delivered live to their dashboard via Socket.io.

---

## Quick Start

```bash
cd legenly
npm install   # installs root, server, and client dependencies
npm start     # starts both server (port 5000) and client (port 3000)
```

Open **http://localhost:3000** in your browser.

---

## Demo Credentials

| Role       | Email                  | Password   |
|------------|------------------------|------------|
| Admin      | admin@legenly.io       | admin123   |
| Subscriber | hunter@legenly.io      | hunter123  |

The subscriber is assigned to **Forsyth County GA** with 6 pre-seeded leads.

---

## Architecture

```
legenly/
  server/               Node.js + Express + Socket.io (port 5000)
    index.js            Entry point — HTTP server, Socket.io, routes
    routes/
      auth.js           POST /api/auth/login
      leads.js          GET /api/leads, PUT /api/leads/:id/status
      admin.js          Admin CRUD (leads, subscribers, markets)
      webhook.js        POST /api/webhook/lead (Zapier)
    db/
      setup.js          SQLite schema + seed (better-sqlite3)
      legenly.db        Auto-created on first start
    middleware/
      auth.js           JWT verification + requireAdmin guard

  client/               React + Vite + Tailwind CSS v4 (port 3000)
    src/
      pages/            Login, Dashboard, Admin
      components/       LeadCard, Sidebar, StatsRow, Notification
      context/          AuthContext (JWT state)
```

---

## API Reference

### Authentication

```
POST /api/auth/login
Body: { email, password }
Returns: { token, user: { id, email, role, market, name } }
```

### Subscriber Endpoints (JWT required)

```
GET  /api/leads                     — Get all leads for your market
PUT  /api/leads/:id/status          — Update status: new | called | closed
     Body: { status }
```

### Admin Endpoints (JWT + admin role required)

```
GET  /api/admin/leads               — All leads across all markets
POST /api/admin/leads               — Create lead + trigger live socket event
     Body: { name, phone, email, city, state, jobType, description, market }

GET  /api/admin/subscribers         — List all subscribers
POST /api/admin/subscribers         — Create subscriber account
     Body: { email, password, name, market }

GET  /api/admin/markets             — List markets with subscriber counts
POST /api/admin/markets             — Create new market
     Body: { name, cities }         cities = comma-separated string
```

### Webhook (Zapier Integration)

```
POST /api/webhook/lead
Content-Type: application/json

Body:
{
  "name":        "John Smith",
  "phone":       "770-555-0100",
  "email":       "john@email.com",
  "city":        "Cumming",
  "state":       "GA",
  "jobType":     "Garage",
  "description": "Full garage cleanout needed ASAP"
}

Response: 200 OK
{
  "success": true,
  "lead": { ...lead object... },
  "assignedMarket": "Forsyth County GA"
}
```

The webhook auto-assigns leads to markets by matching the `city` field against each market's city list. If no match is found, the lead is stored as `Unassigned`.

**Webhook URL for Zapier:**
```
http://your-server.com/api/webhook/lead
```

---

## Real-Time Lead Flow

1. Lead arrives via admin form or Zapier webhook
2. Server finds the matching market from the city
3. Server saves lead to SQLite database
4. Server emits `new-lead` event to the Socket.io room named after the market
5. Subscriber's browser (already connected and in that room) receives the event
6. Lead appears at the top of the feed with a green toast notification

---

## Adding a New Market

**Via Admin Panel:**
1. Log in as `admin@legenly.io`
2. Click **Markets** tab
3. Fill in market name (e.g. `Cherokee County GA`) and cities (comma-separated, e.g. `Canton,Woodstock,Ball Ground`)
4. Click **Create Market**

**Via API:**
```bash
curl -X POST http://localhost:5000/api/admin/markets \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cherokee County GA", "cities": "Canton,Woodstock,Ball Ground,Holly Springs"}'
```

---

## Adding a New Subscriber

**Via Admin Panel:**
1. Log in as `admin@legenly.io`
2. Click **Add Subscriber** tab
3. Fill in name, email, password, and select their market
4. Click **Add Subscriber**

**Via API:**
```bash
curl -X POST http://localhost:5000/api/admin/subscribers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@contractor.com", "password": "secure123", "market": "Cherokee County GA"}'
```

---

## Testing the Webhook Locally

```bash
curl -X POST http://localhost:5000/api/webhook/lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "770-555-9999",
    "email": "test@email.com",
    "city": "Cumming",
    "state": "GA",
    "jobType": "Garage",
    "description": "Test lead from curl"
  }'
```

If you have the subscriber dashboard open, the lead will appear live within ~200ms.

---

## Environment Variables

Create a `.env` file in `server/` (optional — defaults work for local dev):

```
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-strong-secret-here
```

---

## Tech Stack

| Layer        | Technology                            |
|--------------|---------------------------------------|
| Frontend     | React 19, Vite 7, Tailwind CSS v4     |
| Backend      | Node.js, Express 5                    |
| Database     | SQLite (better-sqlite3)               |
| Real-time    | Socket.io 4.x                         |
| Auth         | JWT (jsonwebtoken)                    |
| Fonts        | Syne (headings), DM Sans (body)       |
