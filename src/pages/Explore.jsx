import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Star } from "lucide-react";
import RisingRepos from "../components/explore/RisingRepos";
import SpotlightCard from "../components/explore/SpotlightCard";
import TrendingDevelopers from "../components/explore/TrendingDevelopers";
import TrendingTopics from "../components/explore/TrendingTopics";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { getCurrentSession, supabase } from "../lib/supabase";

const PAGE_SIZE = 12;
const USE_LIVE_GITHUB_EXPLORE = true;

const languageStyles = {
  TypeScript: ["#ddd5f0", "#534AB7"],
  JavaScript: ["#f5e4c4", "#633806"],
  Python: ["#cce0f0", "#0C447C"],
  CSS: ["#c8d8c4", "#27500A"],
  Rust: ["#f5d5d8", "#72243E"],
  Shell: ["#f5e4c4", "#633806"],
  Go: ["#cce0f0", "#0C447C"]
};

const filters = ["All", "Repos", "Workspaces", "Developers"];
const exploreTabs = ["Featured", "Trending", "Rising", "Topics", "Developers"];

export default function Explore() {
  useDocumentTitle("Explore");
  const [searchParams] = useSearchParams();
  const topicFilter = searchParams.get("topic") || "";
  const [sessionChecked, setSessionChecked] = useState(false);
  const [session, setSession] = useState(null);
  const [repos, setRepos] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [spotlights, setSpotlights] = useState([]);
  const [topTopics, setTopTopics] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [language, setLanguage] = useState("All languages");
  const [sort, setSort] = useState("stars");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(topicFilter ? "Topics" : "Featured");
  const [timeRange, setTimeRange] = useState("week");
  const [trendingDevelopers, setTrendingDevelopers] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [risingRepos, setRisingRepos] = useState([]);

  useEffect(() => {
    async function checkSession() {
      if (!supabase) {
        setSessionChecked(true);
        return;
      }

      try {
        const currentSession = await getCurrentSession();
        setSession(currentSession);
      } finally {
        setSessionChecked(true);
      }
    }

    checkSession();
  }, []);

  useEffect(() => {
    setRepos([]);
    setPage(0);
    setHasMore(true);
    loadRepos(0, true);
    loadFeatured();
    loadSpotlights();
    loadWorkspaces();
    loadTopTopics();
  }, [language, sort, search, topicFilter]);

  useEffect(() => {
    loadDiscoverySections();
  }, [session?.provider_token, timeRange]);

  useEffect(() => {
    if (topicFilter) setActiveTab("Topics");
  }, [topicFilter]);

  async function loadFeatured() {
    if (USE_LIVE_GITHUB_EXPLORE) {
      const githubFeatured = await fetchGitHubExploreRepos({ limit: 2, minStars: 20000 }).catch(() => []);
      if (githubFeatured.length) {
        setFeatured(githubFeatured);
        return;
      }
    }

    if (!supabase) {
      setFeatured([]);
      return;
    }

    const { data } = await supabase
      .from("repositories")
      .select("*, profiles(username, display_name, avatar_style)")
      .eq("is_private", false)
      .eq("is_featured", true)
      .order("stars_count", { ascending: false })
      .limit(2);

    setFeatured(data || []);
  }

  async function loadSpotlights() {
    if (!supabase) {
      setSpotlights([]);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: entries, error } = await supabase
      .from("spotlight_entries")
      .select("*")
      .lte("week_of", today)
      .order("week_of", { ascending: false })
      .limit(3);

    if (error || !entries?.length) {
      setSpotlights([]);
      return;
    }

    const userIds = [...new Set(entries.map((entry) => entry.user_id).filter(Boolean))];
    const repoIds = [...new Set(entries.map((entry) => entry.featured_repo_id).filter(Boolean))];

    const [profilesResult, reposResult] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, username, display_name, avatar_style, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] }),
      repoIds.length
        ? supabase.from("repositories").select("id, owner_id, name, description").in("id", repoIds)
        : Promise.resolve({ data: [] })
    ]);

    const profilesById = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));
    const reposById = new Map((reposResult.data || []).map((repo) => [repo.id, repo]));

    setSpotlights(entries.map((entry) => ({
      ...entry,
      profiles: profilesById.get(entry.user_id),
      repositories: reposById.get(entry.featured_repo_id)
    })));
  }

  async function loadRepos(nextPage = page, replace = false) {
    setLoading(true);
    const start = nextPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    if (USE_LIVE_GITHUB_EXPLORE) {
      const githubRepos = await fetchGitHubExploreRepos({
        page: nextPage + 1,
        limit: PAGE_SIZE,
        minStars: search.trim() || topicFilter ? 0 : 250,
        searchTerm: search,
        topic: topicFilter
      }).catch(() => []);

      if (githubRepos.length || !supabase) {
        setRepos((current) => replace ? githubRepos : [...current, ...githubRepos]);
        setHasMore(githubRepos.length === PAGE_SIZE);
        setLoading(false);
        return;
      }
    }

    if (!supabase) {
      setRepos([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("repositories")
      .select("*, profiles(username, display_name, avatar_style), repo_topics(topic)")
      .eq("is_private", false);

    if (topicFilter) query = query.filter("repo_topics.topic", "eq", topicFilter);
    if (language !== "All languages") query = query.eq("language", language);
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term}`);
    }
    if (sort === "recent") query = query.order("updated_at", { ascending: false });
    if (sort === "stars") query = query.order("stars_count", { ascending: false });
    if (sort === "newest") query = query.order("created_at", { ascending: false });

    const { data } = await query.range(start, end);
    const nextRepos = data || [];
    setRepos((current) => replace ? nextRepos : [...current, ...nextRepos]);
    setHasMore((data || []).length === PAGE_SIZE);
    setLoading(false);
  }

  async function loadWorkspaces() {
    if (USE_LIVE_GITHUB_EXPLORE) {
      const githubWorkspaces = await fetchGitHubWorkspaceUsers().catch(() => []);
      if (githubWorkspaces.length) {
        setWorkspaces(githubWorkspaces);
        return;
      }
    }

    if (!supabase) {
      setWorkspaces([]);
      return;
    }

    let query = supabase
      .from("profiles")
      .select("id, username, display_name, avatar_style, repos_count, followers_count, bio")
      .eq("show_workspace", true)
      .limit(8);

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`username.ilike.${term},display_name.ilike.${term}`);
    }

    const { data } = await query;
    setWorkspaces(data || []);
  }

  async function loadTopTopics() {
    if (USE_LIVE_GITHUB_EXPLORE) {
      const githubRepos = await fetchGitHubExploreRepos({ limit: 30, minStars: 5000 }).catch(() => []);
      const counts = githubRepos.flatMap((repo) => repo.repo_topics || []).reduce((map, item) => {
        if (!item.topic) return map;
        map[item.topic] = (map[item.topic] || 0) + 1;
        return map;
      }, {});

      const githubTopics = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([topic, count]) => ({ topic, count }));

      if (githubTopics.length || !supabase) {
        setTopTopics(githubTopics);
        return;
      }
    }

    if (!supabase) {
      setTopTopics([]);
      return;
    }

    const { data } = await supabase
      .from("repo_topics")
      .select("topic")
      .limit(200);

    const counts = (data || []).reduce((map, item) => {
      map[item.topic] = (map[item.topic] || 0) + 1;
      return map;
    }, {});

    setTopTopics(Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([topic, count]) => ({ topic, count })));
  }

  async function loadDiscoverySections() {
    await Promise.all([
      loadTrendingDevelopers(),
      loadTrendingTopics(),
      loadRisingRepos()
    ]);
  }

  function getCutoffDate() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (timeRange === "month" ? 30 : 7));
    return cutoff;
  }

  async function fetchGitHubJson(url) {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (session?.provider_token) headers.Authorization = `Bearer ${session.provider_token}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error("GitHub discovery request failed.");
    return response.json();
  }

  async function fetchGitHubExploreRepos({ page: githubPage = 1, limit = PAGE_SIZE, minStars = 250, searchTerm = search, topic = topicFilter } = {}) {
    const parts = [];
    const trimmedSearch = searchTerm.trim();

    if (trimmedSearch) parts.push(`${trimmedSearch} in:name,description,readme`);
    if (topic) parts.push(`topic:${topic}`);
    if (language !== "All languages") parts.push(`language:${language}`);
    if (minStars > 0) parts.push(`stars:>${minStars}`);
    if (!parts.length) parts.push("stars:>500");

    const sortParam = sort === "recent" ? "updated" : "stars";
    const payload = await fetchGitHubJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(parts.join(" "))}&sort=${sortParam}&order=desc&page=${githubPage}&per_page=${limit}`);
    return (payload.items || []).map(mapGitHubRepoToExploreRepo);
  }

  async function fetchGitHubWorkspaceUsers() {
    const query = search.trim()
      ? `${search.trim()} type:user`
      : "type:user followers:>250 repos:>10";
    const payload = await fetchGitHubJson(`https://api.github.com/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=8`);
    const users = payload.items || [];
    const details = await Promise.all(users.map((user) => fetchGitHubJson(user.url).catch(() => user)));
    return details.map(mapGitHubUserToWorkspace);
  }

  async function fetchGitHubTrendingRepos() {
    const cutoff = getCutoffDate().toISOString().slice(0, 10);
    const query = `created:>=${cutoff} stars:>${timeRange === "month" ? 20 : 8}`;
    const payload = await fetchGitHubJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12`);
    return payload.items || [];
  }

  async function loadTrendingDevelopers() {
    const localDevelopers = [];

    if (supabase) {
      const cutoff = getCutoffDate().toISOString();
      const { data } = await supabase
        .from("feed_events")
        .select("actor_id, profiles!feed_events_actor_id_fkey(id, username, display_name, avatar_style, avatar_url, professional_title, bio)")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(300);

      const grouped = (data || []).reduce((map, event) => {
        if (!event.actor_id || !event.profiles?.username) return map;
        const existing = map.get(event.actor_id) || { id: event.actor_id, profile: event.profiles, count: 0 };
        existing.count += 1;
        map.set(event.actor_id, existing);
        return map;
      }, new Map());
      localDevelopers.push(...[...grouped.values()].sort((a, b) => b.count - a.count));
    }

    const githubDevelopers = await loadGitHubDevelopers().catch(() => []);
    setTrendingDevelopers(mergeByUsername(localDevelopers, githubDevelopers).slice(0, 6));
  }

  async function loadGitHubDevelopers() {
    const query = "type:user followers:>100 repos:>5";
    const payload = await fetchGitHubJson(`https://api.github.com/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=6`);
    const users = payload.items || [];
    const details = await Promise.all(users.map((user) => (
      fetchGitHubJson(user.url).catch(() => user)
    )));

    return details.map((user) => ({
      id: `github-${user.login}`,
      externalUrl: user.html_url || `https://github.com/${user.login}`,
      count: user.followers || user.score || 0,
      metricLabel: `${(user.followers || 0).toLocaleString()} GitHub followers`,
      profile: {
        username: user.login,
        display_name: user.name || user.login,
        avatar_url: user.avatar_url,
        html_url: user.html_url || `https://github.com/${user.login}`,
        professional_title: user.bio || `${user.public_repos || 0} public repos on GitHub`,
        bio: user.bio || "",
        avatar_style: "sky"
      }
    }));
  }

  async function loadTrendingTopics() {
    let localRows = [];
    if (supabase) {
      const cutoff = getCutoffDate().toISOString();
      const { data } = await supabase
        .from("repo_topics")
        .select("topic, repositories!inner(updated_at, is_private)")
        .eq("repositories.is_private", false)
        .gte("repositories.updated_at", cutoff)
        .limit(600);
      localRows = data || [];
    }

    const githubRepos = await fetchGitHubTrendingRepos().catch(() => []);
    const githubRows = githubRepos.flatMap((repo) => (repo.topics || []).map((topic) => ({ topic })));
    const counts = [...localRows, ...githubRows].reduce((map, item) => {
      if (!item.topic) return map;
      map[item.topic] = (map[item.topic] || 0) + 1;
      return map;
    }, {});

    setTrendingTopics(Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([topic, count]) => ({ topic, count })));
  }

  async function loadRisingRepos() {
    const localRising = [];

    if (supabase) {
      const cutoffDate = getCutoffDate().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("repo_snapshots")
        .select("*, repositories(*, profiles!repositories_owner_id_fkey(username, display_name, avatar_style))")
        .gte("snapshot_date", cutoffDate)
        .order("snapshot_date", { ascending: true })
        .limit(600);

      const byRepo = new Map();
      (data || []).forEach((snapshot) => {
        const repo = snapshot.repositories;
        if (!repo || repo.is_private) return;
        const current = byRepo.get(snapshot.repo_id);
        if (!current || new Date(snapshot.snapshot_date) < new Date(current.snapshot_date)) {
          byRepo.set(snapshot.repo_id, snapshot);
        }
      });

      localRising.push(...[...byRepo.values()].map((snapshot) => ({
        id: snapshot.repo_id,
        repository: snapshot.repositories,
        velocity: Math.max(0, (snapshot.repositories?.stars_count || 0) - (snapshot.stars_count || 0))
      })));
    }

    const githubRising = await loadGitHubRisingRepos().catch(() => []);
    const merged = [...localRising, ...githubRising]
      .sort((a, b) => b.velocity - a.velocity || (b.repository?.stars_count || 0) - (a.repository?.stars_count || 0))
      .slice(0, 10);

    if (merged.length || !supabase) {
      setRisingRepos(merged);
      return;
    }

    const { data: fallbackRepos } = await supabase
      .from("repositories")
      .select("*, profiles!repositories_owner_id_fkey(username, display_name, avatar_style)")
      .eq("is_private", false)
      .order("stars_count", { ascending: false })
      .limit(10);

    setRisingRepos((fallbackRepos || []).map((repo) => ({ id: repo.id, repository: repo, velocity: 0 })));
  }

  async function loadGitHubRisingRepos() {
    const repos = await fetchGitHubTrendingRepos();
    return repos.map((repo) => ({
      id: `github-${repo.id}`,
      externalUrl: repo.html_url,
      velocity: repo.stargazers_count || 0,
      repository: {
        id: `github-${repo.id}`,
        name: repo.name,
        description: repo.description || "",
        language: repo.language || "Code",
        stars_count: repo.stargazers_count || 0,
        profiles: {
          username: repo.owner?.login,
          display_name: repo.owner?.login,
          avatar_style: "sky"
        }
      }
    }));
  }

  function filterRepos(items) {
    const term = search.trim().toLowerCase();
    return items.filter((repo) => {
      const owner = repo.profiles || {};
      const matchesLanguage = language === "All languages" || repo.language === language;
      const haystack = `${repo.name} ${repo.description || ""} ${owner.username || ""} ${owner.display_name || ""}`.toLowerCase();
      return matchesLanguage && (!term || haystack.includes(term));
    });
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadRepos(nextPage);
  }

  const languages = useMemo(() => {
    return ["All languages", ...Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean))).sort()];
  }, [repos]);

  const visibleRepos = activeFilter === "Workspaces" || activeFilter === "Developers" ? [] : repos;
  const visibleWorkspaces = activeFilter === "Repos" ? [] : workspaces;

  return (
    <main className="explore-page">
      <header className="explore-header">
        <h1>Explore</h1>
        <p>{topicFilter ? `Discover repos tagged ${topicFilter}.` : "Discover repos, workspaces, and developers."}</p>
      </header>

      {sessionChecked && supabase && !session && (
        <div className="explore-auth-note">
          Explore is currently powered by live GitHub discovery while the ForAllCode community grows.
          <Link to="/login"> Sign in</Link>
        </div>
      )}

      <section className="explore-filter-bar" aria-label="Explore filters">
        <div className="explore-filter-pills">
          {filters.map((filter) => (
            <button className={activeFilter === filter ? "active" : ""} key={filter} onClick={() => setActiveFilter(filter)} type="button">
              {filter}
            </button>
          ))}
        </div>
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          {languages.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recent">Recently active</option>
          <option value="stars">Most stars</option>
          <option value="newest">Newest</option>
        </select>
        <label className="explore-search">
          <Search size={16} />
          <input placeholder="Search public repos and users..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </section>

      <section className="explore-discovery-tabs" aria-label="Explore discovery sections">
        <div className="explore-tab-row">
          {exploreTabs.map((tab) => (
            <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)} type="button">
              {tab}
            </button>
          ))}
        </div>
        {["Trending", "Rising", "Topics", "Developers"].includes(activeTab) && (
          <div className="explore-range-toggle" aria-label="Discovery time range">
            <button className={timeRange === "week" ? "active" : ""} onClick={() => setTimeRange("week")} type="button">This week</button>
            <button className={timeRange === "month" ? "active" : ""} onClick={() => setTimeRange("month")} type="button">This month</button>
          </div>
        )}
      </section>

      {activeTab === "Featured" && (
        <>
          <section className="explore-spotlight-section">
            <div className="explore-section-heading">
              <p className="eyebrow">Developer spotlight</p>
              <span>Weekly notes from the ForAllCode community</span>
            </div>
            {spotlights.length > 0 ? (
              <div className="spotlight-grid">
                {spotlights.map((entry) => <SpotlightCard entry={entry} key={entry.id} />)}
              </div>
            ) : (
              <p className="explore-empty spotlight-empty">This week's spotlight is being prepared.</p>
            )}
          </section>

          <section className="explore-featured-section">
            <div className="explore-section-heading">
              <p className="eyebrow">Featured</p>
              <span>Live from GitHub while ForAllCode grows</span>
            </div>
            <div className="explore-featured-grid">
              {featured.slice(0, 2).map((repo, index) => <FeaturedCard index={index} key={repo.id || repo.name} repo={repo} />)}
            </div>
          </section>
        </>
      )}

      {activeTab === "Trending" && (
        <section className="explore-discovery-grid">
          <TrendingDevelopers developers={trendingDevelopers} range={timeRange} />
          <TrendingTopics topics={trendingTopics} range={timeRange} />
        </section>
      )}

      {activeTab === "Rising" && <RisingRepos repos={risingRepos} range={timeRange} />}
      {activeTab === "Topics" && <TrendingTopics topics={trendingTopics.length ? trendingTopics : topTopics} range={timeRange} />}
      {activeTab === "Developers" && <TrendingDevelopers developers={trendingDevelopers} range={timeRange} />}

      {activeTab === "Featured" && <section className="explore-main-grid">
        <div>
          <div className="explore-section-heading">
            <p className="eyebrow">Repositories</p>
            <span>{topicFilter ? `Live GitHub repos tagged #${topicFilter}` : "Live GitHub repositories ordered by stars"}</span>
          </div>
          {topicFilter && (
            <Link className="explore-clear-topic" to="/explore">Clear topic filter</Link>
          )}
          <div className="explore-repo-grid">
            {loading && visibleRepos.length === 0
              ? <ExploreGridSkeleton />
              : visibleRepos.map((repo) => <ExploreRepoCard key={repo.id || `${repo.profiles?.username}-${repo.name}`} repo={repo} />)}
          </div>
          {!loading && visibleRepos.length === 0 && <p className="explore-empty">No repositories match those filters.</p>}
          {visibleRepos.length > 0 && hasMore && (
            <button className="button soft explore-load-more" disabled={loading} onClick={handleLoadMore} type="button">
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>

        <aside className="explore-workspaces">
          <div className="explore-topics-card">
            <div className="explore-section-heading">
              <p className="eyebrow">Topics</p>
              <span>Most used tags</span>
            </div>
            <div className="explore-topic-pills">
              {topTopics.map((item) => (
                <Link className={topicFilter === item.topic ? "active" : ""} key={item.topic} to={`/explore?topic=${encodeURIComponent(item.topic)}`}>
                  {item.topic}<span>{item.count}</span>
                </Link>
              ))}
              {topTopics.length === 0 && <p className="explore-empty">Topics will appear as repos add them.</p>}
            </div>
          </div>
          <div className="explore-section-heading">
            <p className="eyebrow">Public workspaces</p>
            <span>Live GitHub developers</span>
          </div>
          {visibleWorkspaces.map((profile) => <WorkspaceCard key={profile.id || profile.username} profile={profile} />)}
          {visibleWorkspaces.length === 0 && <p className="explore-empty">No shared workspaces match those filters.</p>}
        </aside>
      </section>}
    </main>
  );
}

