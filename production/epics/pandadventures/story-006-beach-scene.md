# Story 006: Beach scene (after 15h)

> **Epic**: Pandadventures
> **Status**: Ready
> **Layer**: Feature
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 5

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Godot 4.7.2 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From the brief's Player goal & fail state ("a session feels complete when…") and Art & audio direction:*

- [ ] Panda is on the beach of his island in a warm, lit scene with animated water, depth layers and light particles.
- [ ] The scene is a short relaxed wind-down (about 1-2 minutes) with 3 simple touch/keyboard interactions: diving, drinking rum (Panda gets visibly tipsier), and flirting attempts that fail comically.
- [ ] Flirting stays playful and non-explicit; the women are characters with their own reactions, not stereotypes.
- [ ] The money earned during the day shows as a visible payoff in the scene.
- [ ] There is no fail state.
- [ ] The scene ends the day by reporting its result through the day shell's contract (Story 005).
- [ ] Ambient audio plays after the first tap.
- [ ] The scene holds 60 fps on a mid-range phone in the web build, effects included, or the measured fps is recorded.

---

## Implementation Notes

- Check `docs/engine-reference/godot/` (`rendering.md`, `animation.md`) before using particle, water-shader or lighting APIs; stay within the Compatibility renderer.
- Use `godot-shader-specialist` for water and light effects.
- A sports moment from the original idea is not in the MVP; keep this scene to the beach.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: end-of-day summary screen and day restart.

---

## Files

- `src/scenes/beach/beach_scene.tscn`
- `src/scenes/beach/beach_scene.gd`
- `assets/art/environments/beach/`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/beach-scene-evidence.md`.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/pandadventures/story-003-panda-character.md`, `production/epics/pandadventures/story-005-day-shell.md`
- Unlocks: None
