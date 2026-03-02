const express = require('express');
const router = express.Router();
const { db } = require('../db/setup');
const { requireAuth } = require('../middleware/auth');

// All pipeline routes require auth
router.use(requireAuth);

// GET /api/pipeline/contacts
router.get('/contacts', (req, res) => {
  try {
    const contacts = db.prepare(`
      SELECT * FROM pipeline_contacts ORDER BY createdAt DESC
    `).all();
    res.json(contacts);
  } catch (err) {
    console.error('[Pipeline] Get contacts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/pipeline/contacts
router.post('/contacts', (req, res) => {
  const { name, phone, email, source, stage, notes, followUpAt, dealValue } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO pipeline_contacts (name, phone, email, source, stage, notes, followUpAt, dealValue, addedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      phone || null,
      email || null,
      source || 'Other',
      stage || 'new',
      notes || null,
      followUpAt || null,
      dealValue || 997,
      req.user.id
    );

    const contact = db.prepare('SELECT * FROM pipeline_contacts WHERE id = ?').get(result.lastInsertRowid);
    res.json(contact);
  } catch (err) {
    console.error('[Pipeline] Add contact error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/pipeline/contacts/:id
router.patch('/contacts/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const allowed = ['name', 'phone', 'email', 'source', 'stage', 'notes', 'followUpAt', 'dealValue'];

  const updates = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => `${k} = ?`);

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const values = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => fields[k]);

  try {
    db.prepare(`
      UPDATE pipeline_contacts SET ${updates.join(', ')}, updatedAt = datetime('now') WHERE id = ?
    `).run(...values, id);

    const contact = db.prepare('SELECT * FROM pipeline_contacts WHERE id = ?').get(id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    res.json(contact);
  } catch (err) {
    console.error('[Pipeline] Update contact error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/pipeline/contacts/:id
router.delete('/contacts/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM pipeline_contacts WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
