import { describe, expect, it } from "vitest";
import { allQuestions, examContent, seedPriors } from "@/content/catalog";
import { BLITZ_COOLDOWN_MS, blitzPool, blitzWaitMs, mergeAppData, pickBlitz } from "@/lib/engine/blitz";
import { createInitialData, validateAppData } from "@/lib/storage/schema";
import { attempt } from "./helpers";

const quick = allQuestions.filter((q) => q.type === "single").slice(0, 4);
const base = () => createInitialData(seedPriors, new Date("2026-10-01T00:00:00Z"));

describe("blitz", () => {
  it("draws missed and guessed questions, not solid or drilled-out ones", () => {
    const [missed, guessed, solid, cleared] = quick;
    const data = {
      ...base(),
      attempts: [
        attempt(missed, { correct: false, at: "2026-10-02T00:00:00Z" }),
        attempt(guessed, { correct: true, confidence: "random", at: "2026-10-02T00:00:00Z" }),
        attempt(solid, { correct: false, at: "2026-10-01T00:00:00Z" }),
        attempt(solid, { correct: true, confidence: "knew", at: "2026-10-02T00:00:00Z" }),
        attempt(cleared, { correct: false, at: "2026-10-02T00:00:00Z" }),
      ],
      blitz: { cleared: [cleared.id] },
    };
    expect(blitzPool(data, allQuestions).map((q) => q.id).sort()).toEqual([missed.id, guessed.id].sort());
    expect(pickBlitz(blitzPool(data, allQuestions)).ids).toHaveLength(2);
  });

  it("follows a question with one on its look-alike topic", () => {
    const content = examContent("SY0-701");
    const q = content.questions.find((x) => x.type === "single" && (content.contrasts.get(x.conceptIds[0]) ?? []).length)!;
    const pick = pickBlitz([q], content.questions, content.contrasts, () => 0);
    expect(pick.ids).toHaveLength(2);
    expect(pick.ids[0]).toBe(q.id);
    expect(content.contrasts.get(q.conceptIds[0])).toContain(pick.versus[q.id]);
    expect(pick.extra).toEqual([pick.ids[1]]);
  });

  it("allows one blitz every 10 minutes", () => {
    const data = { ...base(), blitz: { cleared: [], lastStartedAt: "2026-10-02T10:00:00Z" } };
    expect(blitzWaitMs(data, new Date("2026-10-02T10:04:00Z"))).toBe(BLITZ_COOLDOWN_MS - 4 * 60 * 1000);
    expect(blitzWaitMs(data, new Date("2026-10-02T10:10:00Z"))).toBe(0);
  });

  it("upgrades older saves with an empty blitz record", () => {
    const { blitz, ...old } = base();
    void blitz;
    expect(validateAppData({ ...old, schemaVersion: 3 }).blitz).toEqual({ cleared: [], lastStartedAt: undefined });
  });
});

describe("device sync merge", () => {
  it("keeps answers from both devices and adopts the other profile on a fresh device", () => {
    const pc = { ...base(), attempts: [attempt(quick[0], { correct: true, at: "2026-10-02T00:00:00Z" })], blitz: { cleared: ["a"] } };
    const phone = { ...base(), attempts: [attempt(quick[1], { correct: false, at: "2026-10-03T00:00:00Z" })], blitz: { cleared: ["b"] } };
    const merged = mergeAppData(pc, phone);
    expect(merged.attempts.map((a) => a.questionId)).toEqual([quick[0].id, quick[1].id]);
    expect(merged.blitz.cleared.sort()).toEqual(["a", "b"]);
    expect(mergeAppData(merged, merged)).toEqual(merged);

    const fresh = mergeAppData(base(), pc);
    expect(fresh.profile.id).toBe(pc.profile.id);
    expect(fresh.attempts).toHaveLength(1);
  });
});
