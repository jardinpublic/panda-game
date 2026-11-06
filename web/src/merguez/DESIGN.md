# Golden Merguez — design

A bonus game next to Eul' Flipper and 103 RCX: a first-person mission game in
3D, one thumb, portrait. The gang throws food (and worse) at each other across
Montceau-les-Mines. Its own high scores (save `merguez`, records tab "Golden
Merguez"). A wink at the 1990s console mission shooters, with nothing taken
from any of them: no spy, no levels, no music, no look.

## The loop: cover shooter

- The hero goes from cover to cover along the level (a "station" each time).
- **Hold** anywhere: the hero pops out of cover and throws their weapon,
  over and over at the weapon's rate. **Drag** to aim (the camera turns; the
  crosshair stays in the middle). Gentle aim assist pulls the crosshair to an
  exposed opponent and every throw goes to the opponent under the crosshair.
- **Release**: back in cover. Safe there, and the weapon reloads.
- Opponents hide behind their own cover, then peek out: a "!" and a glow (the
  tell, 0.7 s), they throw, they duck again. A throw lands on the hero only if
  the hero is out of cover when it arrives.
- When every opponent of a station is out, the hero moves on ("Avance !").
- 5 hearts. A hit splats the screen and resets the combo.

## Weapons (each hero only uses their own)

| Who | Weapon | Feel |
|---|---|---|
| Panda | Merguez | all-round |
| Babar | Mollards, and every 5th throw a Chorizo | fast, light |
| Cous | Shots de Cointreau-saucisse | 3 at once, spread |
| Mamar | Andouille | slow, heavy |
| Victor | Crottes de nez | very fast, very light |
| Romain | Gardon | bounces to another opponent if the first ducks |
| Eugénie | Rouleau à pâtisserie | slow, heavy |
| Violaine | Archet de violon | goes through cover (half damage) |
| Aline | Roses | curve towards the target (wider aim assist) |
| Greg | Côte de bœuf XXXXL | very slow, huge |
| Jojo (opponent only) | Mouchoirs | 4 at once, spread |
| Rudy (boss) | Poisson-chat | bounces |
| José (boss) | Sardines | fast, spread |
| Lamoule (boss) | Poulet | heavy |

Opponents are the other gang members with their own weapons, plus people from
the level (the pétanque grandpas, the park keeper...). Mamar, every time he
peeks out as an opponent or gets hit as the hero: « Je suis une proie facile ! »

## Score

- Hit: 10 × damage × combo. In the face: « En pleine poire ! » +50 × combo.
- Opponent out: +300 × combo. Boss out: +5,000.
- Combo: ×1, +1 every 3 hits in a row, up to ×5. Reset when the hero is hit.
- End of level: +500 per heart left, +20 per second under the par time.
- A run is the levels in a row until the hearts run out.

## Levels

1. Eul' Jardin Public — boss **Lamoule** behind José's 205 (step 1).
2. Montceau station — boss **Romain** and his gardons (later).
3. Le Molière — boss **José** (later).
4. Cous's garage street — boss **Babar**, mollards and chorizo (later).
5. The CRAPA woods at night — final boss **Rudy** (later).

Lamoule, José and Rudy come in that order. When the hero is Babar or Romain,
their boss is played by another gang member (never yourself).

## Code

- `rules.js`: pure logic (weapons, levels, opponents, throws, score). Tested in
  `test/merguez.test.js`, with a bot that plays a whole level.
- `sprites.js`: the characters and the thrown things, painted on canvases
  (gang: `person()` from the marathon art kit; people: `paintFace()` from 103 RCX).
- `view.js`: the three.js scene (the park, the covers, billboards, throws).
- `index.js`: the DOM HUD, touch and keyboard, the loop, sounds (marathon sfx).
