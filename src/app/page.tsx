"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Flame, Gauge, Minus, Play, Plus, Sparkles, Target } from "lucide-react";
import { useStore, rankedConcepts } from "@/lib/store";
import { conceptDomain, domainName, questionById } from "@/content/catalog";
import { overallStats, recentImprovement, formatDuration } from "@/lib/engine/stats";
import { isInReviewQueue } from "@/lib/engine/selection";
import { localDateKey, shiftDateKey } from "@/lib/engine/time";
import { answeredCount, resumeIndex } from "@/lib/engine/session";
import { Badge, Button, ButtonLink, Card, CardTitle, PageHeader, ProgressBar, Stat, cx, masteryTone } from "@/components/ui";
import { MODE_INFO, useStartSession } from "@/components/useStart";
import { CircuitCard } from "@/components/CircuitCard";

const getQuestion = (id: string) => questionById.get(id);

export default function Dashboard() {
  const { data, derived, updateProfile } = useStore();
  const { start, message } = useStartSession();
  const now = new Date();
  const { streak, mastery, days, recommendation, activeSession } = derived;
  const stats = overallStats(data.attempts, getQuestion, days);
  const improvement = recentImprovement(data.attempts, getQuestion, now);
  const masteryList = [...mastery.values()];
  const masteredCount = masteryList.filter((m) => m.masteryLabel === "Mastered").length;
  const practicedCount = masteryList.filter((m) => m.totalAttempts > 0).length;
  const reviewCount = masteryList.filter((m) => isInReviewQueue(m, now)).length;
  const weaknesses = rankedConcepts(mastery, now)
    .filter((x) => x.priority >= 50)
    .slice(0, 5);
  const goal = data.profile.studyGoal.dailyQuestions;

  return (
    <div className="animate-in">
      <PageHeader title="Dashboard" subtitle={`Studying for ${derived.exam.version}. Questions first: the app learns what you know and focuses on what you don't.`} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Continue studying */}
        <Card className="lg:col-span-2" aria-labelledby="continue-h">
          <CardTitle id="continue-h" icon={<Play className="size-4" aria-hidden />}>
            Continue studying
          </CardTitle>
          {activeSession ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">
                  {MODE_INFO[activeSession.type].title} — {answeredCount(activeSession)} of {activeSession.questionIds.length} answered
                </p>
                <p className="text-sm text-muted">Pick up exactly where you left off.</p>
              </div>
              <ButtonLink href="/session/" variant="primary">
                Resume Question {resumeIndex(activeSession) + 1}
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles className="size-5 text-accent" aria-hidden />
                  Recommended: {MODE_INFO[recommendation.mode].title}
                </p>
                <p className="text-sm text-muted">{recommendation.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => start(recommendation.mode)}>
                  Start {MODE_INFO[recommendation.mode].title}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
                <ButtonLink href="/practice/">Other modes</ButtonLink>
              </div>
            </div>
          )}
          {message && (
            <p role="status" className="mt-3 text-sm text-warning">
              {message}
            </p>
          )}
        </Card>

        {/* Daily objective */}
        <Card aria-labelledby="goal-h">
          <CardTitle id="goal-h" icon={<Target className="size-4" aria-hidden />}>
            Daily objective
          </CardTitle>
          <p className="text-lg font-semibold">
            {streak.questionsToday} / {goal} questions
          </p>
          <div className="my-3">
            <ProgressBar value={streak.questionsToday} max={goal} label="Daily question goal" tone={streak.questionsToday >= goal ? "success" : "accent"} />
          </div>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{streak.questionsToday >= goal ? "Goal reached today." : `${goal - streak.questionsToday} to go.`}</span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg border border-line hover:border-accent"
                aria-label="Decrease daily goal"
                onClick={() => updateProfile({ studyGoal: { dailyQuestions: Math.max(5, goal - 5) } })}
              >
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg border border-line hover:border-accent"
                aria-label="Increase daily goal"
                onClick={() => updateProfile({ studyGoal: { dailyQuestions: Math.min(100, goal + 5) } })}
              >
                <Plus className="size-4" />
              </button>
            </span>
          </div>
        </Card>

        <CircuitCard className="lg:col-span-3" />

        {/* Streak */}
        <Card aria-labelledby="streak-h">
          <CardTitle id="streak-h" icon={<Flame className="size-4" aria-hidden />}>
            Study streak
          </CardTitle>
          <p className="text-2xl font-semibold">
            {streak.current}-Day Study Streak
          </p>
          <p className="mt-1 text-sm text-muted">{streakMessage(streak, data.attempts.length > 0)}</p>
          <p className="mt-1 text-xs text-muted">Longest: {streak.longest} day{streak.longest === 1 ? "" : "s"} · A day counts with one finished session or 5 answers.</p>
          <ActivityCalendar days={days} today={now} />
        </Card>

        {/* Progress overview */}
        <Card className="lg:col-span-2" aria-labelledby="overview-h">
          <CardTitle id="overview-h" icon={<Gauge className="size-4" aria-hidden />}>
            Progress overview
          </CardTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Overall accuracy" value={stats.accuracy === null ? "—" : `${Math.round(stats.accuracy * 100)}%`} hint={`${stats.correct} correct`} />
            <Stat label="Questions answered" value={stats.totalAnswered} hint={`${stats.uniqueAnswered} unique`} />
            <Stat label="Concepts to review" value={reviewCount} hint={<Link href="/review/" className="underline">Open review</Link>} />
            <Stat label="Concepts mastered" value={`${masteredCount}/${derived.exam.concepts.length}`} />
            <Stat label="Study time" value={formatDuration(stats.studyTimeMs)} hint="Answering time" />
            <Stat label="Study stage" value={<span className="text-base">{studyStage(practicedCount, masteryList)}</span>} hint={`${practicedCount} concepts practiced`} />
            <Stat
              label="Last 7 days vs. prior 7"
              value={improvement ? `${improvement.delta >= 0 ? "+" : ""}${Math.round(improvement.delta * 100)} pts` : "—"}
              hint={improvement ? `${Math.round(improvement.recent * 100)}% recent accuracy` : "Needs 10+ answers in each week"}
            />
          </div>
        </Card>

        {/* Weaknesses */}
        <Card className="lg:col-span-3" aria-labelledby="weak-h">
          <CardTitle id="weak-h" icon={<CalendarDays className="size-4" aria-hidden />}>
            Areas needing the most attention
          </CardTitle>
          {weaknesses.length === 0 ? (
            <p className="text-muted">Nothing urgent. Keep practicing to surface new gaps.</p>
          ) : (
            <ul className="divide-y divide-line">
              {weaknesses.map(({ m, concept }) => (
                <li key={m.conceptId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium">{concept.name}</p>
                    <p className="text-xs text-muted">
                      {domainName(conceptDomain(concept.id, derived.exam.version) ?? "", derived.exam.version)} · {m.totalAttempts ? `${m.incorrectAttempts} missed, ${m.guessedCorrectAttempts} guessed` : m.seed === "weak" ? "From imported study history" : "Not practiced yet"}
                    </p>
                  </div>
                  <Badge tone={masteryTone[m.masteryLabel]}>{m.masteryLabel}</Badge>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => start("focused")}>
              <Target className="size-4" aria-hidden /> Practice weak areas
            </Button>
            <ButtonLink href="/review/">Review {reviewCount} concept{reviewCount === 1 ? "" : "s"}</ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}

function streakMessage(s: { current: number; studiedToday: boolean; sessionsToday: number; questionsToday: number }, hasHistory: boolean) {
  if (s.sessionsToday === 1) return "You've already completed one session today.";
  if (s.sessionsToday === 2) return "Second session completed today.";
  if (s.sessionsToday > 2) return `${s.sessionsToday} sessions completed today.`;
  if (s.studiedToday) return "Today counts — nice work.";
  if (s.questionsToday > 0) return `Finish a session or answer ${Math.max(0, 5 - s.questionsToday)} more to count today.`;
  if (s.current > 0) return `Study today to make it ${s.current + 1} days.`;
  return hasHistory ? "Welcome back. One session today starts a new streak." : "Answer a few questions to start your first streak.";
}

function studyStage(practiced: number, list: { masteryLabel: string }[]) {
  const total = list.length;
  if (practiced === 0) return "Not started";
  const strong = list.filter((m) => m.masteryLabel === "Mastered" || m.masteryLabel === "Familiar").length;
  if (practiced / total < 0.25) return "Getting started";
  if (strong / total < 0.4) return "Building foundations";
  if (strong / total < 0.75) return "Developing";
  return "Strong coverage";
}

function ActivityCalendar({ days, today }: { days: Map<string, { questionsAnswered: number; qualifyingActivity: boolean }>; today: Date }) {
  const todayKey = localDateKey(today);
  const cells = Array.from({ length: 28 }, (_, i) => shiftDateKey(todayKey, i - 27));
  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="Study activity, last 4 weeks">
        {cells.map((k) => {
          const d = days.get(k);
          const label = `${k}: ${d ? `${d.questionsAnswered} questions${d.qualifyingActivity ? ", counted toward streak" : ""}` : "no activity"}`;
          return (
            <div
              key={k}
              role="listitem"
              aria-label={label}
              title={label}
              className={cx(
                "aspect-square rounded-md border",
                d?.qualifyingActivity ? "border-accent/50 bg-accent" : d ? "border-accent/30 bg-accent-soft" : "border-line bg-surface-2",
                k === todayKey && "ring-2 ring-fg/40",
              )}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Last 4 weeks · bright = counted day, faint = some practice.</p>
    </div>
  );
}
