"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Bot, Send } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { conceptById, questionById } from "@/content/catalog";
import { isAnswerCorrect } from "@/lib/engine/scoring";
import { BuddyError, streamBuddyReply, type BuddyContext, type ChatTurn } from "@/lib/ai/buddy";
import { useAiSettings } from "@/lib/ai/settings";
import type { Concept } from "@/lib/types";
import { StreamingMarkdown } from "./StreamingMarkdown";
import { Button } from "./ui";

const FIRST_ASK = `I missed a question on this topic last time and another one is coming up. Help me understand it before I try: in under 120 words, explain it simply, say what I likely mixed up (my misses are in your notes), and give me a memory trick. Don't give away answers to questions I haven't seen. End by asking if anything's still unclear.`;

/** Study-buddy chat inside the "You missed this one last time" hint, so the learner can ask before answering. */
export function PrimerChat({ concept }: { concept: Concept }) {
  const { data, derived } = useStore();
  const [settings] = useAiSettings();
  const [turns, setTurns] = useState<(ChatTurn & { hidden?: boolean })[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const ctx = useMemo<BuddyContext>(() => {
    const missed = data.attempts
      .filter((a) => {
        const q = questionById.get(a.questionId);
        return !!q && q.conceptIds.includes(concept.id) && !isAnswerCorrect(q, a.selectedAnswerIds);
      })
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .map((attempt) => ({ attempt, question: questionById.get(attempt.questionId)! }));
    return {
      examVersion: derived.exam.version,
      concept,
      contrastNames: (concept.contrasts ?? []).map((c) => ({ name: conceptById.get(c.conceptId)?.name ?? c.conceptId, distinction: c.distinction })),
      mastery: derived.mastery.get(concept.id),
      missed,
    };
  }, [data.attempts, concept, derived]);

  async function send(text: string, hidden = false) {
    if (busy || !text.trim()) return;
    setError(undefined);
    const history = [...turns, { role: "user" as const, content: text.trim(), hidden }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamBuddyReply(
        settings,
        ctx,
        history.map(({ role, content }) => ({ role, content })),
        (d) => setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? { ...t, content: t.content + d } : t))),
        controller.signal,
      );
    } catch (e) {
      if (controller.signal.aborted) return;
      setTurns(history.slice(0, -1));
      setError(e instanceof BuddyError ? e.message : "The study buddy couldn't answer.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  if (!settings.geminiKey) {
    return (
      <p className="mt-3 text-sm text-muted">
        Want to talk it through first? Add the free AI key in{" "}
        <Link href="/settings/" className="text-accent underline">
          Settings
        </Link>{" "}
        to ask the study buddy right here.
      </p>
    );
  }

  if (turns.length === 0) {
    return (
      <Button className="mt-3" onClick={() => void send(FIRST_ASK, true)}>
        <Bot className="size-4" aria-hidden /> Help me understand this
      </Button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm" aria-live="polite">
      <p className="mb-2 flex items-center gap-2 font-medium text-accent">
        <Bot className="size-4" aria-hidden /> Study buddy
      </p>
      <div className="space-y-3">
        {turns
          .filter((t) => !t.hidden)
          .map((t, i) =>
            t.role === "user" ? (
              <p key={i} className="ml-auto max-w-[85%] rounded-lg bg-surface-2 px-3 py-2">
                {t.content}
              </p>
            ) : t.content ? (
              <StreamingMarkdown key={i} text={t.content} />
            ) : (
              <p key={i} className="text-muted">
                Thinking…
              </p>
            ),
          )}
      </div>
      {error && <p className="mt-2 text-danger">{error}</p>}
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label htmlFor="primer-ask" className="sr-only">
          Ask the study buddy
        </label>
        <input
          id="primer-ask"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up…"
          autoComplete="off"
          className="min-h-11 flex-1 rounded-lg border border-line bg-surface px-3"
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="Send">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
