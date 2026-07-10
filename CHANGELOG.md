# Changelog

All notable changes to NeonSec Academy are documented here.

## Unreleased

### Added

- Challenge-linked Evidence Vault records for observations, log excerpts, screenshots, file
  references, and analyst notes.
- Lab-side evidence add/edit/delete workflow with sensitive-data warnings and challenge grouping.
- Report finding links to Vault records, including selected evidence citations in Markdown export.
- Backup/import and browser-hydration normalization, including duplicate, dangling, and cross-challenge
  citation cleanup.
- Direct lab-to-report editing hand-off plus tests for Evidence Vault persistence and link integrity.

## v1.0.5 - 2026-07-10

Question import/export closure patch for JSONL and CSV workflows.

### Added

- JSONL export for selected or all user-authored questions.
- JSONL import that validates each row and reports line-numbered errors.
- Basic MCQ CSV import with field validation, answer-letter mapping, duplicate-ID detection, and
  line-numbered errors.
- Tests covering JSONL export/import, CSV import, and invalid row reporting.
- Additional exam-weighting invariant tests for blueprint distribution and shortfall redistribution.

### Changed

- Settings import copy now explicitly accepts JSON packs, JSONL, and CSV.
- CI now runs the full production build script and the README exposes the workflow badge.

## v1.0.4 - 2026-07-10

Attempt-history closure patch for per-question statistics and timeline visibility.

### Added

- Question detail attempt-history table with timestamp, mode, result, selected answer, time spent,
  and optional confidence.
- Per-question basic statistics for total attempts, accuracy, last attempted time, and last result.

### Changed

- Attempt data-model docs now spell out chosen answer payloads, correctness, time spent, and
  confidence.

## v1.0.3 - 2026-07-10

Foundation and Question Bank closure patch for product scope, taxonomy, data model, authoring
rules, richer question types, saved filters, and Markdown rendering.

### Added

- Product scope document covering personas, use cases, MVP boundaries, non-goals, success metrics,
  and safety boundaries.
- Taxonomy document mapping CEH domains, all 20 modules, CEH+ tracks, module-to-track alignment,
  and unclassified-content validation rules.
- Expanded data model documentation with entity relationships, stable IDs, timestamps, archive and
  restore policy, search keys, import/export schema, and migration policy.
- Design-system wireframes for the question console, review queue, mock exam, and lab report
  surfaces.
- Information architecture screen contracts, deep links, empty states, and shortcut design.
- `short_answer` and `report_prompt` self-graded question types, with seed examples.
- Question titles plus user-question `createdAt` and `updatedAt` metadata.
- Question Bank filters for archived status, last attempt result, multiple tags, and saved local
  filter sets.
- Markdown tables, callouts, code-block copy buttons, and renderer tests.

### Changed

- Question detail and editor can open archived questions through all-question lookup while normal
  study flows keep archived content hidden.
- Question-pack and seed validators now enforce module range, CEH+ track rules, free-form question
  answers, and optional title metadata.
- Seed bank increased from 371 to 373 questions.

## v1.0.2 - 2026-07-10

Release polish closure for onboarding, city-map navigation, command launch flows, responsive exam
history, accessibility presets, and local issue audit alignment.

### Added

- Goal-aware onboarding with CEH Exam, CEH Practical, CEH+, and all-path study plans.
- Onboarding controls for daily review size, target date, optional seed-bank loading, and safety
  acknowledgement.
- Command palette launch shortcuts for review, mock exams, weak drills, safe labs, report export,
  final gate, practice, and question creation.
- City map district status badges, due-review routing, weak/ready/mastered states, and a hide-map
  mode for compact study.
- Responsive mock-exam history cards plus a mobile desktop-recommended notice.
- Theme presets for Neon Night, Low Glow, High Contrast, and Focus Mode.
- Accessibility QA checklist documenting motion, glow, contrast, status labels, command palette,
  mobile layout, and city-map fallback checks.

### Changed

- Dashboard header now reflects the selected study goal, review target, and optional exam date.
- Phase 0/1/3/6 issue checklists were audited against the current implementation so GitHub issue
  closure matches repository evidence.

## v1.0.1 - 2026-07-09

Release-readiness patch for public sharing, documentation, safety review, and acceptance evidence.

### Added

- Public-safe Markdown export for aggregate analytics, review schedule counts, mock summaries, lab
  summaries, and masked report summaries.
- Privacy checklist in Settings before public-safe export is enabled.
- Import/export documentation for full backups, public-safe progress summaries, question packs,
  report Markdown, and Final Gate Markdown.
- Security/legal/content safety review record plus a read-only safety scan script.
- Acceptance test run record and v1 release notes.

### Changed

- Full backup import/export UI is explicitly labelled as private JSON.
- README, authoring guidance, question schema, and safety boundaries now describe current release
  behavior and release review gates.

## v1.0.0 - 2026-07-09

Initial release documentation for the client-side CEH study and safe-practical trainer.

### Added

- 371-question seed bank across all 20 CEH modules plus CEH+ practical tracks.
- Question Bank search, filters, pinning, custom authoring, and user-authored question packs.
- Practice sessions, daily review queue, SM-2 style scheduling, and mistake notebook.
- Mock exam presets: Full Exam, Half Length, Quick Sim, and Weakness Focus.
- Analytics for module/domain mastery, weak areas, readiness, streaks, ranks, and badges.
- Six synthetic Safe Labs covering SOC triage, cloud IAM review, web access control, network
  cleartext review, phishing header analysis, and threat modeling.
- Report builder with findings, severity, impact, remediation, evidence, Markdown copy, and Markdown
  export.
- CEH Final Gate checklist with configurable readiness criteria and Markdown export.
- Local-only progress backup/import and shareable question-pack import/export.
- Release documentation for README, safe-use policy, question/lab authoring, schema, and
  import/export workflows.

### Safety

- Safe-use policy requires authorized defensive learning with synthetic/local material only.
- Safe Labs use static provided evidence and explicit scope contracts.
- Documentation forbids real targets, real credentials, live malware, phishing delivery, credential
  collection, DoS traffic, evasion/persistence instructions, and unsafe imported content.

### Notes

- NeonSec Academy is an unofficial CEH study aid and has no backend or telemetry.
- Browser storage is the source of truth unless users export JSON backups.
