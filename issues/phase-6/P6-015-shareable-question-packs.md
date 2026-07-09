---
title: "[P6-015] Shareable question packs (import/export decks)"
labels: "phase:6,type:feature,area:content,priority:P2"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P2"
estimate: "2d"
---

# [P6-015] Shareable question packs (import/export decks)

## Summary

Let users export a set of authored questions as a portable pack and import someone else's.

## Requirements

- [x] Export selected/all user questions to a versioned JSON pack
- [x] Import a pack with schema validation and id-collision handling
- [x] Preview a pack (counts by module/difficulty) before importing

## Acceptance Criteria

- [x] A pack round-trips (export → import) without loss
- [x] Invalid packs are rejected with a clear message

## Safety / Abuse Prevention

- [x] Imported content is validated against the question schema; only synthetic, knowledge-style
      content is expected. Reject anything that fails validation.

## Notes

- Reuse `scripts/validate_questions.mjs` schema rules in-app.
