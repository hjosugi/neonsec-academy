# Information Architecture

## Primary Navigation

```text
Dashboard
Question Bank
Practice
Review Queue
Mock Exam
Safe Labs
CEH+ Tracks
Reports
Analytics
Mistakes
City Map
Settings
```

## Secondary Cyberpunk Layer

```text
Neon City Map
├── Gate District: Ethics / scope
├── Ghost Market: Recon / OSINT concepts
├── Signal Grid: Network / enumeration concepts
├── Web Alley: Web security
├── Firewall Ring: Network defense / logs
├── Cloud Spire: Cloud / crypto
└── Beyond District: CEH+ practical tracks
```

## Screen Contracts

| Screen | Purpose | Main entry | Main exits |
|---|---|---|---|
| Dashboard `/` | Choose the next study action and scan readiness, due work, streak, and weak modules. | App launch, nav, onboarding completion. | Review Queue, Practice, Mock Exam, Analytics, Final Gate. |
| Question Bank `/bank` | Search, filter, pin, archive, clone, edit, and inspect questions. | Nav, command palette, Dashboard quick action. | Question Detail, New Question, Practice by module or tag. |
| Question Detail `/bank/:id` | Read one question, answer it, inspect explanation, and manage mistake/bookmark state. | Question Bank, Practice, Review, Exam Result. | Edit Question, Practice next, Mistakes, Review Queue. |
| Question Editor `/bank/new`, `/bank/:id/edit` | Author or edit safe local questions with validation and preview. | Question Bank, Question Detail, Settings import flow. | Question Detail on save, previous screen on cancel. |
| Practice `/practice` | Start untimed drills by all questions, module, CEH+ track, weak areas, or difficulty. | Dashboard, Analytics row click, City Map, Beyond. | Question runner, Review Queue, Analytics. |
| Review Queue `/review` | Clear due spaced-repetition items and grade recall. | Dashboard due card, nav due badge, command palette. | Mistakes, Question Detail, session summary, Dashboard. |
| Mock Exam `/exam` | Start or resume timed CEH mock exams and inspect exam history. | Dashboard, nav, command palette. | Exam Runner, Exam Result, Analytics, Final Gate. |
| Exam Runner `/exam/run` | Complete a timed exam with answer state, flags, and navigator. | Mock Exam resume/start. | Exam Result on submit, Mock Exam on cancel. |
| Exam Result `/exam/result/:id` | Review score, pass/fail state, per-domain results, and missed answers. | Mock Exam history, submit flow. | Practice weak areas, Question Detail, Analytics. |
| Analytics `/analytics` | Inspect module matrix, domain mastery, readiness factors, and weak modules. | Dashboard, nav, exam result. | Practice module drill, Final Gate, Question Bank. |
| Mistakes `/mistakes` | Maintain mistake notes, trap patterns, next actions, and resolved state. | Review result, Question Detail, nav. | Question Detail, Review Queue, Practice. |
| Safe Labs `/labs`, `/labs/:id` | Pick a synthetic lab, acknowledge scope, analyze evidence, and score objectives. | Nav, Beyond track links, Dashboard. | Lab Detail, Reports, Analytics. |
| Evidence Vault `/evidence` | Review private synthetic evidence grouped by challenge and return to a lab for editing. | Nav, Lab Detail. | Lab Detail, Reports. |
| CEH+ Tracks `/beyond` | Browse practical tracks and launch related drills or labs. | Nav, City Map, Dashboard. | Practice with `track`, Safe Labs, Reports. |
| Reports `/reports` | Build safe findings reports, link Vault citations, and export Markdown. | Lab Detail, Evidence Vault, nav, command palette. | Safe Labs, Evidence Vault, Settings export, local Markdown download. |
| City Map `/map` | Secondary visual navigation across CEH modules and CEH+ tracks. | Nav world section, command palette. | Practice module drill, Beyond, Analytics. |
| Settings `/settings` | Manage theme/accessibility preferences and local import/export. | Nav, command palette. | Dashboard, Question Bank after import, local file export. |
| Final Gate `/final-gate` | Check pre-booking readiness against score, backlog, weak modules, and coverage. | Dashboard, Analytics, Mock Exam. | Mock Exam, Review Queue, Analytics, Markdown export. |

## Deep Links

| Link | Behavior |
|---|---|
| `/bank/:id` | Open a specific question. |
| `/bank/:id/edit` | Edit a specific local or cloned question. |
| `/practice?module=5` | Start practice scoped to CEH module 5. |
| `/practice?track=soc` | Start CEH+ SOC track practice. |
| `/exam/run` | Resume the active exam session if one exists. |
| `/exam/result/:id` | Open a submitted exam result. |
| `/labs/:id` | Open a specific synthetic lab. |
| `/evidence` | Open Evidence Vault grouped by lab challenge. |

## Empty States

| Area | Empty state action |
|---|---|
| Review Queue | Start Practice or answer questions to create review items. |
| Exam History | Start Quick Sim or Full Exam. |
| Mistakes | Practice weak modules; mistakes appear after notes are saved. |
| Reports | Start from a Safe Lab or create a blank synthetic report. |
| Question Bank custom filters | Clear filters or create a custom question. |

## Shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Ctrl/Cmd+K` | Open command palette. |
| Arrow keys | Move inside command palette options. |
| Enter | Activate selected command. |
| Escape | Close command palette or modal surfaces. |

## Key User Flows

### Daily Review

```text
Dashboard → Start Review → Answer → Explanation → Confidence → Summary → Next Action
```

### Mock Exam

```text
Exam → Select Preset → 125 Questions → Submit → Result Report → Review Wrong Answers
```

### Practical Lab

```text
Labs → Scope Contract → Challenge → Evidence → Finding → Report → Summary
```
