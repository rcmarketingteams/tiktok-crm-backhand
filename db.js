const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  leads: [],
  accounts: [],
  nextLeadId: 1,
  nextAccountId: 1
};

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[DB] Read error:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Write error:', e.message);
  }
}

function getDB() {
  return readDB();
}

function saveDB(data) {
  writeDB(data);
}

module.exports = { getDB, saveDB };
