import type { ConceptMastery, Question, QuestionAttempt, SeedPrior } from "@/lib/types";
import { isAnswerCorrect } from "./scoring";
import { addDays } from "./time";

/**
 * Explainable mastery model (Leitner-style boxes 0–5).
 *
 *  - Correct + "knew it" (or no confidence given): move up one box.
 *  - Correct + educated guess: no promotion; review again tomorrow.
 *  - Correct + random guess: treated as not known; drop to box 1 at most.
 *  - Incorrect: back to box 0, due now. If the learner was confident, it is
 *    flagged as a likely misconception.
 *  - Variety rule: boxes 4–5 ("Mastered") need confident correct answers on at
 *    least two *different* questions, so memorising one item isn't mastery.
 *  - Fast clear: right with "knew it" on the very first try clears the topic
 *    (Mastered), and three confident correct answers in a row clear it too.
 *    A guess or a miss breaks the run, so guessed topics come back a few more
 *    times, spaced further apart each time.
 *
 * Each box maps to a review interval. Mastery is recomputed from the full attempt
 * history every time, so correcting a question's answer key automatically
 * regrades past attempts without rewriting history.
 */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
const VARIETY_CAP_BOX = 3;
const MASTERED_BOX = 4;

const SEED_BOX: Record<SeedPrior, number> = { weak: 0, strong: 3 };

const CLEAR_STREAK = 3;

interface Working extends ConceptMastery {
  /** Confident correct answers in a row (a guess or miss resets it). */
  streak: number;
  clearedFirstTry: boolean;
  confidentCorrectQuestions: Set<string>;
  correctQuestions: Set<string>;
}

function blank(conceptId: string, seed: SeedPrior | undefined, seedDate: string): Working {
  return {
    conceptId,
    box: seed ? SEED_BOX[seed] : 0,
    masteryLabel: "New",
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    guessedCorrectAttempts: 0,
    confidentMisses: 0,
    distinctQuestionsCorrect: 0,
    seed,
    nextReviewAt: seed ? addDays(seedDate, REVIEW_INTERVAL_DAYS[SEED_BOX[seed]]) : undefined,
    reasons: [],
    streak: 0,
    clearedFirstTry: false,
    confidentCorrectQuestions: new Set(),
    correctQuestions: new Set(),
  };
}

export function labelFor(m: Pick<ConceptMastery, "box" | "totalAttempts" | "seed">): ConceptMastery["masteryLabel"] {
  if (m.totalAttempts === 0 && !m.seed) return "New";
  if (m.box === 0) return "Needs work";
  if (m.box <= 2) return "Learning";
  if (m.box === 3) return "Familiar";
  return "Mastered";
}

export function computeMastery(
  attempts: QuestionAttempt[],
  getQuestion: (id: string) => Question | undefined,
  conceptIds: string[],
  seedPriors: Record<string, SeedPrior>,
  seedDate: string,
): Map<string, ConceptMastery> {
  const state = new Map<string, Working>();
  for (const id of conceptIds) state.set(id, blank(id, seedPriors[id], seedDate));

  const ordered = [...attempts].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  for (const attempt of ordered) {
    const question = getQuestion(attempt.questionId);
    if (!question) continue; // retired question: keep history, ignore for mastery
    // Regrade against the current answer key (handles corrected questions).
    const correct = isAnswerCorrect(question, attempt.selectedAnswerIds);
    for (const conceptId of question.conceptIds) {
      const m = state.get(conceptId) ?? blank(conceptId, undefined, seedDate);
      state.set(conceptId, m);
      applyAttempt(m, question.id, correct, attempt);
    }
  }

  const result = new Map<string, ConceptMastery>();
  for (const [id, w] of state) {
    w.masteryLabel = labelFor(w);
    w.distinctQuestionsCorrect = w.correctQuestions.size;
    w.reasons = explain(w);
    const { confidentCorrectQuestions: _a, correctQuestions: _b, streak: _c, clearedFirstTry: _d, ...plain } = w;
    void _a;
    void _b;
    void _c;
    void _d;
    result.set(id, plain);
  }
  return result;
}

function applyAttempt(m: Working, questionId: string, correct: boolean, attempt: QuestionAttempt) {
  const firstTry = m.totalAttempts === 0;
  m.totalAttempts++;
  m.lastPracticedAt = attempt.completedAt;
  const conf = attempt.confidence;

  if (!correct) {
    m.incorrectAttempts++;
    m.box = 0;
    m.streak = 0;
    if (conf === "knew") {
      m.confidentMisses++;
      m.lastResult = "incorrect-confident";
    } else {
      m.lastResult = "incorrect";
    }
  } else {
    m.correctAttempts++;
    m.correctQuestions.add(questionId);
    if (conf === "educated" || conf === "random") {
      m.guessedCorrectAttempts++;
      m.streak = 0;
      m.lastResult = "correct-guess";
      m.box = conf === "random" ? Math.min(m.box, 1) : Math.max(m.box, 1);
    } else {
      m.confidentCorrectQuestions.add(questionId);
      m.lastResult = conf === "knew" ? "correct-knew" : "correct";
      const cap = m.confidentCorrectQuestions.size >= 2 ? REVIEW_INTERVAL_DAYS.length - 1 : VARIETY_CAP_BOX;
      m.box = Math.min(m.box + 1, cap);
      m.streak++;
      if (firstTry && conf === "knew") m.clearedFirstTry = true;
      if (m.clearedFirstTry || m.streak >= CLEAR_STREAK) m.box = Math.max(m.box, MASTERED_BOX);
    }
  }
  // Guesses always come back tomorrow, regardless of box.
  const days = m.lastResult === "correct-guess" ? 1 : REVIEW_INTERVAL_DAYS[m.box];
  m.nextReviewAt = addDays(attempt.completedAt, days);
}

function explain(m: Working): string[] {
  const r: string[] = [];
  if (m.totalAttempts === 0) {
    if (m.seed === "weak") r.push("Marked as a weak area in your imported study history. No answers here yet.");
    else if (m.seed === "strong") r.push("Marked as a stronger area in your imported study history. Still checked occasionally.");
    else r.push("Not practiced yet.");
    return r;
  }
  r.push(`${m.correctAttempts} of ${m.totalAttempts} answers correct.`);
  if (m.lastResult === "incorrect-confident") r.push("Last answer was wrong while you felt sure — likely a misconception.");
  else if (m.lastResult === "incorrect") r.push("Last answer was incorrect.");
  else if (m.lastResult === "correct-guess") r.push("Last answer was a correct guess, so it doesn't count as mastery yet.");
  if (m.guessedCorrectAttempts > 0) r.push(`${m.guessedCorrectAttempts} correct answer(s) were guesses.`);
  const variety = m.confidentCorrectQuestions.size;
  if (m.box >= MASTERED_BOX && m.clearedFirstTry && m.totalAttempts === 1) r.push("Right on the first try and you knew it, so this topic is cleared.");
  else if (m.box >= MASTERED_BOX && m.streak >= CLEAR_STREAK && variety < 2) r.push(`${m.streak} confident correct answers in a row cleared this topic.`);
  else if (m.box >= VARIETY_CAP_BOX && variety < 2)
    r.push("Answer a different scenario confidently to reach Mastered.");
  else if (m.box >= MASTERED_BOX) r.push(`Answered confidently across ${variety} different scenarios.`);
  return r;
}
