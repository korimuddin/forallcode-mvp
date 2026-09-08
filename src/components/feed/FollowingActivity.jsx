import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import FeedEvent from "./FeedEvent";

export default function FollowingActivity({ userId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (!supabase || !userId) return;
        const { data: follows, error: followError } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
        if (followError) throw followError;
        if (!follows?.length) return;
        const { data, error: loadError } = await supabase.from("feed_events").select(`
          *, profiles!feed_events_actor_id_fkey(username, display_name, avatar_style, avatar_url),
          repositories(name, description, language, stars_count, is_private, profiles!repositories_owner_id_fkey(username)),
          issues(number, title, status), pull_requests(number, title, status)
        `).in("actor_id", follows.map(row => row.following_id)).order("created_at", { ascending: false }).limit(30);
        if (loadError) throw loadError;
        if (alive) setEvents((data || []).filter(event => !event.repositories?.is_private));
      } catch {
        if (alive) setError("Community activity could not be loaded.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [userId]);
  if (loading) return <p role="status">Loading followed activity...</p>;
  if (error) return <p role="alert">{error}</p>;
  return <div>{events.map(event => <FeedEvent key={event.id} item={event} event={event} />)}{events.length === 0 && <p>No followed activity yet. <Link to="/explore">Find people and projects</Link>.</p>}</div>;
}
