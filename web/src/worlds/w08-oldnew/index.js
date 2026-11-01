// World 8 - "Old Cous ou New Cous ?": a very fast, very silly swipe quiz.
// A card flies in with something Cous did; swipe left (or the left arrow) for
// OLD Cous, rock'n'roll and wild, right for NEW Cous, wise and cultured.
// Every card has its own shrinking timer, right answers build a streak
// multiplier, 3 mistakes end the show, the clock ends it after 60 s.
// Cous stands on a big stage and changes look; the gang heckles from the stands.

import { createQuiz, choiceFrom, MAX_MISTAKES, LOCK } from './rules.js';
import { cardSet } from './cards.js';

export const MODELS = ['office'];

export const TEXTS = {
  en: {
    howto: ['A card flies in: is it OLD Cous (rock\'n\'roll) or NEW Cous (wise and cultured)?', 'Swipe left or ← for OLD, swipe right or → for NEW (or tap 🤘 / 📖).', 'Be quick: streaks multiply points. 3 mistakes and the show is over!'],
    objective: 'Old Cous or New Cous? Answer before the bar runs out',
    kicker: 'Old Cous or New Cous?', kicker_panda: '🐼 Bonus: Old Panda or New Panda?',
    left: '⬅ OLD 🤘', right: '📖 NEW ➡',
    old_tag: 'OLD COUS 🤘', new_tag: 'NEW COUS 📖', old_panda: 'OLD PANDA, as always',
    go: 'SHOWTIME!', streak: 'STREAK x{n}!', timeout: 'Too slow!', healed: 'Mistake forgiven ❤', wrong: 'Wrong!',
    sign: 'OLD COUS · NEW COUS',
    hoho: 'Hoho!', lol: 'Looool', aie: 'Aïe aïe aïe aïe', love: 'We love you anyway!', awkward: 'Awkward!',
    stylish: 'Stylish', crapa: 'Le crapa!', bisous: 'Bisous!', spit: 'Ptooey!', busted: 'Hoho… busted.',
    panda_claim: 'New Panda, a reformed man!', cous_old: 'Rock\'n\'roll!', cous_new: 'Let\'s avoid the beauferies.',
    win: ['Cous approves: you know both of him.', 'Old or new, Cous loves you.'], lose: ['Three mistakes: Cous goes back to his museum.', 'Booed off stage. Hoho.'],
  },
  fr: {
    howto: ['Une carte arrive : c\'est OLD Cous (rock\'n\'roll) ou NEW Cous (sage et cultivé) ?', 'Swipe à gauche ou ← pour OLD, à droite ou → pour NEW (ou touche 🤘 / 📖).', 'Vite : les séries multiplient les points. 3 erreurs et le spectacle s\'arrête !'],
    objective: 'Old Cous ou New Cous ? Réponds avant la fin de la barre',
    kicker: 'Old Cous ou New Cous ?', kicker_panda: '🐼 Bonus : Old Panda ou New Panda ?',
    left: '⬅ OLD 🤘', right: '📖 NEW ➡',
    old_tag: 'OLD COUS 🤘', new_tag: 'NEW COUS 📖', old_panda: 'OLD PANDA, comme d\'hab',
    go: 'EN SCÈNE !', streak: 'SÉRIE x{n} !', timeout: 'Trop lent !', healed: 'Erreur pardonnée ❤', wrong: 'Raté !',
    sign: 'OLD COUS · NEW COUS',
    hoho: 'Hoho !', lol: 'Looool', aie: 'Aïe aïe aïe aïe', love: 'On t\'aime quand même !', awkward: 'Malaisant !',
    stylish: 'Stylé', crapa: 'Le crapa !', bisous: 'Bisous !', spit: 'Ptuih !', busted: 'Hoho… grillé.',
    panda_claim: 'New Panda, un repenti !', cous_old: 'Rock\'n\'roll !', cous_new: 'On évite les beauferies.',
    win: ['Cous valide : tu connais les deux.', 'Old ou New, Cous t\'aime.'], lose: ['Trois erreurs : Cous retourne au musée.', 'Hué hors de la scène. Hoho.'],
  },
};

