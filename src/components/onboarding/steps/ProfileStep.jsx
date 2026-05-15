import { useMemo, useState } from "react";

const CALLOUTS = [
  {
    icon: "✦",
    label: "Portfolio mode",
    desc: "Present your best projects as a visual portfolio at /[username]/portfolio"
  },
  {
    icon: "↗",
    label: "One link to share",
    desc: "forallcode.netlify.app/[username] — your professional developer page"
  },
  {
    icon: "✓",
    label: "Certifications",
    desc: "Earn certificates and display them directly on your profile"
  }
];

export default function ProfileStep({ onBack, onCustomiseProfile, onNext, onSkip, profile }) {
  const [copied, setCopied] = useState(false);

  const username = profile?.username || "yourname";
  const displayName = profile?.displayName || username;
  const profileUrl = `forallcode.netlify.app/${username}`;

  const coverStyle = useMemo(() => {
    if (profile?.coverImageUrl) {
      return {
        backgroundImage: `linear-gradient(135deg, rgba(221, 213, 240, 0.2), rgba(200, 216, 196, 0.22)), url("${profile.coverImageUrl}")`,
        backgroundPosition: `${profile.coverPositionX ?? 50}% ${profile.coverPositionY ?? 50}%`,
        backgroundSize: "cover"
      };
    }

    return {
      background: profile?.coverGradient || "linear-gradient(135deg, #ddd5f0, #c8d8c4)"
    };
  }, [profile]);

  async function copyProfileUrl() {
    try {
      await navigator.clipboard?.writeText(`https://${profileUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="onboarding-profile">
      <h2>Show off your work.</h2>
      <p className="onboarding-step-subtext">
        Your ForAllCode profile is a page worth sharing — with employers, collaborators, and the world.
      </p>

      <div className="onboarding-profile-mockup" aria-label="Profile preview">
        <div className="onboarding-profile-cover" style={coverStyle}>
          <div className="onboarding-profile-avatar">
            {profile?.avatarUrl ? <img alt="" src={profile.avatarUrl} /> : <span>{displayName.slice(0, 1).toUpperCase()}</span>}
          </div>
        </div>
        <div className="onboarding-profile-name">
          <strong>{displayName}</strong>
          <span>@{username}</span>
        </div>
        <div className="onboarding-profile-desk">
          <span style={{ background: "#ddd5f0" }} />
          <span style={{ background: "#f5d5d8" }} />
          <span style={{ background: "#c8d8c4" }} />
        </div>
        <div className="onboarding-profile-repos">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="onboarding-profile-callouts">
        {CALLOUTS.map((callout) => (
          <div className="onboarding-profile-callout" key={callout.label}>
            <span>{callout.icon}</span>
            <div>
              <strong>{callout.label}</strong>
              <small>{callout.desc}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="onboarding-profile-url">
        <span>{profileUrl}</span>
        <button onClick={copyProfileUrl} type="button">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-ghost" onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="onboarding-secondary" onClick={onBack} type="button">
          Back
        </button>
        <button className="onboarding-primary" onClick={onCustomiseProfile} type="button">
          Customise my profile →
        </button>
        <button className="onboarding-ghost" onClick={onNext} type="button">
          Later →
        </button>
      </div>
    </div>
  );
}
