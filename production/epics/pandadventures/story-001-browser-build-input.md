# Story 001: Browser build with touch and keyboard input

> **Epic**: Pandadventures
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-01 (implemented; awaiting real-phone check and sign-off)

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 1

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Godot 4.7.2 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From the brief's MVP feature 1 and Player goal & fail state:*

- [ ] A "Web" export preset exists (Compatibility renderer) and `commands.build` runs it without error.
- [ ] The exported build loads and runs a placeholder scene in desktop Chrome and Firefox with no installation.
- [ ] The same build loads and runs on a phone browser (iOS Safari and Android Chrome), showing a loading indicator on first load.
- [ ] One input layer maps keyboard/mouse and touch to shared game actions; scenes read actions, never raw devices.
- [ ] Every action is reachable by touch alone; nothing depends on hover.
- [ ] Layout copes with landscape and portrait (or an orientation policy is chosen and recorded) with no clipped controls.
- [ ] Audio starts after the first tap without browser autoplay errors.
- [ ] The placeholder scene holds 60 fps on a mid-range phone, or the measured fps is recorded.
- [ ] The export folder is hostable on any static web host.
- [ ] `run/main_scene` is set in `project.godot`.
- [ ] All player-facing text comes from translation tables in English and French; none is hardcoded in scenes or scripts.
- [ ] The game starts in the browser's language (French for `fr*`, English otherwise) and a menu toggle switches language live.

---

## Implementation Notes

- Check `docs/engine-reference/godot/` before using any web-export or input API (4.7.2 is past the model's training data).
- NOT SOURCEABLE here: web-export requirements (threading, server headers). Verify them in the docs before choosing export options.
- An optional PWA install is welcome but not required.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: Panda character and animations.
- Story 005: Day shell and scene flow.

---

## Files

- `project.godot` (main scene, autoloads, stretch, translations, Compatibility renderer)
- `export_presets.cfg` (Web preset, single-threaded)
- `src/main.gd`, `src/main.tscn` (placeholder scene)
- `src/core/game_input.gd` (autoload `GameInput`)
- `src/core/locale_manager.gd` (autoload `Lang`)
- `src/characters/placeholder_panda.gd`
- `assets/i18n/strings.csv`
- `.claude/launch.json` (local static server for the Web build)
- Test: `tests/integration/pandadventures/browser_build_input_test.gd` — not written, waiting for `/test-setup` (waived at `qa.level: minimal`)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/pandadventures/browser_build_input_test.gd` OR a playtest doc (tests are waived at `qa.level: minimal`).

**Status**: [x] Screenshots in `production/qa/evidence/story-001-browser-build-input/` · [ ] test (waived)

---

## Dependencies

- Depends on: None
- Unlocks: `production/epics/pandadventures/story-003-panda-character.md`, `production/epics/pandadventures/story-004-work-scene.md`
