import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, CheckCircle2, Clock, ExternalLink, GitBranch } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const certType = "git-for-teams";
const assessmentAreas = [
  ["Branching strategies", "Git Flow, GitHub Flow, trunk-based development — when to use each and how to implement them in a real team context."],
  ["Pull request workflows", "Writing PRs that get merged, reviewing others' code, managing review cycles, handling feedback professionally."],
  ["Merge conflict resolution", "Identifying conflicts, resolving them correctly, preventing them through good team practices."],
  ["Protected branches and permissions", "Branch protection rules, required reviews, status checks, restricting force pushes, managing access levels."],
  ["Code review best practices", "Giving actionable feedback, the difference between blocking and non-blocking comments, approval workflows."],
  ["Release management", "Tags, semantic versioning, release branches, hotfix workflows, communicating changes through changelogs."],
  ["Team history hygiene", "Squashing, rebasing before merge, keeping main clean, commit message standards that work at team scale."],
  ["Collaboration patterns", "Fork vs branch workflows, pair programming with Git, handling long-lived feature branches, stale branch management."]
];

export default function GitTeamsCertInfo() {
  useDocumentTitle("Git for Teams Certificate");
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
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Git+for+Teams&organizationId=&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${cert.verification_code}`;
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
        successUrl: `${window.location.origin}/certification/git-for-teams/assessment?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/certification/git-for-teams`
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
      <section className="cert-hero git-teams">
        <span className="cert-hero-icon"><Award size={30} /></span>
        <p className="eyebrow">Certificate of Proficiency</p>
        <h1>Git for Teams</h1>
        <p>Most developers learn Git alone. Working in a team is a different skill entirely — branching strategies, protected branches, code review workflows, merge conflicts, release management, and keeping a shared history clean. This certificate proves you can do all of it.</p>
        <div className="cert-hero-actions">
          {loading ? (
            <button className="button primary" disabled>Checking certificate...</button>
          ) : hasPassed ? (
            <>
              <Link className="button primary" to={cert.certificate_url}>View your certificate</Link>
              <a className="button soft" href={linkedInShareUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} />Share on LinkedIn</a>
            </>
          ) : hasPurchased ? (
            <Link className="button primary" to="/certification/git-for-teams/assessment">Take assessment</Link>
          ) : (
            <button className="button primary" disabled={checkoutStatus === "loading"} onClick={startCheckout} type="button">
              {checkoutStatus === "loading" ? "Opening checkout..." : "Purchase and take assessment - £25"}
            </button>
          )}
        </div>
        {error && <p className="cert-error">{error}</p>}
      </section>

      <section className="cert-info-grid cert-area-grid">
        {assessmentAreas.map(([title, body], index) => (
          <article key={title}>
            <GitBranch size={22} />
            <h2>{index + 1}. {title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="cert-syllabus">
        <h2>Assessment format</h2>
        <div className="cert-checklist">
          {["40 questions", "60 minutes", "75% to pass", "£25 one-time"].map((item) => (
            <span key={item}><Clock size={15} />{item}</span>
          ))}
        </div>
        <p className="cert-format-note">Scenario-based: most questions describe a real team situation and ask what you would do. Retakes require purchasing again if you do not pass.</p>
      </section>

      <section className="cert-syllabus">
        <h2>Recommended before attempting</h2>
        <div className="cert-checklist">
          <span><CheckCircle2 size={15} />Git Fundamentals Certificate — or equivalent experience</span>
          <span><CheckCircle2 size={15} />Have worked on at least one collaborative project with branches and PRs</span>
        </div>
      </section>
    </div>
  );
}
