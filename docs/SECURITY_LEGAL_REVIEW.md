# Security, Legal, and Content Safety Review

Review date: 2026-07-09

Issue scope: P6-011 security / legal / content safety review.

## Scope Reviewed

- Seed question bank: `src/data/questions/group-*.json` (371 questions across 12 files).
- Safe lab registry: `src/data/labs.ts` (6 synthetic, read-only labs).
- Seed content: `seed_content/example_questions.jsonl`, `seed_content/example_lab_manifest.yaml`, and `seed_content/report_template.md`.
- Safety and authoring guidance: `docs/SAFETY_BOUNDARIES.md`, `docs/CONTENT_GUIDE.md`, `docs/QUESTION_SCHEMA.md`, and `docs/PRACTICAL_TRACKS.md`.
- Public-facing copy reviewed without editing: README safe-use policy, onboarding pledge, Labs scope copy, Lab Detail scope contract, Question Editor safe authoring copy, Settings data/privacy copy.
- Privacy/export behavior reviewed: Settings full backup/export path, public-safe export checklist,
  question pack import/export path, and the public analytics export helper in `src/lib/privacyExport.ts`.

## Automated Checks

Commands run for this review:

```bash
node scripts/validate_questions.mjs
node scripts/safety_scan.mjs
npm test
npm run typecheck
```

Additional focused scans used during manual review:

```bash
rg -n --pcre2 "https?://|ftp://|ssh://|telnet://|\\b(?:[a-z0-9-]+\\.)+(?:com|net|org|io|dev|app|co|jp|edu|gov|mil|info|biz|ru|cn|ir|kp)\\b" src/data/questions src/data/labs.ts seed_content -S
rg -n --pcre2 "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b" src/data/questions src/data/labs.ts seed_content -S
rg -n --pcre2 "(?i)(\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{36,}|BEGIN [A-Z ]*PRIVATE KEY|aws_secret_access_key\\s*[:=]|password\\s*[:=]\\s*[^\\s,{]+|token\\s*[:=]\\s*[^\\s,{]+)" src/data/questions src/data/labs.ts seed_content -S
```

Result summary:

- Question schema validation passed for 371 questions across 12 files.
- Safety scan passed with 0 blockers: 21 documentation IP references, 15 safe domain references, 3 safe email references, 16 non-target dotted tokens, and 0 actionable command recipes.
- `npm test` passed: 8 test files, 33 tests.
- `npm run typecheck` passed.
- Initial `npm test -- --runInBand` was rejected because this Vitest version does not support `--runInBand`; the normal `npm test` command was used instead.

## Safety Findings

Unsafe content blockers: 0.

Live target data: 0 blocker findings. The IP references in release content are RFC 5737 documentation ranges (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) or explicitly fictional/synthetic context. The domain/email references used in labs are `.example` or `.internal`. `FIRST.org`, `crt.sh`, and `in-addr.arpa` appear only as standards/reference namespaces, not as targets.

Credential and secret material: 0 blocker findings. Synthetic examples use placeholders or redacted values. One question mentions secret-search terms as a defensive reconnaissance concept, but no actual key, token, or credential value is present.

Procedural harm: 0 blocker findings. The question bank necessarily names attack categories and security tools for CEH exam preparation, but reviewed content is framed as conceptual, defensive, authorized, or response-oriented. Labs are static analysis and report-writing tasks with scope gates; they do not provide real target instructions or executable attack recipes.

Privacy posture: The app has no backend and no telemetry in the reviewed code paths. Full backup export intentionally includes local profile, settings, attempts, reviews, mistakes, custom questions, exam results, and reports. Public-safe analytics export aggregates progress and masks sensitive report titles while excluding raw answers, custom question text, mistake notes, report evidence, and full backup data. Settings keeps the public export button disabled until the privacy checklist is acknowledged.

Public demo posture: README, onboarding, Settings, Labs, Lab Detail, and Question Editor copy clearly state authorized defensive learning, synthetic/local data, no real targets, no real credentials, and no real system interaction. The reviewed demo/live copy does not present live exploitation or operational attack activity.

## Risk Register

| Risk | Severity | Status | Mitigation / Decision |
|---|---:|---|---|
| User-authored or imported question packs can contain live targets, real data, or unsafe procedural content. | Medium | Accepted for v1.0 with controls | Treat imported packs as user data, not default release content. Run `node scripts/safety_scan.mjs` before promoting any pack to seed content. Keep authoring guidance aligned with `docs/SAFETY_BOUNDARIES.md`. |
| Full backup export contains private local learning data by design. | Medium | Accepted with user-facing warning | README and Settings describe local storage/export. Public sharing should use the public-safe export path, not full backup JSON. |
| Public-safe analytics export could be mistaken for a full privacy scrub of every free-text field. | Low | Accepted with controls | Settings labels it as aggregate progress, requires checklist acknowledgement, masks common report-title sensitive patterns, and excludes raw answers, notes, evidence, custom question text, and full backup data. |
| Dedicated landing/demo mode may be owned by P6-010. | Low | Open dependency outside P6-011 | Existing public copy is safe, but P6-010 should confirm the final landing/demo experience before launch if that route changes. |
| CEH study content mentions offensive terms and tools. | Low | Accepted | Keep the content conceptual, authorized, defensive, or synthetic. Do not add command recipes, live targets, exploit walkthroughs, credential harvesting, malware execution, or DDoS traffic generation. |

## Checklist

- [x] Unsafe content scan executed across all seed questions and labs.
- [x] External target data reviewed; no live target blockers found.
- [x] Privacy export behavior reviewed; Settings checklist and public-safe Markdown path confirmed.
- [x] Public demo and UI copy reviewed; residual P6-010 landing/demo dependency recorded.
- [x] README and UI copy reviewed for authorized-only framing.
- [x] Residual risks and response plan recorded.

## Release Approval

P6-011 safety review decision: approved for the current v1.0 seed content and lab corpus under the existing authorized-only, synthetic/local, read-only boundaries.

Approval constraints:

- Do not add or promote default content without rerunning the content validator and safety scan.
- Do not publish imported/user-authored packs as official content unless they pass the same review.
- Do not represent landing/demo completion beyond the state delivered by its owning issue.
- Keep harmful procedural detail out of docs, release notes, demos, sample data, and lab evidence.
