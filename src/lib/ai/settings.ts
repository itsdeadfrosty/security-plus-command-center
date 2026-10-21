/**
 * Study-buddy settings. The API key is the learner's own and lives only in
 * this browser's localStorage: it is never part of progress exports, never sent
 * anywhere except api.anthropic.com, and can be removed at any time.
 */
/** Ranked for this job (explaining exam concepts): free first, then best value. */
export const AI_MODELS = [
  {
    id: "gemini",
    provider: "google",
    label: "Google Gemini",
    badge: "Free",
    note: "Free key from Google, no credit card. Good explanations; a daily limit applies. Google may use free-tier chats to improve its products.",
  },
  {
    id: "claude-sonnet-5-5",
    provider: "anthropic",
    label: "Claude Sonnet 5.5",
    badge: "Best paid pick",
    note: "Clearest, most careful explanations. Pay-as-you-go: $2 / $10 per million tokens (input/output).",
  },
  {
    id: "claude-haiku-5-5",
    provider: "anthropic",
    label: "Claude Haiku 5.5",
    badge: "Cheapest paid",
    note: "Plenty for definitions, memory tricks and quick quizzes. $0.10 / $0.50 per million tokens.",
  },
  {
    id: "claude-opus-5-5",
    provider: "anthropic",
    label: "Claude Opus 5.5",
    badge: "Usually more than you need",
    note: "Most capable, about twice Sonnet's cost. Only worth it if Sonnet's explanations aren't landing. $4 / $20 per million tokens.",
  },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];
export type AiProvider = "google" | "anthropic";

export const GEMINI_KEY_URL = "https://aistudio.google.com/apikey";
export const API_KEYS_URL = "https://platform.claude.com/settings/keys";
export const BILLING_URL = "https://platform.claude.com/settings/billing";

export interface AiSettings {
  /** Anthropic key. */
  apiKey: string;
  /** Google AI Studio key. */
  geminiKey: string;
  model: AiModelId;
}

const KEY = "spcc-ai";
export const DEFAULT_AI: AiSettings = { apiKey: "", geminiKey: "", model: "gemini" };

export function providerOf(model: AiModelId): AiProvider {
  return AI_MODELS.find((m) => m.id === model)!.provider;
}

/** The key the chosen model needs, or "" if it hasn't been added. */
export function activeKey(s: AiSettings): string {
  return providerOf(s.model) === "google" ? s.geminiKey : s.apiKey;
}

export function modelLabel(model: AiModelId): string {
  return AI_MODELS.find((m) => m.id === model)!.label;
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_AI;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    const apiKey = typeof parsed.apiKey === "string" ? parsed.apiKey : "";
    const geminiKey = typeof parsed.geminiKey === "string" ? parsed.geminiKey : "";
    const model = AI_MODELS.some((m) => m.id === parsed.model) ? (parsed.model as AiModelId) : DEFAULT_AI.model;
    return { apiKey, geminiKey, model };
  } catch {
    return DEFAULT_AI;
  }
}

export function saveAiSettings(s: AiSettings): boolean {
  try {
    if (!s.apiKey && !s.geminiKey) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** Light sanity check so typos are caught before a request is made. */
export function looksLikeApiKey(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/** Google keys start with "AIza"; allow other shapes Google may issue, but catch obvious paste mistakes. */
export function looksLikeGeminiKey(key: string): boolean {
  const k = key.trim();
  return /^AIza[0-9A-Za-z_-]{30,}$/.test(k) || /^[0-9A-Za-z_.-]{30,200}$/.test(k);
}
