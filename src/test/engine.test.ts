import { describe, expect, it } from "vitest";
import { canSubmit, isAnswerCorrect, toggleSelection } from "@/lib/engine/scoring";
import { computeMastery } from "@/lib/engine/mastery";
import { allocateByWeight, isInReviewQueue, pickRetestQuestion, recommendMode, reviewPriority, selectQuestions } from "@/lib/engine/selection";
import { appendRetest, createSession, resumeIndex, shuffledOptionIds, submitAnswer, MAX_RETESTS_PER_SESSION } from "@/lib/engine/session";
import { allConcepts, examContent, questionById, questionDomain, seedPriors } from "@/content/catalog";

const exam = examContent("SY0-701");
const { questionsByConcept, certification } = exam;
const allQuestions = exam.questions;
const domainOf = (q: Question) => questionDomain(q, "SY0-701");
import type { Question, QuestionAttempt } from "@/lib/types";
import { attempt, local, makeQuestion } from "./helpers";

const multi = makeQuestion("m1", ["xss", "sqli"], {
  stem: "Pick (Select TWO)",
  options: ["A", "B", "C", "D", "E"],
  correct: ["a", "c"],
  why: { b: "x", d: "x", e: "x" },
});
const single = makeQuestion("s1", ["xss"]);

describe("answer scoring", () => {
  it("grades single-answer questions", () => {
    expect(isAnswerCorrect(single, ["a"])).toBe(true);
    expect(isAnswerCorrect(single, ["b"])).toBe(false);
  });

  it("gives no credit when only one answer is selected in a select-two question", () => {
    expect(isAnswerCorrect(multi, ["a"])).toBe(false);
    expect(canSubmit(multi, ["a"])).toBe(false);
    expect(isAnswerCorrect(multi, ["a", "b"])).toBe(false);
    expect(isAnswerCorrect(multi, ["c", "a"])).toBe(true);
  });

  it("caps multiple-response selection at the required count and replaces single selection", () => {
    let sel = toggleSelection(multi, [], "a");
    sel = toggleSelection(multi, sel, "b");
    sel = toggleSelection(multi, sel, "c");
    expect(sel).toEqual(["a", "b"]);
    expect(toggleSelection(multi, sel, "a")).toEqual(["b"]);
    expect(toggleSelection(single, ["a"], "b")).toEqual(["b"]);
  });
});

const ids = allConcepts.map((c) => c.id);
const get = (id: string) => questionById.get(id) ?? (id === single.id ? single : id === multi.id ? multi : undefined);
const START = local(2026, 10, 1);

function mastery(attempts: QuestionAttempt[], seeds = {}) {
  return computeMastery(attempts, get, ids, seeds, START);
}

describe("mastery and review tracking", () => {
  const xss = questionsByConcept.get("xss")!.filter((q) => q.conceptIds.length === 1);

  it("puts incorrect answers in the review queue at top priority", () => {
    const m = mastery([attempt(xss[0], { correct: false, at: local(2026, 10, 2) })]).get("xss")!;
    expect(m.box).toBe(0);
    expect(m.masteryLabel).toBe("Needs work");
    expect(isInReviewQueue(m, new Date(local(2026, 10, 2, 13)))).toBe(true);
    expect(reviewPriority(m, new Date(local(2026, 10, 2, 13)))).toBe(90);
  });

  it("flags a confident wrong answer as a likely misconception", () => {
    const m = mastery([attempt(xss[0], { correct: false, confidence: "knew", at: local(2026, 10, 2) })]).get("xss")!;
    expect(m.lastResult).toBe("incorrect-confident");
    expect(reviewPriority(m, new Date(local(2026, 10, 2, 13)))).toBe(100);
  });

  it("does not treat a correct guess as mastery and schedules it for tomorrow", () => {
    const m = mastery([attempt(xss[0], { correct: true, confidence: "random", at: local(2026, 10, 2) })]).get("xss")!;
    expect(m.guessedCorrectAttempts).toBe(1);
    expect(m.box).toBeLessThanOrEqual(1);
    expect(m.masteryLabel).not.toBe("Mastered");
    expect(new Date(m.nextReviewAt!).getTime() - new Date(local(2026, 10, 2)).getTime()).toBe(24 * 3600 * 1000);
    expect(isInReviewQueue(m, new Date(local(2026, 10, 3, 13)))).toBe(true);
  });

  it("clears a topic after three 'knew it' answers in a row", () => {
    const knew = (d: number, q = xss[0]) => attempt(q, { correct: true, confidence: "knew", at: local(2026, 10, d) });
    expect(mastery([knew(1), knew(2)]).get("xss")!.box).toBeLessThan(4);
    const m = mastery([knew(1), knew(2), knew(3)]).get("xss")!;
    expect(m.box).toBe(4);
    expect(m.masteryLabel).toBe("Mastered");
  });

  it("needs five in a row once the learner has stumbled on a topic", () => {
    const guess = attempt(xss[0], { correct: true, confidence: "educated", at: local(2026, 10, 1) });
    const knew = (d: number) => attempt(xss[0], { correct: true, confidence: "knew", at: local(2026, 10, d) });
    expect(mastery([guess, knew(2), knew(3), knew(4), knew(5)]).get("xss")!.box).toBeLessThan(4);
    expect(mastery([guess, knew(2), knew(3), knew(4), knew(5), knew(6)]).get("xss")!.box).toBe(4);
    const skipped = computeMastery([knew(2), knew(3), knew(4)], get, ids, {}, START, new Set(["xss"]));
    expect(skipped.get("xss")!.box).toBeLessThan(4);
  });

  it("stops emphasizing a concept answered confidently many times (e.g. smishing)", () => {
    const smish = questionsByConcept.get("smishing")!;
    const vish = questionsByConcept.get("vishing")!;
    const atts = [
      attempt(smish[0], { correct: true, confidence: "knew", at: local(2026, 10, 2) }),
      attempt(vish[0], { correct: true, confidence: "knew", at: local(2026, 10, 3) }),
    ];
    const now = new Date(local(2026, 10, 4));
    const m = mastery(atts, seedPriors);
    expect(reviewPriority(m.get("smishing")!, now)).toBeLessThan(20);
    const picked = selectQuestions("quick", { questions: allQuestions, attempts: atts, mastery: m, contrasts: new Map(), certification, domainOf, now, random: () => 0 });
    expect(picked.map((q) => q.id)).not.toContain(smish[0].id);
  });

  it("regrades history when a question's answer key is corrected in a later version", () => {
    const v1 = makeQuestion("fix-me", ["xss"], { correct: ["b"], why: { a: "x", c: "x", d: "x" } });
    const v2 = { ...v1, correctAnswerIds: ["a"], version: 2 };
    const a = attempt(v1, { correct: false, at: local(2026, 10, 2), selected: ["a"] });
    expect(a.isCorrect).toBe(false); // historical record is untouched
    const m = computeMastery([a], () => v2, ["xss"], {}, START).get("xss")!;
    expect(m.correctAttempts).toBe(1);
    expect(a.questionVersion).toBe(1);
  });

  it("uses seeded weak areas as starting priorities, replaced by real answers", () => {
    const now = new Date(START);
    const seeded = mastery([], seedPriors);
    expect(reviewPriority(seeded.get("csrf")!, now)).toBe(70);
    expect(seeded.get("ransomware")!.masteryLabel).toBe("Familiar");
    expect(reviewPriority(seeded.get("ransomware")!, now)).toBeLessThan(10);
  });
});

