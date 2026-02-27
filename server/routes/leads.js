const express = require('express');
const { db } = require('../db/setup');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/leads — returns leads for the authenticated subscriber's market
router.get('/', requireAuth, (req, res) => {
  const { market, role } = req.user;

  if (role === 'admin') {
    const leads = db.prepare('SELECT * FROM leads ORDER BY createdAt DESC').all();
    return res.json(leads);
  }

  if (!market) {
    return res.status(403).json({ error: 'No market assigned to your account' });
  }

  const leads = db
    .prepare('SELECT * FROM leads WHERE market = ? ORDER BY createdAt DESC')
    .all(market);

  res.json(leads);
});

// PUT /api/leads/:id/status — update lead status (new / called / closed)
router.put('/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!['new', 'called', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be one of: new, called, closed' });
  }

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(id));
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  // Subscribers can only update leads in their own market
  if (req.user.role !== 'admin' && lead.market !== req.user.market) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, Number(id));
  res.json({ success: true, id: Number(id), status });
});

module.exports = router;
