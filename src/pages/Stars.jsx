import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Search, Star } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import Skeleton from "../components/ui/Skeleton";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

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

export default function StarsPage() {
  useDocumentTitle("Starred repositories");
  const { checked, session, loggedIn } = useAuthSession();
  const [starred, setStarred] = useState([]);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All languages");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadStars() {
      if (!checked || !session?.user?.id) {
        if (checked) setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data, error: starsError } = await supabase
        .from("stars")
        .select("*, repositories(*, profiles!repositories_owner_id_fkey(username, display_name, avatar_style), repo_topics(topic))")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!alive) return;
      if (starsError) {
        setError(starsError.message);
        setStarred([]);
      } else {
        setStarred(data || []);
      }
      setLoading(false);
    }

    loadStars();
    return () => {
      alive = false;
    };
  }, [checked, session?.user?.id]);

  useEffect(() => {
    setPage(1);
  }, [language, search, sort]);

  const repos = useMemo(() => starred.map((item) => ({
    ...item.repositories,
    starred_at: item.created_at
  })).filter(Boolean), [starred]);

  const languages = useMemo(() => {
    return ["All languages", ...Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean))).sort()];
  }, [repos]);

  const filteredRepos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return repos
      .filter((repo) => language === "All languages" || repo.language === language)
      .filter((repo) => {
        const haystack = `${repo.name} ${repo.description || ""}`.toLowerCase();
        return !term || haystack.includes(term);
      })
      .sort((a, b) => {
        if (sort === "stars") return (b.stars_count || 0) - (a.stars_count || 0);
        if (sort === "name") return a.name.localeCompare(b.name);
        return new Date(b.starred_at || 0) - new Date(a.starred_at || 0);
      });
  }, [language, repos, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredRepos.length / PAGE_SIZE));
  const visibleRepos = filteredRepos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (checked && !loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="stars-page">
      <header className="stars-header">
        <span className="eyebrow">Saved for later</span>
        <h1>Starred repositories</h1>
        <p>Repos you want to keep close, revisit, or learn from.</p>
      </header>

      <section className="stars-filter-row" aria-label="Starred repository filters">
        <label>
          <Search size={16} />
          <input placeholder="Search starred repos..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          {languages.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recent">Recently starred</option>
          <option value="stars">Most stars</option>
          <option value="name">Name A-Z</option>
        </select>
      </section>

      {loading && (
        <div className="stars-grid">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton className="stars-card-skeleton" key={index} />)}
        </div>
      )}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && !error && visibleRepos.length === 0 && (
        <EmptyState
          icon={<Star size={34} />}
          title="Save inspiring projects here."
          body="Star repositories you want to revisit, learn from, or keep close while you build your own style."
          actionLabel="Explore repositories"
          to="/explore"
        />
      )}
      {!loading && !error && visibleRepos.length > 0 && (
        <div className="stars-grid">
          {visibleRepos.map((repo) => <StarredRepoCard key={repo.id || repo.name} repo={repo} />)}
        </div>
      )}

      {!loading && !error && pageCount > 1 && (
        <div className="issue-pagination">
          <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} type="button">Next</button>
        </div>
      )}
    </main>
  );
}

function StarredRepoCard({ repo }) {
  const owner = repo.profiles || {};
  const username = owner.username || "unknown";

  return (
    <article className="starred-repo-card">
      <Link className="explore-owner-row" to={`/${username}`}>
        <IllustratedAvatar size={34} variant={owner.avatar_style || "sage"} />
        <span>{owner.display_name || username}<small>@{username}</small></span>
      </Link>
      <h2><Link to={`/${username}/${repo.name}`}>{username} / {repo.name}</Link></h2>
      <p>{repo.description || "No description yet."}</p>
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

function LanguagePill({ language }) {
  const [background, color] = languageStyles[language] || languageStyles.TypeScript;
  return (
    <span className="explore-language-pill" style={{ backgroundColor: background, color }}>
      <i style={{ backgroundColor: color }} />
      {language || "TypeScript"}
    </span>
  );
}
