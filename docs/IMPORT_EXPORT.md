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
| Public-safe progress summary | `neonsec-public-progress.md` | Markdown | You want to share aggregate progress without private notes, raw answers, custom question text, or report evidence. |
| Question pack | `neonsec-question-pack.json` | `neonsec-question-pack`, `version: 1` | You want to share user-authored questions without sharing personal progress. |
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
- `reports`

Use full backups for your own device migration or recovery. Do not publish them; they can contain
personal study history, custom mistake notes, reports, settings, and authored questions.

## Import Full Progress

In the app:

1. Open Settings.
2. Use **Import full backup JSON**.
3. Select a JSON backup.
4. Confirm that the app shows a successful import message.

Import accepts JSON objects and merges missing profile/settings fields with current defaults. Optional
arrays are imported only when present as arrays; otherwise the current local value is kept. This makes
older or partial backups safer to load, but it also means imported data should still be reviewed after
loading.

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
- Custom question text and answers.
- Mistake notebook notes.
- Report scope, summary, impact, remediation, and evidence.
- Full backup JSON.

Common sensitive report-title patterns are masked before export: email addresses, IPv4 addresses, and
simple `password`, `passwd`, `pwd`, `token`, `secret`, or `api_key` assignments.

## Question Packs

Question packs are the shareable format for user-authored questions. They do not include attempts,
reviews, mistake notes, exam results, reports, settings, or profile data.

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

## Export Question Packs

In the app:

1. Open Settings.
2. In **Question Packs**, select authored questions or use **Select all**.
3. Use **Export selected pack** or **Export all authored questions**.
4. Share the resulting `neonsec-question-pack.json` only if it follows the safe-use policy.

Only user-authored questions are exportable as packs. Seed questions remain part of the app build and
are not exported through this workflow.

## Import Question Packs

In the app:

1. Open Settings.
2. Use **Import question pack**.
3. Select a JSON pack.
4. Review the preview: total questions, modules, difficulty counts, and ID collisions.
5. Choose **Import pack** only if the content is safe and expected.

The importer rejects:

- Invalid JSON.
- Unsupported `format` or `version`.
- Missing `questions`.
- Invalid question fields.
- Duplicate IDs inside the pack.
- Answers that do not match their choices.

If a pack question ID already exists locally, the importer remaps it with an `-import-N` suffix before
saving. The preview warns how many collisions will be renamed.

## Markdown Exports

Reports export Markdown from the Reports screen. A report can be blank, created manually, or seeded
from a Safe Lab. Exported reports include title, synthetic scope, summary, findings, impact,
remediation, evidence, and a generated-by footer.

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
