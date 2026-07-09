# NeonSec Academy v1 Release Notes

Current release: v1.0.1
Release date: 2026-07-09

## Highlights

- Cyberpunk CEH trainer with onboarding, dashboard, question bank, authored questions, practice, spaced review, analytics, mock exams, final gate, safe labs, and report builder.
- Local-first data model: progress, settings, authored questions, exam results, mistakes, and reports stay in the browser.
- Safe lab workflow uses synthetic, read-only evidence with a visible scope contract before lab content is available.
- Mock exam flow includes domain-weighted presets, active exam resume/discard, timer, flagging, submit confirmation, result report, and answer review.
- Final Gate summarizes mock streak, due backlog, weak modules, inventory coverage, answer coverage, and exports Markdown.
- Reports can be drafted from labs and exported as Markdown.
- Settings include reduce motion, low glow, high contrast, scanlines, lab scoring controls, public-safe Markdown export, full backup JSON import/export, and question pack import/export.
- Release documentation, safety review artifacts, and acceptance test evidence are included with the repository.

## Privacy And Safety

- Public-safe Markdown export shares aggregate learning metrics and masked report titles only.
- Full backup JSON is private and may include notes, custom questions, answers, and report details.
- No backend, telemetry, real target scanning, real credentials, live malware, or third-party service interaction is required for normal app use.

## Verification

- `npm test`: 8 files passed, 33 tests passed.
- `npm run typecheck`: passed.
- `npm run validate:content`: 371 seed questions valid.
- `npm run build`: passed with one non-blocking large chunk warning.
- Headless Chrome smoke: onboarding, question authoring, practice, review, mock result, final gate export, safe lab report export, accessibility toggles, public-safe export, and backup restore passed.

## Known Limitations

- The production bundle currently emits a Vite large-chunk warning; code splitting is a post-v1 optimization.
- Acceptance smoke used Quick Sim as the representative mock flow rather than a full timed 125-question run.
- Full backups are suitable for personal migration/recovery only; public sharing should use the public-safe export.
