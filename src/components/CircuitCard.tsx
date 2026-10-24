"use client";

import { Route } from "lucide-react";
import { useStore } from "@/lib/store";
import { READY_PASS_CHANCE } from "@/lib/engine/circuit";
import { Badge, Button, Card, CardTitle, ProgressBar } from "./ui";
import { useStartSession } from "./useStart";

/** The pass track: estimated pass chance + how far along the learner is. `detailed` adds the per-domain breakdown. */
export function CircuitCard({ detailed = false, className }: { detailed?: boolean; className?: string }) {
  const { derived } = useStore();
  const { start, message } = useStartSession();
  const r = derived.readiness;
  const pct = Math.round(r.passChance * 100);
  // One decimal so a good session visibly moves it.
  const done = Math.floor(r.completion * 1000) / 10;

  return (
    <Card className={className} aria-labelledby="circuit-h">
      <CardTitle id="circuit-h" icon={<Route className="size-4" aria-hidden />}>
        {derived.exam.version} pass track
      </CardTitle>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{pct}% pass chance</p>
          <p className="text-sm text-muted">Target {Math.round(READY_PASS_CHANCE * 100)}% · weighted by exam domain</p>
        </div>
        {r.ready ? <Badge tone="success">Ready to book</Badge> : <Badge>Estimate, not an official score</Badge>}
      </div>
      <div className="my-3">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">Course completion</span>
          <span className="text-lg font-semibold tabular-nums">{done}%</span>
        </div>
        <ProgressBar value={r.completion} max={1} label="Course completion" tone={r.completion >= 1 ? "success" : "accent"} />
        <p className="mt-1 text-xs text-muted">
          {r.completion >= 1
            ? "Every topic cleared. You know this material."
            : "Every topic you clear in the circuit or review moves this. 100% means every topic is cleared. Blitz doesn't count."}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted">Topics locked in</dt>
          <dd className="font-medium tabular-nums">
            {r.clearedConcepts} / {r.totalConcepts}
          </dd>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted">Expected exam score</dt>
          <dd className="font-medium tabular-nums">{Math.round(r.expectedScore * 100)}%</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm">{r.nextStep}</p>

      {detailed && (
        <ul className="mt-4 space-y-3">
          {r.byDomain.map((d) => (
            <li key={d.domainId}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span>
                  {d.domainId.replace(".0", "")}. {d.name} <span className="text-xs text-muted">({Math.round(d.weight * 100)}% of exam)</span>
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {d.cleared}/{d.total} · {d.needsWork} open
                </span>
              </div>
              <ProgressBar value={d.cleared} max={d.total} label={`${d.name} topics locked in`} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => start("circuit")}>
          Run the circuit
        </Button>
        <span className="text-xs text-muted">Topics you prove you know drop out, and nearby ones can clear faster.</span>
      </div>
      {message && <p className="mt-2 text-sm text-warning">{message}</p>}
    </Card>
  );
}
