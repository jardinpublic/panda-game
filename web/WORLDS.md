# Pandadventures — how to build a world

Web 3D game (three.js 0.187, Vite, plain JS ES modules). Run `npm --prefix web run dev`
(port 8070), tests `npm --prefix web test`, build `npm --prefix web run build`.
Open a world directly: `http://localhost:8070/?world=w03&autostart`.

World 1 (`src/worlds/w01-escape/`) is the reference: copy its structure.

## Files of a world

```
src/worlds/wNN-name/index.js   exports MODELS, TEXTS, createWorld(ctx)
src/worlds/wNN-name/rules.js   pure game rules (no three.js, no DOM), unit-tested
test/wNN-name.test.js          Vitest tests for rules.js (scoring, stars, win/lose, edge cases)
```

Never edit `src/core/*`, `src/main.js`, `src/styles.css` or another world's folder. If you need
a helper, put it in your world folder. CSS for your world: inject a `<style>` in start() and remove
it in dispose().

## The contract

```js
export const MODELS = ['office', 'nature', 'platform'];   // Kenney packs to preload (optional)
export const TEXTS = { en: { howto: ['line 1', 'line 2', 'line 3'], ...keys }, fr: { ... } };
export function createWorld(ctx) { return { start(), update(dt), dispose() }; }
```

`ctx` gives you:

| ctx | what |
|---|---|
| `THREE` | three.js namespace |
| `root` | your Group, already in the scene; add everything here (removed on exit) |
| `camera`, `scene`, `renderer` | shared; set the camera every frame |
| `setupSky({top, bottom, fog, fogNear, fogFar})`, `addLights(root)` | bright sky + hemisphere + sun (returns the sun) |
| `models.get(name, {height|width})` | Kenney model copy, feet on y=0, or `null` (always have a fallback shape). Office: desk, chairDesk, computerScreen, laptop, kitchenCoffeeMachine, loungeSofa, pottedPlant, bookcaseOpen, wallWindow, trashcan, speaker, rugRound, lampRoundTable, coatRack, cardboardBoxClosed, sideTable. Nature: tree_palm, tree_default, rock_largeA, rock_smallA, plant_bush, flower_redA/yellowA/purpleA, log, stump_round, campfire_logs, tent_smallOpen, mushroom_red. Platform: coin-gold/silver/bronze, heart, star, jewel, chest, crate, barrel, bomb, spring, flag, sign, saw, spike-block, trap-spikes, ladder, platform, pipe, key, lock, conveyor-belt, fence-straight, hedge, flowers |
| `character(id, {scale})` | 3D friend: caricature face sprite on an animated body. ids: panda cous romain mamar victor babar greg aline eugenie violaine. `c.userData.animate(dt, 'idle'\|'run'\|'jump'\|'cheer'\|'hit'\|'dance'\|'sit')`, `c.userData.flash()`, `c.userData.height` |
| `kid(seed)` | generic cartoon kid (code-drawn face). Never name a kid. |
| `castIds` | all ten friend ids |
| `input` | `held('left'\|'right'\|'up'\|'down'\|'action'\|'touch')`, `pressed(x)`, `axisX()`, `swipes` (array of 'left'/'right'/'up'/'down' this frame), `taps` (array of {x,y} in -1..1 this frame), `pointer` {x,y,down} |
| `hud` | `setScore(n, prefix)`, `setHearts(n, max)`, `setObjective(text)`, `setProgress(0..1, label)`, `meter(name, 0..1, color, label)`, `banner(text, ms, color)`, `say(obj3d, text, secs, height)`, `float(obj3d, text, color, height)`, `buttons([{id,label,side:'left'|'right',onDown,onUp}])` big touch buttons |
| `fx.burst(vec3, count, {color, speed, up})` | confetti/sparkles |
| `sfx.coin() jump() land() hit() whoosh() power() win() lose() click() hoho() beat() hat() note(freq)` | synth sounds |
| `music(bpm, melody)` | start a groove for the world (melody = semitone steps) |
| `t(key, vars)` | your TEXTS in the current language; `tShared('quote_<id>')` = a random punchline of a friend |
| `mode` ('easy'\|'normal'\|'hard'), `speed` (1, 1.3, 1.65) | difficulty |
| `random()` | seeded random 0..1 (use it, not Math.random, for gameplay) |
| `finish({score, stars, line})`, `fail({score, line})` | end the run (stars 1..3; line = funny closing sentence) |

