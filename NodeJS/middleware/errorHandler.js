/**
 * Middleware de gestion centralisée des erreurs.
 * Intercepte toutes les erreurs passées via next(err).
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  // Erreur de contrainte SQLite (ex: UNIQUE violation)
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Conflit : cette valeur existe déjà.', detail: err.message });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({ error: 'Contrainte de base de données violée.', detail: err.message });
  }

  // Erreur de validation métier
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Erreur générique
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}

module.exports = errorHandler;
