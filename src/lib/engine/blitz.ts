import type { AppData, Question, QuestionAttempt, StudySession } from "@/lib/types";
import { isAnswerCorrect } from "./scoring";

export const BLITZ_SIZE = 10;
export const BLITZ_SECONDS = 8;
export const BLITZ_WINS_NEEDED = 3;
export const BLITZ_COOLDOWN_MS = 30 * 60 * 1000;
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

export function pickBlitz(pool: Question[], random = Math.random): string[] {
  const ids = pool.map((q) => q.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, BLITZ_SIZE);
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
