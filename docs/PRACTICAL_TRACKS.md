<!-- i18n: language-switcher -->
[English](PRACTICAL_TRACKS.md) | [日本語](PRACTICAL_TRACKS.ja.md)

# CEH+ Practical Tracks

Looking beyond CEH, the following practical tracks are provided.

## Track 1: Pentest Engagement Workflow

Focus: scope, rules of engagement, evidence, finding triage, report.

Safe mode: synthetic organization and static datasets only.

Workspace: `/tracks/pentest` walks one fictional engagement (Neon Harbor Logistics) through five
steps — scope review with a scope-violation quiz, rules-of-engagement acknowledgement, asset
inventory against the written scope, triage of prepared scanner and manual-test notes (confirmed,
false positive, out of scope, with severity), and report delivery. Every step has a checklist and a
deliverable; the final deliverable is a Markdown report generated from confirmed findings that also
opens in the Report Builder.

## Track 2: AppSec Code Review

Focus: authz, input validation, secrets handling, dependency risk, secure fix.

Safe mode: toy code snippets only.

Workspace: `/tracks/appsec` has 10 code review challenges (`src/data/tracks/appsec.ts`), two each for
authz, input validation, secrets handling, error handling, and dependency risk, in TypeScript,
JavaScript, Python, Java, Go, and manifest snippets. The learner selects the vulnerable line(s),
classifies the vulnerability, and writes impact and fix; the result shows the explanation, a safe fix
example, and a unit-test idea. Results can become a Triage finding or a report finding.

## Track 3: Cloud IAM / Config Review

Focus: least privilege, public exposure, logging, encryption, secret handling.

Safe mode: synthetic config files only.

Workspace: `/tracks/cloud` has 8 vendor-neutral config review challenges (`src/data/tracks/cloud.ts`)
covering IAM over-permission, public exposure, weak logging, missing encryption, and secret handling,
with fictional account IDs only. The learner selects the risky lines, classifies the risk, and writes
risk and remediation; every result explains the least-privilege principle for that config. The track
page shows cloud weakness stats by category and skill.

## Track 4: SOC Log Investigation

Focus: timeline, indicators, affected assets, containment idea.

Safe mode: synthetic logs only.

Workspace: `/tracks/soc` has 10 log investigation challenges (`src/data/tracks/soc.ts`), two each for
auth logs, web access logs, DNS logs, endpoint alerts, and firewall logs. Every challenge carries CEH
module mappings and `soc-*` skill tags. The learner selects indicator lines, builds a timeline from
the timestamped lines (each event needs an observation), classifies the activity, and writes the
indicator, affected asset, and next action. Results explain the detection logic and a containment
idea and show the model timeline. Wrong answers are scheduled into the Review Queue.

## Track 5: Incident Response Report

Focus: timeline, impact, containment, eradication, recovery, lessons learned.

Safe mode: fictional incident scenario only.

