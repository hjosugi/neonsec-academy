# Taxonomy

This taxonomy is the classification source for CEH modules, exam domains, CEH+ practical tracks,
question metadata, analytics, and review routing. Runtime constants live in
`src/data/taxonomy.ts`; question shape is documented in [QUESTION_SCHEMA.md](QUESTION_SCHEMA.md).

## Question Classification Fields

| Field | Required | Meaning | Source |
|---|---:|---|---|
| `module` | yes | `1`-`20` for CEH knowledge modules, or `0` for CEH+ practical items. | Question schema and validator. |
| `track` | conditional | Required only when `module` is `0`. | CEH+ track list below. |
| `difficulty` | yes | `easy`, `medium`, or `hard`. | Question schema and editor. |
| `tags` | yes | Searchable subtopics and skill hints such as `scope`, `iam`, `logs`, or `reporting`. | Seed JSON, editor, and import validator. |
| `type` | yes | `mcq`, `multi`, `true_false`, `short_answer`, `scenario`, or `report_prompt`. | Question schema and renderer. |
| `source` | optional | `seed` or `user`; missing seed rows are normalized to `seed`, imports are normalized to `user`. | Loader and question-pack parser. |

`tags` are the current lightweight representation for subtopic and skill type. A future schema can
split them into first-class `subtopic` and `skill_type` fields without changing the module or track
taxonomy.

## CEH Exam Domains

| Domain ID | Domain | Exam weight | Modules |
|---|---|---:|---|
| `overview` | Information Security and Ethical Hacking Overview | 6% | 1 |
| `recon` | Reconnaissance Techniques | 21% | 2, 3, 4 |
| `system` | System Hacking Phases and Attack Techniques | 17% | 5, 6, 7 |
| `network` | Network and Perimeter Hacking | 14% | 8, 9, 10, 11, 12 |
| `web` | Web Application Hacking | 16% | 13, 14, 15 |
| `wireless` | Wireless Network Hacking | 6% | 16 |
| `mobile-iot` | Mobile Platform, IoT, and OT Hacking | 8% | 17, 18 |
| `cloud` | Cloud Computing | 6% | 19 |
| `crypto` | Cryptography | 6% | 20 |
| `beyond` | CEH+ Practical Tracks | 0% | module 0 |

## CEH Modules

| Module | Name | Domain ID | District |
|---:|---|---|---|
| 1 | Introduction to Ethical Hacking | `overview` | Gate District |
| 2 | Footprinting and Reconnaissance | `recon` | Ghost Market |
| 3 | Scanning Networks | `recon` | Ghost Market |
| 4 | Enumeration | `recon` | Ghost Market |
| 5 | Vulnerability Analysis | `system` | Root Alley |
| 6 | System Hacking | `system` | Root Alley |
| 7 | Malware Threats | `system` | Root Alley |
| 8 | Sniffing | `network` | Firewall Ring |
| 9 | Social Engineering | `network` | Firewall Ring |
| 10 | Denial-of-Service | `network` | Firewall Ring |
| 11 | Session Hijacking | `network` | Firewall Ring |
| 12 | Evading IDS, Firewalls, and Honeypots | `network` | Firewall Ring |
| 13 | Hacking Web Servers | `web` | Web Alley |
| 14 | Hacking Web Applications | `web` | Web Alley |
| 15 | SQL Injection | `web` | Web Alley |
| 16 | Hacking Wireless Networks | `wireless` | Neon Airspace |
| 17 | Hacking Mobile Platforms | `mobile-iot` | Neon Airspace |
| 18 | IoT and OT Hacking | `mobile-iot` | Neon Airspace |
| 19 | Cloud Computing | `cloud` | Cloud Spire |
| 20 | Cryptography | `crypto` | Cloud Spire |

## CEH+ Practical Tracks

CEH+ items use `module: 0` and one of these track keys.

| Track key | Track | Safe focus |
|---|---|---|
| `pentest` | Pentest Engagement Workflow | Scope, rules of engagement, evidence, finding triage, and report structure. |
| `appsec` | AppSec Code Review | Authorization, input validation, secrets handling, dependency risk, and secure fix reasoning. |
| `cloud` | Cloud IAM / Config Review | Least privilege, public exposure, logging, encryption, and secret handling. |
| `soc` | SOC Log Investigation | Timeline, indicators, affected assets, containment, and escalation. |
| `ir` | Incident Response | Evidence preservation, containment, eradication, recovery, and lessons learned. |
| `threat-model` | Threat Modeling & Remediation | Assets, trust boundaries, STRIDE-style threats, mitigations, and remediation planning. |

Reporting is a cross-track workflow implemented through Safe Labs and Reports rather than a separate
track key. Tracks should still include report-ready evidence, impact, and remediation practice.

## Module To CEH+ Mapping

This mapping guides drill selection and content authoring; it is not a replacement for the official
CEH module list.

| CEH area | Related modules | Related CEH+ tracks |
|---|---|---|
| Ethics, scope, methodology | 1 | `pentest`, `ir` |
| Reconnaissance and asset discovery concepts | 2, 3, 4 | `pentest`, `soc` |
| Vulnerability and host-risk reasoning | 5, 6, 7 | `pentest`, `ir`, `threat-model` |
| Network, perimeter, social, and session risk | 8, 9, 10, 11, 12 | `soc`, `ir`, `threat-model` |
| Web server, web app, and injection risk | 13, 14, 15 | `appsec`, `pentest` |
| Wireless, mobile, IoT, and OT risk | 16, 17, 18 | `soc`, `threat-model` |
| Cloud and cryptography | 19, 20 | `cloud`, `appsec`, `threat-model` |

## Unclassified Detection Rules

Seed validation and question-pack import must reject or normalize rows that cannot be classified:

- `module` must be an integer from `0` through `20`.
- `module: 0` requires a valid CEH+ `track`.
- `module: 1..20` must not depend on a CEH+ `track`; the loader derives domain and district from
  the module.
- `difficulty`, `type`, `tags`, `body`, `answer`, and explanation fields must pass schema
  validation.
- Duplicate IDs in seed files or a single question pack are rejected.

Run `npm run validate:content` after seed edits.
