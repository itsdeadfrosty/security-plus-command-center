"use client";

import { useState } from "react";
import { Bot, Eye, EyeOff } from "lucide-react";
import { AI_MODELS, loadAiSettings, looksLikeApiKey, saveAiSettings, type AiSettings } from "@/lib/ai/settings";
import { Button, Card, CardTitle, cx } from "./ui";

export function AiSettingsCard() {
  const [saved, setSaved] = useState<AiSettings>(() => loadAiSettings());
  const [key, setKey] = useState(saved.apiKey);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();

  function persist(next: AiSettings, msg: string) {
    if (saveAiSettings(next)) {
      setSaved(next);
      setStatus({ ok: true, text: msg });
    } else setStatus({ ok: false, text: "This browser blocked saving the key." });
  }

  return (
    <Card className="mb-4" aria-labelledby="ai-h">
      <span id="ai" className="relative -top-20 block" aria-hidden />
      <CardTitle id="ai-h" icon={<Bot className="size-4" aria-hidden />}>
        AI study buddy (optional)
      </CardTitle>
      <p className="mb-3 text-sm text-muted">
        The study buddy uses Claude with your own Anthropic API key (create one at console.anthropic.com → API keys). The key is stored only in this
        browser, is sent only to api.anthropic.com, and is never included in progress exports. Usage is billed to your Anthropic account.
      </p>

      <label htmlFor="ai-key" className="mb-1 block text-sm font-medium">
        API key
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="ai-key"
          type={show ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-3 font-mono text-sm"
        />
        <Button variant="ghost" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide key" : "Show key"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
        <Button
          variant="primary"
          disabled={key.trim() === saved.apiKey}
          onClick={() => {
            if (!looksLikeApiKey(key)) return setStatus({ ok: false, text: "That doesn't look like an Anthropic API key (it should start with sk-ant-)." });
            persist({ ...saved, apiKey: key.trim() }, "Key saved. The study buddy is ready.");
          }}
        >
          Save key
        </Button>
        {saved.apiKey && (
          <Button
            variant="danger"
            onClick={() => {
              setKey("");
              persist({ ...saved, apiKey: "" }, "Key removed from this browser.");
            }}
          >
            Remove
          </Button>
        )}
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium">Model</legend>
        <div className="grid gap-2">
          {AI_MODELS.map((m) => (
            <label
              key={m.id}
              className={cx("flex cursor-pointer items-start gap-3 rounded-xl border p-3", saved.model === m.id ? "border-accent bg-accent-soft" : "border-line")}
            >
              <input
                type="radio"
                name="ai-model"
                className="mt-1 accent-[var(--accent)]"
                checked={saved.model === m.id}
                onChange={() => persist({ ...saved, model: m.id }, `Using ${m.label}.`)}
              />
              <span>
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-muted">{m.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {status && (
        <p role="status" className={cx("mt-3 text-sm", status.ok ? "text-success" : "text-danger")}>
          {status.text}
        </p>
      )}
    </Card>
  );
}
