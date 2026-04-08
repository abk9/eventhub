import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);   // { user_id, username, role }
  const [loading, setLoading] = useState(true);

  // Au chargement : si un token existe, récupère les infos user
  useEffect(() => {
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => {
          // Token invalide → on nettoie
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  function saveToken(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function clearAuth() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || isAdmin;
  const isViewer = !isEditor;

  return (
    <AuthContext.Provider value={{ token, user, loading, isAdmin, isEditor, isViewer, saveToken, setUser, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
