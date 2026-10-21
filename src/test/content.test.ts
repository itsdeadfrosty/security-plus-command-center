import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allConcepts, allQuestions, conceptDomain, examContent, exams, questionExams, seedPriors } from "@/content/catalog";
import { uncoveredConcepts, validateContent } from "@/content/validate";
import { EXAM_VERSIONS } from "@/lib/types";
import { makeQuestion } from "./helpers";

describe("question bank validation", () => {
  it("has no validation errors", () => {
    expect(validateContent(exams, allConcepts, allQuestions, Object.keys(seedPriors))).toEqual([]);
  });

  it.each(EXAM_VERSIONS)("%s has questions in every domain", (v) => {
    const exam = examContent(v);
    expect(exam.questions.length).toBeGreaterThanOrEqual(50);
    for (const d of exam.certification.domains) {
      expect(exam.questions.some((q) => conceptDomain(q.conceptIds[0], v) === d.id), `${v} domain ${d.id}`).toBe(true);
    }
  });

  it.each(EXAM_VERSIONS)("%s: every concept on the circuit has at least one question", (v) => {
    const exam = examContent(v);
    expect(uncoveredConcepts(v, exam.concepts, exam.questions)).toEqual([]);
  });

  it("every question belongs to at least one exam", () => {
    for (const q of allQuestions) expect(questionExams(q).length, q.id).toBeGreaterThan(0);
  });

  it("covers every seeded weak concept, and key web concepts with varied scenarios", () => {
    const { questionsByConcept } = examContent("SY0-701");
    for (const [id, prior] of Object.entries(seedPriors)) {
      if (prior === "weak") expect(questionsByConcept.get(id)?.length ?? 0, id).toBeGreaterThanOrEqual(1);
    }
    for (const id of ["xss", "sqli", "csrf", "ssrf", "session-hijacking", "directory-traversal", "race-condition", "on-path"]) {
      expect(questionsByConcept.get(id)!.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("references only existing image assets", () => {
    for (const q of allQuestions) {
      if (q.image) expect(existsSync(join(process.cwd(), "public", q.image.src)), q.id).toBe(true);
    }
  });

  it("catches broken questions", () => {
    const broken = [
      makeQuestion("dup", ["xss"]),
      makeQuestion("dup", ["xss"]),
      makeQuestion("bad-key", ["xss"], { correct: ["z"] }),
      makeQuestion("bad-concept", ["no-such-concept"]),
      makeQuestion("multi-no-count", ["xss"], { options: ["A", "B", "C", "D", "E"], correct: ["a", "b"], why: { c: "x", d: "x", e: "x" } }),
      makeQuestion("no-expl", ["xss"], { explanation: " " }),
      { ...makeQuestion("bad-type", ["xss"]), type: "dragdrop" as never },
      makeQuestion("dup-options", ["xss"], { options: ["A", "A", "C", "D"] }),
      makeQuestion("missing-why", ["xss"], { why: { b: "x" } }),
      makeQuestion("wrong-exam", ["xss"], { exams: ["SY0-801", "SY0-701"] }),
      makeQuestion("ai-on-701", ["prompt-injection"], { exams: ["SY0-701"] }),
    ];
    const errors = validateContent(exams, allConcepts, broken).join("\n");
    expect(errors).toMatch(/Duplicate question id dup/);
    expect(errors).toMatch(/bad-key: correct answer z is not an option/);
    expect(errors).toMatch(/bad-concept: unknown concept/);
    expect(errors).toMatch(/multi-no-count: stem must say "Select TWO"/);
    expect(errors).toMatch(/no-expl: empty explanation/);
    expect(errors).toMatch(/bad-type: unsupported type/);
    expect(errors).toMatch(/dup-options: duplicate option text/);
    expect(errors).toMatch(/missing-why: missing explanation for distractor c/);
    expect(errors).toMatch(/ai-on-701: listed for SY0-701 but primary concept has no SY0-701 objective/);
    expect(errors).not.toMatch(/wrong-exam/);
  });
});
