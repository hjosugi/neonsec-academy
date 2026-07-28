<!-- i18n: language-switcher -->
[English](DATA_MODEL.md) | [日本語](DATA_MODEL.ja.md)

# Data Model

NeonSec Academy stores user data in browser storage through the Zustand store in
`src/store/useStore.ts`. Seed content stays in versioned source files. Persisted JSON uses camelCase
field names.

## ERD Overview

```text
Question 1 ── * Attempt
Question 1 ── 0..1 ReviewItem
Question 1 ── 0..1 MistakeNote
Question * ── 1 CEH Module / CEH+ Track
ConceptCard * ── 1 CEH Module
ConceptCard * ── * Question (derived by module + tag overlap)

ExamSession 1 ── * ExamAnswer
ExamResult 1 ── * DomainScore
ExamResult * ── * Question

LabChallenge 1 ── 1 FlagChallengeDefinition
LabChallenge 1 ── * FlagAttempt
LabChallenge 1 ── * FlagHintUse
LabChallenge 1 ── * EvidenceItem
LabChallenge 1 ── * Finding
Report 1 ── * Finding
Finding * ── * EvidenceItem (via evidenceIds)
```

## Identity And Timestamp Policy

| Entity | Identity | Timestamps |
|---|---|---|
| `Question` | Stable `id`; seed IDs never change, imported ID collisions are remapped. | User-authored questions store `createdAt` and `updatedAt`; seed timestamps are represented by git history. |
| `ConceptCard` | Stable `id`; seed concept cards never change without a migration note. | Versioned in source; links are derived by module/tag overlap at runtime. |
| `Choice` | Array position plus exact choice text inside a `Question`. | Inherits question timestamps. |
| `Explanation` | Embedded in `Question`. | Inherits question timestamps. |
| `Attempt` | Stable generated `id`. | Immutable `at` timestamp; no `updatedAt` because attempts are append-only. |
| `ReviewItem` | `questionId`; one active schedule per question. | `lastReviewed` and `dueAt` track state changes. |
| `ReviewSessionSummary` | Stable generated `id`. | `createdAt` and `completedAt`. |
| `MistakeNote` | `questionId`; one note per question. | `createdAt` and `updatedAt`. |
| `PinNote` | `questionId` key in `pinNotes`. | Updated when the note text changes. |
| `ExamSession` | Stable generated `id`. | `createdAt`, `startedAt`, and optional `endedAt`. |
| `ExamResult` | `sessionId` from the submitted session. | `submittedAt`. |
| `LabChallenge` | Static lab `id`. | Versioned in source; lab progress is local state. |
| `FlagChallengeDefinition` | Embedded in one static `LabChallenge`. | Versioned in source with the lab. |
| `FlagAttempt` | Stable generated `id`; `challengeId` references a static lab. | Immutable `at`; attempts are append-only until progress reset. |
| `FlagHintUse` | Unique `challengeId` + `hintIndex` pair. | Earliest valid `usedAt` is retained. |
| `StaticLabArtifact` | `evidenceTitle` + `evidence` inside a static lab. | Versioned in source. |
| `EvidenceItem` | Stable generated `id`; `challengeId` links it to one lab challenge. | User-selected `timestamp` plus `createdAt` and `updatedAt`. |
| `Finding` | Stable generated `id` inside a report, or static model finding inside a lab. | Report findings inherit the parent report timestamps. |
| `Report` | Stable generated `id`. | `createdAt` and `updatedAt`. |

## Question

```json
{
  "id": "Q-CEH-002-001",
  "title": "Passive reconnaissance boundary",
  "type": "mcq",
  "module": 2,
  "track": null,
  "difficulty": "easy",
  "tags": ["recon", "passive"],
  "body": "Which activity stays inside passive reconnaissance?",
  "choices": ["Reading public DNS records", "Sending packets to the target"],
  "answer": "Reading public DNS records",
  "explanation": {
    "answer": "Reading public DNS records",
    "why": "Passive reconnaissance uses already-public information and avoids target interaction.",
    "trap": "Public reachability is not permission to probe.",
    "memory_phrase": "Passive observes. Active interacts."
  },
  "status": "active",
  "source": "seed"
}
```

