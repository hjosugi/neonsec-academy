# Changelog

All notable changes to NeonSec Academy are documented here.

## v1.0.25 - 2026-09-24

CEH Practical-style 20 challenge simulator with a readiness report and review-queue hand-off.

### Added

- 32 practical challenges (`group-p.json`, `Q-PRAC-*`) across all 20 CEH modules: dataset analysis,
  config review, concept lab, and report prompt items, each answered from a synthetic artifact.
- Practical Sim (`/practical`): seeded 20-challenge sessions (8 dataset, 5 config, 4 concept, 3 report),
  Full (6 h) and Sprint (2 h) timers, progress navigator, unsure flag, self-graded report prompts, and
  auto-submit on timeout; active sessions persist across reloads.
- Practical readiness report by challenge type, CEH module, and skill with next actions and Markdown
  export; results are kept in `practicalResults` and full backups.
- Every challenge is recorded as a `practical` attempt; wrong and unsure challenges are scheduled into
  the Review Queue.

## v1.0.24 - 2026-09-24

Report Builder with six report sections, generated drafts, a quality checklist, and safety warnings.

### Added

- Methodology, remediation plan, and appendix sections alongside executive summary, scope, and
  findings; lab reports are seeded with a methodology and an appendix of synthetic artifacts.
- **Draft from findings** (executive summary), **Generate from findings** (severity-ordered remediation
  roadmap), **Sort by severity**, and an affected-asset field per finding.
- Report quality checklist covering summary, synthetic scope, methodology, findings, complete finding
  fields, evidence citations, remediation plan, ordering, appendix, and safety.
- Always-on safety warning that lists detected public IPs, real email hosts, non-training URLs,
  credentials, private keys, and tokens by field.
- Shared `contentSafety` detectors (strict and host-only modes plus redaction) with tests.

### Changed

- Markdown export now emits Executive Summary, Scope, Methodology, Findings, Remediation Plan, and
  Appendix sections.
- Lab registry unsafe-text scanning reuses the shared content-safety detectors.

## v1.0.23 - 2026-09-24

Vulnerability triage workflow with severity rubric, status flow, and report hand-off.

### Added

- Triage board (`/triage`) for findings with title, affected asset, evidence, impact, likelihood,
  severity, remediation, and status.
- 4×4 impact × likelihood severity rubric with optional manual override and deviation warning, plus
  fix priority (P1-P4) derived from effective severity and status.
- Status flow (open, confirmed, false positive, accepted risk, fixed) with allowed transitions, re-open
  paths, required justification notes, and an append-only status history.
- Lab Detail and the Triage board import a lab's model findings as open triage items.
- Add-to-report hand-off to an existing or new report without duplicates; Markdown export includes
  affected asset, status, and likelihood.
- Triage findings are normalized on import and hydration and included in full backups.

## v1.0.22 - 2026-09-24

Web App Security Concept Labs with unsafe-target warnings and finding worksheets.

### Added

- Three static web concept labs from fictional toy apps: input validation (`web-input-validation`),
  session rotation (`web-session-rotation`), and security headers (`web-security-headers`); together
  with the existing access-control lab they cover the four web concepts.
- `webConcept` metadata with an unsafe-target warning shown in the scope contract before evidence.
- Finding Worksheet for web concept labs: finding, impact, and remediation are required (20+ characters
  each), persisted locally, included in full backups, and addable to the lab report as a finding.
- Web concept lab template in the content guide and tests for concept coverage, worksheet status,
  normalization, report hand-off, and backup round-trips.

### Changed

- Lab registry validation requires web concept labs to be simulated or local, use a static
  request/response or headers asset, and include a non-empty unsafe-target warning.

## v1.0.21 - 2026-09-24

Dataset-analysis challenges for PCAP, web log, auth log, cloud config, and firewall rule review.

### Added

- Two new synthetic dataset labs: web access log forced browsing (`web-log-forced-browsing`) and
  firewall rule shadowing (`fw-rule-shadowing`), each with a flag, hints, explanation, remediation,
  report prompt, rubric, guiding questions, and model findings.
- `analysis` metadata (`pcap`, `web-log`, `auth-log`, `cloud-config`, `firewall-rule`, `email-headers`)
  with detection and prevention guidance on every dataset-analysis lab, shown as an Analysis Debrief
  after the flag is accepted.
- Line-numbered dataset viewer in Lab Detail: select artifact lines, save them to the Evidence Vault as
  a log excerpt, or **Send to report** to cite them on the lab report (created from model findings if
  missing).
- Tests for analysis-type coverage, analysis metadata validation, line-range evidence capture, report
  citation, and backup round-trips of the hand-off.

### Changed

- Lab registry validation now rejects analysis labs with an unknown type or missing detection/prevention
  text and scans that text for unsafe targets.
- Lab report creation and matching moved to a shared helper used by Lab Detail, Reports, and the store.

## v1.0.20 - 2026-07-10

Safe, persisted flag challenges with hint tracking, explanation unlocks, and practical analytics.

### Added

- Flag Challenge definitions for all six synthetic labs, including prompt, asset metadata, expected
  flag, scoped hints, explanation, remediation, and report prompt.
- Case-insensitive flag submission with append-only attempt history, persisted hint use, solved-state
  locking, and private backup/import support.
- Correct-answer unlock flow for explanations, remediation guidance, report handoff, and model findings.
- Flag challenge completion, attempt accuracy, incorrect attempts, hint use, and first-try results in
  Analytics and Safe Lab cards.

### Changed

- Lab scoring now awards the flag component only after an accepted flag and includes recorded flag
  hints in the configured hint penalty.
- Lab registry validation now requires safe, complete, unique Flag Challenge metadata.
- Safety scan lab counts now ignore nested asset IDs and report the six top-level lab definitions.

## v1.0.19 - 2026-07-10

Challenge-linked local evidence management and report citations for Safe Labs.

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