`update(dt)` is called every frame while playing (dt ≤ 0.05 s). Keep allocations out of the hot path.

## Quality bar (non-negotiable)

- **Addictive arcade**: a run lasts 45–120 s, instantly understandable, ramps up, ends with score + 1–3 stars. Easy is forgiving, hard is a real challenge.
- **Juicy**: screen-readable feedback on every action (fx.burst, sfx, hud.float/banner, a little camera shake), bright tropical colours, characters animate.
- **Controls**: must work with keyboard on PC and touch on phone (swipes, taps or `hud.buttons`). Never require two simultaneous keys.
- **The whole gang in every world**: all ten friends appear in your world, as main roles, obstacles, spectators, or cameos with `hud.say(friend, ctx.tShared('quote_<id>'))`. Babar's lighter tap / spit is a running gag that can pop up anywhere.
- **English and French** for every visible string (TEXTS.en and TEXTS.fr, same keys). `howto` = 2–4 short lines.
- **Rules to respect**: kids are generic and unnamed (`ctx.kid`); never name Panda's exact job (only "Government Administration" / "Administration publique"); no sexual content, innuendo at most a wink; no politics; affectionate teasing only.
- **Tests**: rules.js covered by Vitest (scoring, stars, win/lose, difficulty). `npm --prefix web test` and `npm --prefix web run build` must pass.

## Cast cheat sheet (personality for gags and lines)

- **Panda**: hero. Slim gym-goer, glasses, deadpan. Lives in Martinique, works in Government Administration, does as little as possible, gets promoted anyway. Says "Hoho". Loves barbecues and merguez ("Hoho les merguez !"), rum, diving (lemon sharks, langoustines that are always too small), the gym, outrageous party costumes (leopard briefs, horned fur hat, fishnet, luchador mask, elephant-trunk briefs: "Soirée fauve !"), Brazil, PSG. Drives a red Fiat Panda. Lost his GoPro in the lagoon. Once played guitar in a work video call with his mic open.
- **Cous** (Nicolas, the author): best friend, tall, shaggy blond hair, Hawaiian shirt, guinea pigs. Was rock'n'roll ("Old Cous"), now cultured and wise ("New Cous", museums, series). Panda's parcel relay ("20 € par colis !").
- **Romain**: the instigator and boss figure. Huge grin, runner, travels everywhere, loves stock options, "Do it FOR THE SILO !", "R'gard' don' !", "Looool".
- **Mamar**: shaved head, big beard, Argentina shirt, Messi fan, huge eater (sandwiches, fries), gently evil, "Aïe aïe aïe aïe", "Olé".
- **Victor** ("Croco"): curly sailor, oceanographer, gardener (13.6 kg squash), skips deodorant, "Bosse don', Panda !", "Stylé".
- **Babar**: shaved head, cap, glasses, sceptical frown, gently evil: lighter tap on the shoulder, spit on the back. "Rase z'y tout !".
- **Greg**: the nice neutral one, lives in the US, bakes cakes. "Le crapa !".
- **Aline** (Romain's partner): kind, motherly. **Eugénie** (Mamar's partner): warm teaser. **Violaine** "Violon" (Victor's partner): surfer, "Malaisant !".
- Running gags: "Hoho", New Cous vs Old Cous, "Carottés dans l'Silo" (the series Silo), patois of Montceau-les-Mines ("y est", "vin diou", "Bois-z-y tout !"), the nightclub is "le Molière".
