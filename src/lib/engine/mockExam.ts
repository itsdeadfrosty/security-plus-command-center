import type { Certification, ExamVersion, MockExam, Question } from "@/lib/types";
import { PBQ_TYPES } from "@/lib/types";
import { isAnswerCorrect, partialScore } from "./scoring";
import { newId } from "./time";

/**
 * Practice exams modeled on the public exam format: domain-weighted, a few
 * performance-based questions first, one minute per question, and no feedback
 * until the end. Results are kept apart from study answers, so a practice exam
 * never moves mastery or course completion.
 */
export const MOCK_LENGTHS = [30, 60, 90] as const;
/** A few PBQs open the real exam; scale that to the practice length. */
const PBQS_PER_30 = 1;

/** Rough scaled-score estimate: straight line from 0% → 100 to 100% → 900, so ~82% lands near the 750 pass mark. */
export function scaledEstimate(fraction: number): number {
  return Math.round(100 + 800 * Math.min(1, Math.max(0, fraction)));
}
export const PASS_SCALED = 750;

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Whole-number quotas proportional to the weights (largest remainder). */
export function quotas(weights: number[], total: number): number[] {
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; out.reduce((s, x) => s + x, 0) < total; k++) out[order[k % order.length][1]]++;
  return out;
}

/**
 * Pick the exam's questions. Spreads across topics (one question per topic
 * before any repeats) and saves questions used in recent practice exams for last.
 */
export function pickMockQuestions(
  cert: Certification,
  questions: Question[],
  domainOf: (q: Question) => string | undefined,
  length: number,
  recentlyUsed: Set<string> = new Set(),
  rand: () => number = Math.random,
): string[] {
  const pool = questions.filter((q) => q.type !== "truefalse"); // the real exam has no true/false
  const n = Math.min(length, pool.length);
  const domains = cert.domains.filter((d) => pool.some((q) => domainOf(q) === d.id));
  const quota = quotas(
    domains.map((d) => d.weight),
    n,
  );

  // Fresh questions first, then ones seen recently; within each, one per topic before repeats.
  const ranked = (qs: Question[]) => {
    const fresh = shuffle(
      qs.filter((q) => !recentlyUsed.has(q.id)),
      rand,
    );
    const old = shuffle(
      qs.filter((q) => recentlyUsed.has(q.id)),
      rand,
    );
    const seen = new Set<string>();
    const first: Question[] = [];
    const rest: Question[] = [];
    for (const q of [...fresh, ...old]) (seen.has(q.conceptIds[0]) ? rest : first).push(q), seen.add(q.conceptIds[0]);
    return [...first, ...rest];
  };

  const pbqWanted = Math.round((n / 30) * PBQS_PER_30);
  const pbqs: Question[] = [];
  const others: Question[] = [];
  domains.forEach((d, i) => {
    const list = ranked(pool.filter((q) => domainOf(q) === d.id));
    let left = quota[i];
    // Take this domain's share of the PBQs first.
    const pbqShare = Math.min(left, Math.round(pbqWanted * (quota[i] / (n || 1))));
    for (const q of list.filter((x) => PBQ_TYPES.includes(x.type)).slice(0, pbqShare)) {
      pbqs.push(q);
      left--;
    }
    for (const q of list) {
      if (left <= 0) break;
      if (pbqs.includes(q)) continue;
      others.push(q);
      left--;
    }
  });
  // Top up if a domain ran short.
  const chosen = new Set([...pbqs, ...others].map((q) => q.id));
  for (const q of ranked(pool)) {
    if (chosen.size >= n) break;
    if (!chosen.has(q.id)) {
      chosen.add(q.id);
      others.push(q);
    }
  }
  // Every hands-on question opens the exam, as on the real one.
  const all = [...pbqs, ...others];
  const isPbq = (q: Question) => PBQ_TYPES.includes(q.type);
  return [...shuffle(all.filter(isPbq), rand), ...shuffle(all.filter((q) => !isPbq(q)), rand)].map((q) => q.id);
}

export function createMockExam(version: ExamVersion, questionIds: string[], now: Date): MockExam {
  const iso = now.toISOString();
  return {
    id: newId("mock"),
    examVersion: version,
    startedAt: iso,
    deadline: new Date(now.getTime() + questionIds.length * 60_000).toISOString(),
    lastActiveAt: iso,
    status: "active",
    questionIds,
    answers: {},
    flagged: [],
    current: 0,
  };
}

export interface MockResult {
  /** Points earned (PBQs earn partial credit, as on the real exam). */
  points: number;
  total: number;
  fraction: number;
  scaled: number;
  passed: boolean;
  answered: number;
  byDomain: { domainId: string; name: string; points: number; total: number }[];
  /** Questions not fully right, in exam order. */
  missed: { question: Question; selected: string[] }[];
  /** Primary topics behind the misses, most-missed first. */
  missedConcepts: { conceptId: string; count: number }[];
}

export function gradeMockExam(
  mock: MockExam,
  cert: Certification,
  getQuestion: (id: string) => Question | undefined,
  domainOf: (q: Question) => string | undefined,
): MockResult {
  const byDomain = new Map(cert.domains.map((d) => [d.id, { domainId: d.id, name: d.name, points: 0, total: 0 }]));
  const missed: MockResult["missed"] = [];
  const conceptMisses = new Map<string, number>();
  let points = 0;
  let total = 0;
  let answered = 0;
  for (const id of mock.questionIds) {
    const q = getQuestion(id);
    if (!q) continue; // retired since the exam was taken
    const selected = mock.answers[id] ?? [];
    if (selected.length) answered++;
    let p = 0;
    if (isAnswerCorrect(q, selected)) p = 1;
    else if (PBQ_TYPES.includes(q.type) && selected.length) {
      const s = partialScore(q, selected);
      p = s.total ? s.right / s.total : 0;
    }
    points += p;
    total++;
    const d = byDomain.get(domainOf(q) ?? "");
    if (d) {
      d.points += p;
      d.total++;
    }
    if (p < 1) {
      missed.push({ question: q, selected });
      conceptMisses.set(q.conceptIds[0], (conceptMisses.get(q.conceptIds[0]) ?? 0) + 1);
    }
  }
  const fraction = total ? points / total : 0;
  const scaled = scaledEstimate(fraction);
  return {
    points,
    total,
    fraction,
    scaled,
    passed: scaled >= PASS_SCALED,
    answered,
    byDomain: [...byDomain.values()].filter((d) => d.total > 0),
    missed,
    missedConcepts: [...conceptMisses].map(([conceptId, count]) => ({ conceptId, count })).sort((a, b) => b.count - a.count),
  };
}

/** Milliseconds left on the clock (never negative). */
export function timeLeftMs(mock: MockExam, now: Date): number {
  return Math.max(0, Date.parse(mock.deadline) - now.getTime());
}