Rules:

- `module` is `1`-`20` for CEH modules.
- `module: 0` requires a valid CEH+ `track`.
- `tags` carry subtopic and skill-type hints.
- `source` is `seed` or `user`; imported packs normalize to `user`.
- `title` is required in the in-app authoring form for new user questions and optional for legacy seed/import rows.
- User-authored questions may include `createdAt` and `updatedAt`.

## ConceptCard

```json
{
  "id": "CC-CEH-20-01",
  "module": 20,
  "title": "Symmetric encryption",
  "tags": ["symmetric-encryption", "block-cipher"],
  "meaning": "Symmetric encryption uses the same secret key for encryption and decryption.",
  "whenUsed": "Use it for fast bulk data protection when key sharing is already solved.",
  "examTrap": "The hard part is key management, not the speed of the cipher.",
  "rememberPhrase": "One shared secret, fast protection."
}
```

Concept cards are seed content in `src/data/conceptCards.ts`. Each CEH module has at least five
cards. Card-to-question links are derived at runtime by same-module matching and tag overlap; card
detail pages link to related questions, and Question Detail links back to related cards.

## Attempt

```json
{
  "id": "a-7b2f",
  "questionId": "Q-CEH-002-001",
  "at": 1783630800000,
  "correct": false,
  "chosen": "Sending packets to the target",
  "mode": "practice",
  "timeMs": 42000,
  "confidence": 3
}
```

Attempts are append-only. Corrections happen by creating a later attempt, not by editing history.
`chosen` is the selected answer payload or free-form reasoning, `correct` is the result, `timeMs` is
the measured time spent, `confidence` is an optional 1-5 self-rating, and `reasoningGap` is an
optional compare note captured after checking a free-form answer against the model explanation.

## ReviewItem

```json
{
  "questionId": "Q-CEH-002-001",
  "ease": 2.3,
  "intervalDays": 1,
  "reps": 1,
  "lapses": 1,
  "dueAt": 1783717200000,
  "lastResult": "incorrect",
  "lastReviewed": 1783630800000,
  "confidence": 2,
  "suspended": false
}
```

The store keeps review items in a map keyed by `questionId`, which prevents duplicate active review
schedules for one question. `confidence` records the latest 1-5 self-rating used by the scheduler;
low confidence shortens the next interval and high confidence can lengthen it.

## ReviewSessionSummary

```json
{
  "id": "rs-abc123",
  "createdAt": 1783630800000,
  "completedAt": 1783631400000,
  "questionIds": ["Q-CEH-002-001"],
  "total": 10,
  "correct": 8,
  "accuracyPct": 80,
  "timeMs": 600000,
  "newMistakes": 2,
  "masteredItems": 8,
  "reasoningGaps": 1,
  "weakModules": [{ "module": 2, "moduleName": "Footprinting and Reconnaissance", "missed": 2 }],
  "incompleteMistakeNotes": 2,
  "nextActions": ["Complete 2 Mistake Notebook notes."]
}
```

Review summaries are append-only snapshots for the recent session history. The app keeps the newest
30 summaries in local storage.

## MistakeNote

```json
{
  "questionId": "Q-CEH-002-001",
  "whyWrong": "I treated public information as authorization.",
  "correctReasoning": "Passive collection avoids target interaction.",
  "trapPattern": "scope confusion",
  "reasoningGap": "I identified the source but did not state the authorization boundary.",
  "memoryPhrase": "Scope before action.",
  "nextAction": "Drill Module 2 passive vs active questions.",
  "resolved": false,
  "createdAt": 1783630800000,
  "updatedAt": 1783630800000
}
```

## ExamSession

```json
{
  "id": "ex-8e91",
  "createdAt": 1783630800000,
  "preset": "full",
  "presetLabel": "Full Exam",
  "seed": 123456789,
  "questionIds": ["Q-CEH-001-001"],
  "choiceOrder": {
    "Q-CEH-001-001": ["Only approved targets", "Any internet host"]
  },
  "answers": {
    "Q-CEH-001-001": { "chosen": "Only approved targets", "flagged": false, "confidence": 4, "timeMs": 65000 }
  },
  "durationSec": 14400,
  "startedAt": 1783630800000,
  "endedAt": null,
  "currentIndex": 0,
  "status": "in-progress"
}
```

