import { describe, expect, it } from "vitest";
import { buildDailyRecords, summarizeStreak } from "@/lib/engine/streak";
import { createIndexedDbAdapter, createMemoryAdapter, type StorageAdapter } from "@/lib/storage/adapters";
import { DATA_KEY, loadAppData, saveAppData } from "@/lib/storage/repository";
import { createInitialData, DataError, parseImport, SCHEMA_VERSION, serializeExport, validateAppData } from "@/lib/storage/schema";
import { createSession, submitAnswer } from "@/lib/engine/session";
import { allQuestions, seedPriors } from "@/content/catalog";
import { attempt, completedSession, local } from "./helpers";

const q = allQuestions[0];

describe("daily streaks", () => {
  it("does not inflate the streak when two sessions are completed on one day", () => {
    const days = buildDailyRecords([], [completedSession(local(2026, 10, 20, 9)), completedSession(local(2026, 10, 20, 18))]);
    const s = summarizeStreak(days, new Date(local(2026, 10, 20, 20)));
    expect(s.current).toBe(1);
    expect(s.sessionsToday).toBe(2);
  });

  it("counts consecutive days and keeps the streak alive until today ends", () => {
    const days = buildDailyRecords([], [18, 19].map((d) => completedSession(local(2026, 10, d))));
    expect(summarizeStreak(days, new Date(local(2026, 10, 20, 8))).current).toBe(2);
    expect(summarizeStreak(days, new Date(local(2026, 10, 20, 8))).studiedToday).toBe(false);
    // Missing a day resets the current streak but keeps the record.
    const later = summarizeStreak(days, new Date(local(2026, 10, 22)));
    expect(later.current).toBe(0);
    expect(later.longest).toBe(2);
  });

  it("attributes study near midnight to the local day it happened", () => {
    const atts = [
      ...Array.from({ length: 5 }, () => attempt(q, { correct: true, at: local(2026, 10, 19, 23, 58) })),
      ...Array.from({ length: 5 }, () => attempt(q, { correct: true, at: local(2026, 10, 20, 0, 2) })),
    ];
    const days = buildDailyRecords(atts, []);
    expect(days.get("2026-10-19")?.questionsAnswered).toBe(5);
    expect(days.get("2026-10-20")?.questionsAnswered).toBe(5);
    expect(summarizeStreak(days, new Date(local(2026, 10, 20, 0, 5))).current).toBe(2);
  });

  it("needs real activity: fewer than 5 answers without a finished session doesn't count", () => {
    const days = buildDailyRecords([attempt(q, { correct: true, at: local(2026, 10, 20) })], []);
    expect(days.get("2026-10-20")?.qualifyingActivity).toBe(false);
  });
});

describe("persistence", () => {
  const now = new Date(local(2026, 10, 20));

  it("survives closing the browser mid-session (IndexedDB round trip)", async () => {
    const data = createInitialData(seedPriors, now);
    let session = createSession("quick", allQuestions.slice(0, 5).map((x) => x.id), now);
    const r1 = submitAnswer(session, allQuestions[0], allQuestions[0].correctAnswerIds, 5000, now);
    session = { ...r1.session, currentQuestionIndex: 1 };
    data.sessions.push(session);
    data.attempts.push(r1.attempt);

    const adapter = await createIndexedDbAdapter();
    await saveAppData(adapter, data);
    const reopened = await createIndexedDbAdapter();
    const { data: loaded, warning } = await loadAppData(reopened, seedPriors, now);
    expect(warning).toBeUndefined();
    const restored = loaded.sessions.find((s) => s.status === "active")!;
    expect(restored.id).toBe(session.id);
    expect(restored.currentQuestionIndex).toBe(1);
    expect(Object.keys(restored.answers)).toHaveLength(1);
    expect(loaded.attempts).toHaveLength(1);
  });

  it("recovers from corrupted storage and keeps a backup of the damaged data", async () => {
    const adapter = createMemoryAdapter({ [DATA_KEY]: "{not json" });
    const result = await loadAppData(adapter, seedPriors, now);
    expect(result.fresh).toBe(true);
    expect(result.warning).toMatch(/unreadable/);
    expect(await adapter.get(`${DATA_KEY}-corrupt-${now.getTime()}`)).toBe("{not json");
  });

  it("starts with a warning when storage is unavailable", async () => {
    const broken: StorageAdapter = { kind: "indexeddb", get: () => Promise.reject(new Error("denied")), set: async () => {}, remove: async () => {} };
    const result = await loadAppData(broken, seedPriors, now);
    expect(result.warning).toMatch(/Couldn't read/);
    expect(result.data.attempts).toEqual([]);
  });

  it("exports and imports progress", () => {
    const data = createInitialData(seedPriors, now);
    data.attempts.push(attempt(q, { correct: true, confidence: "knew", at: now.toISOString() }));
    const back = parseImport(serializeExport(data, now));
    expect(back.attempts).toEqual(data.attempts);
    expect(back.profile.id).toBe(data.profile.id);
  });

  it("migrates an older (v1) progress file", () => {
    const v1 = {
      app: "security-plus-command-center",
      data: {
        schemaVersion: 1,
        profile: { id: "u1", displayName: "Old", createdAt: local(2026, 1, 1) },
        attempts: [{ id: "a1", questionId: q.id, sessionId: "s1", selectedAnswerIds: ["a"], isCorrect: true, confidence: "guess", durationMs: 100, completedAt: local(2026, 1, 2) }],
        sessions: [{ id: "s1", type: "quick", status: "completed", startedAt: local(2026, 1, 2), completedAt: local(2026, 1, 2), questionIds: [q.id], currentQuestionIndex: 0, answers: {} }],
      },
    };
    const data = parseImport(JSON.stringify(v1));
    expect(data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(data.attempts[0].confidence).toBe("educated");
    expect(data.sessions[0].retestQuestionIds).toEqual([]);
    expect(data.sessions[0].lastActiveAt).toBe(local(2026, 1, 2));
    expect(data.profile.preferences.theme).toBe("dark");
  });

  it("rejects files that aren't valid exports", () => {
    expect(() => parseImport("nope")).toThrow(DataError);
    expect(() => parseImport(JSON.stringify({ app: "other", data: {} }))).toThrow(/isn't a Security\+/);
    const future = { app: "security-plus-command-center", data: { ...createInitialData({}, now), schemaVersion: 99 } };
    expect(() => parseImport(JSON.stringify(future))).toThrow(/newer version/);
    const bad = { ...createInitialData({}, now), attempts: [{ id: 1 }] };
    expect(() => validateAppData(bad)).toThrow(/Attempt 0/);
  });

  it("drops unexpected properties from imported data", () => {
    const data = createInitialData({}, now) as unknown as Record<string, unknown>;
    (data.profile as Record<string, unknown>).evil = "<img src=x onerror=alert(1)>";
    const clean = validateAppData(data);
    expect("evil" in clean.profile).toBe(false);
  });
});
