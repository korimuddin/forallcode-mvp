import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    label: "Repos",
    colour: "#9b8fd4",
    desc: "All your GitHub repositories, synced automatically. Browse, manage, and create new repos without leaving ForAllCode."
  },
  {
    label: "Learn",
    colour: "#7aaa72",
    desc: "Visual Git lessons built for humans. Interactive diagrams, step-by-step explanations — no dry documentation."
  },
  {
    label: "Explore",
    colour: "#6aa8d4",
    desc: "Discover projects, workspaces, and developers. Find inspiration and connect with the ForAllCode community."
  },
  {
    label: "Marketplace",
    colour: "#c8a055",
    desc: "Courses, certifications, and tools built by the community. Learn from real developers and earn certificates."
  }
];

export default function NavigationStep({ onBack, onNext, onSkip }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const activeItem = NAV_ITEMS[activeIndex] || NAV_ITEMS[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setActiveIndex((index) => (index + 1) % NAV_ITEMS.length);
        setFading(false);
      }, 150);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="onboarding-navigation">
      <h2>Here is your ForAllCode.</h2>
      <p className="onboarding-step-subtext">Everything you need, where you would expect it.</p>

      <div className="onboarding-nav-mockup" aria-label="ForAllCode navigation preview">
        <div className="onboarding-nav-logo">F</div>
        {NAV_ITEMS.map((item, index) => (
          <button
            className={activeIndex === index ? "active" : ""}
            key={item.label}
            onClick={() => setActiveIndex(index)}
            style={{ "--nav-accent": item.colour }}
            type="button"
          >
            <span className="onboarding-nav-dot" />
            {item.label}
          </button>
        ))}
      </div>

      <div className={fading ? "onboarding-nav-desc fading" : "onboarding-nav-desc"}>
        <strong style={{ color: activeItem.colour }}>{activeItem.label}</strong>
        <span>{activeItem.desc}</span>
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-ghost" onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="onboarding-secondary" onClick={onBack} type="button">
          Back
        </button>
        <button className="onboarding-primary" onClick={onNext} type="button">
          Show me around →
        </button>
      </div>
    </div>
  );
}