function ExploreGridSkeleton() {
  return Array.from({ length: 6 }).map((_, index) => (
    <article className="explore-repo-card explore-repo-skeleton" key={index}>
      <div className="explore-owner-row">
        <Skeleton className="skeleton-avatar" />
        <span>
          <Skeleton className="skeleton-text medium" />
          <Skeleton className="skeleton-text short" />
        </span>
      </div>
      <Skeleton className="skeleton-text wide" />
      <Skeleton lines={2} />
      <div className="explore-repo-meta">
        <Skeleton className="skeleton-pill" />
        <Skeleton className="skeleton-text short" />
      </div>
    </article>
  ));
}

function sortRepos(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === "recent") return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    if (sort === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return (b.stars_count || 0) - (a.stars_count || 0);
  });
}

function mergeByUsername(primary, secondary) {
  const seen = new Set();
  return [...primary, ...secondary].filter((item) => {
    const username = item.profile?.username;
    if (!username || seen.has(username)) return false;
    seen.add(username);
    return true;
  });
}

function mapGitHubRepoToExploreRepo(repo) {
  return {
    id: `github-${repo.id}`,
    name: repo.name,
    description: repo.description || "Live GitHub repository",
    language: repo.language || "Code",
    stars_count: repo.stargazers_count || 0,
    forks_count: repo.forks_count || 0,
    updated_at: repo.updated_at,
    created_at: repo.created_at,
    externalUrl: repo.html_url,
    repo_topics: (repo.topics || []).slice(0, 8).map((topic) => ({ topic })),
    profiles: {
      username: repo.owner?.login || "github",
      display_name: repo.owner?.login || "GitHub",
      avatar_style: "sky",
      avatar_url: repo.owner?.avatar_url,
      html_url: repo.owner?.html_url || `https://github.com/${repo.owner?.login || ""}`
    }
  };
}

