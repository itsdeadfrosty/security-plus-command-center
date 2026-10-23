/**
 * Study-buddy settings. The learner's free Google AI Studio key lives in this
 * browser's localStorage and, when they're signed in, in their own account
 * document (see cloudSync). It is never part of progress exports, never sent to
 * any AI service except generativelanguage.googleapis.com, and can be removed at any time.
 */
import { useEffect, useState } from "react";

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

/** Fired on window after every save; detail.fromCloud is true when the account sync made the change. */
export const AI_CHANGED = "spcc-ai-changed";

/** Saving also drops any key fields from older versions of the app. */
export function saveAiSettings(s: AiSettings, fromCloud = false): boolean {
  try {
    if (!s.geminiKey) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ geminiKey: s.geminiKey }));
    window.dispatchEvent(new CustomEvent(AI_CHANGED, { detail: { fromCloud } }));
    return true;
  } catch {
    return false;
  }
}

/** Current settings, kept fresh when the key is saved elsewhere (another card, or the account sync). */
export function useAiSettings(): [AiSettings, (s: AiSettings) => void] {
  const [settings, setSettings] = useState<AiSettings>(() => (typeof window === "undefined" ? DEFAULT_AI : loadAiSettings()));
  useEffect(() => {
    const onChange = () => setSettings(loadAiSettings());
    window.addEventListener(AI_CHANGED, onChange);
    return () => window.removeEventListener(AI_CHANGED, onChange);
  }, []);
  return [settings, setSettings];
}

/** Google keys start with "AIza"; allow other shapes Google may issue, but catch obvious paste mistakes. */
export function looksLikeGeminiKey(key: string): boolean {
  const k = key.trim();
  return /^AIza[0-9A-Za-z_-]{30,}$/.test(k) || /^[0-9A-Za-z_.-]{30,200}$/.test(k);
}
