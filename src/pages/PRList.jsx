import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GitPullRequest, Plus } from "lucide-react";
import PRCard, { getPRCommentCount } from "../components/pr/PRCard";
import EmptyState from "../components/ui/EmptyState";
import Hint from "../components/ui/Hint";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { useRepoAccess } from "../lib/useRepoAccess";

const prsPerPage = 20;

function PRFilterBar({ search, sort, status, onSearchChange, onSortChange, onStatusChange }) {
  return (
    <div className="issue-filter-bar pr-filter-bar">
      <select aria-label="Filter pull requests" value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="open">Open</option>
        <option value="merged">Merged</option>
        <option value="closed">Closed</option>
      </select>
      <select aria-label="Sort pull requests" value={sort} onChange={(event) => onSortChange(event.target.value)}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="comments">Most commented</option>
        <option value="updated">Recently updated</option>
      </select>
      <input placeholder="Search pull requests..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
    </div>
  );
}

function RepoPRHeader({ activeStatus, counts, canCreate, onStatusChange, repo, repoName, showInsights, username }) {
  return (
    <>
      <section className="issue-repo-header">
        <div className="repo-breadcrumb">
          <Link to="/repos">{username}</Link>
          <b>/</b>
          <Link to={`/${username}/${repoName}`}>{repoName}</Link>
        </div>
        <h1>{repo?.hero_title || repoName}</h1>
        <p>{repo?.description || "GitHub repository"}</p>
      </section>
      <nav className="repo-tab-bar issue-page-tabs" aria-label="Repository navigation">
        <Link to={`/${username}/${repoName}`}>Code</Link>
        <Link to={`/${username}/${repoName}/issues`}>Issues</Link>
        <Link className="active" to={`/${username}/${repoName}/pulls`}>
          <Hint term="pull-request">Pull requests</Hint>
          {counts.open > 0 && <span className="repo-tab-count">{counts.open}</span>}
        </Link>
        <Link to={`/${username}/${repoName}/discussions`}>Discussions</Link>
        <Link to={`/${username}/${repoName}/projects`}>Projects</Link>
        {showInsights && <Link to={`/${username}/${repoName}/insights`}>Insights</Link>}
        <Link to={`/${username}/${repoName}`}><Hint term="commit">Commits</Hint></Link>
        <Link to={`/${username}/${repoName}`}><Hint term="branch">Branches</Hint></Link>
        <Link to={`/${username}/${repoName}`}>Settings</Link>
      </nav>
      <div className="issues-header-row">
        <div className="issue-status-tabs pr-status-tabs">
          {[
            ["open", "Open"],
            ["merged", "Merged"],
            ["closed", "Closed"]
          ].map(([value, label]) => (
            <button className={activeStatus === value ? "active" : ""} key={value} onClick={() => onStatusChange(value)} type="button">
              {value === "open" && <GitPullRequest size={16} />}
              {label} <strong>{counts[value]}</strong>
            </button>
          ))}
        </div>
        {canCreate && (
          <Link className="new-issue-button" to={`/${username}/${repoName}/pulls/new`}>
            <Plus size={16} />New <Hint term="pull-request">pull request</Hint>
          </Link>
        )}
      </div>
    </>
  );
}

export default function PRList() {
  const { username, repo: repoName } = useParams();
  const navigate = useNavigate();
  useDocumentTitle(`Pull requests · ${repoName} · ${username}`);
  const [repo, setRepo] = useState(null);
  const [pullRequests, setPullRequests] = useState([]);
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { canMerge, isContributor } = useRepoAccess(repo?.id, repo?.owner_id);

  useEffect(() => {
    let alive = true;

    async function loadPullRequests() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: repository, error: repoError } = await supabase
        .from("repositories")
        .select("*, profiles!repositories_owner_id_fkey!inner(id, username, display_name, avatar_style)")
        .eq("name", repoName)
        .eq("profiles.username", username)
        .maybeSingle();

      if (!alive) return;
      if (repoError || !repository) {
        setRepo(null);
        setPullRequests([]);
        setError(repoError?.message || "Repository not found.");
        setLoading(false);
        return;
      }

      setRepo(repository);

      const { data, error: prError } = await supabase
        .from("pull_requests")
        .select(`
          *,
          profiles!pull_requests_author_id_fkey(username, display_name, avatar_style),
          pr_comments(count)
        `)
        .eq("repo_id", repository.id)
        .order("created_at", { ascending: false });

      if (!alive) return;
      if (prError) {
        setPullRequests([]);
        setError(prError.message);
      } else {
        setPullRequests(data || []);
      }
      setLoading(false);
    }

    loadPullRequests();
    return () => {
      alive = false;
    };
  }, [repoName, username]);

  useEffect(() => {
    setPage(1);
  }, [search, sort, status]);

  const counts = useMemo(() => ({
    open: pullRequests.filter((pr) => pr.status === "open").length,
    merged: pullRequests.filter((pr) => pr.status === "merged").length,
    closed: pullRequests.filter((pr) => pr.status === "closed").length
  }), [pullRequests]);

  const filtered = useMemo(() => {
    return pullRequests
      .filter((pr) => pr.status === status)
      .filter((pr) => pr.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        if (sort === "comments") return getPRCommentCount(b) - getPRCommentCount(a);
        if (sort === "updated") return new Date(b.updated_at) - new Date(a.updated_at);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [pullRequests, search, sort, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / prsPerPage));
  const visiblePRs = filtered.slice((page - 1) * prsPerPage, page * prsPerPage);

  return (
    <div className="issue-list-page pr-list-page">
      <RepoPRHeader
        activeStatus={status}
        canCreate={isContributor}
        counts={counts}
        onStatusChange={setStatus}
        repo={repo}
        repoName={repoName}
        showInsights={canMerge}
        username={username}
      />

      <PRFilterBar
        onSearchChange={setSearch}
        onSortChange={setSort}
        onStatusChange={setStatus}
        search={search}
        sort={sort}
        status={status}
      />

      {loading && (
        <div className="issue-list-loading">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="issue-skeleton-row" />)}
        </div>
      )}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && !error && visiblePRs.length === 0 && (
        <EmptyState
          icon={<GitPullRequest size={34} />}
          title={status === "open" ? "Suggested changes will appear here." : "Reviewed changes will collect here."}
          body={status === "open" ? "A pull request is a way to suggest changes to a project. When someone is ready for review, you will see it here." : "Merged and closed pull requests help everyone understand how the project has grown over time."}
          actionLabel={isContributor ? "Open a pull request" : undefined}
          to={isContributor ? `/${username}/${repoName}/pulls/new` : undefined}
        />
      )}
      {!loading && !error && visiblePRs.length > 0 && (
        <div className="issue-list pr-list">
          {visiblePRs.map((pr) => (
            <PRCard
              key={pr.id}
              pr={pr}
              onClick={() => navigate(`/${username}/${repoName}/pulls/${pr.number}`)}
            />
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
