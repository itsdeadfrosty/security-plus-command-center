import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { Concept, ConceptMastery, ExamVersion, Question, QuestionAttempt } from "@/lib/types";
import type { AiSettings } from "./settings";

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

/**
 * Streams one tutor reply. Calls Claude directly from the browser with the
 * learner's own key (dangerouslyAllowBrowser is required for that and is
 * acceptable here because the key belongs to the person using the page).
 */
export async function streamBuddyReply(
  settings: AiSettings,
  ctx: BuddyContext,
  history: BetaMessageParam[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const client = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  try {
    const stream = client.beta.messages.stream(
      {
        model: settings.model,
        max_tokens: 4096,
        // Fixed system text first so repeated turns hit the prompt cache.
        system: [
          { type: "text", text: TUTOR_PROMPT },
          { type: "text", text: `Reference notes for this conversation:\n${buildReferenceNotes(ctx)}` },
        ],
        cache_control: { type: "ephemeral" },
        output_config: { effort: "medium" },
        // Server-side fallback if a model declines; the API picks the fallback by category.
        ...(settings.model === "claude-haiku-5-5" ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }),
        messages: history,
      },
      { signal },
    );
    let text = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        text += event.delta.text;
        onText(event.delta.text);
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      throw new BuddyError("The model declined to answer that. Try rephrasing your question about the concept.", "refusal");
    }
    return text;
  } catch (e) {
    if (e instanceof BuddyError) throw e;
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
      throw new BuddyError("Your API key was rejected. Check it in Settings.", "auth");
    if (e instanceof Anthropic.RateLimitError) throw new BuddyError("Rate limit reached. Wait a moment and try again.", "rate");
    if (e instanceof Anthropic.APIUserAbortError) throw new BuddyError("Stopped.", "other");
    if (e instanceof Anthropic.APIConnectionError) throw new BuddyError("Couldn't reach Claude. Check your connection.", "network");
    if (e instanceof Anthropic.APIError) throw new BuddyError(`Claude returned an error (${e.status ?? "unknown"}).`, "other");
    throw new BuddyError("Something went wrong talking to Claude.", "other");
  }
}
