import type { Certification, ConceptMastery, Question, QuestionAttempt } from "@/lib/types";
import { isAnswerCorrect } from "./scoring";

/**
 * The circuit = every concept in the selected exam's objectives.
 * A concept is "cleared" once the learner has shown they know it: their latest
 * answer was correct without guessing (or they've reached Familiar+). Guesses
 * and misses keep it open. Spaced review continues separately for retention.
 */
export type CircuitStatus = "not-started" | "cleared" | "needs-work";

export function circuitStatus(m: ConceptMastery | undefined): CircuitStatus {
  if (!m || m.totalAttempts === 0) return "not-started";
  if (m.lastResult === "correct-knew" || m.lastResult === "correct" || m.box >= 3) return "cleared";
  return "needs-work";
}

export interface DomainCircuit {
  domainId: string;
  name: string;
  weight: number;
  total: number;
  cleared: number;
  needsWork: number;
  notStarted: number;
}

export interface Readiness {
  /** Exam-weighted share of concepts cleared, 0–1. */
  coverage: number;
  totalConcepts: number;
  clearedConcepts: number;
  byDomain: DomainCircuit[];
  /** Accuracy on the learner's most recent first-time questions (never seen before). */
  firstTry: { answered: number; accuracy: number | null };
  ready: boolean;
  nextStep: string;
}

export const READY_COVERAGE = 0.9;
export const READY_ACCURACY = 0.8;
export const FIRST_TRY_WINDOW = 40;
export const FIRST_TRY_MIN = 25;

export function computeReadiness(
  cert: Certification,
  conceptIds: string[],
  conceptDomain: (id: string) => string | undefined,
  mastery: Map<string, ConceptMastery>,
  attempts: QuestionAttempt[],
  examQuestions: Map<string, Question>,
): Readiness {
  const byDomain: DomainCircuit[] = cert.domains.map((d) => ({ domainId: d.id, name: d.name, weight: d.weight, total: 0, cleared: 0, needsWork: 0, notStarted: 0 }));
  const idx = new Map(byDomain.map((d) => [d.domainId, d]));
  for (const id of conceptIds) {
    const d = idx.get(conceptDomain(id) ?? "");
    if (!d) continue;
    d.total++;
    const s = circuitStatus(mastery.get(id));
    if (s === "cleared") d.cleared++;
    else if (s === "needs-work") d.needsWork++;
    else d.notStarted++;
  }
  const weightWithContent = byDomain.filter((d) => d.total > 0).reduce((s, d) => s + d.weight, 0) || 1;
  const coverage = byDomain.reduce((s, d) => (d.total ? s + (d.weight / weightWithContent) * (d.cleared / d.total) : s), 0);

  // First exposure to each question in this exam, most recent first.
  const seen = new Set<string>();
  const firsts: boolean[] = [];
  for (const a of [...attempts].sort((x, y) => x.completedAt.localeCompare(y.completedAt))) {
    const q = examQuestions.get(a.questionId);
    if (!q || seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    firsts.push(isAnswerCorrect(q, a.selectedAnswerIds));
  }
  const window = firsts.slice(-FIRST_TRY_WINDOW);
  const accuracy = window.length ? window.filter(Boolean).length / window.length : null;

  const clearedConcepts = byDomain.reduce((s, d) => s + d.cleared, 0);
  const totalConcepts = byDomain.reduce((s, d) => s + d.total, 0);
  const ready = coverage >= READY_COVERAGE && window.length >= FIRST_TRY_MIN && (accuracy ?? 0) >= READY_ACCURACY;

  let nextStep: string;
  if (ready) nextStep = "You've met the app's readiness target. Keep reviewing due concepts until exam day.";
  else if (coverage < READY_COVERAGE) {
    const weakest = [...byDomain].filter((d) => d.total).sort((a, b) => a.cleared / a.total - b.cleared / b.total)[0];
    nextStep = `Keep running the circuit. Most open ground: ${weakest?.name ?? "—"}.`;
  } else if (window.length < FIRST_TRY_MIN) nextStep = `Answer ${FIRST_TRY_MIN - window.length} more new questions to measure first-try accuracy.`;
  else nextStep = `First-try accuracy is below ${Math.round(READY_ACCURACY * 100)}%. Focus on your weak concepts, then try new questions.`;

  return { coverage, totalConcepts, clearedConcepts, byDomain, firstTry: { answered: window.length, accuracy }, ready, nextStep };
}
