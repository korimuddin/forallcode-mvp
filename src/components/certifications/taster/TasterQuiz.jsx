import { useMemo, useState } from "react";
import TasterQuestion from "./TasterQuestion";

export default function TasterQuiz({ config, onComplete }) {
  const allQuestions = useMemo(
    () =>
      config.sections.flatMap((section, sectionIdx) =>
        section.questions.map((question, questionIdx) => ({
          ...question,
          id: question.id || `${config.id || config.slug}-q-${sectionIdx}-${questionIdx}`,
          sectionIdx,
          sectionTitle: section.title,
          sectionIntro: section.intro,
          sectionAccent: section.accentColour
        }))
      ),
    [config]
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  const current = allQuestions[currentIdx];
  const total = allQuestions.length;
  const progress = ((currentIdx + 1) / total) * 100;
  const isLastQuestion = currentIdx === total - 1;
  const isNewSection = currentIdx === 0 || allQuestions[currentIdx - 1].sectionIdx !== current.sectionIdx;
  const hasAnswered = selectedIdx !== null;

  function handleAnswer(optionIdx) {
    if (hasAnswered) return;
    setSelectedIdx(optionIdx);
  }

  function handleNext() {
    if (!hasAnswered) return;

    const nextAnswer = {
      questionId: current.id,
      sectionTitle: current.sectionTitle,
      difficulty: current.difficulty,
      selectedIdx,
      correctIdx: current.correct,
      correct: selectedIdx === current.correct
    };
    const nextAnswers = [...answers, nextAnswer];

    if (isLastQuestion) {
      onComplete(nextAnswers);
      return;
    }

    setAnswers(nextAnswers);
    setCurrentIdx((index) => index + 1);
    setSelectedIdx(null);
  }

  return (
    <div className="cert-taster-quiz">
      <div className="cert-taster-progress-meta">
        <span>Question {currentIdx + 1} of {total}</span>
        <span>{config.name || config.certificationName} taster</span>
      </div>
      <div className="cert-taster-progress" aria-hidden="true">
        <span style={{ width: `${progress}%`, "--taster-accent": config.accentColour }} />
      </div>

      {isNewSection && (
        <div className="cert-taster-section-intro" style={{ "--section-accent": current.sectionAccent }}>
          <span>Topic {current.sectionIdx + 1}: {current.sectionTitle}</span>
          <p>{current.sectionIntro}</p>
        </div>
      )}

      <TasterQuestion
        answered={hasAnswered}
        isLast={isLastQuestion}
        onAnswer={handleAnswer}
        onNext={handleNext}
        question={current}
        selectedIdx={selectedIdx}
      />
    </div>
  );
}
