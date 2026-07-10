# CEH+ Practical Tracks

CEH の先を見据え、次の実践 track を用意する。

## Track 1: Pentest Engagement Workflow

Focus: scope, rules of engagement, evidence, finding triage, report.

Safe mode: synthetic organization and static datasets only.

## Track 2: AppSec Code Review

Focus: authz, input validation, secrets handling, dependency risk, secure fix.

Safe mode: toy code snippets only.

## Track 3: Cloud IAM / Config Review

Focus: least privilege, public exposure, logging, encryption, secret handling.

Safe mode: synthetic config files only.

## Track 4: SOC Log Investigation

Focus: timeline, indicators, affected assets, containment idea.

Safe mode: synthetic logs only.

## Track 5: Incident Response Report

Focus: timeline, impact, containment, eradication, recovery, lessons learned.

Safe mode: fictional incident scenario only.

## Track 6: Threat Modeling and Remediation

Focus: assets, trust boundaries, threats, mitigations.

Safe mode: fictional architecture diagrams only.

## Lab Scoring Rubric

Safe Labs score practical work with these components:

- flag / diagnosis
- evidence
- explanation
- remediation
- safety acknowledgement

Each lab defines a challenge type and maps rubric components to its objectives. Hints and missing
scope acknowledgement apply penalties. Settings can tune the passing score, hint penalty, and scope
warning penalty without changing the lab content.

The flag component is earned only by an accepted `FLAG{UPPER_SNAKE_CASE}` submission. Attempts and
unique hint reveals persist locally and feed Analytics. Accepted flags lock further submissions,
unlock the explanation/remediation/report prompt, and enable the model findings. Guiding-question
hints and Flag Challenge hints both contribute to the configured hint penalty.

## Lab Registry Safety

Every lab declares a `kind`: `local`, `dataset`, `simulated`, or `writeup`. Lab Detail displays the
scope contract before evidence, and the learner must acknowledge the synthetic, read-only boundary
before starting. The registry validator rejects missing scope, invalid kinds, public IP addresses,
real email domains, live domains, and credential-like assignments. CI also runs
`npm run validate:safety` so unsafe lab metadata cannot be published. Registry validation also
requires prompt, local asset metadata, a unique expected flag, at least one scoped hint,
explanation, remediation, and report prompt for every lab.
