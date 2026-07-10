# Safety Boundaries

NeonSec Academy is a study tool for authorized defensive security learning. Its content must teach
recognition, reasoning, detection, prioritization, remediation, and reporting without enabling
activity against real systems.

## Core Policy

Use only:

- The seed questions included in this repository.
- Synthetic evidence shipped with Safe Labs.
- Local notes, reports, and browser data that do not contain secrets or personal data.
- User-authored content that follows this policy.
- Fictional hosts, fictional accounts, documentation IP ranges, and toy snippets.

Do not use:

- Real public IPs, real domains, production hosts, third-party services, or external targets.
- Real credentials, tokens, session cookies, private keys, API keys, password dumps, or customer data.
- Live malware, exploit payloads, phishing delivery, credential collection, traffic generation, or
  denial-of-service activity.
- Instructions that walk a user through compromising a system, evading detection, maintaining
  persistence, exfiltrating data, or bypassing access controls.

The safe replacement for a risky topic is analysis of provided artifacts, not interaction with a
target.

## Current App Safety Controls

- Safe Labs are static, local, read-only exercises with an explicit scope contract.
- Lab scoring requires scope acknowledgement and penalizes missing acknowledgement.
- Lab evidence uses fictional systems and documentation IP ranges instead of live targets.
- Flag challenges derive answers only from supplied static assets; flags are training labels, never credentials or secrets.
- Flag submission warns against pasting real credentials, tokens, customer values, or production secrets.
- Reports label scope as synthetic and ask for evidence, impact, and remediation.
- Question packs are validated before import and only become user-authored local questions.
- Full backups and question packs are local JSON files; the app does not upload them.
- The app has no backend, no telemetry, and no network scanner.

These controls reduce risk, but they do not make unsafe user-authored content acceptable. Authors
must still keep imported questions, reports, and notes within the policy.

## Forbidden Content

Reject or rewrite content that asks the learner to:

- Scan or enumerate a real host, network, wireless environment, cloud account, or third-party app.
- Exploit a live vulnerability or test payloads against a system outside an explicitly local toy app.
- Create, deploy, modify, or run malware, ransomware, keyloggers, spyware, droppers, persistence
  mechanisms, or credential-stealing tools.
- Send phishing messages, collect credentials, impersonate real services, or harvest sessions.
- Generate DoS/DDoS traffic, stress traffic, bot traffic, or abusive automation.
- Bypass MFA, defeat EDR, disable logging, hide activity, escalate privileges on a real system, or
  exfiltrate data.
- Use leaked datasets, personal data, customer data, production logs, or real secrets.

## Allowed Safe Replacements

| Risky topic | Allowed replacement |
|---|---|
| Recon or scanning | Concept questions, scope decisions, synthetic scan output review, or fictional asset inventory analysis. |
| Password attacks | Password policy review, MFA reasoning, synthetic authentication log analysis, or lockout/rate-limit design. |
| Phishing | Simulated header/body analysis, awareness training, detection rules, or safe reporting workflow. |
| Malware | Static toy indicators, hash/string concepts, EDR alert review, containment planning, or prevention checklist. |
| Web exploitation | Static request/response review, vulnerable-code reasoning, or local toy-app discussion without live targets. |
| Wireless attacks | Static PCAP/config review and defensive hardening only. |
| Cloud compromise | Synthetic IAM/config review and least-privilege remediation. |
| DoS/DDoS | Capacity planning, rate-limit design, or synthetic traffic-log analysis. |
| Incident response | Fictional incident timelines, containment, eradication, recovery, and lessons learned. |

## Authoring Rules

Questions must:

- Test one concept at a time.
- Include defensive framing: why the answer is correct, what trap to avoid, and what remediation or
  review action follows.
- Use CEH module numbers 1-20, or module 0 with a CEH+ track.
- Avoid commands, payloads, target lists, credentials, real service names used as targets, and
  step-by-step compromise instructions.

Labs must:

- Start with an explicit scope contract.
- Include only provided synthetic artifacts.
- Make forbidden actions visible before the learner starts.
- Ask for findings, evidence, impact, and remediation.
- Keep model answers at analysis/remediation level.

Reports must:

- State the synthetic scope.
- Cite only provided evidence.
- Describe impact as a training scenario, not as a real-world claim against a third party.
- Recommend defensive fixes and verification steps.

## Import And Export Hygiene

Before importing a progress backup or question pack:

- Confirm the JSON came from a trusted source.
- Check that no questions contain real credentials, private data, live targets, or operational attack
  instructions.
- Treat imported reports and notes as local training material only.

Before exporting:

- Remove any accidental secrets, names, customer details, or real incident artifacts.
- Prefer question packs when sharing authored questions; full progress backups may contain personal
  study history, reports, mistakes, and settings.

## Lab Scope Contract Template

```yaml
lab_id: LAB-001
allowed:
  - provided_synthetic_dataset_only
  - local_note_taking
  - report_builder
forbidden:
  - public_internet_target
  - real_credentials
  - third_party_service
  - traffic_generation
  - payload_execution
requires_acknowledgement: true
expected_outputs:
  - finding
  - evidence
  - impact
  - remediation
```

## Handling Unsafe Content

If a question, lab, report, or imported pack violates this policy, do not publish or share it. Rewrite
it into a safe replacement that uses synthetic evidence and asks for defensive reasoning, or delete it
from the local app.

## Release Review Gate

Before publishing a release or adding default content, run a safety review with these minimum checks:

- Validate all seed questions with `node scripts/validate_questions.mjs`.
- Run the read-only content safety scan with `node scripts/safety_scan.mjs`.
- Confirm all lab evidence uses synthetic, local, documentation-range, or fictional data.
- Confirm UI and README copy state authorized defensive use, synthetic/local scope, and no real targets.
- Confirm public exports exclude raw answers, private notes, report evidence, credentials, and live target details.
- Record residual risks and approval in `docs/SECURITY_LEGAL_REVIEW.md`.

Imported or user-authored question packs are not release content until they pass the same review.
