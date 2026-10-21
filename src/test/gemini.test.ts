import { afterEach, describe, expect, it, vi } from "vitest";
import { parseGeminiChunk, streamBuddyReply, BuddyError, type BuddyContext } from "@/lib/ai/buddy";
import { looksLikeGeminiKey, DEFAULT_AI } from "@/lib/ai/settings";
import { conceptById } from "@/content/catalog";

const ctx: BuddyContext = { examVersion: "SY0-701", concept: conceptById.get("xss")!, contrastNames: [], mastery: undefined, missed: [] };

function sse(...chunks: object[]) {
  const text = chunks.map((c) => `data: ${JSON.stringify(c)}\r\n\r\n`).join("");
  return new Response(text, { status: 200 });
}

afterEach(() => vi.unstubAllGlobals());

describe("Gemini study buddy", () => {
  it("accepts Google-style keys and rejects junk", () => {
    expect(looksLikeGeminiKey("AIza" + "a".repeat(35))).toBe(true);
    expect(looksLikeGeminiKey("hello")).toBe(false);
    expect(looksLikeGeminiKey("https://aistudio.google.com/apikey and more words")).toBe(false);
  });

  it("skips thought parts and flags blocked replies", () => {
    expect(parseGeminiChunk(JSON.stringify({ candidates: [{ content: { parts: [{ text: "hmm", thought: true }, { text: "Hi" }] } }] }))).toEqual({ text: "Hi", blocked: false });
    expect(parseGeminiChunk(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } })).blocked).toBe(true);
    expect(parseGeminiChunk("not json")).toEqual({ text: "", blocked: false });
  });

  it("streams text and falls through to the next model on 404", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 404 }))
      .mockResolvedValueOnce(sse({ candidates: [{ content: { parts: [{ text: "XSS runs " }] } }] }, { candidates: [{ content: { parts: [{ text: "in the browser." }] } }] }));
    vi.stubGlobal("fetch", fetchMock);
    let shown = "";
    const out = await streamBuddyReply({ ...DEFAULT_AI, geminiKey: "AIza" + "k".repeat(35) }, ctx, [{ role: "user", content: "hi" }], (d) => (shown += d));
    expect(out).toBe("XSS runs in the browser.");
    expect(shown).toBe(out);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toMatch(/streamGenerateContent\?alt=sse$/);
    expect(init.headers["x-goog-api-key"]).toMatch(/^AIza/);
    expect(JSON.parse(init.body).contents[0]).toEqual({ role: "user", parts: [{ text: "hi" }] });
  });

  it("reports a rejected key clearly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":{"message":"API key not valid"}}', { status: 400 })));
    await expect(streamBuddyReply({ ...DEFAULT_AI, geminiKey: "AIza" + "k".repeat(35) }, ctx, [{ role: "user", content: "hi" }], () => {})).rejects.toMatchObject({
      kind: "auth",
    } satisfies Partial<BuddyError>);
  });
});
