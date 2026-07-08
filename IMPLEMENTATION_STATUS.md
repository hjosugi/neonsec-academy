# Implementation Status

Snapshot of what the shipped app covers against the Phase 0–6 roadmap.
✅ done · 🟡 partial · ⬜ tracked in issues.

## Phase 0 — Foundation ✅
Product vision, CEH taxonomy, safety boundaries, data model, design system, and IA are
implemented as living code + docs (`src/data/taxonomy.ts`, `src/types/`, `docs/`).

## Phase 1 — Question Bank MVP ✅
| Issue | Status | Where |
|---|---|---|
| P1‑001 App foundation | ✅ | Vite + React + TS + Zustand |
| P1‑002 Question CRUD | ✅ | `routes/QuestionEditor.tsx`, archive not hard‑delete |
| P1‑003 Question types | ✅ | mcq / multi / true_false / scenario |
| P1‑004 Search + filter | ✅ | `routes/QuestionBank.tsx` |
| P1‑005 Markdown renderer | ✅ | `lib/markdown.ts` (XSS‑safe) |
| P1‑006 Answer + explanation | ✅ | `components/question/QuestionRunner.tsx` |
| P1‑007 Attempt history + stats | ✅ | store `attempts`, `lib/analytics.ts` |
| P1‑008 JSON import/export | ✅ | Settings → export/import |
| P1‑009 Safe seed set | ✅ | **263 questions**, all 20 modules + CEH+ |
| P1‑010 Cyber terminal layout | ✅ | `components/layout/*` |

## Phase 2 — Review System ✅
Scheduler (SM‑2, `lib/srs.ts`), mistake notebook, weakness dashboard, confidence grading,
daily queue, streaks + badges, review summary, bookmarks, keyboard shortcuts, reduced‑motion.
🟡 Explanation compare‑view is folded into the exam answer‑review rather than a standalone screen.

## Phase 3 — CEH Exam Mode ✅
Coverage matrix, **125Q / 4h** mock, blueprint weighting (`lib/exam.ts`), timed navigator +
resume, result report, no‑repeat randomisation, readiness (RAG) score, weak‑module drill,
exam answer‑review. 🟡 "Concept cards" are delivered as per‑question explanations.

## Phase 4 — Safe Practical Labs 🟡
Six synthetic labs with scope contracts, evidence, objectives, guiding Q&A, and model findings
(`data/labs.ts`, `routes/Labs*.tsx`); report builder with Markdown export (`routes/Reports.tsx`).
⬜ Evidence vault, flag‑challenge engine, and the full 20‑challenge simulator remain as issues.

## Phase 5 — CEH+ Practical Track 🟡
CEH+ question track (pentest / appsec / cloud / soc / ir / threat‑model) is live in the bank and
labs. ⬜ Dedicated engagement‑workflow, portfolio exporter, and interview tracker remain as issues.

## Phase 6 — Cyberpunk Polish & Launch 🟡
Visual theme, command palette (`/` or ⌘K), effect toggles (reduce‑motion / low‑glow /
high‑contrast / scanlines), responsive layout, onboarding, city map, and this documentation are in.
⬜ Deploy workflow, PWA/offline, and theme presets are tracked as new issues (P6‑013…015).

## New issues added this pass
- **P1‑011** Automated unit tests (Vitest) for srs / exam / analytics
- **P1‑012** CI: typecheck + build + content validation
- **P6‑013** GitHub Pages deploy workflow
- **P6‑014** PWA / offline support
- **P6‑015** Shareable question packs (import/export decks)
