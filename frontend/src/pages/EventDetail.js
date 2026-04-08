import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, deleteEvent, getRegistrations, getParticipants } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import RegistrationList from '../components/RegistrationList';

const STATUS_LABELS = {
  PLANNED: 'Planifié', ONGOING: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isEditor } = useAuth();

  const [event, setEvent]               = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const load = useCallback(async () => {
    try {
      const [ev, regs, parts] = await Promise.all([
        getEvent(id),
        getRegistrations(),
        getParticipants(),
      ]);
      setEvent(ev);
      setRegistrations(regs.filter(r => r.event === parseInt(id)));
      setAllParticipants(parts);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const canModify = event && isEditor &&
    (user?.role === 'admin' || event.created_by === user?.user_id);

  async function handleDeleteEvent() {
    if (!window.confirm('Supprimer cet événement ?')) return;
    try {
      await deleteEvent(id);
      navigate('/events');
    } catch (err) {
      setError(err);
    }
  }

  if (loading) return <div><Navbar /><div className="page-container"><Spinner /></div></div>;
  if (error)   return <div><Navbar /><div className="page-container"><ErrorMessage error={error} /></div></div>;
  if (!event)  return null;

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <button className="btn-back" onClick={() => navigate('/events')}>← Retour</button>

        <div className="event-detail-header">
          <div>
            <h2>{event.title}</h2>
            <span className={`status-badge status-${event.current_status}`}>
              {STATUS_LABELS[event.current_status]}
            </span>
          </div>
          {canModify && (
            <button className="btn-danger" onClick={handleDeleteEvent}>Supprimer</button>
          )}
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <h4>Informations</h4>
            <p><strong>Date :</strong> {new Date(event.date).toLocaleString('fr-FR')}</p>
            {event.end_date && (
              <p><strong>Fin :</strong> {new Date(event.end_date).toLocaleString('fr-FR')}</p>
            )}
            {event.duration_display !== 'Durée non définie' && (
              <p><strong>Durée :</strong> {event.duration_display}</p>
            )}
            {event.full_address && <p><strong>Lieu :</strong> {event.full_address}</p>}
            {event.description && <p><strong>Description :</strong> {event.description}</p>}
            <p><strong>Participants :</strong> {event.participants_count}</p>
          </div>
        </div>

        <RegistrationList
          eventId={parseInt(id)}
          registrations={registrations}
          allParticipants={allParticipants}
          canModify={canModify}
          eventStatus={event.status}
          currentStatus={event.current_status}
          onRefresh={load}
        />
      </div>
    </div>
  );
}
