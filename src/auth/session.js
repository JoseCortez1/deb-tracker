import { AUTH_PASSWORD, AUTH_USERNAME } from './staticCredentials.js';

const SESSION_KEY = 'deb_tracker_auth_v1';
const LOCK_KEY = 'deb_tracker_lockout_until';
export const FAILS_KEY = 'deb_tracker_fail_count';

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

async function sessionFingerprint() {
  const enc = new TextEncoder();
  const data = enc.encode(
    `${AUTH_USERNAME}\0${AUTH_PASSWORD}\0deb-tracker-session-v1`
  );
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');
}

export function getLockoutRemainingMs() {
  const raw = sessionStorage.getItem(LOCK_KEY);
  if (!raw) return 0;
  const until = Number(raw);
  if (Number.isNaN(until)) return 0;
  return Math.max(0, until - Date.now());
}

export function registerFailedAttempt() {
  const n = Number(sessionStorage.getItem(FAILS_KEY) || '0') + 1;
  sessionStorage.setItem(FAILS_KEY, String(n));
  if (n >= MAX_FAILS) {
    sessionStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MS));
  }
}

export function clearFailedAttempts() {
  sessionStorage.removeItem(FAILS_KEY);
  sessionStorage.removeItem(LOCK_KEY);
}

/** Si ya pasó el bloqueo, limpia contadores para nuevos intentos. */
export function expireLockoutIfNeeded() {
  const raw = sessionStorage.getItem(LOCK_KEY);
  if (!raw) return;
  const until = Number(raw);
  if (!Number.isNaN(until) && Date.now() >= until) {
    clearFailedAttempts();
  }
}

export async function persistSession() {
  const fp = await sessionFingerprint();
  const exp = Date.now() + SESSION_MS;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ exp, fp }));
}

export async function isSessionValid() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!parsed?.exp || !parsed?.fp) return false;
  if (Date.now() > parsed.exp) {
    clearSession();
    return false;
  }
  const fp = await sessionFingerprint();
  if (fp !== parsed.fp) {
    clearSession();
    return false;
  }
  return true;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Comparación en tiempo constante (mitiga timing attacks triviales en el cliente). */
export function timingSafeEqual(a, b) {
  const sa = String(a);
  const sb = String(b);
  if (sa.length !== sb.length) return false;
  let out = 0;
  for (let i = 0; i < sa.length; i++) {
    out |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return out === 0;
}

export async function verifyCredentials(username, password) {
  const uOk = timingSafeEqual(
    username.normalize('NFKC'),
    AUTH_USERNAME.normalize('NFKC')
  );
  const pOk = timingSafeEqual(password, AUTH_PASSWORD);
  return uOk && pOk;
}

export { MAX_FAILS };
