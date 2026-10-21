// Core data model. Content types (Question, Concept, ...) are static and ship
// with the app; progress types (QuestionAttempt, StudySession, ...) are the
// learner's data and live in local storage (see lib/storage).

export type Difficulty = "beginner" | "intermediate" | "exam" | "advanced";

/** Exam versions the app can target. Concepts map to objectives in each. */
export type ExamVersion = "SY0-701" | "SY0-801";
export const EXAM_VERSIONS: ExamVersion[] = ["SY0-701", "SY0-801"];

/**
 * Question types the renderer supports. Add new ones here + in QuestionCard.
 * - ordering: put the options in the correct sequence (correctAnswerIds = the order)
 * - matching: assign each option to a category (PBQ-style, e.g. firewall allow/deny)
 */
export type QuestionType = "single" | "multiple" | "truefalse" | "ordering" | "matching";

export const SUPPORTED_QUESTION_TYPES: QuestionType[] = ["single", "multiple", "truefalse", "ordering", "matching"];

/** Questions answered by arranging or sorting rather than picking. */
export const PBQ_TYPES: QuestionType[] = ["ordering", "matching"];

export type Confidence = "knew" | "educated" | "random";

export type StudyMode = "circuit" | "quick" | "focused" | "mixed" | "review";

// ---------- Content ----------

export interface Certification {
  id: string; // e.g. "comptia-secplus"
  name: string;
  examVersion: ExamVersion;
  /** Official launch / expected retirement, for display. */
  status: string;
  maxQuestions: number;
  durationMinutes: number;
  passingScore: string; // descriptive, e.g. "750 (scale 100–900)"
  domains: Domain[];
}

export interface Domain {
  id: string; // "1.0"
  name: string;
  weight: number; // exam weighting, 0–1
  objectives: Objective[];
}

export interface Objective {
  id: string; // official objective number, e.g. "2.4"
  title: string;
}

export interface ConceptContrast {
  conceptId: string;
  distinction: string;
}

export interface Concept {
  id: string; // kebab-case, stable forever (progress is keyed by it)
  name: string;
  /** Official objective number per exam version, e.g. { "SY0-701": "2.3", "SY0-801": "2.5" }. */
  objectives: Partial<Record<ExamVersion, string>>;
  topic: string;
  /** One-sentence plain-English definition. */
  summary: string;
  /** Practical IT example. */
  example: string;
  /** Commonly-confused concepts and how to tell them apart. */
  contrasts?: ConceptContrast[];
  /** Deeper explanation shown behind "Explain more". */
  more?: string;
}

export interface AnswerOption {
  id: string; // "a", "b", ...
  text: string;
}

export interface MatchingSpec {
  /** Buckets each option is sorted into, e.g. Allow / Deny. */
  categories: AnswerOption[];
  /** optionId -> categoryId */
  answers: Record<string, string>;
}

export interface Question {
  id: string; // stable forever
  certificationId: string;
  /** Exam versions this question applies to. Defaults to every version its primary concept maps to. */
  exams?: ExamVersion[];
  conceptIds: string[]; // first entry is the primary concept
  difficulty: Difficulty;
  type: QuestionType;
  /** Optional scenario paragraph shown above the stem. */
  scenario?: string;
  stem: string;
  options: AnswerOption[];
  /** single/multiple/truefalse: the correct ids. ordering: ids in the correct order. matching: unused (see `matching`). */
  correctAnswerIds: string[];
  matching?: MatchingSpec;
  explanation: string;
  /** Why each wrong option is wrong, keyed by option id. */
  distractorExplanations: Record<string, string>;
  /** Bump when the stem/options/key change. Attempts store the version they saw. */
  version: number;
  source: { kind: "original"; note?: string };
  /** Optional asset path under /public for a diagram (none yet). */
  image?: { src: string; alt: string };
}

// ---------- Learner data ----------

export interface UserPreferences {
  theme: "dark" | "light";
  askConfidence: boolean;
  reducedMotion: "system" | "reduce";
}

export interface StudyGoal {
  dailyQuestions: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  selectedCertification: string;
  examVersion: ExamVersion;
  studyGoal: StudyGoal;
  preferences: UserPreferences;
  createdAt: string;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  questionVersion: number;
  sessionId: string;
  /** Picked ids; for ordering the submitted order; for matching "optionId:categoryId" pairs. */
  selectedAnswerIds: string[];
  /** Correctness as graded at the time (historical record). */
  isCorrect: boolean;
  confidence?: Confidence;
  durationMs: number;
  completedAt: string; // ISO
}

export type SessionStatus = "active" | "completed" | "abandoned";

export interface SessionAnswer {
  selectedAnswerIds: string[];
  isCorrect: boolean;
  confidence?: Confidence;
  attemptId: string;
}

export interface StudySession {
  id: string;
  type: StudyMode;
  startedAt: string;
  completedAt?: string;
  lastActiveAt: string;
  questionIds: string[];
  currentQuestionIndex: number;
  status: SessionStatus;
  answers: Record<string, SessionAnswer>;
  flagged: string[];
  /** Questions appended mid-session to retest a missed concept with a new scenario. */
  retestQuestionIds: string[];
}

/** Imported study history used before the app has its own evidence. */
export type SeedPrior = "weak" | "strong";

export interface AppData {
  schemaVersion: number;
  profile: UserProfile;
  attempts: QuestionAttempt[];
  sessions: StudySession[];
  /** conceptId -> prior. Cleared per concept once real attempts exist (see mastery). */
  seedPriors: Record<string, SeedPrior>;
  blitz: BlitzState;
}

/** Blitz drills never touch mastery; they only track which questions were drilled out of the pool. */
export interface BlitzState {
  /** Questions answered right 3 times in a blitz: no longer offered in blitzes. */
  cleared: string[];
  lastStartedAt?: string;
}

// ---------- Derived (never stored) ----------

export interface ConceptMastery {
  conceptId: string;
  /** Leitner-style box 0–5. Explainable, not a percentage. */
  box: number;
  masteryLabel: "New" | "Needs work" | "Learning" | "Familiar" | "Mastered";
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  guessedCorrectAttempts: number;
  confidentMisses: number;
  distinctQuestionsCorrect: number;
  lastPracticedAt?: string;
  nextReviewAt?: string;
  lastResult?: "correct-knew" | "correct-guess" | "incorrect" | "incorrect-confident" | "correct";
  seed?: SeedPrior;
  /** Plain-language reasons behind the box, for the UI. */
  reasons: string[];
}

export interface StreakRecord {
  date: string; // YYYY-MM-DD, local
  completedSessions: number;
  questionsAnswered: number;
  qualifyingActivity: boolean;
  totalStudyTimeMs: number;
}
