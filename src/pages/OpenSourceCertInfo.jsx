import AssessmentDisclosure from "../components/learn/AssessmentDisclosure";
import { functionFetch } from "../lib/functionFetch";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, CheckCircle2, Clock, ExternalLink, Sprout } from "lucide-react";
import CertTaster from "../components/certifications/taster/CertTaster";
import { OPEN_SOURCE_TASTER } from "../data/tasterQuestions/openSourceTaster";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const certType = "open-source-contributor";
const assessmentAreas = [
  ["Finding the right project", "How to discover projects worth contributing to, reading project health signals, evaluating maintainer responsiveness, and matching your skills to open issues."],
  ["Understanding contribution guidelines", "CONTRIBUTING.md, codes of conduct, issue templates, PR templates, and why following project standards is non-negotiable."],
  ["The fork and PR workflow", "Forking vs cloning, keeping forks in sync, branch naming conventions, and the full lifecycle from fork to merged PR."],
  ["Writing good issues", "Bug reports that maintainers can act on, feature requests that get considered, providing reproduction steps, environment details, and expected vs actual behaviour."],
  ["Communication with maintainers", "Tone, patience, responding to feedback, handling rejection gracefully, and understanding that maintainers are volunteers."],
  ["Licences and intellectual property", "The major open source licences and their practical implications, CLAs, copyright assignment, and what you can and cannot do with open source code."],
  ["Code quality for external contribution", "Why the quality bar is higher when contributing externally, writing tests, documentation, and meeting a project's coding standards."],
  ["Community norms and etiquette", "Inclusive language, constructive criticism, avoiding entitlement, the unwritten rules of open source communities."]
];

export default function OpenSourceCertInfo() {
  useDocumentTitle("Open Source Contributor Certificate");
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

  const hasPurchased = Boolean(cert?.id && !cert.assessment_used);
  const hasPassed = Boolean(cert?.certificate_url);
  const certUrl = hasPassed ? `${window.location.origin}${cert.certificate_url}` : "";
  const linkedInShareUrl = useMemo(() => {
    if (!hasPassed) return "";
    const issued = cert.issued_at ? new Date(cert.issued_at) : new Date();
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Open+Source+Contributor&organizationId=&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${cert.verification_code}`;
  }, [cert, certUrl, hasPassed]);

  async function startCheckout() {
    setError("");
    if (!user?.id) {
      navigate("/login");
      return;
    }

    setCheckoutStatus("loading");
    const response = await functionFetch("/.netlify/functions/create-cert-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        certType,
        successUrl: `${window.location.origin}/certification/open-source-contributor/assessment?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/certification/open-source-contributor`
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
      <section className="cert-hero open-source-cert">
        <span className="cert-hero-icon"><Award size={30} /></span>
        <p className="eyebrow">Certificate of Proficiency</p>
        <h1>Open Source Contributor</h1>
        <p>Contributing to open source is one of the most visible things a developer can do. It proves you can read unfamiliar code, communicate clearly with maintainers, follow project standards, and deliver work that real people depend on. This certificate demonstrates that you understand the full contribution lifecycle — from finding the right project to getting your first PR merged.</p>
        <AssessmentDisclosure />
        <CertTaster config={OPEN_SOURCE_TASTER} />
        <div className="cert-hero-actions">
          {loading ? (
            <button className="button primary" disabled>Checking certificate...</button>
          ) : hasPassed ? (
            <>
              <Link className="button primary" to={cert.certificate_url}>View your certificate</Link>
              <a className="button soft" href={linkedInShareUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} />Share on LinkedIn</a>
            </>
          ) : hasPurchased ? (
            <Link className="button primary" to="/certification/open-source-contributor/assessment">Take assessment</Link>
          ) : (
            <button className="button primary" disabled={checkoutStatus === "loading"} onClick={startCheckout} type="button">
              {checkoutStatus === "loading" ? "Opening checkout..." : "Purchase and take assessment - £20"}
            </button>
          )}
        </div>
        {error && <p className="cert-error">{error}</p>}
      </section>

      <section className="cert-info-grid cert-area-grid">
        {assessmentAreas.map(([title, body], index) => (
          <article key={title}>
            <Sprout size={22} />
            <h2>{index + 1}. {title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="cert-social-proof">
        <div>
          <p className="eyebrow">Built to be shared</p>
          <h2>Open source contribution is one of the top signals employers look for.</h2>
          <p>This certificate is designed to be shared — on LinkedIn, in job applications, and on your developer profile.</p>
        </div>
        <article>
          <span>🌱</span>
          <strong>I just earned the Open Source Contributor Certificate from ForAllCode</strong>
          <p>Demonstrated understanding of the open source contribution lifecycle — from finding projects to getting PRs merged.</p>
        </article>
      </section>

      <section className="cert-syllabus">
        <h2>Assessment format</h2>
        <div className="cert-checklist">
          {["40 questions", "55 minutes", "70% to pass", "£20 one-time"].map((item) => (
            <span key={item}><Clock size={15} />{item}</span>
          ))}
        </div>
        <p className="cert-format-note">Scenario-based questions describe real contribution situations and ask what you would do or why a particular approach is correct. Retakes require purchasing again if you do not pass.</p>
      </section>

      <section className="cert-syllabus">
        <h2>Recommended before attempting</h2>
        <div className="cert-checklist">
          <span><CheckCircle2 size={15} />Git Fundamentals Certificate — or solid Git experience</span>
          <span><CheckCircle2 size={15} />Have read at least one open source project's README and CONTRIBUTING.md</span>
          <span><CheckCircle2 size={15} />Have a GitHub or ForAllCode account with at least one public repository</span>
        </div>
      </section>
    </div>
  );
}
