import { functionFetch } from "../lib/functionFetch";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useDocumentTitle } from "../lib/hooks";
import { useSubscription } from "../lib/useSubscription";

const freeFeatures = [
  "Unlimited public repos",
  "Full learn centre (all lessons)",
  "Workspace desk",
  "README Studio",
  "1 landing page (forallcode.dev subdomain)",
  "5 sticky notes"
];

const proFeatures = [
  "Everything in Free, plus:",
  "Unlimited private repos",
  "Custom domains on landing pages",
  "Unlimited sticky notes and to-dos",
  "4 workspace desk themes",
  "Advanced README templates",
  "Priority GitHub sync"
];

export default function Upgrade() {
  useDocumentTitle("Upgrade · ForAllCode");
  const { isPro } = useSubscription();
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const price = billing === "monthly" ? "£10" : "£96";
  const period = billing === "monthly" ? "/ month" : "/ year";
  const priceHelp = billing === "monthly" ? "or £96/year — save 20%" : "£8/month equivalent — save 20%";

  const priceId = useMemo(() => (
    billing === "monthly"
      ? import.meta.env.VITE_STRIPE_PRICE_MONTHLY
      : import.meta.env.VITE_STRIPE_PRICE_ANNUAL
  ), [billing]);

  async function handleUpgrade() {
    if (isPro) return;
    setLoading(true);
    setMessage("");

    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) throw new Error("Please sign in before upgrading.");
      if (!priceId) throw new Error("Stripe is not configured for this billing option.");

      const response = await functionFetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          priceId,
          successUrl: `${window.location.origin}/upgrade/success`,
          cancelUrl: `${window.location.origin}/upgrade`
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Could not start checkout.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setMessage(error.message || "Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upgrade-page">
      <section className="upgrade-pricing">
        <div className="upgrade-heading">
          <h1>Free learning. Optional project tools.</h1>
          <p>All visual lessons and the project practice check are free. Pro adds workspace and publishing options; paid certificate assessments are separate.</p>
        </div>

        <div className="billing-toggle" aria-label="Billing frequency">
          <button className={billing === "monthly" ? "active" : ""} onClick={() => setBilling("monthly")} type="button">Monthly</button>
          <button className={billing === "annual" ? "active" : ""} onClick={() => setBilling("annual")} type="button">
            Annual <span>Save 20%</span>
          </button>
        </div>

        <div className="plan-cards">
          <article className="plan-card free-card">
            <h2>Free</h2>
            <p className="plan-price"><strong>£0</strong> / month <span>forever</span></p>
            <ul>
              {freeFeatures.map((feature) => (
                <li key={feature}><Check size={15} />{feature}</li>
              ))}
            </ul>
            <span className="current-plan-pill">{isPro ? "Included" : "Current plan"}</span>
          </article>

          <article className="plan-card pro-card">
            <h2>Pro</h2>
            <p className="plan-price"><strong>{price}</strong> {period}</p>
            <p className="plan-save-copy">{priceHelp}</p>
            <ul>
              {proFeatures.map((feature) => (
                <li key={feature}><Check size={15} />{feature}</li>
              ))}
            </ul>
            <button className="upgrade-primary" disabled={loading || isPro} onClick={handleUpgrade} type="button">
              {isPro ? "Current plan" : loading ? "Opening checkout..." : "Upgrade to Pro →"}
            </button>
            {message && <p className="upgrade-error" role="status">{message}</p>}
          </article>
        </div>
      </section>

      <section className="upgrade-faq" aria-label="Upgrade questions">
        <h2>Questions, answered softly.</h2>
        <div className="upgrade-faq-grid">
          <article>
            <h3>Can I stay free?</h3>
            <p>Yes. The free plan stays generous for public projects, learning, and personal workspaces.</p>
          </article>
          <article>
            <h3>Can I cancel?</h3>
            <p>Yes. Billing is managed through Stripe, and cancellation keeps Pro active until the end of the paid period.</p>
          </article>
          <article>
            <h3>What does Pro change?</h3>
            <p>Private repo limits, sticky note limits, and landing page limits lift as soon as Stripe confirms your subscription.</p>
            <p>These are ForAllCode limits. Pro does not change your GitHub plan or what GitHub offers for free.</p>
          </article>
        </div>
      </section>

      <div className="upgrade-back-link">
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    </div>
  );
}
