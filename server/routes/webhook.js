const express = require('express');
const { db } = require('../db/setup');

const router = express.Router();

function normalizeCity(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * POST /api/webhook/lead
 *
 * Zapier webhook endpoint. Accepts a lead payload, auto-assigns it to
 * the correct market based on city, and fires a Socket.io newLead event.
 *
 * Expected body:
 *   { name, phone, email, city, state, jobType, description }
 */
router.post('/lead', (req, res) => {
  const timestamp = new Date().toISOString();
  const body = req.body || {};

  console.log(`[Webhook] ${timestamp} — Incoming lead:`, JSON.stringify(body));

  try {
    const name = body.name;
    const phone = body.phone || null;
    const email = body.email || null;
    const city = body.city;
    const state = body.state || null;
    const jobType = body.jobType || body.job_type || null;
    const description = body.description || null;

    if (!name || !city) {
      return res.status(400).json({ error: 'name and city are required' });
    }

    // Auto-assign to market by matching city to a market's city list
    const markets = db.prepare('SELECT * FROM markets').all();
    let assignedMarket = 'Unassigned';
    const incomingCity = normalizeCity(city);

    for (const market of markets) {
      const cityList = market.cities.split(',').map(c => normalizeCity(c));
      if (cityList.includes(incomingCity)) {
        assignedMarket = market.name;
        break;
      }
    }

    console.log(`[Webhook] ${timestamp} — Assigned to market: "${assignedMarket}"`);

    const result = db.prepare(`
      INSERT INTO leads (name, phone, email, city, state, jobType, description, market, assignedMarket, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).run(name, phone, email, city, state, jobType, description, assignedMarket, assignedMarket);

    const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

    // Emit real-time event to the assigned market room
    req.app.locals.io?.to(assignedMarket).emit('newLead', newLead);

    res.status(200).json({
      status: 'ok',
      leadId: newLead.id,
      market: assignedMarket,
      message: 'Lead assigned successfully'
    });
  } catch (err) {
    console.error(`[Webhook] ${timestamp} — Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
