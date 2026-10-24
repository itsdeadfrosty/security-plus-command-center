import { describe, expect, it } from "vitest";
import { examContent, questionById, questionDomain, seedPriors } from "@/content/catalog";
import { PBQ_TYPES } from "@/lib/types";
import { createMockExam, gradeMockExam, pickMockQuestions, quotas, scaledEstimate, timeLeftMs } from "@/lib/engine/mockExam";
import { mergeAppData } from "@/lib/engine/blitz";
import { pair } from "@/lib/engine/scoring";
import { createInitialData, parseImport, serializeExport } from "@/lib/storage/schema";

const V = "SY0-701" as const;
const ex = examContent(V);
const domainOf = (q: Parameters<typeof questionDomain>[0]) => questionDomain(q, V);
const get = (id: string) => questionById.get(id);

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("practice exam", () => {
  it("splits quotas by weight and sums to the total", () => {
    expect(quotas([12, 22, 18, 28, 20], 90).reduce((s, x) => s + x, 0)).toBe(90);
    expect(quotas([1, 1], 3).sort()).toEqual([1, 2]);
    expect(scaledEstimate(0)).toBe(100);
    expect(scaledEstimate(1)).toBe(900);
  });

  it("picks a domain-weighted, unique set with PBQs first and no true/false", () => {
    const ids = pickMockQuestions(ex.certification, ex.questions, domainOf, 90, new Set(), seeded(1));
    expect(ids).toHaveLength(Math.min(90, ex.questions.filter((q) => q.type !== "truefalse").length));
    expect(new Set(ids).size).toBe(ids.length);
    const qs = ids.map((id) => get(id)!);
    expect(qs.some((q) => q.type === "truefalse")).toBe(false);
    const firstNonPbq = qs.findIndex((q) => !PBQ_TYPES.includes(q.type));
    expect(qs.slice(firstNonPbq).some((q) => PBQ_TYPES.includes(q.type))).toBe(false);
    // Every domain with questions is represented.
    for (const d of ex.certification.domains) {
      if (ex.questions.some((q) => domainOf(q) === d.id)) expect(qs.some((q) => domainOf(q) === d.id)).toBe(true);
    }
  });

  it("saves recently used questions for last", () => {
    const first = pickMockQuestions(ex.certification, ex.questions, domainOf, 30, new Set(), seeded(2));
    const second = pickMockQuestions(ex.certification, ex.questions, domainOf, 30, new Set(first), seeded(3));
    expect(second.filter((id) => first.includes(id)).length).toBe(0);
  });

  it("grades answers, times out, and survives export, import and merge", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    const ids = pickMockQuestions(ex.certification, ex.questions, domainOf, 30, new Set(), seeded(4));
    const mock = createMockExam(V, ids, now);
    expect(timeLeftMs(mock, now)).toBe(30 * 60_000);
    expect(timeLeftMs(mock, new Date(now.getTime() + 31 * 60_000))).toBe(0);

    const right = (id: string) => {
      const q = get(id)!;
      return q.type === "matching" && q.matching ? Object.entries(q.matching.answers).map(([o, c]) => pair(o, c)) : q.correctAnswerIds;
    };
    const allRight = { ...mock, answers: Object.fromEntries(ids.map((id) => [id, right(id)])) };
    const r = gradeMockExam(allRight, ex.certification, get, domainOf);
    expect(r.fraction).toBe(1);
    expect(r.passed).toBe(true);
    expect(r.missed).toHaveLength(0);
    const blank = gradeMockExam(mock, ex.certification, get, domainOf);
    expect(blank.points).toBe(0);
    expect(blank.missed).toHaveLength(ids.length);
    expect(blank.missedConcepts[0].count).toBeGreaterThanOrEqual(1);

    const data = { ...createInitialData(seedPriors, now), mockExams: [allRight] };
    expect(parseImport(serializeExport(data, now)).mockExams[0].answers).toEqual(allRight.answers);

    const later = { ...allRight, status: "completed" as const, lastActiveAt: "2026-10-24T12:20:00Z" };
    const other = createMockExam(V, ids, new Date("2026-10-24T12:10:00Z"));
    const merged = mergeAppData({ ...data, mockExams: [allRight] }, { ...data, mockExams: [later, other] });
    expect(merged.mockExams.find((m) => m.id === mock.id)?.status).toBe("completed");
    expect(merged.mockExams.filter((m) => m.status === "active")).toHaveLength(1);
  });

  it("migrates v4 data to an empty mock list", () => {
    const v4 = JSON.parse(serializeExport(createInitialData(seedPriors, new Date()), new Date()));
    const inner = v4.data ?? v4;
    inner.schemaVersion = 4;
    delete inner.mockExams;
    expect(parseImport(JSON.stringify(v4)).mockExams).toEqual([]);
  });
});
