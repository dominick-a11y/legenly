const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/setup');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require JWT + admin role
router.use(requireAuth, requireAdmin);

// GET /api/admin/leads — all leads across all markets
router.get('/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY createdAt DESC').all();
  res.json(leads);
});

// POST /api/admin/leads — create a new lead and notify via Socket.io
router.post('/leads', (req, res) => {
  const { name, phone, email, city, state, jobType, description, market } = req.body || {};

  if (!name || !market) {
    return res.status(400).json({ error: 'Name and market are required' });
  }

  const result = db.prepare(`
    INSERT INTO leads (name, phone, email, city, state, jobType, description, market, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
  `).run(
    name,
    phone || null,
    email || null,
    city || null,
    state || null,
    jobType || null,
    description || null,
    market
  );

  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

  // Emit real-time event to subscribers in that market
  req.app.locals.io?.to(market).emit('newLead', newLead);

  res.status(201).json(newLead);
});

// DELETE /api/admin/leads/:id — delete a single lead
router.delete('/leads/:id', (req, res) => {
  const id = Number(req.params.id);
  const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  res.json({ success: true });
});

// DELETE /api/admin/leads — delete all leads
router.delete('/leads', (req, res) => {
  const { confirm } = req.body || {};
  if (confirm !== 'yes') return res.status(400).json({ error: 'Send { confirm: "yes" } to delete all leads' });
  db.prepare('DELETE FROM leads').run();
  res.json({ success: true });
});

// GET /api/admin/subscribers — list all subscriber accounts
router.get('/subscribers', (req, res) => {
  const subscribers = db.prepare(
    "SELECT id, name, email, market, role, createdAt, isFounder FROM users WHERE role = 'subscriber' ORDER BY createdAt DESC"
  ).all();
  res.json(subscribers);
});

// POST /api/admin/subscribers — create a new subscriber account
router.post('/subscribers', (req, res) => {
  const { email, password, name, market } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Enforce hard market capacity: 1 subscriber per market (exclusivity guarantee)
  if (market) {
    const existing = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE market = ? AND role = 'subscriber'"
    ).get(market);
    if (existing.count > 0) {
      return res.status(409).json({
        error: `Market "${market}" is already taken. Each territory can only have one exclusive subscriber.`
      });
    }
  }

  const hash = bcrypt.hashSync(password, 10);

  // Set isFounder = 1 for all accounts created before May 1, 2026
  const founderCutoff = new Date('2026-05-01');
  const isFounder = new Date() < founderCutoff ? 1 : 0;

  try {
    const result = db.prepare(
      "INSERT INTO users (email, password, role, market, name, isFounder) VALUES (?, ?, 'subscriber', ?, ?, ?)"
    ).run(email.toLowerCase().trim(), hash, market || null, name || null, isFounder);

    // If a market was assigned, mark it as taken
    if (market) {
      db.prepare("UPDATE markets SET status = 'taken' WHERE name = ?").run(market);
    }

    res.status(201).json({
      id: result.lastInsertRowid,
      email: email.toLowerCase().trim(),
      name: name || null,
      market: market || null,
      role: 'subscriber',
      isFounder
    });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw err;
  }
});

