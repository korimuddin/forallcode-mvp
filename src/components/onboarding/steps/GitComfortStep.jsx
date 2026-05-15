import { useState } from "react";
import { supabase } from "../../../lib/supabase";

const COMFORT_LEVELS = [
  {
    id: "beginner",
    emoji: "🌱",
    title: "Just starting out",
    desc: "I have heard of Git but things like push, merge, and branch are still fuzzy."
  },
  {
    id: "getting-there",
    emoji: "🌿",
    title: "Getting the hang of it",
    desc: "I can commit and push but merges, conflicts, and branching strategies still trip me up."
  },
  {
    id: "comfortable",
    emoji: "🌳",
    title: "Pretty comfortable",
    desc: "I use Git daily. I want to get faster, work better in teams, and understand the advanced stuff."
  },
  {
    id: "advanced",
    emoji: "🚀",
    title: "I live in the terminal",
    desc: "Rebasing, cherry-picking, interactive history — I know my way around. Show me what ForAllCode adds."
  }
];

export default function GitComfortStep({ initialValue = "", user, onBack, onNext, onSkip }) {
  const [selected, setSelected] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function chooseLevel(level) {
    setSelected(level.id);
    setSaving(true);
    setError("");

    try {
      if (supabase && user?.id) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ git_comfort_level: level.id })
          .eq("id", user.id);
        if (updateError) throw updateError;
      }
    } catch (saveError) {
      setError(saveError.message || "Could not save your comfort level.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-comfort">
      <h2>How comfortable are you with Git right now?</h2>
      <p className="onboarding-step-subtext">
        Be honest — there is no wrong answer. We will tailor your experience to where you actually are.
      </p>

      <div className="onboarding-comfort-grid">
        {COMFORT_LEVELS.map((level) => (
          <button
            className={selected === level.id ? "selected" : ""}
            key={level.id}
            onClick={() => chooseLevel(level)}
            type="button"
          >
            <span aria-hidden="true">{level.emoji}</span>
            <strong>{level.title}</strong>
            <small>{level.desc}</small>
          </button>
        ))}
      </div>

      {error && <p className="onboarding-error">{error}</p>}

      <div className="onboarding-actions">
        <button className="onboarding-ghost" disabled={saving} onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="onboarding-secondary" disabled={saving} onClick={onBack} type="button">
          Back
        </button>
        <button className="onboarding-primary" disabled={!selected || saving} onClick={onNext} type="button">
          {saving ? "Saving..." : "Next →"}
        </button>
      </div>
    </div>
  );
}
