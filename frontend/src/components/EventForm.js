import ErrorMessage from './ErrorMessage';

export default function EventForm({ form, onChange, onSubmit, onCancel, saving, error, isEditing }) {
  function handleChange(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Titre *</label>
        <input
          value={form.title}
          onChange={e => handleChange('title', e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date de début *</label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Date de fin</label>
          <input
            type="datetime-local"
            value={form.end_date}
            onChange={e => handleChange('end_date', e.target.value)}
            min={form.date || undefined}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Ville</label>
          <input
            value={form.city}
            onChange={e => handleChange('city', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Pays</label>
          <input
            value={form.country}
            onChange={e => handleChange('country', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Adresse</label>
        <input
          value={form.address}
          onChange={e => handleChange('address', e.target.value)}
        />
      </div>

      {isEditing && (
        <div className="form-group">
          <label>Statut</label>
          <select value={form.status} onChange={e => handleChange('status', e.target.value)}>
            <option value="ACTIVE">Actif</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
      )}

      <ErrorMessage error={error} />

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
