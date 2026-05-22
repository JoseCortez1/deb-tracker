import { useId, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export function LoginScreen() {
  const titleId = useId();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, username, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span>Debt</span> Tracker
        </div>
        <p className="login-sub">
          {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor={'$'+'{titleId}-email'}>Email</label>
            <input
              id={'$'+'{titleId}-email'}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={busy}
            />
          </div>

          {mode === 'signup' && (
            <div className="input-group">
              <label htmlFor={'$'+'{titleId}-user'}>Usuario</label>
              <input
                id={'$'+'{titleId}-user'}
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                disabled={busy}
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor={'$'+'{titleId}-pass'}>Contraseña</label>
            <input
              id={'$'+'{titleId}-pass'}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={busy}
            />
          </div>

          <button type="submit" className="btn login-submit" disabled={busy}>
            {busy ? 'Cargando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? (
            <>{'¿No tienes cuenta? '}
              <button type="button" className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => { setMode('signup'); setError(''); }}>
                Regístrate
              </button>
            </>
          ) : (
            <>{'¿Ya tienes cuenta? '}
              <button type="button" className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => { setMode('login'); setError(''); }}>
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
