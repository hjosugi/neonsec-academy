<!-- i18n: language-switcher -->
[English](IMPORT_EXPORT.md) | [日本語](IMPORT_EXPORT.ja.md)

# Import And Export

NeonSec Academy stores state locally in the browser. Import/export is for backup, device transfer,
question sharing, and Markdown handoff. The app does not upload files or sync with a backend.

All imported content must follow [SAFETY_BOUNDARIES.md](SAFETY_BOUNDARIES.md). Do not import or share
real credentials, production logs, customer data, personal data, live target details, exploit chains,
or other unsafe material.

## Export Types

| Export | File name | Format | Use when |
|---|---|---|---|
| Full progress backup | `neonsec-backup.json` | App state JSON, `version: 1` | You want to back up or move your own study state. |
| Public-safe progress summary | `neonsec-public-progress.md` | Markdown | You want to share aggregate progress without private notes, raw answers, custom question text, or report/Vault evidence. |
| Question pack | `neonsec-question-pack.json` | `neonsec-question-pack`, `version: 1` | You want to share user-authored questions without sharing personal progress. |
| Question JSONL | `neonsec-question-pack.jsonl` | One `RawQuestion` JSON object per line | You want line-oriented editing, diffing, or batch import/export. |
| Question CSV | Custom `.csv` | Header row plus MCQ rows only | You want spreadsheet import for basic multiple-choice questions. |
| Report Markdown | Custom report title as `.md` | Markdown | You want a findings report handoff from Reports. |
| Final Gate Markdown | `ceh-final-gate-checklist.md` | Markdown | You want a pre-booking checklist snapshot. |

## Full Progress Backup

In the app:

1. Open Settings.
2. Use **Export full backup JSON**.
3. Store `neonsec-backup.json` somewhere private.

The backup includes:

- `version`
- `exportedAt`
- `profile`
- `settings`
- `attempts`
- `reviews`
- `mistakes`
- `bookmarks`
- `archivedIds`
- `userQuestions`
- `examResults`
- `flagAttempts`
- `flagHintUses`
- `evidenceItems`
- `reports`

Use full backups for your own device migration or recovery. Do not publish them; they can contain
personal study history, submitted flags, hint use, custom mistake notes, Evidence Vault entries,
reports, settings, and authored questions.

## Import Full Progress

In the app:

1. Open Settings.
2. Use **Import full backup JSON**.
3. Select a JSON backup.
4. Confirm that the app shows a successful import message.

Import accepts JSON objects and merges missing profile/settings fields with current defaults. Optional
arrays are imported only when present as arrays; otherwise the current local value is kept. Flag
attempts and hint uses are additionally normalized against current static challenges: unknown rows
are discarded, hint indexes are deduplicated, and correctness is recalculated. This makes older or
partial backups safer to load, but it also means imported data should still be reviewed after loading.

Before importing:

- Export your current progress first if you might need to roll back manually.
- Inspect untrusted JSON before loading it.
- Confirm the file does not contain secrets, personal data, production artifacts, or unsafe content.

## Public-Safe Progress Summary

Use the public-safe export when you want to share progress without exposing study history details.

In the app:

1. Open Settings.
2. Review the **Privacy Export** preview.
3. Complete the privacy checklist.
4. Use **Export public-safe Markdown**.

The Markdown includes:

- Aggregate attempt count, correct count, and accuracy.
- Attempts grouped by mode.
- Review item counts and due/scheduled/suspended summary.
- Mock exam summaries.
- Lab progress summaries.
- Report title summaries with severity counts.

The Markdown excludes:

- Raw chosen answers and question IDs.
- Submitted flag values and per-hint use history.
- Custom question text and answers.
- Mistake notebook notes.
- Report scope, summary, impact, remediation, and evidence.
- Evidence Vault titles, notes, sources, file/screenshot references, and timestamps.
- Full backup JSON.

Common sensitive report-title patterns are masked before export: email addresses, IPv4 addresses, and
simple `password`, `passwd`, `pwd`, `token`, `secret`, or `api_key` assignments.

## Question Packs

