import { useState } from 'react';
import { createRegistration, deleteRegistration } from '../api/api';
import ErrorMessage from './ErrorMessage';

export default function RegistrationList({ eventId, registrations, allParticipants, canModify, eventStatus, currentStatus, onRefresh }) {
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  // Participants pas encore inscrits
  const registeredIds = registrations.map(r => r.participant);
  const available = allParticipants.filter(p => !registeredIds.includes(p.id));

  const canRegister = canModify && currentStatus !== 'COMPLETED' && eventStatus !== 'CANCELLED';

  async function handleAdd() {
    if (!selectedParticipant) return;
    setAdding(true);
    setError(null);
    try {
      await createRegistration(eventId, parseInt(selectedParticipant));
      setSelectedParticipant('');
      onRefresh();
    } catch (err) {
      setError(err);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(regId) {
    if (!window.confirm('Retirer ce participant ?')) return;
    setError(null);
    try {
      await deleteRegistration(regId);
      onRefresh();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="section">
      <h3>Participants inscrits ({registrations.length})</h3>

      {canRegister && (
        <div className="add-registration">
          <select
            value={selectedParticipant}
            onChange={e => setSelectedParticipant(e.target.value)}
          >
            <option value="">-- Choisir un participant --</option>
            {available.map(p => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.email})
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={!selectedParticipant || adding}
          >
            {adding ? 'Ajout...' : '+ Inscrire'}
          </button>
        </div>
      )}

      <ErrorMessage error={error} />

      {registrations.length === 0 ? (
        <p className="empty-state">Aucun participant inscrit.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Inscrit le</th>
              {canModify && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {registrations.map(reg => {
              const participant = allParticipants.find(p => p.id === reg.participant);
              return (
                <tr key={reg.id}>
                  <td>{participant ? `${participant.first_name} ${participant.last_name}` : reg.participant_name}</td>
                  <td>{participant?.email || '—'}</td>
                  <td>{new Date(reg.registered_at).toLocaleDateString('fr-FR')}</td>
                  {canModify && (
                    <td>
                      <button className="btn-danger btn-sm" onClick={() => handleRemove(reg.id)}>
                        Retirer
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
