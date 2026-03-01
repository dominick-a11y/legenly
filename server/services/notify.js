/**
 * Notification service — SMS via Twilio + console fallback
 * Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */

const JOB_LABELS = {
  Garage: 'Garage Cleanout',
  Estate: 'Estate Cleanout',
  Appliance: 'Appliance Removal',
  Commercial: 'Commercial Cleanout',
  Other: 'Junk Removal'
};

function buildSmsBody(lead) {
  const job = JOB_LABELS[lead.jobType] || lead.jobType || 'Junk Removal';
  const location = [lead.city, lead.state].filter(Boolean).join(', ');
  const preview = lead.description
    ? lead.description.slice(0, 80) + (lead.description.length > 80 ? '…' : '')
    : '';

  return [
    `🚛 New Legenly Lead — ${job}`,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone || 'not provided'}`,
    location ? `Location: ${location}` : null,
    preview ? `"${preview}"` : null,
    `Log in at legenly.io to view and claim.`
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendSms(toNumber, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.log('[Notify] Twilio not configured — SMS skipped. Would have sent to:', toNumber);
    console.log('[Notify] Message preview:\n', body);
    return;
  }

  // Lazy-load twilio only when configured so the app still starts without it
  let twilio;
  try {
    twilio = require('twilio');
  } catch {
    console.warn('[Notify] twilio package not installed — run: npm install twilio --prefix server');
    return;
  }

  const client = twilio(sid, token);
  try {
    await client.messages.create({ body, from, to: toNumber });
    console.log(`[Notify] SMS sent to ${toNumber}`);
  } catch (err) {
    console.error(`[Notify] SMS failed to ${toNumber}:`, err.message);
  }
}

/**
 * Notify all subscribers in a market about a new lead.
 * @param {object} lead  - The saved lead row
 * @param {object} db    - better-sqlite3 db instance
 */
async function notifyMarketOperators(lead, db) {
  if (!lead.market) return;

  const operators = db
    .prepare("SELECT id, name, phone, email FROM users WHERE role = 'subscriber' AND market = ?")
    .all(lead.market);

  if (operators.length === 0) {
    console.log(`[Notify] No operators in market "${lead.market}" — lead saved but not sent`);
    return;
  }

  const body = buildSmsBody(lead);

  for (const op of operators) {
    if (op.phone) {
      await sendSms(op.phone, body);
    } else {
      console.log(`[Notify] Operator ${op.name} (id ${op.id}) has no phone — SMS skipped`);
    }
  }
}

module.exports = { notifyMarketOperators };
