"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, Confidence, ConceptMastery, Question, QuestionAttempt, StudyMode, StudySession, UserProfile } from "@/lib/types";
import { PBQ_TYPES } from "@/lib/types";
import { isAnswerCorrect } from "@/lib/engine/scoring";
import { conceptById, conceptDomain, conceptObjective, examContent, questionById, questionDomain, seedPriors, type ExamContent } from "@/content/catalog";
import { computeReadiness, type Readiness } from "@/lib/engine/circuit";
import { computeMastery } from "@/lib/engine/mastery";
import { pickRetestQuestion, recommendMode, reviewPriority, selectQuestions, type Recommendation } from "@/lib/engine/selection";
import {
  appendRetest,
  completeSession,
  createSession,
  goTo as goToIndex,
  setSessionConfidence,
  submitAnswer,
  toggleFlag as toggleFlagIn,
} from "@/lib/engine/session";
import { buildDailyRecords, summarizeStreak, type StreakSummary } from "@/lib/engine/streak";
import { openBestAdapter, type StorageAdapter } from "@/lib/storage/adapters";
import { loadAppData, saveAppData } from "@/lib/storage/repository";
import { createInitialData } from "@/lib/storage/schema";
import type { StreakRecord } from "@/lib/types";
import { DAY_MS } from "@/lib/engine/time";
import { mergeAppData } from "@/lib/engine/blitz";

const getQuestion = (id: string) => questionById.get(id);

export interface Derived {
  /** Content for the learner's selected exam version. */
  exam: ExamContent;
  /** Mastery for the concepts in the selected exam (progress is shared across versions). */
  mastery: Map<string, ConceptMastery>;
  readiness: Readiness;
  days: Map<string, StreakRecord>;
  streak: StreakSummary;
  recommendation: Recommendation;
  activeSession?: StudySession;
}

interface Store {
  ready: boolean;
  data: AppData;
  derived: Derived;
  storageKind: StorageAdapter["kind"] | "loading";
  warning?: string;
  saveError?: string;
  dismissWarning(): void;
  startSession(mode: StudyMode, focusConceptIds?: string[]): StudySession | null;
  answer(questionId: string, selected: string[], durationMs: number): void;
  setConfidence(questionId: string, confidence: Confidence): void;
  goTo(index: number): void;
  toggleFlag(questionId: string): void;
  finishSession(): void;
  abandonSession(): void;
  updateProfile(patch: Partial<Omit<UserProfile, "id" | "createdAt">>): void;
  replaceData(data: AppData): void;
  /** Merge progress from another device (sync); keeps everything from both sides. */
  mergeData(remote: AppData): void;
  startBlitz(): void;
  clearBlitzQuestion(questionId: string): void;
  resetProgress(): void;
}

