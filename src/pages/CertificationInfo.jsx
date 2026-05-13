import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, BookOpen, CheckCircle2, Clock, ExternalLink, Github } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const certType = "git-fundamentals";

export default function CertificationInfo() {
  useDocumentTitle("Git Fundamentals Certificate");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutStatus, setCheckoutStatus] = useState("default");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUser(data.user || null);

      if (data.user?.id) {
        const { data: certData } = await supabase
          .from("certifications")
          .select("*")
          .eq("user_id", data.user.id)
          .eq("cert_type", certType)
          .order("issued_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!alive) return;
        setCert(certData || null);
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const hasPurchased = Boolean(cert?.id);
  const hasPassed = Boolean(cert?.certificate_url);
  const certUrl = hasPassed ? `${window.location.origin}${cert.certificate_url}` : "";
  const linkedInShareUrl = useMemo(() => {
    if (!hasPassed) return "";
    const issued = cert.issued_at ? new Date(cert.issued_at) : new Date();
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Git+Fundamentals&organizationId=&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${cert.verification_code}`;
  }, [cert, certUrl, hasPassed]);

  async function startCheckout() {
    setError("");
    if (!user?.id) {
      navigate("/login");
      return;
    }

    setCheckoutStatus("loading");
    const response = await fetch("/.netlify/functions/create-cert-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        certType,
        successUrl: `${window.location.origin}/certification/git-fundamentals/assessment?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/certification/git-fundamentals`
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      setError(payload.error || "Could not start checkout.");
      setCheckoutStatus("default");
      return;
    }
    window.location.href = payload.url;
  }

  return (
    <div className="cert-page">
      <section className="cert-hero">
        <span className="cert-hero-icon"><Award size={30} /></span>
        <p className="eyebrow">ForAllCode certification</p>
        <h1>Git Fundamentals Certificate</h1>
        <p>Show that you understand branches, commits, collaboration, pull requests, and the everyday Git workflows real teams use.</p>
        <div className="cert-hero-actions">
          {loading ? (
            <button className="button primary" disabled>Checking certificate...</button>
          ) : hasPassed ? (
            <>
              <Link className="button primary" to={cert.certificate_url}>View your certificate</Link>
              <a className="button soft" href={linkedInShareUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} />Share on LinkedIn</a>
            </>
          ) : hasPurchased ? (
            <Link className="button primary" to="/certification/git-fundamentals/assessment">Take assessment</Link>
          ) : (
            <button className="button primary" disabled={checkoutStatus === "loading"} onClick={startCheckout} type="button">
              {checkoutStatus === "loading" ? "Opening checkout..." : "Purchase and take assessment - £20"}
            </button>
          )}
        </div>
        {error && <p className="cert-error">{error}</p>}
      </section>

      <section className="cert-info-grid">
        <article>
          <BookOpen size={22} />
          <h2>What is covered</h2>
          <p>Core Git vocabulary, staging and commits, branches, remotes, pull requests, merge conflicts, stash, fetch, pull, and reading repository history.</p>
        </article>
        <article>
          <Clock size={22} />
          <h2>Assessment format</h2>
          <p>20 multiple-choice questions, 45 minutes, and a 70% pass mark. You can move back and forward before submitting.</p>
        </article>
        <article>
          <CheckCircle2 size={22} />
          <h2>Prerequisites</h2>
          <p>Complete or review the Beginner track first. Intermediate lessons are helpful, but the certificate stays focused on practical fundamentals.</p>
        </article>
      </section>

      <section className="cert-syllabus">
        <h2>Certificate checklist</h2>
        <div className="cert-checklist">
          {["Explain what Git tracks and why commits matter", "Create, switch, merge, and clean up branches", "Use remotes safely with fetch, pull, and push", "Understand pull requests and resolve simple conflicts"].map((item) => (
            <span key={item}><Github size={15} />{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
