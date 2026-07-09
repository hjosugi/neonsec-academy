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

ExamSession 1 ── * ExamAnswer
ExamResult 1 ── * DomainScore
ExamResult * ── * Question

LabChallenge 1 ── * Evidence
LabChallenge 1 ── * Finding
Report 1 ── * Finding
```

## Identity And Timestamp Policy

| Entity | Identity | Timestamps |
|---|---|---|
| `Question` | Stable `id`; seed IDs never change, imported ID collisions are remapped. | User-authored questions store `createdAt` and `updatedAt`; seed timestamps are represented by git history. |
| `Choice` | Array position plus exact choice text inside a `Question`. | Inherits question timestamps. |
| `Explanation` | Embedded in `Question`. | Inherits question timestamps. |
| `Attempt` | Stable generated `id`. | Immutable `at` timestamp; no `updatedAt` because attempts are append-only. |
| `ReviewItem` | `questionId`; one active schedule per question. | `lastReviewed` and `dueAt` track state changes. |
| `MistakeNote` | `questionId`; one note per question. | `createdAt` and `updatedAt`. |
| `ExamSession` | Stable generated `id`. | `createdAt`, `startedAt`, and optional `endedAt`. |
| `ExamResult` | `sessionId` from the submitted session. | `submittedAt`. |
| `LabChallenge` | Static lab `id`. | Versioned in source; lab progress is local state. |
| `Evidence` | Static evidence block inside a lab. | Versioned in source. |
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

## Attempt

```json
{
  "id": "a-7b2f",
  "questionId": "Q-CEH-002-001",
  "at": 1783630800000,
  "correct": false,
  "chosen": "Sending packets to the target",
  "mode": "practice",
  "timeMs": 42000
}
```

Attempts are append-only. Corrections happen by creating a later attempt, not by editing history.

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
  "suspended": false
}
```

The store keeps review items in a map keyed by `questionId`, which prevents duplicate active review
schedules for one question.

## MistakeNote

```json
{
  "questionId": "Q-CEH-002-001",
  "whyWrong": "I treated public information as authorization.",
  "correctReasoning": "Passive collection avoids target interaction.",
  "trapPattern": "scope confusion",
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
  "questionIds": ["Q-CEH-001-001"],
  "answers": {
    "Q-CEH-001-001": { "chosen": "Only approved targets", "flagged": false }
  },
  "durationSec": 14400,
  "startedAt": 1783630800000,
  "endedAt": null,
  "currentIndex": 0,
  "status": "in-progress"
}
```

## Report

```json
{
  "id": "r-44df",
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
      "evidence": "Synthetic policy statement allows action '*' on resource '*'."
    }
  ],
  "createdAt": 1783630800000,
  "updatedAt": 1783630800000
}
```

Reports are the portable record for safe practical work. They must cite synthetic evidence only.

## Deletion, Archive, And Restore

| Data | Delete behavior | Restore behavior |
|---|---|---|
| Seed question | Never hard-deleted in user storage; archived by adding its ID to `archivedIds`. | Remove the ID from `archivedIds`. |
| User question | Can be archived like seed content, or removed from `userQuestions` when explicitly deleted. | Archived user questions can be restored; hard-deleted user questions require re-import or re-authoring. |
| Attempts and reviews | `resetProgress` clears them as study progress. | Restore from full backup import. |
| Mistake notes | Can be resolved or deleted. | Restore from full backup import. |
| Reports | Can be deleted. | Restore from full backup import or Markdown copy if exported. |

## Index And Search Keys

| Use | Key |
|---|---|
| Question lookup | `question.id` map. |
| Module and domain analytics | `question.module`, derived `domain`, and `district`. |
| CEH+ filtering | `question.track` where `module` is `0`. |
| Full-text search | Lowercased `title`, `body`, `tags`, and `moduleName`. |
| Question Bank filters | `module`, `domain`, `difficulty`, `type`, active/archive status, selected tags, bookmark state, and last attempt result. |
| Review queue | `reviews[questionId]`, `dueAt`, and `suspended`. |
| Attempt history | `questionId`, `at`, and `mode`. |
| Reports | `report.id`, `updatedAt`, and finding severity. |

## Import And Export Schema

- Full backup export includes `version`, `exportedAt`, profile, settings, attempts, reviews,
  mistakes, bookmarks, archived IDs, user questions, exam results, and reports.
- Question-pack export uses `format: "neonsec-question-pack"` and `version: 1`.
- Seed validation runs with `npm run validate:content`.
- Question-pack import reuses the same core validation rules in `src/lib/questionPacks.ts`.

## Migration Policy

Persisted app state carries `version: 1`. Backward-compatible additions should use optional fields
and defaults during import. Breaking shape changes must increment the store schema version and add a
migration in the Zustand `persist` configuration before release.
