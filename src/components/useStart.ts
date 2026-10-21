"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { StudyMode } from "@/lib/types";

export const MODE_INFO: Record<StudyMode, { title: string; blurb: string }> = {
  circuit: { title: "Run the Circuit", blurb: "10 questions on concepts you haven't proven yet. Clear every concept on the exam objectives." },
  quick: { title: "Quick Practice", blurb: "8 adaptive questions for a short session." },
  focused: { title: "Focused Practice", blurb: "15 questions on your weakest concepts and their look-alikes." },
  mixed: { title: "Mixed Practice", blurb: "12 questions balanced across all five domains by exam weight." },
  review: { title: "Review Due", blurb: "Only concepts that are scheduled for review right now." },
};

/** Starts a session (confirming before replacing an unfinished one) and opens it. */
export function useStartSession() {
  const { startSession, derived } = useStore();
  const router = useRouter();
  const [message, setMessage] = useState<string>();

  function start(mode: StudyMode, focusConceptIds?: string[]) {
    const active = derived.activeSession;
    if (active && Object.keys(active.answers).length > 0) {
      const ok = window.confirm("You have an unfinished session. Start a new one? Answers you already gave are kept.");
      if (!ok) return;
    }
    const s = startSession(mode, focusConceptIds);
    if (!s) {
      setMessage(mode === "review" ? "Nothing is due for review right now. Try Quick or Mixed practice." : "No questions available for this selection.");
      return;
    }
    setMessage(undefined);
    router.push("/session/");
  }

  return { start, message };
}
