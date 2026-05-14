import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, CheckCircle2, Clock, ExternalLink, Terminal } from "lucide-react";
import CertTaster from "../components/certifications/taster/CertTaster";
import { CLI_TASTER } from "../data/tasterQuestions/cliTaster";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const certType = "command-line-essentials";
const assessmentAreas = [
  ["Navigation and file system", "Moving through directories, understanding absolute and relative paths, listing files, finding things efficiently."],
  ["File and directory operations", "Creating, copying, moving, renaming, and deleting files and directories safely. Understanding the risks of destructive commands."],
  ["Viewing and editing file content", "Reading files, searching within them, piping output, and making basic edits without leaving the terminal."],
  ["Permissions and ownership", "Understanding Unix file permissions, reading permission strings, using chmod and chown safely."],
  ["Processes and system", "Running processes, backgrounding tasks, killing processes, checking system resources, and understanding job control."],
  ["Environment variables and configuration", "What environment variables are, how to set and use them, understanding PATH, and reading shell configuration files."],
  ["Pipes, redirection, and chaining", "The Unix philosophy in practice — combining simple commands into powerful pipelines using |, >, >>, and &&."],
  ["Shell scripting basics", "Writing simple scripts, variables, loops, conditionals, and making scripts executable. Automating repetitive tasks."]
];

export default function CLICertInfo() {
  useDocumentTitle("Command Line Essentials Certificate");
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
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Command+Line+Essentials&organizationId=&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${cert.verification_code}`;
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
        successUrl: `${window.location.origin}/certification/command-line-essentials/assessment?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/certification/command-line-essentials`
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
      <section className="cert-hero cli-cert">
        <span className="cert-hero-icon"><Award size={30} /></span>
        <p className="eyebrow">Certificate of Proficiency</p>
        <h1>Command Line Essentials</h1>
        <p>The terminal is the foundation of everything a developer does — Git, deployment, scripting, package management, and debugging. This certificate proves you can navigate confidently, work with files and directories, understand environment variables, write basic scripts, and solve real problems without reaching for a GUI.</p>
        <CertTaster config={CLI_TASTER} />
        <div className="cert-hero-actions">
          {loading ? (
            <button className="button primary" disabled>Checking certificate...</button>
          ) : hasPassed ? (
            <>
              <Link className="button primary" to={cert.certificate_url}>View your certificate</Link>
              <a className="button soft" href={linkedInShareUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} />Share on LinkedIn</a>
            </>
          ) : hasPurchased ? (
            <Link className="button primary" to="/certification/command-line-essentials/assessment">Take assessment</Link>
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
            <Terminal size={22} />
            <h2>{index + 1}. {title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="cert-syllabus">
        <h2>Assessment format</h2>
        <div className="cert-checklist">
          {["40 questions", "50 minutes", "70% to pass", "£20 one-time"].map((item) => (
            <span key={item}><Clock size={15} />{item}</span>
          ))}
        </div>
        <p className="cert-format-note">Questions present real terminal scenarios and ask what command to use or what the output of a command will be. Retakes require purchasing again if you do not pass.</p>
      </section>

      <section className="cert-syllabus">
        <h2>No prior experience required</h2>
        <div className="cert-checklist">
          <span><CheckCircle2 size={15} />Access to a terminal: macOS, Linux, or WSL on Windows</span>
          <span><CheckCircle2 size={15} />Spent at least a few hours using basic terminal commands</span>
          <span><CheckCircle2 size={15} />Attempted to use Git from the command line at least once</span>
        </div>
      </section>
    </div>
  );
}