const CSS = `
.w08-wrap { position: absolute; left: 0; right: 0; bottom: 124px; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
.w08-card { position: relative; width: min(460px, 88vw); background: #fffdf6; border: 4px solid var(--ink); border-radius: 22px; box-shadow: 0 6px 0 var(--ink); padding: 10px 18px 14px; text-align: center; will-change: transform; }
.w08-card.panda { background: #ffefc2; }
.w08-card.good { border-color: #1f9e5f; box-shadow: 0 6px 0 #156b41; }
.w08-card.bad { border-color: #e63946; box-shadow: 0 6px 0 #9d1c26; }
.w08-kicker { font-size: 14px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #2a9d8f; }
.w08-card.panda .w08-kicker { color: #e76f51; }
.w08-text { font-size: clamp(18px, 4.6vw, 26px); font-weight: 800; line-height: 1.15; min-height: 2.4em; display: flex; align-items: center; justify-content: center; margin: 6px 0 10px; }
.w08-timer { height: 12px; border: 2px solid var(--ink); border-radius: 999px; overflow: hidden; background: rgba(0, 0, 0, 0.08); }
.w08-timer i { display: block; height: 100%; width: 100%; }
.w08-stamp { position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%) rotate(-12deg); font-size: clamp(26px, 7vw, 40px); font-weight: 800; padding: 0 12px; border: 4px solid currentColor; border-radius: 12px; background: rgba(255, 255, 255, 0.85); opacity: 0; white-space: nowrap; }
.w08-labels { display: flex; justify-content: space-between; width: min(460px, 88vw); margin-top: 10px; font-weight: 800; font-size: 18px; color: #fff; -webkit-text-stroke: 0.6px var(--ink); text-shadow: 0 2px 0 var(--ink); }
.w08-labels span { transition: transform 0.08s; }
.w08-labels span.hot { transform: scale(1.3); color: #ffd84a; }
.w08-streak { position: absolute; top: 140px; right: 14px; font-weight: 800; font-size: 30px; color: #ffd84a; -webkit-text-stroke: 1.5px var(--ink); text-shadow: 0 3px 0 var(--ink); }
.w08-splat { position: absolute; inset: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(circle at 38% 42%, rgba(170, 225, 255, 0.75) 0 9%, transparent 10%),
    radial-gradient(circle at 46% 36%, rgba(170, 225, 255, 0.7) 0 4%, transparent 5%),
    radial-gradient(circle at 31% 52%, rgba(170, 225, 255, 0.7) 0 3%, transparent 4%),
    radial-gradient(circle at 44% 55%, rgba(170, 225, 255, 0.6) 0 2.5%, transparent 3.5%); }
`;

