import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, getParticipants, getRegistrations } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import StatCard from '../components/StatCard';
import EventCard from '../components/EventCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [events, participants, registrations] = await Promise.all([
          getEvents(),
          getParticipants(),
          getRegistrations(),
        ]);

        const active = events.filter(e => e.status === 'ACTIVE').length;
        const cancelled = events.filter(e => e.status === 'CANCELLED').length;
        const ongoing = events.filter(e => e.current_status === 'ONGOING').length;

        setStats({
          totalEvents: events.length,
          activeEvents: active,
          ongoingEvents: ongoing,
          cancelledEvents: cancelled,
          totalParticipants: participants.length,
          totalRegistrations: registrations.length,
        });

        // 5 events les plus récents
        const sorted = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentEvents(sorted.slice(0, 5));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h2>
            Bonjour, {user?.username}&nbsp;
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </h2>
        </div>

        {loading && <Spinner />}
        <ErrorMessage error={error} />

        {stats && (
          <>
            <div className="stats-grid">
              <StatCard number={stats.totalEvents}       label="Événements"   />
              <StatCard number={stats.activeEvents}      label="Actifs"        color="#059669" />
              <StatCard number={stats.ongoingEvents}     label="En cours"      color="#d97706" />
              <StatCard number={stats.cancelledEvents}   label="Annulés"       color="#ef4444" />
              <StatCard number={stats.totalParticipants} label="Participants"  color="#7c3aed" />
              <StatCard number={stats.totalRegistrations}label="Inscriptions"  color="#0891b2" />
            </div>

            <div className="section">
              <div className="section-header">
                <h3>Événements récents</h3>
                <Link to="/events" className="btn-secondary">Voir tous</Link>
              </div>
              <div className="events-grid">
                {recentEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    canModify={false}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
