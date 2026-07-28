<!-- i18n: language-switcher -->
[English](RELEASE_NOTES_V1.md) | [日本語](RELEASE_NOTES_V1.ja.md)

# NeonSec Academy v1 Release Notes

Current release: v1.0.5
Release date: 2026-07-10

## Highlights

- Cyberpunk CEH trainer with onboarding, dashboard, question bank, authored questions, practice, spaced review, analytics, mock exams, final gate, safe labs, and report builder.
- Local-first data model: progress, settings, authored questions, exam results, mistakes, and reports stay in the browser.
- Safe lab workflow uses synthetic, read-only evidence with a visible scope contract before lab content is available.
- Mock exam flow includes domain-weighted presets, active exam resume/discard, timer, flagging, submit confirmation, result report, and answer review.
- Final Gate summarizes mock streak, due backlog, weak modules, inventory coverage, answer coverage, and exports Markdown.
- Reports can be drafted from labs and exported as Markdown.
- Settings include reduce motion, low glow, high contrast, scanlines, lab scoring controls, public-safe Markdown export, full backup JSON import/export, and question pack import/export.
- Onboarding captures study goal, daily review target, optional target date, seed-bank preference, and safety acknowledgement before entering the app.
- The command palette launches daily review, mock exam, weak-module drill, safe labs, report export, Final Gate, practice, and question creation flows.
- The city map now exposes readable district status badges, routes due modules to review, and includes a compact hide-map mode.
- Theme presets and accessibility QA evidence cover low glow, high contrast, reduced motion, status labels, command palette keyboard use, responsive exam history, and city-map fallback.
- Product scope, taxonomy, data model, design-system wireframes, information architecture contracts, and content-authoring guidance now close out the Phase 0 foundation docs.
- Question Bank supports titles, archive-aware detail/edit flows, multi-tag/status/result filters, saved filters, and self-graded short-answer/report-prompt questions.
- Question detail shows per-question attempt history with timestamp, mode, result, selected answer, time spent, confidence, total attempts, accuracy, and last attempted time.
- Settings can export authored questions as JSON packs or JSONL rows, and import JSON packs, JSONL, or basic MCQ CSV with line-numbered validation errors.
- Markdown rendering covers escaped HTML, fenced code blocks with copy buttons, pipe tables, and safe callouts.
- Release documentation, safety review artifacts, and acceptance test evidence are included with the repository.

## Privacy And Safety

- Public-safe Markdown export shares aggregate learning metrics and masked report titles only.
- Full backup JSON is private and may include notes, custom questions, answers, and report details.
- No backend, telemetry, real target scanning, real credentials, live malware, or third-party service interaction is required for normal app use.

## Verification

- `npm test`: 9 files passed, 42 tests passed.
- `npm run typecheck`: passed.
- `npm run validate:content`: 373 seed questions valid.
- `node scripts/safety_scan.mjs`: 0 blockers.
- `npm run build`: passed with one non-blocking large chunk warning.
- Headless Chrome smoke: onboarding, question authoring, practice, review, mock result, final gate export, safe lab report export, accessibility toggles, public-safe export, and backup restore passed.

## Known Limitations

- The production bundle currently emits a Vite large-chunk warning; code splitting is a post-v1 optimization.
- Acceptance smoke used Quick Sim as the representative mock flow rather than a full timed 125-question run.
- Full backups are suitable for personal migration/recovery only; public sharing should use the public-safe export.
- Demo content and a dedicated landing mode remain tracked in P6-010.
