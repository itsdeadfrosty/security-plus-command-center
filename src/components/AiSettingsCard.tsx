"use client";

import { useState } from "react";
import { Bot, CheckCircle2, ClipboardPaste, ExternalLink, Eye, EyeOff } from "lucide-react";
import {
  AI_MODELS,
  API_KEYS_URL,
  BILLING_URL,
  GEMINI_KEY_URL,
  loadAiSettings,
  looksLikeApiKey,
  looksLikeGeminiKey,
  providerOf,
  saveAiSettings,
  type AiProvider,
  type AiSettings,
} from "@/lib/ai/settings";
import { Button, Card, CardTitle, cx } from "./ui";

const linkCls = "inline-flex items-center gap-1 font-medium text-accent underline";

/**
 * Click the link, copy the key, paste it here. Used in Settings and on the
 * Study Buddy page so a learner can go from nothing to chatting in one step.
 */
export function KeySetup({ provider, settings, onSaved }: { provider: AiProvider; settings: AiSettings; onSaved(next: AiSettings): void }) {
  const google = provider === "google";
  const current = google ? settings.geminiKey : settings.apiKey;
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();

  function save(raw: string) {
    const k = raw.trim();
    const valid = google ? looksLikeGeminiKey(k) : looksLikeApiKey(k);
    if (!valid)
      return setStatus({
        ok: false,
        text: google ? "That doesn't look like a Google API key. Copy the whole key from AI Studio." : "That doesn't look like an Anthropic API key (it should start with sk-ant-).",
      });
    const next = google ? { ...settings, geminiKey: k, model: "gemini" as const } : { ...settings, apiKey: k };
    if (!saveAiSettings(next)) return setStatus({ ok: false, text: "This browser blocked saving the key." });
    setKey("");
    setStatus({ ok: true, text: "Key saved. The study buddy is ready." });
    onSaved(next);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setKey(text.trim());
      save(text);
    } catch {
      setStatus({ ok: false, text: "Couldn't read the clipboard. Long-press or right-click the box and choose Paste." });
    }
  }

  function remove() {
    const next = google ? { ...settings, geminiKey: "" } : { ...settings, apiKey: "" };
    saveAiSettings(next);
    setStatus({ ok: true, text: "Key removed from this browser." });
    onSaved(next);
  }

  return (
    <div>
      {current ? (
        <p className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          {google ? "Google" : "Claude"} key saved ({current.slice(0, 6)}…{current.slice(-4)}).
          <button type="button" onClick={remove} className="text-danger underline">
            Remove
          </button>
        </p>
      ) : google ? (
        <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            <a href={GEMINI_KEY_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              Get a free key from Google <ExternalLink className="size-3.5" aria-hidden />
            </a>{" "}
            (sign in with any Google account). Click <strong>Create API key</strong>, then <strong>Copy</strong>.
          </li>
          <li>
            Come back and tap <strong>Paste key</strong>. That&apos;s it: free, no credit card.
          </li>
        </ol>
      ) : (
        <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            <a href={API_KEYS_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              Open the Claude API keys page <ExternalLink className="size-3.5" aria-hidden />
            </a>{" "}
            (sign in or sign up), click <strong>Create Key</strong>, and copy it.
          </li>
          <li>
            Add a little credit on the{" "}
            <a href={BILLING_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              billing page
            </a>
            . API use is pay-as-you-go and <strong>separate from a Claude Pro or Max subscription</strong>. $5 lasts a long time on Sonnet or Haiku.
          </li>
          <li>
            Come back and tap <strong>Paste key</strong>.
          </li>
        </ol>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void pasteFromClipboard()}>
          <ClipboardPaste className="size-4" aria-hidden /> Paste key
        </Button>
        <label htmlFor={`key-${provider}`} className="sr-only">
          {google ? "Google API key" : "Claude API key"}
        </label>
        <input
          id={`key-${provider}`}
          type={show ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save(key)}
          autoComplete="off"
          spellCheck={false}
          placeholder={current ? "Paste a new key to replace it" : google ? "or paste it here (AIza…)" : "or paste it here (sk-ant-…)"}
          className="min-h-11 min-w-0 flex-1 basis-48 rounded-lg border border-line bg-surface-2 px-3 font-mono text-sm"
        />
        <Button variant="ghost" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide key" : "Show key"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
        {key.trim() && <Button onClick={() => save(key)}>Save</Button>}
      </div>

      {status && (
        <p role="status" className={cx("mt-3 text-sm", status.ok ? "text-success" : "text-danger")}>
          {status.text}
        </p>
      )}
    </div>
  );
}

export function AiSettingsCard() {
  const [saved, setSaved] = useState<AiSettings>(() => loadAiSettings());
  const provider = providerOf(saved.model);

  function pick(model: AiSettings["model"]) {
    const next = { ...saved, model };
    saveAiSettings(next);
    setSaved(next);
  }

  return (
    <Card className="mb-4" aria-labelledby="ai-h">
      <span id="ai" className="relative -top-20 block" aria-hidden />
      <CardTitle id="ai-h" icon={<Bot className="size-4" aria-hidden />}>
        AI study buddy
      </CardTitle>
      <p className="mb-3 text-sm text-muted">
        The study buddy reviews what you missed with you and answers questions when you&apos;re stuck. Keys are stored only in this browser, sent only to
        the AI provider, and never included in progress exports.
      </p>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium">AI model</legend>
        <div className="grid gap-2">
          {AI_MODELS.map((m) => (
            <label
              key={m.id}
              className={cx("flex cursor-pointer items-start gap-3 rounded-xl border p-3", saved.model === m.id ? "border-accent bg-accent-soft" : "border-line")}
            >
              <input type="radio" name="ai-model" className="mt-1 accent-[var(--accent)]" checked={saved.model === m.id} onChange={() => pick(m.id)} />
              <span>
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {m.label}
                  <span
                    className={cx(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      m.badge === "Free" || m.badge === "Best paid pick" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
                    )}
                  >
                    {m.badge}
                  </span>
                </span>
                <span className="block text-xs text-muted">{m.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mb-2 text-sm font-medium">{provider === "google" ? "Your Google key" : "Your Claude key"}</p>
      <KeySetup key={provider} provider={provider} settings={saved} onSaved={setSaved} />
    </Card>
  );
}
