# Golden Merguez — design

A bonus game next to Eul' Flipper and 103 RCX: a first-person mission game in
3D, one thumb, portrait. The gang throws food (and worse) at each other across
Montceau-les-Mines. Its own high scores (save `merguez`, records tab "Golden
Merguez"). A wink at the 1990s console mission shooters, with nothing taken
from any of them: no spy, no levels, no music, no look.

## The loop: tap the person you want to hit

- The hero goes from cover to cover along the level (a "station" each time).
  The camera stays still at each station and frames everyone there.
- **Tap someone**: the hero pops out of cover, throws at them (a tap on the
  head is a hit in the face), and ducks back by themself 0.35 s later. A tap
  near someone counts (generous reach); a tap on someone still behind their
  cover throws at them anyway, and it lands if they come out in time.
- That is the only gesture. The hero is exposed only while throwing: the skill
  is to tap at the right moment.
- One hit knocks an opponent out; only the bosses take several.
- Opponents hide behind their own cover, then peek out: a "!" and a glow (the
  tell, 0.7 s), they throw, they duck again. A throw lands on the hero only if
  the hero is out of cover when it arrives.
- The hero reloads in cover. When every opponent of a station is out, the hero
  moves on ("Avance !"). 5 hearts, one back between levels. A hit splats the
  screen and resets the combo.
- Three short tips on the first station: tap someone, wait out a red "!",
  aim for the head.

## Weapons (each hero only uses their own)

| Who | Weapon | Feel |
|---|---|---|
| Panda | Merguez | all-round |
| Babar | Cubis d'rouge Villageoise | slow, heavy, splashes red |
| Cous | Mégaphones that shout « Tu es creux ! » when they land | medium, solid |
| Mamar | Citrouilles | slow, heavy |
| Victor | Loulous (his word for crottes de nez) | very fast, very light |
| Romain | Sacs d'os (little skeletons) | bounce to another opponent if the first ducks |
| Eugénie | Rouleau à pâtisserie | slow, heavy |
| Violaine | Archet de violon | goes through cover (half damage) |
| Aline | Treuffes (Burgundy for potatoes) | curve towards the target (wider aim assist) |
| Greg | Côte de bœuf XXXXL | very slow, huge |
| Jojo (opponent only) | Mouchoirs | 4 at once, spread |
| Rudy (boss) | Salade de museau | bounces |
| José (boss) | Sardines | fast, spread |
| Lamoule (boss) | Poulet | heavy |

Opponents are the other gang members with their own weapons, plus people from
the level (the pétanque grandpas, the park keeper...). Mamar, every time he
peeks out as an opponent or gets hit as the hero: « Je suis une proie facile ! »

## Flying bonuses

Every 5 to 10 seconds a beauf object flies across the scene, with a golden halo:
pneu (500), tranche d'jambon (750), canette (750), tong (1,000), sac banane
(1,000), bouteille d'rhum (1,500), Malibu coco (1,500), pastaga (1,500), nain
d'jardin (2,000). Tap it to throw at it (the throw aims where it will be): its
points if it is hit. It pops the hero out of cover, so an opponent can catch you.

## Score

- Hit: 10 × damage × combo. In the face: « En pleine poire ! » +50 × combo.
- Opponent out: +300 × combo. Boss out: +5,000.
- Combo: ×1, +1 every 3 hits in a row, up to ×5. Reset when the hero is hit.
- End of level: +250 per second under the par time (a ⏱ stopwatch on screen,
  orange near par, red past it) and +500 per heart left.
- A run is the levels in a row until the hearts run out.

## Levels

1. Eul' Jardin Public — boss **Lamoule** behind José's 205 (step 1).
2. Montceau station — boss **Romain** and his sacs d'os.
3. Le Molière — boss **José**.
4. Cous's garage street — boss **Babar** and his wine boxes.
5. The CRAPA woods at night — final boss **Rudy**.

Lamoule, José and Rudy come in that order. When the hero is Babar or Romain,
their boss is played by another gang member (never yourself).

## Code

- `rules.js`: pure logic (weapons, levels, opponents, throws, score). Tested in
  `test/merguez.test.js`, with a bot that plays a whole level.
- `sprites.js`: the characters and the thrown things, painted on canvases
  (gang: `person()` from the marathon art kit; people: `paintFace()` from 103 RCX).
- `view.js`: the three.js scene (the park, the covers, billboards, throws).
- `index.js`: the DOM HUD, touch and keyboard, the loop, sounds (marathon sfx).
