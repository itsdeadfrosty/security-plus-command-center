"use client";

/**
 * Auto-save progress to a file the learner picks (e.g. Documents/secplus-progress.json),
 * using the File System Access API (Chrome/Edge desktop). The browser only lets
 * a page write to a file the user chose, and asks again for permission on later
 * visits, so the flow is: choose once → auto-save on every change → one click
 * to resume after reopening the browser.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { parseImport, serializeExport } from "./schema";

// Minimal typings: the File System Access API isn't in TypeScript's DOM lib yet.
interface FsWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FsFileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FsWritable>;
  queryPermission(opts: { mode: "readwrite" }): Promise<PermissionState>;
  requestPermission(opts: { mode: "readwrite" }): Promise<PermissionState>;
}
type PickerWindow = Window & {
  showSaveFilePicker?: (opts: unknown) => Promise<FsFileHandle>;
  showOpenFilePicker?: (opts: unknown) => Promise<FsFileHandle[]>;
};

const PICKER_TYPES = [{ description: "Security+ progress", accept: { "application/json": [".json"] } }];

export type FileSyncStatus = "unsupported" | "off" | "needs-permission" | "on" | "error";

interface FileSync {
  status: FileSyncStatus;
  fileName?: string;
  lastSaved?: Date;
  error?: string;
  chooseNewFile(): Promise<void>;
  openExistingFile(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}

const Ctx = createContext<FileSync | null>(null);

// The file handle is kept in its own tiny IndexedDB store (handles can't go in JSON).
const DB = "spcc-filesync";
function handleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("h");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
/** Best effort: if the handle can't be remembered, saving still works until the tab closes. */
async function saveHandle(h: FsFileHandle | null) {
  try {
    const db = await handleDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("h", "readwrite");
      if (h) tx.objectStore("h").put(h, "file");
      else tx.objectStore("h").delete("file");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}
async function loadHandle(): Promise<FsFileHandle | null> {
  const db = await handleDb();
  return new Promise((resolve) => {
    const req = db.transaction("h").objectStore("h").get("file");
    req.onsuccess = () => resolve((req.result as FsFileHandle) ?? null);
    req.onerror = () => resolve(null);
  });
}

export function FileSyncProvider({ children }: { children: ReactNode }) {
  const { data, ready, replaceData } = useStore();
  const [supported] = useState(() => typeof window !== "undefined" && "showSaveFilePicker" in window);
  const [handle, setHandle] = useState<FsFileHandle | null>(null);
  const [status, setStatus] = useState<FileSyncStatus>(supported ? "off" : "unsupported");
  const [lastSaved, setLastSaved] = useState<Date>();
  const [error, setError] = useState<string>();
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const write = useCallback(async (h: FsFileHandle) => {
    try {
      const w = await h.createWritable();
      await w.write(serializeExport(dataRef.current, new Date()));
      await w.close();
      setLastSaved(new Date());
      setError(undefined);
      setStatus("on");
    } catch {
      setStatus("error");
      setError("Couldn't write to the save file. It may have been moved or deleted — choose it again.");
    }
  }, []);

  // Restore a previously chosen file on load.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    loadHandle()
      .then(async (h) => {
        if (!h || cancelled) return;
        setHandle(h);
        const perm = await h.queryPermission({ mode: "readwrite" });
        if (cancelled) return;
        setStatus(perm === "granted" ? "on" : "needs-permission");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [supported]);

  // Auto-save shortly after every change.
  useEffect(() => {
    if (!ready || !handle || status !== "on") return;
    const t = setTimeout(() => void write(handle), 1200);
    return () => clearTimeout(t);
  }, [data, ready, handle, status, write]);

  const chooseNewFile = useCallback(async () => {
    const w = window as PickerWindow;
    try {
      const h = await w.showSaveFilePicker!({ suggestedName: "secplus-progress.json", startIn: "documents", types: PICKER_TYPES });
      await saveHandle(h);
      setHandle(h);
      await write(h);
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") setError("Couldn't set up the save file.");
    }
  }, [write]);

  const openExistingFile = useCallback(async () => {
    const w = window as PickerWindow;
    try {
      const [h] = await w.showOpenFilePicker!({ startIn: "documents", types: PICKER_TYPES });
      const imported = parseImport(await (await h.getFile()).text());
      const ok = window.confirm(
        `Load progress from ${h.name}? It has ${imported.attempts.length} answers. Progress currently in this browser will be replaced, and future changes will save to this file.`,
      );
      if (!ok) return;
      if ((await h.requestPermission({ mode: "readwrite" })) !== "granted") {
        setError("Permission to save to that file was denied.");
        return;
      }
      replaceData(imported);
      dataRef.current = imported;
      await saveHandle(h);
      setHandle(h);
      setStatus("on");
      setLastSaved(new Date());
      setError(undefined);
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
      setError(e instanceof Error && e.message ? e.message : "Couldn't open that file.");
    }
  }, [replaceData]);

  const resume = useCallback(async () => {
    if (!handle) return;
    const perm = await handle.requestPermission({ mode: "readwrite" });
    if (perm === "granted") await write(handle);
    else setStatus("needs-permission");
  }, [handle, write]);

  const stop = useCallback(async () => {
    await saveHandle(null);
    setHandle(null);
    setStatus(supported ? "off" : "unsupported");
    setLastSaved(undefined);
  }, [supported]);

  return (
    <Ctx.Provider value={{ status, fileName: handle?.name, lastSaved, error, chooseNewFile, openExistingFile, resume, stop }}>{children}</Ctx.Provider>
  );
}

export function useFileSync(): FileSync {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFileSync must be used inside FileSyncProvider");
  return c;
}
