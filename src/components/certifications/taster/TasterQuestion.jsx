import { formatQuestionText } from "../../../lib/formatQuestionText";

const LETTERS = ["A", "B", "C", "D"];

export default function TasterQuestion({
  question,
  answered,
  selectedIdx,
  onAnswer,
  onNext,
  isLast
}) {
  const isCorrect = selectedIdx === question.correct;

  return (
    <article className="cert-taster-question-shell">
      <span className={`cert-taster-difficulty ${question.difficulty}`}>{question.difficulty}</span>
      <h2>{formatQuestionText(question.text)}</h2>

      <div className="cert-taster-options">
        {question.options.map((option, optionIdx) => {
          const optionState = getOptionState({ answered, optionIdx, question, selectedIdx });
          return (
            <button
              className={optionState}
              disabled={answered}
              key={option}
              onClick={() => onAnswer(optionIdx)}
              type="button"
            >
              <span>{getOptionMarker({ answered, optionIdx, question, selectedIdx }) || LETTERS[optionIdx]}</span>
              <span className="cert-taster-option-text">{formatQuestionText(option)}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`cert-taster-explanation ${isCorrect ? "correct" : "incorrect"}`}>
          {formatQuestionText(question.explanation)}
        </div>
      )}

      {answered && (
        <div className="cert-taster-quiz-actions">
          <button className="button primary" onClick={onNext} type="button">
            {isLast ? "See my results →" : "Next question →"}
          </button>
        </div>
      )}
    </article>
  );
}

function getOptionState({ answered, optionIdx, question, selectedIdx }) {
  if (!answered) return "";
  if (optionIdx === question.correct) return "correct";
  if (optionIdx === selectedIdx) return "incorrect";
  return "muted";
}

function getOptionMarker({ answered, optionIdx, question, selectedIdx }) {
  if (!answered) return "";
  if (optionIdx === question.correct) return "✓";
  if (optionIdx === selectedIdx) return "✗";
  return "";
}
