"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, LogOut, RefreshCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { conceptById, questionById } from "@/content/catalog";
import { canSubmit, parsePairs, partialScore, toggleSelection } from "@/lib/engine/scoring";
import { answeredCount, resumeIndex, shuffledOptionIds } from "@/lib/engine/session";
import type { Confidence, Question, StudySession } from "@/lib/types";
import { QuestionCard } from "@/components/QuestionCard";
import { SessionResults } from "@/components/SessionResults";
import { Button, ButtonLink, Card, cx } from "@/components/ui";
import { MODE_INFO } from "@/components/useStart";

export default function SessionPage() {
  const { data, derived } = useStore();
  const active = derived.activeSession;

  if (active) return <SessionRunner key={active.id} session={active} />;

  const last = [...data.sessions]
    .filter((s) => s.status === "completed")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  if (last) return <SessionResults session={last} />;

  return (
    <Card>
      <p className="mb-4">No session in progress.</p>
      <ButtonLink href="/practice/" variant="primary">
        Choose a practice mode
      </ButtonLink>
    </Card>
  );
}

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "knew", label: "Knew it" },
  { value: "educated", label: "Educated guess" },
  { value: "random", label: "Random guess" },
];

function SessionRunner({ session }: { session: StudySession }) {
  const { answer, setConfidence, goTo, toggleFlag, finishSession, data } = useStore();
  const askConfidence = data.profile.preferences.askConfidence;

  // On first mount, jump to the first unanswered question (resume behaviour).
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    const idx = resumeIndex(session);
    if (idx !== session.currentQuestionIndex) goTo(idx);
  }, [session, goTo]);

  const index = session.currentQuestionIndex;
  const qid = session.questionIds[index];
  const question = questionById.get(qid);
  const total = session.questionIds.length;
  const done = answeredCount(session);
  const existing = session.answers[qid];
  const isLast = index === total - 1;
  const allAnswered = done === total;

  // Per-question UI state is keyed by question id so it resets when the question changes.
  const [selection, setSelection] = useState<{ qid: string; ids: string[] }>({ qid: "", ids: [] });
  const isOrdering = question?.type === "ordering";
  const selected = selection.qid === qid ? selection.ids : [];
  const setSelected = (fn: (s: string[]) => string[]) => setSelection((cur) => ({ qid, ids: fn(cur.qid === qid ? cur.ids : []) }));
  const [whyFor, setWhyFor] = useState<string | null>(null);
  const showWhy = whyFor === qid;
  const setShowWhy = () => setWhyFor(qid);
  const startedAt = useRef(0);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    window.scrollTo({ top: 0 });
  }, [qid]);

  const order = useMemo(() => (question ? shuffledOptionIds(question, session.id) : []), [question, session.id]);
  // Ordering questions start from the shuffled order; the learner rearranges it.
  const working = isOrdering && selection.qid !== qid ? order : selected;

  function submit() {
    if (!question || existing || !canSubmit(question, working)) return;
    answer(question.id, working, Date.now() - startedAt.current);
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }

  /** Leave it unanswered, flag it for review, and move on (wrapping to the next unanswered one). */
  function skipQuestion() {
    if (!question || existing) return;
    if (!flagged) toggleFlag(qid);
    const after = [...session.questionIds.slice(index + 1), ...session.questionIds.slice(0, index)];
    const target = after.find((id) => !session.answers[id]);
    if (target) goTo(session.questionIds.indexOf(target));
  }

  function next() {
    if (!isLast) goTo(index + 1);
    else if (allAnswered) finishSession();
    else goTo(session.questionIds.findIndex((id) => !session.answers[id]));
  }

  // Keyboard: 1–9 choose options, Enter submits / continues.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!question) return;
      const n = Number(e.key);
      const choice = question.type !== "ordering" && question.type !== "matching";
      if (choice && !existing && n >= 1 && n <= order.length) {
        setSelected((s) => toggleSelection(question, s, order[n - 1]));
        e.preventDefault();
      } else if (e.key === "Enter" && target.tagName !== "BUTTON" && target.tagName !== "A") {
        if (existing) next();
        else submit();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!question) {
    return (
      <Card>
        <p>This question is no longer in the bank.</p>
        <Button className="mt-3" onClick={next}>
          Skip
        </Button>
      </Card>
    );
  }

  const flagged = session.flagged.includes(qid);
  const retestAdded = existing && !existing.isCorrect && session.retestQuestionIds.length > 0 &&
    session.retestQuestionIds.some((id) => session.questionIds.indexOf(id) > index && !session.answers[id]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-accent">{MODE_INFO[session.type].title}</p>
          <p className="text-xs text-muted">
            {done} of {total} answered · saved automatically
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => toggleFlag(qid)} aria-pressed={flagged}>
            <Flag className={cx("size-4", flagged && "fill-warning text-warning")} aria-hidden />
            {flagged ? "Flagged" : "Flag"}
          </Button>
          <ButtonLink href="/" variant="ghost">
            <LogOut className="size-4" aria-hidden /> Pause
          </ButtonLink>
        </div>
      </div>

      <Navigator session={session} onGo={goTo} />

      <Card as="div" className="mt-4 animate-in" key={qid}>
        <QuestionCard
          question={question}
          examVersion={data.profile.examVersion}
          onSetSelection={(ids) => setSelection({ qid, ids })}
          number={index + 1}
          total={total}
          optionOrder={order}
          selected={working}
          onToggle={(id) => setSelected((s) => toggleSelection(question, s, id))}
          answer={existing}
        />

        {!existing && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {question.type === "multiple"
                ? `${selected.length} of ${question.correctAnswerIds.length} selected`
                : question.type === "matching"
                  ? `${parsePairs(working).size} of ${question.options.length} sorted`
                  : question.type === "ordering"
                    ? "Arrange the steps, then submit."
                    : "Choose an answer. Keys 1–4 select, Enter submits."}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={skipQuestion}>
                Skip
              </Button>
              <Button variant="primary" onClick={submit} disabled={!canSubmit(question, working)}>
                Submit answer
              </Button>
            </div>
          </div>
        )}

        {existing && (
          <div ref={feedbackRef} tabIndex={-1} className="mt-5 space-y-4 outline-none" aria-live="polite">
            <Feedback question={question} selected={existing.selectedAnswerIds} correct={existing.isCorrect} showWhy={showWhy} onShowWhy={setShowWhy} />

            {retestAdded && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <RefreshCcw className="size-4 text-accent" aria-hidden />
                A different scenario on this concept was added later in this session.
              </p>
            )}

            {askConfidence && (
              <fieldset className="rounded-xl border border-line p-3">
                <legend className="px-1 text-sm text-muted">How confident were you? (optional)</legend>
                <div className="flex flex-wrap gap-2">
                  {CONFIDENCE_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      aria-pressed={existing.confidence === c.value}
                      onClick={() => setConfidence(qid, c.value)}
                      className={cx(
                        "min-h-11 rounded-lg border px-3 text-sm transition",
                        existing.confidence === c.value ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-accent/60",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => goTo(index - 1)} disabled={index === 0}>
                <ArrowLeft className="size-4" aria-hidden /> Previous
              </Button>
              <Button variant="primary" onClick={next} className="min-w-44">
                {isLast && allAnswered ? "Finish session" : isLast ? "Go to unanswered" : "Next question"}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {done > 0 && !allAnswered && (
        <div className="mt-4 text-center">
          <button type="button" className="text-sm text-muted underline hover:text-fg" onClick={finishSession}>
            End session now and see results ({done} answered)
          </button>
        </div>
      )}
    </div>
  );
}

function Feedback({ question, selected, correct, showWhy, onShowWhy }: { question: Question; selected: string[]; correct: boolean; showWhy: boolean; onShowWhy(): void }) {
  const wrongPicks = selected.filter((id) => !question.correctAnswerIds.includes(id) && question.distractorExplanations[id]);
  const primary = conceptById.get(question.conceptIds[0]);
  return (
    <div className={cx("rounded-xl border p-4", correct ? "border-success/40 bg-success-soft" : "border-danger/40 bg-danger-soft")}>
      <p className={cx("font-semibold", correct ? "text-success" : "text-danger")}>
        {correct ? "Correct" : "Incorrect"}
        {(question.type === "ordering" || question.type === "matching") && !correct && (
          <span className="ml-2 font-normal text-muted">
            {partialScore(question, selected).right} of {partialScore(question, selected).total} placed correctly
          </span>
        )}
      </p>
      {correct && !showWhy ? (
        <button type="button" onClick={onShowWhy} className="mt-1 text-sm text-muted underline hover:text-fg">
          Show explanation
        </button>
      ) : (
        <div className="mt-1 space-y-2 text-sm">
          <p>{question.explanation}</p>
          {wrongPicks.map((id) => (
            <p key={id} className="text-muted">
              <span className="font-medium text-fg">Your pick: </span>
              {question.distractorExplanations[id]}
            </p>
          ))}
          {primary && (
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href={`/review/#${primary.id}`} className="text-accent underline">
                Explain more: {primary.name}
              </Link>
              {!correct && (
                <Link href={`/buddy/#${primary.id}`} className="text-accent underline">
                  Talk it through with the study buddy
                </Link>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Navigator({ session, onGo }: { session: StudySession; onGo(i: number): void }) {
  return (
    <nav aria-label="Question navigation">
      <ol className="flex flex-wrap gap-1.5">
        {session.questionIds.map((id, i) => {
          const a = session.answers[id];
          const current = i === session.currentQuestionIndex;
          const flagged = session.flagged.includes(id);
          const state = a ? (a.isCorrect ? "correct" : "incorrect") : "unanswered";
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onGo(i)}
                aria-current={current ? "step" : undefined}
                aria-label={`Question ${i + 1}, ${state}${flagged ? ", flagged" : ""}`}
                className={cx(
                  "relative grid size-9 place-items-center rounded-lg border text-xs font-medium tabular-nums",
                  a?.isCorrect && "border-success/50 bg-success-soft text-success",
                  a && !a.isCorrect && "border-danger/50 bg-danger-soft text-danger",
                  !a && "border-line text-muted",
                  current && "ring-2 ring-accent",
                )}
              >
                {i + 1}
                {flagged && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-warning" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
