const express = require('express');
const router = express.Router();
const { db } = require('../db/setup');

// POST /api/bundle/reserve — capture a bundle purchase intent
router.post('/reserve', (req, res) => {
  const { name, email, phone, city } = req.body;

  if (!name || !email || !phone || !city) {
    return res.status(400).json({ error: 'name, email, phone, and city are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM bundle_reservations WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'This email has already reserved a spot.' });
    }

    const stmt = db.prepare(`
      INSERT INTO bundle_reservations (name, email, phone, city)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, phone, city);

    // Emit to admin socket if available
    const io = req.app.locals.io;
    if (io) {
      io.to('admin').emit('bundle:new', { id: result.lastInsertRowid, name, email, city });
    }

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('[Bundle] Reserve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bundle/reservations — admin only, list all
router.get('/reservations', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM bundle_reservations ORDER BY createdAt DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