// PUT /api/admin/subscribers/:id — update subscriber name, email, market, optional password
router.put('/subscribers/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, email, market, password } = req.body || {};

  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'subscriber'").get(id);
  if (!user) return res.status(404).json({ error: 'Subscriber not found' });

  const newEmail = email ? email.toLowerCase().trim() : user.email;
  const newName = name !== undefined ? name : user.name;
  const newMarket = market !== undefined ? market : user.market;
  const newHash = password ? bcrypt.hashSync(password, 10) : user.password;

  try {
    db.prepare(
      'UPDATE users SET email = ?, name = ?, market = ?, password = ? WHERE id = ?'
    ).run(newEmail, newName, newMarket || null, newHash, id);

    // If market changed, update market statuses
    if (market !== undefined && market !== user.market) {
      if (user.market) {
        // Check if anyone else is still in the old market before freeing it
        const oldCount = db.prepare(
          "SELECT COUNT(*) as count FROM users WHERE market = ? AND role = 'subscriber' AND id != ?"
        ).get(user.market, id);
        if (oldCount.count === 0) {
          db.prepare("UPDATE markets SET status = 'available' WHERE name = ?").run(user.market);
        }
      }
      if (newMarket) {
        db.prepare("UPDATE markets SET status = 'taken' WHERE name = ?").run(newMarket);
      }
    }

    res.json({ id, email: newEmail, name: newName, market: newMarket, role: 'subscriber' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw err;
  }
});

// DELETE /api/admin/subscribers/:id — remove a subscriber account
router.delete('/subscribers/:id', (req, res) => {
  const id = Number(req.params.id);

  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'subscriber'").get(id);
  if (!user) return res.status(404).json({ error: 'Subscriber not found' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  // Free up the market if no other subscribers are in it
  if (user.market) {
    const remaining = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE market = ? AND role = 'subscriber'"
    ).get(user.market);
    if (remaining.count === 0) {
      db.prepare("UPDATE markets SET status = 'available' WHERE name = ?").run(user.market);
    }
  }

  res.json({ success: true });
});

// GET /api/admin/markets — list all markets with subscriber counts
router.get('/markets', (req, res) => {
  const markets = db.prepare('SELECT * FROM markets ORDER BY name').all();

  const result = markets.map(m => {
    const countRow = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE market = ? AND role = 'subscriber'"
    ).get(m.name);
    return { ...m, subscriberCount: countRow.count };
  });

  res.json(result);
});

// POST /api/admin/markets — create a new market
router.post('/markets', (req, res) => {
  const { name, cities } = req.body || {};

  if (!name || !cities) {
    return res.status(400).json({ error: 'Market name and cities are required' });
  }

  try {
    const result = db.prepare(
      "INSERT INTO markets (name, cities, status) VALUES (?, ?, 'available')"
    ).run(name, cities);
    res.status(201).json({ id: result.lastInsertRowid, name, cities, status: 'available', subscriberCount: 0 });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A market with this name already exists' });
    }
    throw err;
  }
});

// PUT /api/admin/markets/:id — update market cities or status
router.put('/markets/:id', (req, res) => {
  const { name, cities, status } = req.body || {};
  const id = Number(req.params.id);

  const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(id);
  if (!market) return res.status(404).json({ error: 'Market not found' });

  db.prepare(
    'UPDATE markets SET name = ?, cities = ?, status = ? WHERE id = ?'
  ).run(name || market.name, cities || market.cities, status || market.status, id);

  const updated = db.prepare('SELECT * FROM markets WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/admin/markets/:id — delete market (fails if active subscribers exist)
router.delete('/markets/:id', (req, res) => {
  const id = Number(req.params.id);

  const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(id);
  if (!market) return res.status(404).json({ error: 'Market not found' });

  const countRow = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE market = ? AND role = 'subscriber'"
  ).get(market.name);

  if (countRow.count > 0) {
    return res.status(400).json({
      error: `Cannot delete — ${countRow.count} active subscriber(s) assigned to this market`
    });
  }

  db.prepare('DELETE FROM markets WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET /api/admin/waitlist — all waitlist signups + city hotspot stats
router.get('/waitlist', (req, res) => {
  const signups = db.prepare('SELECT * FROM waitlist ORDER BY createdAt DESC').all();
  const cityStats = db.prepare(
    'SELECT city, COUNT(*) as count FROM waitlist GROUP BY city ORDER BY count DESC'
  ).all();
  res.json({ signups, cityStats, total: signups.length });
});

// GET /api/admin/waitlist/export — CSV download
router.get('/waitlist/export', (req, res) => {
  const signups = db.prepare('SELECT * FROM waitlist ORDER BY createdAt DESC').all();
  const headers = ['id', 'name', 'email', 'phone', 'city', 'monthlyRevenue', 'leadSources', 'monthlyLeadSpend', 'createdAt'];
  const rows = signups.map(s => headers.map(h => JSON.stringify(s[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="legenly-waitlist.csv"');
  res.send(csv);
});

module.exports = router;
