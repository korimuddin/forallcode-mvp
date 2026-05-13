import { formatDistanceToNow } from "date-fns";
import { ArrowBigUp, CheckCircle2, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import Skeleton from "../components/ui/Skeleton";
import { createFeedEvent } from "../lib/createFeedEvent";
import { CATEGORY_STYLES } from "../lib/discussions";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { renderMarkdown } from "../lib/markdownRenderer";
import { supabase } from "../lib/supabase";
import { useRepoAccess } from "../lib/useRepoAccess";
import { DiscussionRepoHeader } from "./DiscussionList";

export default function DiscussionDetail() {
  const { username, repo: repoName, number } = useParams();
  const { session } = useAuthSession();
  useDocumentTitle(`Discussion #${number} · ${repoName} · ${username}`);
  const [repo, setRepo] = useState(null);
  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { canMerge } = useRepoAccess(repo?.id, repo?.owner_id);

  const canMarkAnswer = Boolean(
    discussion?.category === "q-and-a"
    && session?.user?.id
    && (session.user.id === discussion.author_id || session.user.id === repo?.owner_id)
  );

  useEffect(() => {
    let alive = true;

    async function loadDiscussion() {
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
        setError(repoError?.message || "Repository not found.");
        setLoading(false);
        return;
      }
      setRepo(repository);

      const { data: discussionRow, error: discussionError } = await supabase
        .from("discussions")
        .select("*, profiles!discussions_author_id_fkey(username, display_name, avatar_style, avatar_url)")
        .eq("repo_id", repository.id)
        .eq("number", Number(number))
        .maybeSingle();

      if (!alive) return;
      if (discussionError || !discussionRow) {
        setError(discussionError?.message || "Discussion not found.");
        setLoading(false);
        return;
      }

      setDiscussion(discussionRow);
      supabase.from("discussions").update({ views: (discussionRow.views || 0) + 1 }).eq("id", discussionRow.id).then(() => {});

      await loadComments(discussionRow.id, alive);
      setLoading(false);
    }

    loadDiscussion();
    return () => {
      alive = false;
    };
  }, [number, repoName, username]);

  async function loadComments(discussionId = discussion?.id, alive = true) {
    if (!supabase || !discussionId) return;
    const { data } = await supabase
      .from("discussion_comments")
      .select("*, profiles!discussion_comments_author_id_fkey(username, display_name, avatar_style, avatar_url)")
      .eq("discussion_id", discussionId)
      .order("created_at", { ascending: true });
    if (alive) setComments(data || []);

    if (session?.user?.id) {
      const { data: upvotes } = await supabase
        .from("discussion_upvotes")
        .select("comment_id")
        .eq("user_id", session.user.id)
        .in("comment_id", (data || []).map((comment) => comment.id));
      if (alive) setUpvotedIds(new Set((upvotes || []).map((item) => item.comment_id)));
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!supabase || !session?.user?.id || !discussion?.id || !commentBody.trim()) return;
    setSaving(true);
    try {
      const { error: insertError } = await supabase.from("discussion_comments").insert({
        discussion_id: discussion.id,
        author_id: session.user.id,
        body: commentBody.trim()
      });
      if (insertError) throw insertError;
      await supabase.from("discussions").update({ updated_at: new Date().toISOString() }).eq("id", discussion.id);
      createFeedEvent(supabase, {
        actorId: session.user.id,
        eventType: "discussion_commented",
        repoId: repo?.id,
        discussionId: discussion.id,
        metadata: { title: discussion.title, number: discussion.number }
      }).catch(() => {});
      setCommentBody("");
      await loadComments(discussion.id);
    } catch (commentError) {
      setError(commentError.message || "Could not add this comment.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleUpvote(comment) {
    if (!supabase || !session?.user?.id) return;
    const hasUpvoted = upvotedIds.has(comment.id);
    const nextUpvotes = Math.max(0, (comment.upvotes || 0) + (hasUpvoted ? -1 : 1));

    if (hasUpvoted) {
      await supabase.from("discussion_upvotes").delete().eq("user_id", session.user.id).eq("comment_id", comment.id);
    } else {
      await supabase.from("discussion_upvotes").insert({ user_id: session.user.id, comment_id: comment.id });
    }
    await supabase.from("discussion_comments").update({ upvotes: nextUpvotes }).eq("id", comment.id);
    setUpvotedIds((current) => {
      const next = new Set(current);
      if (hasUpvoted) next.delete(comment.id);
      else next.add(comment.id);
      return next;
    });
    setComments((current) => current.map((item) => item.id === comment.id ? { ...item, upvotes: nextUpvotes } : item));
  }

  async function markAsAnswer(commentId) {
    if (!supabase || !discussion?.id || !canMarkAnswer) return;
    await supabase.from("discussion_comments").update({ is_answer: false }).eq("discussion_id", discussion.id);
    await supabase.from("discussion_comments").update({ is_answer: true }).eq("id", commentId);
    await supabase.from("discussions").update({ is_answered: true, answer_comment_id: commentId }).eq("id", discussion.id);
    setDiscussion((current) => ({ ...current, is_answered: true, answer_comment_id: commentId }));
    setComments((current) => current.map((item) => ({ ...item, is_answer: item.id === commentId })));
  }

  const style = CATEGORY_STYLES[discussion?.category] || CATEGORY_STYLES.general;
  const sortedComments = useMemo(() => (
    [...comments].sort((a, b) => Number(b.is_answer) - Number(a.is_answer) || new Date(a.created_at) - new Date(b.created_at))
  ), [comments]);

  return (
    <div className="issue-list-page discussion-detail-page">
      <DiscussionRepoHeader active="discussions" canCreate={Boolean(session?.user)} repo={repo} repoName={repoName} showInsights={canMerge} username={username} />

      {loading && <div className="issue-list-loading"><Skeleton className="issue-skeleton-row" /><Skeleton className="route-skeleton-card" /></div>}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && !error && discussion && (
        <>
          <article className="discussion-detail-card">
            <div className="discussion-detail-heading">
              <span className="discussion-category-icon" style={{ background: style.bg, color: style.color }}>
                {discussion.category === "q-and-a" && discussion.is_answered ? "✓" : "◌"}
              </span>
              <div>
                <div className="discussion-card-title-row">
                  <h2>{discussion.title}</h2>
                  <em style={{ background: style.bg, color: style.color }}>{style.label}</em>
                  {discussion.is_answered && <b>Answered</b>}
                </div>
                <p>#{discussion.number} opened by @{discussion.profiles?.username || "developer"} · {discussion.views || 0} views</p>
              </div>
            </div>
            {discussion.body && <div className="readme-render discussion-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(discussion.body) }} />}
          </article>

          <section className="discussion-comments">
            <h3><MessageCircle size={18} /> {comments.length} comment{comments.length === 1 ? "" : "s"}</h3>
            {sortedComments.map((comment) => (
              <DiscussionComment
                canMarkAnswer={canMarkAnswer}
                comment={comment}
                hasUpvoted={upvotedIds.has(comment.id)}
                key={comment.id}
                onMarkAnswer={markAsAnswer}
                onUpvote={toggleUpvote}
                signedIn={Boolean(session?.user)}
              />
            ))}
          </section>

          <form className="discussion-comment-form" onSubmit={submitComment}>
            <h3>Add to the discussion</h3>
            {session?.user ? (
              <>
                <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} rows={6} placeholder="Share a thought, answer, or useful context..." />
                <button className="button" disabled={saving || !commentBody.trim()} type="submit">{saving ? "Posting..." : "Post comment"}</button>
              </>
            ) : (
              <p><Link to="/login">Sign in</Link> to join the discussion.</p>
            )}
          </form>
        </>
      )}
    </div>
  );
}

function DiscussionComment({ canMarkAnswer, comment, hasUpvoted, onMarkAnswer, onUpvote, signedIn }) {
  const author = comment.profiles || {};
  return (
    <article className={comment.is_answer ? "discussion-comment answer" : "discussion-comment"}>
      <IllustratedAvatar size={34} variant={author.avatar_style || "sage"} photoUrl={author.avatar_url} />
      <div>
        <header>
          <strong>@{author.username || "developer"}</strong>
          <time>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</time>
        </header>
        <div className="readme-render discussion-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body) }} />
        <footer>
          <button className={hasUpvoted ? "active" : ""} disabled={!signedIn} onClick={() => onUpvote(comment)} type="button">
            <ArrowBigUp size={15} />{comment.upvotes || 0}
          </button>
          {canMarkAnswer && !comment.is_answer && (
            <button className="mark-answer-button" onClick={() => onMarkAnswer(comment.id)} type="button">Mark as answer</button>
          )}
        </footer>
        {comment.is_answer && <div className="discussion-answer-banner"><CheckCircle2 size={15} />Marked as answer</div>}
      </div>
    </article>
  );
}
