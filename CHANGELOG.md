# Changelog

All notable changes to NeonSec Academy are documented here.

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
