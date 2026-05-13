import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Award, RotateCcw } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

export default function CertificationResult() {
  useDocumentTitle("Certification Result");
  const [searchParams] = useSearchParams();
  const score = Number(searchParams.get("score") || 0);
  const passed = searchParams.get("passed") === "true";
  const [certificateUrl, setCertificateUrl] = useState("");

  useEffect(() => {
    async function loadCertificate() {
      if (!supabase || !passed) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) return;
      const { data } = await supabase
        .from("certifications")
        .select("certificate_url")
        .eq("user_id", userData.user.id)
        .eq("cert_type", "git-fundamentals")
        .maybeSingle();
      setCertificateUrl(data?.certificate_url || "");
    }

    loadCertificate();
  }, [passed]);

  return (
    <div className="cert-page">
      <section className={passed ? "cert-result passed" : "cert-result"}>
        <Award size={42} />
        <p className="eyebrow">Assessment complete</p>
        <h1>{passed ? "You passed Git Fundamentals" : "Not quite this time"}</h1>
        <p className="cert-score">{score}%</p>
        <p>{passed ? "Your certificate is ready to share. That is a lovely little milestone." : "You need 70% to pass. Review the lessons and try again when you are ready."}</p>
        <div className="cert-hero-actions">
          {passed && certificateUrl && <Link className="button primary" to={certificateUrl}>View certificate</Link>}
          {!passed && <Link className="button primary" to="/certification/git-fundamentals/assessment"><RotateCcw size={15} />Try again</Link>}
          <Link className="button soft" to="/dashboard">Back to dashboard</Link>
        </div>
      </section>
    </div>
  );
}
