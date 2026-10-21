import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { match, order } from "@/content/secplus/questions/helpers";
import { assignCategory, canSubmit, isAnswerCorrect, moveItem, pair, partialScore } from "@/lib/engine/scoring";
import { circuitStatus, computeReadiness } from "@/lib/engine/circuit";
import { computeMastery } from "@/lib/engine/mastery";
import { selectQuestions } from "@/lib/engine/selection";
import { shuffledOptionIds } from "@/lib/engine/session";
import { conceptById, conceptDomain, examContent, questionById, questionDomain } from "@/content/catalog";
import { buildReferenceNotes } from "@/lib/ai/buddy";
import { SafeMarkdown } from "@/components/SafeMarkdown";
import { parseImport } from "@/lib/storage/schema";
import { attempt, local } from "./helpers";

const steps = order({
  id: "t-order",
  conceptIds: ["incident-response-process"],
  difficulty: "exam",
  stem: "Order the phases.",
  steps: ["Preparation", "Detection", "Containment", "Recovery"],
  explanation: "Standard order.",
});

const fw = match({
  id: "t-match",
  conceptIds: ["segmentation"],
  difficulty: "exam",
  stem: "Allow or deny?",
  categories: ["Allow", "Deny"],
  items: [
    ["HTTPS to web server", 0],
    ["Telnet from internet", 1],
    ["SSH from admin subnet", 0],
  ],
  explanation: "Least privilege.",
});

