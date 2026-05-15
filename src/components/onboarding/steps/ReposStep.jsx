const REPO_FEATURES = [
  {
    id: "readme",
    title: "README Studio",
    caption: "Write beautiful project pages with a live preview editor and one-click save to GitHub.",
    accent: "#ddd5f0",
    previewClass: "readme"
  },
  {
    id: "landing",
    title: "Landing Designer",
    caption: "Build a no-code landing page for any repo. Pick a theme, write your copy, publish in minutes.",
    accent: "#c8d8c4",
    previewClass: "landing"
  },
  {
    id: "notes",
    title: "Sticky Notes",
    caption: "Pin notes to your workspace desk for any repo. Tasks, reminders, ideas — right where you work.",
    accent: "#f5d5d8",
    previewClass: "notes"
  }
];

export default function ReposStep({ onBack, onNext, onSkip }) {
  return (
    <div className="onboarding-repos">
      <h2>Your repos, your way.</h2>
      <p className="onboarding-step-subtext">
        ForAllCode turns plain repository pages into something worth sharing.
      </p>

      <div className="onboarding-repo-feature-row">
        {REPO_FEATURES.map((feature) => (
          <article className="onboarding-repo-feature" key={feature.id}>
            <span className="onboarding-repo-accent" style={{ background: feature.accent }} />
            <div className={`onboarding-repo-preview ${feature.previewClass}`} aria-hidden="true">
              {feature.previewClass === "readme" && (
                <>
                  <span className="repo-preview-hero" />
                  <span className="repo-preview-line wide" />
                  <span className="repo-preview-line" />
                </>
              )}
              {feature.previewClass === "landing" && (
                <>
                  <span className="repo-preview-banner" />
                  <span className="repo-preview-column" />
                  <span className="repo-preview-column small" />
                </>
              )}
              {feature.previewClass === "notes" && (
                <>
                  <span className="repo-preview-pin" />
                  <span className="repo-preview-note" />
                </>
              )}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.caption}</p>
          </article>
        ))}
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-ghost" onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="onboarding-secondary" onClick={onBack} type="button">
          Back
        </button>
        <button className="onboarding-primary" onClick={onNext} type="button">
          Got it →
        </button>
      </div>
    </div>
  );
}
