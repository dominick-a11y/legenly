const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../db/setup');
const { requireAuth } = require('../middleware/auth');
const { notifyMarketOperators } = require('../services/notify');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const router = express.Router();

// ─── PUBLIC: POST /api/leads/public — homeowner submits a quote request ─────
// No auth required. Routes the lead to the right market based on city.
router.post('/public', async (req, res) => {
  const { name, phone, email, city, state, jobType, description } = req.body || {};

  if (!name || !phone || !city) {
    return res.status(400).json({ error: 'Name, phone, and city are required.' });
  }

  // Find which market covers this city (case-insensitive match)
  const markets = db.prepare('SELECT * FROM markets').all();
  const normalizedCity = city.trim().toLowerCase();

  let matchedMarket = null;
  for (const m of markets) {
    const marketCities = m.cities.split(',').map(c => c.trim().toLowerCase());
    if (marketCities.includes(normalizedCity)) {
      matchedMarket = m.name;
      break;
    }
  }

  const result = db.prepare(`
    INSERT INTO leads (name, phone, email, city, state, jobType, description, market, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
  `).run(
    name.trim(),
    phone.trim(),
    email?.trim() || null,
    city.trim(),
    state?.trim() || null,
    jobType || null,
    description?.trim() || null,
    matchedMarket
  );

  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

  // Real-time push to operator dashboard (if market matched)
  if (matchedMarket) {
    req.app.locals.io?.to(matchedMarket).emit('newLead', newLead);
  }

  // SMS/notify operators async — don't block the response
  notifyMarketOperators(newLead, db).catch(err =>
    console.error('[Public Lead] Notify error:', err.message)
  );

  res.status(201).json({ success: true, id: newLead.id });
});

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

// POST /api/leads/:id/ai-pitch — generate AI sales assist for this lead
router.post('/:id/ai-pitch', requireAuth, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI assist is not configured. Add ANTHROPIC_API_KEY to your environment.' });
  }

  const leadId = Number(req.params.id);
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role !== 'admin' && lead.market !== req.user.market) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const firstName = lead.name?.split(' ')[0] || lead.name || 'there';
  const jobSummary = [
    lead.jobType ? `Job type: ${lead.jobType} cleanout` : '',
    lead.city ? `Location: ${lead.city}${lead.state ? ', ' + lead.state : ''}` : '',
    lead.description ? `Their description: "${lead.description}"` : ''
  ].filter(Boolean).join('\n');

  const prompt = `You are a sales coach for a junk removal operator. A new lead just came in. Help the operator close this job with a personalized, conversational sales approach.

Lead details:
- Name: ${lead.name}
- ${jobSummary}

Generate a sales assist in this exact JSON format (respond ONLY with valid JSON, no other text):
{
  "opening": "A personalized 1-2 sentence opening line the operator should say when they call. Use the customer's first name (${firstName}). Reference the specific job details — make it feel like you actually read their request, not a template.",
  "keyPoints": ["Short point 1 (1 sentence)", "Short point 2", "Short point 3"],
  "objections": [
    { "objection": "Most likely objection they'll raise", "rebuttal": "How to handle it in 1-2 sentences" },
    { "objection": "Second likely objection", "rebuttal": "How to handle it" }
  ],
  "priceRange": "Suggested price range for this specific job (e.g. '$350–$550') with a brief reason",
  "closeLines": "A strong 1-sentence close to book the job before hanging up"
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content[0]?.text || '';
    // Extract JSON even if there's surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI returned unexpected format' });
    }

    const pitch = JSON.parse(jsonMatch[0]);
    res.json(pitch);
  } catch (err) {
    console.error('[AI Pitch] Error:', err.message);
    res.status(500).json({ error: 'AI assist failed. Please try again.' });
  }
});

module.exports = router;
