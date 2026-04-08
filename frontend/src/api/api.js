const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erreur serveur' }));
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(username, password, email = '') {
  const res = await fetch(`${BASE_URL}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });
  return handleResponse(res);
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function logout() {
  const res = await fetch(`${BASE_URL}/logout/`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/me/`, { headers: getHeaders() });
  return handleResponse(res);
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `${BASE_URL}/events/?${params}` : `${BASE_URL}/events/`;
  const res = await fetch(url, { headers: getHeaders() });
  return handleResponse(res);
}

export async function getEvent(id) {
  const res = await fetch(`${BASE_URL}/events/${id}/`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createEvent(data) {
  const res = await fetch(`${BASE_URL}/events/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateEvent(id, data) {
  const res = await fetch(`${BASE_URL}/events/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteEvent(id) {
  const res = await fetch(`${BASE_URL}/events/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function getParticipants() {
  const res = await fetch(`${BASE_URL}/participants/`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createParticipant(data) {
  const res = await fetch(`${BASE_URL}/participants/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateParticipant(id, data) {
  const res = await fetch(`${BASE_URL}/participants/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteParticipant(id) {
  const res = await fetch(`${BASE_URL}/participants/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─── Admin : Users ───────────────────────────────────────────────────────────

export async function getUsers() {
  const res = await fetch(`${BASE_URL}/users/`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function updateUserRole(userId, role) {
  const res = await fetch(`${BASE_URL}/users/${userId}/role/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
}

// ─── Registrations ────────────────────────────────────────────────────────────

export async function getRegistrations() {
  const res = await fetch(`${BASE_URL}/registrations/`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createRegistration(eventId, participantId) {
  const res = await fetch(`${BASE_URL}/registrations/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ event: eventId, participant: participantId }),
  });
  return handleResponse(res);
}

export async function deleteRegistration(id) {
  const res = await fetch(`${BASE_URL}/registrations/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
}
