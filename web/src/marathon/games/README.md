# Micro-games

The marathon chains 3-to-6-second micro-games, faster and faster, 3 lives,
a boss every 10th game. Mobile portrait, one thumb. Each file in this folder
is one micro-game; `index.js` picks them all up (no registration needed).

## Contract

```js
export default {
  id: 'spit',               // unique, kebab-case
  world: 'w10',             // which Pandadventures world it comes from (w01..w11)
  input: 'swipe',           // 'tap' | 'swipe' | 'hold' | 'drag' | 'mash'  (ONE kind per game)
  base: 4.5,                // seconds at speed 1; real length = max(min, base / speed)
  min: 1.6,                 // optional floor for the length (reading games use 3)
  survive: true,            // true: timeout = win (you survived); false: timeout = lose
  boss: false,              // bosses: base 8-10 s, length = base / sqrt(speed), several phases
  verb: { en: 'DODGE!', fr: 'ESQUIVE !' },   // the 1-3 word order shown at the start
  title: { en: "Babar's spit", fr: 'Le crachat de Babar' },   // shown on the intro scene
  howto: { en: 'Babar is loading a spit. Swipe left or right to dodge every one.', fr: '…' }, // intro scene: what to do, 1-2 short sentences
  winLine: { en: 'Dry as a bone!', fr: 'Sec comme un os !' }, // shown on the success scene
  create(g) {
    return {
      update(dt) {},        // also called after the game is decided: keep animating, stop threats
      draw(c) {},           // full redraw every frame, background included
      press(x, y) {},       // finger down (immediate: use this for reflex taps)
      release(x, y) {},     // finger up
      move(x, y) {},        // finger moving
      swipe(dir) {},        // 'left' | 'right' | 'up' | 'down', fired as soon as the swipe is clear
      bot() {},             // test player: returns {press:[x,y]} | {release:[x,y]} | {move:[x,y]} | {swipe:dir} | null
    };
  },
};
```

### `g`, what a game gets

| field | meaning |
|---|---|
| `g.W`, `g.H` | stage size in logical units. W is always 400; H is 700-900 (portrait phone). Keep the action between y=80 and y=H-60 (HUD lives above and below). |
| `g.speed` | 1 at the start, up to 2.4. Scale every tempo with it (spawn gaps, projectile speeds, windows). |
| `g.boss`, `g.level` | boss flag, games played so far |
| `g.duration`, `g.elapsed`, `g.left` | seconds |
| `g.random()` | seeded random. NEVER use Math.random (tests must be deterministic). |
| `g.hero`, `g.hat` | the friend the player plays as (often 'panda', can be anyone) and their hat. Draw the hero with `person(c, g.hero, ..., { hat: g.hat })`. |
| `g.cast('babar', 'mamar')` | first id that is not the hero: use it to pick a villain, so the hero never fights themself |
| `g.friend(not)` | a random friend who is not the hero |
| `g.win()`, `g.lose()` | decide the game (only the first call counts). Decide as soon as it is clear: ending early is snappier. |
| `g.done`, `g.won` | decided? won? |
| `g.tr({en, fr})` | text in the player's language |
| `g.say(x, y, str, time)` | speech bubble pointing at (x, y) |
| `g.fx` | `burst(x, y, {kind:'confetti'|'petal'|'spark'|'drop'|'smoke', n, colors, speed})`, `text(x, y, str, {color, size})`, `shake(px)`, `flash(color)` |
| `g.sfx` | `tap pop good bad coin whoosh splash hit sizzle tick speedup boss life over best hoho click` (steel pan / marimba / ti-bwa kit) |

### Art kit (`../art.js`)

Use it; do not invent another style. `PAL` palette (lagoon, sea, deep, sand,
palm, leaf, coral, mango, hibiscus, sunset1/2, night, violet, cream, ink, creole[]),
`scene.beach|lagoon|office|club|street|garden|yard|mangrove|silo|call(c, W, H, t)`,
`person(c, id, x, feetY, size, pose, t, {flip, hat, squash, alpha})` with poses
`idle run cheer sad point sit dance`, `head(c, id, x, y, h, {rot, flip, squash, hat})`,
`kid(c, x, feetY, size, seed, t, pose)` (generic unnamed kids), `palm`, `sun`,
`diamondRock`, `creoleHouse`, `hibiscus`, `madras`/`madrasBand`, `bulbs`, `neon`,
`bubbles`, `lightRays`, `seaweed`, `rrect`, `circle`, `ellipse`, `vgrad`,
`shadowed(c, drawFn)`, `groundShadow`, `text(c, str, x, y, {size, color, stroke})`,
`wrap`. `fiatPanda(c, x, y, t, {shake, alarm})` is exported by `kids.js`.

## Flow around a game

The app shows an intro scene first (the game's first frame dimmed, with
`title`, `verb`, `howto` and an animated gesture), then the game, then a
success or fail scene (`winLine` on success). The game itself does not draw
instructions beyond small in-scene hints.

## Quality bar

- Readable in half a second: one big clear subject, one obvious threat or target.
- Every threat has a TELL (wind-up, glow, shake, sound) before it hits.
- Feedback on every input (sound + particles or motion) and a big moment on win/lose.
- Modern and smooth: gradients, soft shadows, rounded shapes, eased motion.
  No black outlines, no pixel art, no square-wave sounds.
- Martinique flavour where it fits: lagoon, palms, madras, bakoua hat,
  hibiscus, ti-punch, Diamond Rock, Creole houses.
- The gang appears: the hero plus at least one other friend in every game.
- Rules: kids are never named and never drawn from photos (use `kid()`);
  never name Panda's job (say "public administration"); no sexual content; no politics.

## Tests

`test/microgames.test.js` plays every game here with its `bot()` at speeds 1,
1.7 and 2.4 (must win 11 of 12 seeds), with no input (must lose 11 of 12),
and with every friend as the hero. Run it with:

    npx vitest run test/microgames.test.js
