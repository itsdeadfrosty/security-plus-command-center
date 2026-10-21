/**
 * Key-value storage adapters. IndexedDB is preferred; localStorage and an
 * in-memory store are fallbacks so the app still runs (with a warning) in
 * private windows or when storage is blocked.
 */
export interface StorageAdapter {
  kind: "indexeddb" | "localstorage" | "memory";
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const DB_NAME = "secplus-command-center";
const STORE = "kv";

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function createIndexedDbAdapter(factory: IDBFactory = indexedDB): Promise<StorageAdapter> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = factory.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error("IndexedDB open blocked"));
  });
  const tx = (mode: IDBTransactionMode) => db.transaction(STORE, mode).objectStore(STORE);
  return {
    kind: "indexeddb",
    async get(key) {
      const v = await idbRequest(tx("readonly").get(key));
      return typeof v === "string" ? v : null;
    },
    async set(key, value) {
      await idbRequest(tx("readwrite").put(value, key));
    },
    async remove(key) {
      await idbRequest(tx("readwrite").delete(key));
    },
  };
}

export function createLocalStorageAdapter(ls: Storage = localStorage): StorageAdapter {
  // Probe: throws in some privacy modes.
  ls.setItem("__probe", "1");
  ls.removeItem("__probe");
  return {
    kind: "localstorage",
    get: async (k) => ls.getItem(k),
    set: async (k, v) => ls.setItem(k, v),
    remove: async (k) => ls.removeItem(k),
  };
}

export function createMemoryAdapter(initial: Record<string, string> = {}): StorageAdapter {
  const m = new Map(Object.entries(initial));
  return {
    kind: "memory",
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => void m.set(k, v),
    remove: async (k) => void m.delete(k),
  };
}

export async function openBestAdapter(): Promise<StorageAdapter> {
  try {
    if (typeof indexedDB !== "undefined") return await createIndexedDbAdapter();
  } catch {
    /* fall through */
  }
  try {
    if (typeof localStorage !== "undefined") return createLocalStorageAdapter();
  } catch {
    /* fall through */
  }
  return createMemoryAdapter();
}
