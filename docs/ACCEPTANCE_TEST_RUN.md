# v1.0 Acceptance Test Run

Run date: 2026-07-09
Scope: P6-012 release acceptance across current app flows.
Data boundary: local browser data, seed content, authored test question, synthetic labs, and generated downloads only.

## Summary

Status: PASS with non-blocking release notes.

The v1.0 happy path was verified from onboarding through authored content, practice, review, mock exam, final gate, safe lab, report export, public-safe export, and full backup restore. Automated repository checks passed after the current Settings privacy-export changes landed in the workspace.

## Automated Checks

| Command | Result |
|---|---|
| `npm test` | PASS. Vitest v4.1.10: 8 test files passed, 33 tests passed. |
| `npm run typecheck` | PASS. `tsc --noEmit` completed with exit code 0. |
| `npm run validate:content` | PASS. Seed bank: 371 questions across 12 files. Per-module coverage M0 through M20 present. All questions valid. |
| `npm run build` | PASS. `tsc --noEmit && vite build` completed. Output: `dist/index.html` 1.70 kB gzip 0.86 kB, CSS 26.62 kB gzip 6.25 kB, JS 1,085.23 kB gzip 321.46 kB. |

Build warning: Vite reported one chunk larger than 900 kB after minification. This is triaged as non-blocking for v1.0 because the production build completed successfully; code splitting is a post-v1 performance follow-up.

## Browser Smoke

Server command:

```sh
npm run dev -- --host 127.0.0.1 --port 4173
```

Result: Vite v8.1.3 ready at `http://127.0.0.1:4173/`.

Smoke command:

```sh
node - <<'NODE'
# Inline Playwright harness, not committed.
# Uses cached Playwright package and /usr/bin/google-chrome-stable.
NODE
```

Result:

```text
PASS onboarding overlay completes
PASS question authoring validation and save
PASS practice session keyboard submit path
PASS review queue keyboard and grading path
PASS mock exam start, submit, and result report
PASS final gate renders and exports markdown
PASS safe lab scope gate, report draft, and report markdown export
PASS accessibility appearance toggles apply root classes
PASS public-safe export checklist and full backup restore
RESULT browser smoke passed
```

No browser console errors or page runtime errors were reported by the smoke harness.

## Acceptance Checklist

| Flow | Status | Evidence |
|---|---|---|
| Onboarding | PASS | Induction overlay completed and Dashboard rendered. |
| Question authoring | PASS | Authored a safe MCQ with choices, answer, explanation, trap, and memory phrase; saved to Question Detail and answered correctly. |
| Practice | PASS | Started a practice session and used keyboard `1` plus `Enter` to select and submit an answer. |
| Review | PASS | Seeded a due review item in local test state, opened Review Queue, submitted by keyboard, and applied an SRS grade. |
| Mock exam | PASS | Started Quick Sim, submitted from the runner, confirmed grading, and reached Exam Report. |
| Final gate | PASS | Final Gate rendered and exported Markdown checklist. |
| Safe lab | PASS | Lab scope contract showed forbidden actions, acknowledgement exposed briefing content, and no live target interaction was required. |
| Report builder | PASS | Drafted a report from a lab handoff and exported Markdown. |
| Public-safe export | PASS | Export button remained disabled until all privacy checks were acknowledged; generated public-safe Markdown after checklist completion. |
| Full backup restore | PASS | Exported full backup JSON, reset progress, imported backup JSON, and received the progress imported confirmation. |
| Accessibility settings | PASS | Reduce motion, low glow, and high contrast toggles applied root classes in the running app. |
| Content validation | PASS | Seed question validator passed all 371 seed questions. |

## Safety And Privacy

- Labs stayed inside synthetic, read-only material.
- Scope contract explicitly displayed forbidden actions before lab content was available.
- Public-safe export excludes raw answers, custom question text, mistake notes, report evidence, and full backup data.
- Public-safe export masks common sensitive report-title patterns through the current privacy export helper.
- Full backup JSON remains private by design and is labelled as containing local notes, answers, custom questions, and report details.

## Known Issues

| Issue | Severity | Triage |
|---|---:|---|
| Production build emits a large JS chunk warning above 900 kB. | Low | Accepted for v1.0; add code splitting after release if load performance becomes a target. |
| Browser smoke used Quick Sim rather than completing a full 125-question, 4-hour exam. | Low | Accepted for v1.0 acceptance because exam creation, timer page, submit confirmation, grading, and result display were exercised. |
| The browser smoke harness is not committed as a reusable E2E test. | Low | Accepted for P6-012 documentation; consider a committed Playwright suite post-v1. |

## Release Decision

v1.0 acceptance criteria are satisfied for P6-012:

- Acceptance checklist completed with pass results.
- Known issues are triaged above.
- v1.0 release notes are documented in `docs/RELEASE_NOTES_V1.md`.
