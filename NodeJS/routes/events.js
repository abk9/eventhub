const express = require('express');
const router  = express.Router();
const { db, nextId } = require('../database');

// ─── GET /api/events ──────────────────────────────────────────────────────────
router.get('/', (req, res, next) => {
  try {
    const { status, date } = req.query;
    let events = db.get('events').value();

    if (status) {
      events = events.filter(e => e.status === status);
    }
    if (date) {
      events = events.filter(e => e.date && e.date.startsWith(date));
    }

    events = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/events/:id ──────────────────────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const id    = parseInt(req.params.id);
    const event = db.get('events').find({ id }).value();
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

    const registrations = db.get('registrations').filter({ event_id: id }).value();
    const participantIds = registrations.map(r => r.participant_id);
    const participants = db.get('participants')
      .filter(p => participantIds.includes(p.id))
      .value();

    res.json({ ...event, participants });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/events ─────────────────────────────────────────────────────────
router.post('/', (req, res, next) => {
  try {
    const { title, description, date, end_date, address, city, country, status } = req.body;

    if (!title || !date) {
      const err = new Error('Les champs title et date sont obligatoires.');
      err.status = 400;
      return next(err);
    }
    if (end_date && new Date(end_date) <= new Date(date)) {
      const err = new Error('La date de fin doit être après la date de début.');
      err.status = 400;
      return next(err);
    }

    const newEvent = {
      id:          nextId('events'),
      title,
      description: description || '',
      date,
      end_date:    end_date    || null,
      address:     address     || '',
      city:        city        || '',
      country:     country     || 'France',
      status:      status      || 'ACTIVE',
      created_at:  new Date().toISOString(),
    };

    db.get('events').push(newEvent).write();
    res.status(201).json(newEvent);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/events/:id ────────────────────────────────────────────────────
router.patch('/:id', (req, res, next) => {
  try {
    const id    = parseInt(req.params.id);
    const event = db.get('events').find({ id }).value();
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

    const allowed = ['title', 'description', 'date', 'end_date', 'address', 'city', 'country', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour.' });
    }

    const checkDate    = updates.date     || event.date;
    const checkEndDate = 'end_date' in updates ? updates.end_date : event.end_date;
    if (checkEndDate && new Date(checkEndDate) <= new Date(checkDate)) {
      const err = new Error('La date de fin doit être après la date de début.');
      err.status = 400;
      return next(err);
    }

    db.get('events').find({ id }).assign(updates).write();
    const updated = db.get('events').find({ id }).value();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────
router.delete('/:id', (req, res, next) => {
  try {
    const id    = parseInt(req.params.id);
    const event = db.get('events').find({ id }).value();
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

    db.get('events').remove({ id }).write();
    db.get('registrations').remove({ event_id: id }).write();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
