# Evidence — Story 004: Work scene (8h-15h)

Date: 2026-11-01 · Engine: Godot 4.7.2 · Build: Web, debug

Run result: OBSERVED — desktop run (Movie Maker, `-- --skip-intro`) and the Web build played in a browser (tap to move, Space to fake busy, E for Hoho).

Logic tests: `tests/unit/work-scene/work_scene_detection_test.gd` — 28 checks, 0 failures (watched it fail once on a deliberately broken faking rule, then restored).

## Screenshots

| File | Shows |
|---|---|
| `00-cast-on-bodies.png` | The cast's illustrated caricature heads on in-game bodies |
| `01-intro-card.png` | Intro card: rules in French, Start button |
| `02-office-playing.png` | Office at 09:09: Romain's red cone, Mamar and Victor's orange cones, Cous asleep on the sofa, Babar wandering in |
| `03-web-coffee-fake-busy.jpg` | Web build: Panda at the coffee machine (farniente x2), fake-busy cooldown on the button |
| `04-web-hoho-bubble.jpg` | Web build: "Hoho, y est New Panda, un repenti." speech bubble |

## Acceptance criteria

| Criterion | Result |
|---|---|
| Clock 8:00 to 15:00 over a data-set duration | PASS (150 s in `work_tuning.tres`) |
| Panda moves between spots to avoid work | PASS (desk, coffee, sofa, toilets, plant) |
| Government Administration office in Martinique, no exact job named | PASS ("Administration publique" sign, sea view) |
| Boss and colleagues with view cones; seen slacking raises suspicion; Cous idles | PASS |
| Fake busy lowers suspicion, has a cooldown | PASS (seen in browser) |
| Babar's lighter tap / spit, Panda flinches, noise can get him noticed | PASS in code and desktop run; not caught on a screenshot |
| Full suspicion = caught, retry from 8:00 | PASS in code; caught screen NOT captured |
| 15:00 = success with money and promotions | PASS in code; end screen NOT captured (needs a full 150 s run) |
| Promotions at set times when suspicion is low | PASS in tests |
| All tuning in a data resource | PASS (`work_tuning.tres`) |
| Touch and keyboard through the input layer | PASS |
| Rules testable without the scene tree | PASS (`SuspicionModel`, `WorkDayModel`) |

## Not checked

- Caught screen and 15:00 summary screen were not captured as screenshots.
- Real phone (touch, performance).
- Balance: the numbers are first guesses and need play-testing.

Sign-off: ______ (user)
