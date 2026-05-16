const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getDB, saveDB } = require('../db');

function verifyTikTokSignature(req, secret) {
  try {
    const signature = req.headers['x-tiktok-signature'] || '';
    const timestamp = req.headers['x-tiktok-timestamp'] || '';
    const nonce = req.headers['x-tiktok-nonce'] || '';
    const body = JSON.stringify(req.body);
    const strToSign = `${timestamp}\n${nonce}\n${body}\n`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(strToSign)
      .digest('hex');
    return signature === expected;
  } catch (e) {
    return false;
  }
}

// POST /webhook/tiktok/:accountId
router.post('/tiktok/:accountId', (req, res) => {
  const { accountId } = req.params;
  const db = getDB();

  const account = db.accounts.find(a => a.id === accountId);
  if (!account) {
    console.warn(`[Webhook] Unknown account: ${accountId}`);
    return res.status(404).json({ success: false, error: 'Account not found' });
  }

  // Verify signature if app_secret is set
  if (account.appSecret) {
    const valid = verifyTikTokSignature(req, account.appSecret);
    if (!valid) {
      console.warn(`[Webhook] Invalid signature for account: ${accountId}`);
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
  }

  const payload = req.body;
  console.log(`[Webhook] Received from TikTok for account ${account.name}:`, JSON.stringify(payload));

  // TikTok Lead Generation webhook format
  // field_data is an array of { name, value } objects
  let name = '';
  let phone = '';
  let email = '';

  if (payload.field_data && Array.isArray(payload.field_data)) {
    payload.field_data.forEach(field => {
      const key = (field.name || '').toLowerCase();
      const val = field.value || '';
      if (key.includes('name') || key === 'full_name') name = val;
      if (key.includes('phone') || key.includes('mobile')) phone = val;
      if (key.includes('email')) email = val;
    });
  }

  // Fallback for flat format
  if (!name) name = payload.full_name || payload.name || 'Unknown';
  if (!phone) phone = payload.phone_number || payload.phone || '-';
  if (!email) email = payload.email || '-';

  const newLead = {
    id: String(db.nextLeadId++),
    name,
    phone,
    email,
    source: account.name,
    accountId,
    status: 'Baru',
    pic: '-',
    tiktokLeadId: payload.lead_id || null,
    formId: payload.form_id || null,
    rawData: payload,
    createdAt: new Date().toISOString()
  };

  db.leads.push(newLead);
  saveDB(db);

  console.log(`[Webhook] Lead saved: ${name} (${phone}) from ${account.name}`);
  res.json({ success: true, leadId: newLead.id });
});

// GET /webhook/verify — TikTok webhook verification challenge
router.get('/tiktok/:accountId', (req, res) => {
  const challenge = req.query.hub_challenge || req.query.challenge || 'verified';
  res.send(challenge);
});

module.exports = router;
