"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Timer, X, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { questionById } from "@/content/catalog";
import { isAnswerCorrect } from "@/lib/engine/scoring";
import { BLITZ_SECONDS, BLITZ_SIZE, BLITZ_WINS_NEEDED, blitzPool, blitzWaitMs, pickBlitz } from "@/lib/engine/blitz";
import { Button, Card, PageHeader, ProgressBar, cx } from "@/components/ui";

interface Run {
  queue: string[];
  wins: Record<string, number>;
  total: number;
}
type Feedback = { correct: boolean; timedOut: boolean };

/**
 * Blitz: 8-second drills on missed or guessed questions. Results never touch
 * mastery or the review queue; a question answered right 3 times leaves the blitz pool.
 */
export default function BlitzPage() {
  const { ready, data, derived, startBlitz, clearBlitzQuestion } = useStore();
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pool = useMemo(() => blitzPool(data, derived.exam.questions), [data, derived.exam.questions]);
  const wait = blitzWaitMs(data, now);

  function start() {
    const ids = pickBlitz(pool);
    if (!ids.length || wait > 0) return;
    startBlitz();
    setRun({ queue: ids, wins: {}, total: ids.length });
  }

  if (run) return <BlitzRun run={run} setRun={setRun} onCleared={clearBlitzQuestion} />;

  const mins = Math.ceil(wait / 60000);
  return (
    <>
      <PageHeader title="Blitz" subtitle="Fast drills on questions you missed or guessed." />
      <Card className="max-w-2xl">
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>
            Up to {BLITZ_SIZE} questions you missed or guessed, {BLITZ_SECONDS} seconds each.
          </li>
          <li>Questions keep coming back until you get each one right {BLITZ_WINS_NEEDED} times.</li>
          <li>Blitz answers don&apos;t count toward your scores or review queue. A question you finish leaves the blitz pool.</li>
          <li>One blitz every 30 minutes.</li>
        </ul>
        {!ready ? null : pool.length === 0 ? (
          <p className="text-sm">Nothing to blitz yet. Missed or guessed questions from practice show up here.</p>
        ) : wait > 0 ? (
          <p className="flex items-center gap-2 text-sm">
            <Timer className="size-4" aria-hidden /> Next blitz in {mins} minute{mins === 1 ? "" : "s"}. {pool.length} question{pool.length === 1 ? "" : "s"} waiting.
          </p>
        ) : (
          <Button variant="primary" onClick={start}>
            <Zap className="size-4" aria-hidden /> Start blitz ({Math.min(BLITZ_SIZE, pool.length)} questions)
          </Button>
        )}
      </Card>
    </>
  );
}

function BlitzRun({ run, setRun, onCleared }: { run: Run; setRun(r: Run | null): void; onCleared(id: string): void }) {
  const qid = run.queue[0];
  const question = qid ? questionById.get(qid) : undefined;
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [left, setLeft] = useState(BLITZ_SECONDS * 1000);
  const deadline = useRef(0);
  const done = run.queue.length === 0;

  // Fresh clock for each question shown.
  useEffect(() => {
    deadline.current = Date.now() + BLITZ_SECONDS * 1000;
  }, [run]);

  useEffect(() => {
    if (feedback || done) return;
    const t = setInterval(() => {
      const ms = deadline.current - Date.now();
      setLeft(Math.max(0, ms));
      if (ms <= 0) setFeedback({ correct: false, timedOut: true });
    }, 100);
    return () => clearInterval(t);
  }, [feedback, done, run]);

  // After showing the result, move on: a right answer counts a win, anything else goes to the back.
  useEffect(() => {
    if (!feedback || !qid) return;
    const t = setTimeout(
      () => {
        const wins = { ...run.wins, [qid]: (run.wins[qid] ?? 0) + (feedback.correct ? 1 : 0) };
        const rest = run.queue.slice(1);
        const finished = wins[qid] >= BLITZ_WINS_NEEDED;
        if (finished) onCleared(qid);
        setSelected([]);
        setFeedback(null);
        setLeft(BLITZ_SECONDS * 1000);
        setRun({ ...run, wins, queue: finished ? rest : [...rest, qid] });
      },
      feedback.correct ? 900 : 2200,
    );
    return () => clearTimeout(t);
  }, [feedback, qid, run, setRun, onCleared]);

  if (done || !question) {
    return (
      <>
        <PageHeader title="Blitz complete" />
        <Card className="max-w-2xl">
          <p className="mb-4 text-sm">
            You cleared all {run.total} question{run.total === 1 ? "" : "s"}. They&apos;re out of the blitz pool now.
          </p>
          <Button variant="primary" onClick={() => setRun(null)}>
            Back to Blitz
          </Button>
        </Card>
      </>
    );
  }

  const multi = question.type === "multiple";
  function submit(ids: string[]) {
    if (feedback) return;
    setFeedback({ correct: isAnswerCorrect(question!, ids), timedOut: false });
  }
  function pick(id: string) {
    if (feedback) return;
    if (!multi) {
      setSelected([id]);
      submit([id]);
    } else setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const clearedCount = run.total - new Set(run.queue).size;
  const wins = run.wins[qid] ?? 0;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Zap className="size-5 text-accent" aria-hidden /> Blitz
        </h1>
        <span className="text-sm text-muted">
          {clearedCount}/{run.total} cleared · this one {wins}/{BLITZ_WINS_NEEDED}
        </span>
        <Button variant="ghost" className="ml-auto" onClick={() => setRun(null)}>
          Quit
        </Button>
      </div>
      <Card className="max-w-3xl">
        <ProgressBar value={left} max={BLITZ_SECONDS * 1000} label="Time left" tone={left < 3000 ? "warning" : "accent"} />
        {question.scenario && <p className="mt-4 text-sm text-muted">{question.scenario}</p>}
        <p className="mb-4 mt-3 font-medium">{question.stem}</p>
        {multi && <p className="mb-2 text-xs text-muted">Choose {question.correctAnswerIds.length}.</p>}
        <div className="flex flex-col gap-2">
          {question.options.map((o) => {
            const isRight = question.correctAnswerIds.includes(o.id);
            const isPicked = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o.id)}
                disabled={!!feedback}
                className={cx(
                  "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                  feedback && isRight
                    ? "border-success bg-success/10"
                    : feedback && isPicked
                      ? "border-danger bg-danger/10"
                      : isPicked
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-surface-2 hover:border-accent",
                )}
              >
                <span className="flex-1">{o.text}</span>
                {feedback && isRight && <Check className="size-4 text-success" aria-hidden />}
                {feedback && isPicked && !isRight && <X className="size-4 text-danger" aria-hidden />}
              </button>
            );
          })}
        </div>
        {multi && !feedback && (
          <Button variant="primary" className="mt-3" disabled={!selected.length} onClick={() => submit(selected)}>
            Submit
          </Button>
        )}
        {feedback && (
          <p role="status" className={cx("mt-3 text-sm font-medium", feedback.correct ? "text-success" : "text-danger")}>
            {feedback.correct ? "Right!" : feedback.timedOut ? "Time's up. It'll come back." : "Not quite. It'll come back."}
          </p>
        )}
      </Card>
    </>
  );
}
