import { useState, useEffect } from 'react';
import { getUsers, updateUserRole } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [saving, setSaving] = useState(null); // user_id en cours de sauvegarde
  const [success, setSuccess] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId, newRole) {
    setSaving(userId);
    setError(null);
    setSuccess(null);
    try {
      await updateUserRole(userId, newRole);
      setSuccess(`Rôle mis à jour.`);
      load();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h2>Gestion des utilisateurs</h2>
          <span className="role-badge role-admin">Admin uniquement</span>
        </div>

        {loading && <Spinner />}
        <ErrorMessage error={error} />
        {success && <div className="success-message">{success}</div>}

        <table className="table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle actuel</th>
              <th>Changer le rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id}>
                <td>
                  <strong>{u.username}</strong>
                  {u.user_id === currentUser?.user_id && (
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#6b7280' }}>(vous)</span>
                  )}
                </td>
                <td>{u.email || '—'}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>
                  {u.is_superuser ? (
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Non modifiable</span>
                  ) : (
                    <div className="role-actions">
                      <button
                        className={`btn-role ${u.role === 'viewer' ? 'active' : ''}`}
                        onClick={() => handleRoleChange(u.user_id, 'viewer')}
                        disabled={u.role === 'viewer' || saving === u.user_id}
                      >
                        Viewer
                      </button>
                      <button
                        className={`btn-role ${u.role === 'editor' ? 'active' : ''}`}
                        onClick={() => handleRoleChange(u.user_id, 'editor')}
                        disabled={u.role === 'editor' || saving === u.user_id}
                      >
                        Editor
                      </button>
                      {saving === u.user_id && (
                        <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>...</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="empty-state">Aucun utilisateur.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
