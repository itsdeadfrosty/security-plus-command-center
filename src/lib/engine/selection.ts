import type { Certification, ConceptMastery, Question, QuestionAttempt, StudyMode } from "@/lib/types";
import { DAY_MS } from "./time";
import { circuitStatus } from "./circuit";

/**
 * Review priority for a concept, highest first:
 *   1. Incorrect answers (confident misses rank highest — misconceptions)
 *   2. Correct guesses
 *   3. Seeded weak areas not yet practiced
 *   4. Previously misunderstood concepts still in low boxes
 *   5. Concepts due for review (more overdue = higher)
 *   6. Untested objectives
 * Mastered, not-yet-due concepts score near zero so they stop being emphasized;
 * cleared ones are never due again.
 */
export function reviewPriority(m: ConceptMastery, now: Date): number {
  const due = m.nextReviewAt ? new Date(m.nextReviewAt).getTime() <= now.getTime() : false;
  const overdueDays = m.nextReviewAt ? Math.max(0, (now.getTime() - new Date(m.nextReviewAt).getTime()) / DAY_MS) : 0;
  if (m.lastResult === "incorrect-confident") return 100;
  if (m.lastResult === "incorrect") return 90;
  if (m.lastResult === "correct-guess") return due ? 80 : 45;
  if (m.totalAttempts === 0 && m.seed === "weak") return 70;
  if (m.incorrectAttempts > 0 && m.box <= 2) return due ? 60 : 35;
  if (due) return 50 + Math.min(10, Math.floor(overdueDays));
  if (m.totalAttempts === 0 && !m.seed) return 40;
  return Math.max(0, 10 - m.box * 2);
}

/** Threshold for appearing in the Review queue. */
export const REVIEW_THRESHOLD = 50;

export function isInReviewQueue(m: ConceptMastery, now: Date): boolean {
  return reviewPriority(m, now) >= REVIEW_THRESHOLD;
}

export const SESSION_SIZES: Record<StudyMode, number> = { circuit: 10, quick: 8, focused: 15, mixed: 12, review: 12 };

export interface SelectionContext {
  questions: Question[];
  attempts: QuestionAttempt[];
  mastery: Map<string, ConceptMastery>;
  /** conceptId -> ids of commonly-confused concepts */
  contrasts: Map<string, string[]>;
  certification: Certification;
  /** Domain of a question in the selected exam version. */
  domainOf: (q: Question) => string | undefined;
  now: Date;
  random?: () => number;
}

interface Scored {
  q: Question;
  score: number;
}

function questionHistory(attempts: QuestionAttempt[]) {
  const last = new Map<string, QuestionAttempt>();
  for (const a of attempts) {
    const prev = last.get(a.questionId);
    if (!prev || prev.completedAt < a.completedAt) last.set(a.questionId, a);
  }
  return last;
}

function scoreQuestions(ctx: SelectionContext, focusConcepts?: Set<string>, untestedBonus = 0): Scored[] {
  const rand = ctx.random ?? Math.random;
  const last = questionHistory(ctx.attempts);
  const weakPartners = new Set<string>();
  for (const [id, m] of ctx.mastery) {
    if (reviewPriority(m, ctx.now) >= 60) for (const p of ctx.contrasts.get(id) ?? []) weakPartners.add(p);
  }

  return ctx.questions.map((q) => {
    const priorities = q.conceptIds.map((c) => {
      const m = ctx.mastery.get(c);
      return m ? reviewPriority(m, ctx.now) : 40;
    });
    let score = Math.max(...priorities);

    // Differentiation: questions contrasting a weak concept with its look-alike.
    if (q.conceptIds.length > 1 && priorities.some((p) => p >= 60) && q.conceptIds.some((c) => weakPartners.has(c))) score += 15;
    else if (q.conceptIds.some((c) => weakPartners.has(c))) score += 5;

    // Prefer a new scenario over repeating an exact question.
    const prev = last.get(q.id);
    if (!prev) score += 15;
    else {
      const ageDays = (ctx.now.getTime() - new Date(prev.completedAt).getTime()) / DAY_MS;
      if (ageDays < 1) score -= 40;
      else if (prev.isCorrect && prev.confidence !== "educated" && prev.confidence !== "random") score -= 25;
    }

    // Stop emphasizing concepts that are mastered and not due.
    const allMastered = q.conceptIds.every((c) => {
      const m = ctx.mastery.get(c);
      return m && m.box >= 4 && (!m.nextReviewAt || new Date(m.nextReviewAt) > ctx.now);
    });
    if (allMastered) score -= 50;

    if (focusConcepts && !q.conceptIds.some((c) => focusConcepts.has(c))) score -= 1000;
    if (untestedBonus && q.conceptIds.some((c) => !ctx.mastery.get(c)?.totalAttempts)) score += untestedBonus;

    return { q, score: score + rand() * 8 };
  });
}

/** Pick in score order, limiting how often one primary concept appears. */
function pickTop(scored: Scored[], count: number, perConcept: number, exclude = new Set<string>()): Question[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const picked: Question[] = [];
  const perPrimary = new Map<string, number>();
  for (const { q, score } of sorted) {
    if (picked.length >= count) break;
    if (score <= -500 || exclude.has(q.id)) continue;
    const primary = q.conceptIds[0];
    const n = perPrimary.get(primary) ?? 0;
    if (n >= perConcept) continue;
    perPrimary.set(primary, n + 1);
    picked.push(q);
  }
  return picked;
}

