import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { FileCode2, Plus } from "lucide-react";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import Skeleton from "../components/ui/Skeleton";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const filters = [
  ["mine", "Your gists"],
  ["starred", "Starred gists"],
  ["public", "All public gists"]
];

export default function GistList() {
  useDocumentTitle("Gists");
  const { checked, session, loggedIn } = useAuthSession();
  const [activeFilter, setActiveFilter] = useState("public");
  const [gists, setGists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loggedIn) setActiveFilter("mine");
  }, [loggedIn]);

  useEffect(() => {
    let alive = true;

    async function loadGists() {
      if (!checked) return;
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        let rows = [];
        if (activeFilter === "starred" && session?.user?.id) {
          const { data, error: starredError } = await supabase
            .from("gist_stars")
            .select("created_at, gists(*, profiles(username, display_name, avatar_style), gist_files(*))")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });
          if (starredError) throw starredError;
          rows = (data || []).map((item) => item.gists).filter(Boolean);
        } else {
          let query = supabase
            .from("gists")
            .select("*, profiles(username, display_name, avatar_style), gist_files(*)")
            .order("updated_at", { ascending: false });

          if (activeFilter === "mine" && session?.user?.id) query = query.eq("author_id", session.user.id);
          else query = query.eq("is_public", true);

          const { data, error: gistError } = await query;
          if (gistError) throw gistError;
          rows = data || [];
        }

        if (alive) setGists(rows);
      } catch (loadError) {
        if (alive) {
          setError(loadError.message || "Could not load gists.");
          setGists([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadGists();
    return () => {
      alive = false;
    };
  }, [activeFilter, checked, session?.user?.id]);

  const visibleFilters = useMemo(() => {
    return loggedIn ? filters : filters.filter(([key]) => key === "public");
  }, [loggedIn]);

  return (
    <main className="gists-page">
      <header className="gists-header">
        <div>
          <span className="eyebrow">Snippets</span>
          <h1>Gists</h1>
          <p>Small, useful bits of code you can keep, share, and revisit.</p>
        </div>
        {loggedIn && <Link className="button primary" to="/gists/new"><Plus size={16} />New gist</Link>}
      </header>

      <div className="gist-filter-tabs">
        {visibleFilters.map(([key, label]) => (
          <button className={activeFilter === key ? "active" : ""} key={key} onClick={() => setActiveFilter(key)} type="button">
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="gist-list">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton className="gist-card-skeleton" key={index} />)}
        </div>
      )}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && !error && gists.length === 0 && (
        <section className="gist-empty-state">
          <FileCode2 size={58} />
          <h2>No gists here yet</h2>
          <p>{loggedIn ? "Create a snippet for something you keep reaching for." : "Public snippets will appear here as people share them."}</p>
          {loggedIn && <Link className="button primary" to="/gists/new">Create your first gist</Link>}
        </section>
      )}
      {!loading && !error && gists.length > 0 && (
        <div className="gist-list">
          {gists.map((gist) => <GistCard gist={gist} key={gist.id} />)}
        </div>
      )}
    </main>
  );
}

function GistCard({ gist }) {
  const firstFile = [...(gist.gist_files || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
  const author = gist.profiles || {};

  return (
    <article className="gist-card">
      <div className="gist-card-header">
        <IllustratedAvatar size={32} variant={author.avatar_style || "sage"} />
        <div>
          <Link to={`/gists/${gist.id}`}>{author.username || "user"} / {firstFile?.filename || gist.title}</Link>
          <small>
            {(gist.gist_files || []).length} file{(gist.gist_files || []).length === 1 ? "" : "s"} · Created {formatDistanceToNow(new Date(gist.created_at), { addSuffix: true })}
            {!gist.is_public && <span> · Secret</span>}
          </small>
        </div>
      </div>
      {gist.description && <p>{gist.description}</p>}
      <pre>{firstFile?.content?.split("\n").slice(0, 4).join("\n") || "// No preview yet"}</pre>
    </article>
  );
}