Exam preset IDs are strings so built-in and user-saved weighted presets can share the same runner and
result model. Weighted presets store editable `moduleCounts` in local browser storage under
`neonsec:exam-weight-presets:v1`; generated exams keep the selected question IDs, seed, shuffled
choice order, and preset label in the persisted session/result.

## DrillResult

```json
{
  "id": "drill-8e91",
  "createdAt": 1783630800000,
  "completedAt": 1783631400000,
  "filters": {
    "source": "module",
    "module": 20,
    "tag": "cryptography",
    "type": "mcq",
    "difficulty": "hard",
    "requestedCount": 10
  },
  "questionIds": ["Q-CEH-020-001"],
  "total": 10,
  "correct": 8,
  "accuracyPct": 80
}
```

Drill results store the filter snapshot and score for recent weak-module drills. Individual answers
are also recorded as `Attempt` rows with `mode: "drill"`, so Review Queue scheduling and Analytics
module mastery update immediately after each answer.

## ExamResult

```json
{
  "sessionId": "ex-8e91",
  "preset": "full",
  "presetLabel": "Full Exam",
  "submittedAt": 1783634400000,
  "seed": 123456789,
  "total": 125,
  "answered": 123,
  "correct": 95,
  "scorePct": 76,
  "passMark": 85,
  "passed": false,
  "perDomain": [{ "domainId": "recon", "domainName": "Recon", "total": 20, "correct": 16, "pct": 80 }],
  "perModule": [{ "module": 2, "moduleName": "Footprinting and Reconnaissance", "total": 8, "correct": 7, "pct": 87.5 }],
  "flagged": { "Q-CEH-002-001": true },
  "flaggedTotal": 6,
  "flaggedCorrect": 3,
  "choiceOrder": {
    "Q-CEH-002-001": ["Sending packets to the target", "Reading public DNS records"]
  },
  "reviewMeta": {
    "Q-CEH-002-001": { "flagged": true, "confidence": 2, "timeMs": 120000 }
  },
  "timeUsedSec": 13200,
  "durationSec": 14400,
  "questionIds": ["Q-CEH-002-001"],
  "answers": { "Q-CEH-002-001": "Reading public DNS records" }
}
```

`seed` makes question selection reproducible, and `choiceOrder` preserves the randomized answer
display order for result review. Exam answers can include optional `confidence` and `timeMs`; these
are copied into `reviewMeta` on submit so Exam Review can filter low-confidence and slow questions.
`perModule`, `flagged`, `flaggedTotal`, and `flaggedCorrect` power the Exam Report module breakdown,
flagged accuracy, safety margin, and Markdown export. Older stored results without these fields are
recomputed from `questionIds`, `answers`, and the local question catalog when displayed.

## Settings

Readiness thresholds are persisted with other local settings:

```json
{
  "coverageThresholdPct": 80,
  "readinessRequiredMocks": 3,
  "readinessMaxDueBacklog": 0,
  "readinessWeakModuleMasteryPct": 70,
  "readinessMaxWeakModules": 0
}
```

`examTargetPct` remains part of the profile because it is the learner's personal mock-score target.

## LabChallenge

```json
{
  "id": "soc-bruteforce",
  "title": "SOC Triage: Suspicious Logins",
  "category": "SOC",
  "kind": "dataset",
  "difficulty": "easy",
  "scope": {
    "allowed": ["The provided synthetic log", "Local note-taking and the report builder"],
    "forbidden": ["Any real host or account", "Any external lookup", "Generating traffic"]
  },
  "evidenceTitle": "auth.log (synthetic)",
  "flagChallenge": {
    "prompt": "Classify the prepared authentication pattern and submit a flag.",
    "assets": [
      {
        "id": "auth-log",
        "label": "auth.log (synthetic)",
        "kind": "log",
        "description": "Prepared authentication events for fictional users."
      }
    ],
    "expectedFlag": "FLAG{PASSWORD_SPRAY}",
    "hints": ["Count distinct usernames targeted by one source."],
    "explanation": "One source tests a small number of guesses across many users.",
    "remediation": "Enforce MFA and alert on one-source-to-many-user failure velocity.",
    "reportPrompt": "Cite the failure sequence and successful non-MFA login."
  },
  "objectives": ["Classify the activity", "Identify the pivot event"],
  "rubric": { "challengeType": "soc-triage", "passingScore": 80 }
}
```

