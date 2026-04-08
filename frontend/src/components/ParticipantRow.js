export default function ParticipantRow({ participant, canModify, onEdit, onDelete }) {
  return (
    <tr>
      <td>{participant.last_name}</td>
      <td>{participant.first_name}</td>
      <td>{participant.email}</td>
      <td>{participant.phone || '—'}</td>
      <td>
        {canModify && (
          <div className="action-buttons">
            <button className="btn-secondary btn-sm" onClick={() => onEdit(participant)}>
              Modifier
            </button>
            <button className="btn-danger btn-sm" onClick={() => onDelete(participant.id)}>
              Supprimer
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
