"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { conceptDomain, questionById, questionDomain } from "@/content/catalog";
import { dailySeries, formatDuration, masteryByDomain, overallStats, weaknessesResolved, type DomainMastery } from "@/lib/engine/stats";
import { Card, CardTitle, PageHeader, Stat, cx } from "@/components/ui";
import { CircuitCard } from "@/components/CircuitCard";

const getQuestion = (id: string) => questionById.get(id);

const axis = { stroke: "var(--muted)", fontSize: 12, tickLine: false, axisLine: false } as const;
const tooltipStyle = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--fg)", fontSize: 13 },
  labelStyle: { color: "var(--muted)" },
  cursor: { fill: "var(--accent-soft)", stroke: "var(--line)" },
};

export default function ProgressPage() {
  const { data, derived } = useStore();
  const [showTable, setShowTable] = useState(false);
  const now = useMemo(() => new Date(), []);
  const stats = overallStats(data.attempts, getQuestion, derived.days);
  const series = dailySeries(data.attempts, getQuestion, now, 14);
  const v = derived.exam.version;
  const domains = masteryByDomain(
    derived.exam.certification.domains,
    (id) => conceptDomain(id, v),
    (q) => questionDomain(q, v),
    derived.mastery,
    data.attempts.filter((a) => questionById.has(a.questionId)),
    getQuestion,
  );
  const completedSessions = data.sessions.filter((s) => s.status === "completed").length;
  const activeDays = series.filter((d) => d.answered > 0).length;
  const hasData = data.attempts.length > 0;

  return (
    <div className="animate-in">
      <PageHeader title="Progress" subtitle="Everything here is calculated from answers you've actually given on this device." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Answers" value={stats.totalAnswered} />
        <Stat label="Unique questions" value={`${stats.uniqueAnswered}/${derived.exam.questions.length}`} />
        <Stat label="Accuracy" value={stats.accuracy === null ? "—" : `${Math.round(stats.accuracy * 100)}%`} />
        <Stat label="Sessions finished" value={completedSessions} />
        <Stat label="Weaknesses resolved" value={weaknessesResolved(derived.mastery)} hint="Missed once, now Familiar+" />
        <Stat label="Study time" value={formatDuration(stats.studyTimeMs)} />
      </div>

      {!hasData && (
        <Card className="mb-4">
          <p className="text-muted">No answers yet. Charts appear after your first practice session.</p>
        </Card>
      )}

      {hasData && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card aria-labelledby="perday-h">
            <CardTitle id="perday-h">Questions answered per day</CardTitle>
            <p className="-mt-2 mb-3 text-xs text-muted">Last 14 days · {activeDays} active days</p>
            <div className="h-56" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} {...axis} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, "Answered"]} />
                  <Bar dataKey="answered" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card aria-labelledby="acc-h">
            <CardTitle id="acc-h">Accuracy over time</CardTitle>
            <p className="-mt-2 mb-3 text-xs text-muted">Daily % correct · gaps are days with no practice</p>
            <div className="h-56" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} unit="%" {...axis} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Accuracy"]} />
                  <Line type="monotone" dataKey="accuracy" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <CircuitCard detailed className="mt-4" />

      <Card className="mt-4" aria-labelledby="dom-h">
        <CardTitle id="dom-h">Mastery by exam domain</CardTitle>
        <Legend />
        <ul className="mt-4 space-y-4">
          {domains.map((d) => (
            <DomainRow key={d.domainId} d={d} />
          ))}
        </ul>
        <button type="button" className="mt-4 text-sm text-accent underline" aria-expanded={showTable} onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Hide" : "Show"} data table
        </button>
        {showTable && <DataTable domains={domains} series={series} />}
        <p className="mt-3 text-xs text-muted">
          {derived.exam.concepts.length} tracked concepts for {v}. Mastery levels are an explainable estimate from your answers and confidence, not an official score.
        </p>
      </Card>
    </div>
  );
}

const LEVELS = [
  { key: "needsWork", label: "Needs work", color: "var(--seq-1)" },
  { key: "learning", label: "Learning", color: "var(--seq-2)" },
  { key: "familiar", label: "Familiar", color: "var(--seq-3)" },
  { key: "mastered", label: "Mastered", color: "var(--seq-4)" },
] as const;

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-line bg-surface-2" aria-hidden /> Not practiced
      </li>
      {LEVELS.map((l) => (
        <li key={l.key} className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: l.color }} aria-hidden /> {l.label}
        </li>
      ))}
    </ul>
  );
}

function DomainRow({ d }: { d: DomainMastery }) {
  const segments = [...LEVELS.map((l) => ({ label: l.label, color: l.color, n: d[l.key] })), { label: "Not practiced", color: "var(--surface-2)", n: d.untouched }];
  const summary = `${d.name}: ${segments.map((s) => `${s.n} ${s.label.toLowerCase()}`).join(", ")}`;
  return (
    <li>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">
          {d.domainId.replace(".0", "")}. {d.name}
        </span>
        <span className="text-xs text-muted">
          {d.attempts} answers{d.accuracy !== null && ` · ${Math.round(d.accuracy * 100)}% correct`}
        </span>
      </div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-md" role="img" aria-label={summary}>
        {segments
          .filter((s) => s.n > 0)
          .map((s) => (
            <div key={s.label} title={`${s.label}: ${s.n} concept${s.n === 1 ? "" : "s"}`} className={cx("h-full first:rounded-l-md last:rounded-r-md")} style={{ flexGrow: s.n, background: s.color }} />
          ))}
      </div>
    </li>
  );
}

function DataTable({ domains, series }: { domains: DomainMastery[]; series: { date: string; answered: number; accuracy: number | null }[] }) {
  return (
    <div className="mt-3 space-y-4 overflow-x-auto text-sm">
      <table className="w-full min-w-[480px] text-left">
        <caption className="mb-1 text-left text-xs text-muted">Concepts by mastery level</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th className="py-1 pr-2 font-medium">Domain</th>
            <th className="px-2 font-medium">Needs work</th>
            <th className="px-2 font-medium">Learning</th>
            <th className="px-2 font-medium">Familiar</th>
            <th className="px-2 font-medium">Mastered</th>
            <th className="px-2 font-medium">Not practiced</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {domains.map((d) => (
            <tr key={d.domainId} className="border-t border-line">
              <td className="py-1 pr-2">{d.name}</td>
              <td className="px-2">{d.needsWork}</td>
              <td className="px-2">{d.learning}</td>
              <td className="px-2">{d.familiar}</td>
              <td className="px-2">{d.mastered}</td>
              <td className="px-2">{d.untouched}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full min-w-[320px] text-left">
        <caption className="mb-1 text-left text-xs text-muted">Daily activity, last 14 days</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th className="py-1 pr-2 font-medium">Date</th>
            <th className="px-2 font-medium">Answered</th>
            <th className="px-2 font-medium">Accuracy</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {series.map((s) => (
            <tr key={s.date} className="border-t border-line">
              <td className="py-1 pr-2">{s.date}</td>
              <td className="px-2">{s.answered}</td>
              <td className="px-2">{s.accuracy === null ? "—" : `${s.accuracy}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
