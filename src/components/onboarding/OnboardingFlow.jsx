import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import OnboardingStep from "./OnboardingStep";
import GitComfortStep from "./steps/GitComfortStep";
import GitHubSyncStep from "./steps/GitHubSyncStep";
import GoalsStep from "./steps/GoalsStep";
import NavigationStep from "./steps/NavigationStep";
import ProfileStep from "./steps/ProfileStep";
import ReadyStep from "./steps/ReadyStep";
import ReposStep from "./steps/ReposStep";
import WelcomeStep from "./steps/WelcomeStep";
import WorkspaceStep from "./steps/WorkspaceStep";

const TOTAL_STEPS = 9;

const placeholderSteps = [
  {
    title: "Welcome to ForAllCode",
    text: "Placeholder for the welcome step. The full step content comes next."
  },
  {
    title: "Git comfort level",
    text: "Placeholder for choosing how comfortable this user feels with Git."
  },
  {
    title: "Your goal",
    text: "Placeholder for capturing what the user wants ForAllCode to help with."
  },
  {
    title: "Navigation tour",
    text: "Placeholder for introducing Repos, Learn, Explore, and Workspace."
  },
  {
    title: "Workspace preview",
    text: "Placeholder for showing the illustrated desk and focus tools."
  },
  {
    title: "Repo tools",
    text: "Placeholder for showing README Studio, Landing Designer, issues, and notes."
  },
  {
    title: "GitHub sync",
    text: "Placeholder for explaining how GitHub data stays connected."
  },
  {
    title: "Profile preview",
    text: "Placeholder for introducing the public profile and portfolio."
  },
  {
    title: "Ready to begin",
    text: "Placeholder for personalised quick actions."
  }
];

export default function OnboardingFlow({ user, profile, repos = [], onComplete }) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const currentStep = stepIndex + 1;
  const step = placeholderSteps[stepIndex] || placeholderSteps[0];

  const friendlyName = useMemo(() => {
    return profile?.displayName || profile?.username || user?.user_metadata?.name || "there";
  }, [profile, user]);
  const firstName = friendlyName.split(" ")[0] || friendlyName;

  async function completeOnboarding() {
    if (saving) return;
    setSaving(true);
    try {
      if (supabase && user?.id) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
      }
      onComplete?.();
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (stepIndex >= TOTAL_STEPS - 1) {
      completeOnboarding();
      return;
    }
    setStepIndex((index) => Math.min(index + 1, TOTAL_STEPS - 1));
  }

  async function completeAndOpenWorkspace() {
    await completeOnboarding();
    navigate("/workspace");
  }

  async function completeAndOpenProfileSettings() {
    await completeOnboarding();
    navigate("/settings/profile");
  }

  async function completeAndNavigate(path) {
    await completeOnboarding();
    navigate(path);
  }

  const cardClassName = stepIndex === 0 ? "onboarding-card-welcome" : "";

  return (
    <OnboardingStep cardClassName={cardClassName} currentStep={currentStep} totalSteps={TOTAL_STEPS}>
      {stepIndex === 0 ? (
        <WelcomeStep firstName={firstName} onNext={goNext} profile={profile} />
      ) : stepIndex === 1 ? (
        <GitComfortStep
          initialValue={profile?.gitComfortLevel}
          onBack={() => setStepIndex(0)}
          onNext={goNext}
          onSkip={completeOnboarding}
          user={user}
        />
      ) : stepIndex === 2 ? (
        <GoalsStep
          initialValue={profile?.onboardingGoal}
          onBack={() => setStepIndex(1)}
          onNext={goNext}
          onSkip={completeOnboarding}
          user={user}
        />
      ) : stepIndex === 3 ? (
        <NavigationStep
          onBack={() => setStepIndex(2)}
          onNext={goNext}
          onSkip={completeOnboarding}
        />
      ) : stepIndex === 4 ? (
        <WorkspaceStep
          onBack={() => setStepIndex(3)}
          onSetupWorkspace={completeAndOpenWorkspace}
          onSkip={goNext}
        />
      ) : stepIndex === 5 ? (
        <ReposStep
          onBack={() => setStepIndex(4)}
          onNext={goNext}
          onSkip={completeOnboarding}
        />
      ) : stepIndex === 6 ? (
        <GitHubSyncStep
          onBack={() => setStepIndex(5)}
          onNext={goNext}
          onSkip={completeOnboarding}
        />
      ) : stepIndex === 7 ? (
        <ProfileStep
          onBack={() => setStepIndex(6)}
          onCustomiseProfile={completeAndOpenProfileSettings}
          onNext={goNext}
          onSkip={completeOnboarding}
          profile={profile}
        />
      ) : stepIndex === 8 ? (
        <ReadyStep
          firstName={firstName}
          goals={profile?.onboardingGoal}
          onAction={completeAndNavigate}
          onDashboard={completeOnboarding}
          repos={repos}
        />
      ) : (
        <div className="onboarding-placeholder">
          <p className="eyebrow">First-time setup</p>
          <h2>{step.title}</h2>
          <p>
            Hi {friendlyName}. {step.text}
          </p>
          <p className="onboarding-placeholder-note">
            {repos.length > 0
              ? `We can see ${repos.length} synced repos ready for the finished flow.`
              : "Your synced repos will be available to the finished flow when they load."}
          </p>
          <div className="onboarding-actions">
            <button className="onboarding-ghost" disabled={saving} onClick={completeOnboarding} type="button">
              Skip for now
            </button>
            {stepIndex > 0 && (
              <button className="onboarding-secondary" disabled={saving} onClick={() => setStepIndex((index) => Math.max(index - 1, 0))} type="button">
                Back
              </button>
            )}
            <button className="onboarding-primary" disabled={saving} onClick={goNext} type="button">
              {saving ? "Saving..." : stepIndex === TOTAL_STEPS - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      )}
    </OnboardingStep>
  );
}
