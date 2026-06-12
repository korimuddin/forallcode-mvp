import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Hint from "../components/ui/Hint";
import Skeleton from "../components/ui/Skeleton";
import { CATEGORY_STYLES, getDiscussionCommentCount } from "../lib/discussions";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { useRepoAccess } from "../lib/useRepoAccess";

const categoryTabs = [["all", "All"], ...Object.entries(CATEGORY_STYLES).map(([key, style]) => [key, style.label])];

export default function DiscussionList() {
  const { username, repo: repoName } = useParams();
  const navigate = useNavigate();
  useDocumentTitle(`Discussions · ${repoName} · ${username}`);
  const [repo, setRepo] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [category, setCategory] = useState("all");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { canMerge } = useRepoAccess(repo?.id, repo?.owner_id);

  useEffect(() => {
    let alive = true;

    async function loadDiscussions() {
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
        setDiscussions([]);
        setLoading(false);
        return;
      }

      setRepo(repository);

      const { data, error: discussionError } = await supabase
        .from("discussions")
        .select(`
          *,
          profiles!discussions_author_id_fkey(username, display_name, avatar_style),
          discussion_comments(count)
        `)
        .eq("repo_id", repository.id)
        .order("updated_at", { ascending: false });

      if (!alive) return;
      if (discussionError) {
        setError(discussionError.message);
        setDiscussions([]);
      } else {
        setDiscussions(data || []);
      }
      setLoading(false);
    }

    loadDiscussions();
    return () => {
      alive = false;
    };
  }, [repoName, username]);

  const visibleDiscussions = useMemo(() => (
    discussions.filter((discussion) => category === "all" || discussion.category === category)
  ), [category, discussions]);

  return (
    <div className="issue-list-page discussion-list-page">
      <DiscussionRepoHeader
        active="discussions"
        canCreate={signedIn}
        repo={repo}
        repoName={repoName}
        showInsights={canMerge}
        username={username}
      />

      <div className="discussion-category-tabs">
        {categoryTabs.map(([key, label]) => (
          <button className={category === key ? "active" : ""} key={key} onClick={() => setCategory(key)} type="button">
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="issue-list-loading">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="issue-skeleton-row" />)}
        </div>
      )}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && !error && visibleDiscussions.length === 0 && (
        <EmptyState
          icon={<MessageCircle size={34} />}
          title="This is where project conversations can begin."
          body="Ask a question, share an idea, or start a small show-and-tell thread when there is something worth talking through."
          actionLabel={signedIn ? "Start a discussion" : undefined}
          to={signedIn ? `/${username}/${repoName}/discussions/new` : undefined}
        />
      )}
      {!loading && !error && visibleDiscussions.length > 0 && (
        <div className="discussion-list">
          {visibleDiscussions.map((discussion) => (
            <DiscussionCard
              discussion={discussion}
              key={discussion.id}
              onClick={() => navigate(`/${username}/${repoName}/discussions/${discussion.number}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DiscussionRepoHeader({ active, canCreate = false, repo, repoName, showInsights, username }) {
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
        <Link to={`/${username}/${repoName}/pulls`}><Hint term="pull-request">Pull requests</Hint></Link>
        <Link className={active === "discussions" ? "active" : ""} to={`/${username}/${repoName}/discussions`}>Discussions</Link>
        <Link to={`/${username}/${repoName}/projects`}>Projects</Link>
        {showInsights && <Link to={`/${username}/${repoName}/insights`}>Insights</Link>}
        <Link to={`/${username}/${repoName}`}><Hint term="commit">Commits</Hint></Link>
        <Link to={`/${username}/${repoName}`}><Hint term="branch">Branches</Hint></Link>
        <Link to={`/${username}/${repoName}`}>Settings</Link>
      </nav>
      <div className="issues-header-row">
        <div>
          <p className="eyebrow">Community</p>
          <h2>Discussions</h2>
        </div>
        {canCreate && (
          <Link className="new-issue-button" to={`/${username}/${repoName}/discussions/new`}>
            <Plus size={16} />New discussion
          </Link>
        )}
      </div>
    </>
  );
}

export function DiscussionCard({ discussion, onClick }) {
  const style = CATEGORY_STYLES[discussion.category] || CATEGORY_STYLES.general;
  const author = discussion.profiles || {};
  const commentCount = getDiscussionCommentCount(discussion);

  return (
    <button className="discussion-card" onClick={onClick} type="button">
      <span className="discussion-category-icon" style={{ background: style.bg, color: style.color }}>
        {discussion.category === "q-and-a" && discussion.is_answered ? "✓" : "◌"}
      </span>
      <span className="discussion-card-content">
        <span className="discussion-card-title-row">
          <strong>{discussion.title}</strong>
          <em style={{ background: style.bg, color: style.color }}>{style.label}</em>
          {discussion.is_answered && <b>Answered</b>}
        </span>
        <span className="discussion-card-meta">
          #{discussion.number} · @{author.username || "developer"} · {formatDistanceToNow(new Date(discussion.created_at))} ago · {commentCount} comment{commentCount === 1 ? "" : "s"} · {discussion.views || 0} views
        </span>
      </span>
    </button>
  );
}
