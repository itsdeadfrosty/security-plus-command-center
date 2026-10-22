"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, CircleHelp, Clock, XCircle } from "lucide-react";
import type { StudySession } from "@/lib/types";
import { useStore } from "@/lib/store";
import { conceptName, questionById } from "@/content/catalog";
import { formatDuration } from "@/lib/engine/stats";
import { Badge, Button, ButtonLink, Card, CardTitle, PageHeader, Stat, cx } from "./ui";
import { MODE_INFO, useStartSession } from "./useStart";

export function SessionResults({ session }: { session: StudySession }) {
  const { data } = useStore();
  const { start, message } = useStartSession();
  const attempts = data.attempts.filter((a) => a.sessionId === session.id);
  const answered = session.questionIds.filter((id) => session.answers[id]);
  const correct = answered.filter((id) => session.answers[id].isCorrect);
  const guessedCorrect = correct.filter((id) => {
    const c = session.answers[id].confidence;
    return c === "educated" || c === "random";
  });
  const missed = answered.filter((id) => !session.answers[id].isCorrect);
  const time = attempts.reduce((s, a) => s + Math.min(a.durationMs, 5 * 60_000), 0);
  const missedConcepts = [...new Set(missed.flatMap((id) => questionById.get(id)?.conceptIds.slice(0, 1) ?? []))];
  const pct = answered.length ? Math.round((correct.length / answered.length) * 100) : 0;
  // The circuit is an endless loop of 10-question labs.
  const circuit = session.type === "circuit";

  return (
    <div className="mx-auto max-w-3xl animate-in">
      <PageHeader title="Session complete" subtitle={`${MODE_INFO[session.type].title} · finished ${new Date(session.completedAt ?? session.lastActiveAt).toLocaleString()}`} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Score" value={`${correct.length}/${answered.length}`} hint={`${pct}%`} />
        <Stat label="Missed" value={missed.length} hint="Added to review" />
        <Stat label="Correct guesses" value={guessedCorrect.length} hint="Scheduled for review" />
        <Stat label="Time" value={formatDuration(time)} />
      </div>

      {missedConcepts.length > 0 && (
        <Card className="mb-4">
          <CardTitle>Concepts to revisit</CardTitle>
          <div className="flex flex-wrap gap-2">
            {missedConcepts.map((c) => (
              <Badge key={c} tone="danger">
                {conceptName(c)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <CardTitle>Review your answers</CardTitle>
        <ul className="divide-y divide-line">
          {answered.map((id, i) => (
            <AnswerRow key={id} n={i + 1} questionId={id} session={session} />
          ))}
        </ul>
        {answered.length < session.questionIds.length && (
          <p className="mt-3 text-sm text-muted">{session.questionIds.length - answered.length} question(s) were left unanswered and aren&apos;t counted.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        {circuit && (
          <Button variant="primary" onClick={() => start("circuit")}>
            New lab <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
        {missed.length + guessedCorrect.length > 0 ? (
          <ButtonLink href="/review/" variant={circuit ? "secondary" : "primary"}>
            Review weak concepts {!circuit && <ArrowRight className="size-4" aria-hidden />}
          </ButtonLink>
        ) : null}
        {!circuit && (
          <Button variant={missed.length ? "secondary" : "primary"} onClick={() => start("quick")}>
            Start another quick session
          </Button>
        )}
        <ButtonLink href="/" variant="ghost">
          Back to dashboard
        </ButtonLink>
      </div>
      {message && <p className="mt-3 text-sm text-warning">{message}</p>}
    </div>
  );
}

function AnswerRow({ n, questionId, session }: { n: number; questionId: string; session: StudySession }) {
  const [open, setOpen] = useState(false);
  const q = questionById.get(questionId);
  const a = session.answers[questionId];
  if (!q) return null;
  const guess = a.confidence === "educated" || a.confidence === "random";
  const text = (ids: string[]) => ids.map((id) => q.options.find((o) => o.id === id)?.text).join("; ");
  return (
    <li className="py-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 py-1 text-left">
        {a.isCorrect ? (
          guess ? <CircleHelp className="mt-0.5 size-5 shrink-0 text-warning" aria-label="Correct guess" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />
        )}
        <span className="flex-1 text-sm">
          <span className="text-muted">{n}. </span>
          <span className="block text-xs font-medium text-accent">{conceptName(q.conceptIds[0])}</span>
          {q.stem}
        </span>
        <ChevronDown className={cx("mt-0.5 size-4 shrink-0 text-muted transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="ml-8 mt-2 space-y-1.5 text-sm">
          <p>
            <span className="text-muted">Your answer: </span>
            {text(a.selectedAnswerIds)}
          </p>
          {!a.isCorrect && (
            <p>
              <span className="text-muted">Correct: </span>
              {text(q.correctAnswerIds)}
            </p>
          )}
          <p className="text-muted">{q.explanation}</p>
          {a.confidence && (
            <p className="flex items-center gap-1 text-xs text-muted">
              <Clock className="size-3" aria-hidden /> Confidence: {a.confidence === "knew" ? "Knew it" : a.confidence === "educated" ? "Educated guess" : "Random guess"}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
