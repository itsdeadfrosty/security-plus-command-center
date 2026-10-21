/**
 * Study-buddy settings. The API key is the learner's own and lives only in
 * this browser's localStorage: it is never part of progress exports, never sent
 * anywhere except api.anthropic.com, and can be removed at any time.
 */
export const AI_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "Best explanations. $4 / $20 per million tokens (input/output)." },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "Fast and capable. $2 / $10 per million tokens." },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "Cheapest and quickest. $0.10 / $0.50 per million tokens." },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];

export interface AiSettings {
  apiKey: string;
  model: AiModelId;
}

const KEY = "spcc-ai";
export const DEFAULT_AI: AiSettings = { apiKey: "", model: "claude-opus-5-5" };

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_AI;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    const model = AI_MODELS.some((m) => m.id === parsed.model) ? (parsed.model as AiModelId) : DEFAULT_AI.model;
    return { apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "", model };
  } catch {
    return DEFAULT_AI;
  }
}

export function saveAiSettings(s: AiSettings): boolean {
  try {
    if (!s.apiKey) localStorage.removeItem(KEY);
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
