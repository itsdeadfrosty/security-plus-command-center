"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, KeyRound, RefreshCw, RotateCcw, Send, Square } from "lucide-react";
import { useStore, rankedConcepts } from "@/lib/store";
import { conceptById, questionById } from "@/content/catalog";
import { isAnswerCorrect } from "@/lib/engine/scoring";
import { KICKOFF, BuddyError, streamBuddyReply, type BuddyContext, type ChatTurn } from "@/lib/ai/buddy";
import { useAiSettings, type AiSettings } from "@/lib/ai/settings";
import { KeySetup } from "@/components/AiSettingsCard";
import { Badge, Button, Card, PageHeader, cx, masteryTone } from "@/components/ui";
import { StreamingMarkdown } from "@/components/StreamingMarkdown";

interface Turn {
  role: "user" | "assistant";
  text: string;
  /** The opening request is sent for the learner and shown as a chip, not a bubble. */
  hidden?: boolean;
}

export default function BuddyPage() {
  const { derived } = useStore();
  const [settings, setSettings] = useAiSettings();
  const [conceptId, setConceptId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const id = decodeURIComponent(window.location.hash.slice(1));
    return conceptById.has(id) ? id : null;
  });

  const suggestions = rankedConcepts(derived.mastery)
    .filter((x) => x.m.totalAttempts > 0 && x.priority >= 45)
    .slice(0, 8);

  return (
    <div className="animate-in mx-auto max-w-3xl">
      <PageHeader
        title="Study Buddy"
        subtitle="Talk through a concept you missed. It explains simply, gives you a memory hook, then checks you've got it."
      />

      {!settings.geminiKey ? (
        <Card>
          <p className="mb-1 flex items-center gap-2 font-medium">
            <KeyRound className="size-5 text-accent" aria-hidden /> Turn on your study buddy (free, about a minute)
          </p>
          <p className="mb-3 text-sm text-muted">
            It reviews what you missed with you and answers questions when you&apos;re stuck. Everything else in the app works without it.
          </p>
          <KeySetup settings={settings} onSaved={setSettings} />
        </Card>
      ) : conceptId ? (
        <Chat key={conceptId} conceptId={conceptId} settings={settings} onBack={() => setConceptId(null)} />
      ) : (
        <Card>
          <p className="mb-3 font-medium">Pick a concept to work through</p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing missed yet. Answer some questions first, or open any concept from{" "}
              <Link href="/review/" className="text-accent underline">
                Review
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {suggestions.map(({ m, concept }) => (
                <li key={concept.id}>
                  <button
                    type="button"
                    onClick={() => {
                      history.replaceState(null, "", `#${concept.id}`);
                      setConceptId(concept.id);
                    }}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-accent"
                  >
                    <span>
                      <span className="block font-medium">{concept.name}</span>
                      <span className="text-xs text-muted">
                        {m.incorrectAttempts} missed · {m.guessedCorrectAttempts} guessed
                      </span>
                    </span>
                    <Badge tone={masteryTone[m.masteryLabel]}>{m.masteryLabel}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

const QUICK = ["Give me a memory trick", "Explain it a different way", "Quiz me with a new scenario", "Why was my answer wrong?"];

function Chat({ conceptId, settings, onBack }: { conceptId: string; settings: AiSettings; onBack(): void }) {
  const { data, derived } = useStore();
  const concept = conceptById.get(conceptId)!;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [failed, setFailed] = useState<{ text: string; hidden: boolean }>();
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo<BuddyContext>(() => {
    const missed = data.attempts
      .filter((a) => {
        const q = questionById.get(a.questionId);
        if (!q || !q.conceptIds.includes(conceptId)) return false;
        const guessed = a.confidence === "educated" || a.confidence === "random";
        return !isAnswerCorrect(q, a.selectedAnswerIds) || guessed;
      })
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .map((attempt) => ({ attempt, question: questionById.get(attempt.questionId)! }));
    return {
      examVersion: derived.exam.version,
      concept,
      contrastNames: (concept.contrasts ?? []).map((c) => ({ name: conceptById.get(c.conceptId)?.name ?? c.conceptId, distinction: c.distinction })),
      mastery: derived.mastery.get(conceptId),
      missed,
    };
  }, [data.attempts, conceptId, concept, derived]);

  async function send(text: string, hidden = false) {
    if (busy || !text.trim()) return;
    setError(undefined);
    const next: Turn[] = [...turns, { role: "user", text: text.trim(), hidden }];
    setTurns([...next, { role: "assistant", text: "" }]);
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const history: ChatTurn[] = next.map((t) => ({ role: t.role, content: t.text }));
    try {
      await streamBuddyReply(
        settings,
        ctx,
        history,
        (delta) =>
          setTurns((cur) => {
            const copy = [...cur];
            copy[copy.length - 1] = { role: "assistant", text: copy[copy.length - 1].text + delta };
            return copy;
          }),
        controller.signal,
      );
    } catch (e) {
      const msg = e instanceof BuddyError ? e.message : "Something went wrong.";
      setError(msg);
      setFailed({ text, hidden });
      // Drop an empty assistant bubble, and the user's turn too so history stays valid.
      setTurns((cur) => {
        const last = cur[cur.length - 1];
        return last && !last.text ? cur.slice(0, -2) : cur;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  // Open with an explanation as soon as the chat starts.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send(KICKOFF, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  return (
    <Card as="div" className="flex flex-col p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <div>
          <p className="font-semibold">{concept.name}</p>
          <p className="text-xs text-muted">
            {ctx.missed.length ? `Using your ${Math.min(ctx.missed.length, 4)} most recent missed or guessed question(s)` : "No misses on record — general walkthrough"} ·{" "}
            Google Gemini
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack}>
            Change concept
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              abortRef.current?.abort();
              setTurns([]);
              started.current = false;
              setTimeout(() => {
                started.current = true;
                void send(KICKOFF, true);
              }, 0);
            }}
            aria-label="Restart conversation"
          >
            <RotateCcw className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="max-h-[60dvh] min-h-64 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite" aria-busy={busy}>
        {turns.map((t, i) =>
          t.hidden ? (
            <p key={i} className="text-center text-xs text-muted">
              Asked the buddy to explain {concept.name}
            </p>
          ) : (
            <div key={i} className={cx("flex gap-3", t.role === "user" && "justify-end")}>
              {t.role === "assistant" && <Bot className="mt-1 size-5 shrink-0 text-accent" aria-label="Study buddy" />}
              <div
                className={cx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px]",
                  t.role === "user" ? "bg-accent-soft" : "bg-surface-2",
                )}
              >
                {t.role === "assistant" ? (
                  t.text ? (
                    <StreamingMarkdown text={t.text} />
                  ) : (
                    <span className="text-muted">Thinking…</span>
                  )
                ) : (
                  <p className="whitespace-pre-wrap">{t.text}</p>
                )}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="mx-5 mb-2 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          <span className="flex-1">{error}</span>
          {failed && (
            <button
              type="button"
              onClick={() => void send(failed.text, failed.hidden)}
              disabled={busy}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-danger/40 px-2 py-1 text-xs font-medium hover:bg-danger/10"
            >
              <RefreshCw className="size-3.5" aria-hidden /> Try again
            </button>
          )}
        </p>
      )}

      <div className="border-t border-line px-5 py-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {QUICK.map((qText) => (
            <button
              key={qText}
              type="button"
              disabled={busy}
              onClick={() => send(qText)}
              className="min-h-9 rounded-full border border-line px-3 text-xs text-muted hover:border-accent hover:text-fg disabled:opacity-40"
            >
              {qText}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="buddy-input" className="sr-only">
            Message the study buddy
          </label>
          <textarea
            id="buddy-input"
            rows={1}
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Answer the question or ask anything about this concept…"
            className="min-h-11 flex-1 resize-none rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[15px]"
          />
          {busy ? (
            <Button onClick={() => abortRef.current?.abort()} aria-label="Stop reply">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={!input.trim()} aria-label="Send">
              <Send className="size-4" />
            </Button>
          )}
        </form>
        <p className="mt-2 text-xs text-muted">AI explanations can be wrong. When in doubt, check the concept card in Review.</p>
      </div>
    </Card>
  );
}