Question packs are the shareable formats for user-authored questions. They do not include attempts,
reviews, mistake notes, exam results, reports, settings, or profile data. Settings supports three
question import formats:

- JSON pack object: structured deck metadata plus `questions[]`.
- JSONL: one valid question JSON object per non-empty line.
- CSV: MCQ-only spreadsheet import with the basic columns below.

Pack shape:

```json
{
  "format": "neonsec-question-pack",
  "version": 1,
  "title": "NeonSec custom questions (2)",
  "exportedAt": 1783526400000,
  "questions": []
}
```

Each item in `questions` must satisfy [QUESTION_SCHEMA.md](QUESTION_SCHEMA.md). Imported questions are
normalized to `source: "user"` and `status: "active"`.

JSONL shape:

```jsonl
{"id":"Q-USER-1","type":"mcq","module":1,"track":null,"difficulty":"easy","tags":["scope"],"body":"Which target is in scope?","choices":["Approved host","Any host"],"answer":"Approved host","explanation":{"answer":"Approved host","why":"Written scope controls authorization.","trap":"Public reachability is not permission.","memory_phrase":"Scope first."}}
```

CSV import is limited to `mcq`. Required columns:

```csv
id,title,module,track,difficulty,tags,body,choice_a,choice_b,choice_c,choice_d,answer,explanation_answer,explanation_why,explanation_trap,memory_phrase
```

`tags` uses `;` or `|` separators. `answer` may be the exact choice text or a letter from `A` to `F`.
CSV rows that fail validation report the source line number.

## Export Question Packs

In the app:

1. Open Settings.
2. In **Question Packs**, select authored questions or use **Select all**.
3. Use **Export selected pack** / **Export all authored questions** for JSON, or the JSONL buttons for
   line-oriented export.
4. Share the resulting `.json` or `.jsonl` only if it follows the safe-use policy.

Only user-authored questions are exportable as packs. Seed questions remain part of the app build and
are not exported through this workflow.

## Import Question Packs

In the app:

1. Open Settings.
2. Use **Import JSON / JSONL / CSV**.
3. Select a JSON pack, JSONL file, or MCQ CSV.
4. Review the preview: total questions, modules, difficulty counts, and ID collisions.
5. Choose **Import pack** only if the content is safe and expected.

The importer rejects:

- Invalid JSON.
- Unsupported `format` or `version`.
- Missing `questions`.
- Invalid question fields.
- Duplicate IDs inside the pack.
- Answers that do not match their choices.
- Invalid JSONL/CSV rows, reported with line numbers.

If a pack question ID already exists locally, the importer remaps it with an `-import-N` suffix before
saving. The preview warns how many collisions will be renamed.

## Markdown Exports

Reports export Markdown from the Reports screen. A report can be blank, created manually, or seeded
from a Safe Lab. Findings can link challenge-matched Evidence Vault items; exported reports resolve
those links into citations with evidence type, title, source, capture time, optional file/screenshot
reference, and note. Exported reports also include title, synthetic scope, summary, findings, impact,
remediation, manual evidence notes, and a generated-by footer. Import and browser hydration discard
invalid Vault rows, deduplicate citation IDs, and remove missing or cross-challenge links before they
reach the report builder.

Mock Exam Result exports Markdown from the Exam Report screen. The snapshot includes score, target,
safety margin, time spent, flagged accuracy, module breakdown, and the next seven-day repair plan.

Final Gate exports Markdown from the Final Gate screen. The checklist includes pass/fail status,
configured criteria, recent mock results, weak module warnings, and next actions.

Markdown exports are snapshots. Re-importing Markdown into the app is not supported.

## Safe Sharing Checklist

- [ ] The file contains no secrets, real credentials, tokens, cookies, keys, or private URLs.
- [ ] The file contains no customer data, personal data, production logs, or real incident artifacts.
- [ ] Questions use only safe CEH recognition, reasoning, detection, remediation, or scope prompts.
- [ ] Labs/reports describe synthetic evidence and defensive recommendations.
- [ ] Full progress backups are kept private unless intentionally shared with someone trusted.
- [ ] Question packs are preferred for sharing authored questions.
