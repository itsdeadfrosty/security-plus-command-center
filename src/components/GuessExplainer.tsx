"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { useStore } from "@/lib/store";
import { conceptById } from "@/content/catalog";
import { BuddyError, streamBuddyReply, type BuddyContext } from "@/lib/ai/buddy";
import { loadAiSettings } from "@/lib/ai/settings";
import type { Question } from "@/lib/types";
import { SafeMarkdown } from "./SafeMarkdown";

const ASK = `I guessed on this question and got it wrong (it's "Missed question 1" in your notes). In under 120 words:
- say why my pick was a fair guess,
- give the right answer and the clue that points to it,
- name the one key difference,
- and give me a short memory trick.
Don't end with a question this time.`;

/** Study-buddy explanation that appears on its own after a wrong guess (Settings → Explain wrong guesses). */
export function GuessExplainer({ question, attemptId }: { question: Question; attemptId: string }) {
  const { data, derived } = useStore();
  const [settings] = useState(() => loadAiSettings());
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    const attempt = data.attempts.find((a) => a.id === attemptId);
    const concept = conceptById.get(question.conceptIds[0]);
    if (!settings.geminiKey || !attempt || !concept) return;
    const ctx: BuddyContext = {
      examVersion: derived.exam.version,
      concept,
      contrastNames: (concept.contrasts ?? []).map((c) => ({ name: conceptById.get(c.conceptId)?.name ?? c.conceptId, distinction: c.distinction })),
      mastery: derived.mastery.get(concept.id),
      missed: [{ question, attempt }],
    };
    const controller = new AbortController();
    streamBuddyReply(settings, ctx, [{ role: "user", content: ASK }], (d) => setText((t) => t + d), controller.signal).catch((e) => {
      if (!controller.signal.aborted) setError(e instanceof BuddyError ? e.message : "The study buddy couldn't answer.");
    });
    return () => controller.abort();
    // Runs once per wrong guess; later data changes shouldn't restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  if (!settings.geminiKey) return null;
  return (
    <div className="rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm" aria-live="polite">
      <p className="mb-1 flex items-center gap-2 font-medium text-accent">
        <Bot className="size-4" aria-hidden /> Study buddy
      </p>
      {error ? <p className="text-danger">{error}</p> : text ? <SafeMarkdown text={text} /> : <p className="text-muted">Thinking…</p>}
    </div>
  );
}