Lab kinds are `local`, `dataset`, `simulated`, and `writeup`. All labs must declare allowed and
forbidden scope before evidence is visible. `validateLabRegistry` checks lab schema and unsafe
metadata, including complete and unique Flag Challenge definitions. Asset kinds are `log`, `config`,
`request-response`, `capture`, `headers`, and `architecture`; every asset is static metadata for
content already supplied inside the app. Expected flags use `FLAG{UPPER_SNAKE_CASE}`. They are local
training answers shipped in the static client, not secrets or authentication values.

`npm run validate:safety` scans release content for public IPs, real email domains, credential-like
assignments, live domains, private keys, access tokens, and actionable command recipes. CI runs the
safety scan before publishing.

## FlagAttempt And FlagHintUse

```json
{
  "flagAttempts": [
    {
      "id": "fa-92ab",
      "challengeId": "soc-bruteforce",
      "submitted": "FLAG{PASSWORD_SPRAY}",
      "correct": true,
      "hintCount": 1,
      "at": 1783692000000
    }
  ],
  "flagHintUses": [
    {
      "challengeId": "soc-bruteforce",
      "hintIndex": 0,
      "usedAt": 1783691900000
    }
  ]
}
```

Non-empty submissions up to 160 printable characters become append-only attempts. Comparison trims
outer whitespace and is case-insensitive. Once a challenge has an accepted attempt, additional
submissions and new hint reveals are locked. Each hint index is recorded only once, and the number of
used hints is snapshotted onto the attempt.

Full-backup import and browser hydration reject malformed timestamps, control characters, unknown
challenge IDs, and out-of-range hints. Stored `correct` values are not trusted: correctness is
recomputed from the current static challenge definition. Flag analytics derive attempted, solved,
first-try, incorrect-attempt, accuracy, and hint counts from these normalized rows. Raw submissions
and hint history remain private and are not included in the public-safe Markdown export.

## EvidenceItem

```json
{
  "id": "ev-8e91",
  "challengeId": "soc-bruteforce",
  "title": "Synthetic authentication sequence",
  "type": "log",
  "note": "The prepared log shows repeated failures before one successful event.",
  "source": "auth.log (synthetic)",
  "reference": "artifacts/auth-log.txt",
  "timestamp": 1783630800000,
  "createdAt": 1783630800000,
  "updatedAt": 1783630800000
}
```

Evidence types are `observation`, `log`, `screenshot`, `file`, and `note`. Each item belongs to one
lab challenge through `challengeId`; the global `/evidence` view groups records by that key. A
`reference` stores a local file path, screenshot name, or other non-uploaded reference—the app does
not read or upload the referenced file. Evidence is private local data, is included in full backup
JSON, and is excluded from public-safe progress export. Invalid backup and browser-persistence rows
are discarded during import or hydration. An existing item's `challengeId` is immutable, preventing
an edit from silently moving linked evidence to another challenge. Deleting an item also removes its
ID from report findings so saved links cannot dangle.

The lab editor displays a persistent warning not to store credentials, personal/customer data,
production logs, or system secrets. Only synthetic or intentionally prepared training material is
allowed.

## Report

```json
{
  "id": "r-44df",
  "challengeId": "cloud-iam",
  "title": "Synthetic IAM Review",
  "scope": "Provided synthetic config only.",
  "summary": "One over-privileged role needs remediation.",
  "findings": [
    {
      "id": "f-1",
      "title": "Wildcard administrative permission",
      "severity": "high",
      "impact": "The fictional role could modify unrelated synthetic resources.",
      "remediation": "Replace wildcard permissions with least-privilege actions.",
      "evidence": "Synthetic policy statement allows action '*' on resource '*'.",
      "evidenceIds": ["ev-8e91"]
    }
  ],
  "createdAt": 1783630800000,
  "updatedAt": 1783630800000
}
```