const StoreContext = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createInitialData(seedPriors, new Date(0)));
  const [ready, setReady] = useState(false);
  const [storageKind, setStorageKind] = useState<Store["storageKind"]>("loading");
  const [warning, setWarning] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const adapterRef = useRef<StorageAdapter | null>(null);
  // `now` refreshes every minute so due dates and "today" stay current.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Ask the browser not to evict saved progress (Safari clears unprotected site data after a week away).
      void navigator.storage?.persist?.().catch(() => undefined);
      const adapter = await openBestAdapter();
      const result = await loadAppData(adapter, seedPriors, new Date());
      if (cancelled) return;
      adapterRef.current = adapter;
      setStorageKind(adapter.kind);
      setData(result.data);
      const notes = [result.warning];
      if (adapter.kind === "memory") notes.push("This browser is blocking storage, so progress will be lost when you close the tab.");
      setWarning(notes.filter(Boolean).join(" ") || undefined);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change once loaded.
  useEffect(() => {
    if (!ready || !adapterRef.current) return;
    saveAppData(adapterRef.current, data)
      .then(() => setSaveError(undefined))
      .catch(() => setSaveError("Progress couldn't be saved to this browser. Export a backup from Settings."));
  }, [data, ready]);

  const examVersion = data.profile.examVersion;
  const derived = useMemo<Derived>(() => {
    const exam = examContent(examVersion);
    const skipped = new Set(data.sessions.flatMap((s) => s.flagged.flatMap((qid) => getQuestion(qid)?.conceptIds ?? [])));
    const all = computeMastery(data.attempts, getQuestion, exam.conceptIds, data.seedPriors, data.profile.createdAt, skipped);
    const mastery = new Map(exam.conceptIds.map((id) => [id, all.get(id)!]));
    const days = buildDailyRecords(data.attempts, data.sessions);
    const examQuestions = new Map(exam.questions.map((q) => [q.id, q]));
    return {
      exam,
      mastery,
      readiness: computeReadiness(exam.certification, exam.conceptIds, (id) => conceptDomain(id, examVersion), mastery, data.attempts, examQuestions, (id) => conceptObjective(id, examVersion)),
      days,
      streak: summarizeStreak(days, now),
      recommendation: recommendMode(mastery, data.attempts.length, now),
      activeSession: data.sessions.find((s) => s.status === "active"),
    };
  }, [data, now, examVersion]);

  const updateActive = useCallback((fn: (s: StudySession, d: AppData) => Partial<AppData> & { session: StudySession }) => {
    setData((d) => {
      const active = d.sessions.find((s) => s.status === "active");
      if (!active) return d;
      const { session, ...rest } = fn(active, d);
      return { ...d, ...rest, sessions: d.sessions.map((s) => (s.id === active.id ? session : s)) };
    });
  }, []);

  const startSession = useCallback(
    (mode: StudyMode, focusConceptIds?: string[]) => {
      const t = new Date();
      let questions: Question[];
      if (focusConceptIds?.length) {
        // Concept review: new scenarios for this concept and its look-alikes.
        const recentCut = t.getTime() - DAY_MS;
        const recent = new Set(data.attempts.filter((a) => new Date(a.completedAt).getTime() > recentCut).map((a) => a.questionId));
        const [primary, ...partners] = focusConceptIds;
        const isPbq = (q: Question) => Number(PBQ_TYPES.includes(q.type));
        // Unseen first, then hands-on PBQs, then questions contrasting several concepts.
        const rank = (a: Question, b: Question) =>
          Number(recent.has(a.id)) - Number(recent.has(b.id)) || isPbq(b) - isPbq(a) || b.conceptIds.length - a.conceptIds.length;
        // Two scenarios on the concept itself, then one on a look-alike.
        const byConcept = derived.exam.questionsByConcept;
        const own = [...(byConcept.get(primary) ?? [])].sort(rank).slice(0, 2);
        const taken = new Set(own.map((q) => q.id));
        const contrast = partners
          .flatMap((c) => byConcept.get(c) ?? [])
          .filter((q) => !taken.has(q.id))
          .sort(rank)
          .slice(0, 1);
        questions = [...own, ...contrast];
      } else {
        const exam = derived.exam;
        questions = selectQuestions(mode, {
          questions: exam.questions,
          attempts: data.attempts,
          mastery: derived.mastery,
          contrasts: exam.contrasts,
          certification: exam.certification,
          domainOf: (q) => questionDomain(q, exam.version),
          now: t,
        });
      }
      if (!questions.length) return null;
      const session = createSession(mode, questions.map((q) => q.id), t);
      setData((d) => ({
        ...d,
        sessions: [...d.sessions.map((s) => (s.status === "active" ? { ...s, status: "abandoned" as const } : s)), session],
      }));
      return session;
    },
    [data.attempts, derived.mastery, derived.exam],
  );

  const answer = useCallback(
    (questionId: string, selected: string[], durationMs: number) => {
      const question = getQuestion(questionId);
      if (!question) return;
      updateActive((s, d) => {
        if (s.answers[questionId]) return { session: s };
        const t = new Date();
        const res = submitAnswer(s, question, selected, durationMs, t);
        let session = res.session;
        if (!res.attempt.isCorrect) {
          const retest = pickRetestQuestion(question, session.questionIds, examContent(d.profile.examVersion).questionsByConcept, d.attempts, t);
          if (retest) session = appendRetest(session, retest.id);
        }
        return { session, attempts: [...d.attempts, res.attempt] };
      });
    },
    [updateActive],
  );

  const setConfidence = useCallback(
    (questionId: string, confidence: Confidence) => {
      updateActive((s, d) => {
        const ans = s.answers[questionId];
        if (!ans) return { session: s };
        return {
          session: setSessionConfidence(s, questionId, confidence),
          attempts: d.attempts.map((a) => (a.id === ans.attemptId ? { ...a, confidence } : a)),
        };
      });
    },
    [updateActive],
  );

  const goTo = useCallback((index: number) => updateActive((s) => ({ session: goToIndex(s, index, new Date()) })), [updateActive]);
  const toggleFlag = useCallback((qid: string) => updateActive((s) => ({ session: toggleFlagIn(s, qid) })), [updateActive]);
  const finishSession = useCallback(() => updateActive((s) => ({ session: completeSession(s, new Date()) })), [updateActive]);
  const abandonSession = useCallback(() => updateActive((s) => ({ session: { ...s, status: "abandoned" } })), [updateActive]);

  const updateProfile = useCallback((patch: Partial<Omit<UserProfile, "id" | "createdAt">>) => {
    setData((d) => ({
      ...d,
      profile: {
        ...d.profile,
        ...patch,
        preferences: { ...d.profile.preferences, ...patch.preferences },
        studyGoal: { ...d.profile.studyGoal, ...patch.studyGoal },
      },
    }));
  }, []);

  const replaceData = useCallback((next: AppData) => setData(next), []);
  const mergeData = useCallback((remote: AppData) => setData((d) => mergeAppData(d, remote)), []);
  const startBlitz = useCallback(() => setData((d) => ({ ...d, blitz: { ...d.blitz, lastStartedAt: new Date().toISOString() } })), []);
  const clearBlitzQuestion = useCallback(
    (qid: string) => setData((d) => (d.blitz.cleared.includes(qid) ? d : { ...d, blitz: { ...d.blitz, cleared: [...d.blitz.cleared, qid] } })),
    [],
  );
  const resetProgress = useCallback(() => {
    setData((d) => {
      const fresh = createInitialData(seedPriors, new Date());
      return { ...fresh, profile: { ...fresh.profile, preferences: d.profile.preferences } };
    });
  }, []);

  const store: Store = {
    ready,
    data,
    derived,
    storageKind,
    warning,
    saveError,
    dismissWarning: () => setWarning(undefined),
    startSession,
    answer,
    setConfidence,
    goTo,
    toggleFlag,
    finishSession,
    abandonSession,
    updateProfile,
    replaceData,
    mergeData,
    startBlitz,
    clearBlitzQuestion,
    resetProgress,
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside AppProvider");
  return s;
}

