<!-- i18n: language-switcher -->
[English](LAB_PACK_FORMAT.md) | [日本語](LAB_PACK_FORMAT.ja.md)

# Lab Pack Format

A **lab pack** bundles CEH+ practical labs so authors can add new challenge sets without editing
`src/data/labs.ts`. Packs are local JSON files; the app has no pack registry, upload, or network
fetch. Third-party packs are **never trusted**: every import re-validates the manifest and re-runs
the Lab Safety Audit locally.

- Schema: [`docs/schemas/lab-pack.schema.json`](schemas/lab-pack.schema.json)
- Sample pack: [`seed_content/lab-packs/neon-starter-pack.json`](../seed_content/lab-packs/neon-starter-pack.json)
- Import preview: Safe Labs → **Lab pack import** (`/labs/packs`)
- Implementation: `src/lib/labPacks.ts`

## Structure

```text
neon-starter-pack.json
├── manifest fields      format, formatVersion, id, name, version, minAppVersion, author, license, description, tags
├── labs[]               challenge files: full lab definitions (scope, evidence, flagChallenge, rubric, …)
│   ├── evidence         synthetic asset text shown in the line-numbered viewer
│   ├── flagChallenge    prompt, asset metadata, expected flag, hints, explanation, remediation, report prompt
│   └── safetyAudit      per-lab stored audit record (status must be "pass")
└── safetyAudit          pack-level audit summary: rulesetVersion, auditedAt, results[] per lab
```

### Manifest

| Field | Rules |
|---|---|
| `format` | Always `neonsec-lab-pack`. |
| `formatVersion` | Integer format version. The app accepts `1`. |
| `id` | Lowercase slug (3-49 characters) that identifies the pack. |
| `name`, `author`, `license`, `description` | Required non-empty strings. Author is a handle or team name, never a personal email. |
| `version` | Pack semver (`MAJOR.MINOR.PATCH`). |
| `minAppVersion` | Oldest NeonSec Academy version that can import the pack (semver). |
| `tags` | Optional search tags. |

### Challenge files (`labs[]`)

Each entry is a complete lab in the same schema as `src/data/labs.ts` (see
[CONTENT_GUIDE.md](CONTENT_GUIDE.md#lab-authoring)): `id`, `title`, `category`, `kind`, `difficulty`,
`brief`, `scope`, `evidenceTitle`, `evidence`, `flagChallenge`, `objectives`, `rubric`, `guiding`,
`modelFindings`, optional `analysis` / `webConcept`, and a per-lab `safetyAudit` record. Lab ids must
not collide with shipped labs, and expected flags must be unique.

### Assets

Assets are the synthetic artifact text in `evidence` plus the `flagChallenge.assets[]` metadata that
describes them (`log`, `config`, `request-response`, `capture`, `headers`, `architecture`). Binary
files, remote URLs, executables, and archives are not part of the format.

### Safety audit result

`safetyAudit` records the author's audit run: `rulesetVersion`, `auditedAt`, and one
`{ labId, status, blockers, warnings }` per lab. It is informational only — the importer re-audits
with the app's current ruleset, rejects any lab that fails locally, and flags packs whose claimed
`pass` results do not match the local audit.

## Versioning And Compatibility

- **Format version**: breaking changes to the manifest bump `formatVersion`; the importer refuses
  unknown versions instead of guessing.
- **Pack version**: authors bump `version` with semver — patch for content fixes, minor for new labs,
  major for removed or renamed labs (ids are stable identities for local progress).
- **App compatibility**: `minAppVersion` must be ≤ the running app version (shown on the import
  screen). Older apps refuse newer packs.
- **Audit ruleset**: if the pack was audited with a different `rulesetVersion`, the importer warns and
  re-audits with the current rules; only the local result counts.
- **Re-install**: importing a pack with an installed `id` replaces it.

## Import Pipeline

1. Parse JSON (max 512 KB) and check `format`, `formatVersion`, required manifest fields, and semver.
2. Check compatibility with `minAppVersion`.
3. Require a pack-level `safetyAudit` entry for every lab.
4. Reject manual `override` records: pack authors cannot pre-approve their own content.
5. Reject lab ids that collide with shipped labs.
6. Run the Lab Safety Audit publish gate on every lab (forbidden targets/activities, public IPs, real
   domains and emails, credentials, live malware references, tool commands, payloads).
7. Run lab registry schema validation (scope, evidence, flag challenge, analysis/web metadata, audit record).
8. Show the preview (manifest, compatibility, per-lab audit findings with safe alternatives). **Import**
   is enabled only when there are zero errors.

Installed packs are stored locally, included in full backups, and re-validated and re-audited on
every backup import or browser restore; packs that fail are dropped. In this version installed pack
labs are listed for preview on the import screen; they do not yet appear in the playable Safe Labs
list.

## Authoring Checklist

- [ ] Every artifact is synthetic: fictional organizations, `.example` / `.internal` / `.test` /
  `.invalid` / `.localhost` hosts, documentation or private IPs, placeholder secrets.
- [ ] No payloads, tool commands, malware names, or live URLs.
- [ ] Each lab has a scope contract, flag challenge, rubric, and report-ready model findings.
- [ ] Run the draft through **Lab Safety Audit** (`/labs/audit`) and store the `pass` record on each lab.
- [ ] Fill the pack-level `safetyAudit.results` and set `minAppVersion` to the version you tested.
- [ ] Preview the pack on `/labs/packs` and confirm "safe to import" before sharing it.
