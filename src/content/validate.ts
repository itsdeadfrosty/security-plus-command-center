import { EXAM_VERSIONS, SUPPORTED_QUESTION_TYPES, type Certification, type Concept, type ExamVersion, type Question } from "@/lib/types";

const COUNT_WORDS: Record<number, string> = { 2: "TWO", 3: "THREE", 4: "FOUR" };

/**
 * Static checks for the question bank. Returns human-readable problems; an
 * empty list means the content is valid. Run by the test suite, so a broken
 * question fails CI instead of reaching a learner.
 */
export function validateContent(
  examsByVersion: Record<ExamVersion, Certification>,
  concepts: Concept[],
  questions: Question[],
  seedConceptIds: string[] = [],
): string[] {
  const errors: string[] = [];
  const objectiveIds = new Map<ExamVersion, Set<string>>();
  for (const v of EXAM_VERSIONS) {
    const cert = examsByVersion[v];
    objectiveIds.set(v, new Set(cert.domains.flatMap((d) => d.objectives.map((o) => o.id))));
    const weightSum = cert.domains.reduce((s, d) => s + d.weight, 0);
    if (Math.abs(weightSum - 1) > 0.001) errors.push(`${v}: domain weights sum to ${weightSum}, expected 1`);
    if (cert.examVersion !== v) errors.push(`${v}: certification has examVersion ${cert.examVersion}`);
  }

  const conceptMap = new Map<string, Concept>();
  for (const c of concepts) {
    if (conceptMap.has(c.id)) errors.push(`Duplicate concept id ${c.id}`);
    conceptMap.set(c.id, c);
    const versions = Object.keys(c.objectives) as ExamVersion[];
    if (versions.length === 0) errors.push(`Concept ${c.id}: maps to no exam objective`);
    for (const v of versions) {
      if (!objectiveIds.get(v)?.has(c.objectives[v]!)) errors.push(`Concept ${c.id}: unknown ${v} objective ${c.objectives[v]}`);
    }
    if (!c.summary.trim() || !c.example.trim()) errors.push(`Concept ${c.id}: missing summary or example`);
  }
  for (const c of concepts) {
    for (const x of c.contrasts ?? []) {
      if (!conceptMap.has(x.conceptId)) errors.push(`Concept ${c.id}: contrast references unknown concept ${x.conceptId}`);
      if (x.conceptId === c.id) errors.push(`Concept ${c.id}: contrasts with itself`);
    }
  }
  for (const id of seedConceptIds) if (!conceptMap.has(id)) errors.push(`Seed prior references unknown concept ${id}`);

  const questionIds = new Set<string>();
  for (const q of questions) {
    const where = `Question ${q.id}`;
    if (questionIds.has(q.id)) errors.push(`Duplicate question id ${q.id}`);
    questionIds.add(q.id);

    if (!SUPPORTED_QUESTION_TYPES.includes(q.type)) errors.push(`${where}: unsupported type ${q.type}`);
    if (q.conceptIds.length === 0) errors.push(`${where}: no concepts`);
    for (const c of q.conceptIds) if (!conceptMap.has(c)) errors.push(`${where}: unknown concept ${c}`);
    const primary = conceptMap.get(q.conceptIds[0]);
    if (primary) {
      const versions = q.exams ?? (Object.keys(primary.objectives) as ExamVersion[]);
      if (versions.length === 0) errors.push(`${where}: applies to no exam`);
      for (const v of versions) if (!primary.objectives[v]) errors.push(`${where}: listed for ${v} but primary concept has no ${v} objective`);
    }
    if (!Number.isInteger(q.version) || q.version < 1) errors.push(`${where}: invalid version`);
    if (!q.stem.trim()) errors.push(`${where}: empty stem`);
    if (!q.explanation.trim()) errors.push(`${where}: empty explanation`);

    const optionIds = q.options.map((o) => o.id);
    if (new Set(optionIds).size !== optionIds.length) errors.push(`${where}: duplicate answer ids`);
    if (q.options.some((o) => !o.text.trim())) errors.push(`${where}: empty option text`);
    if (new Set(q.options.map((o) => o.text.trim().toLowerCase())).size !== q.options.length) errors.push(`${where}: duplicate option text`);

    if (q.type === "ordering") {
      if (q.options.length < 3) errors.push(`${where}: ordering needs at least 3 steps`);
      const sorted = [...q.correctAnswerIds].sort().join();
      if (sorted !== [...optionIds].sort().join()) errors.push(`${where}: ordering key must contain every option exactly once`);
      continue;
    }
    if (q.type === "matching") {
      const m = q.matching;
      if (!m) {
        errors.push(`${where}: matching question has no matching spec`);
        continue;
      }
      if (m.categories.length < 2) errors.push(`${where}: matching needs at least 2 categories`);
      if (q.options.length < 3) errors.push(`${where}: matching needs at least 3 items`);
      const cats = new Set(m.categories.map((c) => c.id));
      for (const id of optionIds) {
        if (!m.answers[id]) errors.push(`${where}: item ${id} has no category`);
        else if (!cats.has(m.answers[id])) errors.push(`${where}: item ${id} maps to unknown category`);
      }
      continue;
    }

    if (q.correctAnswerIds.length === 0) errors.push(`${where}: no correct answer`);
    for (const id of q.correctAnswerIds) if (!optionIds.includes(id)) errors.push(`${where}: correct answer ${id} is not an option`);
    if (q.type === "single" && (q.correctAnswerIds.length !== 1 || q.options.length < 4))
      errors.push(`${where}: single-answer needs exactly 1 correct and at least 4 options`);
    if (q.type === "truefalse" && (q.options.length !== 2 || q.correctAnswerIds.length !== 1)) errors.push(`${where}: true/false needs 2 options and 1 correct`);
    if (q.type === "multiple") {
      const n = q.correctAnswerIds.length;
      if (n < 2) errors.push(`${where}: multiple-response needs at least 2 correct answers`);
      if (q.options.length <= n + 1) errors.push(`${where}: multiple-response needs more distractors`);
      const word = COUNT_WORDS[n];
      if (!word || !q.stem.includes(`Select ${word}`)) errors.push(`${where}: stem must say "Select ${word ?? n}"`);
    }
    const wrong = optionIds.filter((id) => !q.correctAnswerIds.includes(id));
    for (const id of wrong) if (!q.distractorExplanations[id]?.trim()) errors.push(`${where}: missing explanation for distractor ${id}`);
    for (const id of Object.keys(q.distractorExplanations)) if (!optionIds.includes(id)) errors.push(`${where}: distractor explanation for unknown option ${id}`);
    if (q.image && (!q.image.src.startsWith("/") || !q.image.alt.trim())) errors.push(`${where}: invalid image reference`);
  }
  return errors;
}

/** Concepts in an exam with no question at all — the circuit can't cover them. */
export function uncoveredConcepts(v: ExamVersion, concepts: Concept[], questions: Question[]): string[] {
  const covered = new Set(questions.flatMap((q) => q.conceptIds));
  return concepts.filter((c) => c.objectives[v] && !covered.has(c.id)).map((c) => c.id);
}
