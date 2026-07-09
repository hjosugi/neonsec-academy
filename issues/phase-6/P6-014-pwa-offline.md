---
title: "[P6-014] PWA / offline support"
labels: "phase:6,type:feature,area:design,priority:P2"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P2"
estimate: "2d"
---

# [P6-014] PWA / offline support

## Summary

Make the trainer installable and usable offline — it is already fully client-side.

## Requirements

- [x] Web app manifest (name, icons, theme color `#050816`)
- [x] Service worker to cache the app shell + assets
- [x] "Add to home screen" works on mobile

## Acceptance Criteria

- [x] App loads and functions with no network after first visit
- [x] Lighthouse PWA checks pass

## Notes

- All data lives in localStorage already; only the shell needs caching.
