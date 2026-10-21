import type { Question } from "@/lib/types";

/** Matching answers are stored as "optionId:categoryId" pairs. */
export const pair = (optionId: string, categoryId: string) => `${optionId}:${categoryId}`;

export function parsePairs(selected: string[]): Map<string, string> {
  return new Map(selected.map((s) => s.split(":") as [string, string]));
}

/**
 * Whole-question correctness. No partial credit for mastery purposes:
 * multiple-response needs the exact set, ordering the exact sequence,
 * matching every item in the right category.
 */
export function isAnswerCorrect(question: Question, selected: string[]): boolean {
  if (question.type === "ordering") {
    return selected.length === question.correctAnswerIds.length && selected.every((id, i) => id === question.correctAnswerIds[i]);
  }
  if (question.type === "matching") {
    const s = partialScore(question, selected);
    return s.total > 0 && s.right === s.total;
  }
  const want = new Set(question.correctAnswerIds);
  const got = new Set(selected);
  if (want.size !== got.size) return false;
  for (const id of got) if (!want.has(id)) return false;
  return true;
}

/** Item-level score for feedback on PBQ-style questions (e.g. "4 of 5 placed correctly"). */
export function partialScore(question: Question, selected: string[]): { right: number; total: number } {
  if (question.type === "ordering") {
    const right = question.correctAnswerIds.filter((id, i) => selected[i] === id).length;
    return { right, total: question.correctAnswerIds.length };
  }
  if (question.type === "matching" && question.matching) {
    const got = parsePairs(selected);
    const entries = Object.entries(question.matching.answers);
    return { right: entries.filter(([opt, cat]) => got.get(opt) === cat).length, total: entries.length };
  }
  const correct = isAnswerCorrect(question, selected);
  return { right: correct ? 1 : 0, total: 1 };
}

export function requiredSelections(question: Question): number {
  if (question.type === "multiple") return question.correctAnswerIds.length;
  if (question.type === "ordering" || question.type === "matching") return question.options.length;
  return 1;
}

/** Whether the selection is complete enough to submit (UI gate, not grading). */
export function canSubmit(question: Question, selected: string[]): boolean {
  if (question.type === "matching") return parsePairs(selected).size === question.options.length;
  return selected.length === requiredSelections(question);
}

/**
 * Toggle an option. Single-answer questions replace the selection; multiple-response
 * questions toggle, and never exceed the required count.
 */
export function toggleSelection(question: Question, selected: string[], optionId: string): string[] {
  if (question.type !== "multiple") return [optionId];
  if (selected.includes(optionId)) return selected.filter((id) => id !== optionId);
  if (selected.length >= requiredSelections(question)) return selected;
  return [...selected, optionId];
}

/** Matching: assign (or reassign) one item to a category. */
export function assignCategory(selected: string[], optionId: string, categoryId: string): string[] {
  return [...selected.filter((s) => !s.startsWith(`${optionId}:`)), pair(optionId, categoryId)];
}

/** Ordering: move an item up (-1) or down (+1). */
export function moveItem(order: string[], optionId: string, delta: -1 | 1): string[] {
  const i = order.indexOf(optionId);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= order.length) return order;
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
