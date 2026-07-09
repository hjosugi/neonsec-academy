---
title: "[P6-013] GitHub Pages deploy workflow"
labels: "phase:6,type:infra,area:design,priority:P1"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P1"
estimate: "1d"
---

# [P6-013] GitHub Pages deploy workflow

## Summary

Publish the static build automatically so anyone can try the trainer.

## Requirements

- [x] Actions workflow: build on push to `main`, upload `dist/`, deploy to Pages
- [x] Confirm relative `base` + `HashRouter` work on a project-pages subpath
- [x] Link the live URL from the README

## Acceptance Criteria

- [x] Pushing to `main` publishes the latest build
- [x] Deep links (e.g. `/#/exam`) load correctly on refresh

## Notes

- Build already uses `base: './'` and hash routing for exactly this.
