const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/setup');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth/markets — list territories available for signup
router.get('/markets', (req, res) => {
  const markets = db
    .prepare("SELECT name, cities FROM markets WHERE status = 'available' ORDER BY name")
    .all();
  res.json(markets);
});

// POST /api/auth/register — self-serve account creation
router.post('/register', (req, res) => {
  const { name, email, password, market } = req.body || {};

  if (!name || !email || !password || !market) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const mkt = db
    .prepare("SELECT * FROM markets WHERE name = ? AND status = 'available'")
    .get(market);
  if (!mkt) {
    return res.status(409).json({ error: 'This territory is no longer available.' });
  }

  const hash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare("INSERT INTO users (email, password, role, market, name) VALUES (?, ?, 'subscriber', ?, ?)")
    .run(email.toLowerCase().trim(), hash, market, name.trim());

  db.prepare("UPDATE markets SET status = 'taken' WHERE name = ?").run(market);

  const payload = {
    id: result.lastInsertRowid,
    email: email.toLowerCase().trim(),
    role: 'subscriber',
    market,
    name: name.trim(),
    isFounder: 0
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: payload });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    market: user.market,
    name: user.name,
    isFounder: user.isFounder || 0
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user: payload });
});

// GET /api/auth/onboarding-status
router.get('/onboarding-status', requireAuth, (req, res) => {
  const row = db.prepare('SELECT dismissed FROM onboarding WHERE userId = ?').get(req.user.id);
  res.json({ dismissed: row ? row.dismissed === 1 : false });
});

// POST /api/auth/dismiss-onboarding — mark dismissed + optionally save phone/jobFocus
router.post('/dismiss-onboarding', requireAuth, (req, res) => {
  const { phone, jobFocus } = req.body || {};

  if (phone !== undefined || jobFocus !== undefined) {
    db.prepare(
      'UPDATE users SET phone = COALESCE(?, phone), jobFocus = COALESCE(?, jobFocus) WHERE id = ?'
    ).run(phone || null, jobFocus || null, req.user.id);
  }

  db.prepare(`
    INSERT INTO onboarding (userId, dismissed, dismissedAt)
    VALUES (?, 1, datetime('now'))
    ON CONFLICT(userId) DO UPDATE SET dismissed = 1, dismissedAt = datetime('now')
  `).run(req.user.id);
  res.json({ success: true });
});

// PUT /api/auth/profile — update name, phone, jobFocus for logged-in user
router.put('/profile', requireAuth, (req, res) => {
  const { name, phone, jobFocus } = req.body || {};
  db.prepare(
    'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), jobFocus = COALESCE(?, jobFocus) WHERE id = ?'
  ).run(name || null, phone || null, jobFocus || null, req.user.id);
  res.json({ success: true });
});

module.exports = router;
