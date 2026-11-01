# Story 003: Panda character, art style and base animations

> **Epic**: Pandadventures
> **Status**: Ready
> **Layer**: Core
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 2

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Godot 4.7.2 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From the brief's MVP feature 2 and Art & audio direction ("must not look like a toy"):*

- [ ] Panda is built from Story 002's approved sheet as a rigged 2D / 2.5D character in Godot.
- [ ] Base animation set exists: idle, walk, run, startled/caught, sneaking/hiding, celebrate/relax.
- [ ] Animations transition without visible pops and play at 60 fps in the web build.
- [ ] The final art style is locked and recorded in a short style note (palette, painting/line treatment, lighting approach) at `assets/art/style-note.md`.
- [ ] Panda is lit consistently with scene lighting (2D lighting and/or shader), judged by the user as clearly not toy-like.
- [ ] Panda reads clearly at phone screen size (checked at a phone resolution).
- [ ] Panda is one reusable scene with a `play(state)` style API that any scene can instance.
- [ ] Textures and atlases stay inside the 512 MB memory budget and are sized for web download.

---

## Implementation Notes

- Check `docs/engine-reference/godot/` (modules `animation.md`, `rendering.md`) before using animation or lighting APIs.
- Use `godot-shader-specialist` for any lighting or outline shader.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: producing the character sheet from photos.
- Stories 004, 006, 007: scene environments and other characters.

---

## Files

- `src/characters/panda/panda.tscn`
- `src/characters/panda/panda.gd`
- `assets/art/style-note.md`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/panda-character-evidence.md`.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/pandadventures/story-001-browser-build-input.md`, `production/epics/pandadventures/story-002-likeness-pipeline.md`
- Unlocks: `production/epics/pandadventures/story-004-work-scene.md`, `production/epics/pandadventures/story-006-beach-scene.md`, `production/epics/pandadventures/story-007-car-defence.md`
