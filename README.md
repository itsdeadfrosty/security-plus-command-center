# Security+ Command Center

An adaptive, local-first practice app for **CompTIA Security+**, covering both **SY0-701** (available now) and **SY0-801** (CompTIA launch date: November 17, 2026). The approach is questions first: you answer, the app works out what you don't know, focuses on that, and stops drilling what you've already proven.

> This is an independent study tool. It is not affiliated with or endorsed by CompTIA. All questions are original and are not taken from the real exam or any third-party question bank. Practice results are not a prediction of the official scaled score (passing is 750 on a 100–900 scale).

## Quick start

Requires Node.js 20 or later.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the unit, component and content-validation tests (Vitest) |
| `npm run typecheck` | Run the TypeScript check |
| `npm run lint` | Run ESLint |
| `npm run build` | Build a static site into `out/` |

## Deploying (free)

The app is a fully static export with no server or database. Run `npm run build` and host the `out/` folder:

- **Netlify / Cloudflare Pages:** build command `npm run build`, output directory `out`.
- **Vercel:** works with the default settings.
- **GitHub Pages:** works too. Set `basePath` if you serve it from a sub-path.

The optional AI study buddy calls Anthropic directly from the learner's browser using their own key, so hosting stays free and needs no secrets.

## How it's meant to be used: the circuit

The **circuit** is every concept in your chosen exam's official objectives:

| Exam | Concepts | Questions |
|---|---|---|
| SY0-701 | 150 | 203 |
| SY0-801 | 154 | 211 |

A concept **clears** the first time you answer one of its questions correctly *without guessing*. Misses and guesses keep it open, and you get retested with a different scenario. Once you've proven a concept, it stops coming up except for spaced review.

**Readiness estimate** (Dashboard and Progress). The app suggests you're ready when both of these are true:

- **Coverage:** 90% or more of the circuit is cleared, weighted by each domain's exam percentage.
- **First-try accuracy:** 80% or more on your most recent questions that were new to you, measured over at least 25.

This is a heuristic based on common study advice (score about 80–85% on unseen practice questions before booking). It is not a validated prediction, and the UI says so.

### Why not 600 questions?

The bank is built for **coverage, not volume**. Every concept in both exams' objective lists has at least one original scenario question. The concepts people most often confuse get several, and contrast questions put look-alikes side by side.

- **Content checks:** the test suite fails if any concept on either exam has no question.
- **Seeded weak areas:** these have extra depth (XSS, SQLi, CSRF, SSRF, session hijacking, directory traversal, race conditions, on-path, and others).

### Exam versions

Choose your exam in **Settings → Your exam**.

- **Shared concepts:** concepts are shared between versions, and each one maps to its official objective number in each exam. So progress carries over if you switch.
- **Differences between versions:**
  - AI threats (SY0-801 objective 2.6) and AI-assisted operations (4.6) appear only on 801.
  - A few 701-only topics, such as blockchain and typosquatting, appear only on 701.
- **Domain weights per exam:**

  | Domain | SY0-701 | SY0-801 |
  |---|---|---|
  | 1 | 12% | 16% |
  | 2 | 22% | 24% |
  | 3 | 18% | 19% |
  | 4 | 28% | 27% |
  | 5 | 20% | 14% |

- **Sources:** domains, weights and objective numbers come from CompTIA's published objective documents (SY0-801 "Exam Objectives Document Version 2.0").
- **701 retirement:** expected around mid-2027, but CompTIA had not confirmed a date at the time of writing.

## Features

**Study modes**
- **Run the Circuit** (10 questions)
- **Quick** (8)
- **Focused** (15 questions on weak concepts and their look-alikes)
- **Mixed** (12, weighted by domain)
- **Review Due**

The dashboard recommends one of these based on your data.

**Question types**
- Single-answer, multiple-response ("Select TWO", no partial credit), true/false, and scenario questions.
- **PBQ-style** ordering (arrange incident-response phases, order of volatility, change steps) and matching. Matching covers firewall allow/deny rules, control types, attack → mitigation, log-line classification, access-control models, data roles and AI incidents.
- PBQs show item-level feedback ("4 of 6 placed correctly").

**Confidence tracking.** After each answer you can mark it Knew it, Educated guess, or Random guess. A correct guess is never counted as proof.

**Adaptive engine**
- Leitner-style mastery with a variety rule: Mastered needs confident answers on two *different* questions.
- Spaced review.
- An in-session retest with a new scenario after every miss.
- Missed questions are regraded if an answer key is corrected later.

**Review.** Each concept card gives a plain-English definition, a practical example, "don't confuse with" contrasts, *Explain more*, why the concept is in your queue, *Test me with a new scenario*, and *Talk it through* (study buddy).

