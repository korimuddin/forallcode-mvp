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

export function getRepoHeroPreference(owner, repo, fallback = { title: "", image: "" }) {
  if (!owner || !repo || typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(repoHeroKey(owner, repo));
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function setRepoHeroPreference(owner, repo, value) {
  if (!owner || !repo || typeof window === "undefined") return;
  window.localStorage.setItem(repoHeroKey(owner, repo), JSON.stringify(value));
}

export function compactRepoHeroPreferences(compressImage) {
  if (typeof window === "undefined") return Promise.resolve();

  const heroKeys = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("forallcode:repo-hero:")) heroKeys.push(key);
  }

  return Promise.all(heroKeys.map(async (key) => {
    try {
      const hero = JSON.parse(window.localStorage.getItem(key) || "{}");
      if (!hero.image || hero.image.length < 450000) return;
      const image = await compressImage(hero.image);
      window.localStorage.setItem(key, JSON.stringify({ ...hero, image }));
    } catch {
      // Ignore one broken hero entry so the rest can still be compacted.
    }
  }));
}

function repoHeroKey(owner, repo) {
  return `forallcode:repo-hero:${owner}/${repo}`;
}
