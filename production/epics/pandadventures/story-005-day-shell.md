# Story 005: Day shell: clock, transition cards, carried money and promotions

> **Epic**: Pandadventures
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 3

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Godot 4.7.2 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From the brief's Core loop and Player goal & fail state:*

- [ ] A day clock shows the current time, and scenes are mapped to time slots from a data file.
- [ ] Scene order is work (8h-15h), then car defence, then beach (confirmed by the user).
- [ ] A comic transition card (caption + time) plays between scenes and can be skipped by tap.
- [ ] Money and promotion level are held in one day state and carried across scenes within a run.
- [ ] Every scene reports its result (success or fail, money earned, promotions gained) through one shared contract that the shell consumes.
- [ ] A failed scene is retried without advancing the clock.
- [ ] An end-of-day summary shows total money and promotions, and offers to restart the day.
- [ ] No save system: state lives in memory for the run only.
- [ ] Day state changes (add money, promote, advance slot) are covered by an automated test.

---

## Implementation Notes

- Define the scene-result contract here and update Story 004's placeholder result to use it.
- Avoid singletons where dependency injection is practical; a plain `DayState` object passed in keeps it testable.
- Check `docs/engine-reference/godot/` before using scene-change or autoload APIs.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Stories 004, 006, 007: the scenes themselves.
- Save and load (out of scope for v1).

---

## Files

- `src/core/day_state.gd`
- `src/core/day_shell.gd`
- `src/core/day_schedule.tres`
- `src/ui/transition_card.tscn`
- `tests/integration/day-shell/day_state_carryover_test.gd`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/day-shell/day_state_carryover_test.gd` OR a playtest doc. The transition card and summary screen are player-observable, so keep a retained screenshot of each in `production/qa/evidence/`.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/pandadventures/story-004-work-scene.md`
- Unlocks: `production/epics/pandadventures/story-006-beach-scene.md`, `production/epics/pandadventures/story-007-car-defence.md`
