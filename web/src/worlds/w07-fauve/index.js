// World 7 - "Soirée fauve : les 40 ans de Cous": Cous's 40th birthday party.
// Guests shout costume orders; Panda grabs items from the wardrobe cards
// (tap, keys 1-6, or arrows + Space) before the order timer runs out. The
// items appear on Panda's 3D body. Rules live in rules.js (pure, tested).

import { createFauveGame, ITEMS, ITEM_IDS, WARDROBE_SIZE } from './rules.js';

export const MODELS = ['office', 'platform'];

export const TEXTS = {
  en: {
    howto: ['A guest shouts a costume: dress Panda before the timer runs out.', 'Tap the wardrobe cards, or keys 1-6, or arrows + Space.', 'Wrong item = everyone laughs and you lose time. Chain outfits for combos!'],
    objective: 'Dress Panda as the guests shout!',
    go: 'SOIRÉE FAUVE!',
    banner: 'HAPPY 40th COUS!',
    cous_line: 'Good grief, there is NO New Cous!',
    shout: ['Costume change!', 'Quick, put this on!', 'I want to see…', 'Panda! Dress up!'],
    theme_fauve: 'Soirée fauve!',
    theme_cous: 'Dress like Cous!',
    theme_lucha: 'Lucha libre!',
    theme_carnival: 'Martinique carnival!',
    theme_oldcous: 'Old Cous rock\'n\'roll!',
    theme_disco: 'Disco at le Molière!',
    theme_jungle: 'King of the jungle!',
    theme_total: 'TOTAL FAUVE!',
    slip: 'What is that underwear, Panda?!',
    wrong: ['Wrong one!', 'Not that!', 'Hoho… oops.'],
    lol: 'Looool',
    done: ['Hoho!', 'Hoho, the merguez!', 'Ta-daa!'],
    combo: 'COMBO x{n}!',
    too_slow: 'Too slow!',
    cake: 'Greg\'s cake! +1 ♥',
    lighter: 'Babar\'s lighter: the wardrobe is a mess!',
    ouch: 'Ow! Babar!',
    hurry: 'Hurry!',
    order_by: '{name} wants:',
    final: 'Last orders!',
    win_line: 'Cous blows out 40 candles. Panda keeps the leopard briefs "for next time".',
    lose_line: 'The guests gave up waiting. Panda ends up in the guinea-pig shirt, alone, by the merguez.',
    item_horns: 'Horned fur hat', item_cowboy: 'Cowboy hat', item_partyhat: 'Party hat',
    item_fishnet: 'Fishnet top', item_hawaii: 'Guinea-pig shirt',
    item_leopard: 'Leopard briefs', item_trunk: 'Elephant briefs', item_tutu: 'Tutu',
    item_luchador: 'Luchador mask', item_glitter: 'Glitter paint', item_sunglasses: 'Giant sunglasses',
    item_feathers: 'Carnival feathers', item_lei: 'Flower necklace', item_guitar: 'Guitar',
  },
  fr: {
    howto: ['Un invité crie un costume : habille Panda avant la fin du chrono.', 'Tape les cartes de la garde-robe, ou touches 1-6, ou flèches + Espace.', 'Mauvais habit = tout le monde rit et tu perds du temps. Enchaîne pour les combos !'],
    objective: 'Habille Panda comme les invités le crient !',
    go: 'SOIRÉE FAUVE !',
    banner: 'JOYEUX 40 ANS COUS !',
    cous_line: 'Mais bondieu, y a pas de New Cous !',
    shout: ['Changement de costume !', 'Vite, enfile ça !', 'Je veux voir…', 'Panda ! Déguise-toi !'],
    theme_fauve: 'Soirée fauve !',
    theme_cous: 'Habille-toi en Cous !',
    theme_lucha: 'Lucha libre !',
    theme_carnival: 'Carnaval de Martinique !',
    theme_oldcous: 'Old Cous rock\'n\'roll !',
    theme_disco: 'Disco au Molière !',
    theme_jungle: 'Roi de la jungle !',
    theme_total: 'FAUVE INTÉGRAL !',
    slip: 'Mais qu\'est-ce que c\'est que ce slip, Panda ?!',
    wrong: ['Pas celui-là !', 'Mais non !', 'Hoho… oups.'],
    lol: 'Looool',
    done: ['Hoho !', 'Hoho les merguez !', 'Et voilà !'],
    combo: 'COMBO x{n} !',
    too_slow: 'Trop lent !',
    cake: 'Le gâteau de Greg ! +1 ♥',
    lighter: 'Le briquet de Babar : la garde-robe est en vrac !',
    ouch: 'Aïe ! Babar !',
    hurry: 'Vite !',
    order_by: '{name} veut :',
    final: 'Dernières commandes !',
    win_line: 'Cous souffle 40 bougies. Panda garde le slip léopard « pour la prochaine fois ».',
    lose_line: 'Les invités ont lâché l\'affaire. Panda finit en chemise cochons d\'Inde, seul, près des merguez.',
    item_horns: 'Chapka à cornes', item_cowboy: 'Chapeau de cowboy', item_partyhat: 'Chapeau pointu',
    item_fishnet: 'Haut résille', item_hawaii: 'Chemise cochons d\'Inde',
    item_leopard: 'Slip léopard', item_trunk: 'Slip éléphant', item_tutu: 'Tutu',
    item_luchador: 'Masque de catcheur', item_glitter: 'Paillettes', item_sunglasses: 'Lunettes géantes',
    item_feathers: 'Plumes de carnaval', item_lei: 'Collier de fleurs', item_guitar: 'Guitare',
  },
};

