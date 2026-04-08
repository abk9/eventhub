import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import EventCard from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import EventForm from '../components/EventForm';

const EMPTY_FORM = {
  title: '', description: '', date: '', end_date: '',
  address: '', city: '', country: 'France', status: 'ACTIVE',
};

export default function Events() {
  const { user, isEditor } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate]     = useState('');
  const [sortOrder, setSortOrder]       = useState('desc');

  const [showModal, setShowModal]           = useState(false);
  const [editingEvent, setEditingEvent]     = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);

  async function loadEvents() {
    setLoading(true);
    try {
      const filters = {};
      if (filterStatus === 'ACTIVE' || filterStatus === 'CANCELLED') {
        filters.status = filterStatus;
      }
      let data = await getEvents(filters);

      if (['PLANNED', 'ONGOING', 'COMPLETED'].includes(filterStatus)) {
        data = data.filter(e => e.current_status === filterStatus);
      }

      if (filterDate) {
        data = data.filter(e => {
          const eventDate = new Date(e.date).toLocaleDateString('fr-CA');
          return eventDate === filterDate;
        });
      }

      data = [...data].sort((a, b) => {
        const diff = new Date(a.date) - new Date(b.date);
        return sortOrder === 'asc' ? diff : -diff;
      });

      setEvents(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, [filterStatus, filterDate, sortOrder]);

  function handleFilterChange(key, value) {
    if (key === 'filterStatus') setFilterStatus(value);
    if (key === 'filterDate')   setFilterDate(value);
    if (key === 'sortOrder')    setSortOrder(value);
  }

  function handleReset() {
    setFilterStatus('');
    setFilterDate('');
  }

  function openCreate() {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(event) {
    setEditingEvent(event);
    setForm({
      title:       event.title,
      description: event.description || '',
      date:        event.date     ? event.date.slice(0, 16)     : '',
      end_date:    event.end_date ? event.end_date.slice(0, 16) : '',
      address:     event.address  || '',
      city:        event.city     || '',
      country:     event.country  || 'France',
      status:      event.status,
    });
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.end_date && form.date && new Date(form.end_date) <= new Date(form.date)) {
      setFormError('La date de fin doit être après la date de début.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = { ...form };
      if (!payload.end_date) delete payload.end_date;
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
      } else {
        await createEvent(payload);
      }
      setShowModal(false);
      loadEvents();
    } catch (err) {
      setFormError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet événement ?')) return;
    try {
      await deleteEvent(id);
      loadEvents();
    } catch (err) {
      setError(err);
    }
  }

  function canModify(event) {
    if (!isEditor) return false;
    if (user?.role === 'admin') return true;
    return event.created_by === user?.user_id;
  }

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h2>Événements</h2>
          {isEditor && (
            <button className="btn-primary" onClick={openCreate}>+ Nouvel événement</button>
          )}
        </div>

        <EventFilters
          filterStatus={filterStatus}
          filterDate={filterDate}
          sortOrder={sortOrder}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        {loading && <Spinner />}
        <ErrorMessage error={error} />

        <div className="events-grid">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              canModify={canModify(event)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
          {!loading && events.length === 0 && (
            <p className="empty-state">Aucun événement trouvé.</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingEvent ? "Modifier l'événement" : 'Nouvel événement'}</h3>
            <EventForm
              form={form}
              onChange={setForm}
              onSubmit={handleSubmit}
              onCancel={() => setShowModal(false)}
              saving={saving}
              error={formError}
              isEditing={!!editingEvent}
            />
          </div>
        </div>
      )}
    </div>
  );
}
