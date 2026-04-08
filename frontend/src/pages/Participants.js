import { useState, useEffect } from 'react';
import { getParticipants, createParticipant, updateParticipant, deleteParticipant } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import ParticipantRow from '../components/ParticipantRow';

const EMPTY_FORM = { first_name: '', last_name: '', email: '', phone: '' };

export default function Participants() {
  const { user, isEditor } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [formError, setFormError]       = useState(null);
  const [search, setSearch]             = useState('');

  const [showModal, setShowModal]                 = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [form, setForm]                           = useState(EMPTY_FORM);
  const [saving, setSaving]                       = useState(false);

  async function loadParticipants() {
    setLoading(true);
    try {
      setParticipants(await getParticipants());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadParticipants(); }, []);

  function openCreate() {
    setEditingParticipant(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(p) {
    setEditingParticipant(p);
    setForm({ first_name: p.first_name, last_name: p.last_name, email: p.email, phone: p.phone || '' });
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingParticipant) {
        await updateParticipant(editingParticipant.id, form);
      } else {
        await createParticipant(form);
      }
      setShowModal(false);
      loadParticipants();
    } catch (err) {
      setFormError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce participant ?')) return;
    try {
      await deleteParticipant(id);
      loadParticipants();
    } catch (err) {
      setError(err);
    }
  }

  function canModify(participant) {
    if (!isEditor) return false;
    if (user?.role === 'admin') return true;
    return participant.created_by === user?.user_id;
  }

  const filtered = participants.filter(p =>
    `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h2>Participants</h2>
          {isEditor && (
            <button className="btn-primary" onClick={openCreate}>+ Nouveau participant</button>
          )}
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <Spinner />}
        <ErrorMessage error={error} />

        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <ParticipantRow
                key={p.id}
                participant={p}
                canModify={canModify(p)}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="empty-state">Aucun participant trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingParticipant ? 'Modifier le participant' : 'Nouveau participant'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <ErrorMessage error={formError} />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
