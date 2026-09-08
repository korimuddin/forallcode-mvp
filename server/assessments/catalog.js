import { GIT_FUNDAMENTALS_QUESTIONS } from "./fundamentals.js";
import { GIT_TEAMS_QUESTIONS } from "./teams.js";
import { CLI_QUESTIONS } from "./cli.js";
import { OPEN_SOURCE_QUESTIONS } from "./open-source.js";

const catalog = {
  "git-fundamentals": { questions: GIT_FUNDAMENTALS_QUESTIONS, passMark: 70, minutes: 45 },
  "git-for-teams": { questions: GIT_TEAMS_QUESTIONS, passMark: 75, minutes: 60 },
  "command-line-essentials": { questions: CLI_QUESTIONS, passMark: 70, minutes: 50 },
  "open-source-contributor": { questions: OPEN_SOURCE_QUESTIONS, passMark: 70, minutes: 55 }
};

export function getAssessment(type) {
  return Object.hasOwn(catalog, type) ? catalog[type] : null;
}

export function publicQuestions(assessment) {
  return assessment.questions.map(({ id, question, options, section }) => ({ id, question, options, section }));
}

export function gradeAssessment(assessment, answers) {
  if (!Array.isArray(answers) || answers.length !== assessment.questions.length ||
    answers.some((answer, index) => answer !== null && (!Number.isInteger(answer) ||
      answer < 0 || answer >= assessment.questions[index].options.length))) {
    throw new Error("Invalid answers");
  }
  const correct = assessment.questions.reduce((total, question, index) => total + (question.correct === answers[index] ? 1 : 0), 0);
  const score = Math.round(100 * correct / assessment.questions.length);
  return { score, passed: score >= assessment.passMark };
}
