"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bot,
  ClipboardCheck,
  Flame,
  LayoutDashboard,
  MoreHorizontal,
  Puzzle,
  RotateCcw,
  Settings,
  ShieldCheck,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useFileSync } from "@/lib/storage/fileSync";
import { UpdateChecker } from "./UpdateChecker";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice/", label: "Practice", icon: Target },
  { href: "/review/", label: "Review", icon: RotateCcw },
  { href: "/blitz/", label: "Blitz", icon: Zap },
  { href: "/buddy/", label: "Study Buddy", icon: Bot },
  { href: "/challenges/", label: "Challenges", icon: Puzzle, planned: true },
  { href: "/exam/", label: "Exam Simulator", icon: ClipboardCheck, planned: true },
  { href: "/progress/", label: "Progress", icon: BarChart3 },
  { href: "/settings/", label: "Settings", icon: Settings },
];

const MOBILE_PRIMARY = ["/", "/practice/", "/review/", "/progress/"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.replace(/\/$/, "");
  return pathname === base || pathname.startsWith(base + "/") || (href === "/practice/" && pathname.startsWith("/session"));
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, derived, ready, warning, saveError, dismissWarning } = useStore();
  const fileSync = useFileSync();
  // The "More" menu is tied to the page it was opened on, so navigating closes it.
  const [moreOpenOn, setMoreOpenOn] = useState<string | null>(null);
  const moreOpen = moreOpenOn === pathname;
  const theme = data.profile.preferences.theme;
  const motion = data.profile.preferences.reducedMotion;

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    if (motion === "reduce") document.documentElement.dataset.motion = "reduce";
    else delete document.documentElement.dataset.motion;
    try {
      localStorage.setItem("spcc-theme", theme);
    } catch {
      /* preference only */
    }
  }, [theme, motion, ready]);

  return (
    <div className="min-h-dvh md:flex">
      <a href="#main" className="sr-only z-50 rounded bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-3">
          <ShieldCheck className="size-7 text-accent" aria-hidden />
          <span className="leading-tight">
            <span className="block font-semibold">Security+</span>
            <span className="block text-xs text-muted">Command Center</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, planned }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition",
                  active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="flex-1">{label}</span>
                {planned && <span className="text-[10px] uppercase tracking-wide text-muted">Soon</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-surface-2 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Flame className="size-4 text-warning" aria-hidden />
            {ready ? `${derived.streak.current}-day streak` : "Loading…"}
          </div>
          <p className="mt-1 text-xs text-muted">{ready ? derived.exam.version : "Security+"} practice. Not affiliated with CompTIA.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-6 text-accent" aria-hidden /> Security+ CC
          </Link>
          <span className="flex items-center gap-1 text-sm text-muted">
            <Flame className="size-4 text-warning" aria-hidden />
            {ready ? derived.streak.current : "–"}
            <span className="sr-only">day streak</span>
          </span>
        </header>

        {(warning || saveError) && (
          <div role="alert" className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm md:mx-8">
            <p className="flex-1">{saveError ?? warning}</p>
            {warning && !saveError && (
              <button type="button" onClick={dismissWarning} className="text-muted hover:text-fg" aria-label="Dismiss warning">
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        <UpdateChecker />

        {fileSync.status === "needs-permission" && (
          <div role="status" className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm md:mx-8">
            <p className="flex-1">Saving to {fileSync.fileName} is paused until you allow it again.</p>
            <button type="button" onClick={() => void fileSync.resume()} className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg">
              Resume saving
            </button>
          </div>
        )}

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {ready ? children : <LoadingState />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.filter((n) => MOBILE_PRIMARY.includes(n.href)).map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-accent" : "text-muted")}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpenOn(moreOpen ? null : pathname)}
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              className="flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] text-muted"
            >
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
        {moreOpen && (
          <ul id="more-menu" className="border-t border-line px-2 py-2">
            {NAV.filter((n) => !MOBILE_PRIMARY.includes(n.href)).map(({ href, label, icon: Icon, planned }) => (
              <li key={href}>
                <Link href={href} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm hover:bg-surface-2">
                  <Icon className="size-5 text-muted" aria-hidden />
                  <span className="flex-1">{label}</span>
                  {planned && <span className="text-[10px] uppercase tracking-wide text-muted">Soon</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your progress…</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
