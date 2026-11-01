# Story 002: Friends' likeness pipeline (Panda first)

> **Epic**: Pandadventures
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 7

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Godot 4.7.2 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From the brief's MVP feature 7 and Art & audio direction:*

- [ ] A written, repeatable process turns reference photos into a stylised, caricatured character sheet (front, side, key expressions).
- [ ] Panda's sheet is produced and approved by the user (sign-off recorded).
- [ ] The result is a stylised caricature in the chosen art style, not a photo filter, and is still recognisably Panda.
- [ ] Source photos live outside the shipped build; only stylised outputs ship.
- [ ] Output format, sizes and layered parts needed for rigging in Godot are defined, with file naming.
- [ ] Assets follow a folder convention: `assets/art/characters/<name>/`.
- [ ] The process is shown to work for a second friend (one stub character or documented dry run) with no new tooling.
- [ ] The user confirms that each friend shown is fine with appearing before the build is shared beyond the friend group.

---

## Implementation Notes

- The user supplies the photos and chooses the generation or drawing tools; do not assume one.
- The art style is locked in Story 003; keep this process style-agnostic until then, but test it on Panda.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: rigging and animating Panda in Godot.

---

## Files

- `assets/art/characters/panda/` (reference sheet and layered parts)
- `docs/art-pipeline/likeness-pipeline.md`

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/likeness-pipeline-evidence.md`.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: `production/epics/pandadventures/story-003-panda-character.md`
