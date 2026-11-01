# Game Brief: Pandadventures

**One-sentence pitch:** Guide your friend Panda through one absurd day, from dodging work at 8h to the beach at 15h and beyond, in a browser game that looks like a real production, not a toy.

## Core loop
- Enter the scene for the current time slot.
- Play its short comic challenge (dodge, fake busy, defend).
- Earn money, promotions and laughs.
- Move on to the next slot while the day clock advances.

## Player goal & fail state — what "working" looks like
- Get Panda through the day with as much money and as many promotions as possible while doing the least work.
- A scene fails when Panda is caught (boss, kids overwhelming the car); he retries that scene.

## MVP — what must exist to be the game
1. Browser build that works on mobile (touch) and PC (keyboard/mouse), fully playable in English and French.
2. Panda character with a high-quality art style and a base animation set.
3. Day shell: the clock, comic transition cards between scenes, and money/promotion carried across scenes.
4. Work scene (8h–15h): do nothing in a "Government Administration" office ("Administration publique" in French) in Martinique while dodging the boss (Romain) and colleagues (Mamar, Victor, and Cous the lazy one) (flagship).
5. Beach scene (after 15h): the relaxed reward ending the day: diving, rum, and flirting attempts that comically fail.
6. Car defence scene: kids attacking his Fiat Panda, parked near a small castle.
7. Friends' likeness pipeline: caricatured characters drawn from the user's photos (Panda first).

Running gag across scenes: Babar pops up to tap Panda's shoulder with a lighter or spit on his back.

Punchlines: every character has signature lines. Panda always starts with "Hoho" (e.g. "Hoho my bagnole!" when defending his car).

## Out of scope — not building this
- Nightclub, Pokémon-parody (no Nintendo names or artwork), Nico's 40th birthday, crocodile hunt and langoustine diving hunt (catch usually under the legal size) scenes: later chapters.
- Multiplayer, save-anywhere system, leaderboards.

## Build order
1. Work scene, in the final art style (riskiest and funniest part).
2. Day shell (clock, transition cards, carried money/promotions). Day order: work → car defence → beach.
3. Beach scene.
4. Car defence scene.

---
**Setting & cast:** Panda lives in Martinique. The cast is real friends as stylised caricatures (private cast sheet: `reference/cast.md`, never shipped). Kids are never named and are not likenesses of real children.

**Who it's for / what they feel:** Your friend group; laughing at private jokes, with Panda as the lovable lazy hero.

**Art & audio direction:** Stylised, painterly or cel-shaded comic look with rich lighting and polished animation, plus punchy comedic sound and music.

**Reference game:** *WarioWare* for the quick-scene rhythm, and *Hitman*'s "blend in and avoid being noticed" tension for the work scene.
