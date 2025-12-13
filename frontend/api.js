const API = "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token
    ? { "Content-Type": "application/json", "x-auth-token": token }
    : { "Content-Type": "application/json" };
}

export async function login(username, password) {
  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error("Login failed");
  }
  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function register(username, password, displayName) {
  const res = await fetch(`${API}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, displayName }),
  });
  if (!res.ok) {
    throw new Error("Register failed");
  }
  return res.json();
}

export function getCurrentUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function getCaches() {
  const res = await fetch(`${API}/api/caches`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch caches");
  return res.json();
}

export async function createCache(data) {
  const res = await fetch(`${API}/api/caches`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create cache (maybe not logged in?)");
  return res.json();
}

export async function leaderboard() {
  const res = await fetch(`${API}/api/leaderboard`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export async function markCacheFound(cacheId) {
  const res = await fetch(`${API}/api/caches/${cacheId}/found`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to mark cache as found");
  }
  return res.json();
}

export async function getFoundCaches() {
  const res = await fetch(`${API}/api/caches/found`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch found caches");
  return res.json();
}

export async function getMyCaches() {
  const res = await fetch(`${API}/api/caches/my`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Not logged in. Please log in again.");
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch your caches");
  }
  return res.json();
}

export async function updateCache(cacheId, data) {
  const res = await fetch(`${API}/api/caches/${cacheId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update cache");
  }
  return res.json();
}

export async function deleteCache(cacheId) {
  const res = await fetch(`${API}/api/caches/${cacheId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to delete cache");
  }
  return res.json();
}

export async function deactivateCache(cacheId, reason) {
  const res = await fetch(`${API}/api/caches/${cacheId}/deactivate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reason: reason || "Deactivated from UI" }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to deactivate cache");
  }
  return res.json();
}

export async function activateCache(cacheId) {
  const res = await fetch(`${API}/api/caches/${cacheId}/activate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to activate cache");
  }
  return res.json();
}

export async function getCacheStatusLog(cacheId) {
  const res = await fetch(`${API}/api/caches/${cacheId}/status-log`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch status log");
  }
  return res.json();
}

export async function trackCacheView(cacheId) {
  const res = await fetch(`${API}/api/caches/${cacheId}/view`, {
    method: "POST",
    headers: authHeaders(),
  });
  // Don't throw on error - tracking is non-critical
  return res.ok;
}

export async function getRecommendedCaches(limit = 10) {
  const res = await fetch(`${API}/api/users/me/recommended-caches?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch recommendations");
  }
  return res.json();
}