// The eleven worlds, in map order. Each module exports TEXTS and createWorld(ctx).
// Titles and blurbs live here so the map can show them before a world loads.

export const WORLDS = [
  { id: 'w01', module: () => import('./w01-escape/index.js'), color: '#ff8a3d', icon: '🏃', genre: { en: 'Chase runner', fr: 'Course-poursuite' },
    title: { en: '15:00 sharp!', fr: '15h pétantes !' },
    blurb: { en: 'Panda bolts from the office to his beach. Romain is right behind him.', fr: 'Panda file du bureau vers sa plage. Romain est à ses trousses.' } },
  { id: 'w02', module: () => import('./w02-concert/index.js'), color: '#9b5de5', icon: '🎸', genre: { en: 'Rhythm', fr: 'Rythme' },
    title: { en: 'The video-call concert', fr: 'Le concert en visio' },
    blurb: { en: 'Play guitar in a work call, mic open. Mute before the boss looks!', fr: 'Joue de la guitare en réunion, micro ouvert. Coupe le son avant que le chef regarde !' } },
  { id: 'w03', module: () => import('./w03-bagnole/index.js'), color: '#e63946', icon: '🚗', genre: { en: 'Defence', fr: 'Défense' },
    title: { en: 'Hoho ma bagnole!', fr: 'Hoho ma bagnole !' },
    blurb: { en: 'Kids are after the Fiat Panda parked by the little castle. Shoo them away!', fr: 'Des gamins s\'en prennent à la Fiat Panda garée près du petit château. Chasse-les !' } },
  { id: 'w04', module: () => import('./w04-dive/index.js'), color: '#00b4d8', icon: '🦞', genre: { en: 'Spearfishing', fr: 'Chasse sous-marine' },
    title: { en: 'Lemon shark lagoon', fr: 'Le lagon des requins citrons' },
    blurb: { en: 'Spearfish, measure your langoustines (the coastguard is watching) and save the GoPro.', fr: 'Chasse au harpon, mesure tes langoustes (les garde-côtes veillent) et sauve la GoPro.' } },
  { id: 'w05', module: () => import('./w05-moliere/index.js'), color: '#f72585', icon: '🪩', genre: { en: 'Dance floor', fr: 'Piste de danse' },
    title: { en: 'Le Molière', fr: 'Le Molière' },
    blurb: { en: 'Dance on the beat, order the €200 bottles, dodge the bouncer, never fall asleep.', fr: 'Danse en rythme, commande les bouteilles à 200 €, évite le videur, ne t\'endors pas.' } },
  { id: 'w06', module: () => import('./w06-ball/index.js'), color: '#ef233c', icon: '⚾', genre: { en: 'Dodge', fr: 'Esquive' },
    title: { en: 'Mamar\'s ball', fr: 'La balle de Mamar' },
    blurb: { en: 'Panda the wild creature refuses to go back in the ball. Dodge Mamar\'s throws!', fr: 'Panda, créature sauvage, refuse de retourner dans la balle. Esquive les lancers de Mamar !' } },
  { id: 'w07', module: () => import('./w07-fauve/index.js'), color: '#f4a261', icon: '🐆', genre: { en: 'Quick change', fr: 'Déguisement express' },
    title: { en: 'Soirée fauve: Cous turns 40', fr: 'Soirée fauve : les 40 ans de Cous' },
    blurb: { en: 'Dress Panda in the right outrageous costume before the guests notice.', fr: 'Habille Panda du bon costume improbable avant que les invités remarquent.' } },
  { id: 'w08', module: () => import('./w08-oldnew/index.js'), color: '#2a9d8f', icon: '🔀', genre: { en: 'Swipe quiz', fr: 'Quiz à swiper' },
    title: { en: 'Old Cous or New Cous?', fr: 'Old Cous ou New Cous ?' },
    blurb: { en: 'Swipe fast: which Cous said it?', fr: 'Swipe vite : quel Cous a dit ça ?' } },
  { id: 'w09', module: () => import('./w09-silo/index.js'), color: '#e9c46a', icon: '🥕', genre: { en: 'Climber', fr: 'Grimpette' },
    title: { en: 'Carottés dans l\'Silo', fr: 'Carottés dans l\'Silo' },
    blurb: { en: 'Climb the Silo stairs, binge the episodes, outrun the gang.', fr: 'Grimpe l\'escalier du Silo, enchaîne les épisodes, sème la bande.' } },
  { id: 'w10', module: () => import('./w10-babar/index.js'), color: '#6c757d', icon: '🔥', genre: { en: 'Stealth', fr: 'Infiltration' },
    title: { en: 'Babar strikes back', fr: 'La revanche de Babar' },
    blurb: { en: 'Play Babar: lighter tap and spit on Panda\'s back, without being seen.', fr: 'Joue Babar : coup de briquet et crachat dans le dos de Panda, sans te faire voir.' } },
  { id: 'w11', module: () => import('./w11-croco/index.js'), color: '#588157', icon: '🐊', genre: { en: 'Final boss', fr: 'Boss final' },
    title: { en: 'Georges, the Lézarde crocodile', fr: 'Georges, le croco de la Lézarde' },
    blurb: { en: 'With Croco, wrestle the vegan crocodile barehanded. Like Dundee.', fr: 'Avec Croco, maîtrise le croco vegan à mains nues. Comme Dundee.' } },
];

export const ORDER = WORLDS.map((w) => w.id);

/** Speed / score multipliers per mode. */
export const MODE_FACTORS = { easy: 1, normal: 1.3, hard: 1.65 };
