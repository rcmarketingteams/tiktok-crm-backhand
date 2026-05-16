const express = require('express');
const router = express.Router();

const USERS = [
  {
    username: process.env.CRM_USERNAME || 'rcmarketingteams',
    password: process.env.CRM_PASSWORD || 'marketingteam@!',
    role: 'admin',
    displayName: 'RC Marketing Admin'
  }
];

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password diperlukan' });
  }

  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Username atau password salah' });
  }

  res.json({
    success: true,
    user: {
      username: user.username,
      role: user.role,
      displayName: user.displayName
    },
    token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
  });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth) return res.status(401).json({ success: false });
  res.json({ success: true });
});

module.exports = router;
