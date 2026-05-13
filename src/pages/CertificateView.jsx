import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Copy, ExternalLink } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

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

      const { data } = await supabase
        .from("certifications")
        .select("*, profiles(display_name, username)")
        .eq("verification_code", verificationCode)
        .maybeSingle();

      if (!alive) return;
      setCert(data || null);
      setProfile(data?.profiles || null);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [verificationCode]);

  const certUrl = typeof window !== "undefined" ? window.location.href : "";
  const issued = cert?.issued_at ? new Date(cert.issued_at) : new Date();
  const linkedInShareUrl = useMemo(() => (
    `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Git+Fundamentals&organizationId=&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${cert?.verification_code || ""}`
  ), [cert?.verification_code, certUrl, issued]);

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
      <section className="certificate-card">
        <i className="certificate-corner top-left" />
        <i className="certificate-corner top-right" />
        <i className="certificate-corner bottom-left" />
        <i className="certificate-corner bottom-right" />
        <p className="certificate-brand">ForAllCode</p>
        <p className="certificate-kicker">This certifies that</p>
        <h1>{profile?.display_name || profile?.username || "A ForAllCode learner"}</h1>
        <p className="certificate-kicker">has successfully completed</p>
        <h2>Git Fundamentals</h2>
        <p className="certificate-date">Issued {issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        <p className="certificate-code">Verification code: {cert.verification_code}</p>
        <div className="certificate-actions">
          <button className="button soft" onClick={copyLink} type="button"><Copy size={15} />{copied ? "Copied" : "Copy certificate link"}</button>
          <a className="button primary" href={linkedInShareUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} />Share on LinkedIn</a>
        </div>
      </section>
    </div>
  );
}
