const TOKEN_KEY = 'deb_tracker_jwt';

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

function isAuthenticated() {
  return !!getToken();
}

async function request(method, endpoint, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(endpoint, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Error de conexión');
  }

  if (res.status === 401) {
    clearToken();
    throw new Error('Sesión expirada');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error del servidor');
  }
  return data;
}

export const api = {
  login(email, password) {
    return request('POST', '/api/auth/login', { email, password });
  },
  signup(email, username, password) {
    return request('POST', '/api/auth/signup', { email, username, password });
  },
  get(endpoint) {
    return request('GET', endpoint);
  },
  post(endpoint, body) {
    return request('POST', endpoint, body);
  },
  put(endpoint, body) {
    return request('PUT', endpoint, body);
  },
  del(endpoint) {
    return request('DELETE', endpoint);
  },
  setToken,
  getToken,
  clearToken,
  isAuthenticated,
};
