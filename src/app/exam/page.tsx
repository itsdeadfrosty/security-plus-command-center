"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ClipboardCheck, Clock, Flag, XCircle } from "lucide-react";
import type { MockExam, Question } from "@/lib/types";
import { PBQ_TYPES } from "@/lib/types";
import { useStore } from "@/lib/store";
import { conceptName, exams, questionById, questionDomain } from "@/content/catalog";
import { toggleSelection } from "@/lib/engine/scoring";
import { shuffledOptionIds } from "@/lib/engine/session";
import { MOCK_LENGTHS, PASS_SCALED, gradeMockExam, timeLeftMs } from "@/lib/engine/mockExam";
import { QuestionCard } from "@/components/QuestionCard";
import { Badge, Button, ButtonLink, Card, CardTitle, PageHeader, ProgressBar, Stat, cx } from "@/components/ui";

const getQuestion = (id: string) => questionById.get(id);

function clock(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export default function ExamPage() {
  const { data, derived } = useStore();
  const [viewId, setViewId] = useState<string>();
  const active = derived.activeMock;
  const viewing = data.mockExams.find((m) => m.id === viewId && m.status === "completed");

  if (active) return <RunningExam mock={active} onFinished={() => setViewId(active.id)} />;
  if (viewing) return <Results mock={viewing} onBack={() => setViewId(undefined)} />;
  return <Setup onView={setViewId} />;
}

function Setup({ onView }: { onView(id: string): void }) {
  const { data, derived, startMock } = useStore();
  const [length, setLength] = useState<number>(90);
  const [error, setError] = useState("");
  const cert = derived.exam.certification;
  const past = data.mockExams.filter((m) => m.status === "completed" && m.examVersion === derived.exam.version).reverse();

  return (
    <div className="animate-in max-w-3xl">
      <PageHeader
        title="Practice Exam"
        subtitle={`A timed run modeled on the real ${cert.examVersion}: questions from every domain in exam proportions, hands-on questions first, and no answers shown until you finish.`}
      />
      <Card className="mb-4" aria-labelledby="mock-h">
        <CardTitle id="mock-h" icon={<ClipboardCheck className="size-4" aria-hidden />}>
          Start a practice exam
        </CardTitle>
        <div className="mb-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Exam length">
          {MOCK_LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={length === n}
              onClick={() => setLength(n)}
              className={cx("rounded-xl border p-3 text-left", length === n ? "border-accent bg-accent-soft" : "border-line hover:border-accent/60")}
            >
              <span className="block font-semibold">{n} questions</span>
              <span className="block text-xs text-muted">{n} minutes{n === cert.maxQuestions ? " · full length" : ""}</span>
            </button>
          ))}
        </div>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Go back, change answers and flag questions any time before you finish.</li>
          <li>When the clock runs out, the exam is scored as it stands.</li>
          <li>Hands-on (drag-and-drop) questions earn partial credit, like the real exam.</li>
          <li>Practice exams don&apos;t change your topic progress or course completion. They show whether you&apos;re ready.</li>
        </ul>
        <Button
          variant="primary"
          onClick={() => {
            if (!startMock(length)) setError("There aren't enough questions for this exam yet.");
          }}
        >
          Start {length}-question exam <ArrowRight className="size-4" aria-hidden />
        </Button>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>

      {past.length > 0 && (
        <Card aria-labelledby="past-h">
          <CardTitle id="past-h">Past practice exams</CardTitle>
          <ul className="divide-y divide-line">
            {past.map((m) => {
              const r = gradeMockExam(m, exams[m.examVersion], getQuestion, (q) => questionDomain(q, m.examVersion));
              return (
                <li key={m.id}>
                  <button type="button" onClick={() => onView(m.id)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left">
                    <span className="text-sm">
                      {new Date(m.startedAt).toLocaleDateString([], { month: "short", day: "numeric" })} · {r.total} questions
                    </span>
                    <span className="flex items-center gap-2 text-sm tabular-nums">
                      {Math.round(r.fraction * 100)}% · ~{r.scaled}
                      <Badge tone={r.passed ? "success" : "danger"}>{r.passed ? "Pass" : "Not yet"}</Badge>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function RunningExam({ mock, onFinished }: { mock: MockExam; onFinished(): void }) {
  const { updateMock } = useStore();
  const [now, setNow] = useState(() => new Date());
  const [confirming, setConfirming] = useState(false);
  const total = mock.questionIds.length;
  const index = Math.min(mock.current, total - 1);
  const qid = mock.questionIds[index];
  const question = getQuestion(qid);
  const left = timeLeftMs(mock, now);
  const answeredCount = mock.questionIds.filter((id) => mock.answers[id]?.length).length;
  const flagged = mock.flagged.includes(qid);
  const order = useMemo(() => (question ? shuffledOptionIds(question, mock.id) : []), [question, mock.id]);
  const stored = mock.answers[qid];
  // Ordering questions start from the shuffled order; it only counts as answered once rearranged.
  const selected = stored ?? (question?.type === "ordering" ? order : []);

  function finish() {
    updateMock((m) => ({ ...m, status: "completed", finishedAt: new Date().toISOString() }));
    onFinished();
  }

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left <= 0]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [qid]);

  const setAnswer = (ids: string[]) => updateMock((m) => ({ ...m, answers: { ...m.answers, [qid]: ids } }));
  const goTo = (i: number) => updateMock((m) => ({ ...m, current: Math.max(0, Math.min(total - 1, i)) }));

  if (!question) {
    // A question was retired mid-exam: skip past it.
    return (
      <Card>
        <p className="mb-3 text-sm">This question is no longer available.</p>
        <Button onClick={() => goTo(index + 1)}>Next question</Button>
      </Card>
    );
  }

  return (
    <div className="animate-in mx-auto max-w-3xl">
      <div className="sticky top-0 z-10 -mx-4 mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur">
        <span className={cx("flex items-center gap-1.5 font-mono text-lg tabular-nums", left < 5 * 60_000 && "text-danger")} role="timer" aria-label="Time left">
          <Clock className="size-4" aria-hidden /> {clock(left)}
        </span>
        <span className="text-sm text-muted tabular-nums">
          {answeredCount} of {total} answered
        </span>
        <Button variant="primary" onClick={() => setConfirming(true)}>
          Finish exam
        </Button>
      </div>

      {confirming && (
        <Card className="mb-4 border-warning/50" as="div">
          <p className="mb-3 text-sm">
            {answeredCount < total
              ? `You have ${total - answeredCount} unanswered question${total - answeredCount === 1 ? "" : "s"}. They'll count as wrong.`
              : "All questions answered."}{" "}
            {mock.flagged.length > 0 && `${mock.flagged.length} flagged for review.`} Finish and see your score?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={finish}>
              Finish and score
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep going
            </Button>
          </div>
        </Card>
      )}

      <Card as="div" key={qid}>
        <QuestionCard
          question={question}
          examVersion={mock.examVersion}
          number={index + 1}
          total={total}
          optionOrder={order}
          selected={selected}
          onToggle={(id) => setAnswer(toggleSelection(question, selected, id))}
          onSetSelection={setAnswer}
          revealCorrectness={false}
        />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button onClick={() => goTo(index - 1)} disabled={index === 0}>
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Button>
          <Button
            variant="ghost"
            aria-pressed={flagged}
            onClick={() => updateMock((m) => ({ ...m, flagged: flagged ? m.flagged.filter((x) => x !== qid) : [...m.flagged, qid] }))}
          >
            <Flag className={cx("size-4", flagged && "fill-warning text-warning")} aria-hidden /> {flagged ? "Flagged" : "Flag for review"}
          </Button>
          {index < total - 1 ? (
            <Button variant="primary" onClick={() => goTo(index + 1)}>
              Next <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setConfirming(true)}>
              Finish exam
            </Button>
          )}
        </div>
      </Card>

      <Card className="mt-4" as="div">
        <p className="mb-2 text-xs text-muted">Jump to a question. Flagged ones are marked; answered ones are filled.</p>
        <div className="flex flex-wrap gap-1.5">
          {mock.questionIds.map((id, i) => {
            const done = !!mock.answers[id]?.length;
            const flag = mock.flagged.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Question ${i + 1}${done ? ", answered" : ""}${flag ? ", flagged" : ""}`}
                aria-current={i === index ? "step" : undefined}
                className={cx(
                  "size-9 rounded-lg border text-xs tabular-nums",
                  i === index ? "border-accent ring-2 ring-accent/40" : "border-line",
                  done ? "bg-accent-soft" : "bg-surface-2",
                  flag && "border-warning text-warning",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Results({ mock, onBack }: { mock: MockExam; onBack(): void }) {
  const r = gradeMockExam(mock, exams[mock.examVersion], getQuestion, (q) => questionDomain(q, mock.examVersion));
  const pct = Math.round(r.fraction * 100);
  const took = mock.finishedAt ? Date.parse(mock.finishedAt) - Date.parse(mock.startedAt) : 0;

  return (
    <div className="animate-in max-w-3xl">
      <PageHeader title="Practice exam results" actions={<Button onClick={onBack}>Back</Button>} />
      <Card className="mb-4" aria-labelledby="score-h">
        <CardTitle id="score-h" icon={<ClipboardCheck className="size-4" aria-hidden />}>
          Your score
        </CardTitle>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <p className="text-3xl font-semibold tabular-nums">
            ~{r.scaled} <span className="text-base font-normal text-muted">/ 900</span>
          </p>
          <Badge tone={r.passed ? "success" : "danger"}>{r.passed ? `Above the ${PASS_SCALED} pass mark` : `Below the ${PASS_SCALED} pass mark`}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Correct" value={`${pct}%`} hint={`${Math.round(r.points * 10) / 10} of ${r.total} points`} />
          <Stat label="Answered" value={`${r.answered}/${r.total}`} />
          <Stat label="Time used" value={clock(took)} />
        </div>
        <p className="mt-3 text-xs text-muted">
          The score is a rough estimate on the 100–900 scale, not your official score. CompTIA doesn&apos;t publish how raw answers convert.
        </p>
      </Card>

      <Card className="mb-4" aria-labelledby="dom-h">
        <CardTitle id="dom-h">By domain</CardTitle>
        <ul className="space-y-3">
          {r.byDomain.map((d) => (
            <li key={d.domainId}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span>
                  {d.domainId.replace(".0", "")}. {d.name}
                </span>
                <span className="text-xs tabular-nums text-muted">{Math.round((d.points / d.total) * 100)}%</span>
              </div>
              <ProgressBar value={d.points} max={d.total} label={`${d.name} score`} tone={d.points / d.total >= 0.82 ? "success" : "accent"} />
            </li>
          ))}
        </ul>
      </Card>

      {r.missedConcepts.length > 0 && (
        <Card className="mb-4" aria-labelledby="weak-h">
          <CardTitle id="weak-h">Topics to shore up</CardTitle>
          <p className="mb-3 text-sm text-muted">Talk one through with the study buddy, or run the circuit to lock them in.</p>
          <ul className="flex flex-wrap gap-2">
            {r.missedConcepts.slice(0, 12).map((c) => (
              <li key={c.conceptId}>
                <Link href={`/buddy/#${c.conceptId}`} className="inline-block rounded-lg border border-line px-2.5 py-1 text-sm hover:border-accent">
                  {conceptName(c.conceptId)}
                  {c.count > 1 && <span className="text-muted"> ×{c.count}</span>}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <ButtonLink href="/">Back to the dashboard</ButtonLink>
          </div>
        </Card>
      )}

      {r.missed.length > 0 && (
        <Card aria-labelledby="missed-h">
          <CardTitle id="missed-h">Questions you missed ({r.missed.length})</CardTitle>
          <ul className="divide-y divide-line">
            {r.missed.map((x) => (
              <Missed key={x.question.id} question={x.question} selected={x.selected} n={mock.questionIds.indexOf(x.question.id) + 1} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Missed({ question: q, selected, n }: { question: Question; selected: string[]; n: number }) {
  const [open, setOpen] = useState(false);
  const pbq = PBQ_TYPES.includes(q.type);
  const text = (ids: string[]) => ids.map((id) => q.options.find((o) => o.id === id)?.text).join("; ");
  return (
    <li className="py-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 py-1 text-left">
        <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
        <span className="flex-1 text-sm">
          <span className="text-muted">{n}. </span>
          <span className="block text-xs font-medium text-accent">{conceptName(q.conceptIds[0])}</span>
          {q.stem}
        </span>
        <ChevronDown className={cx("mt-0.5 size-4 shrink-0 text-muted transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="ml-8 mt-2 space-y-1.5 text-sm">
          {!pbq && (
            <>
              <p>
                <span className="text-muted">Your answer: </span>
                {selected.length ? text(selected) : "Not answered"}
              </p>
              <p>
                <span className="text-muted">Correct: </span>
                {text(q.correctAnswerIds)}
              </p>
            </>
          )}
          {pbq && <p className="text-muted">{selected.length ? "Partly right." : "Not answered."}</p>}
          <p className="text-muted">{q.explanation}</p>
        </div>
      )}
    </li>
  );
}
