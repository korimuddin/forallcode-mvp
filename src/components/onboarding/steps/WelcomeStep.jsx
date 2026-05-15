import IllustratedAvatar from "../../ui/IllustratedAvatar";

export default function WelcomeStep({ firstName, profile, onNext }) {
  return (
    <div className="onboarding-welcome">
      <div className="onboarding-welcome-avatar">
        <div className="onboarding-avatar-glow" />
        <IllustratedAvatar
          alt={`${firstName} avatar`}
          className="onboarding-avatar"
          photoUrl={profile?.avatarUrl}
          size={96}
          variant={profile?.avatarStyle || "lavender"}
        />
      </div>
      <h2>Welcome to ForAllCode, {firstName}.</h2>
      <p className="onboarding-welcome-subtitle">Code lives here. Understanding does too.</p>
      <p>
        You have connected your GitHub account. Your repositories are already here,
        your workspace is ready, and we are about to make this feel like home.
      </p>
      <button className="onboarding-primary" onClick={onNext} type="button">
        Let's go →
      </button>
    </div>
  );
}
