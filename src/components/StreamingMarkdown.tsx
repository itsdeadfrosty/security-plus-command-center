"use client";

import { useEffect, useState } from "react";
import { SafeMarkdown } from "./SafeMarkdown";

/**
 * Gemini sends replies in a few big chunks, so text would jump in all at once.
 * This types it out smoothly as it arrives. Text that was already complete
 * when shown (older chat turns) appears instantly.
 */
export function StreamingMarkdown({ text }: { text: string }) {
  const [shown, setShown] = useState(text.length);

  useEffect(() => {
    if (shown >= text.length) return;
    const frame = requestAnimationFrame(() => {
      // Catch up faster when far behind, but always move a little.
      setShown((n) => Math.min(text.length, n + Math.max(2, Math.ceil((text.length - n) / 12))));
    });
    return () => cancelAnimationFrame(frame);
  }, [shown, text]);

  return <SafeMarkdown text={text.slice(0, shown)} />;
}
