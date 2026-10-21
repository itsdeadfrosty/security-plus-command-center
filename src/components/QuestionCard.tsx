"use client";

import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import type { ExamVersion, Question, SessionAnswer } from "@/lib/types";
import { assignCategory, moveItem, parsePairs, requiredSelections } from "@/lib/engine/scoring";
import { domainName, questionDomain } from "@/content/catalog";
import { Badge, cx } from "./ui";

/** Items that look like log lines or firewall rules are shown monospaced. */
const LOGLIKE = /→|(GET|POST|TCP|UDP|sshd)|\.\.\//;

const DIFFICULTY_LABEL = { beginner: "Beginner", intermediate: "Intermediate", exam: "Exam-level", advanced: "Advanced" } as const;

interface Props {
  question: Question;
  examVersion: ExamVersion;
  number: number;
  total: number;
  optionOrder: string[];
  selected: string[];
  onToggle(optionId: string): void;
  /** Ordering/matching replace the whole selection. */
  onSetSelection?(ids: string[]): void;
  /** Present once submitted. */
  answer?: SessionAnswer;
  /** Practice shows correctness; a future exam mode passes false. */
  revealCorrectness?: boolean;
}

/**
 * Renders every supported question type. New types get their own body
 * component and are dispatched here by `type`.
 */
export function QuestionCard(props: Props) {
  const { question, examVersion, number, total, revealCorrectness = true } = props;
  const domainId = questionDomain(question, examVersion) ?? "";
  const stemId = `q-${question.id}-stem`;
  const pbq = question.type === "ordering" || question.type === "matching";

  return (
    <article aria-labelledby={stemId}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-muted">
          Question {number} of {total}
        </span>
        <Badge tone="accent">
          Domain {domainId.replace(".0", "")}: {domainName(domainId, examVersion)}
        </Badge>
        <Badge>{DIFFICULTY_LABEL[question.difficulty]}</Badge>
        {question.type === "multiple" && <Badge tone="warning">Select {requiredSelections(question)}</Badge>}
        {pbq && <Badge tone="warning">Performance-based</Badge>}
      </div>

      {question.scenario && (
        <div
          className={cx(
            "mb-4 whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-4 leading-relaxed",
            question.scenario.includes("\n") ? "font-mono text-[13px] sm:text-sm" : "text-[15px]",
          )}
        >
          {question.scenario}
        </div>
      )}

      {question.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.image.src} alt={question.image.alt} className="mb-4 max-w-full rounded-xl border border-line" />
      )}

      <p id={stemId} className="mb-4 text-lg font-medium leading-snug">
        {question.stem}
      </p>

      {question.type === "ordering" ? (
        <OrderingBody {...props} stemId={stemId} revealCorrectness={revealCorrectness} />
      ) : question.type === "matching" ? (
        <MatchingBody {...props} stemId={stemId} revealCorrectness={revealCorrectness} />
      ) : (
        <ChoiceBody {...props} stemId={stemId} revealCorrectness={revealCorrectness} />
      )}
    </article>
  );
}

type BodyProps = Props & { stemId: string; revealCorrectness: boolean };

function ChoiceBody({ question, optionOrder, selected, onToggle, answer, revealCorrectness, stemId }: BodyProps) {
  const multi = question.type === "multiple";
  const need = requiredSelections(question);
  const locked = !!answer;
  const chosen = answer?.selectedAnswerIds ?? selected;
  const optionsById = new Map(question.options.map((o) => [o.id, o]));

  return (
    <div role={multi ? "group" : "radiogroup"} aria-labelledby={stemId} className="flex flex-col gap-2.5">
      {optionOrder.map((id, i) => {
        const opt = optionsById.get(id)!;
        const isChosen = chosen.includes(id);
        const isCorrect = question.correctAnswerIds.includes(id);
        const showState = locked && revealCorrectness;
        const disabled = locked || (multi && !isChosen && selected.length >= need);
        return (
          <button
            key={id}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={isChosen}
            aria-disabled={disabled}
            onClick={() => !locked && onToggle(id)}
            className={cx(
              "flex min-h-14 w-full items-start gap-3 rounded-xl border p-3.5 text-left transition",
              !showState && isChosen && "border-accent bg-accent-soft",
              !showState && !isChosen && "border-line bg-surface hover:border-accent/60",
              !showState && disabled && !isChosen && "opacity-60 hover:border-line",
              showState && isCorrect && "border-success bg-success-soft",
              showState && !isCorrect && isChosen && "border-danger bg-danger-soft",
              showState && !isCorrect && !isChosen && "border-line bg-surface opacity-75",
              locked && "cursor-default",
            )}
          >
            <span
              aria-hidden
              className={cx(
                "grid size-7 shrink-0 place-items-center border text-xs font-semibold",
                multi ? "rounded-md" : "rounded-full",
                showState && isCorrect
                  ? "border-success bg-success text-bg"
                  : showState && isChosen
                    ? "border-danger bg-danger text-bg"
                    : isChosen
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line text-muted",
              )}
            >
              {showState && isCorrect ? <Check className="size-4" /> : showState && isChosen ? <X className="size-4" /> : i + 1}
            </span>
            <span className="pt-0.5">{opt.text}</span>
            {showState && (isCorrect || isChosen) && <span className="sr-only">{isCorrect ? "(correct answer)" : "(your incorrect choice)"}</span>}
          </button>
        );
      })}
    </div>
  );
}

