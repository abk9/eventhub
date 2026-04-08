import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, register, getMe } from '../api/api';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { saveToken, setUser } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const data = await register(form.username, form.password, form.email);
        saveToken(data.token);
        setUser({ user_id: data.user_id, username: data.username, role: data.role });
      } else {
        const data = await login(form.username, form.password);
        saveToken(data.token);
        const me = await getMe();
        setUser(me);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>EventHub</h1>
        <div className="login-tabs">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => setMode('login')}
          >Connexion</button>
          <button
            className={mode === 'register' ? 'tab active' : 'tab'}
            onClick={() => setMode('register')}
          >Inscription</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <ErrorMessage error={error} />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
