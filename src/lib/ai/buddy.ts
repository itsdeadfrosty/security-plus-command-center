import type { Concept, ConceptMastery, ExamVersion, Question, QuestionAttempt } from "@/lib/types";
import type { AiSettings } from "./settings";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const TUTOR_PROMPT = `You are the study buddy inside Security+ Command Center, a practice app for the CompTIA Security+ exam. The learner has just been quizzed, and the app has handed you a concept they are struggling with plus the exact questions they missed.

Your job is to help them understand the concept well enough to recognize it in a tricky exam scenario, and to make it stick.

How to teach:
- Plain, friendly English. Explain jargon the first time you use it. Practical IT examples beat abstract analogies; use an analogy only if it is accurate and genuinely clarifies.
- Keep each reply short — usually under 150 words — and end with one question back to the learner (a quick check, not a lecture). Go longer only if they ask.
- Give a memory hook early: a short phrase, mnemonic, or "tell" that separates this concept from its look-alikes (for example "XSS = the victim's browser runs it; SQLi = the database runs it").
- Use their missed questions: name the clue in the scenario that pointed to the right answer and why their pick was tempting but wrong. Be kind about mistakes.
- When they answer your check question, tell them plainly whether it's right and why. If it's wrong, try a different angle rather than repeating yourself.
- When they seem solid, offer a fresh practice scenario in exam style (BEST / FIRST / MOST likely) with four options, wait for their answer, then explain.
- Stay on Security+ topics. If asked something unrelated, steer back briefly.

Accuracy:
- Treat the reference notes below as the app's ground truth and stay consistent with them. If you are unsure of a fact, say so instead of guessing.
- You do not know the real exam's questions. Never claim to, and never offer leaked or "real exam" questions; if asked, explain that using them breaks CompTIA's candidate agreement and can cost the learner their certification.

Formatting: short paragraphs, **bold** for key terms, and simple "- " bullet lists. No headings, tables, or code blocks unless showing a log line or command.`;

export interface BuddyContext {
  examVersion: ExamVersion;
  concept: Concept;
  contrastNames: { name: string; distinction: string }[];
  mastery?: ConceptMastery;
  missed: { question: Question; attempt: QuestionAttempt }[];
}

function optionText(q: Question, ids: string[]): string {
  if (q.type === "matching" && q.matching) {
    const cat = new Map(q.matching.categories.map((c) => [c.id, c.text]));
    return ids
      .map((p) => {
        const [opt, c] = p.split(":");
        return `${q.options.find((o) => o.id === opt)?.text} → ${cat.get(c)}`;
      })
      .join("; ");
  }
  return ids.map((id) => q.options.find((o) => o.id === id)?.text ?? id).join(q.type === "ordering" ? " → " : "; ");
}

function correctText(q: Question): string {
  if (q.type === "matching" && q.matching) {
    const cat = new Map(q.matching.categories.map((c) => [c.id, c.text]));
    return Object.entries(q.matching.answers)
      .map(([opt, c]) => `${q.options.find((o) => o.id === opt)?.text} → ${cat.get(c)}`)
      .join("; ");
  }
  return optionText(q, q.correctAnswerIds);
}

/** Learner-specific reference notes: goes in the system prompt so it stays fixed for the conversation. */
export function buildReferenceNotes(ctx: BuddyContext): string {
  const { concept, mastery } = ctx;
  const lines = [
    `Exam: CompTIA Security+ ${ctx.examVersion}, objective ${concept.objectives[ctx.examVersion] ?? "n/a"} (${concept.topic}).`,
    `Concept: ${concept.name}`,
    `App definition: ${concept.summary}`,
    `App example: ${concept.example}`,
  ];
  if (concept.more) lines.push(`More detail: ${concept.more}`);
  for (const c of ctx.contrastNames) lines.push(`Often confused with ${c.name}: ${c.distinction}`);
  if (mastery) {
    lines.push(
      `Learner record on this concept: ${mastery.correctAttempts}/${mastery.totalAttempts} correct, ${mastery.guessedCorrectAttempts} correct guesses, ${mastery.confidentMisses} confident misses. Status: ${mastery.masteryLabel}.`,
    );
  }
  ctx.missed.slice(0, 4).forEach(({ question: q, attempt: a }, i) => {
    lines.push(
      `Missed question ${i + 1}:`,
      q.scenario ? `  Scenario: ${q.scenario.replace(/\n/g, " / ")}` : "",
      `  Question: ${q.stem}`,
      `  Learner answered: ${optionText(q, a.selectedAnswerIds)}${a.confidence === "knew" ? " (and felt sure)" : a.confidence ? ` (${a.confidence} guess)` : ""}`,
      `  Correct: ${correctText(q)}`,
      `  Explanation: ${q.explanation}`,
    );
  });
  return lines.filter(Boolean).join("\n");
}

