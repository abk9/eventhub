import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  PLANNED: 'Planifié', ONGOING: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};

export default function EventCard({ event, canModify, onEdit, onDelete }) {
  return (
    <div className="event-card">
      <div className="event-card-header">
        <h3><Link to={`/events/${event.id}`}>{event.title}</Link></h3>
        <span className={`status-badge status-${event.current_status}`}>
          {STATUS_LABELS[event.current_status] || event.current_status}
        </span>
      </div>
      <div className="event-card-body">
        <p>📅 {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        {event.full_address && <p>📍 {event.full_address}</p>}
        {event.duration_display !== 'Durée non définie' && <p>⏱ {event.duration_display}</p>}
        <p>👥 {event.participants_count} participant(s)</p>
      </div>
      {canModify && (
        <div className="event-card-actions">
          <button className="btn-secondary btn-sm" onClick={() => onEdit(event)}>Modifier</button>
          <button className="btn-danger btn-sm" onClick={() => onDelete(event.id)}>Supprimer</button>
        </div>
      )}
    </div>
  );
}
