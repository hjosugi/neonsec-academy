# NeonSec Academy

[![CI](https://github.com/hjosugi/neonsec-academy/actions/workflows/ci.yml/badge.svg)](https://github.com/hjosugi/neonsec-academy/actions/workflows/ci.yml)

NeonSec Academy is a client-side CEH study and safe-practical training app. It combines a
CEH-mapped question bank, spaced repetition, mock exams, readiness analytics, mistake review,
synthetic labs, and report practice in a cyberpunk study interface.

Live demo: <https://hjosugi.github.io/neonsec-academy/> (published from `main` via GitHub Actions)

**Safe-use policy:** NeonSec Academy is for authorized defensive learning with local or synthetic
material only. The app does not scan targets, contact third-party systems, use real credentials,
run malware, send phishing messages, or generate attack traffic. Read the full policy before
authoring or importing content: [docs/SAFETY_BOUNDARIES.md](docs/SAFETY_BOUNDARIES.md).

## Product Overview

Use NeonSec Academy to answer practice questions, review weak areas, simulate exam timing, and
practice security reporting without touching real systems. The app is fully client-side: progress,
settings, custom questions, reports, and lab progress stay in browser storage unless you export
them.

The current product scope, MVP boundaries, personas, success metrics, and non-goals are documented
in [docs/PRODUCT_SCOPE.md](docs/PRODUCT_SCOPE.md). In short, the MVP includes CEH question
management, review scheduling, mock exams, analytics, safe synthetic labs, reports, and local
import/export. It explicitly excludes hosted accounts, telemetry, official exam dumps, real target
interaction, exploit execution, phishing delivery, malware, credential handling, and traffic
generation.

| Area | Current release behavior |
|---|---|
| Question Bank | 371 seed questions across all 20 CEH modules plus CEH+ practical tracks. Search by body/tags/module, filter by module/domain/difficulty/type, pin questions, clone/edit custom questions, and import/export user-authored packs. |
| Practice | Target all modules, a specific CEH module, a CEH+ track, or weak areas. Answers create review items and analytics signals. |
| Review Queue | SM-2 style spaced repetition schedules due questions and lets you grade recall as again, hard, good, or easy. |
| Mock Exam | Full Exam (125 questions/240 minutes), Half Length (63/120), Quick Sim (25/45), and Weakness Focus (40/70), with domain weighting, flags, resume, and per-domain results. |
| Analytics | Module/domain mastery, flag challenge completion and accuracy, weakest modules, due backlog, readiness scoring, badges, streaks, and XP. |
| Mistake Notebook | Records why an answer was wrong, correct reasoning, trap pattern, memory phrase, next action, and resolution state. |
| Safe Labs | Six synthetic, read-only flag challenges with persisted attempts and hints: SOC suspicious logins, cloud IAM review, web access control, cleartext credentials, phishing headers, and STRIDE threat modeling. |
| Evidence Vault | Challenge-linked observations, log excerpts, screenshot/file references, and notes with local-only persistence and explicit sensitive-data warnings. |
| Reports | Findings reports with scope, summary, severity, impact, remediation, linked Vault citations, Markdown copy, and Markdown download. |
| Final Gate | Pre-booking checklist for mock-score streak, due backlog, weak-module count, and CEH module coverage, exportable as Markdown. |
| City Map | The 20 CEH modules and CEH+ track mapped to Neon Tokyo-7 districts for navigation and progress scanning. |

## Screenshots

Release screenshot placeholders:

| Screen | Placeholder path | Capture notes |
|---|---|---|
| Dashboard | `docs/screenshots/dashboard.png` | Readiness, due queue, rank/streak, weak modules. |
| Question Bank | `docs/screenshots/question-bank.png` | Search/filter controls and a mixed question list. |
| Mock Exam | `docs/screenshots/mock-exam.png` | Exam presets or timed runner with navigator/flags. |
| Safe Lab | `docs/screenshots/safe-lab.png` | Scope contract, synthetic evidence, objectives, and score. |
| Report Builder | `docs/screenshots/report-builder.png` | Findings editor and Markdown export controls. |

These paths are placeholders for release assets; the app does not require screenshot files to run.

## Quick Start

```bash
# Requires Node 18+
npm install
npm run dev          # http://localhost:5173
```

Build and preview a production bundle:

```bash
npm run build        # typechecks, then builds to dist/
npm run preview
```

Validate the seed question bank:

```bash
npm run validate:content
```

## Usage

1. Open the app and complete the onboarding modal.
2. Use Dashboard to pick the next study action: review due questions, practice, or start a mock.
3. Use Question Bank to search, filter, pin, clone, or author questions.
4. Use Review Queue daily; it is driven by your answers and recall grades.
5. Use Mock Exam for timed exam practice and Analytics for module/domain weaknesses.
6. Use Safe Labs to submit a training flag, unlock remediation, capture synthetic observations in Evidence Vault, and cite them from report findings.
7. Use Final Gate before booking an exam date; export its checklist when you need a study handoff.
8. Use Settings to export/import a full progress backup or portable user-authored question packs.

## Authoring And Data Exchange

- Product scope and non-goals: [docs/PRODUCT_SCOPE.md](docs/PRODUCT_SCOPE.md)
- CEH taxonomy and CEH+ track mapping: [docs/taxonomy.md](docs/taxonomy.md)
- Question and lab authoring rules: [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)
- Question schema details: [docs/QUESTION_SCHEMA.md](docs/QUESTION_SCHEMA.md)
- Import/export formats and workflows: [docs/IMPORT_EXPORT.md](docs/IMPORT_EXPORT.md)
- CEH mapping notes: [docs/CEH_OFFICIAL_NOTES.md](docs/CEH_OFFICIAL_NOTES.md)
- Safety boundaries: [docs/SAFETY_BOUNDARIES.md](docs/SAFETY_BOUNDARIES.md)

Seed questions live in `src/data/questions/group-*.json`. In-app authored questions are stored
locally and can be exchanged as `neonsec-question-pack` v1 JSON. Safe Labs are maintained in
`src/data/labs.ts` and must stay synthetic, local, and read-only.

## Data And Privacy

NeonSec Academy has no backend and no telemetry. Browser storage contains the only copy of local
progress unless you export it. A full backup includes profile, settings, question and flag attempts,
flag hint use, review state, mistake notes, archived question IDs, custom questions, exam results,
Evidence Vault entries, and reports. Question packs
include only user-authored questions.

Settings also provides a public-safe Markdown export for aggregate progress sharing. It excludes raw
answers, submitted flags, custom question text, mistake notes, report/Vault evidence, and full backup data.

Do not put real credentials, real customer data, third-party secrets, production logs, or live
target details into custom questions, labs, reports, notes, or imported JSON.

## Deploy

The app is a static site with relative asset paths and `HashRouter`, so any static host works:

```bash
npm run build
# then publish dist/ to GitHub Pages, Netlify, Vercel, Cloudflare Pages, or another static host
```

## Tech Stack

- Vite 8 + React 19 + TypeScript
- Zustand with persisted browser state
- React Router `HashRouter`
- Custom CSS design system and SVG charts
- No backend and no telemetry

## Project Structure

```text
src/
  data/              taxonomy, seed questions, safe labs
  data/questions/    group-a through group-l JSON seed packs
  lib/               SRS, exam engine, analytics, readiness, grading, markdown, question packs
  store/             persisted app state and derived selectors
  components/        UI, charts, layout, question runner
  routes/            Dashboard, Question Bank, Practice, Review, Exam, Analytics, Labs, Reports, Settings
  styles/            tokens, base, cyber effects, components, layout
docs/                release, safety, authoring, schema, CEH mapping, system notes
issues/              phased implementation issue backlog
metadata/            labels, milestones, project board, issue index
scripts/             content validation and GitHub import helpers
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE). CEH and Certified Ethical Hacker are trademarks of EC-Council; this
is an independent, unofficial study aid.
