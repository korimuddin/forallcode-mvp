import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { repositoryPath } from "../../lib/projectJourney";
import { trackUsage } from "../../lib/trackUsage";
import OnboardingStep from "./OnboardingStep";
import "../../styles/project-journey.css";

const goals = [
  { id: "learn-git", title: "Understand my first Git change", text: "Start with commits, then try a small project task." },
  { id: "beautiful-repos", title: "Improve a project", text: "Make one useful change to a README." },
  { id: "build-profile", title: "Explain my work", text: "Write a project story and build my portfolio." }
];

export default function OnboardingFlow({ user, profile, repos = [], onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(goals.find(item => item.id === profile?.onboardingGoal)?.id || "learn-git");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const firstRepo = repos[0];
  const destination = goal === "learn-git" ? "/learn/commits"
    : firstRepo ? `${repositoryPath(firstRepo)}/readme` : "/repos/new";
  const action = goal === "learn-git" ? "Start with commits" : firstRepo ? "Open README Studio" : "Create a project";

  async function finish(path) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (!supabase || !user?.id) throw new Error("Sign in to save your starting point.");
      const { error: saveError } = await supabase.from("profiles")
        .update({ onboarding_completed: true, onboarding_goal: goal }).eq("id", user.id);
      if (saveError) throw saveError;
      trackUsage(user.id, "onboarding_completed", { goal, skipped: !path }).catch(() => {});
      onComplete?.();
      if (path) navigate(path);
    } catch (saveError) {
      setError(saveError.message || "Could not save your starting point. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingStep currentStep={step} totalSteps={2}>
      <div className="journey-onboarding">
        {step === 1 ? <>
          <h2>What would you like to do first?</h2>
          <fieldset disabled={saving}>
            <legend className="sr-only">Choose your starting point</legend>
            {goals.map(item => <label className="journey-goal" key={item.id}>
              <input type="radio" name="starting-goal" value={item.id} checked={goal === item.id} onChange={() => setGoal(item.id)} />
              <span><strong>{item.title}</strong><small>{item.text}</small></span>
            </label>)}
          </fieldset>
        </> : <>
          <h2>One small step, then real work</h2>
          <p>{goal === "learn-git" ? "Read the commits lesson, then improve a README on a branch and open a pull request." : "Use the free Project case study template to explain the problem, your decisions, and what you learned. Existing README content is replaced only after confirmation."}</p>
          <p>Your repositories stay on GitHub. ForAllCode stores learning progress and README drafts. Saving a README to the repository creates a GitHub commit.</p>
        </>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="onboarding-actions">
          <button className="onboarding-ghost" disabled={saving} type="button" onClick={() => finish()}>Skip setup</button>
          {step === 2 && <button className="onboarding-secondary" disabled={saving} type="button" onClick={() => setStep(1)}>Back</button>}
          <button className="onboarding-primary" disabled={saving} type="button" onClick={() => step === 1 ? setStep(2) : finish(destination)}>
            {saving ? "Saving..." : step === 1 ? "Continue" : action}<ArrowRight size={16} />
          </button>
        </div>
      </div>
    </OnboardingStep>
  );
}
