import DeskIllustration from "../../workspace/DeskIllustration";

const CALLOUTS = [
  {
    label: "Pin active projects so nothing gets forgotten",
    top: "35%",
    left: "62%",
    delay: 0
  },
  {
    label: "Keep today's tasks where you can see them",
    top: "55%",
    left: "10%",
    delay: 1000
  },
  {
    label: "Focus mode clears the desk when you need to lock in",
    top: "15%",
    left: "30%",
    delay: 2000
  }
];

export default function WorkspaceStep({ onBack, onSetupWorkspace, onSkip }) {
  return (
    <div className="onboarding-workspace">
      <h2>Make yourself at home.</h2>
      <p className="onboarding-step-subtext">
        Your workspace is your personal desk inside ForAllCode — a place that reflects what you are actually working on.
      </p>

      <div className="onboarding-desk-preview">
        <div className="onboarding-desk-scale">
          <DeskIllustration showClock showDecorations theme="classic" />
        </div>
        {CALLOUTS.map((callout) => (
          <span
            className="onboarding-desk-callout"
            key={callout.label}
            style={{
              top: callout.top,
              left: callout.left,
              animationDelay: `${callout.delay}ms`
            }}
          >
            {callout.label}
          </span>
        ))}
      </div>

      <p className="onboarding-workspace-note">
        Your workspace remembers everything — sticky notes, to-dos, and your focus settings all sync to your account across every device.
      </p>

      <div className="onboarding-actions">
        <button className="onboarding-ghost" onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="onboarding-secondary" onClick={onBack} type="button">
          Back
        </button>
        <button className="onboarding-primary" onClick={onSetupWorkspace} type="button">
          Set up my workspace →
        </button>
      </div>
    </div>
  );
}
