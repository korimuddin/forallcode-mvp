import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { OPEN_SOURCE_QUESTIONS } from "../data/certQuestions/openSourceQuestions";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const certType = "open-source-contributor";
const passMark = 70;
const certPath = "/certification/open-source-contributor";

export default function OpenSourceAssessment() {
  useDocumentTitle("Open Source Contributor Assessment");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(OPEN_SOURCE_QUESTIONS.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(55 * 60);
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
        if (!certData && sessionId) {
          const response = await fetch("/.netlify/functions/verify-cert-checkout", {
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
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [searchParams]);

  async function handleSubmit() {
    if (submitRef.current || !user?.id) return;
    submitRef.current = true;
    setSubmitting(true);

    const submittedAnswers = answersRef.current;
    const score = submittedAnswers.reduce((acc, answer, questionIndex) => (
      acc + (answer === OPEN_SOURCE_QUESTIONS[questionIndex].correct ? 1 : 0)
    ), 0);
    const percentage = Math.round((score / OPEN_SOURCE_QUESTIONS.length) * 100);
    const passed = percentage >= passMark;

    if (supabase) {
      await supabase.from("cert_attempts").insert({
        user_id: user.id,
        cert_type: certType,
        score: percentage,
        passed,
        answers: submittedAnswers
      });

      if (passed) {
        const verificationCode = cert?.verification_code || crypto.randomUUID();
        await supabase
          .from("certifications")
          .update({
            issued_at: new Date().toISOString(),
            verification_code: verificationCode,
            certificate_url: `/certificates/${verificationCode}`
          })
          .eq("user_id", user.id)
          .eq("cert_type", certType);
      } else {
        await supabase
          .from("certifications")
          .delete()
          .eq("user_id", user.id)
          .eq("cert_type", certType);
      }
    }

    navigate(`/certification/open-source-contributor/result?score=${percentage}&passed=${passed ? "true" : "false"}`);
  }

  useEffect(() => {
    if (loading || !cert || submitting) return undefined;
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
  }, [cert, loading, submitting]);

  const question = OPEN_SOURCE_QUESTIONS[index];
  const progress = ((index + 1) / OPEN_SOURCE_QUESTIONS.length) * 100;
  const sections = useMemo(() => [...new Set(OPEN_SOURCE_QUESTIONS.map((item) => item.section))], []);
  const currentSectionIndex = sections.indexOf(question.section);
  const timeLabel = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  if (loading) {
    return <div className="cert-page"><section className="cert-card"><p>Loading assessment...</p></section></div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!cert) {
    return (
      <div className="cert-page">
        <section className="cert-card">
          <h1>Purchase required</h1>
          <p>Buy the Open Source Contributor Certificate before starting the assessment.</p>
          <Link className="button primary" to={certPath}>Back to certificate page</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="cert-page">
      <div className="cert-assessment-layout">
        <aside className="cert-section-sidebar">
          <p className="eyebrow">Sections</p>
          {sections.map((section, sectionIndex) => {
            const state = sectionIndex < currentSectionIndex ? "complete" : sectionIndex === currentSectionIndex ? "active" : "";
            return (
              <button className={state} key={section} onClick={() => setIndex(OPEN_SOURCE_QUESTIONS.findIndex((item) => item.section === section))} type="button">
                <i />
                <span>{section}</span>
              </button>
            );
          })}
        </aside>
        <section className="cert-assessment open-source-assessment">
          <header className="cert-assessment-header">
            <div>
              <p className="eyebrow">Question {index + 1} of {OPEN_SOURCE_QUESTIONS.length}</p>
              <h1>Open Source Contributor Assessment</h1>
            </div>
            <span className="cert-timer"><Clock size={16} />{timeLabel} remaining</span>
          </header>
          <div className="cert-progress"><span style={{ width: `${progress}%` }} /></div>
          <div className="cert-scenario-note">📋 Scenario: {question.scenario || question.section}</div>
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
            {index === OPEN_SOURCE_QUESTIONS.length - 1 ? (
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
