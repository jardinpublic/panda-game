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
