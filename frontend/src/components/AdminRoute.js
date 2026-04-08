import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { token, loading, isAdmin } = useAuth();

  if (loading) return <div className="loading">Chargement...</div>;
  if (!token)   return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
