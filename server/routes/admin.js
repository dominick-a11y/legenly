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
  req.app.locals.io?.to(market).emit('new-lead', newLead);

  res.status(201).json(newLead);
});

// GET /api/admin/subscribers — list all subscriber accounts
router.get('/subscribers', (req, res) => {
  const subscribers = db.prepare(
    "SELECT id, name, email, market, role, createdAt FROM users WHERE role = 'subscriber' ORDER BY createdAt DESC"
  ).all();
  res.json(subscribers);
});

// POST /api/admin/subscribers — create a new subscriber account
router.post('/subscribers', (req, res) => {
  const { email, password, name, market } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(
      "INSERT INTO users (email, password, role, market, name) VALUES (?, ?, 'subscriber', ?, ?)"
    ).run(email.toLowerCase().trim(), hash, market || null, name || null);

    res.status(201).json({
      id: result.lastInsertRowid,
      email: email.toLowerCase().trim(),
      name: name || null,
      market: market || null,
      role: 'subscriber'
    });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw err;
  }
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
    const result = db.prepare('INSERT INTO markets (name, cities) VALUES (?, ?)').run(name, cities);
    res.status(201).json({ id: result.lastInsertRowid, name, cities, subscriberCount: 0 });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A market with this name already exists' });
    }
    throw err;
  }
});

module.exports = router;
