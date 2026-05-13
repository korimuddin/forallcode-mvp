import { useEffect } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/hooks";
import { useSubscription } from "../lib/useSubscription";

const unlockedFeatures = [
  "Unlimited private repos",
  "Unlimited sticky notes",
  "More landing pages",
  "Priority GitHub sync"
];

export default function UpgradeSuccess() {
  useDocumentTitle("Welcome to Pro · ForAllCode");
  const { refetch } = useSubscription();

  useEffect(() => {
    refetch?.();
  }, [refetch]);

  return (
    <div className="upgrade-success-page">
      <section className="upgrade-success-card">
        <div className="success-logo-mark">✦</div>
        <div className="success-emoji">🎉</div>
        <h1>Welcome to Pro.</h1>
        <p>Your workspace just got a whole lot more powerful.</p>
        <Link className="success-dashboard-button" to="/dashboard">Go to dashboard →</Link>
      </section>

      <section className="success-unlocked">
        <h2>What&apos;s unlocked</h2>
        <div className="success-feature-grid">
          {unlockedFeatures.map((feature) => (
            <article key={feature}>
              <Check size={18} />
              <span>{feature}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
