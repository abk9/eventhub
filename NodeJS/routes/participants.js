const express = require('express');
const router  = express.Router();
const { db, nextId } = require('../database');

// ─── GET /api/participants ────────────────────────────────────────────────────
router.get('/', (_req, res, next) => {
  try {
    const participants = db.get('participants')
      .sortBy(['last_name', 'first_name'])
      .value();
    res.json(participants);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/participants/:id ────────────────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const id          = parseInt(req.params.id);
    const participant = db.get('participants').find({ id }).value();
    if (!participant) return res.status(404).json({ error: 'Participant introuvable.' });

    const registrations = db.get('registrations').filter({ participant_id: id }).value();
    const eventIds      = registrations.map(r => r.event_id);
    const events        = db.get('events')
      .filter(e => eventIds.includes(e.id))
      .value();

    res.json({ ...participant, events });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/participants ───────────────────────────────────────────────────
router.post('/', (req, res, next) => {
  try {
    const { first_name, last_name, email, phone } = req.body;

    if (!first_name || !last_name || !email) {
      const err = new Error('Les champs first_name, last_name et email sont obligatoires.');
      err.status = 400;
      return next(err);
    }

    const exists = db.get('participants').find({ email }).value();
    if (exists) {
      const err = new Error('Un participant avec cet email existe déjà.');
      err.status = 409;
      return next(err);
    }

    const newParticipant = {
      id:         nextId('participants'),
      first_name,
      last_name,
      email,
      phone:      phone || '',
      created_at: new Date().toISOString(),
    };

    db.get('participants').push(newParticipant).write();
    res.status(201).json(newParticipant);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/participants/:id ──────────────────────────────────────────────
router.patch('/:id', (req, res, next) => {
  try {
    const id          = parseInt(req.params.id);
    const participant = db.get('participants').find({ id }).value();
    if (!participant) return res.status(404).json({ error: 'Participant introuvable.' });

    const allowed = ['first_name', 'last_name', 'email', 'phone'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour.' });
    }

    if (updates.email && updates.email !== participant.email) {
      const emailTaken = db.get('participants').find({ email: updates.email }).value();
      if (emailTaken) {
        const err = new Error('Cet email est déjà utilisé.');
        err.status = 409;
        return next(err);
      }
    }

    db.get('participants').find({ id }).assign(updates).write();
    const updated = db.get('participants').find({ id }).value();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/participants/:id ─────────────────────────────────────────────
router.delete('/:id', (req, res, next) => {
  try {
    const id          = parseInt(req.params.id);
    const participant = db.get('participants').find({ id }).value();
    if (!participant) return res.status(404).json({ error: 'Participant introuvable.' });

    db.get('participants').remove({ id }).write();
    db.get('registrations').remove({ participant_id: id }).write();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
