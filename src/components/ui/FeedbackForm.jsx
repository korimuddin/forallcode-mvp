import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useSubscription } from "../../lib/useSubscription";

function readStoredMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeStoredMap(key, userId) {
  const current = readStoredMap(key);
  localStorage.setItem(key, JSON.stringify({ ...current, [userId]: true }));
}

export default function FeedbackForm() {
  const { isPro } = useSubscription();
  const [userId, setUserId] = useState("");
  const [shown, setShown] = useState(false);
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const storageId = useMemo(() => userId || "anonymous", [userId]);

  useEffect(() => {
    let alive = true;

    async function loadVisibility() {
      if (isPro || !supabase) {
        if (alive) setShown(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const nextUserId = data?.user?.id || "";
      if (!nextUserId) {
        if (alive) setShown(false);
        return;
      }

      const id = nextUserId || "anonymous";
      const dismissed = readStoredMap("feedbackFormDismissed")[id];
      const alreadySubmitted = readStoredMap("feedbackFormSubmitted")[id];

      if (!alive) return;
      setUserId(nextUserId);
      setShown(!dismissed && !alreadySubmitted);
    }

    loadVisibility();
    return () => {
      alive = false;
    };
  }, [isPro]);

  if (!shown || isPro) return null;

  async function handleSubmit() {
    if (!response.trim()) return;
    setSaving(true);
    setError("");

    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) throw new Error("Please sign in before sending feedback.");

      const { error: insertError } = await supabase
        .from("upgrade_feedback")
        .insert({ user_id: user.id, response: response.trim() });

      if (insertError) throw insertError;
      writeStoredMap("feedbackFormSubmitted", user.id);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError.message || "Could not send this yet.");
    } finally {
      setSaving(false);
    }
  }

  function handleDismiss() {
    writeStoredMap("feedbackFormDismissed", storageId);
    setShown(false);
  }

  if (submitted) {
    return (
      <div className="feedback-confirmation" role="status">
        <span aria-hidden="true">🌿</span>
        <div>
          <strong>Thank you — that genuinely helps.</strong>
          <p>We read every response and use them to shape what we build.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="feedback-card" aria-label="Upgrade feedback">
      <div className="feedback-card-head">
        <div>
          <h2>Quick question</h2>
          <p>If ForAllCode had a paid plan, what would make you upgrade?</p>
        </div>
        <button aria-label="Dismiss feedback question" onClick={handleDismiss} type="button">
          <X size={18} />
        </button>
      </div>
      <textarea
        onChange={(event) => setResponse(event.target.value)}
        placeholder="Private repos, custom domains, team features..."
        rows={3}
        value={response}
      />
      <div className="feedback-actions">
        <button disabled={saving || !response.trim()} onClick={handleSubmit} type="button">
          {saving ? "Sending..." : "Send answer →"}
        </button>
        {error && <p role="status">{error}</p>}
      </div>
    </section>
  );
}
