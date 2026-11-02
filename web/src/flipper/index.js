// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * Eul' Flipper: the 3D pinball of Pandadventures (see DESIGN.md).
 *
 * Pipeline Pinball's engine with the Pandadventures scenario (missions.js,
 * rules.js, texts.js), running on its own inside a <div>. This module replaces the
 * Guinea Run host (its engine, HUD, shell, guinea pig, Hall of Fame and
 * checkpoint) with small local pieces:
 *   - a WebGL renderer, scene and camera of its own (engine stand-in for view.js),
 *   - a DOM HUD: the dot-matrix display, toasts, chat bubbles, mission picker,
 *     end-of-ball card, a close button,
 *   - touch (screen halves, swipe up = nudge, multi-touch) and keyboard input.
 * Dropped for now: the saved-game checkpoint, the Hall of Fame top-5 flash,
 * the guinea pig on its stand and the confetti bursts.
 *
 *   const handle = await startFlipper({ root, lang, t, hero, hat, sound, onGameOver, onExit, auto });
 *   handle.dispose();
 */
import * as THREE from "three";
import { buildTable, TABLE } from "./engine/layout.js";
import { createRules } from "./engine/rules.js";
import { createView } from "./engine/view.js";
import { createAutoplay } from "./engine/autoplay.js";
import { createDmd } from "./engine/dmd.js";
import { createMusic } from "./support/music.js";
import { THEMES } from "./support/themes.js";
import { createSound } from "./support/sound.js";
import { TEXTS } from "./texts.js";

// The table's labels and signs (texts-table.js, written with the table art):
// merged over TEXTS when the file is there. A glob, so a missing file is no error;
// switch to a static import once texts-table.js is committed.
const TABLE_MODULES = import.meta.glob("./texts-table.js", { eager: true });
const TABLE_TEXTS = (Object.values(TABLE_MODULES)[0] || {}).TABLE_TEXTS || {};