function mapGitHubUserToWorkspace(user) {
  return {
    id: `github-${user.login}`,
    username: user.login,
    display_name: user.name || user.login,
    avatar_style: "sky",
    avatar_url: user.avatar_url,
    bio: user.bio || "",
    repos_count: user.public_repos || 0,
    followers_count: user.followers || 0,
    externalUrl: user.html_url || `https://github.com/${user.login}`
  };
}

function FeaturedCard({ repo, index }) {
  const owner = repo.profiles || {};
  const href = repo.externalUrl || `/${owner.username || "unknown"}/${repo.name}`;
  const isExternal = Boolean(repo.externalUrl);
  return (
    <LinkOrAnchor className={`explore-featured-card card-${index + 1}`} external={isExternal} href={href}>
      <span>{owner.display_name || owner.username || "ForAllCode"}</span>
      <h2>{repo.name}</h2>
      <p>{repo.description}</p>
      <div><strong>{repo.stars_count || 0} stars</strong><strong>{repo.language || "Code"}</strong></div>
    </LinkOrAnchor>
  );
}

function ExploreRepoCard({ repo }) {
  const owner = repo.profiles || {};
  const username = owner.username || "unknown";
  const repoHref = repo.externalUrl || `/${username}/${repo.name}`;
  const ownerHref = owner.html_url || (repo.externalUrl ? `https://github.com/${username}` : `/${username}`);
  const isExternal = Boolean(repo.externalUrl);
  return (
    <article className="explore-repo-card">
      <LinkOrAnchor className="explore-owner-row" external={Boolean(owner.html_url || repo.externalUrl)} href={ownerHref}>
        <IllustratedAvatar size={34} variant={owner.avatar_style || "sage"} photoUrl={owner.avatar_url} />
        <span>{owner.display_name || username}<small>@{username}</small></span>
      </LinkOrAnchor>
      <h3><LinkOrAnchor external={isExternal} href={repoHref}>{username} / {repo.name}</LinkOrAnchor></h3>
      <p>{repo.description}</p>
      <div className="explore-repo-meta">
        <LanguagePill language={repo.language} />
        <span><Star size={14} />{repo.stars_count || 0}</span>
      </div>
      {repo.repo_topics?.length > 0 && (
        <div className="explore-card-topics">
          {repo.repo_topics.slice(0, 4).map((item) => (
            <Link key={item.topic} to={`/explore?topic=${encodeURIComponent(item.topic)}`}>{item.topic}</Link>
          ))}
        </div>
      )}
    </article>
  );
}

function WorkspaceCard({ profile }) {
  const username = profile.username || "developer";
  const href = profile.externalUrl || `/${username}`;
  return (
    <LinkOrAnchor className="explore-workspace-card" external={Boolean(profile.externalUrl)} href={href}>
      <IllustratedAvatar size={40} variant={profile.avatar_style || "sage"} photoUrl={profile.avatar_url} />
      <span>
        <strong>{profile.display_name || username}</strong>
        <small>@{username}</small>
        <em>{profile.repos_count || 0} repos · {profile.followers_count || 0} followers</em>
        <b>{profile.externalUrl ? "View on GitHub →" : "View workspace →"}</b>
      </span>
    </LinkOrAnchor>
  );
}

function LinkOrAnchor({ children, className, external, href }) {
  if (external) {
    return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
  }
  return <Link className={className} to={href}>{children}</Link>;
}

function LanguagePill({ language }) {
  const [background, color] = languageStyles[language] || languageStyles.TypeScript;
  return (
    <span className="explore-language-pill" style={{ backgroundColor: background, color }}>
      <i style={{ backgroundColor: color }} />
      {language || "TypeScript"}
    </span>
  );
}
