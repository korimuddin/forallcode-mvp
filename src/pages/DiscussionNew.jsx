import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CATEGORY_STYLES } from "../lib/discussions";
import { createFeedEvent } from "../lib/createFeedEvent";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { DiscussionRepoHeader } from "./DiscussionList";

export default function DiscussionNew() {
  const { username, repo: repoName } = useParams();
  const navigate = useNavigate();
  const { session, checked, loggedIn } = useAuthSession();
  useDocumentTitle(`New discussion · ${repoName} · ${username}`);
  const [repo, setRepo] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadRepo() {
      if (!supabase) return;
      const { data } = await supabase
        .from("repositories")
        .select("*, profiles!repositories_owner_id_fkey!inner(id, username, display_name, avatar_style)")
        .eq("name", repoName)
        .eq("profiles.username", username)
        .maybeSingle();
      if (alive) setRepo(data || null);
    }

    loadRepo();
    return () => {
      alive = false;
    };
  }, [repoName, username]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!supabase || !session?.user?.id || !repo?.id) return;
    if (!title.trim()) {
      setError("Add a title before starting the discussion.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { data: numberData, error: numberError } = await supabase.rpc("next_discussion_number", { p_repo_id: repo.id });
      if (numberError) throw numberError;
      const number = numberData || 1;
      const { data: created, error: insertError } = await supabase
        .from("discussions")
        .insert({
          repo_id: repo.id,
          author_id: session.user.id,
          number,
          title: title.trim(),
          body: body.trim(),
          category
        })
        .select("id, number, title")
        .single();
      if (insertError) throw insertError;

      createFeedEvent(supabase, {
        actorId: session.user.id,
        eventType: "discussion_started",
        repoId: repo.id,
        discussionId: created.id,
        metadata: { title: created.title, number: created.number }
      }).catch(() => {});

      navigate(`/${username}/${repoName}/discussions/${created.number}`);
    } catch (submitError) {
      setError(submitError.message || "Could not start this discussion.");
    } finally {
      setSaving(false);
    }
  }

  if (checked && !loggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="issue-list-page discussion-new-page">
      <DiscussionRepoHeader active="discussions" canCreate={false} repo={repo} repoName={repoName} username={username} />
      <form className="discussion-form" onSubmit={handleSubmit}>
        <div className="discussion-form-header">
          <p className="eyebrow">Start a discussion</p>
          <h2>Open a conversation for this repo</h2>
          <Link to={`/${username}/${repoName}/discussions`}>Back to discussions</Link>
        </div>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ask a question, share an idea, or start a thread" />
        </label>
        <div className="discussion-category-selector" aria-label="Discussion category">
          {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
            <button
              className={category === key ? "active" : ""}
              key={key}
              onClick={() => setCategory(key)}
              style={category === key ? { background: style.bg, color: style.color, borderColor: style.color } : undefined}
              type="button"
            >
              {style.label}
            </button>
          ))}
        </div>
        <label>
          Body
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={12} placeholder="Write with Markdown. Keep it warm, clear, and useful." />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <div className="discussion-form-actions">
          <Link className="button soft" to={`/${username}/${repoName}/discussions`}>Cancel</Link>
          <button className="button" disabled={saving} type="submit">{saving ? "Starting..." : "Start discussion"}</button>
        </div>
      </form>
    </div>
  );
}
