export default function EventFilters({ filterStatus, filterDate, sortOrder, onChange, onReset }) {
  const hasActiveFilters = filterStatus || filterDate;

  return (
    <div className="filters">
      <select value={filterStatus} onChange={e => onChange('filterStatus', e.target.value)}>
        <option value="">Tous les statuts</option>
        <option value="PLANNED">Planifié</option>
        <option value="ONGOING">En cours</option>
        <option value="COMPLETED">Terminé</option>
        <option value="CANCELLED">Annulé</option>
      </select>

      <input
        type="date"
        value={filterDate}
        onChange={e => onChange('filterDate', e.target.value)}
        title="Filtrer par date de début"
      />

      <select value={sortOrder} onChange={e => onChange('sortOrder', e.target.value)}>
        <option value="desc">Date : plus récent d'abord</option>
        <option value="asc">Date : plus ancien d'abord</option>
      </select>

      {hasActiveFilters && (
        <button className="btn-secondary" onClick={onReset}>
          Réinitialiser
        </button>
      )}
    </div>
  );
}
