import { useEffect, useId, useState } from 'react';
import {
  clearFailedAttempts,
  expireLockoutIfNeeded,
  FAILS_KEY,
  getLockoutRemainingMs,
  MAX_FAILS,
  persistSession,
  registerFailedAttempt,
  verifyCredentials,
} from '../auth/session.js';

function formatLockout(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m} min ${r} s` : `${r} s`;
}

export function LoginScreen({ onSuccess }) {
  const formId = useId();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(() =>
    getLockoutRemainingMs()
  );

  useEffect(() => {
    expireLockoutIfNeeded();
    setLockRemaining(getLockoutRemainingMs());
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      expireLockoutIfNeeded();
      setLockRemaining(getLockoutRemainingMs());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const locked = lockRemaining > 0;

  const tickLockout = () => {
    const ms = getLockoutRemainingMs();
    setLockRemaining(ms);
    return ms;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    expireLockoutIfNeeded();

    if (tickLockout() > 0) {
      setError('Demasiados intentos. Espera antes de volver a intentar.');
      return;
    }

    setBusy(true);
    try {
      const ok = await verifyCredentials(user.trim(), pass);
      if (ok) {
        clearFailedAttempts();
        await persistSession();
        onSuccess();
        return;
      }
      registerFailedAttempt();
      if (getLockoutRemainingMs() > 0) {
        setError(
          'Demasiados intentos fallidos. Espera el tiempo indicado abajo.'
        );
      } else {
        const fails = Number(sessionStorage.getItem(FAILS_KEY) || '0');
        const left = Math.max(0, MAX_FAILS - fails);
        setError(
          left > 0
            ? `Usuario o contraseña incorrectos. Intentos restantes: ${left}.`
            : 'Usuario o contraseña incorrectos.'
        );
      }
      tickLockout();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-brand">
          Plan de <span>Liquidación</span>
        </h1>
        <p className="login-sub">Acceso protegido · sesión cifrada en este equipo</p>

        {locked ? (
          <div className="login-banner login-banner--warn" role="status">
            Bloqueo temporal activo. Tiempo restante:{' '}
            <strong>{formatLockout(lockRemaining)}</strong>
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
          <div className="input-group">
            <label htmlFor={`${formId}-user`}>Usuario</label>
            <input
              id={`${formId}-user`}
              name="username"
              type="text"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              disabled={locked || busy}
              required
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="input-group">
            <label htmlFor={`${formId}-pass`}>Contraseña</label>
            <div className="login-pass-row">
              <input
                id={`${formId}-pass`}
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                disabled={locked || busy}
                required
              />
              <button
                type="button"
                className="btn-ghost login-toggle-pass"
                onClick={() => setShowPass((s) => !s)}
                disabled={locked || busy}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn login-submit"
            disabled={locked || busy}
          >
            {busy ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
