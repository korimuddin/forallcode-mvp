import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Copy, ExternalLink } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const certificateDisplay = {
  "git-fundamentals": {
    name: "Git Fundamentals",
    colour: "#9b8fd4",
    backPath: "/certification/git-fundamentals"
  },
  "git-for-teams": {
    name: "Git for Teams",
    subtitle: "Certificate of Proficiency",
    colour: "#7aaa72",
    backPath: "/certification/git-for-teams"
  },
  "command-line-essentials": {
    name: "Command Line Essentials",
    subtitle: "Certificate of Proficiency",
    colour: "#c8a055",
    backPath: "/certification/command-line-essentials"
  },
  "open-source-contributor": {
    name: "Open Source Contributor",
    subtitle: "Certificate of Proficiency",
    colour: "#7aaa72",
    icon: "🌱",
    backPath: "/certification/open-source-contributor",
    linkedInDescription: "Demonstrated understanding of the open source contribution lifecycle — from finding projects to getting PRs merged.",
    postTitle: "I just earned the Open Source Contributor Certificate from ForAllCode"
  }
};

export default function CertificateView() {
  const { verificationCode } = useParams();
  useDocumentTitle("Certificate Verification");
  const [cert, setCert] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!supabase || !verificationCode) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.rpc("verify_public_certificate", { code: verificationCode }).maybeSingle();

      if (!alive) return;
      setCert(data || null);
      setProfile(data || null);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [verificationCode]);

  const certUrl = typeof window !== "undefined" ? window.location.href : "";
  const issued = cert?.issued_at ? new Date(cert.issued_at) : new Date();
  const display = certificateDisplay[cert?.cert_type] || certificateDisplay["git-fundamentals"];
  const linkedInShareUrl = useMemo(() => (
    `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(display.name)}&organizationId=&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${cert?.verification_code || ""}`
  ), [cert?.verification_code, certUrl, display.name, issued]);
  const linkedInPostUrl = useMemo(() => {
    if (!display.postTitle) return "";
    const postTitle = display.linkedInDescription ? `${display.postTitle} — ${display.linkedInDescription}` : display.postTitle;
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}&title=${encodeURIComponent(postTitle)}`;
  }, [certUrl, display.linkedInDescription, display.postTitle]);

  async function copyLink() {
    await navigator.clipboard?.writeText(certUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading) {
    return <div className="certificate-public-page"><section className="certificate-card"><p>Verifying certificate...</p></section></div>;
  }

  if (!cert?.certificate_url) {
    return (
      <div className="certificate-public-page">
        <section className="certificate-card">
          <h1>Certificate not found</h1>
          <p>This certificate link is missing or has not been issued yet.</p>
          <Link className="button soft" to="/certification/git-fundamentals">View certification</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="certificate-public-page">
      <section className="certificate-card" style={{ "--certificate-colour": display.colour }}>
        <i className="certificate-corner top-left" />
        <i className="certificate-corner top-right" />
        <i className="certificate-corner bottom-left" />
        <i className="certificate-corner bottom-right" />
        <p className="certificate-brand">ForAllCode</p>
        {display.subtitle && <p className="certificate-subtitle">{display.subtitle}</p>}
        <p className="certificate-kicker">This certifies that</p>
        <h1>{profile?.display_name || profile?.username || "A ForAllCode learner"}</h1>
        <p className="certificate-kicker">has successfully completed</p>
        {display.icon && <div className="certificate-icon" aria-hidden="true">{display.icon}</div>}
        <h2>{display.name}</h2>
        <p className="certificate-date">Issued {issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        <p className="certificate-code">Verification code: {cert.verification_code}</p>
        <div className="certificate-actions">
          <button className="button soft" onClick={copyLink} type="button"><Copy size={15} />{copied ? "Copied" : "Copy certificate link"}</button>
          <a className="button primary" href={linkedInShareUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} />Share on LinkedIn</a>
          {linkedInPostUrl && <a className="button soft" href={linkedInPostUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} />Share as LinkedIn post</a>}
          <Link className="button soft" to={display.backPath}>View certification</Link>
        </div>
      </section>
    </div>
  );
}