Reports are the portable record for safe practical work. `challengeId` is optional for legacy and
standalone reports. A finding keeps its free-form `evidence` note for backward compatibility and
stores Vault links in optional `evidenceIds`; Markdown export resolves those IDs into quoted
citations. On save, import, and browser hydration, link IDs are deduplicated and missing IDs are
removed. A challenge-linked report can cite only evidence with the same `challengeId`; a standalone
report may cite records from multiple challenges. Reports must cite synthetic evidence only.

## Deletion, Archive, And Restore

| Data | Delete behavior | Restore behavior |
|---|---|---|
| Seed question | Never hard-deleted in user storage; archived by adding its ID to `archivedIds`. | Remove the ID from `archivedIds`. |
| User question | Can be archived like seed content, or removed from `userQuestions` when explicitly deleted. | Archived user questions can be restored; hard-deleted user questions require re-import or re-authoring. |
| Attempts and reviews | `resetProgress` clears them as study progress. | Restore from full backup import. |
| Flag attempts and hints | `resetProgress` clears solved state, attempt history, and recorded flag hints. | Restore from private full backup import. |
| Review summaries | `resetProgress` clears saved summaries. | Restore from full backup import. |
| Mistake notes | Can be resolved or deleted. | Restore from full backup import. |
| Bookmarks and pin notes | Bookmarks toggle per question; blanking a pin note removes that note. | Restore from full backup import. |
| Evidence Vault | Deleting an item also removes its ID from linked report findings. | Restore from private full backup import. |
| Reports | Can be deleted. | Restore from full backup import or Markdown copy if exported. |

## Index And Search Keys

| Use | Key |
|---|---|
| Question lookup | `question.id` map. |
| Module and domain analytics | `question.module`, derived `domain`, and `district`. |
| CEH+ filtering | `question.track` where `module` is `0`. |
| Full-text search | Lowercased `title`, `body`, `tags`, and `moduleName`. |
| CEH coverage matrix | `module`, `total`, `seen`, `attempts`, `accuracy`, `dueCount`, coverage target, and minimum module inventory settings. |
| Question Bank filters | `module`, `domain`, `difficulty`, `type`, active/archive status, selected tags, bookmark state, pin notes, and last attempt result. |
| Review queue | `reviews[questionId]`, `dueAt`, `confidence`, and `suspended`. |
| Review summaries | `reviewSummaries`, `completedAt`, accuracy, weak modules, and next actions. |
| Attempt history | `questionId`, `at`, `mode`, `chosen`, `correct`, `timeMs`, `confidence`, and `reasoningGap`. |
| Flag challenge analytics | `flagAttempts[].challengeId`, `correct`, `at`, `hintCount`, plus unique `flagHintUses` indexes. |
| Mistake notebook | `mistakes[questionId]`, resolved state, `updatedAt`, question module, and question tags. |
| Pin notes | `pinNotes[questionId]`, with the matching bookmark used for pinned views. |
| Evidence Vault | `evidenceItems[].id`, grouped by `challengeId` and sorted by `timestamp`. |
| Reports | `report.id`, `updatedAt`, and finding severity. |

## Import And Export Schema

- Full backup export includes `version`, `exportedAt`, profile, settings, attempts, reviews,
  review summaries, mistakes, bookmarks, pin notes, archived IDs, user questions, exam results, and
  flag attempts, flag hint uses, Evidence Vault items, and reports.
- Question-pack export uses `format: "neonsec-question-pack"` and `version: 1`.
- Seed validation runs with `npm run validate:content`.
- Question-pack import reuses the same core validation rules in `src/lib/questionPacks.ts`.

## Migration Policy

Persisted app state carries `version: 1`. Backward-compatible additions should use optional fields
and defaults during import. Breaking shape changes must increment the store schema version and add a
migration in the Zustand `persist` configuration before release.
