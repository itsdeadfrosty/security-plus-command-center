// Single lookup surface for content. Concepts and questions are shared across
// exam versions; each concept maps to an official objective per version, and
// a question belongs to every version its primary concept maps to (unless it
// lists `exams` explicitly).
import type { Certification, Concept, ExamVersion, Question } from "@/lib/types";
import { EXAM_VERSIONS } from "@/lib/types";
import { allConceptList, allQuestionList, initialSeedPriors } from "./secplus";
import { exams } from "./secplus/exams";

export { exams };
export const DEFAULT_EXAM: ExamVersion = "SY0-701";

export const allQuestions: Question[] = allQuestionList;
export const allConcepts: Concept[] = allConceptList;
export const seedPriors = initialSeedPriors;

export const questionById = new Map(allQuestions.map((x) => [x.id, x]));
export const conceptById = new Map(allConcepts.map((c) => [c.id, c]));

export function conceptObjective(conceptId: string, v: ExamVersion): string | undefined {
  return conceptById.get(conceptId)?.objectives[v];
}

export function conceptDomain(conceptId: string, v: ExamVersion): string | undefined {
  const o = conceptObjective(conceptId, v);
  return o ? `${o.split(".")[0]}.0` : undefined;
}

export function questionExams(q: Question): ExamVersion[] {
  if (q.exams) return q.exams;
  const primary = conceptById.get(q.conceptIds[0]);
  return EXAM_VERSIONS.filter((v) => primary?.objectives[v]);
}

export function questionDomain(q: Question, v: ExamVersion): string | undefined {
  return conceptDomain(q.conceptIds[0], v);
}

export function questionObjective(q: Question, v: ExamVersion): string | undefined {
  return conceptObjective(q.conceptIds[0], v);
}

export interface ExamContent {
  version: ExamVersion;
  certification: Certification;
  concepts: Concept[];
  conceptIds: string[];
  questions: Question[];
  /** conceptId -> questions in this exam that test it (any position) */
  questionsByConcept: Map<string, Question[]>;
  /** conceptId -> commonly-confused concepts that are also in this exam */
  contrasts: Map<string, string[]>;
}

const cache = new Map<ExamVersion, ExamContent>();

export function examContent(v: ExamVersion): ExamContent {
  const hit = cache.get(v);
  if (hit) return hit;
  const concepts = allConcepts.filter((c) => c.objectives[v]);
  const ids = new Set(concepts.map((c) => c.id));
  const questions = allQuestions.filter((q) => questionExams(q).includes(v));
  const questionsByConcept = new Map<string, Question[]>();
  for (const q of questions) {
    for (const c of q.conceptIds) {
      if (!ids.has(c)) continue;
      const list = questionsByConcept.get(c) ?? [];
      list.push(q);
      questionsByConcept.set(c, list);
    }
  }
  const contrasts = new Map(concepts.map((c) => [c.id, (c.contrasts ?? []).map((x) => x.conceptId).filter((id) => ids.has(id))]));
  const content: ExamContent = { version: v, certification: exams[v], concepts, conceptIds: [...ids], questions, questionsByConcept, contrasts };
  cache.set(v, content);
  return content;
}

export function domainName(domainId: string, v: ExamVersion): string {
  return exams[v].domains.find((d) => d.id === domainId)?.name ?? domainId;
}

export function conceptName(id: string): string {
  return conceptById.get(id)?.name ?? id;
}