/** Spread questions so the same primary concept isn't shown back-to-back where avoidable. */
export function interleave(questions: Question[]): Question[] {
  const out: Question[] = [];
  const pool = [...questions];
  while (pool.length) {
    const prevConcept = out.at(-1)?.conceptIds[0];
    const idx = pool.findIndex((q) => q.conceptIds[0] !== prevConcept);
    out.push(pool.splice(idx === -1 ? 0 : idx, 1)[0]);
  }
  return out;
}

/** Allocate `total` across domains by exam weight (largest-remainder method). */
export function allocateByWeight(domains: { id: string; weight: number }[], total: number): Map<string, number> {
  const raw = domains.map((d) => ({ id: d.id, exact: d.weight * total }));
  const result = new Map(raw.map((r) => [r.id, Math.floor(r.exact)]));
  let remaining = total - [...result.values()].reduce((a, b) => a + b, 0);
  const byRemainder = [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1));
  for (const r of byRemainder) {
    if (remaining <= 0) break;
    result.set(r.id, (result.get(r.id) ?? 0) + 1);
    remaining--;
  }
  return result;
}

export function selectQuestions(mode: StudyMode, ctx: SelectionContext, size = SESSION_SIZES[mode]): Question[] {
  switch (mode) {
    case "circuit": {
      // Work through every concept not yet cleared; new ground gets a bonus so coverage keeps moving.
      const open = new Set([...ctx.mastery.values()].filter((m) => circuitStatus(m) !== "cleared").map((m) => m.conceptId));
      if (open.size === 0) return interleave(pickTop(scoreQuestions(ctx), size, 2));
      return interleave(pickTop(scoreQuestions(ctx, open, 20), size, 1));
    }
    case "quick":
      return interleave(pickTop(scoreQuestions(ctx), size, 2));
    case "focused": {
      const weak = new Set([...ctx.mastery.values()].filter((m) => reviewPriority(m, ctx.now) >= 60).map((m) => m.conceptId));
      // Include look-alike concepts so confusions get differentiated practice.
      for (const id of [...weak]) for (const p of ctx.contrasts.get(id) ?? []) weak.add(p);
      const focus = weak.size ? weak : undefined;
      return interleave(pickTop(scoreQuestions(ctx, focus), size, 3));
    }
    case "review": {
      const due = new Set([...ctx.mastery.values()].filter((m) => isInReviewQueue(m, ctx.now)).map((m) => m.conceptId));
      if (due.size === 0) return [];
      return interleave(pickTop(scoreQuestions(ctx, due), size, 2));
    }
    case "mixed": {
      const alloc = allocateByWeight(ctx.certification.domains, size);
      const scored = scoreQuestions(ctx);
      const picked: Question[] = [];
      for (const [domainId, n] of alloc) {
        picked.push(...pickTop(scored.filter((s) => ctx.domainOf(s.q) === domainId), n, 1));
      }
      // Top up if a domain had too few questions.
      if (picked.length < size) {
        const have = new Set(picked.map((q) => q.id));
        picked.push(...pickTop(scored, size - picked.length, 2, have));
      }
      return interleave(picked);
    }
  }
}

/**
 * After a miss in practice, find a *different* question on the same concept to
 * retest later in the session. Returns undefined if none is available.
 */
export function pickRetestQuestion(
  missed: Question,
  sessionQuestionIds: string[],
  questionsByConcept: Map<string, Question[]>,
  attempts: QuestionAttempt[],
  now: Date,
): Question | undefined {
  const inSession = new Set(sessionQuestionIds);
  const recent = new Set(
    attempts.filter((a) => now.getTime() - new Date(a.completedAt).getTime() < DAY_MS).map((a) => a.questionId),
  );
  for (const conceptId of missed.conceptIds) {
    const candidates = (questionsByConcept.get(conceptId) ?? []).filter((q) => !inSession.has(q.id));
    const fresh = candidates.find((q) => !recent.has(q.id));
    if (fresh) return fresh;
  }
  return undefined;
}

export interface Recommendation {
  mode: StudyMode;
  reason: string;
}

export function recommendMode(mastery: Map<string, ConceptMastery>, totalAttempts: number, now: Date): Recommendation {
  const list = [...mastery.values()];
  const due = list.filter((m) => isInReviewQueue(m, now) && m.totalAttempts > 0).length;
  const weak = list.filter((m) => reviewPriority(m, now) >= 60 && m.totalAttempts > 0).length;
  const open = list.filter((m) => circuitStatus(m) !== "cleared").length;
  if (due >= 5) return { mode: "review", reason: `${due} concepts you've practiced are due for review.` };
  if (weak >= 5) return { mode: "focused", reason: `${weak} concepts you've missed need attention. Focused practice targets them.` };
  if (open > 0) return { mode: "circuit", reason: `${open} concepts on the circuit still to clear. Each one you prove you know drops out.` };
  if (weak >= 3) return { mode: "focused", reason: `${weak} concepts need attention. Focused practice targets them.` };
  return { mode: "mixed", reason: "Your weak spots are under control. Mixed practice keeps every domain fresh." };
}