describe("PBQ-style questions", () => {
  it("grades ordering by exact sequence and reports partial placement", () => {
    expect(isAnswerCorrect(steps, ["a", "b", "c", "d"])).toBe(true);
    expect(isAnswerCorrect(steps, ["a", "c", "b", "d"])).toBe(false);
    expect(partialScore(steps, ["a", "c", "b", "d"])).toEqual({ right: 2, total: 4 });
    expect(moveItem(["a", "b", "c"], "c", -1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
  });

  it("never starts an ordering question already solved", () => {
    for (const seed of ["s1", "s2", "s3", "s4", "s5", "s6"]) {
      expect(shuffledOptionIds(steps, seed)).not.toEqual(steps.correctAnswerIds);
    }
  });

  it("grades matching only when every item is in the right category", () => {
    let sel: string[] = [];
    sel = assignCategory(sel, "a", "c1");
    sel = assignCategory(sel, "b", "c1");
    expect(canSubmit(fw, sel)).toBe(false);
    sel = assignCategory(sel, "c", "c1");
    expect(canSubmit(fw, sel)).toBe(true);
    expect(isAnswerCorrect(fw, sel)).toBe(false);
    expect(partialScore(fw, sel)).toEqual({ right: 2, total: 3 });
    sel = assignCategory(sel, "b", "c2"); // reassign replaces
    expect(sel.filter((s) => s.startsWith("b:"))).toEqual([pair("b", "c2")]);
    expect(isAnswerCorrect(fw, sel)).toBe(true);
  });
});

describe("exam versions and the circuit", () => {
  it("maps shared concepts to each version's objectives and keeps AI topics 801-only", () => {
    expect(conceptDomain("xss", "SY0-701")).toBe("2.0");
    expect(conceptDomain("rto-rpo", "SY0-701")).toBe("5.0");
    expect(conceptDomain("rto-rpo", "SY0-801")).toBe("3.0");
    expect(examContent("SY0-801").conceptIds).toContain("prompt-injection");
    expect(examContent("SY0-701").conceptIds).not.toContain("prompt-injection");
  });

  it("clears a concept on a confident correct answer and keeps guesses open", () => {
    const q = examContent("SY0-701").questionsByConcept.get("ransomware")![0];
    const run = (conf: "knew" | "random") =>
      computeMastery([attempt(q, { correct: true, confidence: conf, at: local(2026, 10, 2) })], (id) => questionById.get(id), ["ransomware"], {}, local(2026, 10, 1)).get("ransomware");
    expect(circuitStatus(run("knew"))).toBe("cleared");
    expect(circuitStatus(run("random"))).toBe("needs-work");
    expect(circuitStatus(undefined)).toBe("not-started");
  });

  it("weights readiness by exam domain and requires first-try accuracy", () => {
    const exam = examContent("SY0-701");
    const qmap = new Map(exam.questions.map((q) => [q.id, q]));
    // Answer one new question per concept correctly and confidently.
    const atts = exam.conceptIds.flatMap((c, i) => {
      const q = exam.questionsByConcept.get(c)?.[0];
      return q ? [attempt(q, { correct: true, confidence: "knew", at: new Date(Date.UTC(2026, 9, 1, 0, i)).toISOString() })] : [];
    });
    const m = computeMastery(atts, (id) => questionById.get(id), exam.conceptIds, {}, local(2026, 9, 30));
    const r = computeReadiness(exam.certification, exam.conceptIds, (id) => conceptDomain(id, "SY0-701"), m, atts, qmap);
    expect(r.coverage).toBeCloseTo(1, 5);
    expect(r.firstTry.accuracy).toBe(1);
    expect(r.ready).toBe(true);

    const none = computeReadiness(exam.certification, exam.conceptIds, (id) => conceptDomain(id, "SY0-701"), new Map(), [], qmap);
    expect(none.coverage).toBe(0);
    expect(none.ready).toBe(false);
  });

  it("circuit mode only serves concepts that aren't cleared yet", () => {
    const exam = examContent("SY0-701");
    const q = exam.questionsByConcept.get("ransomware")![0];
    const atts = [attempt(q, { correct: true, confidence: "knew", at: local(2026, 10, 2) })];
    const m = computeMastery(atts, (id) => questionById.get(id), exam.conceptIds, {}, local(2026, 10, 1));
    const picked = selectQuestions("circuit", {
      questions: exam.questions,
      attempts: atts,
      mastery: m,
      contrasts: exam.contrasts,
      certification: exam.certification,
      domainOf: (x) => questionDomain(x, "SY0-701"),
      now: new Date(local(2026, 10, 3)),
      random: () => 0.5,
    });
    expect(picked.length).toBe(10);
    expect(picked.every((x) => x.conceptIds.some((c) => circuitStatus(m.get(c)) !== "cleared"))).toBe(true);
  });

  it("migrates a v2 progress file to SY0-701", () => {
    const v2 = {
      app: "security-plus-command-center",
      data: { schemaVersion: 2, profile: { id: "u1", displayName: "L", createdAt: local(2026, 9, 1) }, attempts: [], sessions: [], seedPriors: {} },
    };
    expect(parseImport(JSON.stringify(v2)).profile.examVersion).toBe("SY0-701");
  });
});

describe("study buddy", () => {
  it("grounds the tutor in the concept card and the learner's actual mistakes", () => {
    const concept = conceptById.get("csrf")!;
    const q = examContent("SY0-701").questionsByConcept.get("csrf")![0];
    const wrong = q.options.find((o) => !q.correctAnswerIds.includes(o.id))!;
    const notes = buildReferenceNotes({
      examVersion: "SY0-701",
      concept,
      contrastNames: [{ name: "SSRF", distinction: "server vs browser" }],
      missed: [{ question: q, attempt: attempt(q, { correct: false, confidence: "knew", at: local(2026, 10, 2), selected: [wrong.id] }) }],
    });
    expect(notes).toContain(concept.summary);
    expect(notes).toContain(`Learner answered: ${wrong.text} (and felt sure)`);
    expect(notes).toContain("Often confused with SSRF");
  });

  it("renders model output as text, never as HTML", () => {
    const { container } = render(<SafeMarkdown text={'**XSS** <img src=x onerror="alert(1)">\n- runs in the `browser`'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("strong")?.textContent).toBe("XSS");
    expect(container.querySelector("li code")?.textContent).toBe("browser");
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });
});
