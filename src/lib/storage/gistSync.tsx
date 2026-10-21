"use client";

/**
 * Cross-device sync through a private (secret) GitHub Gist in the learner's own
 * account. Every save reads the gist, merges (nothing from either device is
 * lost), then writes the result back, so a phone and a PC can both study and
 * stay in step. The token lives only in this browser's localStorage and is
 * never part of exports.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { mergeAppData } from "@/lib/engine/blitz";
import type { AppData } from "@/lib/types";
import { parseImport, serializeExport } from "./schema";

export const SYNC_TOKEN_URL = "https://github.com/settings/tokens/new?scopes=gist&description=Security%2B%20Command%20Center%20sync";
const FILE = "secplus-progress.json";
const DESC = "Security+ Command Center progress (synced by the app)";
const KEY = "spcc-sync";
const API = "https://api.github.com";

export type SyncStatus = "off" | "connecting" | "on" | "error";

interface Saved {
  token: string;
  gistId: string;
  login: string;
}

interface Sync {
  status: SyncStatus;
  login?: string;
  lastSynced?: Date;
  error?: string;
  connect(token: string): Promise<void>;
  syncNow(): Promise<void>;
  disconnect(): void;
}

const Ctx = createContext<Sync | null>(null);

function loadSaved(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    return s?.token && s.gistId ? s : null;
  } catch {
    return null;
  }
}

class SyncError extends Error {}

async function gh(token: string, path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch {
    throw new SyncError("Couldn't reach GitHub. Check your connection.");
  }
  if (res.status === 401) throw new SyncError("GitHub didn't accept that sync key. It may have expired; make a new one.");
  if (!res.ok) throw new SyncError(`GitHub returned an error (${res.status}).`);
  return res.json();
}

type Gist = { id: string; description?: string; files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }> };

async function readRemote(token: string, gistId: string): Promise<AppData | null> {
  const g = (await gh(token, `/gists/${gistId}`)) as Gist;
  const f = g.files[FILE];
  if (!f) return null;
  const text = f.truncated && f.raw_url ? await (await fetch(f.raw_url, { cache: "no-store" })).text() : (f.content ?? "");
  return text.trim() ? parseImport(text) : null;
}

async function writeRemote(token: string, gistId: string, data: AppData) {
  await gh(token, `/gists/${gistId}`, { method: "PATCH", body: JSON.stringify({ files: { [FILE]: { content: serializeExport(data, new Date()) } } }) });
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { data, ready, mergeData } = useStore();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [status, setStatus] = useState<SyncStatus>("off");
  const [lastSynced, setLastSynced] = useState<Date>();
  const [error, setError] = useState<string>();
  const dataRef = useRef(data);
  const synced = useRef<string>(""); // JSON of the data as last agreed with the gist
  const pulled = useRef(false); // never push before the first pull, or a fresh device could overwrite the gist
  const busy = useRef<Promise<void> | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /** Read the gist, merge it in, and write back if this device had anything new. */
  const sync = useCallback(
    (s: Saved) => {
      const run = async () => {
        try {
          const remote = await readRemote(s.token, s.gistId);
          const merged = remote ? mergeAppData(dataRef.current, remote) : dataRef.current;
          const json = JSON.stringify(merged);
          if (!remote || json !== JSON.stringify(remote)) await writeRemote(s.token, s.gistId, merged);
          if (remote) mergeData(remote);
          synced.current = json;
          pulled.current = true;
          setLastSynced(new Date());
          setError(undefined);
          setStatus("on");
        } catch (e) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Sync failed.");
        }
      };
      // One sync at a time; a request made meanwhile runs right after.
      const next = (busy.current ?? Promise.resolve()).then(run);
      busy.current = next;
      return next;
    },
    [mergeData],
  );

  // Restore and sync on load.
  useEffect(() => {
    if (!ready) return;
    const s = loadSaved();
    if (!s) return;
    const t = setTimeout(() => {
      setSaved(s);
      setStatus("connecting");
      void sync(s);
    }, 0);
    return () => clearTimeout(t);
  }, [ready, sync]);

  // Pick up the other device's progress when coming back to the app, and every few minutes.
  useEffect(() => {
    if (!saved) return;
    const onVisible = () => document.visibilityState === "visible" && void sync(saved);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(() => document.visibilityState === "visible" && void sync(saved), 3 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(timer);
    };
  }, [saved, sync]);

  // Push shortly after local changes.
  useEffect(() => {
    if (!saved || !pulled.current || status !== "on") return;
    if (JSON.stringify(data) === synced.current) return;
    const t = setTimeout(() => void sync(saved), 2500);
    return () => clearTimeout(t);
  }, [data, saved, status, sync]);

  const connect = useCallback(
    async (raw: string) => {
      const token = raw.trim();
      setStatus("connecting");
      setError(undefined);
      try {
        const user = (await gh(token, "/user")) as { login: string };
        const gists = (await gh(token, "/gists?per_page=100")) as Gist[];
        let gistId = gists.find((g) => g.files[FILE] && g.description === DESC)?.id;
        if (!gistId) {
          const created = (await gh(token, "/gists", {
            method: "POST",
            body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content: serializeExport(dataRef.current, new Date()) } } }),
          })) as Gist;
          gistId = created.id;
        }
        const s = { token, gistId, login: user.login };
        try {
          localStorage.setItem(KEY, JSON.stringify(s));
        } catch {
          // Works until the tab closes.
        }
        pulled.current = false;
        setSaved(s);
        await sync(s);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Couldn't connect.");
      }
    },
    [sync],
  );

  const disconnect = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    pulled.current = false;
    setSaved(null);
    setStatus("off");
    setLastSynced(undefined);
    setError(undefined);
  }, []);

  const syncNow = useCallback(async () => {
    if (saved) await sync(saved);
  }, [saved, sync]);

  return <Ctx.Provider value={{ status, login: saved?.login, lastSynced, error, connect, syncNow, disconnect }}>{children}</Ctx.Provider>;
}

export function useSync(): Sync {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSync must be used inside SyncProvider");
  return c;
}
