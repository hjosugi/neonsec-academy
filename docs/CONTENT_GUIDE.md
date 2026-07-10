# Content Authoring Guide

This guide covers release-safe authoring for questions and labs. All content must follow
[SAFETY_BOUNDARIES.md](SAFETY_BOUNDARIES.md): authorized defensive learning, synthetic/local
artifacts only, no real targets, no real credentials, and no operational attack instructions.

## Source Of Truth

- Seed questions: `src/data/questions/group-*.json`
- Concept cards: `src/data/conceptCards.ts`
- In-app custom questions: browser storage, exportable as question packs from Settings
- Safe Labs: `src/data/labs.ts`
- Question validation script: `npm run validate:content`
- Question schema reference: [QUESTION_SCHEMA.md](QUESTION_SCHEMA.md)
- Import/export reference: [IMPORT_EXPORT.md](IMPORT_EXPORT.md)

## Question Authoring

Write each question to test one concept. The learner should leave with a correct answer, the reason it
is correct, the trap they should avoid next time, and a short memory phrase.

Required fields for every question:

| Field | Notes |
|---|---|
| `id` | Stable unique ID. Seed IDs should not be reused. User pack ID collisions are renamed during import. |
| `title` | Short study-card title. Required in the in-app authoring form for user questions; optional for older seed/import rows. |
| `type` | `mcq`, `multi`, `true_false`, `short_answer`, `scenario`, or `report_prompt`. |
| `module` | CEH module `1`-`20`, or `0` for CEH+ practical tracks. |
| `track` | Required only when `module` is `0`: `pentest`, `appsec`, `cloud`, `soc`, `ir`, or `threat-model`. |
| `difficulty` | `easy`, `medium`, or `hard`. |
| `tags` | Non-empty list of short search terms. |
| `body` | Question prompt. Keep it scoped and self-contained. |
| `choices` | Required for `mcq`, `multi`, and `true_false`; omitted for free-form types. |
| `answer` | A matching choice string, an array of choice strings for `multi`, `True`/`False`, or a model answer string for free-form types. |
| `explanation` | Must include `answer`, `why`, `trap`, and `memory_phrase`. |
| `status` | Optional. Use `active` or `archived`. Missing status is treated as active. |

Good questions:

- Use fictional organizations, documentation IP ranges, or abstract scenarios.
- Ask for classification, prioritization, detection, policy, remediation, or scope decisions.
- Keep choices plausible but clearly distinguishable after reading the explanation.
- Prefer "what should the analyst do next?" over "how do you compromise this?"
- Include defensive context for offensive CEH concepts.
- Use the supported Markdown subset for readable logs and tables: fenced code blocks, inline code,
  pipe tables, and `> [!NOTE]`/`> [!WARNING]` callouts.

Do not include:

- Real targets, real credentials, customer data, production logs, or private incident details.
- Commands, payloads, target lists, exploit chains, evasion steps, persistence steps, or data theft
  instructions.
- Questions that reward unauthorized action as the correct answer.

## Concept Card Authoring

Concept cards are one-screen memory aids linked to questions by module and tag overlap. Each CEH
module should keep at least five cards, and each card must include:

| Field | Notes |
|---|---|
| `meaning` | Define the concept plainly. |
| `whenUsed` | State when to apply the concept in exam reasoning or defensive work. |
| `examTrap` | Name the common misconception or tempting wrong answer. |
| `rememberPhrase` | Keep it short enough for recall during review. |

Good cards:

- Reinforce meaning, judgment, detection, control choice, or remediation.
- Reuse tags that appear in related questions so links stay useful.
- Mention offensive CEH topics only as recognition, classification, detection, or defense.

Do not include commands, payloads, target selection, exploit chains, evasion recipes, persistence
steps, credential handling instructions, or data theft detail.

## Question Type Patterns

### `mcq`

Use for single-best-answer concepts.

