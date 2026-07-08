# ◉ NeonSec Academy

**A cyberpunk trainer for the EC-Council Certified Ethical Hacker (CEH) exam.**

Manage a question bank, let spaced repetition schedule your reviews, sit domain‑weighted
mock exams, and prove practical skill in safe, synthetic labs — all wrapped in a neon
Neon‑Tokyo‑7 terminal aesthetic that stays out of the way of actually studying.

```
Manage questions.  Review mistakes.  Prove practical skill safely.
```

**▶ Live demo:** <https://hjosugi.github.io/neonsec-academy/> (published from `main` via GitHub Actions)

> ⚠️ **For authorized, defensive security learning only.** Every lab uses **synthetic data**.
> Nothing in this project scans real targets, uses real credentials, runs malware, or generates
> attack traffic. It teaches knowledge and judgment, not operational attacks.

---

## What it does

| Module | Description |
|---|---|
| 🗄 **Question Bank** | **263** authored questions across all **20 CEH modules** + a **CEH+** practical track. Search, filter, pin, and author your own. |
| ↻ **Review Queue** | Spaced repetition (SM‑2) schedules exactly what to review each day so nothing fades. |
| ⏱ **Mock Exam** | CEH‑format simulation — **125 questions, 4 hours**, weighted to the official exam blueprint, with a timed navigator, flags, resume, and a domain‑by‑domain report. |
| ▚ **Analytics** | Weakness matrix: domain mastery radar, per‑module breakdown, and a readiness (RAG) score. |
| ⚑ **Mistake Notebook** | Turn every miss into a lesson: why you were wrong, the trap, the fix, next action. |
| ⬢ **Safe Labs** | CEH‑Practical‑style analysis exercises (SOC triage, cloud IAM review, IDOR, cleartext creds, phishing headers, threat modeling) — 100% synthetic, read‑only. |
| ▣ **Report Builder** | Practise the real deliverable: findings with severity, impact, and remediation → export Markdown. |
| ⬡ **City Map** | The 20 modules mapped onto cyberpunk districts of Neon Tokyo‑7. |

Light gamification (XP, ranks, streaks, badges) sits on top — but the core is question
management and review, not a game.

## Quick start

```bash
# Requires Node 18+ (built and tested on Node 26)
npm install
npm run dev          # http://localhost:5173
```

Build & preview a production bundle:

```bash
npm run build        # typechecks, then builds to dist/
npm run preview
```

Validate the seed question bank against the schema:

```bash
npm run validate:content
```

The app is **fully client‑side** — all progress is stored in your browser's `localStorage`.
Nothing leaves your machine. Export/import your progress as JSON from **Settings**.

## Deploy

It's a static site (relative asset paths, `HashRouter`), so it drops onto any static host:

```bash
npm run build
# then publish the dist/ folder to GitHub Pages, Netlify, Vercel, Cloudflare Pages, …
```

## Tech stack

- **Vite 8** + **React 19** + **TypeScript** (strict)
- **Zustand** (persisted) for state
- **React Router** (`HashRouter`) for navigation
- Hand‑written cyberpunk design system (CSS variables + custom SVG charts — no chart lib)
- Zero backend, zero telemetry

## Project structure

```
src/
  data/          taxonomy (modules→domains→districts), seed questions, labs
  data/questions/  group-a … group-h .json  (263 validated questions)
  lib/           srs (SM-2), exam engine, analytics, readiness, grading, markdown
  store/         zustand store + derived-data selectors
  components/    ui, charts, layout (shell/sidebar/statusbar/command-palette), question runner
  routes/        Dashboard, Practice, Review, Exam, Analytics, Mistakes, Labs, Reports, …
  styles/        tokens, base, cyber effects, components, layout
docs/            design system, CEH mapping, safety boundaries, data model, review system
issues/          Phase 0–6 GitHub-issue roadmap (70 issues)
metadata/        labels, milestones, project board, issue index
scripts/         validate_questions.mjs, GitHub import helpers
```

## Content & CEH mapping

The bank follows the CEH v13 structure: **20 modules** grouped into the **9 official exam
domains** with their blueprint weights (Reconnaissance 21%, System Hacking 17%, Web 16%,
Network 14%, …). Mock exams draw questions proportional to those weights. See
[`docs/CEH_OFFICIAL_NOTES.md`](docs/CEH_OFFICIAL_NOTES.md) and
[`docs/QUESTION_SCHEMA.md`](docs/QUESTION_SCHEMA.md).

Every question carries an explanation with **answer / why / trap / memory phrase**, and no
question contains operational attack instructions — offensive topics are framed conceptually
and paired with detection and defense.

## Roadmap

The build is organised as a 7‑phase roadmap (Phases 1–4 are implemented; 5–6 are partially in
and tracked as issues). Full breakdown in [`ROADMAP.md`](ROADMAP.md),
[`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md), and the [`issues/`](issues/) folder.

## Safety

See [`docs/SAFETY_BOUNDARIES.md`](docs/SAFETY_BOUNDARIES.md). In short: authorized learning only,
synthetic/local material only, and none of the forbidden categories (real scanning, phishing,
credential theft, live malware, DoS traffic, real Wi‑Fi attacks) are present or possible here.

## License

MIT — see [`LICENSE`](LICENSE). CEH and Certified Ethical Hacker are trademarks of EC‑Council;
this is an independent, unofficial study aid.
