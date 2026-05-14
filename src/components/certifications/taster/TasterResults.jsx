import { useNavigate } from "react-router-dom";

export default function TasterResults({ config, answers, onRetake }) {
  const navigate = useNavigate();
  const allQuestions = config.sections.flatMap((section, sectionIdx) =>
    section.questions.map((question) => ({ ...question, sectionIdx }))
  );
  const totalQuestions = allQuestions.length;
  const totalCorrect = answers.filter((answer) => answer.correct).length;
  const scorePercentage = Math.round((totalCorrect / totalQuestions) * 100);
  const tasterPercentage = Math.round((totalQuestions / config.fullQuestionCount) * 100);
  const remainingPercentage = 100 - tasterPercentage;
  const bySection = config.sections.map((section) => {
    const sectionAnswers = answers.filter((answer) => answer.sectionTitle === section.title);
    const correct = sectionAnswers.filter((answer) => answer.correct).length;
    const total = section.questions.length;
    return {
      title: section.title,
      accentColour: section.accentColour,
      correct,
      total,
      percentage: Math.round((correct / total) * 100)
    };
  });
  const strong = bySection.filter((section) => section.percentage >= 67);
  const weak = bySection.filter((section) => section.percentage < 67);
  const grade = getGrade(scorePercentage);

  return (
    <div className="cert-taster-results">
      <div className="cert-taster-results-head">
        <div>
          <h2>Taster complete</h2>
          <p>{config.name} · {totalQuestions} questions · {config.sections.length} topics</p>
        </div>
        <div className="cert-taster-score">
          <strong style={{ color: grade.color }}>{scorePercentage}%</strong>
          <span style={{ background: grade.bg, color: grade.color }}>{grade.label}</span>
        </div>
      </div>

      <div className="cert-taster-metrics">
        <MetricCard label="Questions correct" value={`${totalCorrect}/${totalQuestions}`} />
        <MetricCard label="Taster score" value={`${scorePercentage}%`} />
        <MetricCard label="Of course covered" value={`${tasterPercentage}%`} />
      </div>

      <div className="cert-taster-breakdown">
        <p className="eyebrow">Topic breakdown</p>
        {bySection.map((section) => (
          <div className="cert-taster-breakdown-row" key={section.title}>
            <span>{section.title}</span>
            <div aria-hidden="true">
              <i style={{ width: `${section.percentage}%`, background: section.accentColour }} />
            </div>
            <strong className={section.percentage >= 67 ? "strong" : "weak"}>{section.percentage}%</strong>
          </div>
        ))}
      </div>

      {strong.length > 0 && (
        <InsightCard tone="strong" title="Strong areas">
          {strong.map((section) => section.title).join(" · ")} — you have a solid foundation.
          The full course builds significantly on these topics with harder scenarios.
        </InsightCard>
      )}

      {weak.length > 0 && (
        <InsightCard tone="weak" title="Areas to develop">
          {weak.map((section) => section.title).join(" · ")} — these topics trip people up.
          The full course covers them in depth with worked examples and detailed explanations.
        </InsightCard>
      )}

      <InsightCard tone="neutral" title="What you have not seen yet">
        This taster covered {tasterPercentage}% of the full {config.fullQuestionCount}-question course.
        The remaining {remainingPercentage}% covers {config.remainingTopicsDesc} at increasing difficulty levels.
      </InsightCard>

      <div
        className="cert-taster-upsell"
        style={{ "--upsell-bg-1": config.upsellBg1, "--upsell-bg-2": config.upsellBg2, "--upsell-accent": config.accentColour }}
      >
        <div>
          <h3>
            {scorePercentage >= 70
              ? "Your score suggests you are ready for the full assessment."
              : "The full course covers everything this taster revealed."}
          </h3>
          <p>
            {config.fullQuestionCount} questions · {config.fullSectionCount} topics · {config.passPercent}% to pass · Certificate issued on completion
          </p>
        </div>
        <div>
          <button className="button primary" onClick={() => navigate(`/certification/${config.slug}`)} type="button">
            Purchase — {config.price} →
          </button>
          <button className="button soft" onClick={onRetake} type="button">
            Retake taster
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function InsightCard({ children, title, tone }) {
  return (
    <div className={`cert-taster-insight ${tone}`}>
      <span>{title}</span>
      <p>{children}</p>
    </div>
  );
}

function getGrade(scorePercentage) {
  if (scorePercentage >= 80) {
    return { label: "Excellent", color: "#27500A", bg: "#c8d8c4" };
  }
  if (scorePercentage >= 60) {
    return { label: "Good start", color: "#633806", bg: "#f5e4c4" };
  }
  return { label: "Needs practice", color: "#72243E", bg: "#f5d5d8" };
}
