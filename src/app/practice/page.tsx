"use client";

import { ArrowRight, Layers, Route, RotateCcw, Shuffle, Sparkles, Target, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { answeredCount, resumeIndex } from "@/lib/engine/session";
import type { StudyMode } from "@/lib/types";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { MODE_INFO, useStartSession } from "@/components/useStart";

const ICONS: Record<StudyMode, typeof Zap> = { circuit: Route, quick: Zap, focused: Target, mixed: Shuffle, review: RotateCcw };

export default function PracticePage() {
  const { derived } = useStore();
  const { start, message } = useStartSession();
  const active = derived.activeSession;
  const rec = derived.recommendation;

  return (
    <div className="animate-in">
      <PageHeader title="Practice" subtitle={`${derived.exam.questions.length} original ${derived.exam.version} questions. Every answer updates what you'll see next.`} />

      {active && (
        <Card className="mb-4 border-accent/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Unfinished: {MODE_INFO[active.type].title}</p>
              <p className="text-sm text-muted">
                {answeredCount(active)} of {active.questionIds.length} answered
              </p>
            </div>
            <ButtonLink href="/session/" variant="primary">
              Resume Question {resumeIndex(active) + 1} <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Card>
      )}

      {message && (
        <p role="status" className="mb-4 rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm">
          {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(MODE_INFO) as StudyMode[]).map((mode) => {
          const Icon = ICONS[mode];
          return (
            <button
              key={mode}
              type="button"
              onClick={() => start(mode)}
              className="group flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 text-left transition hover:border-accent focus-visible:border-accent"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                {rec.mode === mode && (
                  <Badge tone="accent">
                    <Sparkles className="size-3" aria-hidden /> Recommended
                  </Badge>
                )}
              </span>
              <span className="text-lg font-semibold">{MODE_INFO[mode].title}</span>
              <span className="text-sm text-muted">{MODE_INFO[mode].blurb}</span>
              <span className="mt-1 flex items-center gap-1 text-sm font-medium text-accent">
                Start <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>

      <Card className="mt-4">
        <div className="flex items-start gap-3 text-sm text-muted">
          <Layers className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <p>
            <span className="font-medium text-fg">How questions are chosen: </span>
            missed answers first, then correct guesses, then weak areas from your study history, then anything due for review. Concepts
            you&apos;ve answered confidently across different scenarios are shown less often. When you miss a question, a different scenario on
            the same concept is added later in the session.
          </p>
        </div>
      </Card>
    </div>
  );
}
