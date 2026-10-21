import type { Confidence, Question, QuestionAttempt, StudySession } from "@/lib/types";
import { q } from "@/content/secplus/questions/helpers";

let n = 0;

/** Local-time ISO string, so date-boundary tests behave the same in every time zone. */
export function local(y: number, m: number, d: number, h = 12, min = 0): string {
  return new Date(y, m - 1, d, h, min).toISOString();
}

export function attempt(question: Question, opts: { correct: boolean; confidence?: Confidence; at: string; selected?: string[]; sessionId?: string }): QuestionAttempt {
  const wrong = question.options.find((o) => !question.correctAnswerIds.includes(o.id))!.id;
  const selected = opts.selected ?? (opts.correct ? question.correctAnswerIds : [wrong]);
  return {
    id: `att-${++n}`,
    questionId: question.id,
    questionVersion: question.version,
    sessionId: opts.sessionId ?? "s1",
    selectedAnswerIds: selected,
    isCorrect: opts.correct,
    confidence: opts.confidence,
    durationMs: 30_000,
    completedAt: opts.at,
  };
}

export function completedSession(at: string, id = `ses-${++n}`): StudySession {
  return {
    id,
    type: "quick",
    startedAt: at,
    completedAt: at,
    lastActiveAt: at,
    questionIds: [],
    currentQuestionIndex: 0,
    status: "completed",
    answers: {},
    flagged: [],
    retestQuestionIds: [],
  };
}

export function makeQuestion(id: string, conceptIds: string[], extra: Partial<Parameters<typeof q>[0]> = {}): Question {
  return q({
    id,
    conceptIds,
    difficulty: "exam",
    stem: `Stem ${id}`,
    options: ["Alpha", "Bravo", "Charlie", "Delta"],
    correct: ["a"],
    explanation: "Because.",
    why: { b: "No.", c: "No.", d: "No." },
    ...extra,
  });
}