export const KICKOFF = "Help me get this concept. Start with the simplest explanation and a memory hook, then check my understanding.";

export class BuddyError extends Error {
  constructor(
    message: string,
    public kind: "auth" | "rate" | "network" | "refusal" | "other",
  ) {
    super(message);
  }
}

function systemText(ctx: BuddyContext): [string, string] {
  return [TUTOR_PROMPT, `Reference notes for this conversation:\n${buildReferenceNotes(ctx)}`];
}

/** Streams one tutor reply from Gemini using the learner's free key. */
export function streamBuddyReply(
  settings: AiSettings,
  ctx: BuddyContext,
  history: ChatTurn[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  return streamGemini(settings.geminiKey, ctx, history, onText, signal);
}

/**
 * Google's model names change often, so try the rolling "latest" alias first,
 * then recent Flash models. A missing model (404) or an exhausted free quota
 * (429) moves on to the next one; Flash-Lite has the largest free allowance.
 */
export const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];
let geminiStart = 0;

async function streamGemini(
  key: string,
  ctx: BuddyContext,
  history: ChatTurn[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const body = JSON.stringify({
    systemInstruction: { parts: systemText(ctx).map((text) => ({ text })) },
    contents: history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
    generationConfig: { maxOutputTokens: 4096 },
  });
  let lastStatus = 0;
  for (let i = geminiStart; i < GEMINI_MODELS.length; i++) {
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS[i]}:streamGenerateContent?alt=sse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        signal,
      });
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") throw new BuddyError("Stopped.", "other");
      throw new BuddyError("Couldn't reach Gemini. Check your connection.", "network");
    }
    if (res.ok && res.body) {
      geminiStart = i;
      return readGeminiStream(res.body, onText, signal);
    }
    lastStatus = res.status;
    const detail = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403 || (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(detail)))
      throw new BuddyError("Google rejected that API key. Check it in Settings.", "auth");
    // 5xx means that model is overloaded right now; another one usually answers.
    if (res.status !== 404 && res.status !== 429 && res.status < 500) throw new BuddyError(`Gemini returned an error (${res.status}).`, "other");
  }
  geminiStart = 0;
  if (lastStatus === 429) throw new BuddyError("You've used today's free Gemini allowance. It resets daily.", "rate");
  if (lastStatus >= 500) throw new BuddyError("Google's AI servers are busy right now. Wait a minute and try again.", "network");
  throw new BuddyError("No Gemini model was available for this key. Try again later.", "other");
}

async function readGeminiStream(stream: ReadableStream<Uint8Array>, onText: (delta: string) => void, signal?: AbortSignal): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let blocked = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const chunk = parseGeminiChunk(line.slice(5));
        if (chunk.blocked) blocked = true;
        if (chunk.text) {
          text += chunk.text;
          onText(chunk.text);
        }
      }
    }
  } catch {
    if (signal?.aborted) throw new BuddyError("Stopped.", "other");
    throw new BuddyError("The connection to Gemini dropped. Try again.", "network");
  }
  if (blocked && !text) throw new BuddyError("The model declined to answer that. Try rephrasing your question about the concept.", "refusal");
  return text;
}

/** One SSE `data:` payload → visible text (thought summaries skipped) and whether it was blocked. */
export function parseGeminiChunk(json: string): { text: string; blocked: boolean } {
  try {
    const d = JSON.parse(json) as {
      promptFeedback?: { blockReason?: string };
      candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    const c = d.candidates?.[0];
    const text = (c?.content?.parts ?? [])
      .filter((p) => !p.thought && p.text)
      .map((p) => p.text)
      .join("");
    const blocked = !!d.promptFeedback?.blockReason || ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "RECITATION"].includes(c?.finishReason ?? "");
    return { text, blocked };
  } catch {
    return { text: "", blocked: false };
  }
}