const NAMES = { cous: 'Cous', romain: 'Romain', mamar: 'Mamar', victor: 'Victor', babar: 'Babar', greg: 'Greg', aline: 'Aline', eugenie: 'Eugénie', violaine: 'Violaine' };

const STYLE = `
.w07-order { position: absolute; top: 96px; left: 50%; transform: translateX(-50%); width: min(92vw, 520px); pointer-events: none;
  background: rgba(255, 253, 246, 0.94); border: 3px solid #1d1a2e; border-radius: 18px; padding: 6px 12px 8px; box-shadow: 0 4px 0 #1d1a2e;
  font-weight: 800; text-align: center; }
.w07-order.pop { animation: w07-pop 0.35s ease-out; }
.w07-order.shake { animation: w07-shake 0.3s; }
.w07-order .who { font-size: 15px; color: #6a4c93; }
.w07-order .theme { font-size: 20px; color: #e76f51; }
.w07-order .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin: 4px 0; }
.w07-order .chip { font-size: 15px; padding: 2px 8px; border-radius: 999px; border: 2px solid #1d1a2e; background: #fff; }
.w07-order .chip.ok { background: #8af27a; text-decoration: line-through; }
.w07-order .bar { height: 10px; border: 2px solid #1d1a2e; border-radius: 999px; overflow: hidden; background: #eee; }
.w07-order .bar i { display: block; height: 100%; background: #4caf50; }
.w07-wardrobe { position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); width: min(96vw, 760px);
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
@media (max-width: 640px) { .w07-wardrobe { grid-template-columns: repeat(3, 1fr); gap: 6px; } }
.w07-card { position: relative; border: 3px solid #1d1a2e; border-radius: 16px; background: #fffaf0; box-shadow: 0 4px 0 #1d1a2e;
  padding: 6px 4px 6px; min-height: 84px; font-weight: 800; font-size: 13px; line-height: 1.1; color: #1d1a2e; cursor: pointer;
  touch-action: manipulation; user-select: none; -webkit-user-select: none; transition: transform 0.08s; }
.w07-card .e { display: block; font-size: 34px; line-height: 1.15; }
.w07-card .k { position: absolute; top: 2px; left: 6px; font-size: 12px; opacity: 0.6; }
.w07-card.sel { outline: 4px solid #ffd84a; transform: translateY(-4px); }
.w07-card.ok { background: #c9f7bf; }
.w07-card.bad { background: #ff9aa2; animation: w07-shake 0.3s; }
.w07-card:active, .w07-card.down { transform: translateY(3px); box-shadow: 0 1px 0 #1d1a2e; }
@keyframes w07-pop { 0% { transform: translateX(-50%) scale(0.6); } 70% { transform: translateX(-50%) scale(1.08); } 100% { transform: translateX(-50%) scale(1); } }
@keyframes w07-shake { 0%, 100% { margin-left: 0; } 25% { margin-left: -8px; } 75% { margin-left: 8px; } }
`;

