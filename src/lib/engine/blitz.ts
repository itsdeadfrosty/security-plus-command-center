import type { AppData, Question, QuestionAttempt, StudySession } from "@/lib/types";
import { isAnswerCorrect } from "./scoring";

export const BLITZ_SIZE = 10;
export const BLITZ_SECONDS = 8;
export const BLITZ_WINS_NEEDED = 3;
export const BLITZ_COOLDOWN_MS = 10 * 60 * 1000;
/** Ordering and matching need more than 8 seconds, so blitzes use quick-answer types only. */
const BLITZ_TYPES = new Set<Question["type"]>(["single", "multiple", "truefalse"]);

/** Questions whose latest answer was wrong or a guess, minus ones already drilled out in a blitz. */
export function blitzPool(data: AppData, questions: Question[]): Question[] {
  const latest = new Map<string, QuestionAttempt>();
  for (const a of data.attempts) {
    const prev = latest.get(a.questionId);
    if (!prev || a.completedAt > prev.completedAt) latest.set(a.questionId, a);
  }
  const cleared = new Set(data.blitz.cleared);
  return questions.filter((q) => {
    const a = latest.get(q.id);
    if (!a || cleared.has(q.id) || !BLITZ_TYPES.has(q.type)) return false;
    return !isAnswerCorrect(q, a.selectedAnswerIds) || a.confidence === "educated" || a.confidence === "random";
  });
}

export interface BlitzPick {
  ids: string[];
  /** Question id -> the look-alike concept it is paired against. */
  versus: Record<string, string>;
  /** Look-alike questions added from outside the pool (finishing them doesn't change the pool). */
  extra: string[];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks up to BLITZ_SIZE questions. Where a picked question's topic has a
 * common look-alike (SIEM vs SOAR, IDS vs IPS), a question on the look-alike
 * follows right after it, so the learner has to tell the two apart at speed.
 */
export function pickBlitz(
  pool: Question[],
  questions: Question[] = [],
  contrasts: Map<string, string[]> = new Map(),
  random = Math.random,
): BlitzPick {
  const byConcept = new Map<string, Question[]>();
  for (const q of questions) if (BLITZ_TYPES.has(q.type)) byConcept.set(q.conceptIds[0], [...(byConcept.get(q.conceptIds[0]) ?? []), q]);
  const ids: string[] = [];
  const versus: Record<string, string> = {};
  const extra: string[] = [];
  const pairedConcepts = new Set<string>();
  for (const q of shuffle(pool, random)) {
    if (ids.length >= BLITZ_SIZE) break;
    if (ids.includes(q.id)) continue;
    ids.push(q.id);
    const concept = q.conceptIds[0];
    if (ids.length >= BLITZ_SIZE || pairedConcepts.has(concept)) continue;
    for (const rival of shuffle(contrasts.get(concept) ?? [], random)) {
      const other = shuffle(byConcept.get(rival) ?? [], random).find((x) => !ids.includes(x.id));
      if (!other) continue;
      ids.push(other.id);
      versus[q.id] = rival;
      versus[other.id] = concept;
      if (!pool.some((p) => p.id === other.id)) extra.push(other.id);
      pairedConcepts.add(concept).add(rival);
      break;
    }
  }
  return { ids, versus, extra };
}

/** Milliseconds until the next blitz is allowed (0 = now). */
export function blitzWaitMs(data: AppData, now: Date): number {
  const last = data.blitz.lastStartedAt ? Date.parse(data.blitz.lastStartedAt) : 0;
  return Math.max(0, last + BLITZ_COOLDOWN_MS - now.getTime());
}

/**
 * Combines progress from two devices without losing anything: every answer from
 * either side is kept, the most recently used copy of each session wins, and a
 * brand-new device adopts the other side's profile.
 */
export function mergeAppData(local: AppData, remote: AppData): AppData {
  const attempts = new Map<string, QuestionAttempt>();
  for (const a of [...remote.attempts, ...local.attempts]) {
    const prev = attempts.get(a.id);
    attempts.set(a.id, prev && !a.confidence ? prev : a);
  }
  const sessions = new Map<string, StudySession>();
  for (const s of [...remote.sessions, ...local.sessions]) {
    const prev = sessions.get(s.id);
    if (!prev || s.lastActiveAt >= prev.lastActiveAt) sessions.set(s.id, s);
  }
  // Only one session can be in progress: keep the most recent.
  const merged = [...sessions.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const active = merged.filter((s) => s.status === "active").sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
  const stale = new Set(active.slice(1).map((s) => s.id));

  const fresh = local.attempts.length === 0 && remote.attempts.length > 0;
  const last = [local.blitz.lastStartedAt, remote.blitz.lastStartedAt].filter(Boolean).sort().pop();
  return {
    ...local,
    profile: fresh ? remote.profile : local.profile,
    seedPriors: fresh ? remote.seedPriors : local.seedPriors,
    attempts: [...attempts.values()].sort((a, b) => a.completedAt.localeCompare(b.completedAt)),
    sessions: merged.map((s) => (stale.has(s.id) ? { ...s, status: "abandoned" as const } : s)),
    blitz: { cleared: [...new Set([...local.blitz.cleared, ...remote.blitz.cleared])], lastStartedAt: last },
  };
}
