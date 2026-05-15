function normaliseGoals(goals = []) {
  if (Array.isArray(goals)) return goals;
  return String(goals || "")
    .split(",")
    .map((goal) => goal.trim())
    .filter(Boolean);
}

function getRepoOwner(repo) {
  return repo?.owner || repo?.profiles?.username || repo?.username || "";
}

export function getPersonalisedActions(goals = [], repos = []) {
  const selectedGoals = normaliseGoals(goals);
  const firstRepo = repos?.[0];
  const firstRepoOwner = getRepoOwner(firstRepo);
  const firstRepoPath = firstRepo && firstRepoOwner
    ? `/${firstRepoOwner}/${firstRepo.name}/readme`
    : "/repos";

  const allActions = [
    {
      id: "learn",
      emoji: "📚",
      label: "Start your first lesson",
      desc: "Open the learn centre and pick a topic",
      href: "/learn",
      showWhen: ["learn-git", "get-certified"]
    },
    {
      id: "readme",
      emoji: "✦",
      label: "Open README Studio",
      desc: firstRepo ? `Beautify ${firstRepo.name}` : "Create a beautiful README",
      href: firstRepoPath,
      showWhen: ["beautiful-repos"]
    },
    {
      id: "repos",
      emoji: "⌥",
      label: "View your repos",
      desc: "Browse all your synced GitHub repositories",
      href: "/repos",
      showWhen: ["team-collab", "better-github"]
    },
    {
      id: "profile",
      emoji: "✦",
      label: "Build your profile",
      desc: "Customise your developer page and portfolio",
      href: "/settings/profile",
      showWhen: ["build-profile"]
    },
    {
      id: "workspace",
      emoji: "🖥",
      label: "Set up your workspace",
      desc: "Pin your active projects to your desk",
      href: "/workspace",
      showWhen: [],
      priority: 0
    },
    {
      id: "explore",
      emoji: "🌐",
      label: "Explore the community",
      desc: "Discover projects and developers",
      href: "/explore",
      showWhen: [],
      priority: 1
    }
  ];

  const goalActions = allActions
    .filter((action) => action.showWhen.some((goal) => selectedGoals.includes(goal)))
    .slice(0, 3);

  const fallbacks = allActions
    .filter((action) => action.showWhen.length === 0)
    .sort((a, b) => a.priority - b.priority);

  const result = [...goalActions];
  for (const fallback of fallbacks) {
    if (result.length >= 3) break;
    if (!result.find((action) => action.id === fallback.id)) result.push(fallback);
  }

  return result.slice(0, 3);
}
