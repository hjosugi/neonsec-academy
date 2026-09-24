<!-- i18n: language-switcher -->
[English](PEER_REVIEW_DESIGN.md) | [日本語](PEER_REVIEW_DESIGN.ja.md)

# Team / Peer Review Mode — Design

Status: **design only (P5-009)**. The MVP stays single-user, local-only, and backend-free. This
document defines the data model, UX, rubric, and privacy/safety guardrails so peer review can be
built later without weakening the safety model in [SAFETY_BOUNDARIES.md](SAFETY_BOUNDARIES.md).

## Goals And Non-Goals

Goals:

- Let a learner ask trusted peers to review a question, a report, or a lab writeup.
- Keep every shared artifact public-safe: synthetic scope only, masked before it leaves the device.
- Make feedback actionable: anchored comments, concrete suggestions, a scored approval, and an
  explicit safety flag.

Non-goals:

- Hosted accounts, real-time collaboration, or telemetry in the MVP.
- Sharing full backups, Evidence Vault notes, submitted flags, answers, or mistake notes.
- Reviewing anything that involves a real organization, real target, or real incident.

## Use Cases

| # | Actor | Use case | Outcome |
|---|---|---|---|
| U1 | Learner | Share a lab report with a study partner before adding it to a portfolio. | Reviewer suggests clearer impact wording; learner accepts the suggestion. |
| U2 | Learner | Ask a mentor to check an authored question for trap quality and a correct explanation. | Mentor approves with rubric scores; question is exported as a pack. |
| U3 | Study group | Rotate reviews of IR timelines built in the IR track. | Each member receives comments anchored to timeline rows and sections. |
| U4 | Moderator | Spot a real hostname or a working payload in a shared package. | Safety flag (blocker) hides the package until the author fixes and re-masks it. |
| U5 | Learner | Reply to or dismiss a comment that does not apply. | Thread shows resolution status; dismissals keep an audit trail. |

## Roles

- **Author**: creates the package, answers comments, accepts or rejects suggestions, resolves threads.
- **Reviewer**: comments, suggests, approves with rubric scores, raises safety flags.
- **Moderator**: everything a reviewer can do, plus hide/unhide packages and close safety flags.

Identities are pseudonymous handles (2-40 characters). Legal names, emails, and employer names are
never required and are masked if typed into content.

## Data Model

Two JSON documents, with JSON Schemas in `docs/schemas/`:

- [`peer-review-package.schema.json`](schemas/peer-review-package.schema.json) — the masked snapshot being reviewed.
- [`peer-review-comment.schema.json`](schemas/peer-review-comment.schema.json) — one comment, suggestion, approval, or safety flag.

```text
ReviewPackage 1 ── * ReviewComment
ReviewComment 0..1 ── * ReviewComment (replies via parentId)
ReviewPackage * ── 1 source artifact (Question | Report | lab writeup), referenced only by local id
```

### Review package

| Field | Notes |
|---|---|
| `format`, `version` | `neonsec-review-package`, `1`. |
| `id` | `rp-…` identifier. |
| `kind` | `question`, `report`, or `lab-writeup`. |
| `author.handle` | Pseudonymous handle. |
| `title`, `content` | Markdown produced by the public-safe exporter (same pipeline as the Portfolio exporter). Never raw backups or Vault notes. |
| `masking` | `publicSafe: true`, `redactions`, `sensitiveHits: 0`, `checklistConfirmed: true`. A package cannot exist otherwise. |
| `state` | `draft → in-review → changes-requested ↔ in-review → approved`; any state → `hidden` by a blocker safety flag. |
| `reviewers` | Up to five handles. |

### Review comment schema

| Field | Notes |
|---|---|
| `id`, `packageId`, `parentId` | Threading; `parentId` is null for top-level comments. |
| `kind` | `comment`, `suggestion`, `approval`, or `safety-flag`. |
| `author` | `handle` and `role` (`author`, `reviewer`, `moderator`). |
| `anchor` | `section` (question, explanation, summary, scope, methodology, finding, remediation-plan, appendix, writeup), optional `findingId`, optional short `quote` (≤ 280 characters, masked). |
| `body` | 1-4000 characters of Markdown text, masked on save. |
| `suggestion` | Required for `suggestion`: `replacement` text and `accepted` (null until the author decides). |
| `rubric` | Required for `approval`: 1-4 scores for accuracy, evidence, clarity, remediation, safety. |
| `safetyFlag` | Required for `safety-flag`: `category` (real-target, credential, personal-data, attack-instructions, malware, non-public-info, other) and `severity` (`blocker` or `warning`). |
| `status` | `open`, `resolved`, or `dismissed`. |
| `createdAt`, `updatedAt` | Epoch milliseconds. |

