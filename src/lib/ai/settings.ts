/**
 * Study-buddy settings. The learner's free Google AI Studio key lives only in
 * this browser's localStorage: it is never part of progress exports, never sent
 * anywhere except generativelanguage.googleapis.com, and can be removed at any time.
 */
export const GEMINI_KEY_URL = "https://aistudio.google.com/apikey";

export interface AiSettings {
  geminiKey: string;
}

const KEY = "spcc-ai";
export const DEFAULT_AI: AiSettings = { geminiKey: "" };

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_AI;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return { geminiKey: typeof parsed.geminiKey === "string" ? parsed.geminiKey : "" };
  } catch {
    return DEFAULT_AI;
  }
}

/** Saving also drops any key fields from older versions of the app. */
export function saveAiSettings(s: AiSettings): boolean {
  try {
    if (!s.geminiKey) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ geminiKey: s.geminiKey }));
    return true;
  } catch {
    return false;
  }
}

/** Google keys start with "AIza"; allow other shapes Google may issue, but catch obvious paste mistakes. */
export function looksLikeGeminiKey(key: string): boolean {
  const k = key.trim();
  return /^AIza[0-9A-Za-z_-]{30,}$/.test(k) || /^[0-9A-Za-z_.-]{30,200}$/.test(k);
}
