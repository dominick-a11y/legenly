const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { db } = require('../db/setup');
const { requireAuth } = require('../middleware/auth');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith('sk_test_<') || key === 'sk_test_placeholder') {
    return null;
  }
  return new Stripe(key);
}

// ─── POST /api/billing/create-checkout ───────────────────────────────────────
// Creates a Stripe checkout session for the $500/mo subscription

router.post('/create-checkout', requireAuth, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing not configured yet.' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: String(user.id), market: user.market || '' },
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripeCustomerId = ? WHERE id = ?')
        .run(customerId, user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Legenly Territory Subscription',
            description: user.market
              ? `Exclusive lead territory: ${user.market}`
              : 'Exclusive lead territory subscription',
          },
          unit_amount: 50000, // $500.00
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${CLIENT_URL}/dashboard?billing=success`,
      cancel_url:  `${CLIENT_URL}/dashboard?billing=cancelled`,
      metadata: { userId: String(user.id), market: user.market || '' },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Billing] Checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ─── POST /api/billing/portal ────────────────────────────────────────────────
// Opens Stripe's hosted billing portal (cancel, update card, view invoices)

router.post('/portal', requireAuth, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing not configured yet.' });
  try {
    const user = db.prepare('SELECT stripeCustomerId FROM users WHERE id = ?').get(req.user.id);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found. Subscribe first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${CLIENT_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Billing] Portal error:', err.message);
    res.status(500).json({ error: 'Failed to open billing portal' });
  }
});

// ─── GET /api/billing/status ─────────────────────────────────────────────────
// Returns current subscription status for the logged-in operator

router.get('/status', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT subscriptionStatus, stripeCustomerId, stripeSubscriptionId FROM users WHERE id = ?'
  ).get(req.user.id);

  res.json({
    status:      user?.subscriptionStatus || 'none',
    hasCustomer: !!user?.stripeCustomerId,
    hasSub:      !!user?.stripeSubscriptionId,
  });
});

// ─── POST /api/billing/webhook ───────────────────────────────────────────────
// Raw body handler — must be mounted BEFORE express.json() in index.js
// Handles: subscription created, updated, cancelled, payment failed

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = getStripe();

    let event;
    try {
      event = (stripe && secret)
        ? stripe.webhooks.constructEvent(req.body, sig, secret)
        : JSON.parse(req.body.toString());
    } catch (err) {
      console.error('[Billing] Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const obj = event.data.object;
    console.log(`[Billing] Webhook: ${event.type}`);

    switch (event.type) {

      case 'checkout.session.completed': {
        const userId = obj.metadata?.userId;
        if (userId && obj.subscription) {
          db.prepare(
            'UPDATE users SET stripeSubscriptionId = ?, subscriptionStatus = ? WHERE id = ?'
          ).run(obj.subscription, 'active', parseInt(userId));
          console.log(`[Billing] Activated subscription for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const user = db.prepare(
          'SELECT id FROM users WHERE stripeCustomerId = ?'
        ).get(obj.customer);
        if (user) {
          db.prepare('UPDATE users SET subscriptionStatus = ? WHERE id = ?')
            .run(obj.status, user.id);
          console.log(`[Billing] Subscription ${obj.status} for user ${user.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const user = db.prepare(
          'SELECT id FROM users WHERE stripeCustomerId = ?'
        ).get(obj.customer);
        if (user) {
          db.prepare(
            'UPDATE users SET subscriptionStatus = ?, stripeSubscriptionId = NULL WHERE id = ?'
          ).run('cancelled', user.id);
          console.log(`[Billing] Subscription cancelled for user ${user.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const user = db.prepare(
          'SELECT id FROM users WHERE stripeCustomerId = ?'
        ).get(obj.customer);
        if (user) {
          db.prepare('UPDATE users SET subscriptionStatus = ? WHERE id = ?')
            .run('past_due', user.id);
          console.log(`[Billing] Payment failed for user ${user.id}`);
        }
        break;
      }

      case 'invoice.paid': {
        const user = db.prepare(
          'SELECT id FROM users WHERE stripeCustomerId = ?'
        ).get(obj.customer);
        if (user) {
          db.prepare('UPDATE users SET subscriptionStatus = ? WHERE id = ?')
            .run('active', user.id);
        }
        break;
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;
