const express = require('express');
const { db } = require('../db/setup');

const router = express.Router();

// POST /api/waitlist/join — public, no auth
router.post('/join', (req, res) => {
  const { name, email, phone, city, monthlyRevenue, leadSources, monthlyLeadSpend } = req.body || {};

  if (!name || !email || !city) {
    return res.status(400).json({ error: 'Name, email, and city are required' });
  }

  const emailNorm = email.toLowerCase().trim();

  // Upsert: if same email signs up again, update their info
  const existing = db.prepare('SELECT id FROM waitlist WHERE email = ?').get(emailNorm);

  if (existing) {
    db.prepare(`
      UPDATE waitlist SET name = ?, phone = ?, city = ?, monthlyRevenue = ?,
      leadSources = ?, monthlyLeadSpend = ? WHERE id = ?
    `).run(name, phone || null, city.trim(), monthlyRevenue || null,
           Array.isArray(leadSources) ? leadSources.join(',') : (leadSources || null),
           monthlyLeadSpend || null, existing.id);
    return res.json({ success: true, message: 'Updated' });
  }

  db.prepare(`
    INSERT INTO waitlist (name, email, phone, city, monthlyRevenue, leadSources, monthlyLeadSpend)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    emailNorm,
    phone || null,
    city.trim(),
    monthlyRevenue || null,
    Array.isArray(leadSources) ? leadSources.join(',') : (leadSources || null),
    monthlyLeadSpend || null
  );

  res.status(201).json({ success: true, message: 'Joined waitlist' });
});

// GET /api/waitlist/city-count — public, returns total count + city breakdown
// (used by the landing page to show social proof numbers)
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM waitlist').get().count;
  const cities = db.prepare(
    'SELECT city, COUNT(*) as count FROM waitlist GROUP BY city ORDER BY count DESC LIMIT 10'
  ).all();
  res.json({ total, cities });
});

module.exports = router;
