import { useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

const GOALS = [
  {
    id: "beautiful-repos",
    emoji: "🎨",
    title: "Beautiful repos",
    desc: "I want my projects to look as good as they work — great READMEs, landing pages, and profiles."
  },
  {
    id: "team-collab",
    emoji: "👥",
    title: "Team collaboration",
    desc: "I work with others — pull requests, code review, issues, and keeping everyone in sync."
  },
  {
    id: "learn-git",
    emoji: "📚",
    title: "Learn Git properly",
    desc: "I want to actually understand what I am doing — visual lessons, not walls of documentation."
  },
  {
    id: "get-certified",
    emoji: "🏆",
    title: "Get certified",
    desc: "I want proof of my skills — certificates I can share with employers and put on my CV."
  },
  {
    id: "build-profile",
    emoji: "✦",
    title: "Build my profile",
    desc: "I want a portfolio I am proud to share — showing my work in the best possible light."
  },
  {
    id: "better-github",
    emoji: "🔧",
    title: "Just a better GitHub",
    desc: "I want all the GitHub functionality but with an interface that does not make my eyes water."
  }
];

function parseInitialGoals(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function GoalsStep({ initialValue = "", user, onBack, onNext, onSkip }) {
  const initialGoals = useMemo(() => parseInitialGoals(initialValue), [initialValue]);
  const [selectedGoals, setSelectedGoals] = useState(initialGoals);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleGoal(goalId) {
    setSelectedGoals((current) => (
      current.includes(goalId)
        ? current.filter((item) => item !== goalId)
        : [...current, goalId]
    ));
  }

  async function continueWithGoals() {
    if (!selectedGoals.length || saving) return;
    setSaving(true);
    setError("");

    try {
      if (supabase && user?.id) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ onboarding_goal: selectedGoals.join(",") })
          .eq("id", user.id);
        if (updateError) throw updateError;
      }
      onNext();
    } catch (saveError) {
      setError(saveError.message || "Could not save your goals.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-goals">
      <h2>What are you here for?</h2>
      <p className="onboarding-step-subtext">
        Pick everything that resonates — we will highlight the features that matter most to you.
      </p>

      <div className="onboarding-goal-grid">
        {GOALS.map((goal) => {
          const selected = selectedGoals.includes(goal.id);
          return (
            <button
              className={selected ? "selected" : ""}
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              type="button"
            >
              {selected && <span className="onboarding-goal-check">✓</span>}
              <span className="onboarding-goal-emoji" aria-hidden="true">{goal.emoji}</span>
              <strong>{goal.title}</strong>
              <small>{goal.desc}</small>
            </button>
          );
        })}
      </div>

      {error && <p className="onboarding-error">{error}</p>}

      <div className="onboarding-actions">
        <button className="onboarding-ghost" disabled={saving} onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="onboarding-secondary" disabled={saving} onClick={onBack} type="button">
          Back
        </button>
        <button className="onboarding-primary" disabled={!selectedGoals.length || saving} onClick={continueWithGoals} type="button">
          {saving ? "Saving..." : "These are my goals →"}
        </button>
      </div>
    </div>
  );
}
