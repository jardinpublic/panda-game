# Story 007: Car defence scene

> **Epic**: Pandadventures
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 6

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Godot 4.7.2 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From the brief's Core loop and Player goal & fail state ("a scene fails when kids overwhelm the car"):*

- [ ] Panda's Fiat Panda is parked near a small castle; kids approach from several edges to damage it (scratch, kick, graffiti).
- [ ] When the first kid reaches the car, Panda shouts "Hoho my bagnole!" (same line in both languages).
- [ ] The player defends with one primary action and one secondary action (for example shoo, block), usable on touch and keyboard/mouse.
- [ ] Each kid attack type damages the car over time unless interrupted.
- [ ] The car has a damage meter. A full meter fails the scene, and surviving to the end of the timer with the car below the threshold succeeds.
- [ ] Waves escalate through a data file (spawn rate, speed, kid types); no tuning values are hardcoded.
- [ ] Kids are shooed or startled, never hurt (family-friendly comedy).
- [ ] Kids are stylised, generic and unnamed (friends' children in spirit, not likenesses of real children).
- [ ] The result (success or fail, money for a saved car) goes to the day shell through its contract (Story 005).
- [ ] Damage, spawn and win/fail rules are testable without the scene tree.

---

## Implementation Notes

- Keep damage and wave rules in a plain class with no node dependencies, so they can be unit-tested.
- Check `docs/engine-reference/godot/` (`input.md`, `physics.md`) before using input or 2D physics APIs.
- Use `godot-gdscript-specialist` to review the wave and damage code.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: day clock and transition cards.
- Story 003: Panda's art and animations (use them as they exist).

---

## Files

- `src/scenes/car_defence/car_defence_scene.tscn`
- `src/scenes/car_defence/car_damage_model.gd`
- `src/scenes/car_defence/car_defence_waves.tres`
- `tests/unit/car-defence/car_defence_rules_test.gd`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/car-defence/car_defence_rules_test.gd` must exist (tests are waived at `qa.level: minimal`, but the scene still needs a retained screenshot as it is player-observable).

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/pandadventures/story-003-panda-character.md`, `production/epics/pandadventures/story-005-day-shell.md`
- Unlocks: None
