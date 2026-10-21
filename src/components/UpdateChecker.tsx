"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * Static hosts cache pages for a few minutes, so an open tab can keep showing
 * an old version after a deploy. This compares the running build with the
 * deployed one (version.json, never cached) and reloads with a cache-busting
 * URL. Progress is already saved, so reloading is safe; mid-session it asks first.
 */
export function UpdateChecker() {
  const pathname = usePathname();
  const [latest, setLatest] = useState<string>();

  useEffect(() => {
    if (BUILD === "dev") return;
    const check = () => {
      deployedBuild().then((build) => build && build !== BUILD && setLatest(build));
    };
    const onVisible = () => document.visibilityState === "visible" && check();
    const first = setTimeout(check, 0);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => {
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(timer);
    };
  }, []);

  const inSession = pathname.startsWith("/session");

  // Tidy the cache-busting parameter out of the address bar after an update.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("v")) {
      url.searchParams.delete("v");
      history.replaceState(history.state, "", url.toString());
    }
  }, []);

  // Outside a question session, update automatically (once per build, so a
  // stubborn cache can't cause a reload loop; the banner covers that case).
  const autoTried = latest ? safeGet(TRIED) === latest : false;
  useEffect(() => {
    if (latest && !inSession && !autoTried) {
      safeSet(TRIED, latest);
      reloadTo(latest);
    }
  }, [latest, inSession, autoTried]);

  if (!latest || (!inSession && !autoTried)) return null;
  return (
    <div role="status" className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm md:mx-8">
      <p className="flex-1">A new version of the app is available. Your progress is saved.</p>
      <button type="button" onClick={() => reloadTo(latest)} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg">
        <RefreshCw className="size-4" aria-hidden /> Update now
      </button>
    </div>
  );
}

async function deployedBuild(): Promise<string | undefined> {
  try {
    const res = await fetch(`${BASE}/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return undefined;
    return ((await res.json()) as { build?: string }).build;
  } catch {
    return undefined; // offline or blocked: try again later
  }
}

const TRIED = "spcc-update-tried";
function safeGet(k: string) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function safeSet(k: string, v: string) {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    // ignore
  }
}

/** A new query string makes the browser fetch fresh HTML instead of its cached copy. */
function reloadTo(build: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("v", build.slice(0, 8));
  window.location.replace(url.toString());
}
