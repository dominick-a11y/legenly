const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/setup');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

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
