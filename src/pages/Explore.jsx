import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Star } from "lucide-react";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { getCurrentSession, supabase } from "../lib/supabase";

const PAGE_SIZE = 12;

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

export default function Explore() {
  useDocumentTitle("Explore");
  const [searchParams] = useSearchParams();
  const topicFilter = searchParams.get("topic") || "";
  const [sessionChecked, setSessionChecked] = useState(false);
  const [session, setSession] = useState(null);
  const [repos, setRepos] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [topTopics, setTopTopics] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [language, setLanguage] = useState("All languages");
  const [sort, setSort] = useState("stars");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

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
    loadWorkspaces();
    loadTopTopics();
  }, [language, sort, search, topicFilter]);

  async function loadFeatured() {
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

  async function loadRepos(nextPage = page, replace = false) {
    setLoading(true);
    const start = nextPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

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
          Explore is an authenticated view. You are seeing demo discovery data until you sign in.
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

      <section className="explore-featured-section">
        <div className="explore-section-heading">
          <p className="eyebrow">Featured</p>
          <span>Handpicked by ForAllCode</span>
        </div>
        <div className="explore-featured-grid">
          {featured.slice(0, 2).map((repo, index) => <FeaturedCard index={index} key={repo.id || repo.name} repo={repo} />)}
        </div>
      </section>

      <section className="explore-main-grid">
        <div>
          <div className="explore-section-heading">
            <p className="eyebrow">Repositories</p>
            <span>{topicFilter ? `Filtered by #${topicFilter}` : "Public repos ordered by stars"}</span>
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
            <span>Developers who've shared their desk</span>
          </div>
          {visibleWorkspaces.map((profile) => <WorkspaceCard key={profile.id || profile.username} profile={profile} />)}
          {visibleWorkspaces.length === 0 && <p className="explore-empty">No shared workspaces match those filters.</p>}
        </aside>
      </section>
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

function FeaturedCard({ repo, index }) {
  const owner = repo.profiles || {};
  return (
    <Link className={`explore-featured-card card-${index + 1}`} to={`/${owner.username || "unknown"}/${repo.name}`}>
      <span>{owner.display_name || owner.username || "ForAllCode"}</span>
      <h2>{repo.name}</h2>
      <p>{repo.description}</p>
      <div><strong>{repo.stars_count || 0} stars</strong><strong>{repo.language || "Code"}</strong></div>
    </Link>
  );
}

function ExploreRepoCard({ repo }) {
  const owner = repo.profiles || {};
  const username = owner.username || "unknown";
  return (
    <article className="explore-repo-card">
      <Link className="explore-owner-row" to={`/${username}`}>
        <IllustratedAvatar size={34} variant={owner.avatar_style || "sage"} />
        <span>{owner.display_name || username}<small>@{username}</small></span>
      </Link>
      <h3><Link to={`/${username}/${repo.name}`}>{username} / {repo.name}</Link></h3>
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
  return (
    <Link className="explore-workspace-card" to={`/${username}`}>
      <IllustratedAvatar size={40} variant={profile.avatar_style || "sage"} />
      <span>
        <strong>{profile.display_name || username}</strong>
        <small>@{username}</small>
        <em>{profile.repos_count || 0} repos · {profile.followers_count || 0} followers</em>
        <b>View workspace →</b>
      </span>
    </Link>
  );
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
