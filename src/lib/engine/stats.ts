import type { ConceptMastery, Question, QuestionAttempt, StreakRecord } from "@/lib/types";
import { isAnswerCorrect } from "./scoring";
import { DAY_MS, localDateKey, shiftDateKey } from "./time";

export interface OverallStats {
  totalAnswered: number;
  uniqueAnswered: number;
  correct: number;
  accuracy: number | null; // null when nothing answered
  studyTimeMs: number;
}

/** Correctness uses the current answer key so corrected questions are graded fairly. */
export function gradedCorrect(a: QuestionAttempt, getQuestion: (id: string) => Question | undefined): boolean {
  const q = getQuestion(a.questionId);
  return q ? isAnswerCorrect(q, a.selectedAnswerIds) : a.isCorrect;
}

export function overallStats(
  attempts: QuestionAttempt[],
  getQuestion: (id: string) => Question | undefined,
  days: Map<string, StreakRecord>,
): OverallStats {
  const correct = attempts.filter((a) => gradedCorrect(a, getQuestion)).length;
  return {
    totalAnswered: attempts.length,
    uniqueAnswered: new Set(attempts.map((a) => a.questionId)).size,
    correct,
    accuracy: attempts.length ? correct / attempts.length : null,
    studyTimeMs: [...days.values()].reduce((s, d) => s + d.totalStudyTimeMs, 0),
  };
}

export interface Improvement {
  recent: number;
  previous: number;
  delta: number;
}

/** Last 7 days vs. the 7 before. Null unless both windows have at least 10 answers. */
export function recentImprovement(
  attempts: QuestionAttempt[],
  getQuestion: (id: string) => Question | undefined,
  now: Date,
): Improvement | null {
  const t = now.getTime();
  const recent = attempts.filter((a) => t - new Date(a.completedAt).getTime() < 7 * DAY_MS);
  const previous = attempts.filter((a) => {
    const age = t - new Date(a.completedAt).getTime();
    return age >= 7 * DAY_MS && age < 14 * DAY_MS;
  });
  if (recent.length < 10 || previous.length < 10) return null;
  const acc = (xs: QuestionAttempt[]) => xs.filter((a) => gradedCorrect(a, getQuestion)).length / xs.length;
  const r = acc(recent);
  const p = acc(previous);
  return { recent: r, previous: p, delta: r - p };
}

export interface DailyPoint {
  date: string;
  label: string;
  answered: number;
  accuracy: number | null;
}

export function dailySeries(
  attempts: QuestionAttempt[],
  getQuestion: (id: string) => Question | undefined,
  now: Date,
  days = 14,
): DailyPoint[] {
  const byDay = new Map<string, { n: number; c: number }>();
  for (const a of attempts) {
    const k = localDateKey(a.completedAt);
    const d = byDay.get(k) ?? { n: 0, c: 0 };
    d.n++;
    if (gradedCorrect(a, getQuestion)) d.c++;
    byDay.set(k, d);
  }
  const today = localDateKey(now);
  const out: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = shiftDateKey(today, -i);
    const d = byDay.get(k);
    const [, m, day] = k.split("-");
    out.push({ date: k, label: `${Number(m)}/${Number(day)}`, answered: d?.n ?? 0, accuracy: d ? Math.round((d.c / d.n) * 100) : null });
  }
  return out;
}

export interface DomainMastery {
  domainId: string;
  name: string;
  total: number;
  mastered: number;
  familiar: number;
  learning: number;
  needsWork: number;
  untouched: number;
  attempts: number;
  accuracy: number | null;
}

export function masteryByDomain(
  domains: { id: string; name: string }[],
  conceptDomain: (conceptId: string) => string | undefined,
  questionDomain: (q: Question) => string | undefined,
  mastery: Map<string, ConceptMastery>,
  attempts: QuestionAttempt[],
  getQuestion: (id: string) => Question | undefined,
): DomainMastery[] {
  return domains.map((d) => {
    const ms = [...mastery.values()].filter((m) => conceptDomain(m.conceptId) === d.id);
    const domAttempts = attempts.filter((a) => {
      const q = getQuestion(a.questionId);
      return q && questionDomain(q) === d.id;
    });
    const correct = domAttempts.filter((a) => gradedCorrect(a, getQuestion)).length;
    return {
      domainId: d.id,
      name: d.name,
      total: ms.length,
      mastered: ms.filter((m) => m.masteryLabel === "Mastered").length,
      familiar: ms.filter((m) => m.masteryLabel === "Familiar").length,
      learning: ms.filter((m) => m.masteryLabel === "Learning").length,
      needsWork: ms.filter((m) => m.masteryLabel === "Needs work").length,
      untouched: ms.filter((m) => m.masteryLabel === "New").length,
      attempts: domAttempts.length,
      accuracy: domAttempts.length ? correct / domAttempts.length : null,
    };
  });
}

/** Concepts that once had a miss and are now Familiar or Mastered. */
export function weaknessesResolved(mastery: Map<string, ConceptMastery>): number {
  return [...mastery.values()].filter((m) => m.incorrectAttempts > 0 && m.box >= 3).length;
}

export function formatDuration(ms: number): string {
  if (ms > 0 && ms < 60000) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min`;
}