## Review Rubric

Approvals score each criterion 1-4. A package is **approved** when at least one reviewer approves
with every criterion ≥ 3 and no open safety flag remains.

| Criterion | 1 — Needs work | 2 — Partial | 3 — Solid | 4 — Exemplary |
|---|---|---|---|---|
| Accuracy | Wrong class or conclusion. | Mostly right, key detail wrong. | Correct and specific. | Correct, specific, and explains why alternatives are wrong. |
| Evidence | No citation. | Vague reference. | Cites the exact artifact lines or Vault items. | Cites evidence and states confidence. |
| Clarity | Hard to follow. | Understandable with effort. | Clear for the intended reader. | Clear, concise, and well ordered (executive summary first). |
| Remediation | Missing. | Generic advice. | Concrete fix with verification. | Prioritized fix plus detection and prevention. |
| Safety | Real target, secret, or operational attack detail. | Borderline wording. | Synthetic scope stated; no sensitive data. | Synthetic scope explicit and defensive framing throughout. |

A safety score of 1 must be accompanied by a `safety-flag` comment.

## UX Flows

1. **Share for review** (Report Builder, Question Editor, Lab Detail): "Request review" opens the
   public-safe preview used by the Portfolio exporter — sensitive placeholder check, redaction count,
   and the privacy checklist. Creating the package is disabled until the check is clean and every
   checklist item is confirmed.
2. **Review workspace**: left column shows the masked Markdown with section anchors; right column
   lists threads filtered by kind and status. Selecting text creates an anchored comment or
   suggestion. The approval dialog shows the rubric table with 1-4 selectors.
3. **Author inbox**: open threads grouped by section; suggestions show a diff preview with Accept /
   Reject. Accepting applies the change to the local source artifact, then the package is re-masked
   and re-checked before its next version is shared.
4. **Safety flag**: any participant can raise one; a `blocker` immediately switches the package to
   `hidden` for everyone except the author and moderators. The author edits the local source, re-runs
   masking, and a moderator resolves the flag.
5. **Close review**: author marks the package approved (rubric condition met) or withdraws it;
   withdrawn packages are deleted from shared storage.

## Privacy And Safety Guardrails

- **Public-safe only**: packages are built exclusively by the public-safe exporter pipeline
  (`redactSensitiveText` + `scanSensitiveText` in real-TLD mode). `masking.sensitiveHits` must be 0.
- **No raw data**: backups, Evidence Vault notes, submitted flags, attempt history, mistake notes, and
  private-mode exports can never become packages.
- **Masking everywhere**: comment bodies, quotes, and suggestions run through the same masking before
  they are saved; a comment that still contains sensitive values after masking is rejected.
- **Safety audit**: packages of kind `lab-writeup` and authored questions also run the Lab Safety Audit
  rules (forbidden targets/activities, payloads, tool commands, live malware references); blockers
  prevent sharing.
- **Pseudonymity**: handles only; no emails, legal names, or employer names in profiles.
- **Least exposure**: reviewers are invited per package (max five); there is no public listing.
- **Retention**: packages and comments are deleted when the review closes or after 90 days.
- **Moderation**: blocker flags hide content immediately; moderators cannot edit author content, only
  hide it and resolve flags.
- **Out of scope forever**: reviews of real engagements, real incidents, real targets, or anything
  under NDA.

## Future Implementation Notes

- Start with file-based exchange (export/import a `neonsec-review-package` JSON plus a comments JSON)
  before any hosted service; this keeps the app backend-free.
- Validate both documents with the schemas in `docs/schemas/` on import, then re-run masking and the
  safety audit locally — never trust a received package.
- Reuse existing modules: `lib/portfolio.ts` (public-safe build), `lib/contentSafety.ts` (masking and
  detection), `lib/labSafetyAudit.ts` (content rules), and `lib/reportQuality.ts` (quality checks shown
  next to the rubric).

## Open Questions

- Should approvals be required per section for long reports?
- Should question reviews reuse the question-pack format instead of Markdown packages?
- Is a 90-day retention right for study groups that meet monthly?
