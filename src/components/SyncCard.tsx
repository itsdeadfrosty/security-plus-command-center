"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardPaste, ExternalLink, RefreshCw, Smartphone } from "lucide-react";
import { SYNC_TOKEN_URL, useSync } from "@/lib/storage/gistSync";
import { Button, Card, CardTitle } from "./ui";

const linkCls = "inline-flex items-center gap-1 font-medium text-accent underline";

/** Settings card: keep a PC and a phone in step through a private GitHub Gist. */
export function SyncCard() {
  const sync = useSync();
  const [key, setKey] = useState("");

  async function paste() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      setKey(text);
      if (text) await sync.connect(text);
    } catch {
      // Clipboard blocked: the box below still works.
    }
  }

  return (
    <Card className="mb-4" aria-labelledby="sync-h">
      <span id="sync" className="relative -top-20 block" aria-hidden />
      <CardTitle id="sync-h" icon={<Smartphone className="size-4" aria-hidden />}>
        Sync between devices
      </CardTitle>

      {sync.status === "on" || (sync.login && sync.status !== "off") ? (
        <>
          <p className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            Syncing with GitHub ({sync.login})
            {sync.lastSynced && <span className="text-muted">· last synced {sync.lastSynced.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void sync.syncNow()} disabled={sync.status === "connecting"}>
              <RefreshCw className="size-4" aria-hidden /> Sync now
            </Button>
            <Button variant="ghost" onClick={sync.disconnect}>
              Turn off sync on this device
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            Study on your PC and phone with the same progress. Your progress is kept in a private file in your own GitHub account (free).
          </p>
          <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm">
            <li>
              <a href={SYNC_TOKEN_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
                Make a sync key on GitHub <ExternalLink className="size-3.5" aria-hidden />
              </a>{" "}
              (sign in or make a free account). Set <strong>Expiration</strong> to <strong>No expiration</strong>, tap <strong>Generate token</strong>, then copy it.
            </li>
            <li>
              Come back and tap <strong>Paste key</strong>.
            </li>
            <li>On your other device, open the app and paste the same key here.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void paste()} disabled={sync.status === "connecting"}>
              <ClipboardPaste className="size-4" aria-hidden /> Paste key
            </Button>
            <label htmlFor="sync-key" className="sr-only">
              GitHub sync key
            </label>
            <input
              id="sync-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && key.trim() && void sync.connect(key)}
              autoComplete="off"
              spellCheck={false}
              placeholder="or paste it here (ghp_…)"
              className="min-h-11 min-w-0 flex-1 basis-48 rounded-lg border border-line bg-surface-2 px-3 font-mono text-sm"
            />
            {key.trim() && (
              <Button onClick={() => void sync.connect(key)} disabled={sync.status === "connecting"}>
                Connect
              </Button>
            )}
          </div>
        </>
      )}

      {sync.status === "connecting" && <p className="mt-3 text-sm text-muted">Syncing…</p>}
      {sync.error && (
        <p role="status" className="mt-3 text-sm text-danger">
          {sync.error}
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        The key stays in this browser only and is never put in exports. On iPhone, don&apos;t use a <strong>Private</strong> Safari tab: Safari erases
        everything from private tabs when you close them. Use a normal tab, or Share → <strong>Add to Home Screen</strong>.
      </p>
    </Card>
  );
}
