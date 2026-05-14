export default function TasterLanding({ config, onStart }) {
  const coveredPercentage = Math.round((config.tasterQuestionCount / config.fullQuestionCount) * 100);
  const additionalTopics = config.fullSectionCount - config.sections.length;

  return (
    <div className="cert-taster-landing">
      <p>{config.tasterDescription}</p>

      <div className="cert-taster-topic-grid">
        {config.sections.map((section, index) => (
          <article
            className="cert-taster-topic-card"
            key={section.title}
            style={{ "--topic-accent": section.accentColour }}
          >
            <span>Topic {index + 1}</span>
            <h3>{section.title}</h3>
            <p>{section.intro}</p>
            <div className="cert-taster-difficulty-row" aria-label={`${section.title} difficulty levels`}>
              {section.questions.map((question) => (
                <i className={`cert-taster-difficulty ${question.difficulty}`} key={question.id}>
                  {question.difficulty}
                </i>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="cert-taster-landing-footer">
        <p>
          This taster covers {coveredPercentage}% of the full {config.fullQuestionCount}-question assessment.
          {" "}
          The full course covers {additionalTopics > 0 ? `${additionalTopics} additional topics` : "all topics in greater depth"}.
        </p>
        <button className="button soft" onClick={onStart} type="button">
          Start taster →
        </button>
      </div>
    </div>
  );
}