describe("question selection", () => {
  const now = new Date(START);
  const contrasts = new Map(allConcepts.map((c) => [c.id, (c.contrasts ?? []).map((x) => x.conceptId)]));
  const base = { questions: allQuestions, attempts: [] as QuestionAttempt[], contrasts, certification, domainOf, now, random: () => 0.5 };

  it("returns unique questions of the requested size", () => {
    const m = mastery([], seedPriors);
    for (const mode of ["quick", "focused", "mixed"] as const) {
      const picked = selectQuestions(mode, { ...base, mastery: m });
      expect(new Set(picked.map((q) => q.id)).size).toBe(picked.length);
      expect(picked.length).toBeGreaterThan(0);
    }
  });

  it("gives differentiated practice when XSS and SQL injection are both being missed", () => {
    const xssQ = questionsByConcept.get("xss")![0];
    const sqliQ = questionsByConcept.get("sqli")![0];
    const atts = [attempt(xssQ, { correct: false, at: local(2026, 9, 25) }), attempt(sqliQ, { correct: false, at: local(2026, 9, 25) })];
    const picked = selectQuestions("focused", { ...base, attempts: atts, mastery: mastery(atts) });
    expect(picked.some((q) => q.conceptIds.includes("xss") && q.conceptIds.includes("sqli"))).toBe(true);
  });

  it("returns nothing for Review Due when nothing is due", () => {
    const m = mastery([]);
    expect(selectQuestions("review", { ...base, mastery: m })).toEqual([]);
  });

  it("balances mixed practice by exam domain weight", () => {
    const alloc = allocateByWeight(certification.domains, 12);
    expect([...alloc.values()].reduce((a, b) => a + b, 0)).toBe(12);
    expect(alloc.get("4.0")).toBeGreaterThan(alloc.get("1.0")!);
  });

  it("retests a missed concept with a different question", () => {
    const missed = questionsByConcept.get("ssrf")![0];
    const retest = pickRetestQuestion(missed, [missed.id], questionsByConcept, [], now);
    expect(retest).toBeDefined();
    expect(retest!.id).not.toBe(missed.id);
    expect(retest!.conceptIds).toContain("ssrf");
  });

  it("recommends a mode from performance", () => {
    expect(recommendMode(mastery([], seedPriors), 0, now).mode).toBe("circuit");
  });
});

describe("study sessions", () => {
  const qs: Question[] = allQuestions.slice(0, 4);
  const now = new Date(START);

  it("records attempts and resumes at the first unanswered question", () => {
    let s = createSession("quick", qs.map((q) => q.id), now);
    s = submitAnswer(s, qs[0], qs[0].correctAnswerIds, 1000, now).session;
    s = submitAnswer(s, qs[1], ["zz"], 1000, now).session;
    expect(resumeIndex(s)).toBe(2);
    expect(s.answers[qs[1].id].isCorrect).toBe(false);
    expect(() => submitAnswer(s, qs[0], ["a"], 1, now)).toThrow();
  });

  it("limits retests per session", () => {
    let s = createSession("quick", [qs[0].id], now);
    for (const q of allQuestions.slice(10, 20)) s = appendRetest(s, q.id);
    expect(s.retestQuestionIds.length).toBe(MAX_RETESTS_PER_SESSION);
  });

  it("keeps the same option order when a session is resumed", () => {
    expect(shuffledOptionIds(qs[0], "ses_1")).toEqual(shuffledOptionIds(qs[0], "ses_1"));
    expect([...shuffledOptionIds(qs[0], "ses_1")].sort()).toEqual(qs[0].options.map((o) => o.id).sort());
  });
});