export function createWorld(ctx) {
  const { THREE, root, camera, hud, input, sfx, fx, models } = ctx;
  const game = createFauveGame({ mode: ctx.mode, random: ctx.random });
  const cfg = game.cfg;
  let time = 0;
  let ended = false;
  let selected = 0;
  let shake = 0;
  let zoom = 0;
  let lastFinal = false;
  let hurryTick = 0;
  let babarSneak = 0; // >0 while Babar is behind Panda
  let cardsDirty = true;
  let celebrate = false;
  const picks = [];
  const els = {};
  const tmpV = new THREE.Vector3();
  const aspect0 = camera.aspect || 1;
  const spread = aspect0 < 1 ? 0.62 : 1;

  ctx.setupSky({ top: '#3a1f5d', bottom: '#f08bb0', fogNear: 30, fogFar: 70 });
  ctx.addLights(root);
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // --- The party room -----------------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), mat('#b07a4a', { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 9), mat('#ffb4c8'));
  back.position.set(0, 4.5, -5);
  root.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), mat('#ffd3a8'));
    side.position.set(s * 7.5, 4.5, 2);
    side.rotation.y = -s * Math.PI / 2;
    root.add(side);
  }
  // Dance floor that flashes with the beat.
  const tileColors = ['#ff4d8d', '#ffd84a', '#4dd2ff', '#8af27a', '#b45cff'];
  const tiles = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), new THREE.MeshBasicMaterial({ color: tileColors[(i + j) % 5] }));
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(-2.5 + i, 0.01, -1.5 + j);
      root.add(tile);
      tiles.push(tile);
    }
  }
  // Panda's little stage and the clothes rack.
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.3, 32), mat('#1d1a2e', { roughness: 0.4 }));
  stage.position.y = 0.15;
  root.add(stage);
  const rack = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), mat('#cfcfd6', { metalness: 0.6 }));
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 2;
  rack.add(bar);
  for (const x of [-1.2, 1.2]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 8), mat('#cfcfd6', { metalness: 0.6 }));
    pole.position.set(x, 1, 0);
    rack.add(pole);
  }
  ['#e9b44c', '#1d1a2e', '#4dd2ff', '#ff4d8d', '#8af27a'].forEach((c, i) => {
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.06), mat(c));
    cloth.position.set(-0.9 + i * 0.45, 1.55, 0);
    cloth.rotation.y = 0.5;
    rack.add(cloth);
  });
  rack.position.set(0, 0, -1.8);
  root.add(rack);
  // Garlands of little flags.
  const flagGeo = new THREE.ConeGeometry(0.16, 0.34, 3);
  flagGeo.rotateX(Math.PI);
  for (const [z, y0] of [[-4.6, 3.8], [-1, 4.3]]) {
    for (let i = 0; i <= 28; i++) {
      const x = -7 + i * 0.5;
      const sag = 0.7 * (1 - Math.pow(x / 7, 2));
      const flag = new THREE.Mesh(flagGeo, mat(tileColors[i % 5]));
      flag.position.set(x, y0 - sag, z);
      root.add(flag);
    }
  }
  // Birthday banner.
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.9), new THREE.MeshBasicMaterial({
    transparent: true,
    map: canvasTex(768, 108, (g, w, h) => {
      g.fillStyle = '#ffd84a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e76f51'; g.fillRect(0, h - 14, w, 14);
      g.fillStyle = '#3a1f5d'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(ctx.t('banner'), w / 2, h / 2 - 4);
    }),
  }));
  bannerMesh.position.set(0, 4.6, -4.95);
  root.add(bannerMesh);
  // Giant golden "40" balloons.
  const gold = mat('#ffc933', { roughness: 0.25, metalness: 0.35, emissive: '#5a3c00' });
  const four = new THREE.Group();
  const stroke = (len, x, y, rot) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, len, 6, 12), gold);
    m.position.set(x, y, 0);
    m.rotation.z = rot;
    four.add(m);
  };
  stroke(1.5, 0.35, 0, 0);
  stroke(1.0, 0, 0.05, Math.PI / 2);
  stroke(1.0, -0.15, 0.45, -0.55);
  const zero = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.17, 12, 28), gold);
  zero.scale.y = 1.5;
  const fortyL = new THREE.Group();
  four.position.x = -0.6;
  zero.position.x = 0.6;
  fortyL.add(four, zero);
  const fortyR = fortyL.clone();
  fortyL.position.set(-4.6 * spread, 3, -4.2);
  fortyR.position.set(4.6 * spread, 3, -4.2);
  root.add(fortyL, fortyR);
  // Loose balloons with strings.
  const balloons = [];
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), mat(tileColors[i % 5], { roughness: 0.3 }));
    ball.scale.y = 1.2;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), mat('#ffffff'));
    string.position.y = -0.95;
    b.add(ball, string);
    b.position.set(-6.5 + (i / 13) * 13, 4.6 + (i % 3) * 0.4, -4.4 + (i % 2) * 0.6);
    b.userData.phase = i;
    root.add(b);
    balloons.push(b);
  }
  // Disco ball and coloured lights.
  const disco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshStandardMaterial({ color: '#e8e8f4', metalness: 0.4, roughness: 0.15, flatShading: true, emissive: '#444466' }));
  disco.position.set(0, 4.4, -0.5);
  root.add(disco);
  const discoLights = ['#ff4d8d', '#4dd2ff', '#ffd84a'].map((c) => {
    const l = new THREE.PointLight(c, 18, 0, 2);
    root.add(l);
    return l;
  });
  // Greg's cake on a table.
  const table = models.get('sideTable', { height: 0.9 }) || (() => {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.9), mat('#ffffff'));
    top.position.y = 0.85;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 8), mat('#ffffff'));
    foot.position.y = 0.42;
    g.add(top, foot);
    return g;
  })();
  table.position.set(3.1 * spread, 0, -2.6);
  root.add(table);
  const cake = new THREE.Group();
  [[0.5, '#fff1f5'], [0.38, '#ff9eb5'], [0.26, '#fff1f5']].forEach(([r, c], i) => {
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.22, 24), mat(c));
    tier.position.y = 0.11 + i * 0.22;
    cake.add(tier);
  });
  const flames = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), mat(tileColors[i % 5]));
    candle.position.set(Math.cos(a) * 0.16, 0.74, Math.sin(a) * 0.16);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: '#ffb000' }));
    flame.position.set(candle.position.x, 0.85, candle.position.z);
    cake.add(candle, flame);
    flames.push(flame);
  }
  const topper = new THREE.Sprite(new THREE.SpriteMaterial({
    map: canvasTex(128, 96, (g) => { g.fillStyle = '#ffc933'; g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.fillText('40', 64, 80); }),
  }));
  topper.scale.set(0.4, 0.3, 1);
  topper.position.y = 1.05;
  cake.add(topper);
  cake.position.set(3.1 * spread, 0.92, -2.6);
  root.add(cake);
  // The merguez barbecue.
  const bbq = new THREE.Group();
  const grill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.6), mat('#2a2a30', { metalness: 0.4 }));
  grill.position.y = 0.85;
  const coals = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.5), new THREE.MeshBasicMaterial({ color: '#ff5a1f' }));
  coals.position.y = 1.03;
  bbq.add(grill, coals);
  for (const [x, z] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), mat('#2a2a30'));
    leg.position.set(x, 0.35, z);
    bbq.add(leg);
  }
  for (let i = 0; i < 5; i++) {
    const merguez = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.4, 4, 8), mat('#a8452a', { roughness: 0.5 }));
    merguez.rotation.x = Math.PI / 2;
    merguez.position.set(-0.4 + i * 0.2, 1.1, 0);
    bbq.add(merguez);
  }
  bbq.position.set(-3.4 * spread, 0, -2.6);
  root.add(bbq);
  const smoke = [];
  for (let i = 0; i < 6; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#dddddd', transparent: true, opacity: 0.5, depthWrite: false }));
    puff.userData.t = i / 6;
    root.add(puff);
    smoke.push(puff);
  }

  // --- Cast -----------------------------------------------------------------------------
  const panda = ctx.character('panda');
  panda.position.set(0, 0.3, 0);
  root.add(panda);
  const guests = {};
  const spots = {
    mamar: [-3.4, -1.9], babar: [-2.3, -2.9], violaine: [-3.6, 0.6], romain: [-1.6, -3.2],
    cous: [0, -3.4], eugenie: [1.6, -3.2], greg: [3.6, -1.9], victor: [3.6, 0.6], aline: [2.3, -2.9],
  };
  for (const [id, [x, z]] of Object.entries(spots)) {
    const c = ctx.character(id);
    c.position.set(x * spread, 0, z);
    c.lookAt(0, 0, 1.5);
    c.userData.home = c.position.clone();
    root.add(c);
    guests[id] = c;
  }
  // Cous the birthday boy wears a crown.
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.22, 8, 1, true), new THREE.MeshStandardMaterial({ color: '#ffc933', metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide }));
  crown.position.set(0.04, 2.62, 0);
  guests.cous.userData.parts.body.add(crown);
  // Babar's lighter.
  const lighter = new THREE.Group();
  const lBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.05), mat('#e63946'));
  const lFlame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), new THREE.MeshBasicMaterial({ color: '#ffb000' }));
  lFlame.position.y = 0.16;
  lighter.add(lBody, lFlame);
  lighter.position.set(0, -0.7, 0.1);
  lighter.visible = false;
  guests.babar.userData.parts.armR.add(lighter);

  // --- Costume pieces on Panda ------------------------------------------------------------
  const body = panda.userData.parts.body;
  const pieces = {};
  function spriteFace(w, h, draw, sw, sh, y) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(w, h, draw), transparent: true }));
    sp.scale.set(sw, sh, 1);
    sp.position.set(0.065, y, 0.34);
    sp.renderOrder = 2;
    return sp;
  }
  function leopardTex() {
    return canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = '#f0b43c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const x = (i * 37) % w; const y = (i * 23) % h;
        g.fillStyle = '#5a3412'; g.beginPath(); g.ellipse(x, y, 7, 5, i, 0, 7); g.fill();
        g.fillStyle = '#c47a1e'; g.beginPath(); g.ellipse(x, y, 3, 2, i, 0, 7); g.fill();
      }
    });
  }
  function build() {
    // Hats
    const horns = new THREE.Group();
    const fur = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#7a4a2a', { roughness: 1 }));
    fur.scale.y = 0.7;
    horns.add(fur);
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 10), mat('#f4ead2'));
      horn.position.set(s * 0.36, 0.22, 0);
      horn.rotation.z = -s * 0.9;
      horns.add(horn);
    }
    horns.position.set(0.04, 2.24, 0);
    const cowboy = new THREE.Group();
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 24), mat('#a86a32'));
    const crownC = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.33, 0.34, 16), mat('#a86a32'));
    crownC.position.y = 0.18;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.07, 16), mat('#3a2010'));
    band.position.y = 0.05;
    cowboy.add(brim, crownC, band);
    cowboy.position.set(0.04, 2.3, 0);
    cowboy.rotation.z = 0.12;
    const partyhat = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 16), new THREE.MeshStandardMaterial({
      map: canvasTex(64, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ff4d8d' : '#ffd84a'; g.fillRect(0, i * 8, 64, 8); } }),
    }));
    cone.position.y = 0.3;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#4dd2ff'));
    pom.position.y = 0.62;
    partyhat.add(cone, pom);
    partyhat.position.set(0.12, 2.28, 0);
    partyhat.rotation.z = -0.2;
    // Tops
    const fishnet = new THREE.Mesh(new THREE.CapsuleGeometry(0.335, 0.45, 4, 16), new THREE.MeshBasicMaterial({ color: '#111111', wireframe: true }));
    fishnet.position.y = 0.95;
    const hawaii = new THREE.Mesh(new THREE.CapsuleGeometry(0.335, 0.45, 4, 16), new THREE.MeshStandardMaterial({
      roughness: 0.8,
      map: canvasTex(128, 128, (g, w, h) => {
        g.fillStyle = '#2f7fd1'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 10; i++) {
          const x = (i * 41) % w; const y = (i * 29) % h;
          if (i % 2) {
            g.fillStyle = '#ff8a3d';
            for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.26) * 6, y + Math.sin(k * 1.26) * 6, 5, 3, k * 1.26, 0, 7); g.fill(); }
          } else {
            g.fillStyle = '#c98a4b'; g.beginPath(); g.ellipse(x, y, 11, 7, 0, 0, 7); g.fill();
            g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + 3, y - 1, 5, 4, 0, 0, 7); g.fill();
            g.fillStyle = '#111'; g.beginPath(); g.arc(x + 8, y - 2, 1.5, 0, 7); g.fill();
          }
        }
      }),
    }));
    hawaii.position.y = 0.95;
    // Bottoms (silly briefs over the trousers)
    const leopard = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.26, 20), new THREE.MeshStandardMaterial({ map: leopardTex(), roughness: 0.8 }));
    leopard.position.y = 0.6;
    const trunk = new THREE.Group();
    const grey = mat('#9aa3ad');
    const pants = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.26, 20), grey);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), grey);
    face.position.set(0, 0.02, 0.32);
    const nose = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), grey);
    nose.position.set(0, -0.12, 0.42);
    nose.rotation.x = 0.5;
    trunk.add(pants, face, nose);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), new THREE.MeshStandardMaterial({ color: '#b8c0c8', side: THREE.DoubleSide }));
      ear.position.set(s * 0.17, 0.05, 0.3);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat('#111'));
      eye.position.set(s * 0.06, 0.08, 0.44);
      trunk.add(ear, eye);
    }
    trunk.position.y = 0.6;
    const tutu = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.62, 0.2, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#ff9ed2', side: THREE.DoubleSide, roughness: 0.9 }));
    tutu.position.y = 0.62;
    // Face (sprites in front of the caricature face)
    const luchador = spriteFace(256, 300, (g, w, h) => {
      g.fillStyle = '#d62839'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, 7); g.fill();
      g.strokeStyle = '#ffd84a'; g.lineWidth = 10;
      g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2, 80); g.stroke();
      g.fillStyle = '#1d3fbf';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 55, 135, 48, 30, s * 0.3, 0, 7); g.fill(); }
      g.fillStyle = '#ffffff';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 55, 135, 30, 17, s * 0.3, 0, 7); g.fill(); }
      g.fillStyle = '#f0c3a3'; g.beginPath(); g.ellipse(w / 2, 225, 40, 24, 0, 0, 7); g.fill();
      g.strokeStyle = '#ffd84a'; g.lineWidth = 6; g.beginPath(); g.ellipse(w / 2, 225, 44, 28, 0, 0, 7); g.stroke();
    }, 0.66, 0.78, 1.83);
    const glitter = spriteFace(256, 256, (g, w) => {
      const cols = ['#ff4d8d', '#ffd84a', '#4dd2ff', '#b45cff', '#ffffff'];
      for (let i = 0; i < 70; i++) {
        const a = i * 2.4; const r = 30 + (i * 13) % 90;
        g.fillStyle = cols[i % 5];
        g.beginPath(); g.arc(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r * 0.8, 3 + (i % 4), 0, 7); g.fill();
      }
    }, 0.72, 0.72, 1.86);
    const sunglasses = spriteFace(320, 128, (g) => {
      g.fillStyle = '#111';
      for (const x of [80, 240]) { g.beginPath(); g.ellipse(x, 64, 72, 54, 0, 0, 7); g.fill(); }
      g.fillRect(140, 46, 40, 14);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      for (const x of [60, 220]) { g.beginPath(); g.ellipse(x, 44, 22, 12, -0.5, 0, 7); g.fill(); }
    }, 0.92, 0.37, 1.9);
    // Accessories
    const feathers = new THREE.Group();
    const featherGeo = new THREE.SphereGeometry(0.12, 10, 8);
    featherGeo.translate(0, 0.12, 0);
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Mesh(featherGeo, mat(tileColors[i % 5], { emissive: tileColors[i % 5], emissiveIntensity: 0.2 }));
      f.scale.set(1, 6, 0.3);
      f.rotation.z = -1.2 + (i / 8) * 2.4;
      feathers.add(f);
    }
    feathers.position.set(0, 1.15, -0.35);
    const lei = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(['#ff4d8d', '#ffd84a', '#ffffff'][i % 3]));
      fl.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
      lei.add(fl);
    }
    lei.position.set(0, 1.38, 0.02);
    lei.rotation.x = 0.35;
    const guitar = new THREE.Group();
    const red = mat('#d62839', { roughness: 0.35 });
    const g1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), red);
    g1.scale.z = 0.35;
    const g2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), red);
    g2.scale.z = 0.35;
    g2.position.y = 0.26;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.04), mat('#5a3412'));
    neck.position.y = 0.7;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), mat('#111'));
    hole.position.set(0, 0.1, 0.08);
    guitar.add(g1, g2, neck, hole);
    guitar.position.set(0.05, 0.85, 0.42);
    guitar.rotation.z = 0.9;
    Object.assign(pieces, { horns, cowboy, partyhat, fishnet, hawaii, leopard, trunk, tutu, luchador, glitter, sunglasses, feathers, lei, guitar });
    for (const id of ITEM_IDS) {
      pieces[id].visible = false;
      body.add(pieces[id]);
    }
  }
  build();
  function showOutfit() {
    for (const id of ITEM_IDS) pieces[id].visible = game.outfit[ITEMS[id].slot] === id;
  }

  // --- HUD: order panel and wardrobe cards ---------------------------------------------------
  function itemName(id) { return ctx.t(`item_${id}`); }
  function renderOrder(pop) {
    const o = game.order;
    if (!o) { els.order.style.display = 'none'; return; }
    els.order.style.display = 'block';
    els.who.textContent = ctx.t('order_by', { name: NAMES[o.guest] });
    els.theme.textContent = o.theme ? ctx.t(`theme_${o.theme}`) : '';
    els.theme.style.display = o.theme ? 'block' : 'none';
    els.chips.innerHTML = o.items.map((id) => `<span class="chip ${game.wearing(id) ? 'ok' : ''}">${ITEMS[id].emoji} ${itemName(id)}</span>`).join('');
    if (pop) { els.order.classList.remove('pop'); void els.order.offsetWidth; els.order.classList.add('pop'); }
  }
  function renderCards() {
    const o = game.order;
    els.cards.forEach((card, i) => {
      const id = game.wardrobe[i];
      card.querySelector('.e').textContent = id ? ITEMS[id].emoji : '';
      card.querySelector('.n').textContent = id ? itemName(id) : '';
      card.classList.toggle('sel', i === selected);
      card.classList.toggle('ok', !!(id && o && o.items.includes(id) && game.wearing(id)));
    });
  }
  function flashCard(i, cls) {
    const card = els.cards[i];
    if (!card) return;
    card.classList.remove(cls);
    void card.offsetWidth;
    card.classList.add(cls);
    setTimeout(() => card.classList.remove(cls), 350);
  }
  function onKey(e) {
    const m = /^(Digit|Numpad)([1-6])$/.exec(e.code);
    if (!m) return;
    e.preventDefault();
    picks.push(Number(m[2]) - 1);
  }

  // --- Reactions --------------------------------------------------------------------------------
  function guestSay(id, text, secs = 1.8) { hud.say(guests[id], text, secs); }
  function resolvePick(i) {
    selected = i;
    cardsDirty = true;
    const res = game.pick(i);
    if (res.type === 'idle') return;
    showOutfit();
    const pos = panda.position;
    if (res.type === 'already') { sfx.click(); return; }
    if (res.type === 'wrong') {
      sfx.hit();
      sfx.hoho();
      shake = 0.35;
      panda.userData.flash();
      flashCard(i, 'bad');
      els.order.classList.remove('shake'); void els.order.offsetWidth; els.order.classList.add('shake');
      hud.float(panda, `−${cfg.wrongPenalty} s`, '#ff4d6d', 2.6);
      if (ITEMS[res.item].slot === 'bottom') guestSay('eugenie', ctx.t('slip'), 2.2);
      else guestSay(ctx.random() < 0.5 ? 'romain' : 'violaine', ctx.random() < 0.5 ? ctx.t('lol') : ctx.tShared('quote_violaine'), 1.6);
      hud.say(panda, ctx.t('wrong'), 1.2);
      for (const g of Object.values(guests)) g.userData.laugh = 0.8;
      renderOrder(false);
      return;
    }
    // correct or complete
    sfx.coin();
    flashCard(i, 'ok');
    fx.burst(tmpV.set(pos.x, 1.6, pos.z + 0.3), 14, { speed: 3, up: 2 });
    if (res.type === 'complete') {
      const o = game.order;
      sfx.power();
      zoom = 1;
      celebrate = true;
      fx.burst(tmpV.set(pos.x, 2.2, pos.z), 70, { speed: 7 });
      hud.float(panda, `+${res.points}`, '#ffd84a', 2.8);
      hud.say(panda, ctx.t('done'), 1.4);
      if (game.combo >= 2) hud.banner(ctx.t('combo', { n: game.combo }), 1000, '#ff4d8d');
      guestSay(o.guest, ctx.tShared(`quote_${o.guest}`), 1.6);
      if (game.combo >= 3 && ctx.random() < 0.5) guestSay('victor', ctx.tShared('quote_victor'), 1.4);
      else if (ctx.random() < 0.4) guestSay('mamar', ctx.tShared('quote_mamar'), 1.4);
      if (o.cake) {
        guestSay('greg', ctx.t('cake'), 2);
        hud.setHearts(game.hearts, cfg.hearts);
        fx.burst(cake.position.clone().setY(1.6), 40, { color: 0xff9eb5 });
      }
      for (const g of Object.values(guests)) g.userData.party = 1.2;
    }
    renderOrder(false);
  }

  // --- Lifecycle --------------------------------------------------------------------------------
  function start() {
    els.style = document.createElement('style');
    els.style.textContent = STYLE;
    document.head.appendChild(els.style);
    els.order = document.createElement('div');
    els.order.className = 'w07-order';
    els.order.innerHTML = '<div class="who"></div><div class="theme"></div><div class="chips"></div><div class="bar"><i></i></div>';
    els.who = els.order.querySelector('.who');
    els.theme = els.order.querySelector('.theme');
    els.chips = els.order.querySelector('.chips');
    els.bar = els.order.querySelector('.bar i');
    els.order.style.display = 'none';
    hud.el.appendChild(els.order);
    els.wardrobe = document.createElement('div');
    els.wardrobe.className = 'w07-wardrobe';
    els.cards = [];
    for (let i = 0; i < WARDROBE_SIZE; i++) {
      const card = document.createElement('button');
      card.className = 'w07-card';
      card.innerHTML = `<span class="k">${i + 1}</span><span class="e"></span><span class="n"></span>`;
      card.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); picks.push(i); });
      els.wardrobe.appendChild(card);
      els.cards.push(card);
    }
    hud.el.appendChild(els.wardrobe);
    window.addEventListener('keydown', onKey);
    ctx.music(124, [0, 4, 7, 11, 12, 11, 7, 4]);
    hud.setObjective(ctx.t('objective'));
    hud.setHearts(game.hearts, cfg.hearts);
    hud.banner(ctx.t('go'), 1800, '#ffd84a');
    guestSay('cous', ctx.t('cous_line'), 2.6);
    setTimeout(() => { if (!ended) guestSay('greg', ctx.tShared('quote_greg'), 1.8); }, 1200);
    renderCards();
    sfx.whoosh();
  }

  function update(dt) {
    time += dt;
    shake = Math.max(0, shake - dt * 1.5);
    zoom = Math.max(0, zoom - dt * 1.6);
    animateRoom(dt);
    if (ended) {
      panda.userData.animate(dt, game.won ? 'dance' : 'sit');
      for (const g of Object.values(guests)) g.userData.animate(dt, game.won ? 'dance' : 'idle');
      placeCamera(dt);
      return;
    }

    // Keyboard selection (arrows + Space) and picks
    for (const s of input.swipes) {
      if (s === 'left') selected = (selected + WARDROBE_SIZE - 1) % WARDROBE_SIZE;
      if (s === 'right') selected = (selected + 1) % WARDROBE_SIZE;
      if (s === 'up' || s === 'down') selected = (selected + 3) % WARDROBE_SIZE;
      cardsDirty = true;
    }
    if (input.pressed('action')) picks.push(selected);
    while (picks.length) resolvePick(picks.shift());

    const ev = game.step(dt);
    const o = game.order;
    if (ev.order) {
      cardsDirty = true;
      celebrate = false;
      showOutfit();
      sfx.whoosh();
      fx.burst(tmpV.set(0, 1.2, 0.3), 24, { color: 0xffffff, speed: 4, up: 2 });
      const shout = o.theme ? ctx.t(`theme_${o.theme}`) : ctx.t('shout');
      guestSay(o.guest, `${shout} ${o.items.map((id) => ITEMS[id].emoji).join(' ')}`, 2.2);
      guests[o.guest].userData.party = 0.8;
      renderOrder(true);
    }
    if (ev.timeout) {
      celebrate = false;
      sfx.lose();
      shake = 0.5;
      hud.setHearts(game.hearts, cfg.hearts);
      hud.banner(ctx.t('too_slow'), 1100, '#ff4d6d');
      guestSay('aline', ctx.tShared('quote_aline'), 1.8);
      hud.say(panda, ctx.tShared('quote_panda'), 1.4);
    }
    if (ev.babar) {
      sfx.hit();
      panda.userData.flash();
      shake = 0.4;
      hud.banner(ctx.t('lighter'), 1500, '#ff9f1c');
      hud.say(panda, ctx.t('ouch'), 1.3);
      fx.burst(tmpV.set(0.3, 1.6, -0.3), 20, { color: 0xffb000, speed: 2, up: 3 });
      selected = 0;
      cardsDirty = true;
    }
    // Babar sneaks up behind Panda before the lighter tap, then strolls back.
    const babar = guests.babar;
    if (game.phase === 'order' && game.babarTimer < 1.2) babarSneak = 1.6;
    babarSneak = Math.max(0, babarSneak - dt);
    const goal = babarSneak > 0 ? tmpV.set(0.55, 0.3, -0.55) : babar.userData.home;
    babar.position.lerp(goal, Math.min(1, dt * 4));
    lighter.visible = babarSneak > 0;
    if (babarSneak > 0 && game.babarTimer < 0.4) guestSay('babar', ctx.tShared('quote_babar'), 1.2);

    // Panda and guests
    const between = game.phase === 'between';
    panda.userData.animate(dt, between && celebrate ? 'dance' : 'idle');
    panda.rotation.y = Math.sin(time * 1.3) * 0.15;
    for (const [id, g] of Object.entries(guests)) {
      g.userData.party = Math.max(0, (g.userData.party || 0) - dt);
      g.userData.laugh = Math.max(0, (g.userData.laugh || 0) - dt);
      const state = id === 'babar' && babarSneak > 0 ? 'run' : g.userData.laugh > 0 ? 'hit' : g.userData.party > 0 ? 'cheer' : 'dance';
      g.userData.animate(dt * (state === 'dance' ? 0.6 : 1), state);
      if (id === 'babar') g.lookAt(panda.position.x, 0, panda.position.z);
    }

    // HUD
    if (o && game.phase === 'order') {
      const r = o.timeLeft / o.timeMax;
      els.bar.style.width = `${Math.max(0, r) * 100}%`;
      els.bar.style.background = r < 0.3 ? '#ff4d4d' : r < 0.6 ? '#ffd84a' : '#4caf50';
      if (o.timeLeft < 2) {
        hurryTick -= dt;
        if (hurryTick <= 0) { sfx.hat(); hurryTick = 0.25; }
      }
    }
    if (cardsDirty) { renderCards(); cardsDirty = false; }
    const left = Math.max(0, game.duration - game.time);
    hud.setScore(game.score, '🐆 ');
    hud.setProgress(game.progress(), `${Math.ceil(left)} s · ${game.completed} 👔`);
    if (!lastFinal && left < 10) { lastFinal = true; hud.banner(ctx.t('final'), 1200, '#ff9f1c'); }
    placeCamera(dt);

    if (ev.won) {
      ended = true;
      els.order.style.display = 'none';
      fx.burst(tmpV.set(0, 2.5, 0), 100, { speed: 8 });
      guestSay('cous', ctx.tShared('quote_cous'), 3);
      hud.say(panda, ctx.t('done'), 3);
      ctx.finish({ score: game.score, stars: game.stars(), line: ctx.t('win_line') });
    } else if (ev.lost) {
      ended = true;
      els.order.style.display = 'none';
      guestSay('eugenie', ctx.t('slip'), 3);
      ctx.fail({ score: game.score, line: ctx.t('lose_line') });
    }
  }

  function animateRoom(dt) {
    disco.rotation.y += dt * 0.8;
    discoLights.forEach((l, i) => {
      const a = time * (0.9 + i * 0.3) + (i * Math.PI * 2) / 3;
      l.position.set(Math.cos(a) * 3.5, 3.4, Math.sin(a) * 2.5);
    });
    const beat = Math.floor(time * 2.07);
    for (let i = 0; i < tiles.length; i++) tiles[i].material.color.set(tileColors[(i + beat) % 5]);
    for (const b of balloons) b.position.y += Math.sin(time * 1.4 + b.userData.phase) * dt * 0.12;
    fortyL.rotation.z = Math.sin(time * 1.1) * 0.05;
    fortyR.rotation.z = Math.sin(time * 1.1 + 1) * 0.05;
    for (let i = 0; i < flames.length; i++) flames[i].scale.setScalar(0.8 + Math.abs(Math.sin(time * 13 + i)) * 0.5);
    for (const p of smoke) {
      p.userData.t = (p.userData.t + dt * 0.45) % 1;
      const t = p.userData.t;
      p.position.set(bbq.position.x + Math.sin(t * 6 + p.id) * 0.15, 1.2 + t * 2, bbq.position.z);
      p.scale.setScalar(0.6 + t * 1.6);
      p.material.opacity = 0.5 * (1 - t);
    }
    if (pieces.glitter.visible) pieces.glitter.material.rotation = Math.sin(time * 3) * 0.1;
  }

  function placeCamera(dt) {
    const aspect = camera.aspect || 1;
    const portrait = aspect < 1 ? 1 - aspect : 0;
    const dist = 7.2 + portrait * 6.5 - zoom * 1.2;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.4 : 0;
    camera.position.set(Math.sin(time * 0.35) * 0.5 + sx, 2.7 + portrait * 1.2, dist);
    camera.lookAt(sx * 0.5, 1.45 - portrait * 0.6, 0);
    void dt;
  }

  function dispose() {
    window.removeEventListener('keydown', onKey);
    els.style?.remove();
    els.order?.remove();
    els.wardrobe?.remove();
  }

  return { start, update, dispose, game };
}
