# Eul' Flipper — design brief

A real arcade pinball (think *Balls of Steel*, *Pinball FX*): 3D table, chrome
ball, ramps, wire rails, lit inserts, a dot-matrix display (DMD), light shows,
missions and a wizard mode. Built on the engine of **Pipeline Pinball** from
`C:\git\sfdx-hardis-training\site-theme\javascripts\guinea-run\worlds\pinball\`
(same author as this game; credit it in file headers). Keep its engine quality
(physics, camera, flippers, DMD, lights, sounds), replace the theme, the table
layout, the scenario and the art with **Pandadventures**.

Lives in `web/src/flipper/`. Entry point used by the app:

```js
import { startFlipper } from './flipper/index.js';
const handle = await startFlipper({
  root,          // a <div> filling the phone screen; the flipper adds its own canvas + overlays inside
  lang,          // 'fr' | 'en'
  t,             // (key, vars) => string, the app's i18n (flipper texts can also be local)
  hero, hat,     // the player's friend id and hat (Panda by default)
  sound: true,   // muted or not
  onGameOver({ score, summary }), // called once at game over; the app shows its own card and records the score
  onExit(),      // the player quits (close button)
  auto: false,   // self-play (tests and demos)
});
handle.dispose(); // stop everything, remove the canvas, free WebGL
```

Three.js comes from the npm package `three` (already a dependency): `import * as THREE from 'three'`.

## Look

- Night in Martinique: deep violet to lagoon blue playfield with a painted madras
  border, Diamond Rock and palms printed under the playfield art, neon accents
  (cyan, mango, hibiscus pink). Chrome rails and a **chrome steel ball** (no
  guinea pig). Plastics (slings, lane guides) in translucent hibiscus / lagoon.
- Faces: the cast pictures are SVGs at `web/public/cast/<id>.svg` (ids: panda,
  cous, mamar, babar, victor, romain, eugenie, violaine, aline, greg). Draw them on
  bumper caps, signs and the apron (load as images, paint on canvases used as
  textures).
- DMD: keep the orange dot-matrix; texts in the player's language. French texts
  are in **patois bourguignon**: "eul'" for "le", "me" for "moi", "y'est" for
  "c'est", "te" for "tu" (Violaine speaks standard French). Panda says "Hoho !".
  The gang calls Panda "Eul' Tatou", "Tatooine", "Tintouin". On a lost ball the
  rival says "Cheh !". Never name Panda's job (say "administration publique").
  No sexual content. Kids are never named.

## The table (new dispositions, not a copy)

Every friend has a place:

| Pipeline Pinball part | Eul' Flipper part | Friend |
|---|---|---|
| Integration ramp (left) | **Rampe Fiat Panda**: a road ramp, the little Fiat Panda drives on it | Cous (sign "Old Cous / New Cous", flips each shot) |
| Uat ramp (right) | **Rampe du Rhum**: ends in a giant ti-punch glass | Eugénie (bar) |
| Production ramp (centre, gated) | **Montée du Silo**: climbs to the upper floor "Carottés dans l'Silo" | Aline & Romain |
| Upper floor + rabbit + Sales Manager blocker | Silo roof: mini flippers, **Georges the croco** swimming (moving target), **Romain** blocking the exit ("Bah oui, faut bosser !") | Romain |
| Left orbit + spinner | **Tour de l'île** loop with the **ti-punch spinner** | |
| Right orbit | **Route de la plage** | |
| PR scoop (mission start) | **Le Molière** (neon club entrance) | Violaine (DJ) |
| Terminal saucer (random command) | **Eul' barbecue**: random merguez effect (ball save, extra ball, lock, bonus x, points, kickback…) | Babar |
| 3 pop bumpers | Bumpers **Babar, Mamar, Greg** (faces on the caps) | |
| 5 drop targets | **T-A-T-O-U** drops | |
| 3 standups | **8.6** cans | Victor |
| Backups / quality targets | **Impôts** targets (taxes: "on paie ton billet d'avion !") | |
| Kickbacks | **Eul' sanglier** (Babar's boar) left, **Fiat Panda reverse** right | |
| Flow disc (vortex) | **Eul' cyclone** (hurricane) spinning disc | |
| Hotfix saucer + wire | **Mamar's ball** (capture ball: "Batigol !") | Mamar |
| Admin raid | **"Hoho ma bagnole !"**: kids (generic, unnamed) pop up around the Fiat, hit them before they scratch it | |
| Victor's note | **L'aubergine de Victor**: a random lit shot worth 1M for 25 s | Victor |
| Apron | Panda reacting (Hoho!), the player's hat | Panda |

Change the geometry: mirror or move shots so it is not the same table (e.g. ramps
on the other sides, scoop and saucers elsewhere, bumpers lower left), but keep it
flowing and fair (test with the bot).

## Scenario

- 3 balls, ball save, skill shot (lit lane via flippers before plunge), replays,
  match at the end, tilt with "Attention… DANGER" then TILT.
- Lock & multiball: **Silo multiball** ("Do it FOR THE SILO !"), jackpots on the
  ramps, super jackpot on the silo.
- 10 missions started at Le Molière, one per Pandadventures world:
  15h pétantes (Romain chase), Concert en visio (mute the burp), Hoho ma bagnole
  (protect the Fiat), Plongée langouste, Nuit au Molière, La boule de Mamar,
  Soirée fauve, Old Cous / New Cous, Carottés dans l'Silo, Babar contre-attaque,
  Georges eul' croco. Adapt the original mission mechanics (lit shots, alternate
  ramps, spinner meter, giant ball, timed targets…) to these stories.
- Wizard mode: **Eul' Grand Hoho** (all friends cheer, every shot a jackpot,
  Romain must be hit 3 times to escape to the beach).

## Quality bar

The user compared the first 2D attempt to Pipeline Pinball and found it lame. This
must look and feel like a real arcade table: 3D, lights, ramps, DMD animations,
light shows, camera following the ball, satisfying sounds, readable on a phone in
portrait. Test with the bot (games end, no escapes, no stuck balls) and in the
browser at 390x844.

---

# Table v2 — "L'île de Panda" (replaces the Pipeline-like layout)

The user: "the flipper engine is good, but the table is too close to the guinea
pig one: find different element types (take inspiration from Balls of Steel)".
Keep the engine (physics core, camera, DMD, lights, sounds, controls) and the
gang; **replace the table's structure**. Pipeline Pinball is built on 3 ramps, 2
orbits, an upper floor with mini flippers, saucers, drop/standup banks and a
spinning disc. v2 must feel like a different machine, built around element
TYPES Pipeline does not have (from real tables: Balls of Steel roaming
monsters and spelling bonuses, Theatre of Magic / Medieval Madness bash toys,
Twilight Zone magnets, cellar holes + VUKs, captive balls, diverters, loops).

## Element types to add (new engine features)

| Type | Panda element | How it plays |
|---|---|---|
| **Bash toy** (big target with hit points, animated) | **La Montagne Pelée** volcano, centre top | hit it 4 times → it ERUPTS (lava lights, smoke, shake) → its crater opens as a hole for 20 s → ball in the crater = "Éruption" multiball (2 balls); the volcano gets harder each time |
| **Roaming creatures** (Balls of Steel monsters, no gore) | **Les crabes de terre** (Martinique land crabs) walking sideways across the lower-middle playfield | 2–4 crabs wander and bounce off things; hitting one flips it on its back (points, "MATOUTOU !" combo counter); all crabs flipped = crab frenzy jackpot; they come back after a while |
| **Captive ball** (a ball on a short rail, momentum transfer) | **Eul' coco** of Babar: a coconut ball in a short lane on the right | hit the coconut hard enough to send it to the top switch = "COCO !" points, lights the kickback; 3 times = extra ball lit |
| **Magnet** (grab and throw) | **Eul' ballon d'Mamar** magnet under a disc on the left | when lit, catches a passing ball, holds it 1 s (shakes), then throws it toward a random lit shot ("Batigol !"); also used as a magna-save in a mission |
| **Cellar hole + subway + VUK** (ball sinks into the playfield, travels underneath, is kicked up onto a wire) | **La cave à rhum** sinkhole centre-left | ball sinks → rum cellar award (random: rum points / lit shot / ball save / 8.6 can) → VUK pops it onto a wire ramp that delivers to the left inlane |
| **Diverter** (gate on a ramp that switches the exit) | **Rampe Fiat Panda** (right) with a diverter | normally returns to the right inlane; when the lock is lit, the diverter sends the ball into **Le Silo** |
| **Visible vertical lock** (balls stack in a clear tube) | **Le Silo** (Aline) on the right side | locked balls are visible stacked in the transparent silo; 3 = "Do it FOR THE SILO !" multiball |
| **Drop-target "drawbridge" in front of a hole** | **Le Molière** door: 3 drop targets (the bouncers) block the club entrance | knock the 3 bouncers down to open the door → shoot the scoop behind = start a mission; bouncers pop back up after |
| **Vertical loop ramp** (a wire loop-the-loop) | **Le looping de 15h pétantes** on the left | a fast shot loops the loop ("15H PÉTANTES !"); too slow = falls back |
| **Up-post between the flippers** | **Eul' sanglier** (the boar) post | lit by the coconut; pops up between the flippers for 10 s to save the ball |
| **Spelling bonuses** | top rollovers **H-O-H-O** (4 lanes, lane change with the flippers) and standups **M-E-R-G-U-E-Z** (7, around the playfield) | HOHO = bonus multiplier; MERGUEZ = barbecue hurry-up |
| **Pop bumpers** | 3 bumpers Babar, Mamar, Greg in a cluster **under the HOHO lanes** (classic feed) | |
| **Slingshots, outlanes, inlanes, kickback** | slings Victor (aubergine) / Greg (burger); kickback "Marche arrière" on the right | |

Remove from v2 (Pipeline signatures): the three-ramp fan, the two orbits as the
main shots, the upper floor with its mini flippers, the third flipper, the
spinning flow disc, the admin raid pop-ups, the terminal and hotfix saucers.
(Engine code for them may stay unused.)

## Shots for the rules (new names)

`volcano` (bash hits), `crater` (hole when open), `crab`, `coco` (captive top
switch), `magnet`, `cellar`, `fiat` (ramp), `silo` (lock), `bouncer` (drops),
`moliere` (scoop), `loop`, `hoho` (lanes), `merguez` (standups), `bumper`,
`sling`, `outlane`, `drain`. Missions (DESIGN.md "Scenario") are re-mapped onto
these shots: e.g. 15h pétantes = loop then Fiat then volcano in order; Concert en
visio = hit the flashing shot; Hoho ma bagnole = Fiat ramp x3 while crabs try to
reach the car; Plongée langouste = cellar x2 + coco; Nuit au Molière = bouncers
then scoop twice; La boule de Mamar = magnet throws x4; Soirée fauve = crab
frenzy; Old Cous / New Cous = alternate Fiat ramp and loop; Carottés dans l'Silo =
lock 2 in the silo; Babar contre-attaque = merguez letters while avoiding red
crabs. Wizard Eul' Grand Hoho = volcano erupts every 10 s, every shot a jackpot.

## Table v2 as built (November 2026)

v2 replaces the Pipeline-like table above. Engine code that only v1 used (the
upper floor, the saucers, the flow disc, the raid, their paint functions and
texts) is gone; the physics core, camera, DMD, lights and sounds are unchanged.

**New engine features** (`engine/physics.js`, each with a unit test in
`web/test/flipper.test.js`): `bashToy` (hit points, "bash" events), `post` +
`raise` (up-post), `creature` + `flipCreature` (walking bodies with bounds,
turns, avoidance, an optional target), `magnet` (grab, hold, throw on
`release`), `captive` (ball on a rail, momentum transfer, "top" event),
`diverter` (switches a path's exit), paths with `holdAtEnd` (a lock),
`verticalLoop` (loop-the-loop path; too slow rolls back), `setRandom`.

**Layout** (`engine/layout.js`, table units, y up from the drain; the table
is built at its final size, no stretch):

| Element | Where | Friend |
|---|---|---|
| H-O-H-O rollovers (4) | top, x 0.15–4.15, y 20.45 | Panda ("Hoho !") |
| Pop bumpers (3) | under the lanes, right | Babar, Mamar, Greg |
| La Montagne Pelée (bash toy r 0.95) + crater hole | centre top (-0.35, 16.4), crater at its foot | Romain in the wizard's last round |
| Eul' ballon d'Mamar (magnet) | upper left (-2.6, 15.9) | Mamar |
| Le looping de 15h pétantes (vertical loop) | mouth x -4.55..-3.35, y 10.9; exits top left towards the magnet | Romain (sign on the loop) |
| La cave à rhum (cellar + VUK wire to the left inlane) | (-2.1, 12.4) | Eugénie (neon; ti-punch glass on the left bank) |
| Le Molière (scoop) behind 3 bouncer drops | (1.35, 13.7), drops at y 12.85 | Violaine |
| Rampe Fiat Panda + diverter | mouth x 2.3..3.5, y 10.9; returns to the right inlane | Cous (Old/New sign, the Fiat) |
| Le Silo (visible lock tube, leans back for the phone camera) | hangs over (4.45, 14.85) | Aline (neon) |
| Eul' coco (captive ball) | lane on the right wall, x 4.45, y 11.1–12.9 | Babar |
| Land crabs (3, a 4th in missions) | lower middle, x -2.6..2.6, y 7.7..10.3 | — |
| M-E-R-G-U-E-Z standups (7) | 2 per bank, left wall, top left, right wall | Babar's barbecue |
| Slings | | Victor (left), Greg (right) |
| Marche arrière (kickback) | right outlane | |
| Eul' sanglier (up-post) | between the flippers (0, 1.05) | Babar's boar |
| Apron | | Panda |

**Rules** (`engine/rules.js`): the loop lights the Silo lock; the Fiat ramp's
diverter drops the ball into the Silo; 3 locks = Silo multiball (3 balls,
jackpots on loop / Fiat / cellar, super jackpot = Fiat into the Silo). The
volcano needs 4 hits (+1 per eruption, max 8), erupts, the crater opens 20 s;
a ball in it = Éruption multiball (2 balls, every volcano hit a jackpot). Crabs
flip when hit (MATOUTOU combo up to x5), all flipped = crab frenzy, back after
22 s (10 s after a frenzy). The coconut at its top switch = COCO: lights the
kickback, raises the boar 10 s, the 3rd and 12th light an extra ball, and it
collects the MERGUEZ barbecue hurry-up. The magnet is lit at each ball and
every 12 bumper hits, and throws into the open crater, at the volcano or to
the flippers. The cellar gives one of 7 random awards. The 3 bouncers open Le
Molière; its scoop starts the mission select. Missions are as listed above.

**Look**: volcano with lava streaks, a lava light, smoke, sparks and a lava
fountain on eruption, the crater mouth glowing open; lilac land crabs with
mango claws that walk sideways and roll on their backs; a coconut on its rail;
Mamar's disc with a glowing ring; the Silo tube with the locked balls glowing
in it; the boar rising between the flippers; the playfield painted with lava
flows, the crabs' beach, the Molière red carpet, the cellar trapdoor, the
Fiat road. The portrait camera frames the whole width, side wires included.

**Checked**: bot games end in 13–25 min with no stuck or escaped ball and make
every main shot; screenshots in `production/qa/evidence/flipper-v2-*.jpg`.