/** Concepts sorted by review priority (highest first). */
/**
 * Concepts of questions the learner flagged or skipped lead the review queue
 * until that question is later answered correctly without guessing.
 */
export function flaggedConceptIds(data: AppData): Set<string> {
  const latest = new Map<string, QuestionAttempt>();
  for (const a of data.attempts) {
    const prev = latest.get(a.questionId);
    if (!prev || a.completedAt > prev.completedAt) latest.set(a.questionId, a);
  }
  const ids = new Set<string>();
  for (const s of data.sessions)
    for (const qid of s.flagged) {
      const a = latest.get(qid);
      const q = questionById.get(qid);
      if (!q) continue;
      const cleared = a && isAnswerCorrect(q, a.selectedAnswerIds) && a.confidence !== "educated" && a.confidence !== "random";
      if (!cleared) for (const c of q.conceptIds) ids.add(c);
    }
  return ids;
}

export function rankedConcepts(mastery: Map<string, ConceptMastery>, now = new Date(), flagged: Set<string> = new Set()) {
  return [...mastery.values()]
    .map((m) => ({ m, concept: conceptById.get(m.conceptId)!, priority: reviewPriority(m, now) + (flagged.has(m.conceptId) ? 100 : 0), flagged: flagged.has(m.conceptId) }))
    .filter((x) => x.concept)
    .sort((a, b) => b.priority - a.priority);
}
