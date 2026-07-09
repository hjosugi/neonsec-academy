---
title: "[P1-012] CI: typecheck, build, and content validation"
labels: "phase:1,type:infra,priority:P1"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P1"
estimate: "1d"
---

# [P1-012] CI: typecheck, build, and content validation

## Summary

Run quality gates on every pull request.

## Requirements

- [x] GitHub Actions workflow on push / PR
- [ ] `npm ci` → `npm run typecheck` → `npm run validate:content` → `npm run build`
- [x] Fail the check on any error

## Acceptance Criteria

- [x] A red X appears on PRs that break types, the build, or the question schema
- [ ] Badge in README (optional)

## Notes

- `scripts/validate_questions.mjs` already exits non-zero on invalid content.
