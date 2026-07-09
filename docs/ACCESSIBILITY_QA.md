# Accessibility QA

Review date: 2026-07-10

Scope: Phase 6 visual theme, effect controls, responsive review, and keyboard affordances.

## Theme Presets

Settings provides four presets:

| Preset | Effect |
|---|---|
| Neon Night | Full cyber ambience, scanlines on, normal contrast. |
| Low Glow | Neon bloom reduced while preserving the visual style. |
| High Contrast | Brighter text and borders, low glow, scanlines off. |
| Focus Mode | Reduced motion, low glow, high contrast, scanlines off, sound off. |

Individual toggles remain available for reduce motion, low glow, high contrast, scanlines, and sound.
Sound is default off.

## Checklist

- [x] Question, explanation, log/code-like text, report fields, and tables use text-first contrast tokens.
- [x] Glitch animation is limited to brand/onboarding text and is not applied to question bodies.
- [x] Reduced-motion mode disables CSS animations/transitions through a root class and respects `prefers-reduced-motion`.
- [x] Low-glow mode removes heavy neon bloom.
- [x] High-contrast mode brightens muted copy and hairlines.
- [x] Status indicators pair color with text, symbols, labels, or badges.
- [x] Command Palette opens from `/` or `Ctrl/Cmd+K`, supports arrow/enter/escape, and does not execute OS commands.
- [x] Mobile layout collapses sidebars/grids, keeps review usable, and warns that full mocks are desktop-recommended.
- [x] City Map remains a secondary progress overlay and can be hidden.

## Known Follow-Up

- A committed browser-based accessibility suite would make the current manual checklist repeatable.
- Bundle code splitting remains a performance follow-up from the v1 acceptance run.
