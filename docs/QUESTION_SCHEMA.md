# Question Schema

This is the release schema used by the seed content validator and question-pack import parser. See
[CONTENT_GUIDE.md](CONTENT_GUIDE.md) for authoring guidance and [SAFETY_BOUNDARIES.md](SAFETY_BOUNDARIES.md)
for mandatory safety rules.

## Required Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | string | yes | Stable unique ID. |
| `type` | string | yes | `mcq`, `multi`, `true_false`, or `scenario`. |
| `module` | number | yes | `1`-`20` for CEH modules, `0` for CEH+ tracks. |
| `track` | string or null | conditional | Required when `module` is `0`; otherwise use `null`. |
| `difficulty` | string | yes | `easy`, `medium`, or `hard`. |
| `tags` | string[] | yes | Must be non-empty. |
| `body` | string | yes | Prompt text. |
| `choices` | string[] | by type | Required for `mcq`, `multi`, and `true_false`; omitted for `scenario`. |
| `answer` | string or string[] | yes | Must match the type-specific rule below. |
| `explanation.answer` | string | yes | Plain answer summary. |
| `explanation.why` | string | yes | Reasoning and defensive principle. |
| `explanation.trap` | string | yes | Common misconception or wrong path. |
| `explanation.memory_phrase` | string | yes | Short review phrase. |
| `status` | string | no | `active` or `archived`; missing means active. |
| `source` | string | no | `seed` or `user`; imports normalize to `user`. |

## Supported Question Types

### `mcq`

- `choices` must contain at least 2 strings.
- `answer` must be one string that exactly matches one choice.

### `multi`

- `choices` must contain at least 3 strings.
- `answer` must be an array with at least 2 strings.
- Every answer string must exactly match a choice.

### `true_false`

- `choices` must be exactly `["True", "False"]`.
- `answer` must be `"True"` or `"False"`.

### `scenario`

- `choices` is omitted.
- `answer` is a model answer string.

## CEH+ Tracks

When `module` is `0`, `track` must be one of:

- `pentest`
- `appsec`
- `cloud`
- `soc`
- `ir`
- `threat-model`

## Minimal Valid Examples

```json
{
  "id": "Q-CEH-001-999",
  "type": "mcq",
  "module": 1,
  "track": null,
  "difficulty": "easy",
  "tags": ["scope", "authorization"],
  "body": "Which statement best describes a valid security test scope?",
  "choices": ["Only explicitly approved assets", "Any public host", "Any vendor-related asset"],
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

```json
{
  "id": "Q-CEHPLUS-SOC-999",
  "type": "scenario",
  "module": 0,
  "track": "soc",
  "difficulty": "medium",
  "tags": ["soc", "triage", "mfa"],
  "body": "A synthetic authentication log shows many failed logins from one documentation IP range followed by one successful login to an MFA-disabled account. What should the analyst conclude and recommend?",
  "answer": "Conclude that the pattern is likely password spraying against an MFA gap. Recommend account containment, universal MFA, source-based throttling, and alerting on many users from one source.",
  "explanation": {
    "answer": "Likely password spraying against an MFA-disabled account.",
    "why": "The synthetic pattern shows breadth across users, then a single success and impact event.",
    "trap": "Calling it a single-account brute force misses the many-user pattern.",
    "memory_phrase": "Many users, one source: spray signal."
  },
  "status": "active"
}
```

## Validation

Run the seed validator after editing seed question JSON:

```bash
npm run validate:content
```

Question-pack import uses the same core rules and rejects malformed JSON, unsupported format/version,
invalid question fields, duplicate IDs inside the pack, and answers that do not match choices. Existing
local ID collisions are automatically renamed during confirmed pack import.

## Quality Rules

- One question tests one concept.
- Every explanation states the answer, reasoning, trap, and memory phrase.
- Distractors are plausible but not ambiguous.
- Offensive CEH concepts are framed as recognition, detection, scope, prevention, or remediation.
- No real targets, credentials, secrets, personal data, operational attack chains, evasion steps,
  persistence steps, or exfiltration instructions.
