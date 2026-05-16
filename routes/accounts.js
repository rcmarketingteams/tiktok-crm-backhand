const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

// GET /api/accounts
router.get('/', (req, res) => {
  const db = getDB();
  // Return accounts without exposing appSecret
  const safe = db.accounts.map(({ appSecret, ...rest }) => ({
    ...rest,
    hasSecret: !!appSecret
  }));
  res.json({ success: true, accounts: safe });
});

// POST /api/accounts — add new TikTok business account
router.post('/', (req, res) => {
  const { name, appId, appSecret, accessToken, advertiserId } = req.body;
  if (!name || !appId) {
    return res.status(400).json({ success: false, error: 'name and appId are required' });
  }

  const db = getDB();

  const duplicate = db.accounts.find(a => a.appId === appId);
  if (duplicate) {
    return res.status(409).json({ success: false, error: 'Account with this App ID already exists' });
  }

  const id = String(db.nextAccountId++);
  const account = {
    id,
    name,
    appId,
    appSecret: appSecret || '',
    accessToken: accessToken || '',
    advertiserId: advertiserId || '',
    status: 'connected',
    webhookUrl: null,
    createdAt: new Date().toISOString()
  };

  // Generate webhook URL hint (filled after deploy)
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.BASE_URL || 'https://YOUR-APP.railway.app';
  account.webhookUrl = `${baseUrl}/webhook/tiktok/${id}`;

  db.accounts.push(account);
  saveDB(db);

  const { appSecret: _secret, ...safeAccount } = account;
  res.status(201).json({
    success: true,
    account: { ...safeAccount, hasSecret: !!appSecret },
    webhookUrl: account.webhookUrl
  });
});

// PATCH /api/accounts/:id — update account
router.patch('/:id', (req, res) => {
  const db = getDB();
  const account = db.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ success: false, error: 'Account not found' });

  const allowed = ['name', 'appId', 'appSecret', 'accessToken', 'advertiserId', 'status'];
  allowed.forEach(f => { if (req.body[f] !== undefined) account[f] = req.body[f]; });
  account.updatedAt = new Date().toISOString();
  saveDB(db);

  const { appSecret, ...safe } = account;
  res.json({ success: true, account: { ...safe, hasSecret: !!appSecret } });
});

// DELETE /api/accounts/:id
router.delete('/:id', (req, res) => {
  const db = getDB();
  const idx = db.accounts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Account not found' });
  db.accounts.splice(idx, 1);
  saveDB(db);
  res.json({ success: true });
});

module.exports = router;
