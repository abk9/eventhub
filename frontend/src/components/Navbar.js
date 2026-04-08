import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api/api';

export default function Navbar() {
  const { user, isAdmin, clearAuth } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try { await logout(); } catch {}
    clearAuth();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">EventHub</Link>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/events">Événements</Link>
        <Link to="/participants">Participants</Link>
        {isAdmin && <Link to="/admin/users">Utilisateurs</Link>}
      </div>
      <div className="navbar-user">
        <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
        <span>{user?.username}</span>
        <button onClick={handleLogout} className="btn-logout">Déconnexion</button>
      </div>
    </nav>
  );
}
