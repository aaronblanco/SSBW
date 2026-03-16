const AUTH_TOKEN_KEY = 'ssbw-auth-token';

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function setToken(token) {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function apiMe() {
  const response = await fetch('/api/auth/me', {
    headers: authHeaders()
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user;
}

async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo iniciar sesion');
  }

  setToken(data.token);
  return data.user;
}

async function register(payload) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo registrar');
  }

  setToken(data.token);
  return data.user;
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: authHeaders()
    });
  } finally {
    setToken('');
  }
}

window.SSBWAuth = {
  getToken,
  setToken,
  authHeaders,
  apiMe,
  login,
  register,
  logout
};
