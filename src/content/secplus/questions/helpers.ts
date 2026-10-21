import type { AnswerOption, Difficulty, ExamVersion, Question, QuestionType } from "@/lib/types";

interface BaseInput {
  id: string;
  conceptIds: string[];
  difficulty: Difficulty;
  scenario?: string;
  stem: string;
  explanation: string;
  /** Restrict to specific exam versions (default: every version the primary concept maps to). */
  exams?: ExamVersion[];
  version?: number;
}

interface QuestionInput extends BaseInput {
  type?: QuestionType;
  /** Option texts in order; ids are assigned a, b, c... */
  options: string[];
  /** Correct option letters, e.g. ["b"] or ["a", "c"]. */
  correct: string[];
  /** Why wrong options are wrong, keyed by letter. */
  why: Record<string, string>;
}

const LETTERS = "abcdefghij";

function base(input: BaseInput) {
  return {
    id: input.id,
    certificationId: "comptia-secplus",
    exams: input.exams,
    conceptIds: input.conceptIds,
    difficulty: input.difficulty,
    scenario: input.scenario,
    stem: input.stem,
    explanation: input.explanation,
    version: input.version ?? 1,
    source: { kind: "original" as const },
  };
}

const toOptions = (texts: string[]): AnswerOption[] => texts.map((text, i) => ({ id: LETTERS[i], text }));

/** Single-answer or multiple-response question. */
export function q(input: QuestionInput): Question {
  return {
    ...base(input),
    type: input.type ?? (input.correct.length > 1 ? "multiple" : "single"),
    options: toOptions(input.options),
    correctAnswerIds: input.correct,
    distractorExplanations: input.why,
  };
}

/** True/false helper: option a = True, b = False. */
export function tf(input: Omit<QuestionInput, "options" | "correct" | "type"> & { answer: boolean }): Question {
  return q({ ...input, type: "truefalse", options: ["True", "False"], correct: [input.answer ? "a" : "b"] });
}

/** PBQ-style sequencing: `steps` are written in the correct order and shuffled on screen. */
export function order(input: BaseInput & { steps: string[] }): Question {
  const options = toOptions(input.steps);
  return { ...base(input), type: "ordering", options, correctAnswerIds: options.map((o) => o.id), distractorExplanations: {} };
}

/**
 * PBQ-style sorting: each item goes into one category.
 * items: [text, categoryIndex][]
 */
export function match(input: BaseInput & { categories: string[]; items: [string, number][] }): Question {
  const options = toOptions(input.items.map(([t]) => t));
  const categories = input.categories.map((text, i) => ({ id: `c${i + 1}`, text }));
  const answers: Record<string, string> = {};
  input.items.forEach(([, cat], i) => (answers[options[i].id] = categories[cat].id));
  return { ...base(input), type: "matching", options, correctAnswerIds: [], matching: { categories, answers }, distractorExplanations: {} };
}