```json
{
  "id": "Q-CEH-001-999",
  "title": "Valid assessment scope",
  "type": "mcq",
  "module": 1,
  "track": null,
  "difficulty": "easy",
  "tags": ["scope", "authorization"],
  "body": "Which statement best describes a valid security test scope?",
  "choices": ["Only explicitly approved assets", "Any public host", "Any asset using the same vendor"],
  "answer": "Only explicitly approved assets",
  "explanation": {
    "answer": "Only explicitly approved assets",
    "why": "Authorization defines the boundary for ethical testing.",
    "trap": "Public reachability is not permission.",
    "memory_phrase": "Scope before action."
  },
  "status": "active"
}
```

### `multi`

Use when two or more options are correct. The `answer` value must be an array and every item must
match a choice exactly.

### `true_false`

Use exactly these choices:

```json
"choices": ["True", "False"]
```

The `answer` value must be `"True"` or `"False"`.

### `short_answer`

Use for concise self-graded recall. The `answer` value is the model answer string.

### `scenario`

Use for short model-answer prompts. Scenario questions are not auto-graded as choice questions; they
are useful for reasoning, report language, and safe practical tracks.

### `report_prompt`

Use for synthetic finding or report-writing practice. The prompt should ask for title, impact,
evidence, remediation, or scope language, and the model answer should stay within the provided
fictional or synthetic evidence.

## Explanation Pattern

```text
Answer:
State the correct answer plainly.

Why:
Explain the reasoning and the defensive principle.

Trap:
Name the misconception or tempting wrong answer.

Memory phrase:
Short phrase the learner can remember during review.
```

## Lab Authoring

Safe Labs are static, synthetic, read-only exercises. They are maintained in `src/data/labs.ts` and
should be written so a learner can complete the lab entirely inside the app with the provided
evidence and the report builder.

Each lab needs:

| Field | Notes |
|---|---|
| `id` | Stable slug used in route/local progress keys. |
| `title` | User-facing lab title. |
| `category` | Short grouping such as `SOC`, `Cloud`, `Web`, `Network`, `Social`, or `Threat Model`. |
| `kind` | One of `local`, `dataset`, `simulated`, or `writeup`. |
| `difficulty` | `easy`, `medium`, or `hard`. |
| `brief` | What the learner is analyzing and what deliverable is expected. |
| `scope.allowed` | The exact local/synthetic artifacts and app tools the learner may use. |
| `scope.forbidden` | Explicitly forbid real systems, external lookups, traffic generation, credentials, and payload execution. |
| `evidenceTitle` / `evidence` | Static synthetic artifact. Use fictional names and documentation IP ranges. |
| `objectives` | Checklist items that map to scoring components. |
| `rubric` | Component scoring for flag/diagnosis, evidence, explanation, remediation, and safety. |
| `guiding` | Hints with teaching answers. Hints should not introduce real-world action steps. |
| `modelFindings` | Findings with severity, impact, and remediation for report handoff. |

## Lab Checklist

- [ ] The lab can be completed without leaving the app.
- [ ] The scope contract is visible and specific.
- [ ] The evidence is fictional or synthetic and contains no real secret or personal data.
- [ ] The forbidden list rules out real targets, credentials, third-party services, traffic generation,
  and payload execution.
- [ ] Objectives require evidence and remediation, not just naming a vulnerability.
- [ ] Hints teach reasoning without giving operational misuse steps.
- [ ] Model findings are report-ready and use synthetic scope language.
- [ ] The report builder can use the lab title, scope, summary, and model findings safely.
- [ ] `npm run validate:safety` passes before publishing.

## Review Checklist

- [ ] One concept per question or objective.
- [ ] Correct CEH module or CEH+ track.
- [ ] Difficulty matches the expected learner effort.
- [ ] Explanation includes answer, why, trap, and memory phrase.
- [ ] No real targets, credentials, secrets, personal data, or production artifacts.
- [ ] No operational attack chain, evasion, persistence, theft, or abuse instructions.
- [ ] Seed question JSON passes `npm run validate:content`.
- [ ] Imported/user-authored packs follow [IMPORT_EXPORT.md](IMPORT_EXPORT.md).
