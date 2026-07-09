---
title: "[P1-011] Automated unit tests for srs / exam / analytics"
labels: "phase:1,type:quality,area:analytics,priority:P1"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P1"
estimate: "2d"
---

# [P1-011] Automated unit tests for srs / exam / analytics

## Summary

Add a Vitest suite covering the pure logic that the whole app depends on.

## Requirements

- [x] Test `lib/srs.ts` scheduling (grade → interval/ease/lapse transitions, due calc)
- [x] Test `lib/grade.ts` (mcq/multi/true_false correctness, edge cases)
- [ ] Test `lib/exam.ts` weighting (counts match blueprint, shortfall redistribution, grading)
- [x] Test `lib/analytics.ts` (module/domain mastery, weakest selection)
- [x] Test `lib/readiness.ts` banding

## Acceptance Criteria

- [x] `npm test` runs green
- [ ] Core scheduling and exam-weighting invariants are covered

## Notes

- Pure functions already isolated from React — no DOM needed.
