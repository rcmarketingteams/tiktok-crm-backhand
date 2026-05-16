const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const leadsRouter = require('./routes/leads');
const accountsRouter = require('./routes/accounts');
const webhookRouter = require('./routes/webhook');
const authRouter = require('./routes/auth');

app.use('/api/leads', leadsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/webhook', webhookRouter);
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'TikTok Leads CRM — RC Marketing',
    version: '1.0.0',
    endpoints: {
      auth: 'POST /api/auth/login',
      leads: 'GET /api/leads',
      accounts: 'GET /api/accounts',
      webhook: 'POST /webhook/tiktok/:accountId'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`RC Marketing CRM Backend running on port ${PORT}`);
});

module.exports = app;
