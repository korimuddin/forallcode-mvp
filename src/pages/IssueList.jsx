import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import IssueCard, { getIssueCommentCount } from "../components/issues/IssueCard";
import IssueFilters from "../components/issues/IssueFilters";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const issuesPerPage = 20;

function RepoIssuesHeader({ repo, username, repoName, activeStatus, onStatusChange, openCount, closedCount, signedIn }) {
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
        <Link className="active" to={`/${username}/${repoName}/issues`}>
          Issues
          {openCount > 0 && <span className="repo-tab-count">{openCount}</span>}
        </Link>
        <Link to={`/${username}/${repoName}/pulls`}>Pull requests</Link>
        <Link to={`/${username}/${repoName}/projects`}>Projects</Link>
        <Link to={`/${username}/${repoName}`}>Commits</Link>
        <Link to={`/${username}/${repoName}`}>Branches</Link>
        <Link to={`/${username}/${repoName}`}>Settings</Link>
      </nav>
      <div className="issues-header-row">
        <div className="issue-status-tabs">
          <button className={activeStatus === "open" ? "active" : ""} onClick={() => onStatusChange("open")} type="button">
            <span className="issue-status-dot open" />Open <strong>{openCount}</strong>
          </button>
          <button className={activeStatus === "closed" ? "active" : ""} onClick={() => onStatusChange("closed")} type="button">
            Closed <strong>{closedCount}</strong>
          </button>
        </div>
        {signedIn && (
          <Link className="new-issue-button" to={`/${username}/${repoName}/issues/new`}>
            <Plus size={16} />New issue
          </Link>
        )}
      </div>
    </>
  );
}

export default function IssueList() {
  const { username, repo: repoName } = useParams();
  const navigate = useNavigate();
  useDocumentTitle(`Issues · ${repoName} · ${username}`);
  const [repo, setRepo] = useState(null);
  const [issues, setIssues] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [signedIn, setSignedIn] = useState(false);
  const [activeStatus, setActiveStatus] = useState("open");
  const [label, setLabel] = useState("all");
  const [assignee, setAssignee] = useState("anyone");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadRepo() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      if (alive) setSignedIn(Boolean(sessionData.session?.user));

      const { data: repository, error: repoError } = await supabase
        .from("repositories")
        .select("*, profiles!repositories_owner_id_fkey!inner(id, username, display_name, avatar_style)")
        .eq("name", repoName)
        .eq("profiles.username", username)
        .maybeSingle();

      if (!alive) return;
      if (repoError || !repository) {
        setError(repoError?.message || "Repository not found.");
        setRepo(null);
        setIssues([]);
        setLoading(false);
        return;
      }

      setRepo(repository);

      const [{ data: issueRows, error: issueError }, { data: collaboratorRows }] = await Promise.all([
        supabase
          .from("issues")
          .select(`
            *,
            profiles!issues_author_id_fkey(username, display_name, avatar_style),
            assignee:profiles!issues_assignee_id_fkey(username, avatar_style),
            issue_comments(count)
          `)
          .eq("repo_id", repository.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("collaborators")
          .select("user_id, profiles(id, username, display_name, avatar_style)")
          .eq("repo_id", repository.id)
          .eq("status", "accepted")
      ]);

      if (!alive) return;
      if (issueError) {
        setError(issueError.message);
        setIssues([]);
      } else {
        setIssues(issueRows || []);
      }
      setCollaborators(collaboratorRows || []);
      setLoading(false);
    }

    loadRepo();
    return () => {
      alive = false;
    };
  }, [repoName, username]);

  useEffect(() => {
    setPage(1);
  }, [activeStatus, assignee, label, search, sort]);

  const openCount = issues.filter((issue) => issue.status === "open").length;
  const closedCount = issues.filter((issue) => issue.status === "closed").length;

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => issue.status === activeStatus)
      .filter((issue) => label === "all" || issue.label === label)
      .filter((issue) => {
        if (assignee === "anyone") return true;
        if (assignee === "unassigned") return !issue.assignee_id;
        return issue.assignee_id === assignee;
      })
      .filter((issue) => issue.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        if (sort === "comments") return getIssueCommentCount(b) - getIssueCommentCount(a);
        if (sort === "updated") return new Date(b.updated_at) - new Date(a.updated_at);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [activeStatus, assignee, issues, label, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredIssues.length / issuesPerPage));
  const visibleIssues = filteredIssues.slice((page - 1) * issuesPerPage, page * issuesPerPage);

  return (
    <div className="issue-list-page">
      <RepoIssuesHeader
        activeStatus={activeStatus}
        closedCount={closedCount}
        onStatusChange={setActiveStatus}
        openCount={openCount}
        repo={repo}
        repoName={repoName}
        signedIn={signedIn}
        username={username}
      />

      <IssueFilters
        assignee={assignee}
        collaborators={collaborators}
        label={label}
        onAssigneeChange={setAssignee}
        onLabelChange={setLabel}
        onSearchChange={setSearch}
        onSortChange={setSort}
        search={search}
        sort={sort}
      />

      {loading && (
        <div className="issue-list-loading">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="issue-skeleton-row" />)}
        </div>
      )}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && !error && visibleIssues.length === 0 && (
        <div className="issue-empty-state">
          <h2>No {activeStatus} issues yet</h2>
          <p>{activeStatus === "open" ? "This project is calm right now. New issues will appear here." : "Closed issues will collect here once work is wrapped up."}</p>
        </div>
      )}
      {!loading && !error && visibleIssues.length > 0 && (
        <div className="issue-list">
          {visibleIssues.map((issue) => (
            <IssueCard
              issue={issue}
              key={issue.id}
              onClick={() => navigate(`/${username}/${repoName}/issues/${issue.number}`)}
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
