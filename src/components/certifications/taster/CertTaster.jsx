import { useState } from "react";
import TasterLanding from "./TasterLanding";
import TasterQuiz from "./TasterQuiz";
import TasterResults from "./TasterResults";

export default function CertTaster({ config }) {
  const [phase, setPhase] = useState("landing");
  const [answers, setAnswers] = useState([]);

  function handleStart() {
    setAnswers([]);
    setPhase("quiz");
  }

  function handleComplete(finalAnswers = []) {
    setAnswers(finalAnswers);
    setPhase("results");
  }

  function handleRetake() {
    setAnswers([]);
    setPhase("quiz");
  }

  return (
    <section className="cert-taster" aria-label={`${config.title} free taster quiz`}>
      <div className="cert-taster-header">
        <div className="cert-taster-meta">
          <span>Free taster</span>
          <i aria-hidden="true" />
          <span>2 topics · 6 questions · ~4 minutes</span>
        </div>
        {phase === "landing" && (
          <button
            className="cert-taster-start"
            onClick={handleStart}
            style={{ "--taster-accent": config.accentColour, "--taster-accent-text": config.accentTextColour }}
            type="button"
          >
            Start quiz →
          </button>
        )}
      </div>

      <div className="cert-taster-body">
        {phase === "landing" && (
          <TasterLanding config={config} onStart={handleStart} />
        )}

        {phase === "quiz" && (
          <TasterQuiz config={config} onComplete={handleComplete} />
        )}

        {phase === "results" && (
          <TasterResults answers={answers} config={config} onRetake={handleRetake} />
        )}
      </div>
    </section>
  );
}
