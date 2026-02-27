const express = require('express');
const { db } = require('../db/setup');

const router = express.Router();

/**
 * POST /api/webhook/lead
 *
 * Zapier webhook endpoint. Accepts a lead payload, auto-assigns it to
 * the correct market based on city, and fires a Socket.io event.
 *
 * Expected body:
 *   { name, phone, email, city, state, jobType, description }
 *
 * Supports both camelCase (jobType) and snake_case (job_type) field names
 * since Zapier formatting varies by integration.
 */
router.post('/lead', (req, res) => {
  const body = req.body || {};

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
  let assignedMarket = null;

  const normalizedCity = city.trim().toLowerCase();
  for (const market of markets) {
    const cityList = market.cities.split(',').map(c => c.trim().toLowerCase());
    if (cityList.includes(normalizedCity)) {
      assignedMarket = market.name;
      break;
    }
  }

  // If city doesn't match any market, store as Unassigned
  if (!assignedMarket) {
    assignedMarket = 'Unassigned';
    console.warn(`[Webhook] No market found for city: "${city}" — stored as Unassigned`);
  }

  const result = db.prepare(`
    INSERT INTO leads (name, phone, email, city, state, jobType, description, market, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
  `).run(name, phone, email, city, state, jobType, description, assignedMarket);

  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

  // Emit real-time event to the assigned market room
  req.app.locals.io?.to(assignedMarket).emit('new-lead', newLead);

  res.status(200).json({ success: true, lead: newLead, assignedMarket });
});

module.exports = router;
