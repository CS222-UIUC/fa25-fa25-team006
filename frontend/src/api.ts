const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function login(username: string, password: string) {
  const body = new URLSearchParams({ username, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function register(username: string, password: string, display_name?: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, display_name })
  });
  if (!res.ok) throw new Error('Register failed');
  return res.json();
}

export async function getCaches(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/caches?${q}`);
  if (!res.ok) throw new Error('Failed to load caches');
  return res.json();
}

export async function createCache(cache: any) {
  const res = await fetch(`${API_BASE}/caches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(cache)
  });
  if (!res.ok) throw new Error('Create cache failed');
  return res.json();
}

export async function leaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard`);
  if (!res.ok) throw new Error('Failed to load leaderboard');
  return res.json();
}