function OrderingBody({ question, selected, onSetSelection, answer, revealCorrectness, stemId }: BodyProps) {
  const locked = !!answer;
  const order = answer?.selectedAnswerIds ?? selected;
  const text = new Map(question.options.map((o) => [o.id, o.text]));
  return (
    <div>
      <p className="mb-2 text-sm text-muted">Use the arrows to put the steps in order, first at the top.</p>
      <ol aria-labelledby={stemId} className="flex flex-col gap-2">
        {order.map((id, i) => {
          const correctPos = question.correctAnswerIds.indexOf(id);
          const right = correctPos === i;
          const show = locked && revealCorrectness;
          return (
            <li
              key={id}
              className={cx(
                "flex items-center gap-3 rounded-xl border p-3",
                !show && "border-line bg-surface",
                show && right && "border-success bg-success-soft",
                show && !right && "border-danger bg-danger-soft",
              )}
            >
              <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-xs font-semibold text-muted">
                {i + 1}
              </span>
              <span className="flex-1">
                {text.get(id)}
                {show && !right && <span className="mt-0.5 block text-xs text-danger">Belongs at step {correctPos + 1}</span>}
              </span>
              {!locked && (
                <span className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Move "${text.get(id)}" up`}
                    disabled={i === 0}
                    onClick={() => onSetSelection?.(moveItem(order, id, -1))}
                    className="grid size-10 place-items-center rounded-lg border border-line hover:border-accent disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move "${text.get(id)}" down`}
                    disabled={i === order.length - 1}
                    onClick={() => onSetSelection?.(moveItem(order, id, 1))}
                    className="grid size-10 place-items-center rounded-lg border border-line hover:border-accent disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MatchingBody({ question, optionOrder, selected, onSetSelection, answer, revealCorrectness }: BodyProps) {
  const spec = question.matching!;
  const locked = !!answer;
  const pairs = parsePairs(answer?.selectedAnswerIds ?? selected);
  const text = new Map(question.options.map((o) => [o.id, o.text]));
  const catName = new Map(spec.categories.map((c) => [c.id, c.text]));
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-muted">Choose the right category for each item.</p>
      {optionOrder.map((id) => {
        const chosen = pairs.get(id);
        const right = chosen === spec.answers[id];
        const show = locked && revealCorrectness;
        const labelId = `m-${question.id}-${id}`;
        return (
          <div
            key={id}
            className={cx(
              "rounded-xl border p-3",
              !show && "border-line bg-surface",
              show && right && "border-success bg-success-soft",
              show && !right && "border-danger bg-danger-soft",
            )}
          >
            <p id={labelId} className={cx("mb-2 whitespace-pre-wrap", LOGLIKE.test(text.get(id) ?? "") ? "font-mono text-[13px] sm:text-sm" : "text-[15px]")}>
              {text.get(id)}
            </p>
            <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-2">
              {spec.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={chosen === c.id}
                  aria-disabled={locked}
                  onClick={() => !locked && onSetSelection?.(assignCategory(selected, id, c.id))}
                  className={cx(
                    "flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm",
                    chosen === c.id ? "border-accent bg-accent-soft font-medium text-accent" : "border-line bg-surface hover:border-accent/60",
                    locked && "cursor-default",
                  )}
                >
                  <span
                    aria-hidden
                    className={cx("size-4 shrink-0 rounded-full border-2", chosen === c.id ? "border-accent bg-accent" : "border-line")}
                  />
                  {c.text}
                </button>
              ))}
            </div>
            {show && !right && <p className="mt-1.5 text-xs text-danger">Correct: {catName.get(spec.answers[id])}</p>}
          </div>
        );
      })}
    </div>
  );
}
