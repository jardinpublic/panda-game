# Evidence — Story 001: Browser build with touch and keyboard input

Date: 2026-11-01 · Engine: Godot 4.7.2.stable.official.ed1daf0bf · Build: Web, debug, single-threaded

Run result: OBSERVED — desktop run (Movie Maker capture) and the exported Web build in a browser at desktop and emulated phone sizes.

## Screenshots

| File | Shows |
|---|---|
| `01-desktop-scene.png` | Desktop run, French picked from the system language (taken before the buttons were widened) |
| `02-web-english-after-toggle.jpg` | Web build after the language toggle: English text, "Hoho!" line, Panda moved by arrow keys, 60 fps |
| `03-web-phone-portrait-rotate-hint.jpg` | 390×844 (phone portrait): "Tourne ton téléphone" overlay |
| `04-web-phone-landscape.jpg` | 844×390 (phone landscape): full scene, controls fit, 60 fps |

## Acceptance criteria

| Criterion | Result |
|---|---|
| "Web" preset exists, `commands.build` exports without error | PASS — exit 0, `build/web/` produced |
| Runs in a desktop browser with no install | PASS — Chromium (browser pane); Firefox NOT CHECKED |
| Runs on a phone browser with a loading indicator | PARTIAL — emulated phone sizes pass, Godot's loading bar shows; a real iOS Safari / Android Chrome device is NOT CHECKED |
| One input layer for keyboard, mouse and touch | PASS — `GameInput` autoload; scenes read actions only |
| Every action reachable by touch alone | PASS — tap-to-move, on-screen Hoho / car / language buttons |
| Landscape and portrait | PASS — policy: landscape game, portrait shows a rotate hint |
| Audio after first tap | PASS by design (blip on first interaction); no console errors; sound itself not heard by the agent |
| 60 fps on a mid-range phone | NOT CHECKED on a real phone — 60 fps measured in the browser on desktop |
| Hostable on any static host | PASS — served by a plain static server, single-threaded build needs no special headers |
| `run/main_scene` set | PASS |
| Text from EN/FR translation tables | PASS — `assets/i18n/strings.csv`, no hardcoded player text |
| Starts in browser language, live toggle | PASS — French from browser, toggle switches live |

## Not done

- Automated test `tests/integration/pandadventures/browser_build_input_test.gd`: not written. gdUnit4 is not installed yet (`/test-setup`); tests are waived at `qa.level: minimal`.
- Real-phone check: open the build on a phone (see story notes) and record fps.

Sign-off: ______ (user)
