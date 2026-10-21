"use client";

import { useRef, useState } from "react";
import { Download, HardDrive, Moon, Sun, Upload, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { EXAM_VERSIONS } from "@/lib/types";
import { AiSettingsCard } from "@/components/AiSettingsCard";
import { FileSyncCard } from "@/components/FileSyncCard";
import { exams } from "@/content/catalog";
import { DataError, parseImport, serializeExport } from "@/lib/storage/schema";
import { Button, Card, CardTitle, PageHeader, cx } from "@/components/ui";

const STORAGE_LABEL = {
  indexeddb: "IndexedDB (this browser)",
  localstorage: "localStorage (fallback)",
  memory: "Temporary memory only — not saved",
  loading: "Loading…",
};

export default function SettingsPage() {
  const { data, updateProfile, replaceData, resetProgress, storageKind } = useStore();
  const prefs = data.profile.preferences;
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string }>();
  const [confirmReset, setConfirmReset] = useState("");

  function exportProgress() {
    const blob = new Blob([serializeExport(data, new Date())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secplus-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ tone: "ok", text: "Progress exported." });
  }

  async function importProgress(file: File) {
    try {
      const imported = parseImport(await file.text());
      const ok = window.confirm(
        `Replace current progress with this file? It contains ${imported.attempts.length} answers and ${imported.sessions.length} sessions. Your current progress will be overwritten.`,
      );
      if (!ok) return;
      replaceData(imported);
      setStatus({ tone: "ok", text: `Imported ${imported.attempts.length} answers.` });
    } catch (e) {
      setStatus({ tone: "error", text: e instanceof DataError ? e.message : "Couldn't read that file." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="animate-in max-w-3xl">
      <PageHeader title="Settings" />

      <Card className="mb-4" aria-labelledby="exam-h">
        <CardTitle id="exam-h">Your exam</CardTitle>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="exam-h">
          {EXAM_VERSIONS.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={data.profile.examVersion === v}
              onClick={() => updateProfile({ examVersion: v })}
              className={cx(
                "rounded-xl border p-3 text-left",
                data.profile.examVersion === v ? "border-accent bg-accent-soft" : "border-line hover:border-accent/60",
              )}
            >
              <span className="block font-semibold">{v}</span>
              <span className="block text-xs text-muted">{exams[v].status}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Your answers carry over when you switch. Concepts shared by both exams keep their progress, and each exam shows its own domains, weights
          and circuit.
        </p>
      </Card>

      <Card className="mb-4" aria-labelledby="pref-h">
        <CardTitle id="pref-h">Preferences</CardTitle>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium" id="theme-l">
              Theme
            </p>
            <div className="flex gap-2" role="radiogroup" aria-labelledby="theme-l">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={prefs.theme === t}
                  onClick={() => updateProfile({ preferences: { ...prefs, theme: t } })}
                  className={cx("flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm", prefs.theme === t ? "border-accent bg-accent-soft text-accent" : "border-line")}
                >
                  {t === "dark" ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          <Toggle
            label="Ask how confident I was after each answer"
            hint="Correct guesses are scheduled for review instead of counting as mastery."
            checked={prefs.askConfidence}
            onChange={(v) => updateProfile({ preferences: { ...prefs, askConfidence: v } })}
          />
          <Toggle
            label="Reduce motion"
            hint="Your system's reduced-motion setting is always respected; this forces it on."
            checked={prefs.reducedMotion === "reduce"}
            onChange={(v) => updateProfile({ preferences: { ...prefs, reducedMotion: v ? "reduce" : "system" } })}
          />

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Daily question goal</span>
            <input
              type="number"
              min={1}
              max={200}
              value={data.profile.studyGoal.dailyQuestions}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 1 && n <= 200) updateProfile({ studyGoal: { dailyQuestions: Math.round(n) } });
              }}
              className="min-h-11 w-28 rounded-lg border border-line bg-surface-2 px-3"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Display name</span>
            <input
              type="text"
              maxLength={60}
              value={data.profile.displayName}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
              className="min-h-11 w-full max-w-xs rounded-lg border border-line bg-surface-2 px-3"
            />
          </label>
        </div>
      </Card>

      <AiSettingsCard />

      <FileSyncCard />

      <Card className="mb-4" aria-labelledby="data-h">
        <CardTitle id="data-h" icon={<HardDrive className="size-4" aria-hidden />}>
          Your data
        </CardTitle>
        <p className="mb-1 text-sm">
          Stored in: <span className="font-medium">{STORAGE_LABEL[storageKind]}</span>
        </p>
        <p className="mb-4 text-sm text-muted">
          Progress stays on this device and is never sent anywhere. Clearing site data, using a private window, or switching devices or browsers
          means starting fresh, so keep a save file (above) or export a backup regularly.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportProgress}>
            <Download className="size-4" aria-hidden /> Export progress
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden /> Import progress
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => e.target.files?.[0] && importProgress(e.target.files[0])}
          />
        </div>
        {status && (
          <p role="status" className={cx("mt-3 text-sm", status.tone === "ok" ? "text-success" : "text-danger")}>
            {status.text}
          </p>
        )}
      </Card>

      <Card className="mb-4 border-danger/40" aria-labelledby="reset-h">
        <CardTitle id="reset-h" icon={<Trash2 className="size-4" aria-hidden />}>
          Reset progress
        </CardTitle>
        <p className="mb-3 text-sm text-muted">
          Deletes all answers, sessions and streaks on this device and restores the imported study-history priorities. Type <strong>RESET</strong> to confirm.
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="reset-confirm">
            Type RESET to confirm
          </label>
          <input
            id="reset-confirm"
            value={confirmReset}
            onChange={(e) => setConfirmReset(e.target.value)}
            className="min-h-11 w-32 rounded-lg border border-line bg-surface-2 px-3"
            autoComplete="off"
          />
          <Button
            variant="danger"
            disabled={confirmReset !== "RESET"}
            onClick={() => {
              resetProgress();
              setConfirmReset("");
              setStatus({ tone: "ok", text: "Progress reset." });
            }}
          >
            Reset all progress
          </Button>
        </div>
      </Card>

      <Card aria-labelledby="about-h">
        <CardTitle id="about-h">About</CardTitle>
        <p className="text-sm text-muted">
          Security+ Command Center is an independent study tool for the CompTIA Security+ SY0-701 exam. It is not affiliated with or endorsed by
          CompTIA. All questions are original. Practice results are not a prediction of your official scaled score (passing is 750 on a 100–900
          scale).
        </p>
      </Card>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx("relative h-7 w-12 shrink-0 rounded-full border transition", checked ? "border-accent bg-accent" : "border-line bg-surface-2")}
      >
        <span className={cx("absolute top-0.5 size-5 rounded-full bg-fg transition-all", checked ? "left-6 bg-accent-fg" : "left-0.5")} />
      </button>
    </div>
  );
}
