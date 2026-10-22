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
 *  - Clearing: three "knew it" correct answers in a row clear the topic
 *    (Mastered), so things the learner already knows leave the pool fast. Once
 *    the learner has stumbled on it (a miss, a guess, an unrated answer, or a
 *    skip), it takes five in a row, spaced further apart each time. A cleared
 *    topic is never scheduled again, so known material stops taking time.
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
const CLEAR_STREAK_AFTER_STUMBLE = 5;

interface Working extends ConceptMastery {
  /** "Knew it" correct answers in a row (anything else resets it). */
  streak: number;
  /** Ever missed, guessed, skipped, or answered without "knew it". */
  stumbled: boolean;
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
    stumbled: false,
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
  /** Concepts of questions the learner skipped or flagged. */
  skipped: Set<string> = new Set(),
): Map<string, ConceptMastery> {
  const state = new Map<string, Working>();
  for (const id of conceptIds) state.set(id, blank(id, seedPriors[id], seedDate));
  for (const id of skipped) {
    const m = state.get(id);
    if (m) m.stumbled = true;
  }

  const ordered = [...attempts].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  for (const attempt of ordered) {
    const question = getQuestion(attempt.questionId);
    if (!question) continue; // retired question: keep history, ignore for mastery
    // Regrade against the current answer key (handles corrected questions).
    const correct = isAnswerCorrect(question, attempt.selectedAnswerIds);
    for (const conceptId of question.conceptIds) {
      const m = state.get(conceptId) ?? { ...blank(conceptId, undefined, seedDate), stumbled: skipped.has(conceptId) };
      state.set(conceptId, m);
      applyAttempt(m, question.id, correct, attempt);
    }
  }

  const result = new Map<string, ConceptMastery>();
  for (const [id, w] of state) {
    w.masteryLabel = labelFor(w);
    w.distinctQuestionsCorrect = w.correctQuestions.size;
    w.reasons = explain(w);
    const { confidentCorrectQuestions: _a, correctQuestions: _b, stumbled: _c, ...plain } = w;
    void _a;
    void _b;
    void _c;
    result.set(id, { ...plain, clearGoal: w.stumbled ? CLEAR_STREAK_AFTER_STUMBLE : CLEAR_STREAK });
  }
  return result;
}

function applyAttempt(m: Working, questionId: string, correct: boolean, attempt: QuestionAttempt) {
  m.totalAttempts++;
  m.lastPracticedAt = attempt.completedAt;
  const conf = attempt.confidence;

  if (!correct) {
    m.incorrectAttempts++;
    m.box = 0;
    m.streak = 0;
    m.stumbled = true;
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
      m.stumbled = true;
      m.lastResult = "correct-guess";
      m.box = conf === "random" ? Math.min(m.box, 1) : Math.max(m.box, 1);
    } else {
      m.confidentCorrectQuestions.add(questionId);
      m.lastResult = conf === "knew" ? "correct-knew" : "correct";
      const cap = m.confidentCorrectQuestions.size >= 2 ? REVIEW_INTERVAL_DAYS.length - 1 : VARIETY_CAP_BOX;
      m.box = Math.min(m.box + 1, cap);
      if (conf === "knew") m.streak++;
      else {
        m.streak = 0;
        m.stumbled = true;
      }
      if (m.streak >= (m.stumbled ? CLEAR_STREAK_AFTER_STUMBLE : CLEAR_STREAK)) m.box = Math.max(m.box, MASTERED_BOX);
    }
  }
  // A cleared topic is done: no more reviews, so study time goes to what's left.
  if (m.streak >= (m.stumbled ? CLEAR_STREAK_AFTER_STUMBLE : CLEAR_STREAK)) {
    m.nextReviewAt = undefined;
    return;
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
  const need = m.stumbled ? CLEAR_STREAK_AFTER_STUMBLE : CLEAR_STREAK;
  if (m.box >= MASTERED_BOX && m.streak >= need) r.push(`You knew it ${m.streak} times in a row, so this topic is cleared.`);
  else if (m.streak > 0) r.push(`Knew it ${m.streak} of ${need} times in a row needed to clear this topic.`);
  else if (m.box >= VARIETY_CAP_BOX && variety < 2)
    r.push("Answer a different scenario confidently to reach Mastered.");
  else if (m.box >= MASTERED_BOX) r.push(`Answered confidently across ${variety} different scenarios.`);
  return r;
}
