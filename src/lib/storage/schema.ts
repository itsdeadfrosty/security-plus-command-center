import type { AppData, Confidence, ExamVersion, QuestionAttempt, SeedPrior, StudySession, UserProfile } from "@/lib/types";
import { EXAM_VERSIONS } from "@/lib/types";
import { newId } from "@/lib/engine/time";

/**
 * Schema history
 *  v1 — early development format: sessions had no `retestQuestionIds` or
 *       `lastActiveAt`; confidence was "sure" | "guess".
 *  v2 — added session retests and lastActiveAt.
 *  v3 — profile.examVersion (SY0-701 / SY0-801) and the "circuit" mode.
 *  v4 — current: blitz state (drilled-out questions, last blitz time).
 * Add a migration for every bump; never edit an old one.
 */
export const SCHEMA_VERSION = 4;
export const EXPORT_APP_ID = "security-plus-command-center";

type Json = Record<string, unknown>;
type Migration = (data: Json) => Json;

const migrations: Record<number, Migration> = {
  // v1 -> v2
  1: (data) => {
    const sessions = Array.isArray(data.sessions) ? (data.sessions as Json[]) : [];
    const attempts = Array.isArray(data.attempts) ? (data.attempts as Json[]) : [];
    const mapConf = (c: unknown): Confidence | undefined => (c === "sure" ? "knew" : c === "guess" ? "educated" : (c as Confidence | undefined));
    return {
      ...data,
      schemaVersion: 2,
      sessions: sessions.map((s) => ({
        ...s,
        retestQuestionIds: s.retestQuestionIds ?? [],
        lastActiveAt: s.lastActiveAt ?? s.completedAt ?? s.startedAt,
        flagged: s.flagged ?? [],
      })),
      attempts: attempts.map((a) => ({ ...a, confidence: mapConf(a.confidence) })),
    };
  },
  // v2 -> v3: existing learners were studying SY0-701.
  2: (data) => ({ ...data, schemaVersion: 3, profile: { ...(data.profile as Json), examVersion: "SY0-701" } }),
  3: (data) => ({ ...data, schemaVersion: 4, blitz: { cleared: [] } }),
};

export function migrate(input: Json): Json {
  let data = input;
  let v = typeof data.schemaVersion === "number" ? data.schemaVersion : 1;
  if (v > SCHEMA_VERSION) throw new DataError(`This file was made by a newer version of the app (schema ${v}).`);
  while (v < SCHEMA_VERSION) {
    const step = migrations[v];
    if (!step) throw new DataError(`No migration from schema ${v}.`);
    data = step(data);
    v = data.schemaVersion as number;
  }
  return data;
}

export class DataError extends Error {}

const CONFIDENCES = new Set(["knew", "educated", "random"]);
const MODES = new Set(["circuit", "quick", "focused", "mixed", "review"]);
const STATUSES = new Set(["active", "completed", "abandoned"]);

const isStr = (x: unknown): x is string => typeof x === "string";
const isIso = (x: unknown) => isStr(x) && !Number.isNaN(Date.parse(x));
const isStrArr = (x: unknown): x is string[] => Array.isArray(x) && x.every(isStr);

function fail(msg: string): never {
  throw new DataError(msg);
}

/**
 * Structural validation of untrusted data (imports, possibly-corrupt storage).
 * Rebuilds objects field by field so unexpected properties are dropped.
 */