// The moments the dot-matrix display shouts, and those it says instead of a toast
const DMD_WORDS = {
  pbJackpot: "dmdJackpot",
  pbReleaseJackpot: "dmdJackpot",
  pbSuperJackpot: "dmdSuperJackpot",
  pbMultiball: "dmdMultiball",
  pbSkillShot: "dmdSkillShot",
  pbSuperSkill: "dmdSuperSkill",
  pbExtraBall: "dmdExtraBall",
  pbBallSaved: "dmdBallSaved",
  pbTilt: "dmdTilt",
  pbTiltWarning: "dmdDanger",
  pbMissionDone: "dmdMissionDone",
  pbReleased: "dmdReleased",
  pbLocked: "dmdLocked",
  pbCombo: "dmdCombo",
  pbLoops: "dmdLoops",
  pbPipelineCombo: "dmdPipeline",
  pbHurryDone: "dmdHurry",
  pbSecretSkill: "dmdSecretSkill",
  pbCodeFreeze: "dmdCodeFreeze",
  pbProductionOpen: "dmdProductionOpen",
  pbNoteFound: "dmdNote",
  pbShootAgain: "dmdShootAgain",
  pbBallN: "dmdBall",
  pbKickback: "dmdRollback",
  pbLockLit: "dmdLockLit",
  pbNextLevel: "dmdLevelUp",
  pbReleaseDay: "dmdReleaseDay",
  pbBonusXUp: "dmdBonusX",
  pbHotfix: "dmdHotfix",
  pbQualityGate: "dmdQualityGate",
  pbQuickDeploy: "dmdQuickDeploy",
  pbReplay: "dmdReplay",
  pbMatchWon: "dmdMatch",
  pbBackupRestored: "dmdBackup",
  pbKickbackR: "dmdReverse",
  pbOldCous: "dmdOldCous",
  pbNewCous: "dmdNewCous",
  pbOldCousShot: "dmdOldCous",
  pbNewCousShot: "dmdNewCous",
  pbBurpNow: "dmdMute",
  pbBatigol: "dmdBatigol",
  pbCrocoHit: "dmdCroco",
  pbKidShooed: "dmdShoo",
  pbMerguezGrabbed: "dmdMerguez",
  pbCheh0: "dmdCheh",
  pbCheh1: "dmdCheh",
  pbCheh2: "dmdCheh",
  pbCheh3: "dmdCheh",
  pbCheh4: "dmdCheh",
  pbCheh5: "dmdCheh",
  pbCheh6: "dmdCheh",
  pbCheh7: "dmdCheh",
  pbCheh8: "dmdCheh",
  // Table v2
  pbCrab: "dmdMatoutou",
  pbCrabFrenzy: "dmdFrenzy",
  pbLoop: "dmdLoop",
  pbEruptionLit: "dmdEruption",
  pbEruption: "dmdEruption",
  pbCraterJackpot: "dmdCrater",
  pbCoco: "dmdCoco",
  pbDoorOpen: "dmdDoor",
  pbSiloLocked: "dmdSilo",
  pbMerguezAll: "dmdMerguez",
  pbCellarRum: "dmdCellar",
  pbCellarLock: "dmdCellar",
  pbCellarSave: "dmdCellar",
  pbCellarCan: "dmdCellar",
  pbCellarMagnet: "dmdCellar",
  pbCellarNote: "dmdCellar",
  pbCellarBoar: "dmdCellar",
  pbCellarRaclette: "dmdCellar"
};
const DMD_ONLY = new Set(["pbLoops", "pbSecretSkill", "pbHotfix", "pbReplay", "pbJackpot", "pbReleaseJackpot", "pbSuperJackpot", "pbSkillShot", "pbSuperSkill", "pbCombo", "pbBallSaved", "pbKickback", "pbKickbackR", "pbBonusXUp", "pbLocked", "pbBallN", "pbShootAgain", "pbTilt", "pbTiltWarning", "pbExtraBall", "pbMultiball", "pbOldCous", "pbNewCous", "pbOldCousShot", "pbNewCousShot", "pbBurpNow", "pbBatigol", "pbCrocoHit", "pbKidShooed", "pbMerguezGrabbed", "pbCrab", "pbLoop", "pbCoco", "pbCraterJackpot", "pbSiloLocked"]);
// What a mission counts to, for its line on the display (see missions.js goal())
const GOAL_TOTALS = { pbGoal0: 3, pbGoal1: 4, pbGoal2: 3, pbGoal3_0: 2, pbGoal3_1: 1, pbGoal4: 2, pbGoal5: 4, pbGoal6: 4, pbGoal7: 4, pbGoal8: 2, pbGoal9: 4, pbGoalWizard: 6, pbGoalWizardBoss: 3 };
const PULL_S = 0.9;
const WHEEK_GAP_S = 1.5;
const NUDGE_SPEED = 4.5;
const MAX_DT = 0.1;
// A finger that moves up this far (px) this fast (ms) nudges the table
const SWIPE_PX = 45;
const SWIPE_MS = 350;
// The HUD pieces that fade while a ball rolls under them
const COVER_MARGIN = 34;
const COVER_EVERY_S = 0.08;
// The kids round the Fiat (the raid targets): generic faces drawn here, never
// anyone of the cast and never named
const KID_SKINS = ["#8a5a3c", "#c68b59", "#5c3a24"];
const KID_CAPS = ["#fe9339", "#ff4f9a", "#1fc8d8"];
function kidUrl(i) {
  const skin = KID_SKINS[i % KID_SKINS.length];
  const cap = KID_CAPS[i % KID_CAPS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="56" r="34" fill="${skin}"/><path d="M16 50 Q50 4 84 50 Z" fill="${cap}"/><rect x="46" y="43" width="46" height="9" rx="4.5" fill="${cap}"/><circle cx="38" cy="60" r="5" fill="#1b1b1b"/><circle cx="62" cy="60" r="5" fill="#1b1b1b"/><path d="M36 75 Q50 88 64 75" stroke="#1b1b1b" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
// Eul' cyclone (the flow disc) carries Mamar; Romain blocks the way out of the Silo
const FLOW_FACE = "mamar";
const BOSS_FACE = "romain";
// Who says a chat line; the lines not listed go round the gang
const CHAT_SPEAKERS = {
  pbRaid: "panda",
  pbBagnoleStart: "panda",
  pbSalesManagerNo: "romain",
  pbSiloCry: "romain",
  pbChaseStart: "romain",
  pbRomainJealous: "romain",
  pbSiloStart: "romain",
  pbConcertStart: "cous",
  pbOldNewStart: "cous",
  pbDiveStart: "greg",
  pbMoliereStart: "violaine",
  pbMamarStart: "mamar",
  pbFauveStart: "aline",
  pbAlineRaclette: "aline",
  pbBabarStart: "babar",
  pbCheer0: "panda",
  pbCheer1: "cous",
  pbCheer2: "mamar",
  pbCheer3: "babar",
  pbCheer4: "victor",
  pbCheer5: "greg",
  pbCheer6: "aline",
  pbCheer7: "violaine"
};
// The gang in turn (the "Cheh !" of a lost ball); Violaine speaks standard French, the Cheh lines are patois
const GANG = ["cous", "romain", "mamar", "babar", "victor", "greg", "aline", "eugenie"];
const CAST_NAMES = { eugenie: "Eugénie" };

const KEYS = {
  left: ["ArrowLeft", "KeyA", "KeyQ", "ShiftLeft"],
  right: ["ArrowRight", "KeyD", "ShiftRight"],
  plunger: ["Space", "ArrowDown", "KeyS", "Enter"],
  nudge: ["ArrowUp", "KeyW", "KeyZ"]
};

const CSS = `
.fl-root { position: relative; overflow: hidden; background: #061a33; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
.fl-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.fl-touch { position: absolute; inset: 0; touch-action: none; }
.fl-hud { position: absolute; inset: 0; pointer-events: none; }
.fl-under { opacity: 0.12 !important; transition: opacity 0.12s; }
.fl-close { position: absolute; top: 8px; right: 8px; width: 34px; height: 34px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.7); background: rgba(0,0,0,0.45); color: #fff; font-size: 20px; line-height: 28px; text-align: center; cursor: pointer; pointer-events: auto; padding: 0; z-index: 3; }
.fl-root .gr-dmd { position: absolute; left: 50%; top: 8px; transform: translateX(-50%); width: min(calc(100% - 64px), 460px); display: flex; justify-content: center; transition: opacity 0.12s; }
.fl-root .gr-dmd-screen { width: 100%; height: auto; aspect-ratio: 4 / 1; background: #0b0502; border: 3px solid #2b2b33; border-radius: 6px; box-shadow: 0 0 0 2px #0b0b0f, 0 6px 18px rgba(0,0,0,0.5), inset 0 0 18px rgba(255,120,30,0.15); }
.fl-toasts { position: absolute; left: 50%; top: 22%; transform: translateX(-50%); width: min(92%, 440px); display: flex; flex-direction: column; gap: 6px; align-items: center; }
.fl-toast { background: rgba(3,45,96,0.88); color: #fff; border-radius: 10px; padding: 6px 12px; font-size: 14px; font-weight: 700; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); animation: fl-in 0.18s ease-out; }
.fl-toast.is-bad { background: rgba(186,5,23,0.9); }
.fl-chat { position: absolute; left: 10px; right: 10px; top: calc(min(calc(100% - 64px), 460px) / 4 + 22px); display: flex; gap: 8px; align-items: flex-start; }
.fl-chat[hidden], .fl-select[hidden], .fl-eob[hidden], .fl-tip[hidden] { display: none; }
.fl-chat img { width: 44px; height: 44px; border-radius: 50%; background: #fff; flex: none; border: 2px solid #fff; }
.fl-chat p { margin: 0; background: #fff; color: #181818; border-radius: 12px; padding: 7px 10px; font-size: 13px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); }
.fl-chat b { display: block; font-size: 11px; color: #032d60; }
.fl-tip { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); width: min(94%, 460px); background: rgba(0,0,0,0.62); color: #fff; border-radius: 8px; padding: 5px 10px; font-size: 12px; text-align: center; }
.fl-goal { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); width: min(94%, 460px); color: #ffd27a; font-size: 12px; font-weight: 700; text-align: center; text-shadow: 0 1px 3px #000; }
.fl-tip:not([hidden]) ~ .fl-goal { display: none; }
.fl-select { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%); background: rgba(3,45,96,0.92); color: #fff; border-radius: 12px; padding: 12px 18px; text-align: center; max-width: 86%; }
.fl-select strong { display: block; font-size: 20px; margin: 4px 0; }
.fl-select span { font-size: 13px; opacity: 0.85; }
.fl-eob { position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.96); color: #181818; border-radius: 12px; padding: 12px 18px; min-width: 220px; box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
.fl-eob h3 { margin: 0 0 6px; font-size: 16px; }
.fl-eob ul { margin: 0; padding: 0; list-style: none; }
.fl-eob li { display: flex; justify-content: space-between; gap: 16px; font-size: 14px; }
.fl-eob .fl-total { border-top: 1px solid #c9c9c9; margin-top: 6px; padding-top: 4px; font-weight: 800; }
@keyframes fl-in { from { transform: translateY(6px); opacity: 0; } to { transform: none; opacity: 1; } }
`;

/** How long a line stays up so it can be read (ms), as Guinea Run's hud.readingMs. */
export function readingMs(text) {
  return Math.min(12000, 1600 + String(text || "").length * 60);
}

/** The picture of a friend of the cast. */
export function castUrl(id) {
  const base = (import.meta.env && import.meta.env.BASE_URL) || "./";
  return base + "cast/" + id + ".svg";
}

/** The flipper's own translator: its texts first, then the app's t, then the key. */
export function createTranslator(lang, appT) {
  const own = Object.assign({}, TEXTS[lang] || TEXTS.en, TABLE_TEXTS[lang] || {});
  const english = Object.assign({}, TEXTS.en, TABLE_TEXTS.en || {});
  return (key, vars) => {
    let text = own[key] !== undefined ? own[key] : english[key];
    if (text === undefined && appT) {
      const fromApp = appT(key, vars);
      if (fromApp && fromApp !== key) {
        return fromApp;
      }
    }
    if (text === undefined) {
      return key;
    }
    return text.replace(/\{\{(\w+)\}\}/g, (_, name) => (vars && vars[name] !== undefined ? String(vars[name]) : ""));
  };
}

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (parent) {
    parent.appendChild(node);
  }
  return node;
}

/**
 * Starts a game of Eul' Flipper inside options.root.
 * @param {object} options { root, lang, t, hero, hat, sound, onGameOver, onExit, auto }
 * @returns {Promise<{dispose: Function, rules: object, table: object}>}
 */
export async function startFlipper(options) {
  const { root } = options;
  const lang = options.lang === "fr" ? "fr" : "en";
  const t = createTranslator(lang, options.t);
  const onGameOver = options.onGameOver || (() => {});
  const onExit = options.onExit || (() => {});
  const random = options.random || Math.random;
  const fmt = (n) => Math.round(n).toLocaleString(lang === "fr" ? "fr-FR" : "en-US");
  const listeners = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  };

  /* ---------- DOM ---------- */

  const style = el("style");
  style.textContent = CSS;
  const shell = el("div", "fl-root");
  shell.style.position = "absolute";
  shell.style.inset = "0";
  shell.append(style);
  if (getComputedStyle(root).position === "static") {
    root.style.position = "relative";
  }
  root.appendChild(shell);
  const canvas = el("canvas", "fl-canvas", shell);
  const touch = el("div", "fl-touch", shell);
  const hud = el("div", "fl-hud", shell);
  const close = el("button", "fl-close", shell);
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", lang === "fr" ? "Quitter" : "Quit");
  const dmd = createDmd(hud);
  const toasts = el("div", "fl-toasts", hud);
  const chat = el("div", "fl-chat", hud);
  chat.hidden = true;
  const select = el("div", "fl-select", hud);
  select.hidden = true;
  const eob = el("div", "fl-eob", hud);
  eob.hidden = true;
  const tip = el("div", "fl-tip", hud);
  tip.hidden = true;
  const goalLine = el("div", "fl-goal", hud);
  const timers = new Set();
  const later = (fn, ms) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id) => {
    window.clearTimeout(id);
    timers.delete(id);
  };

  const ui = {
    toast(text, tone) {
      const node = el("div", "fl-toast" + (tone === "bad" ? " is-bad" : ""), toasts);
      node.textContent = text;
      while (toasts.children.length > 3) {
        toasts.firstChild.remove();
      }
      later(() => node.remove(), Math.min(4500, readingMs(text)));
    },
    chatTimer: 0,
    chat(speaker, text) {
      const who = typeof speaker === "string" ? { name: CAST_NAMES[speaker] || speaker[0].toUpperCase() + speaker.slice(1), faceUrl: castUrl(speaker) } : speaker;
      chat.replaceChildren();
      const img = el("img", "", chat);
      img.src = who.faceUrl;
      img.alt = "";
      const p = el("p", "", chat);
      el("b", "", p).textContent = who.name;
      p.append(text);
      chat.hidden = false;
      cancel(ui.chatTimer);
      ui.chatTimer = later(() => (chat.hidden = true), readingMs(text));
    },
    tipTimer: 0,
    tip(text, ms) {
      tip.textContent = text;
      tip.hidden = false;
      cancel(ui.tipTimer);
      ui.tipTimer = later(() => (tip.hidden = true), ms || readingMs(text));
    }
  };

  /* ---------- Renderer, scene, camera: the engine stand-in view.js draws into ---------- */

  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const tier = coarse ? 1 : 2;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = tier >= 2;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier >= 2 ? 1.75 : 1.5));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061a33);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 260);
  const hemi = new THREE.HemisphereLight(0xeaf6ff, 0xb3a58c, 1.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffeccc, 2.6);
  sun.position.set(4, 10, 6);
  sun.castShadow = tier >= 2;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
  scene.add(sun);
  scene.add(sun.target);
  const engine = {
    scene,
    hemi,
    sun,
    tier,
    aimSun(x, z) {
      sun.position.set(x + 4, 10, z + 6);
      sun.target.position.set(x, 0, z - 4);
    }
  };

  function resize() {
    const width = shell.clientWidth || 390;
    const height = shell.clientHeight || 844;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  if (observer) {
    observer.observe(shell);
  }

  /* ---------- The table ---------- */

  const synth = createSound();
  const soundOn = options.sound !== false;
  const sound = {
    get muted() {
      return !soundOn;
    },
    audio: () => (soundOn ? synth.audio() : null),
    play: (name) => soundOn && synth.play(name)
  };
  const table = buildTable();
  const physics = table.physics;
  const parts = table.parts;
  const view = createView(THREE, { t, root: scene, engine, camera, models: { get: () => null } }, table, {
    faceUrl: (i) => kidUrl(i),
    flowFaceUrl: castUrl(FLOW_FACE),
    salesManagerUrl: castUrl(BOSS_FACE)
  });
  const music = createMusic(sound, THEMES.pinball);
  const point = new THREE.Vector3();
  let clock = 0;
  let lastWheek = -10;
  let gangTurn = Math.floor(Math.random() * GANG.length);
  let autoplay = null;
  let ended = false;
  let disposed = false;
  const held = { left: false, right: false, plunger: false };
  let pulling = 0;

  const out = {
    say(kind, key, vars, tone) {
      const values = Object.assign({}, vars || {});
      if (values.points !== undefined) {
        values.points = fmt(values.points);
      }
      const text = t(key, values);
      if (DMD_WORDS[key]) {
        const small = values.points !== undefined && values.points !== "0" ? "+" + values.points : values.n !== undefined ? String(values.n) : "";
        dmd.flash(t(DMD_WORDS[key]), small, key === "pbTilt" ? 3 : 1.8);
        if (DMD_ONLY.has(key)) {
          return;
        }
      }
      if (kind === "toast") {
        ui.toast(text, tone || "good");
      } else if (kind === "coach") {
        ui.toast(text, "good");
      } else if (kind === "tip") {
        ui.tip(text, 0);
      } else if (kind === "chat") {
        if (key === "pbRaidAdmin") {
          ui.chat({ name: t("pbAdminName"), faceUrl: kidUrl(values.admin || 0) }, text);
        } else {
          ui.chat(CHAT_SPEAKERS[key] || GANG[gangTurn++ % GANG.length], text);
        }
      }
    },
    sound(name) {
      sound.play(name);
    },
    text: (key) => t(key),
    onBeat: () => Math.abs(music.beat - Math.round(music.beat)) < 0.22,
    event(name, data) {
      switch (name) {
        case "bumper":
          view.flashBumper(data);
          return;
        case "sling":
          view.flashSling(data);
          return;
        case "volcano":
          // "hit", "erupt", "crater", "close"
          view.volcano(data);
          if (data === "erupt") {
            view.show(2.4);
            if (view.shake) {
              view.shake();
            }
          }
          return;
        case "eruption":
          if (data) {
            view.show(3);
            music.setSection("chorus");
          }
          return;
        case "crab":
          view.crab(data);
          return;
        case "coco":
          view.coco();
          return;
        case "magnet":
          view.magnet(data);
          return;
        case "silo":
        case "divert":
        case "fiat":
        case "loop":
        case "cellar":
        case "bouncers":
        case "merguez":
        case "post":
          view.toy(name, data);
          return;
        case "flipperHit":
          if (data > 10 && clock - lastWheek > WHEEK_GAP_S) {
            lastWheek = clock;
            sound.play("wheek");
          }
          return;
        case "jackpot":
        case "note":
          view.show(data === true ? 3 : 1.8);
          return;
        case "multiball":
          if (data) {
            view.show(3);
            music.setSection("chorus");
          }
          return;
        case "mission":
          missionEvent(data);
          return;
        case "level":
          view.show(4);
          return;
        case "select":
          drawSelect(data);
          return;
        case "endOfBall":
          endOfBall(data);
          return;
        case "tilt":
          music.setSection("break");
          return;
        case "match":
          dmd.flash(t("dmdMatch"), String(data.drawn).padStart(2, "0"), 2.4);
          return;
        case "gameOver":
          gameOver(data);
          return;
        default:
          return;
      }
    }
  };

  const rules = createRules(table, out, random);

  /* ---------- The HUD of the table ---------- */

  let eobTimer = 0;
  let lastGoal = "";

  function drawPanel(dt) {
    const h = rules.hud();
    const status = h.hurry ? t("dmdHurry") + " " + fmt(h.hurry) : [t("pbBall", { n: h.ballNo }) + (h.extraBalls ? " +" + h.extraBalls : ""), t("pbLevel", { n: h.level }), h.bonusX > 1 ? "x" + h.bonusX : ""].filter(Boolean).join("  ");
    const mission = h.mission === null ? "" : h.mission === "wizard" ? t("pbNameWizard") : t("pbShort" + h.mission);
    let goal = "";
    if (h.mission !== null && h.goal) {
      const total = GOAL_TOTALS[h.goal[0]];
      goal = total ? h.goal[1].n + " / " + total : t("dmdGo");
    }
    const time = h.flips !== null && h.flips !== undefined ? h.flips + " " + t("dmdFlips") : h.timeLeft + "s";
    dmd.update(dt || 0, { score: fmt(h.score), status: status.toUpperCase(), mission: mission.toUpperCase(), time: time.toUpperCase(), goal });
    const text = h.goal ? t(h.goal[0], h.goal[1]) : "";
    if (text !== lastGoal) {
      lastGoal = text;
      goalLine.textContent = text;
    }
  }

  function drawSelect(id) {
    if (id < 0) {
      select.hidden = true;
      return;
    }
    select.replaceChildren();
    el("span", "", select).textContent = t("pbSelectTitle");
    el("strong", "", select).textContent = id + " · " + t("pbName" + id);
    el("span", "", select).textContent = t("w" + id + "_rule");
    select.hidden = false;
  }

  function missionEvent(data) {
    if (data.started) {
      if (data.id !== "wizard") {
        ui.tip(t("w" + data.id + "_rule"), readingMs(t("w" + data.id + "_rule")));
      } else {
        music.setSection("bridge");
      }
      return;
    }
    if (data.ok) {
      view.show(2.2);
      return;
    }
    if (data.id !== "wizard" && data.why === "pbTimeUp") {
      ui.tip(t("pbMissed", { rule: t("w" + data.id + "_rule") }), 0);
    }
  }

  function endOfBall(data) {
    eob.replaceChildren();
    el("h3", "", eob).textContent = t("pbEndOfBall");
    const list = el("ul", "", eob);
    for (const line of data.lines) {
      const li = el("li", "", list);
      el("span", "", li).textContent = t(line.key, { n: line.n });
      el("span", "", li).textContent = fmt(line.points);
    }
    const total = el("li", "fl-total", list);
    el("span", "", total).textContent = data.tilted ? t("pbTilted") : t("score");
    el("span", "", total).textContent = fmt(data.total);
    eob.hidden = false;
    sound.play("pbDrain");
    cancel(eobTimer);
    eobTimer = later(() => (eob.hidden = true), 2700);
  }

  function gameOver(summary) {
    if (ended) {
      return;
    }
    ended = true;
    releaseAll();
    sound.play("happy");
    try {
      onGameOver({ score: summary.score, summary });
    } catch (error) {
      console.error(error);
    }
  }

  /** What the lights play over the rules: the attract chase while the first launch waits, dark when tilted. */
  function mood() {
    const s = rules.state;
    return { attract: s.saveArmed && Boolean(physics.ballOnPlunger()), tilted: s.tilted, locks: s.mb ? 0 : s.locks };
  }

  /* ---------- The HUD over the table: what a ball passes under fades ---------- */

  let coverClock = 0;
  const ballsOnScreen = new Float64Array(16);
  const covers = [dmd && hud.querySelector(".gr-dmd"), toasts, chat, tip, goalLine].filter(Boolean);
  function uncover(dt) {
    coverClock += dt;
    if (coverClock < COVER_EVERY_S) {
      return;
    }
    coverClock = 0;
    const frame = shell.getBoundingClientRect();
    let count = 0;
    for (let i = 0; i < physics.balls.length && count < ballsOnScreen.length; i++) {
      if (view.ballPoint(i, point)) {
        point.project(camera);
        ballsOnScreen[count++] = frame.left + ((point.x + 1) / 2) * frame.width;
        ballsOnScreen[count++] = frame.top + ((1 - point.y) / 2) * frame.height;
      }
    }
    for (const node of covers) {
      const box = node.getBoundingClientRect();
      const shows = box.width > 0 && box.height > 0;
      let under = false;
      for (let k = 0; k < count && !under && shows; k += 2) {
        const x = ballsOnScreen[k];
        const y = ballsOnScreen[k + 1];
        under = x > box.left - COVER_MARGIN && x < box.right + COVER_MARGIN && y > box.top - COVER_MARGIN && y < box.bottom + COVER_MARGIN;
      }
      node.classList.toggle("fl-under", under);
    }
  }

  /* ---------- Controls ---------- */

  function flipper(side, down) {
    const which = side < 0 ? "left" : "right";
    if (held[which] === down) {
      return;
    }
    held[which] = down;
    const lower = side < 0 ? parts.flippers.left : parts.flippers.right;
    if (lower.enabled) {
      sound.play(down ? "pbFlipper" : "pbFlipperDown");
      if (down) {
        rules.flip(side);
      }
    }
    lower.held = down;
  }

  function plunger(down) {
    if (down) {
      if (!held.plunger && physics.ballOnPlunger()) {
        held.plunger = true;
        pulling = 0;
      }
      return;
    }
    if (held.plunger) {
      held.plunger = false;
      if (physics.releasePlunger()) {
        rules.launched();
        sound.play("pbKick");
      }
    }
  }

  /** The right flipper doubles as the plunger while the only ball waits on it. */
  function rightIsPlunger() {
    return physics.activeBalls() === 1 && Boolean(physics.ballOnPlunger());
  }

  function nudge() {
    const strength = rules.nudge();
    if (strength > 0) {
      physics.nudge((random() - 0.5) * NUDGE_SPEED, NUDGE_SPEED * strength);
      if (view.shake) {
        view.shake();
      }
    }
  }

  /** A button held or let go: left, right, plunger, nudge. */
  function hold(name, down) {
    if (ended || autoplay) {
      return;
    }
    if (name === "left") {
      flipper(-1, down);
    } else if (name === "right") {
      if (down && rightIsPlunger()) {
        plunger(true);
        return;
      }
      if (!down && held.plunger) {
        plunger(false);
        return;
      }
      flipper(1, down);
    } else if (name === "plunger") {
      plunger(down);
    } else if (name === "nudge" && down) {
      nudge();
    }
  }

  function releaseAll() {
    for (const name of ["left", "right"]) {
      if (held[name]) {
        flipper(name === "left" ? -1 : 1, false);
      }
    }
    held.plunger = false;
  }

  const keyDown = new Set();
  function keyName(code) {
    for (const name of Object.keys(KEYS)) {
      if (KEYS[name].includes(code)) {
        return name;
      }
    }
    return null;
  }
  on(window, "keydown", (e) => {
    const name = keyName(e.code);
    if (!name) {
      return;
    }
    e.preventDefault();
    if (keyDown.has(e.code)) {
      return;
    }
    keyDown.add(e.code);
    hold(name, true);
  });
  on(window, "keyup", (e) => {
    const name = keyName(e.code);
    if (!name) {
      return;
    }
    e.preventDefault();
    keyDown.delete(e.code);
    // Another key for the same button still down keeps it held
    if (![...keyDown].some((code) => keyName(code) === name)) {
      hold(name, false);
    }
  });
  on(window, "blur", () => {
    keyDown.clear();
    pointers.clear();
    releaseAll();
  });

  // Touch: the left and right halves of the screen are the flippers, several
  // fingers at once; a quick swipe up nudges the table
  const pointers = new Map();
  const sideDown = (side) => [...pointers.values()].some((p) => p.side === side);
  on(touch, "pointerdown", (e) => {
    e.preventDefault();
    const box = touch.getBoundingClientRect();
    const side = e.clientX - box.left < box.width / 2 ? "left" : "right";
    const already = sideDown(side);
    pointers.set(e.pointerId, { side, y: e.clientY, at: performance.now(), nudged: false });
    try {
      touch.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers cannot be captured
    }
    if (!already) {
      hold(side, true);
    }
  });
  on(touch, "pointermove", (e) => {
    const p = pointers.get(e.pointerId);
    if (p && !p.nudged && p.y - e.clientY > SWIPE_PX && performance.now() - p.at < SWIPE_MS) {
      p.nudged = true;
      hold("nudge", true);
    }
  });
  const lift = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) {
      return;
    }
    pointers.delete(e.pointerId);
    if (!sideDown(p.side)) {
      hold(p.side, false);
    }
  };
  on(touch, "pointerup", lift);
  on(touch, "pointercancel", lift);
  on(touch, "contextmenu", (e) => e.preventDefault());
  on(close, "click", (e) => {
    e.stopPropagation();
    onExit();
  });

  /* ---------- The loop ---------- */

  let frameId = 0;
  let last = performance.now();
  function frame(now) {
    frameId = window.requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_DT);
    last = now;
    if (document.hidden || dt <= 0) {
      return;
    }
    step(dt);
    renderer.render(scene, camera);
  }

  function step(dt) {
    if (ended) {
      view.update(dt, rules.lights, mood());
      return;
    }
    clock += dt;
    if (autoplay) {
      autoplay.step(dt, {
        press: (f) => {
          sound.play("pbFlipper");
          rules.flip(f.side);
        },
        release() {},
        launched: () => rules.launched()
      });
    }
    if (held.plunger) {
      pulling = Math.min(1, pulling + dt / PULL_S);
      physics.pullPlunger(pulling);
    }
    physics.freezeOutOfSight(view.sight);
    physics.advance(dt);
    physics.readEvents(rules.event);
    rules.update(dt);
    music.update(dt);
    view.update(dt, rules.lights, mood());
    uncover(dt);
    drawPanel(dt);
  }

  rules.newGame();
  if (options.auto) {
    autoplay = createAutoplay(table, random);
  }
  if (soundOn) {
    music.start();
  }
  view.update(0, rules.lights, mood());
  view.snapCamera();
  drawPanel();
  renderer.render(scene, camera);
  frameId = window.requestAnimationFrame(frame);

  return {
    /** The rules and table, for checks and the dev page. */
    rules,
    table,
    TABLE,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      window.cancelAnimationFrame(frameId);
      for (const off of listeners) {
        off();
      }
      for (const id of timers) {
        window.clearTimeout(id);
      }
      if (observer) {
        observer.disconnect();
      }
      music.dispose();
      synth.dispose();
      view.dispose();
      dmd.dispose();
      renderer.dispose();
      if (renderer.forceContextLoss) {
        renderer.forceContextLoss();
      }
      shell.remove();
    }
  };
}
