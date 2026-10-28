import { useEffect, useState } from "react";

const SYNC_NODES = [
  { label: "GitHub account", colour: "#1f2328", textColour: "#ffffff" },
  { label: "ForAllCode syncs repos", colour: "#0969da", textColour: "#ffffff" },
  { label: "Work here: issues, PRs, files", colour: "#1a7f37", textColour: "#ffffff" },
  { label: "Changes push to GitHub", colour: "#6aa8d4", textColour: "#ffffff" }
];

const PILLS = [
  { label: "⑂ Fork", colour: "#ddf4ff", textColour: "#0550ae" },
  { label: "⌥ Branch", colour: "#dafbe1", textColour: "#116329" },
  { label: "⇌ Merge", colour: "#ddf4ff", textColour: "#0a3069" },
  { label: "↓ Clone", colour: "#fff8c5", textColour: "#7d4e00" }
];

export default function GitHubSyncStep({ onBack, onNext, onSkip }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % SYNC_NODES.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="onboarding-github-sync">
      <h2>ForAllCode and GitHub work together.</h2>
      <p className="onboarding-step-subtext">
        You are not leaving GitHub behind — you are getting a better way to work with it.
      </p>

      <div className="onboarding-sync-diagram" aria-label="GitHub sync diagram">
        {SYNC_NODES.map((node, index) => (
          <div className="onboarding-sync-piece" key={node.label}>
            <span
              className={activeIndex === index ? "onboarding-sync-node active" : "onboarding-sync-node"}
              style={{
                background: node.colour,
                color: node.textColour
              }}
            >
              {node.label}
            </span>
            {index < SYNC_NODES.length - 1 && <span className="onboarding-sync-arrow">→</span>}
          </div>
        ))}
      </div>

      <div className="onboarding-sync-pills">
        {PILLS.map((pill) => (
          <span
            key={pill.label}
            style={{ background: pill.colour, color: pill.textColour }}
          >
            {pill.label}
          </span>
        ))}
      </div>

      <p className="onboarding-sync-caption">
        Every action you take in ForAllCode syncs to your GitHub account in real time. Your code is always in both places.
      </p>
      <p className="onboarding-sync-reassurance">
        ForAllCode never stores your code — it lives on GitHub. We just give you a better way to work with it.
      </p>

      <div className="onboarding-actions">
        <button className="onboarding-ghost" onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="onboarding-secondary" onClick={onBack} type="button">
          Back
        </button>
        <button className="onboarding-primary" onClick={onNext} type="button">
          Makes sense →
        </button>
      </div>
    </div>
  );
}
