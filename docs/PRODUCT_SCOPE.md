<!-- i18n: language-switcher -->
[English](PRODUCT_SCOPE.md) | [日本語](PRODUCT_SCOPE.ja.md)

# Product Scope

NeonSec Academy exists to help CEH learners manage questions, review mistakes, and prove practical
reasoning safely. It is a local-first study product, not an offensive tool, scanner, or hosted
training platform.

## Personas

| Persona | Needs | Product fit |
|---|---|---|
| Primary: CEH candidate | Build enough breadth across all 20 CEH modules, retain weak concepts, and rehearse exam timing. | Question bank, spaced review, mock exams, readiness scoring, and final gate checklist. |
| Secondary: early-career security practitioner | Practice defensive analysis, reporting, and prioritization without touching real systems. | Synthetic safe labs, report builder, CEH+ tracks, and public-safe progress export. |
| Secondary: content author or mentor | Create safe custom questions and reusable study packs without leaking private material. | Validated local authoring, question-pack import/export, and content safety guidance. |

## Use Cases

1. Daily study: open Dashboard, review due questions, practice weak modules, and capture mistakes.
2. Exam rehearsal: start a timed mock, submit answers, inspect per-domain results, and drill gaps.
3. Safe practical practice: acknowledge a lab scope contract, analyze synthetic evidence, write a
   finding, and export a report.
4. Content authoring: create or import original questions, validate metadata, and share only
   public-safe question packs.
5. Progress handoff: export aggregate analytics or final-gate status without raw answers, private
   notes, evidence, or personal study history.

## MVP Scope

The MVP includes:

- CEH-mapped seed questions covering all 20 modules.
- Search, filter, pin, clone, archive, and custom-question authoring.
- Multiple-choice, multi-select, true/false, short-answer, scenario, and report-prompt practice flows.
- Immediate grading, explanations, attempt history, mistake notes, and spaced review.
- Timed mock exams, module/domain analytics, readiness scoring, and final-gate checks.
- Synthetic read-only safe labs, report practice, and CEH+ track navigation.
- Local JSON backup plus user-authored question-pack import/export.

The MVP does not include:

- Hosted accounts, sync, leaderboards, collaboration, payments, or telemetry.
- Real target scanning, live exploit execution, phishing delivery, password cracking, malware, or
  traffic generation.
- Official EC-Council content, exam dumps, copyrighted question clones, or guaranteed passing claims.
- A full SIEM, vulnerability scanner, attack lab, credential vault, or production incident platform.

## Success Metrics

| Metric | Target signal |
|---|---|
| CEH module coverage | All 20 modules have available questions and visible coverage status. |
| Study retention | Due review backlog trends down while accuracy and mastery trend up. |
| Exam readiness | Mock exam scores meet the configured target and weak-module count falls below the final-gate threshold. |
| Safe practical readiness | Lab reports include scope, evidence, impact, remediation, and explicit synthetic boundaries. |
| Privacy and safety | Exports avoid raw answers, report evidence, personal notes, real credentials, and live target details. |

## Safety Boundary

All built-in content must use local, synthetic, fictional, or documentation-range material. Any
question, lab, report, or import that requires interaction with real systems is outside scope and
must be rejected or rewritten as defensive artifact analysis. The operational policy is maintained in
[Safety Boundaries](SAFETY_BOUNDARIES.md).
