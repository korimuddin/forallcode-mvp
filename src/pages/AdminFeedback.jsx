import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const ADMIN_USER_IDS = ["906e01d3-a655-4299-9269-437900cda4df"];

export default function AdminFeedback() {
  useDocumentTitle("Feedback admin · ForAllCode");
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadFeedback() {
      if (!supabase) {
        setChecked(true);
        setError("Supabase is not configured.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = Boolean(user?.id && ADMIN_USER_IDS.includes(user.id));

      if (!alive) return;
      setAllowed(isAdmin);
      setChecked(true);
      if (!isAdmin) return;

      const { data, error: feedbackError } = await supabase
        .from("upgrade_feedback")
        .select("id, user_id, response, created_at")
        .order("created_at", { ascending: false });

      if (!alive) return;
      if (feedbackError) {
        setError(feedbackError.message);
        return;
      }
      setResponses(data || []);
    }

    loadFeedback();
    return () => {
      alive = false;
    };
  }, []);

  if (!checked) {
    return (
      <div className="admin-feedback-page">
        <p className="settings-muted">Checking access...</p>
      </div>
    );
  }

  if (!allowed) return <Navigate to="/dashboard" replace />;

  return (
    <div className="admin-feedback-page">
      <div className="admin-feedback-head">
        <p className="eyebrow">Admin</p>
        <h1>Upgrade feedback</h1>
        <p>Responses from free users about what would make ForAllCode worth upgrading.</p>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {!error && responses.length === 0 && <p className="empty-helper">No feedback responses yet.</p>}
      <div className="admin-feedback-list">
        {responses.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.user_id}</strong>
              <time>{new Date(item.created_at).toLocaleString("en-GB")}</time>
            </div>
            <p>{item.response}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
