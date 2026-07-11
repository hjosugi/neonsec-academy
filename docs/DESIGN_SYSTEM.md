<!-- i18n: language-switcher -->
[English](DESIGN_SYSTEM.md) | [日本語](DESIGN_SYSTEM.ja.md)

# Cyberpunk Productivity Design System

## Design Principle

Cyberpunk は雰囲気。問題管理と復習管理が主役。

```text
Neon where it guides.
Dark where it supports.
Calm where users read.
```

## Color Tokens

| Token | Hex | Usage |
|---|---:|---|
| bg-deep-space | #050816 | Main background |
| panel-night | #0B1026 | Panels |
| border-cyan | #00F5FF | Active borders, focus |
| neon-magenta | #FF2BD6 | Important CTA, rare accents |
| acid-green | #39FF14 | Correct, completed |
| warning-amber | #FFCC00 | Due soon, warning |
| danger-red | #FF3366 | Incorrect, unsafe, blocked |
| text-main | #E6F1FF | Main readable text |
| text-muted | #8AA4C8 | Secondary text |

## Layout

- Left Nav: Dashboard / Question Bank / Review / Exam / Labs / Reports / Analytics / Settings
- Top Status Bar: XP-like progress is optional; due reviews and readiness are primary
- Main Console: question, explanation, report, lab evidence
- Side Inspector: CEH module, tags, attempts, review schedule

## Core Screens

1. Dashboard
2. Question Console
3. Review Queue
4. Mock Exam
5. Weakness Matrix
6. Lab Challenge
7. Report Builder
8. City Map Overlay

## Wireframes

### Question Console

```text
Page Header: module, tags, difficulty, pin/archive actions
┌──────────────────────────────┬──────────────────────┐
│ Question body                │ Side Inspector        │
│ Choices / free-form answer   │ module, attempts, due │
│ Submit / next action         │ related drills        │
├──────────────────────────────┴──────────────────────┤
│ Explanation: answer, why, trap, memory phrase        │
└──────────────────────────────────────────────────────┘
```

Priority: keep the prompt and choices readable first; metadata is secondary.

### Review Queue

```text
Page Header: due count, backlog, daily goal
┌──────────────────────────────────────────────────────┐
│ Current review card                                  │
│ Question -> answer -> explanation                    │
│ Again / Hard / Good / Easy confidence controls       │
├──────────────────────────────┬───────────────────────┤
│ Session progress             │ Mistake note shortcut │
└──────────────────────────────┴───────────────────────┘
```

Priority: fast recall grading, low motion, and no layout shift between cards.

### Mock Exam

```text
Top Bar: timer, answered count, flag count, submit
┌──────────────────────────────┬──────────────────────┐
│ Timed question surface       │ Question navigator   │
│ Answer controls              │ flags and status map │
│ Previous / next              │                      │
└──────────────────────────────┴──────────────────────┘
```

Priority: desktop-first timed flow with clear state for unanswered and flagged questions.

### Lab Report

```text
Page Header: lab title, scope status, score
┌──────────────────────────────┬──────────────────────┐
│ Synthetic evidence           │ Scope contract        │
│ Objectives and guiding Q&A   │ Allowed / forbidden   │
├──────────────────────────────┴──────────────────────┤
│ Findings editor: severity, impact, remediation       │
│ Markdown copy/download                               │
└──────────────────────────────────────────────────────┘
```

Priority: scope acknowledgement and synthetic evidence must stay visible before report export.

## Cyberpunk Rules

- Neon glow は active state, focus, danger/safety state だけに使う。
- 問題文、解説、コード、ログには glitch animation を使わない。
- Sound は default off。
- Reduced motion / Low glow / High contrast を必須にする。
- City map は補助 visualization。主要導線は productivity UI に置く。

## Component Vocabulary

- Neon Card
- Console Panel
- Signal Badge
- Due Chip
- Readiness Meter
- District Map Node
- Evidence Tile
- Report Block
- Command Palette
