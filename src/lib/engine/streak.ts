import type { QuestionAttempt, StreakRecord, StudySession } from "@/lib/types";
import { localDateKey, shiftDateKey } from "./time";

/** A day counts toward the streak with one completed session or 5 answered questions. */
export const QUALIFYING_QUESTIONS = 5;
/** Cap per-question time so an idle tab doesn't inflate study time. */
export const MAX_COUNTED_MS = 5 * 60 * 1000;

/**
 * Daily records are derived from real attempts and sessions — never stored or
 * edited directly — so streak history can't drift from what actually happened.
 * Each attempt counts on the local date it was answered (near-midnight answers
 * land on whichever side of midnight they were submitted).
 */
export function buildDailyRecords(attempts: QuestionAttempt[], sessions: StudySession[]): Map<string, StreakRecord> {
  const days = new Map<string, StreakRecord>();
  const get = (date: string) => {
    let r = days.get(date);
    if (!r) {
      r = { date, completedSessions: 0, questionsAnswered: 0, qualifyingActivity: false, totalStudyTimeMs: 0 };
      days.set(date, r);
    }
    return r;
  };
  for (const a of attempts) {
    const r = get(localDateKey(a.completedAt));
    r.questionsAnswered++;
    r.totalStudyTimeMs += Math.min(Math.max(0, a.durationMs), MAX_COUNTED_MS);
  }
  for (const s of sessions) {
    if (s.status === "completed" && s.completedAt) get(localDateKey(s.completedAt)).completedSessions++;
  }
  for (const r of days.values()) {
    r.qualifyingActivity = r.completedSessions > 0 || r.questionsAnswered >= QUALIFYING_QUESTIONS;
  }
  return days;
}

export interface StreakSummary {
  current: number;
  longest: number;
  studiedToday: boolean;
  sessionsToday: number;
  questionsToday: number;
}

export function summarizeStreak(days: Map<string, StreakRecord>, today: Date): StreakSummary {
  const todayKey = localDateKey(today);
  const qualifies = (k: string) => days.get(k)?.qualifyingActivity ?? false;

  // A streak is still alive if today isn't done yet but yesterday was.
  let cursor = qualifies(todayKey) ? todayKey : shiftDateKey(todayKey, -1);
  let current = 0;
  while (qualifies(cursor)) {
    current++;
    cursor = shiftDateKey(cursor, -1);
  }

  let longest = 0;
  const keys = [...days.keys()].filter(qualifies).sort();
  let run = 0;
  let prev: string | undefined;
  for (const k of keys) {
    run = prev && shiftDateKey(prev, 1) === k ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = k;
  }

  const t = days.get(todayKey);
  return {
    current,
    longest,
    studiedToday: qualifies(todayKey),
    sessionsToday: t?.completedSessions ?? 0,
    questionsToday: t?.questionsAnswered ?? 0,
  };
}