Workspace: `/tracks/ir` reconstructs a fictional incident (MFA-less account takeover and bulk export at
NeonCorp's RecordVault app) from four synthetic artifacts. Timeline events carry time, source,
observation, confidence, and related evidence; learners add artifact lines, manual events, or import
their SOC track timelines from the related challenges (SOC-01, SOC-02). The IR report covers incident
summary, impact, containment, eradication, recovery, and lessons learned. A quality checklist and a
missing-evidence warning guide the draft, the model timeline and report can be compared, and the
report exports as Markdown.

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

## Track Challenge Engine

AppSec, Cloud, and SOC challenges share one engine (`src/lib/trackChallenges.ts`): select the relevant
artifact lines, classify the issue, and write the deliverables. Scoring weights lines 40%,
classification 30%, and writeups 30%; a challenge counts as correct when every answer line is
selected (one extra context line is tolerated) and the classification matches. Each challenge
compiles into a module-0 review question (`TC-<id>`), so every submission is recorded as a
`practical` attempt and misses are scheduled into the Review Queue. Track pages show weakness stats
by category and skill. Content is validated in tests: schema, track-specific fields, and the Lab
Safety Audit rules (code and log lines are audited in artifact mode).

## Dataset Analysis Challenges

Safe Labs include dataset-analysis challenges for each required artifact family: PCAP / packet
summary (`net-cleartext`), web access log (`web-log-forced-browsing`), authentication log
(`soc-bruteforce`), cloud configuration (`cloud-iam`), firewall rule set (`fw-rule-shadowing`), and
email headers (`phish-headers`). Every analysis challenge requires an accepted flag (answer),
evidence, and remediation in its rubric, and unlocks a detection + prevention debrief after the flag
is accepted.

Lab Detail renders the synthetic artifact in a line-numbered viewer. Learners select the lines that
prove a finding and either save them to the Evidence Vault as a log excerpt or **Send to report**,
which saves the excerpt and cites it on the lab report (creating the report from the model findings
if needed). The citation appears in Markdown export.

## Web App Security Concept Labs

Four static web concept labs cover broken access control (`web-idor`), input validation
(`web-input-validation`), session management (`web-session-rotation`), and security headers
(`web-security-headers`). Each uses a fictional toy app's captured request/response or headers, shows
an unsafe-target warning in the scope contract, and includes a Finding Worksheet where the learner
writes the finding, impact, and remediation. A complete worksheet can be added to the lab report as a
finding with a chosen severity. No payload lists or live-site testing steps are included.

## Vulnerability Triage

The Triage board (`/triage`) turns findings into prioritized work. Each triage finding records title,
affected asset, evidence, impact, likelihood, severity, remediation, and status. Severity combines a
4×4 impact × likelihood rubric (score 1-16 → info/low/medium/high/critical) with an optional manual
override; large deviations from the rubric are flagged. Status follows
`open → confirmed | false-positive`, `confirmed → accepted-risk | fixed`, with re-open paths, and
false positive, accepted risk, and fixed require a justification note. Fix priority (P1-P4) derives
from effective severity and status. Lab Detail can import a lab's model findings as open triage items,
and any valid finding can be added to an existing or new report; re-adding refreshes the same report
finding, and Markdown export includes asset, status, and likelihood.

## Report Builder

Reports have six sections: executive summary, scope, methodology, findings, remediation plan, and
appendix. Drafting a report from a Safe Lab seeds the scope, summary, methodology, model findings,
and an appendix listing the synthetic artifacts. **Draft from findings** writes an executive summary
from the severity mix and top finding; **Generate from findings** writes a severity-ordered
remediation roadmap; **Sort by severity** reorders findings. A quality checklist shows every check
(executive summary, synthetic scope, methodology, findings, complete finding fields, evidence
citations, remediation plan, severity ordering, appendix, and safety) with pass/fail status. A
safety warning is always shown, and detected public IPs, real email hosts, non-training URLs,
credentials, private keys, and tokens are listed by field.

## CEH Practical-style Simulator

The Practical Sim (`/practical`) imitates only the format of a hands-on practical: 20 challenges under
a timer (Full: 6 hours, Sprint: 2 hours). Each session draws, by seed, 8 dataset-analysis, 5
config-review, 4 concept-lab, and 3 report-prompt challenges from the `practical`-tagged seed
questions (`group-p.json`), spreading CEH modules. Every answer comes from a synthetic artifact in the
challenge body; report prompts are self-graded against a model answer. Learners can mark a challenge
unsure. On finish, the readiness report aggregates results by challenge type, CEH module, and skill,
lists next actions, and exports Markdown. Every challenge is recorded as a `practical` attempt; wrong
answers are scheduled like a failed review and unsure-but-correct answers get a short interval, so
both appear in the Review Queue.

## Lab Registry Safety

Every lab declares a `kind`: `local`, `dataset`, `simulated`, or `writeup`. Lab Detail displays the
scope contract before evidence, and the learner must acknowledge the synthetic, read-only boundary
before starting. The registry validator rejects missing scope, invalid kinds, public IP addresses,
real email domains, live domains, and credential-like assignments. CI also runs
`npm run validate:safety` so unsafe lab metadata cannot be published. Registry validation also
requires prompt, local asset metadata, a unique expected flag, at least one scoped hint,
explanation, remediation, and report prompt for every lab. Analysis challenges must also declare a valid `analysis.type` plus detection and prevention text.
