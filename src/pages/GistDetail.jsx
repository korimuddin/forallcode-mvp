import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Eye, Star } from "lucide-react";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import Skeleton from "../components/ui/Skeleton";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

export default function GistDetail() {
  const { id } = useParams();
  const { session } = useAuthSession();
  const [gist, setGist] = useState(null);
  const [starred, setStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useDocumentTitle(gist?.title ? `${gist.title} · Gist` : "Gist");

  useEffect(() => {
    let alive = true;

    async function loadGist() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error: gistError } = await supabase
          .from("gists")
          .select("*, profiles(username, display_name, avatar_style), gist_files(*)")
          .eq("id", id)
          .maybeSingle();
        if (gistError) throw gistError;
        if (!data) throw new Error("Gist not found.");

        if (!data.is_public && data.author_id !== session?.user?.id) {
          throw new Error("This secret gist is private.");
        }

        if (alive) {
          setGist(data);
          setStarCount(0);
        }

        supabase.from("gists").update({ views: (data.views || 0) + 1 }).eq("id", id).then(() => {});

        const { count } = await supabase
          .from("gist_stars")
          .select("*", { count: "exact", head: true })
          .eq("gist_id", id);
        if (alive) setStarCount(count || 0);

        if (session?.user?.id) {
          const { data: starRow } = await supabase
            .from("gist_stars")
            .select("gist_id")
            .eq("gist_id", id)
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (alive) setStarred(Boolean(starRow));
        }
      } catch (loadError) {
        if (alive) setError(loadError.message || "Could not load this gist.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadGist();
    return () => {
      alive = false;
    };
  }, [id, session?.user?.id]);

  const files = useMemo(() => {
    return [...(gist?.gist_files || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [gist?.gist_files]);

  async function toggleStar() {
    if (!session?.user?.id) return;

    if (starred) {
      await supabase.from("gist_stars").delete().eq("user_id", session.user.id).eq("gist_id", id);
      setStarred(false);
      setStarCount((current) => Math.max(0, current - 1));
    } else {
      await supabase.from("gist_stars").upsert({ user_id: session.user.id, gist_id: id }, { onConflict: "user_id,gist_id" });
      setStarred(true);
      setStarCount((current) => current + 1);
    }
  }

  if (loading) {
    return <main className="gist-detail-page"><Skeleton className="gist-detail-skeleton" /></main>;
  }

  if (error) {
    return <main className="gist-detail-page"><p className="auth-error">{error}</p></main>;
  }

  const author = gist.profiles || {};

  return (
    <main className="gist-detail-page">
      <header className="gist-detail-header">
        <div className="gist-card-header">
          <IllustratedAvatar size={42} variant={author.avatar_style || "sage"} />
          <div>
            <Link to={`/${author.username}`}>{author.username || "user"}</Link>
            <h1>{gist.title}</h1>
            <small>
              Created {formatDistanceToNow(new Date(gist.created_at), { addSuffix: true })} · {files.length} file{files.length === 1 ? "" : "s"} · {!gist.is_public ? "Secret" : "Public"}
            </small>
          </div>
        </div>
        <div className="gist-detail-actions">
          <span><Eye size={15} />{(gist.views || 0).toLocaleString()}</span>
          <button className={starred ? "active" : ""} disabled={!session?.user?.id} onClick={toggleStar} type="button">
            <Star size={15} />{starCount}
          </button>
        </div>
        {gist.description && <p>{gist.description}</p>}
      </header>

      <section className="gist-file-list">
        {files.map((file) => (
          <article className="gist-file-viewer" key={file.id}>
            <header>
              <strong>{file.filename}</strong>
              <span>{file.language || "Plain text"}</span>
            </header>
            <pre><code>{file.content}</code></pre>
          </article>
        ))}
      </section>
    </main>
  );
}
