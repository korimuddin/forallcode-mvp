import ConfettiAnimation from "../ConfettiAnimation";
import { getPersonalisedActions } from "../../../lib/getPersonalisedActions";

export default function ReadyStep({ firstName, goals, onAction, onDashboard, repos = [] }) {
  const actions = getPersonalisedActions(goals, repos);

  return (
    <div className="onboarding-ready">
      <ConfettiAnimation />

      <div className="onboarding-ready-content">
        <h2>You are all set, {firstName}.</h2>
        <p className="onboarding-ready-subtitle">ForAllCode is yours. Let us get to work.</p>

        <div className="onboarding-ready-actions">
          {actions.map((action) => (
            <button
              className="onboarding-ready-card"
              key={action.id}
              onClick={() => onAction(action.href)}
              type="button"
            >
              <span className="onboarding-ready-emoji" aria-hidden="true">{action.emoji}</span>
              <strong>{action.label}</strong>
              <small>{action.desc}</small>
            </button>
          ))}
        </div>

        <p className="onboarding-ready-note">
          Your GitHub repos are synced. Your workspace is ready. The learn centre is open. Everything is waiting for you.
        </p>

        <div className="onboarding-actions">
          <button className="onboarding-primary" onClick={onDashboard} type="button">
            Go to my dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
