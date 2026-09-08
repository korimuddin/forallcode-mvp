import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleDot, Search as SearchIcon, Star } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import Skeleton from "../components/ui/Skeleton";
import { performSearch } from "../lib/globalSearch";
import { useDocumentTitle } from "../lib/hooks";

const tabs = [
  ["all", "All"],
  ["repos", "Repositories"],
  ["users", "Users"],
  ["issues", "Issues"],
  ["lessons", "Lessons"]
];

const perPage = 10;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const type = params.get("type") || "all";
  useDocumentTitle(query ? `Search ${query}` : "Search");
  const [results, setResults] = useState({ repos: [], users: [], issues: [], lessons: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;

    async function search() {
      setPage(1);
      if (!query.trim()) {
        setResults({ repos: [], users: [], issues: [], lessons: [] });
        return;
      }

      setLoading(true);
      setError("");
      try {
        const nextResults = await performSearch(query, "all");
        if (alive) setResults(nextResults);
      } catch (searchError) {
        if (alive) setError(searchError.message || "Search is taking a breather. Try again in a moment.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    search();
    return () => {
      alive = false;
    };
  }, [query]);

  const counts = {
    all: Object.values(results).reduce((total, items) => total + items.length, 0),
    repos: results.repos.length,
    users: results.users.length,
    issues: results.issues.length,
    lessons: results.lessons.length
  };

  const visibleItems = useMemo(() => {
    if (type === "all") {
      return [
        ...results.repos.map((item) => ({ type: "repos", item })),
        ...results.users.map((item) => ({ type: "users", item })),
        ...results.issues.map((item) => ({ type: "issues", item })),
        ...results.lessons.map((item) => ({ type: "lessons", item }))
      ];
    }
    return (results[type] || []).map((item) => ({ type, item }));
  }, [results, type]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / perPage));
  const pagedItems = visibleItems.slice((page - 1) * perPage, page * perPage);

  function updateType(nextType) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("type", nextType);
    setParams(nextParams);
    setPage(1);
  }

  return (
    <div className="search-page">
      <header className="search-page-header">
        <div>
          <span className="eyebrow">Global search</span>
          <h1>{counts.all} results for &ldquo;{query || "everything"}&rdquo;</h1>
        </div>
        <form onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("q") || "";
          setParams({ q: value.toString(), type: "all" });
        }}>
          <SearchIcon size={17} />
          <input name="q" defaultValue={query} placeholder="Search repos, users, issues, lessons" />
        </form>
      </header>

      <div className="search-type-tabs">
        {tabs.map(([value, label]) => (
          <button className={type === value ? "active" : ""} key={value} onClick={() => updateType(value)} type="button">
            {label} <span>{counts[value]}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="search-results-list">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton className="search-result-skeleton" key={index} />)}
        </div>
      )}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && !error && pagedItems.length === 0 && (
        <EmptyState
          icon={<SearchIcon size={34} />}
          title={query ? `Nothing matched '${query}'.` : "Search can help when you know what you want."}
          body={query ? "Try fewer words, or browse Explore for inspiration." : "Try a repository name, username, issue title, or lesson topic."}
          actionLabel="Browse Explore"
          to="/explore"
        />
      )}
      {!loading && !error && pagedItems.length > 0 && (
        <div className="search-results-list">
          {pagedItems.map(({ type: itemType, item }) => (
            <SearchResultCard item={item} key={`${itemType}-${item.id || item.slug}`} type={itemType} />
          ))}
        </div>
      )}

      {!loading && !error && pageCount > 1 && (
        <div className="issue-pagination">
          <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} type="button">Next</button>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ item, type }) {
  if (type === "repos") {
    const owner = item.profiles?.username || "repo";
    return (
      <Link className="search-result-card repo-result" to={`/${owner}/${item.name}`}>
        <div>
          <span className="language-dot" />
          <strong>{owner} / {item.name}</strong>
        </div>
        <p>{item.description || "No description yet."}</p>
        <small><Star size={13} /> {item.stars_count || 0} · {item.language || "Code"} · Updated {formatDate(item.updated_at)}</small>
      </Link>
    );
  }

  if (type === "users") {
    return (
      <Link className="search-result-card user-result" to={`/${item.username}`}>
        <IllustratedAvatar size={36} variant={item.avatar_style || "sage"} photoUrl={item.avatar_url} />
        <div>
          <strong>@{item.username}</strong>
          <span>{item.display_name || item.username}</span>
          <p>{item.bio || "ForAllCode builder"}</p>
          <small>{item.location || "Public profile"}</small>
        </div>
      </Link>
    );
  }

  if (type === "issues") {
    const repo = item.repositories;
    const owner = repo?.profiles?.username || "repo";
    return (
      <Link className="search-result-card issue-result" to={`/${owner}/${repo?.name}/issues/${item.number}`}>
        <CircleDot className={item.status === "open" ? "open" : "closed"} size={18} />
        <div>
          <strong>{item.title}</strong>
          <small>#{item.number} · {owner}/{repo?.name} · opened {formatDate(item.created_at)}</small>
        </div>
      </Link>
    );
  }

  return (
    <Link className="search-result-card lesson-result" to={`/learn/${item.slug}`}>
      <span className={`lesson-tag ${item.tag}`}>{item.tag}</span>
      <div>
        <strong>{item.title}</strong>
        <p>{item.description}</p>
        <small>{item.trackName}</small>
      </div>
    </Link>
  );
}

function formatDate(value) {
  if (!value) return "recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
