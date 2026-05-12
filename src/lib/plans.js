export const PLAN_LIMITS = {
  free: {
    privateRepos: 3,
    stickyNotes: 5,
    landingPages: 1,
    deskThemes: 1,
    customDomains: false,
    advancedTemplates: false,
    prioritySync: false
  },
  pro: {
    privateRepos: Infinity,
    stickyNotes: Infinity,
    landingPages: Infinity,
    deskThemes: 4,
    customDomains: true,
    advancedTemplates: true,
    prioritySync: true
  }
};

export function getPlanLimits(planId = "free") {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.free;
}

export function isAtLimit(planId, limitKey, currentCount) {
  const limit = getPlanLimits(planId)[limitKey];
  if (limit === Infinity || limit === null) return false;
  return currentCount >= limit;
}

export const LIMIT_DESCRIPTIONS = {
  privateRepos: (n) => `${n} private ${n === 1 ? "repo" : "repos"}`,
  stickyNotes: (n) => `${n} sticky notes`,
  landingPages: (n) => `${n} landing ${n === 1 ? "page" : "pages"}`
};
