const low    = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path   = require('path');
require('dotenv').config();

const dbPath  = process.env.DB_PATH || './eventhub.db.json';
const adapter = new FileSync(path.resolve(dbPath));
const db      = low(adapter);

// Structure initiale si le fichier est vide
db.defaults({ events: [], participants: [], registrations: [], _counters: { events: 0, participants: 0, registrations: 0 } }).write();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Génère un ID auto-incrémenté pour une collection */
function nextId(collection) {
  const current = db.get(`_counters.${collection}`).value();
  const next = current + 1;
  db.set(`_counters.${collection}`, next).write();
  return next;
}

module.exports = { db, nextId };
