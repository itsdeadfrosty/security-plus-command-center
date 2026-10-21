"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Bot, ChevronDown, Lightbulb, Scale, X } from "lucide-react";
import { useStore, rankedConcepts, flaggedConceptIds } from "@/lib/store";
import { conceptById, conceptDomain } from "@/content/catalog";
import { isInReviewQueue } from "@/lib/engine/selection";
import type { ConceptMastery, Difficulty } from "@/lib/types";
import { Badge, Button, ButtonLink, Card, PageHeader, cx, masteryTone } from "@/components/ui";
import { useStartSession } from "@/components/useStart";

type View = "queue" | "weakest" | "missed" | "due" | "all";
const VIEWS: { id: View; label: string }[] = [
  { id: "queue", label: "Review queue" },
  { id: "weakest", label: "Weakest" },
  { id: "missed", label: "Recently missed" },
  { id: "due", label: "Due for review" },
  { id: "all", label: "All concepts" },
];

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—");

export default function ReviewPage() {
  const { data, derived } = useStore();
  const now = useMemo(() => new Date(), []);
  // Deep link from question feedback: /review/#concept-id
  const [hashConcept] = useState(() => {
    const id = typeof window === "undefined" ? "" : decodeURIComponent(window.location.hash.slice(1));
    return conceptById.has(id) ? id : null;
  });
  const [view, setView] = useState<View>(hashConcept ? "all" : "queue");
  const [domain, setDomain] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [selected, setSelected] = useState<string | null>(hashConcept);

  const { certification, questionsByConcept, version } = derived.exam;
  const ranked = rankedConcepts(derived.mastery, now, flaggedConceptIds(data));
  const rows = ranked
    .filter(({ m, concept, priority, flagged }) => {
      if (domain !== "all" && conceptDomain(concept.id, version) !== domain) return false;
      if (difficulty !== "all" && !(questionsByConcept.get(concept.id) ?? []).some((q) => q.difficulty === difficulty)) return false;
      switch (view) {
        case "queue":
          return flagged || isInReviewQueue(m, now);
        case "weakest":
          return priority >= 60;
        case "missed":
          return m.incorrectAttempts > 0;
        case "due":
          return !!m.nextReviewAt && new Date(m.nextReviewAt) <= now && m.totalAttempts > 0;
        default:
          return true;
      }
    })
    .sort((a, b) => (view === "missed" ? (b.m.lastPracticedAt ?? "").localeCompare(a.m.lastPracticedAt ?? "") : view === "all" ? a.concept.name.localeCompare(b.concept.name) : 0));

  const active = selected ? derived.mastery.get(selected) : undefined;

  return (
    <div className="animate-in">
      <PageHeader title="Review" subtitle="Short explanation, a practical example, the look-alike to watch for — then a new scenario." />

      {active && <ConceptPanel m={active} onClose={() => setSelected(null)} />}

      <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Review filters">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            type="button"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={cx("min-h-10 rounded-full border px-3.5 text-sm", view === v.id ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-fg")}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted">Domain</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="min-h-10 rounded-lg border border-line bg-surface px-2">
            <option value="all">All domains</option>
            {certification.domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id.replace(".0", "")}. {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted">Has questions at</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="min-h-10 rounded-lg border border-line bg-surface px-2">
            <option value="all">Any difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="exam">Exam-level</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="text-muted">{view === "queue" ? "Your review queue is empty. Nice — keep practicing to find the next gap." : "No concepts match these filters."}</p>
        </Card>
      ) : (
        <Card as="div" className="p-0">
          <ul className="divide-y divide-line">
            {rows.map(({ m, concept }) => (
              <li key={concept.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(concept.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cx("grid w-full gap-1 px-5 py-3.5 text-left hover:bg-surface-2 sm:grid-cols-[1fr_auto] sm:items-center", selected === concept.id && "bg-accent-soft")}
                >
                  <span>
                    <span className="block font-medium">{concept.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {m.incorrectAttempts} incorrect · {m.guessedCorrectAttempts} correct guesses · last practiced {fmtDate(m.lastPracticedAt)} · next review{" "}
                      {m.nextReviewAt && new Date(m.nextReviewAt) <= now ? "now" : fmtDate(m.nextReviewAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={masteryTone[m.masteryLabel]}>{m.masteryLabel}</Badge>
                    <span className="text-xs tabular-nums text-muted">Level {m.box}/5</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p className="mt-3 text-xs text-muted">
        Levels are a simple spaced-repetition estimate based on your answers and confidence — not a validated measure of exam readiness.
      </p>
    </div>
  );
}

function ConceptPanel({ m, onClose }: { m: ConceptMastery; onClose(): void }) {
  const { start, message } = useStartSession();
  const { derived } = useStore();
  const { questionsByConcept, version } = derived.exam;
  const [more, setMore] = useState(false);
  const c = conceptById.get(m.conceptId)!;
  const partners = (c.contrasts ?? []).map((x) => x.conceptId);
  const available = (questionsByConcept.get(c.id) ?? []).length;

  return (
    <Card className="mb-6 border-accent/40 animate-in" aria-labelledby="concept-h">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 id="concept-h" className="text-xl font-semibold">
            {c.name}
          </h2>
          <p className="text-xs text-muted">
            {version} objective {c.objectives[version]} · {c.topic}
          </p>
        </div>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close concept">
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-4 text-[15px]">
        <section>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent">
            <BookOpen className="size-4" aria-hidden /> What it means
          </h3>
          <p>{c.summary}</p>
        </section>
        <section>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent">
            <Lightbulb className="size-4" aria-hidden /> In practice
          </h3>
          <p>{c.example}</p>
        </section>
        {c.contrasts && c.contrasts.length > 0 && (
          <section>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent">
              <Scale className="size-4" aria-hidden /> Don&apos;t confuse with
            </h3>
            <ul className="space-y-1.5">
              {c.contrasts.map((x) => (
                <li key={x.conceptId}>
                  <span className="font-medium">{conceptById.get(x.conceptId)?.name}: </span>
                  <span className="text-muted">{x.distinction}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {c.more && (
          <div>
            <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="flex items-center gap-1 text-sm text-accent underline">
              Explain more <ChevronDown className={cx("size-4 transition", more && "rotate-180")} aria-hidden />
            </button>
            {more && <p className="mt-2 text-muted">{c.more}</p>}
          </div>
        )}
        <div className="rounded-xl bg-surface-2 p-3 text-sm">
          <p className="mb-1 font-medium">
            Why it&apos;s here · <Badge tone={masteryTone[m.masteryLabel]}>{m.masteryLabel}</Badge>
          </p>
          <ul className="list-inside list-disc text-muted">
            {m.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => start("review", [c.id, ...partners])} disabled={available === 0}>
          Test me with a new scenario <ArrowRight className="size-4" aria-hidden />
        </Button>
        <ButtonLink href={`/buddy/#${c.id}`}>
          <Bot className="size-4" aria-hidden /> Talk it through
        </ButtonLink>
        <span className="text-xs text-muted">
          {available} question{available === 1 ? "" : "s"} on this concept{partners.length ? ", plus contrast questions" : ""}
        </span>
      </div>
      {message && <p className="mt-2 text-sm text-warning">{message}</p>}
    </Card>
  );
}
