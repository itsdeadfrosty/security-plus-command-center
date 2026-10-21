import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { ButtonLink, Card, PageHeader } from "./ui";

/** Honest placeholder for a section scheduled in a later phase. Nothing here pretends to work. */
export function PlannedFeature({ title, phase, intro, items, children }: { title: string; phase: string; intro: string; items: string[]; children?: ReactNode }) {
  return (
    <div className="animate-in max-w-3xl">
      <PageHeader title={title} subtitle={intro} />
      <Card>
        <p className="mb-3 flex items-center gap-2 font-medium text-warning">
          <Construction className="size-5" aria-hidden /> Not built yet — planned for {phase}
        </p>
        <p className="mb-2 text-sm text-muted">What this section will include:</p>
        <ul className="mb-4 list-inside list-disc space-y-1 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        {children}
        <ButtonLink href="/practice/" variant="primary">
          Go to Practice instead
        </ButtonLink>
      </Card>
    </div>
  );
}