export function validateAppData(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") fail("Data is not an object.");
  const data = migrate(raw as Json);

  const p = data.profile as Json | undefined;
  if (!p || !isStr(p.id) || !isStr(p.displayName)) fail("Missing or invalid profile.");
  const prefs = (p.preferences ?? {}) as Json;
  const goal = (p.studyGoal ?? {}) as Json;
  const profile: UserProfile = {
    id: p.id,
    displayName: p.displayName.slice(0, 60),
    selectedCertification: isStr(p.selectedCertification) ? p.selectedCertification : "comptia-secplus",
    examVersion: EXAM_VERSIONS.includes(p.examVersion as ExamVersion) ? (p.examVersion as ExamVersion) : "SY0-701",
    studyGoal: { dailyQuestions: clampInt(goal.dailyQuestions, 1, 200, 15) },
    preferences: {
      theme: prefs.theme === "light" ? "light" : "dark",
      askConfidence: prefs.askConfidence !== false,
      autoExplain: prefs.autoExplain === true,
      reducedMotion: prefs.reducedMotion === "reduce" ? "reduce" : "system",
    },
    createdAt: isIso(p.createdAt) ? (p.createdAt as string) : new Date().toISOString(),
  };

  if (!Array.isArray(data.attempts)) fail("Attempts must be a list.");
  const attempts: QuestionAttempt[] = (data.attempts as Json[]).map((a, i) => {
    if (!a || !isStr(a.id) || !isStr(a.questionId) || !isStr(a.sessionId) || !isStrArr(a.selectedAnswerIds) || !isIso(a.completedAt))
      fail(`Attempt ${i} is invalid.`);
    if (a.confidence !== undefined && !CONFIDENCES.has(a.confidence as string)) fail(`Attempt ${i} has invalid confidence.`);
    return {
      id: a.id,
      questionId: a.questionId,
      questionVersion: clampInt(a.questionVersion, 1, 10000, 1),
      sessionId: a.sessionId,
      selectedAnswerIds: a.selectedAnswerIds,
      isCorrect: a.isCorrect === true,
      confidence: a.confidence as Confidence | undefined,
      durationMs: clampInt(a.durationMs, 0, 24 * 3600 * 1000, 0),
      completedAt: a.completedAt as string,
    };
  });

  if (!Array.isArray(data.sessions)) fail("Sessions must be a list.");
  const sessions: StudySession[] = (data.sessions as Json[]).map((s, i) => {
    if (!s || !isStr(s.id) || !MODES.has(s.type as string) || !STATUSES.has(s.status as string) || !isIso(s.startedAt) || !isStrArr(s.questionIds))
      fail(`Session ${i} is invalid.`);
    const answersIn = (s.answers ?? {}) as Record<string, Json>;
    const answers: StudySession["answers"] = {};
    for (const [qid, ans] of Object.entries(answersIn)) {
      if (!ans || !isStrArr(ans.selectedAnswerIds) || !isStr(ans.attemptId)) fail(`Session ${i} has an invalid answer.`);
      answers[qid] = {
        selectedAnswerIds: ans.selectedAnswerIds,
        isCorrect: ans.isCorrect === true,
        attemptId: ans.attemptId,
        confidence: CONFIDENCES.has(ans.confidence as string) ? (ans.confidence as Confidence) : undefined,
      };
    }
    const questionIds = s.questionIds as string[];
    return {
      id: s.id,
      type: s.type as StudySession["type"],
      startedAt: s.startedAt as string,
      completedAt: isIso(s.completedAt) ? (s.completedAt as string) : undefined,
      lastActiveAt: isIso(s.lastActiveAt) ? (s.lastActiveAt as string) : (s.startedAt as string),
      questionIds,
      currentQuestionIndex: clampInt(s.currentQuestionIndex, 0, Math.max(0, questionIds.length - 1), 0),
      status: s.status as StudySession["status"],
      answers,
      flagged: isStrArr(s.flagged) ? s.flagged : [],
      retestQuestionIds: isStrArr(s.retestQuestionIds) ? s.retestQuestionIds : [],
    };
  });

  const seedPriors: Record<string, SeedPrior> = {};
  const seedIn = (data.seedPriors ?? {}) as Json;
  for (const [k, v] of Object.entries(seedIn)) if (v === "weak" || v === "strong") seedPriors[k] = v;

  const b = (data.blitz ?? {}) as Json;
  const blitz = { cleared: isStrArr(b.cleared) ? b.cleared : [], lastStartedAt: isIso(b.lastStartedAt) ? (b.lastStartedAt as string) : undefined };

  return { schemaVersion: SCHEMA_VERSION, profile, attempts, sessions, seedPriors, blitz };
}

function clampInt(x: unknown, min: number, max: number, fallback: number): number {
  if (typeof x !== "number" || !Number.isFinite(x)) return fallback;
  return Math.min(max, Math.max(min, Math.round(x)));
}

export function createInitialData(seedPriors: Record<string, SeedPrior>, now: Date): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      id: newId("usr"),
      displayName: "Learner",
      selectedCertification: "comptia-secplus",
      examVersion: "SY0-701",
      studyGoal: { dailyQuestions: 15 },
      preferences: { theme: "dark", askConfidence: true, autoExplain: false, reducedMotion: "system" },
      createdAt: now.toISOString(),
    },
    attempts: [],
    sessions: [],
    seedPriors: { ...seedPriors },
    blitz: { cleared: [] },
  };
}

export function serializeExport(data: AppData, now: Date): string {
  return JSON.stringify({ app: EXPORT_APP_ID, exportedAt: now.toISOString(), data }, null, 2);
}

/** Parses an exported file. Throws DataError with a user-readable message on any problem. */
export function parseImport(text: string): AppData {
  if (text.length > 20 * 1024 * 1024) throw new DataError("File is too large to be a progress export.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DataError("File is not valid JSON.");
  }
  const wrapper = parsed as Json;
  if (!wrapper || wrapper.app !== EXPORT_APP_ID || typeof wrapper.data !== "object")
    throw new DataError("This file isn't a Security+ Command Center progress export.");
  return validateAppData(wrapper.data);
}
