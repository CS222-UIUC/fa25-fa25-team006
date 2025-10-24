const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    : { 'Accept': 'application/json' };
}

export async function login(username: string, password: string) {
  const body = new URLSearchParams({ username, password });
  console.log('🔑 Logging in user:', username);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!res.ok) {
    console.error('❌ Login failed with status', res.status);
    throw new Error(`Login failed: ${res.status}`);
  }

  const data = await res.json();
  localStorage.setItem('token', data.access_token);
  console.log('✅ Login successful, token stored');
  return data;
}

export async function register(username: string, password: string, display_name?: string) {
  console.log('📝 Registering user:', username);

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, display_name })
  });

  if (!res.ok) {
    console.error('❌ Register failed with status', res.status);
    throw new Error(`Register failed: ${res.status}`);
  }

  const data = await res.json();
  console.log('✅ Register successful');
  return data;
}

export async function getCaches(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  console.log('📦 Fetching caches with params:', q);

  const res = await fetch(`${API_BASE}/caches?${q}`, { headers: authHeaders() });

  if (!res.ok) {
    console.error('❌ Failed to load caches:', res.status);
    throw new Error('Failed to load caches');
  }

  return res.json();
}

export async function createCache(cache: any) {
  console.log('🗂️ Creating new cache:', cache);

  const res = await fetch(`${API_BASE}/caches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(cache)
  });

  if (!res.ok) {
    console.error('❌ Create cache failed:', res.status);
    throw new Error('Create cache failed');
  }

  const data = await res.json();
  console.log('✅ Cache created successfully');
  return data;
}

export async function leaderboard() {
  console.log('🏆 Fetching leaderboard...');

  const res = await fetch(`${API_BASE}/leaderboard`, { headers: authHeaders() });

  if (!res.ok) {
    console.error('❌ Failed to load leaderboard:', res.status);
    throw new Error('Failed to load leaderboard');
  }

  const data = await res.json();
  console.log('✅ Leaderboard loaded');
  return data;
}
