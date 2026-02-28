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

// PUT /api/leads/:id/note — upsert a note for a lead (one note per user per lead)
router.put('/:id/note', requireAuth, (req, res) => {
  const { id } = req.params;
  const { note } = req.body || {};
  const userId = req.user.id;
  const leadId = Number(id);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  if (req.user.role !== 'admin' && lead.market !== req.user.market) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const existing = db.prepare('SELECT id FROM lead_notes WHERE leadId = ? AND userId = ?').get(leadId, userId);

  if (existing) {
    db.prepare("UPDATE lead_notes SET note = ?, updatedAt = datetime('now') WHERE leadId = ? AND userId = ?")
      .run(note || '', leadId, userId);
  } else {
    db.prepare('INSERT INTO lead_notes (leadId, userId, note) VALUES (?, ?, ?)')
      .run(leadId, userId, note || '');
  }

  const saved = db.prepare('SELECT * FROM lead_notes WHERE leadId = ? AND userId = ?').get(leadId, userId);
  res.json(saved);
});

// GET /api/leads/:id/note — get note for a lead (current user)
router.get('/:id/note', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const row = db.prepare('SELECT * FROM lead_notes WHERE leadId = ? AND userId = ?').get(Number(id), userId);
  res.json({ note: row?.note || '' });
});

module.exports = router;
