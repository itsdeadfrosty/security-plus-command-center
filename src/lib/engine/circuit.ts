import type { Certification, ConceptMastery, Question, QuestionAttempt } from "@/lib/types";
import { isAnswerCorrect } from "./scoring";

/**
 * The circuit = every concept in the selected exam's objectives.
 * A concept is "cleared" once it meets its clear goal (three "knew it" answers
 * in a row, five after a stumble, one when placed by neighbouring topics).
 *
 * Readiness is an estimated chance of passing the real 90-question exam:
 *  - each concept gets a chance the learner knows it (cleared ≈ 95%; practised
 *    concepts by their box and streak; untouched ones borrow from the rest of
 *    their objective, shrunk toward the learner's first-try accuracy),
 *  - those combine, weighted by exam domain, into an expected score (with a
 *    little credit for eliminating options on unknown questions),
 *  - and the pass chance is how likely that score clears the assumed passing
 *    mark, allowing for a 90-question sample and for the estimate being rough.
 * "Ready" means a 90%+ estimated pass chance. "Questions to go" plans the
 * highest-value concepts first until that target would be met.
 */
export type CircuitStatus = "not-started" | "cleared" | "needs-work";

export function isCleared(m: ConceptMastery | undefined): boolean {
  return !!m && !!m.clearGoal && (m.streak ?? 0) >= m.clearGoal;
}

export function circuitStatus(m: ConceptMastery | undefined): CircuitStatus {
  if (!m || m.totalAttempts === 0) return "not-started";
  return isCleared(m) ? "cleared" : "needs-work";
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
  /** Estimated chance of passing the real exam, 0–1. */
  passChance: number;
  /** Estimated share of exam questions answered correctly, 0–1. */
  expectedScore: number;
  /** Exam-weighted share of concepts cleared, 0–1. */
  coverage: number;
  totalConcepts: number;
  clearedConcepts: number;
  /** Questions answered so far on this exam's material. */
  answered: number;
  /** Rough number of questions still needed to reach the readiness target. */
  questionsToGo: number;
  byDomain: DomainCircuit[];
  /** Accuracy on the learner's most recent first-time questions (never seen before). */
  firstTry: { answered: number; accuracy: number | null };
  ready: boolean;
  nextStep: string;
}

/** Estimated pass chance that counts as ready. */
export const READY_PASS_CHANCE = 0.9;
/** CompTIA doesn't publish a raw cut score (750 on a 100–900 scale); assume about 82% correct. */
export const ASSUMED_PASS_MARK = 0.82;
const EXAM_QUESTIONS = 90;
/** Extra uncertainty because practice questions aren't the real exam. */
const MODEL_SD = 0.03;
const CLEARED_KNOW = 0.95;
/** Unknown questions still get some right by elimination. */
const GUESS_CREDIT = 0.2;
export const FIRST_TRY_WINDOW = 40;

function knowChance(m: ConceptMastery | undefined, prior: number): number {
  if (isCleared(m)) return CLEARED_KNOW;
  if (!m || m.totalAttempts === 0) {
    if (m?.seed === "weak") return Math.min(prior, 0.35);
    if (m?.seed === "strong") return Math.max(prior, 0.7);
    return prior;
  }
  if (m.lastResult === "incorrect" || m.lastResult === "incorrect-confident") return 0.3;
  return Math.min(0.85, 0.45 + 0.08 * m.box + 0.1 * (m.streak ?? 0));
}

