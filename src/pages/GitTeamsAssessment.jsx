import { functionFetch } from "../lib/functionFetch";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const certType = "git-for-teams";
const certPath = "/certification/git-for-teams";

export default function GitTeamsAssessment() {
  useDocumentTitle("Git for Teams Assessment");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [GIT_TEAMS_QUESTIONS, setQuestions] = useState([]);
  const [assessmentSession, setAssessmentSession] = useState(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [submitting, setSubmitting] = useState(false);
  const submitRef = useRef(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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
        let { data: certData } = await supabase
          .from("certifications")
          .select("*")
          .eq("user_id", data.user.id)
          .eq("cert_type", certType)
          .order("issued_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const sessionId = searchParams.get("session_id");
        if (sessionId) {
          const response = await functionFetch("/.netlify/functions/verify-cert-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, userId: data.user.id })
          });
          const payload = await response.json().catch(() => ({}));
          if (response.ok && payload.certification) {
            certData = payload.certification;
          }
        }

        if (!alive) return;
        setCert(certData || null);
        if (certData) {
          const response = await functionFetch("/.netlify/functions/assessment", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start", certType })
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "Could not start assessment.");
          if (!alive) return;
          setAssessmentSession(payload.sessionId);
          setQuestions(payload.questions);
          setAnswers(Array(payload.questions.length).fill(null));
          setTimeLeft(Math.max(0, Math.floor((Date.parse(payload.expiresAt) - Date.now()) / 1000)));
        }
      }

      setLoading(false);
    }

    load().catch(() => { if (alive) { setError("Could not load the assessment. Please try again or check your purchase."); setLoading(false); } });
    return () => {
      alive = false;
    };
  }, [searchParams]);

  async function handleSubmit() {
    if (submitRef.current || !user?.id) return;
    submitRef.current = true;
    setSubmitting(true);

    try {
      setError("");
      const response = await functionFetch("/.netlify/functions/assessment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", certType, sessionId: assessmentSession, answers: answersRef.current })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit assessment.");
      navigate("/certification/" + certType + "/result?attempt=" + result.attemptId);
    } catch {
      setError("Could not submit your answers. Please try again.");
      submitRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (loading || !assessmentSession || submitting) return undefined;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [assessmentSession, loading, submitting]);

  const question = GIT_TEAMS_QUESTIONS[index];
  const progress = ((index + 1) / GIT_TEAMS_QUESTIONS.length) * 100;
  const sections = useMemo(() => [...new Set(GIT_TEAMS_QUESTIONS.map((item) => item.section))], [GIT_TEAMS_QUESTIONS]);
  const currentSectionIndex = sections.indexOf(question?.section);
  const timeLabel = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  if (loading) {
    return <div className="cert-page"><section className="cert-card"><p>Loading assessment...</p></section></div>;
  }

  if (error && !assessmentSession) return <div className="cert-page"><p role="alert">{error}</p><Link to={"/certification/" + certType}>Back to certificate page</Link></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!cert) {
    return (
      <div className="cert-page">
        <section className="cert-card">
          <h1>Purchase required</h1>
          <p>Buy the Git for Teams Certificate before starting the assessment.</p>
          <Link className="button primary" to={certPath}>Back to certificate page</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="cert-page">
      {error && <p role="alert">{error}</p>}
      <div className="cert-assessment-layout">
        <aside className="cert-section-sidebar">
          <p className="eyebrow">Sections</p>
          {sections.map((section, sectionIndex) => {
            const state = sectionIndex < currentSectionIndex ? "complete" : sectionIndex === currentSectionIndex ? "active" : "";
            return (
              <button className={state} key={section} onClick={() => setIndex(GIT_TEAMS_QUESTIONS.findIndex((item) => item.section === section))} type="button">
                <i />
                <span>{section}</span>
              </button>
            );
          })}
        </aside>
        <section className="cert-assessment git-teams-assessment">
          <header className="cert-assessment-header">
            <div>
              <p className="eyebrow">Question {index + 1} of {GIT_TEAMS_QUESTIONS.length}</p>
              <h1>Git for Teams Assessment</h1>
            </div>
            <span className="cert-timer"><Clock size={16} />{timeLabel} remaining</span>
          </header>
          <div className="cert-progress"><span style={{ width: `${progress}%` }} /></div>
          <p className="cert-question-section">{question.section}</p>
          <h2>{question.question}</h2>
          <div className="cert-options">
            {question.options.map((option, optionIndex) => (
              <button
                className={answers[index] === optionIndex ? "selected" : ""}
                key={option}
                onClick={() => setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? optionIndex : answer))}
                type="button"
              >
                <span>{String.fromCharCode(65 + optionIndex)}</span>
                {option}
              </button>
            ))}
          </div>
          <footer className="cert-assessment-actions">
            <button className="button soft" disabled={index === 0 || submitting} onClick={() => setIndex(index - 1)} type="button"><ArrowLeft size={15} />Back</button>
            {index === GIT_TEAMS_QUESTIONS.length - 1 ? (
              <button className="button primary" disabled={submitting} onClick={handleSubmit} type="button">{submitting ? "Submitting..." : "Submit assessment"}</button>
            ) : (
              <button className="button primary" disabled={answers[index] === null || submitting} onClick={() => setIndex(index + 1)} type="button">Next question<ArrowRight size={15} /></button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}
