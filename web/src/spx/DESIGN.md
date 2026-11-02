# 103 RCX — design

A bonus game next to Eul' Flipper: Panda rides his 103 RCX moped home through
Montceau-les-Mines, in 3D, one thumb, portrait. About 2 min 20 s a ride, its own
high scores (save `spx`, records tab "103 RCX").

## The arcade loop

- **Speed builds up**: riding without a crash heats the 103 from 49 to 70 km/h
  in about 40 s (`heatTime`); a crash keeps only 40 % of it. Faster pays more
  (points per metre × (1 + heat)). Bends and the roundabout slow everybody,
  the cops included (√(grip × radius)).
- **Combo**: close passes (within 0.75 m of a car's side), overtakes, wheelies
  and cigarettes chain within 3 s; every 2 in a row adds ×1, up to ×5.
- **Cigarettes** lie on the road in lines, slaloms and lane changes (the
  oncoming lane is riskier); three float over each speed bump, only a jump gets
  them. They refill the pack (up to 20) and pay ×combo.
- **Turbo gauge** (round the speedometer): close passes, overtakes, wheelies and
  cigarettes fill it; full, it fires a 3.5 s turbo.
- Oncoming drivers who see Panda head-on brake, honk ("TÛÛT !") and squeeze
  over; a rear-view mirror shows the cops during the chase.

## Look

Late-afternoon sun with real shadows, a painted sky, Montceau house fronts
(rendered or brick, brick window surrounds, shutters, lace curtains), shops on
Rue Barbès and Rue Camille Desmoulins (tabac with its red "carotte",
boulangerie, pharmacie, Café des Sports), mine headframes, the ZUP tower blocks
by the Lac du Plessis, Panda's yellow house with bunting. Textures are painted
in code (`textures.js`), the town is built in `town.js`, Panda's moped and the
people in `models.js`.

Ready-made models (CC0, Kenney, `web/public/models/kenney`, loaded by
`kit.js`): every car, van, truck, tractor and the police car (Car Kit), the ZUP
blocks and café parasols (City Kit Commercial), the shop planters (City Kit
Suburban). Each model is merged into one mesh; the game falls back to
code-built cars if they cannot load. The Suburban houses were left out: they
look American, not Montceau.

## The route (real streets)

From OpenStreetMap (OSRM driving route, checked 2026-11-02), squeezed from about
4.3 km to 2.4 km of game road (`route.js`):

Parc du Petit Bois → Rue du Château → Rue du Chancelier Rollin → Rue de la Loge →
Rue du Champ du Moulin → **Rond-point de la ZUP** (by the Lac du Plessis, taken
the wrong way) → Rue du Champ du Moulin → Rue de Cluny → Avenue Jean Laville →
**Rue Beaubernard** → Rue Barbès → Rue Camille Desmoulins → Rue du Vernois →
**Rue de la Place Pageot** → Rue de Charolles (Panda's house).

OpenStreetMap names it "Rue de la Place Pageot". The minimap draws the real
shapes; the 3D road follows them, each street scaled to its game length,
corners rounded (radius 11 m), the roundabout a true circle (radius 16 m).

## Controls

- Tap fast to pedal the engine into life.
- Slide the thumb to steer (relative, ~80% of the screen width = road plus pavements).
- Flick up to jump (wheelie): speed bumps and potholes.
- The round button is the action of the moment: hold it to shout at Pépé
  Gogol; tap it (or tap the screen) to push Les Azzouz away or whack Pietro Gangi.
- Keyboard: ← → steer, ↑ / Space jump (Space pedals at the start), E / Enter action, Escape quits.

## Rules

- 3 lives (crashes), 10 cigarettes. Lose all lives: the ride ends where it is.
- The moped goes by itself (13.5 to 19.5 m/s with the heat; 9 m/s on the
  pavement; 24 with an 8.6 or a turbo). Cars going Panda's way never crash into him: he follows them, or
  they brake behind him. Oncoming cars, parked cars, people and holes crash him.
- Events, street by street:
  - Rue du Chancelier Rollin: **Pépé Gogol** on his Solex. Hold to shout
    "PÉPÉ GOGOOOOL"; the longer, the more points (100 + 320 per second, up to
    3 s). He answers in gibberish.
  - Rue de la Loge, Rue de Cluny, Rue de la Place Pageot: **Pépé Pineur**
    crosses with his cane, his name in big letters. Dodge him.
  - **Rond-point de la ZUP**: wrong way, the cars come at Panda in both lanes.
    Then **les keufs** chase him (at 84 % of Panda's road speed, start 32 m
    behind) until Rue Beaubernard: shaken off +1500, caught = a check, one life.
  - Avenue Jean Laville: **Pépé Impuissant**, his old car broken down in the
    right lane ("elle veut pas d'marrer"). Go round it; no oncoming car meets
    Panda right there.
  - Rue Beaubernard: **Le Bud and Le Smo** on their bench throw three 8.6 cans:
    each one caught is a turbo (3 s) and +300.
  - Rue Barbès: **Les Azzouz**, three riders: "Crache une clope !". Alongside for
    1.4 s, they take a cigarette; a tap pushes them away (+250).
  - Rue Camille Desmoulins: grab the **table leg** at the Café des Sports, then
    **Pietro Gangi** ("Vindieu Panda, te veux t'battre ?") rides alongside and
    lunges every 2 s (three hits = a crash). Three whacks floor him (+2000).
  - Rue du Vernois: **Babar on his 103 RCX**, a race to the end of the street.
    His speed is Panda's road speed − 0.5 m/s, rubber-banded ±1 by the gap; ride in his slipstream for +2.6 m/s.
    Win +3000.
  - Rue de Charolles: home. The gang waits in front of the house.
- Score: points per metre × (1 + heat); overtakes +120, close passes +150,
  wheelies over bumps +100, cigarettes +25, all × combo; the events above; at
  home +2000, +100 per cigarette kept, +1000 per life left, +30 per second
  under 2:45.

Every number is in `TUNING` (rules.js).

## Characters

The gang (Panda, Cous, Romain, Victor, Aline, Babar and the others at the house)
use the cast faces. The others are painted by `faces.js` in the same style, with
the same treatment for everyone and no caricature. French text is in patois
bourguignon, like the rest of the game.

## Tests

`web/test/spx.test.js`: the route (order, lengths, ring), the rules (pedal,
shout, cigarettes, cops, game over, heat, combo, turbo, pickups), whole rides
by the bot (all 6 seeds home; with a 0.3 s human reaction delay, all 5) and the
patois.
