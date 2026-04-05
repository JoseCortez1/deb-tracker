import { useEffect, useState } from 'react';
import App from './App.jsx';
import { clearSession, isSessionValid } from './auth/session.js';
import { LoginScreen } from './components/LoginScreen.jsx';

export function Root() {
  const [phase, setPhase] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await isSessionValid();
      if (!cancelled) setPhase(ok ? 'authed' : 'guest');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === 'checking') {
    return (
      <div className="login-page login-page--bare">
        <p className="login-loading-text">Verificando sesión…</p>
      </div>
    );
  }

  if (phase === 'guest') {
    return <LoginScreen onSuccess={() => setPhase('authed')} />;
  }

  return (
    <App
      onLogout={() => {
        clearSession();
        setPhase('guest');
      }}
    />
  );
}