**AI study buddy** (optional, bring your own key):
- Opens from Review, or from the feedback after any missed question.
- Grounded in that concept's card and the exact questions you missed, including your wrong pick and whether you were sure.
- Explains simply, gives a memory hook, checks your understanding, and can quiz you with fresh exam-style scenarios.
- Refuses to supply "real exam" questions.

**Progress.** Readiness by domain, answers per day, accuracy over time, mastery by domain, and weaknesses resolved.

**Data:** local only, with export/import, schema migrations (v1 → v2 → v3), and recovery from corrupted storage.

**Accessible:** keyboard support throughout (1–9 select, Enter submits), screen-reader labels, visible focus, reduced motion, and a mobile bottom nav.

### Planned

| Phase | Scope |
|---|---|
| 3 · Gamification | XP, levels, achievements, weekly goals |
| 4 · Challenges | Interactive network diagram, log investigation, phishing headers, firewall builder |
| 5 · Exam Simulator | Timed and domain-balanced, no feedback until submit, flagging, results breakdown. The bank now has more than 90 questions per exam. |
| 6 · Polish | PWA/offline install, optional accounts and sync, more questions, Playwright E2E tests |

## AI study buddy setup

1. Create an API key at [console.anthropic.com](https://console.anthropic.com) → API keys.
2. In the app, open **Settings → AI study buddy**, paste the key, and pick a model:
   - Claude Opus 5.5 is the default and gives the best explanations.
   - Sonnet 5.5 and Haiku 5.5 are cheaper and faster.
3. Open **Study Buddy** in the nav, or click *Talk it through* on any concept.

**How the key is handled.** The key lives only in that browser's localStorage. It is never included in progress exports and is sent only to `api.anthropic.com`. The request uses the official `@anthropic-ai/sdk` with `dangerouslyAllowBrowser`. That is acceptable here because each learner uses their own key on their own device. Don't paste a key on a shared computer.

**How a request is built**
- **Streaming:** responses stream as they're generated.
- **Prompt caching:** the system prompt plus concept notes is cached.
- **Refusal fallback:** server-side fallback (`fallbacks: "default"`) is enabled for Opus and Sonnet, so if a model declines a turn, the API retries on a fallback model.
- **Display:** replies are rendered as text through a small markdown parser that never uses `innerHTML`.

## Adding content

Concepts live in `src/content/secplus/concepts/*.ts`. Each concept maps to its objective in each exam:

```ts
{ id: "csrf", name: "Cross-site request forgery (CSRF)", objectives: o("2.4", "2.5"), topic: "...", summary: "...", example: "...", contrasts: [...] }
```

Questions live in `src/content/secplus/questions/*.ts`. Use the `q()`, `tf()`, `order()` and `match()` helpers. A question belongs to every exam its primary concept (`conceptIds[0]`) maps to, unless you pass `exams`.

```ts
order({ id: "pbq-x", conceptIds: ["incident-response-process"], difficulty: "exam", stem: "...", steps: ["first", "second", "third"], explanation: "..." });
match({ id: "pbq-y", conceptIds: ["firewall-types"], difficulty: "exam", stem: "...", categories: ["Allow", "Deny"], items: [["TCP 443 → web", 0], ["TCP 23 → any", 1]], explanation: "..." });
```

`npm test` runs `validateContent` and the coverage check. It checks for:

- unique IDs
- valid objectives in each exam
- answer integrity for every question type
- "Select N" wording
- missing distractor explanations
- asset references
- **every concept on every exam having at least one question**

To fix a question, edit it and bump `version`. Past answers are regraded against the corrected key.

## Your data

Progress is stored only in this browser (IndexedDB, with localStorage or in-memory fallbacks and a warning). There's no account, no analytics, and no network calls except the optional study buddy. Clearing site data or switching devices means starting fresh, so use **Settings → Export progress** for backups.

## Project layout

```
src/
  app/                 routes: dashboard, practice, session, review, buddy, progress, settings, (challenges, exam: planned)
  components/          AppShell, QuestionCard (all types), CircuitCard, SessionResults, AiSettingsCard, SafeMarkdown
  content/
    catalog.ts         version-aware lookups (examContent, conceptDomain, ...)
    validate.ts        content validation + coverage check
    secplus/           exams.ts (701 + 801), concepts/*, questions/*, seed priors
  lib/engine/          scoring, mastery, selection, circuit/readiness, session, streak, stats (pure, tested)
  lib/storage/         adapters, schema + migrations, repository
  lib/ai/              study buddy prompt, Claude streaming client, key settings
  lib/store.tsx        React context wiring engine + storage
  test/                Vitest + Testing Library suites (53 tests)
```
