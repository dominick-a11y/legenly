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

// POST /api/leads/:id/reminder — set a callback reminder for this lead
router.post('/:id/reminder', requireAuth, (req, res) => {
  const leadId = Number(req.params.id);
  const userId = req.user.id;
  const { remindAt, note } = req.body || {};

  if (!remindAt) return res.status(400).json({ error: 'remindAt is required' });

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role !== 'admin' && lead.market !== req.user.market) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Replace any existing reminder for this user+lead
  db.prepare('DELETE FROM lead_reminders WHERE leadId = ? AND userId = ?').run(leadId, userId);
  const result = db.prepare(
    'INSERT INTO lead_reminders (leadId, userId, remindAt, note) VALUES (?, ?, ?, ?)'
  ).run(leadId, userId, remindAt, note || null);

  res.status(201).json({ id: result.lastInsertRowid, leadId, userId, remindAt, note });
});

// GET /api/leads/reminders/today — reminders due today for current user
router.get('/reminders/today', requireAuth, (req, res) => {
  const userId = req.user.id;
  const rows = db.prepare(`
    SELECT r.*, l.name as leadName, l.phone as leadPhone, l.jobType, l.status as leadStatus, l.market
    FROM lead_reminders r
    JOIN leads l ON l.id = r.leadId
    WHERE r.userId = ?
      AND date(r.remindAt) <= date('now')
    ORDER BY r.remindAt ASC
  `).all(userId);
  res.json(rows);
});

// DELETE /api/leads/reminders/:id — dismiss a reminder
router.delete('/reminders/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM lead_reminders WHERE id = ? AND userId = ?').run(
    Number(req.params.id), req.user.id
  );
  res.json({ success: true });
});

module.exports = router;
