const prefix = "forallcode:prefs";

export function getUserPreference(userId, key, fallback = null) {
  if (!userId || typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(`${prefix}:${userId}:${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function setUserPreference(userId, key, value) {
  if (!userId || typeof window === "undefined") return;
  window.localStorage.setItem(`${prefix}:${userId}:${key}`, JSON.stringify(value));
}