const AUDIENCE = [
  // id, x, z, bleacher row height
  ['panda', -3.9, 4.8, 0.3], ['romain', -5.0, 3.6, 0.3], ['mamar', -5.4, 5.9, 0.9], ['victor', -6.4, 4.6, 0.9],
  ['babar', 3.9, 4.8, 0.3], ['greg', 5.0, 3.6, 0.3], ['aline', 5.3, 5.9, 0.9], ['eugenie', 6.3, 4.6, 0.9], ['violaine', 6.6, 3.0, 0.9],
];

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx } = ctx;
  const cards = cardSet(ctx.locale ? ctx.locale() : 'en');
  const quiz = createQuiz({ cards, mode: ctx.mode, random: ctx.random });
  let time = 0;
  let ended = false;
  let shake = 0;
  let pending = null; // answer queued by a touch button
  let dragX = null;
  let persona = null; // 'old' | 'new' | null: Cous's current look
  let personaTimer = 0;
  let cousState = 'idle';
  let crowdState = 'idle';
  let crowdTimer = 0;
  let lastStreakBanner = 0;
  let bulbTimer = 0;
  let spit = null; // { mesh, t, from }
  let splat = 0;
  const camBase = new THREE.Vector3();

  ctx.setupSky({ top: '#3b1d6e', bottom: '#ff8fb1', fog: 0x5a2d82, fogNear: 30, fogFar: 80 });
  const sun = ctx.addLights(root);
  sun.position.set(4, 14, 10);

  // --- Stage ----------------------------------------------------------------------
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat('#3a2357'));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.6, 40), mat('#2a9d8f'));
  stage.position.y = 0.3;
  stage.receiveShadow = true;
  root.add(stage);
  const stageRim = new THREE.Mesh(new THREE.TorusGeometry(4.35, 0.12, 8, 48), mat('#ffd84a', { emissive: '#7a5a00' }));
  stageRim.rotation.x = Math.PI / 2;
  stageRim.position.y = 0.6;
  root.add(stageRim);
  // Two halves of the stage floor light up: red for OLD (left), teal for NEW (right).
  const halfOld = new THREE.Mesh(new THREE.CircleGeometry(4, 32, Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: '#ff3d6e', transparent: true, opacity: 0.25 }));
  const halfNew = new THREE.Mesh(new THREE.CircleGeometry(4, 32, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: '#33e0c8', transparent: true, opacity: 0.25 }));
  for (const h of [halfOld, halfNew]) { h.rotation.x = -Math.PI / 2; h.position.y = 0.62; root.add(h); }

  // Backdrop with the show's sign, curtains and a blinking bulb arch.
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024; signCanvas.height = 256;
  const sg = signCanvas.getContext('2d');
  const grad = sg.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#ff3d6e'); grad.addColorStop(0.5, '#ffd84a'); grad.addColorStop(1, '#33e0c8');
  sg.fillStyle = '#1d1420'; sg.fillRect(0, 0, 1024, 256);
  sg.fillStyle = grad;
  sg.font = 'bold 84px "Baloo 2", system-ui, sans-serif';
  sg.textAlign = 'center'; sg.textBaseline = 'middle';
  sg.fillText(ctx.t('sign'), 512, 136);
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(0, 7.2, -4.4);
  root.add(sign);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), mat('#5b2a86'));
  backdrop.position.set(0, 5, -4.6);
  root.add(backdrop);
  for (const s of [-1, 1]) {
    const curtain = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 10, 12, 1, true, 0, Math.PI), mat('#c1121f', { side: THREE.DoubleSide }));
    curtain.position.set(s * 6.2, 5, -4.2);
    curtain.rotation.y = s > 0 ? Math.PI : 0;
    root.add(curtain);
  }
  const bulbOn = new THREE.MeshBasicMaterial({ color: '#fff3a0' });
  const bulbOff = new THREE.MeshBasicMaterial({ color: '#8a6a2a' });
  const bulbGeo = new THREE.SphereGeometry(0.13, 8, 6);
  const bulbs = [];
  for (let i = 0; i <= 26; i++) {
    const a = Math.PI * (i / 26);
    const b = new THREE.Mesh(bulbGeo, bulbOn);
    b.position.set(Math.cos(a) * -5.4, 3.2 + Math.sin(a) * 5.4, -4.3);
    root.add(b);
    bulbs.push(b);
  }
  // Spotlight beams on Cous.
  const beams = [];
  for (const s of [-1, 1]) {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: s < 0 ? '#ff3d6e' : '#33e0c8', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    beam.position.set(s * 2.2, 5.1, 0.3);
    beam.rotation.z = s * -0.28;
    root.add(beam);
    beams.push(beam);
  }

  // --- Cous, scaled up, with his two looks ------------------------------------
  const cous = ctx.character('cous', { scale: 1.8 });
  cous.position.set(0, 0.6, 0);
  root.add(cous);
  const parts = cous.userData.parts;
  const oldKit = new THREE.Group();
  const newKit = new THREE.Group();
  parts.body.add(oldKit, newKit);
  // Old Cous: black leather jacket, red electric guitar, rock horns on both hands.
  const jacket = new THREE.Mesh(new THREE.CapsuleGeometry(0.345, 0.52, 4, 12), mat('#141218', { roughness: 0.35, metalness: 0.2 }));
  jacket.position.y = 1.06;
  jacket.scale.z = 1.04;
  const opening = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.02), mat('#1f7a4d'));
  opening.position.set(0, 1.1, 0.35);
  const guitar = new THREE.Group();
  const gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 18), mat('#e63946', { roughness: 0.3 }));
  gBody.rotation.x = Math.PI / 2;
  const gBody2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 18), mat('#e63946', { roughness: 0.3 }));
  gBody2.rotation.x = Math.PI / 2;
  gBody2.position.set(0.28, 0.12, 0);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.06), mat('#6b3e1f'));
  neck.position.set(0.68, 0.24, 0);
  neck.rotation.z = 0.3;
  guitar.add(gBody, gBody2, neck);
  guitar.position.set(-0.12, 0.9, 0.42);
  guitar.rotation.z = 0.35;
  oldKit.add(jacket, opening, guitar);
  const horns = [];
  for (const arm of [parts.armL, parts.armR]) {
    const h = new THREE.Group();
    for (const dx of [-0.05, 0.05]) {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 6), mat('#f4cbb0'));
      finger.position.set(dx, -0.74, 0);
      h.add(finger);
    }
    arm.add(h);
    horns.push(h);
  }
  // New Cous: beret, scarf and a book in hand.
  const beret = new THREE.Group();
  const beretTop = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.12, 20), mat('#7b1e3a'));
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6), mat('#7b1e3a'));
  stalk.position.y = 0.1;
  beret.add(beretTop, stalk);
  beret.position.set(0.05, 2.5, -0.05);
  beret.rotation.z = -0.25;
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 20), mat('#e9c46a'));
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.45;
  newKit.add(beret, scarf);
  const book = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.08), mat('#264653'));
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.085), mat('#fffaf0'));
  pages.position.x = 0.03;
  book.add(cover, pages);
  book.position.set(0, -0.62, 0.16);
  parts.armR.add(book);
  function setPersona(p) {
    persona = p;
    oldKit.visible = p === 'old';
    for (const h of horns) h.visible = p === 'old';
    newKit.visible = p === 'new';
    book.visible = p === 'new';
    halfOld.material.opacity = p === 'old' ? 0.6 : 0.25;
    halfNew.material.opacity = p === 'new' ? 0.6 : 0.25;
    beams[0].material.opacity = p === 'old' ? 0.32 : 0.14;
    beams[1].material.opacity = p === 'new' ? 0.32 : 0.14;
  }
  setPersona(null);

  // --- The gang in the stands -----------------------------------------------------
  const gang = {};
  for (const [id, x, z, h] of AUDIENCE) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, h, 1.2), mat(h > 0.5 ? '#6d3fa0' : '#8e5cc4'));
    bench.position.set(x, h / 2, z);
    root.add(bench);
    const c = ctx.character(id);
    c.position.set(x, h, z);
    c.rotation.y = Math.atan2(-x, 2 - z);
    root.add(c);
    gang[id] = c;
  }
  const spitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.9, roughness: 0.05 }));
  spitMesh.visible = false;
  root.add(spitMesh);

  // --- DOM: the card ------------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = CSS;
  const wrap = document.createElement('div');
  wrap.className = 'w08-wrap';
  wrap.innerHTML = `<div class="w08-card"><div class="w08-kicker"></div><div class="w08-text"></div><div class="w08-timer"><i></i></div><div class="w08-stamp"></div></div>
    <div class="w08-labels"><span class="l"></span><span class="r"></span></div>`;
  const streakEl = document.createElement('div');
  streakEl.className = 'w08-streak';
  const splatEl = document.createElement('div');
  splatEl.className = 'w08-splat';
  const cardEl = wrap.querySelector('.w08-card');
  const kickerEl = wrap.querySelector('.w08-kicker');
  const textEl = wrap.querySelector('.w08-text');
  const timerEl = wrap.querySelector('.w08-timer i');
  const stampEl = wrap.querySelector('.w08-stamp');
  const labelL = wrap.querySelector('.w08-labels .l');
  const labelR = wrap.querySelector('.w08-labels .r');
  // Card animation: out (fly to a side) then in (drop from above).
  const anim = { phase: 'in', t: 0, dir: 0 };

  function showCard() {
    const c = quiz.current();
    textEl.textContent = c.text;
    kickerEl.textContent = ctx.t(c.panda ? 'kicker_panda' : 'kicker');
    cardEl.classList.toggle('panda', c.panda);
    cardEl.classList.remove('good', 'bad');
    stampEl.style.opacity = '0';
    anim.phase = 'in';
    anim.t = 0;
    if (c.panda) {
      hud.say(gang.panda, ctx.t('panda_claim'), 1.6);
      gang.panda.userData.flash();
    }
  }

  function stamp(answer, panda) {
    stampEl.textContent = panda ? ctx.t('old_panda') : ctx.t(answer === 'old' ? 'old_tag' : 'new_tag');
    stampEl.style.color = answer === 'old' ? '#e63946' : '#1f8a7a';
    stampEl.style.opacity = '1';
  }

  function say(id, key, secs = 1.4) {
    hud.say(gang[id], ctx.t(key), secs);
  }

  function crowd(state, secs) {
    crowdState = state;
    crowdTimer = secs;
  }

  // --- Feedback -----------------------------------------------------------------------
  function onRight(res, dir) {
    sfx.coin();
    cardEl.classList.add('good');
    stamp(res.answer, res.panda);
    anim.phase = 'out'; anim.t = 0; anim.dir = dir;
    setPersona(res.answer);
    personaTimer = 1.6;
    cousState = res.answer === 'old' ? 'dance' : 'idle';
    hud.float(cous, `+${res.points}`, '#ffd84a', 5.2);
    fx.burst(new THREE.Vector3(dir * 1.2, 4.5, 0.5), 22, { color: res.answer === 'old' ? 0xff3d6e : 0x33e0c8 });
    crowd('cheer', 0.8);
    if (res.panda) {
      say('panda', 'busted', 1.5);
      sfx.hoho();
    } else if (res.streak % 3 === 0) {
      const r = ctx.random();
      if (r < 0.4) { say('panda', 'hoho'); sfx.hoho(); } else if (r < 0.75) say('romain', 'lol'); else hud.say(cous, ctx.t(res.answer === 'old' ? 'cous_old' : 'cous_new'), 1.4, 5.4);
    }
    if (res.multiplier > lastStreakBanner && res.multiplier > 1) {
      lastStreakBanner = res.multiplier;
      hud.banner(ctx.t('streak', { n: res.multiplier }), 1100, '#ffd84a');
      sfx.power();
      fx.burst(new THREE.Vector3(0, 6, 0), 60);
      const fan = ['victor', 'greg', 'eugenie', 'violaine'][res.multiplier % 4];
      if (fan === 'violaine') hud.say(gang.violaine, ctx.tShared('quote_violaine'), 1.6);
      else say(fan, { victor: 'stylish', greg: 'crapa', eugenie: 'bisous' }[fan], 1.6);
    }
    if (res.healed) {
      hud.banner(ctx.t('healed'), 1200, '#ff8fb1');
      say('aline', 'love', 1.6);
    }
  }

  function onWrong(answer, dir, timeout, panda) {
    sfx.hit();
    shake = 0.35;
    cardEl.classList.add('bad');
    stamp(answer, panda);
    anim.phase = 'out'; anim.t = 0; anim.dir = dir;
    setPersona(answer);
    personaTimer = 1.4;
    cousState = 'hit';
    lastStreakBanner = 0;
    hud.banner(ctx.t(timeout ? 'timeout' : 'wrong'), 900, '#ff4d6d');
    crowd('hit', 0.9);
    // Babar's spit gag: straight at the screen.
    if (!spit) {
      spitMesh.visible = true;
      spit = { t: 0, from: gang.babar.position.clone().setY(gang.babar.position.y + 2.2) };
      say('babar', 'spit', 1.2);
      sfx.whoosh();
    }
    const comment = ['mamar', 'aline', 'violaine', 'romain'][quiz.mistakes % 4];
    say(comment, { mamar: 'aie', aline: 'love', violaine: 'awkward', romain: 'lol' }[comment], 1.6);
  }

  // --- Lifecycle ----------------------------------------------------------------------
  function start() {
    hud.el.style.pointerEvents = 'none'; // let touches reach the canvas (swipes); buttons stay clickable
    document.head.appendChild(style);
    hud.el.appendChild(wrap);
    hud.el.appendChild(streakEl);
    hud.el.appendChild(splatEl);
    labelL.textContent = ctx.t('left');
    labelR.textContent = ctx.t('right');
    hud.buttons([
      { id: 'old', label: '🤘', side: 'left', onDown: () => { pending = 'old'; } },
      { id: 'new', label: '📖', side: 'right', onDown: () => { pending = 'new'; } },
    ]);
    hud.setObjective(ctx.t('objective'));
    hud.setHearts(MAX_MISTAKES, MAX_MISTAKES);
    hud.banner(ctx.t('go'), 1500, '#ffd84a');
    ctx.music(150, [0, 3, 5, 7, 10, 7, 5, 3]);
    sfx.whoosh();
    showCard();
    hud.say(cous, ctx.tShared('quote_cous'), 2, 5.4);
  }

  function readChoice() {
    let choice = pending;
    pending = null;
    for (const s of input.swipes) {
      const c = choiceFrom(s);
      if (c) { choice = c; break; }
    }
    if (!choice && input.taps.length) choice = input.taps[0].x < 0 ? 'old' : 'new';
    return choice;
  }

  function update(dt) {
    time += dt;
    if (!ended) {
      if (input.pressed('touch')) dragX = input.pointer.x;
      if (!input.pointer.down) dragX = null;
      const choice = readChoice();
      if (choice) {
        const res = quiz.answer(choice);
        if (!res.ignored) {
          const dir = choice === 'old' ? -1 : 1;
          dragX = null;
          if (res.correct) onRight(res, dir); else onWrong(res.answer, dir, false, res.panda);
        }
      }
      const ev = quiz.step(dt);
      if (ev.timeout) onWrong(ev.answer, 0, true, false);
      hud.setHearts(MAX_MISTAKES - quiz.mistakes, MAX_MISTAKES);
      hud.setScore(quiz.score, '★ ');
      hud.setProgress(quiz.timeLeft() / quiz.duration, `${Math.ceil(quiz.timeLeft())} s`);
      streakEl.textContent = quiz.multiplier() > 1 ? `x${quiz.multiplier()}` : '';
      if (quiz.over) {
        ended = true;
        if (quiz.won) {
          setPersona(quiz.correct % 2 ? 'old' : 'new');
          crowd('cheer', 99);
          fx.burst(new THREE.Vector3(0, 5, 0), 120);
          ctx.finish({ score: quiz.score, stars: quiz.stars(), line: ctx.t('win') });
        } else {
          crowd('hit', 99);
          ctx.fail({ score: quiz.score, line: ctx.t('lose') });
        }
      }
    }

    // Card DOM animation
    anim.t += dt;
    let tx = 0; let ty = 0; let rot = 0; let sc = 1;
    if (anim.phase === 'out') {
      const k = Math.min(1, anim.t / LOCK);
      if (anim.dir === 0) { ty = k * 60; sc = 1 - k * 0.5; } else { tx = anim.dir * k * k * 110; rot = anim.dir * k * 30; }
      if (!ended && anim.t >= LOCK) showCard();
    } else {
      const k = Math.min(1, anim.t / 0.18);
      ty = (1 - k) * -40;
      sc = 0.7 + 0.3 * k + Math.sin(k * Math.PI) * 0.06;
      if (dragX !== null) {
        const off = Math.max(-1, Math.min(1, (input.pointer.x - dragX) * 2.5));
        tx = off * 14; rot = off * 9;
      }
    }
    cardEl.style.transform = `translate(${tx}vw, ${ty}px) rotate(${rot}deg) scale(${sc})`;
    labelL.classList.toggle('hot', rot < -3 || input.held('left'));
    labelR.classList.toggle('hot', rot > 3 || input.held('right'));
    if (!ended && anim.phase === 'in') {
      const r = quiz.cardTime ? quiz.cardLeft / quiz.cardTime : 0;
      timerEl.style.width = `${Math.max(0, r) * 100}%`;
      timerEl.style.background = r > 0.5 ? '#2bb673' : r > 0.25 ? '#ffb703' : '#e63946';
    }

    // Cous
    personaTimer -= dt;
    if (personaTimer <= 0 && !ended && persona) { setPersona(null); cousState = 'idle'; }
    cous.userData.animate(dt, ended ? (quiz.won ? 'dance' : 'hit') : persona === 'old' ? 'cheer' : cousState);
    cous.rotation.y = Math.sin(time * 1.3) * 0.15;
    // Gang
    crowdTimer -= dt;
    if (crowdTimer <= 0) crowdState = quiz.streak >= 8 ? 'dance' : 'idle';
    for (const id in gang) {
      const st = id === 'babar' && crowdState === 'cheer' ? 'idle' : crowdState;
      gang[id].userData.animate(dt, st);
    }
    // Spit flying at the camera, then a splat on screen.
    if (spit) {
      spit.t += dt / 0.45;
      const k = Math.min(1, spit.t);
      spitMesh.position.lerpVectors(spit.from, camera.position, k);
      spitMesh.position.y += Math.sin(k * Math.PI) * 1.5;
      if (k >= 1) { spit = null; spitMesh.visible = false; splat = 1.3; sfx.land(); }
    }
    splat = Math.max(0, splat - dt);
    splatEl.style.opacity = String(Math.min(1, splat));
    // Lights
    bulbTimer += dt;
    const blink = Math.floor(bulbTimer * (quiz.streak >= 4 ? 8 : 3));
    for (let i = 0; i < bulbs.length; i++) bulbs[i].material = (i + blink) % 2 ? bulbOn : bulbOff;
    beams[0].rotation.z = 0.28 + Math.sin(time * 1.7) * 0.12;
    beams[1].rotation.z = -0.28 - Math.sin(time * 1.5) * 0.12;
    // Camera: pull back on portrait screens so the stands stay in view.
    const pull = Math.min(1.9, Math.max(1, 1.25 / Math.max(0.3, camera.aspect)));
    camBase.set(0, 4.4 + (pull - 1) * 2, 12.5 * pull);
    shake = Math.max(0, shake - dt);
    camera.position.copy(camBase);
    if (shake > 0) { camera.position.x += Math.sin(time * 70) * shake * 0.5; camera.position.y += Math.cos(time * 63) * shake * 0.4; }
    camera.lookAt(0, 1.9 + (pull - 1) * 1.2, 0);
  }

  function dispose() {
    style.remove();
    wrap.remove();
    streakEl.remove();
    splatEl.remove();
    signTex.dispose();
  }

  return { start, update, dispose, quiz };
}
