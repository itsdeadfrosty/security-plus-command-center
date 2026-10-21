import type { Confidence, Question, QuestionAttempt, StudyMode, StudySession } from "@/lib/types";
import { isAnswerCorrect } from "./scoring";
import { newId } from "./time";

export const MAX_RETESTS_PER_SESSION = 3;

export function createSession(mode: StudyMode, questionIds: string[], now: Date): StudySession {
  const iso = now.toISOString();
  return {
    id: newId("ses"),
    type: mode,
    startedAt: iso,
    lastActiveAt: iso,
    questionIds,
    currentQuestionIndex: 0,
    status: "active",
    answers: {},
    flagged: [],
    retestQuestionIds: [],
  };
}

/** Grades a submission, returning the updated session and the new attempt record. */
export function submitAnswer(
  session: StudySession,
  question: Question,
  selected: string[],
  durationMs: number,
  now: Date,
): { session: StudySession; attempt: QuestionAttempt } {
  if (session.answers[question.id]) throw new Error("Question already answered in this session");
  const isCorrect = isAnswerCorrect(question, selected);
  const attempt: QuestionAttempt = {
    id: newId("att"),
    questionId: question.id,
    questionVersion: question.version,
    sessionId: session.id,
    selectedAnswerIds: [...selected],
    isCorrect,
    durationMs: Math.max(0, Math.round(durationMs)),
    completedAt: now.toISOString(),
  };
  return {
    attempt,
    session: {
      ...session,
      lastActiveAt: attempt.completedAt,
      answers: { ...session.answers, [question.id]: { selectedAnswerIds: attempt.selectedAnswerIds, isCorrect, attemptId: attempt.id } },
    },
  };
}

export function setSessionConfidence(session: StudySession, questionId: string, confidence: Confidence): StudySession {
  const ans = session.answers[questionId];
  if (!ans) return session;
  return { ...session, answers: { ...session.answers, [questionId]: { ...ans, confidence } } };
}

export function appendRetest(session: StudySession, questionId: string): StudySession {
  if (session.retestQuestionIds.length >= MAX_RETESTS_PER_SESSION || session.questionIds.includes(questionId)) return session;
  return {
    ...session,
    questionIds: [...session.questionIds, questionId],
    retestQuestionIds: [...session.retestQuestionIds, questionId],
  };
}

export function goTo(session: StudySession, index: number, now: Date): StudySession {
  const clamped = Math.max(0, Math.min(index, session.questionIds.length - 1));
  return { ...session, currentQuestionIndex: clamped, lastActiveAt: now.toISOString() };
}

export function toggleFlag(session: StudySession, questionId: string): StudySession {
  const flagged = session.flagged.includes(questionId)
    ? session.flagged.filter((id) => id !== questionId)
    : [...session.flagged, questionId];
  return { ...session, flagged };
}

export function completeSession(session: StudySession, now: Date): StudySession {
  return { ...session, status: "completed", completedAt: now.toISOString(), lastActiveAt: now.toISOString() };
}

export function answeredCount(session: StudySession): number {
  return Object.keys(session.answers).length;
}

/** First unanswered index at or after the current one (for "Resume Question N"). */
export function resumeIndex(session: StudySession): number {
  const idx = session.questionIds.findIndex((id, i) => i >= session.currentQuestionIndex && !session.answers[id]);
  if (idx !== -1) return idx;
  const any = session.questionIds.findIndex((id) => !session.answers[id]);
  return any === -1 ? session.currentQuestionIndex : any;
}

/** Stable per-session option order so a resumed session looks identical. */
export function shuffledOptionIds(question: Question, seed: string): string[] {
  const ids = question.options.map((o) => o.id);
  if (question.type === "truefalse") return ids;
  let h = 2166136261;
  for (const ch of seed + question.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // Never hand out an ordering question already solved.
  if (question.type === "ordering" && ids.every((id, i) => id === question.correctAnswerIds[i])) ids.reverse();
  return ids;
}
