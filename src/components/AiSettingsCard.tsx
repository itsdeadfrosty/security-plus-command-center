"use client";

import { useState } from "react";
import { Bot, CheckCircle2, ClipboardPaste, ExternalLink, Eye, EyeOff } from "lucide-react";
import { GEMINI_KEY_URL, looksLikeGeminiKey, saveAiSettings, useAiSettings, type AiSettings } from "@/lib/ai/settings";
import { useAccount } from "@/lib/storage/cloudSync";
import { Button, Card, CardTitle, cx } from "./ui";

const linkCls = "inline-flex items-center gap-1 font-medium text-accent underline";

/**
 * Click the link, copy the key, paste it here. Used in Settings and on the
 * Study Buddy page so a learner can go from nothing to chatting in one step.
 */
export function KeySetup({ settings, onSaved }: { settings: AiSettings; onSaved(next: AiSettings): void }) {
  const current = settings.geminiKey;
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();

  function save(raw: string) {
    const k = raw.trim();
    if (!looksLikeGeminiKey(k)) return setStatus({ ok: false, text: "That doesn't look like a Google API key. Copy the whole key from AI Studio." });
    const next = { ...settings, geminiKey: k };
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
    const next = { ...settings, geminiKey: "" };
    saveAiSettings(next);
    setStatus({ ok: true, text: "Key removed." });
    onSaved(next);
  }

  return (
    <div>
      {current ? (
        <p className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          Google key saved ({current.slice(0, 6)}…{current.slice(-4)}).
          <button type="button" onClick={remove} className="text-danger underline">
            Remove
          </button>
        </p>
      ) : (
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
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void pasteFromClipboard()}>
          <ClipboardPaste className="size-4" aria-hidden /> Paste key
        </Button>
        <label htmlFor="key-google" className="sr-only">
          Google API key
        </label>
        <input
          id="key-google"
          type={show ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save(key)}
          autoComplete="off"
          spellCheck={false}
          placeholder={current ? "Paste a new key to replace it" : "or paste it here (AIza…)"}
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
  const [saved, setSaved] = useAiSettings();
  const signedIn = useAccount().status !== "signed-out";
  return (
    <Card className="mb-4" aria-labelledby="ai-h">
      <span id="ai" className="relative -top-20 block" aria-hidden />
      <CardTitle id="ai-h" icon={<Bot className="size-4" aria-hidden />}>
        AI study buddy
      </CardTitle>
      <p className="mb-3 text-sm text-muted">
        The study buddy reviews what you missed with you and answers questions when you&apos;re stuck. It runs on Google Gemini with a free key: no
        credit card, and a daily limit applies. {signedIn
          ? "The key is saved in this browser and your account, so it follows you to any device you sign in on. It's sent only to Google and never included in progress exports."
          : "The key is stored only in this browser (sign in to keep it on every device), sent only to Google, and never included in progress exports."}
        Google may use free-tier chats to improve its products, so don&apos;t type personal information.
      </p>
      <KeySetup settings={saved} onSaved={setSaved} />
    </Card>
  );
}
