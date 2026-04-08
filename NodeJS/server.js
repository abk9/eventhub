require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const eventsRouter       = require('./routes/events');
const participantsRouter = require('./routes/participants');
const errorHandler       = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });

app.get('/api', (_req, res) => {
  res.json({ message: 'EventHub Node.js API', endpoints: { events: '/api/events', participants: '/api/participants' } });
});

app.use('/api/events',       eventsRouter);
app.use('/api/participants',  participantsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Route introuvable.' }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`API Node.js démarrée sur http://localhost:${PORT}/api`));

module.exports = app;
