"use client";

import { Route } from "lucide-react";
import { useStore } from "@/lib/store";
import { FIRST_TRY_MIN, READY_ACCURACY, READY_COVERAGE } from "@/lib/engine/circuit";
import { Badge, Button, Card, CardTitle, ProgressBar } from "./ui";
import { useStartSession } from "./useStart";

/** Circuit coverage + the readiness estimate. `detailed` adds the per-domain breakdown. */
export function CircuitCard({ detailed = false, className }: { detailed?: boolean; className?: string }) {
  const { derived } = useStore();
  const { start, message } = useStartSession();
  const r = derived.readiness;
  const pct = Math.round(r.coverage * 100);

  return (
    <Card className={className} aria-labelledby="circuit-h">
      <CardTitle id="circuit-h" icon={<Route className="size-4" aria-hidden />}>
        {derived.exam.version} circuit
      </CardTitle>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{pct}% covered</p>
          <p className="text-sm text-muted">
            {r.clearedConcepts} of {r.totalConcepts} concepts proven · weighted by exam domain
          </p>
        </div>
        {r.ready ? <Badge tone="success">Readiness target met</Badge> : <Badge>Estimate, not an official score</Badge>}
      </div>
      <div className="my-3">
        <ProgressBar value={pct} max={100} label="Circuit coverage" tone={r.coverage >= READY_COVERAGE ? "success" : "accent"} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted">Coverage target</dt>
          <dd className="font-medium">{Math.round(READY_COVERAGE * 100)}%+ of the circuit</dd>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted">First-try accuracy (new questions)</dt>
          <dd className="font-medium tabular-nums">
            {r.firstTry.accuracy === null ? "—" : `${Math.round(r.firstTry.accuracy * 100)}%`}{" "}
            <span className="text-xs text-muted">
              target {Math.round(READY_ACCURACY * 100)}% over {FIRST_TRY_MIN}+
            </span>
          </dd>
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
              <ProgressBar value={d.cleared} max={d.total} label={`${d.name} circuit coverage`} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => start("circuit")}>
          Run the circuit
        </Button>
        <span className="text-xs text-muted">A concept clears once you answer it correctly without guessing.</span>
      </div>
      {message && <p className="mt-2 text-sm text-warning">{message}</p>}
    </Card>
  );
}