function normalCdf(z: number): number {
  // Abramowitz–Stegun approximation of erf.
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export function passChanceFor(expectedScore: number): number {
  const sd = Math.sqrt((expectedScore * (1 - expectedScore)) / EXAM_QUESTIONS + MODEL_SD ** 2);
  return normalCdf((expectedScore - ASSUMED_PASS_MARK) / sd);
}

const correctChance = (know: number) => know + (1 - know) * GUESS_CREDIT;

export function computeReadiness(
  cert: Certification,
  conceptIds: string[],
  conceptDomain: (id: string) => string | undefined,
  mastery: Map<string, ConceptMastery>,
  attempts: QuestionAttempt[],
  examQuestions: Map<string, Question>,
  groupOf: (id: string) => string | undefined = () => undefined,
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

  // First exposure to each question in this exam, oldest first.
  const seen = new Set<string>();
  const firsts: boolean[] = [];
  let answered = 0;
  for (const a of [...attempts].sort((x, y) => x.completedAt.localeCompare(y.completedAt))) {
    const q = examQuestions.get(a.questionId);
    if (!q) continue;
    answered++;
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    firsts.push(isAnswerCorrect(q, a.selectedAnswerIds));
  }
  const recent = firsts.slice(-FIRST_TRY_WINDOW);
  const accuracy = recent.length ? recent.filter(Boolean).length / recent.length : null;
  // Before much data, assume a coin flip; afterwards lean on real first-try accuracy.
  const basePrior = accuracy === null ? 0.5 : (accuracy * recent.length + 0.5 * 10) / (recent.length + 10);

  // Untouched concepts borrow from practised neighbours in the same objective.
  const groupStats = new Map<string, { sum: number; n: number }>();
  for (const id of conceptIds) {
    const m = mastery.get(id);
    const g = groupOf(id);
    if (!g || !m || m.totalAttempts === 0) continue;
    const s = groupStats.get(g) ?? { sum: 0, n: 0 };
    s.sum += knowChance(m, basePrior);
    s.n++;
    groupStats.set(g, s);
  }
  const priorFor = (id: string) => {
    const s = groupStats.get(groupOf(id) ?? "");
    return s ? (s.sum + basePrior * 2) / (s.n + 2) : basePrior;
  };

  // Each concept's share of the exam: its domain's weight split across the domain's concepts.
  const share = (id: string) => {
    const d = idx.get(conceptDomain(id) ?? "");
    return d && d.total ? d.weight / weightWithContent / d.total : 0;
  };
  const items = conceptIds.map((id) => {
    const m = mastery.get(id);
    const know = knowChance(m, priorFor(id));
    let cost = 0;
    if (!isCleared(m)) {
      if (!m || m.totalAttempts === 0) cost = 3 + Math.round((1 - know) * 4);
      else cost = Math.max(1, (m.clearGoal ?? 3) - (m.streak ?? 0)) + (know < 0.5 ? 2 : 0);
    }
    return { know, cost, share: share(id) };
  });
  const expectedScore = items.reduce((s, x) => s + x.share * correctChance(x.know), 0);
  const passChance = passChanceFor(expectedScore);

  // Plan: clear the best value-per-question concepts until the target is met.
  let questionsToGo = 0;
  let projected = expectedScore;
  const value = (x: (typeof items)[number]) => (x.share * (CLEARED_KNOW - x.know)) / x.cost;
  for (const x of items.filter((i) => i.cost > 0).sort((a, b) => value(b) - value(a))) {
    if (passChanceFor(projected) >= READY_PASS_CHANCE) break;
    projected += x.share * (correctChance(CLEARED_KNOW) - correctChance(x.know));
    questionsToGo += x.cost;
  }

  const clearedConcepts = byDomain.reduce((s, d) => s + d.cleared, 0);
  const totalConcepts = byDomain.reduce((s, d) => s + d.total, 0);
  const ready = passChance >= READY_PASS_CHANCE;

  let nextStep: string;
  if (ready) nextStep = "You've hit the 90% target. You're ready to book the exam.";
  else if (answered < 20) nextStep = "Run a few circuits so the app can place you. The estimate sharpens fast.";
  else {
    const weakest = byDomain.filter((d) => d.total).sort((a, b) => a.cleared / a.total - b.cleared / b.total)[0];
    nextStep = `About ${questionsToGo} questions to go. Most open ground: ${weakest?.name ?? "—"}.`;
  }

  return {
    passChance,
    expectedScore,
    coverage,
    totalConcepts,
    clearedConcepts,
    answered,
    questionsToGo,
    byDomain,
    firstTry: { answered: recent.length, accuracy },
    ready,
    nextStep,
  };
}
