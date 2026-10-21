import type { AppData, SeedPrior } from "@/lib/types";
import type { StorageAdapter } from "./adapters";
import { createInitialData, validateAppData } from "./schema";

export const DATA_KEY = "appdata";

export interface LoadResult {
  data: AppData;
  /** Shown to the learner when something went wrong but the app recovered. */
  warning?: string;
  /** True when this is the first run on this device. */
  fresh: boolean;
}

/**
 * Loads progress. Corrupt data is never silently discarded: the raw value is
 * copied to a backup key before starting fresh, so it can be recovered.
 */
export async function loadAppData(adapter: StorageAdapter, seedPriors: Record<string, SeedPrior>, now: Date): Promise<LoadResult> {
  let raw: string | null;
  try {
    raw = await adapter.get(DATA_KEY);
  } catch {
    return {
      data: createInitialData(seedPriors, now),
      fresh: true,
      warning: "Couldn't read saved progress from this browser. Progress this visit may not be saved.",
    };
  }
  if (raw === null) return { data: createInitialData(seedPriors, now), fresh: true };
  try {
    return { data: validateAppData(JSON.parse(raw)), fresh: false };
  } catch {
    const backupKey = `${DATA_KEY}-corrupt-${now.getTime()}`;
    try {
      await adapter.set(backupKey, raw);
    } catch {
      /* best effort */
    }
    return {
      data: createInitialData(seedPriors, now),
      fresh: true,
      warning: `Saved progress was unreadable, so a fresh profile was started. The damaged data was kept under "${backupKey}".`,
    };
  }
}

export async function saveAppData(adapter: StorageAdapter, data: AppData): Promise<void> {
  await adapter.set(DATA_KEY, JSON.stringify(data));
}
