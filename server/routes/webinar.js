const express = require('express');
const router = express.Router();
const { db } = require('../db/setup');

// POST /api/webinar/register
router.post('/register', (req, res) => {
  const { name, email, phone, business } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM webinar_registrations WHERE email = ?').get(email);
    if (existing) {
      // Already registered — still return success (idempotent)
      return res.json({ success: true, alreadyRegistered: true });
    }

    const stmt = db.prepare(`
      INSERT INTO webinar_registrations (name, email, phone, business)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, phone || null, business || null);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('[Webinar] Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/webinar/registrations — list all (admin use)
router.get('/registrations', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM webinar_registrations ORDER BY createdAt DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/webinar/stats — count for social proof
router.get('/stats', (req, res) => {
  try {
    const { count } = db.prepare('SELECT COUNT(*) as count FROM webinar_registrations').get();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
