# Story 004: Work scene (8h-15h): do nothing, dodge the boss

> **Epic**: Pandadventures
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 4

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Godot 4.7.2 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From the brief's Core loop and Player goal & fail state (the flagship, built first among the scenes):*

- [ ] The scene runs an in-game clock from 8:00 to 15:00, mapped to a short real duration set in data.
- [ ] The player moves Panda between spots (desk, coffee machine, hiding places) to avoid doing work.
- [ ] The setting is a "Government Administration" office ("Administration publique" in French) in Martinique. Never name his exact job or department.
- [ ] The boss (Romain) and colleagues (Mamar, Victor) move around; each has a notice range or cone. Being seen idle raises a suspicion meter. Cous is the lazy colleague who idles too (a comic ally or distraction, not a watcher). Looks per `reference/cast.md`.
- [ ] A fake-busy action lowers suspicion temporarily and has a cooldown.
- [ ] Babar pops up at random intervals (set in data) to tap Panda's shoulder with a lighter or spit on his back; Panda flinches for a moment, which can get him noticed.
- [ ] A full suspicion meter fails the scene: a comic "caught" moment, then retry from 8:00.
- [ ] Reaching 15:00 succeeds and reports money earned and promotions gained.
- [ ] Promotions trigger at set times when suspicion is low, raise the pay rate and show a comic reaction.
- [ ] All tuning values (clock length, notice ranges, thresholds, pay, promotion times) live in a data resource, none hardcoded.
- [ ] Controls work through Story 001's input layer on touch and keyboard/mouse.
- [ ] Suspicion and detection rules are testable without the scene tree.

---

## Implementation Notes

- Keep detection and suspicion rules in a plain class with no node dependencies, so they can be unit-tested.
- Results go back to the day shell through the single scene-result contract defined in Story 005; until then return a simple result dictionary.
- Check `docs/engine-reference/godot/` before using navigation, input or animation APIs.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: the day clock across scenes, transition cards, carrying money between scenes.
- Story 003: Panda's art and animations (use them as they exist).

---

## Files

- `src/scenes/work/work_scene.tscn`
- `src/scenes/work/suspicion_model.gd`
- `src/scenes/work/work_tuning.tres`
- `tests/unit/work-scene/work_scene_detection_test.gd`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/work-scene/work_scene_detection_test.gd` must exist (tests are waived at `qa.level: minimal`, but the scene still needs a retained screenshot as it is player-observable).

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/pandadventures/story-001-browser-build-input.md`, `production/epics/pandadventures/story-003-panda-character.md`
- Unlocks: `production/epics/pandadventures/story-005-day-shell.md`
