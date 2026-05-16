const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

// GET /api/leads — fetch all leads with optional filters
router.get('/', (req, res) => {
  const db = getDB();
  let leads = [...db.leads];

  // Filter by accountId
  if (req.query.accountId) {
    leads = leads.filter(l => l.accountId === req.query.accountId);
  }

  // Filter by source name
  if (req.query.source) {
    leads = leads.filter(l => l.source === req.query.source);
  }

  // Filter by status
  if (req.query.status) {
    leads = leads.filter(l => l.status === req.query.status);
  }

  // Filter by date (YYYY-MM-DD)
  if (req.query.date) {
    leads = leads.filter(l => l.createdAt.startsWith(req.query.date));
  }

  // Filter by month (YYYY-MM)
  if (req.query.month) {
    leads = leads.filter(l => l.createdAt.startsWith(req.query.month));
  }

  // Filter by year (YYYY)
  if (req.query.year) {
    leads = leads.filter(l => l.createdAt.startsWith(req.query.year));
  }

  // Filter by date range
  if (req.query.from && req.query.to) {
    const from = new Date(req.query.from);
    const to = new Date(req.query.to + 'T23:59:59Z');
    leads = leads.filter(l => {
      const d = new Date(l.createdAt);
      return d >= from && d <= to;
    });
  }

  // Search by name or phone
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    leads = leads.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q)
    );
  }

  // Sort newest first
  leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    total: leads.length,
    leads
  });
});

// GET /api/leads/stats — summary stats
router.get('/stats', (req, res) => {
  const db = getDB();
  const leads = db.leads;
  const today = new Date().toISOString().split('T')[0];

  res.json({
    success: true,
    stats: {
      total: leads.length,
      today: leads.filter(l => l.createdAt.startsWith(today)).length,
      new: leads.filter(l => l.status === 'Baru').length,
      contacted: leads.filter(l => l.status === 'Dihubungi').length,
      pending: leads.filter(l => l.status === 'Pending').length,
      activeAccounts: db.accounts.filter(a => a.status === 'connected').length
    }
  });
});

// PATCH /api/leads/:id — update lead (status, pic)
router.patch('/:id', (req, res) => {
  const db = getDB();
  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

  const allowed = ['status', 'pic', 'name', 'phone', 'email'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) lead[field] = req.body[field];
  });

  lead.updatedAt = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, lead });
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  const db = getDB();
  const idx = db.leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Lead not found' });
  db.leads.splice(idx, 1);
  saveDB(db);
  res.json({ success: true });
});

module.exports = router;
