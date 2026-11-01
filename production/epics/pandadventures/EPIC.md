# Epic: Pandadventures

> **Source**: `design/game-brief.md`
> **Workflow**: minimal (no GDD, ADRs or control manifest)

**Goal:** Guide your friend Panda through one absurd day, from dodging work at 8h to the beach at 15h and beyond, in a browser game that looks like a real production, not a toy.

**Scope:** the brief's 7 MVP items (browser build, Panda character, day shell, work scene, beach scene, car defence scene, likeness pipeline).

**Build order:** work scene first (it needs stories 001-003 beneath it), then the day shell, then beach, then car defence.

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Browser build with touch and keyboard input | Integration | Ready | N/A |
| 002 | Friends' likeness pipeline (Panda first) | Visual/Feel | Ready | N/A |
| 003 | Panda character, art style and base animations | Visual/Feel | Ready | N/A |
| 004 | Work scene (8h-15h): do nothing, dodge the boss | Logic | Ready | N/A |
| 005 | Day shell: clock, transition cards, carried money and promotions | Integration | Ready | N/A |
| 006 | Beach scene (after 15h) | Visual/Feel | Ready | N/A |
| 007 | Car defence scene | Logic | Ready | N/A |

## Out of scope (from the brief)

- Nightclub, Pokémon-parody, Nico's 40th birthday and crocodile hunt scenes (later chapters).
- Multiplayer, save-anywhere system, leaderboards.
