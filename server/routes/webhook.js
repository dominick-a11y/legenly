const express = require('express');
const https = require('https');
const { db } = require('../db/setup');

const router = express.Router();

function normalizeCity(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Shared logic: insert a lead into the DB and emit a real-time event.
 */
function processLead({ app, name, phone, email, city, state, jobType, description, source }) {
  const timestamp = new Date().toISOString();

  if (!name || !city) throw new Error('name and city are required');

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

  console.log(`[Webhook/${source}] ${timestamp} — Assigned "${name}" in "${city}" to market: "${assignedMarket}"`);

  const result = db.prepare(`
    INSERT INTO leads (name, phone, email, city, state, jobType, description, market, assignedMarket, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
  `).run(name, phone, email, city, state, jobType, description, assignedMarket, assignedMarket);

  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  app.locals.io?.to(assignedMarket).emit('newLead', newLead);

  return { leadId: newLead.id, market: assignedMarket };
}

/**
 * Fetch full lead data from the Facebook Graph API using a leadgen_id.
 */
function fetchFacebookLead(leadgenId, pageAccessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(pageAccessToken)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse Facebook Graph API response')); }
      });
    }).on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Facebook Lead Ads — Direct webhook (no Zapier needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/webhook/facebook
 *
 * Facebook webhook verification handshake.
 * Set FACEBOOK_VERIFY_TOKEN to any secret string you choose.
 * In the Facebook Developer Portal → Webhooks → add this URL and the same token.
 */
router.get('/facebook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log('[Facebook] Webhook verified successfully');
    return res.status(200).send(challenge);
  }
  console.warn('[Facebook] Webhook verification failed — token mismatch');
  return res.status(403).json({ error: 'Verification failed' });
});

/**
 * POST /api/webhook/facebook
 *
 * Facebook sends a notification here every time a lead fills out your
 * Lead Ad form. We immediately respond 200 (required by Facebook), then
 * asynchronously fetch the full lead data from the Graph API and insert it.
 *
 * Required env vars:
 *   FACEBOOK_VERIFY_TOKEN     — any secret string (used above for verification)
 *   FACEBOOK_PAGE_ACCESS_TOKEN — from Facebook Developer Portal → your Page token
 */
router.post('/facebook', (req, res) => {
  // Facebook requires an immediate 200 response
  res.status(200).json({ status: 'ok' });

  const body = req.body;
  if (body?.object !== 'page') return;

  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageToken) {
    console.error('[Facebook] FACEBOOK_PAGE_ACCESS_TOKEN not set — cannot fetch lead data');
    return;
  }

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen') continue;

      const leadgenId = change.value?.leadgen_id;
      if (!leadgenId) continue;

      console.log(`[Facebook] Incoming leadgen_id: ${leadgenId}`);

      fetchFacebookLead(leadgenId, pageToken)
        .then(leadData => {
          if (leadData.error) {
            console.error('[Facebook] Graph API error:', leadData.error.message);
            return;
          }

          // Facebook field_data is an array of { name, values } objects
          const fields = {};
          for (const f of leadData.field_data || []) {
            fields[f.name] = f.values?.[0] || '';
          }

          // Map common Facebook field names to our schema
          const firstName = fields.first_name || '';
          const lastName  = fields.last_name  || '';
          const name = fields.full_name ||
            (firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown');

          const phone       = fields.phone_number || fields.phone || null;
          const email       = fields.email || null;
          const city        = fields.city || fields.location || fields.zip_code || 'Unknown';
          const state       = fields.state || null;
          const jobType     = fields.job_type || fields.service_type || fields.service_needed || null;
          const description = fields.describe_your_project || fields.notes || fields.message || null;

          processLead({ app: req.app, name, phone, email, city, state, jobType, description, source: 'Facebook' });
        })
        .catch(err => {
          console.error('[Facebook] Failed to fetch lead from Graph API:', err.message);
        });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/webhook/lead
 *
 * Generic webhook endpoint (kept for backward compatibility / manual testing).
 * Expected body: { name, phone, email, city, state, jobType, description }
 */
router.post('/lead', (req, res) => {
  const timestamp = new Date().toISOString();
  const body = req.body || {};

  // Validate webhook secret if configured
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers['x-webhook-secret'];
    if (provided !== secret) {
      console.warn(`[Webhook] ${timestamp} — Rejected: invalid or missing x-webhook-secret`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log(`[Webhook] ${timestamp} — Incoming lead:`, JSON.stringify(body));

  try {
    const { leadId, market } = processLead({
      app: req.app,
      name:        body.name,
      phone:       body.phone || null,
      email:       body.email || null,
      city:        body.city,
      state:       body.state || null,
      jobType:     body.jobType || body.job_type || null,
      description: body.description || null,
      source:      'Generic',
    });

    res.status(200).json({ status: 'ok', leadId, market, message: 'Lead assigned successfully' });
  } catch (err) {
    console.error(`[Webhook] ${timestamp} — Error:`, err.message);
    res.status(err.message.includes('required') ? 400 : 500).json({ error: err.message });
  }
});

module.exports = router;
