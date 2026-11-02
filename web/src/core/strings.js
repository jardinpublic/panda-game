// Shell text in English and French. Each world adds its own TEXTS when it
// loads (see registerTexts). A value may be an array: t() picks one at random.

export const STRINGS = {
  title: { en: 'Pandadventures', fr: 'Pandadventures' },
  tagline: { en: 'The legendary days of Panda and the gang', fr: 'Les journées légendaires de Panda et de la bande' },
  play: { en: 'Play', fr: 'Jouer' },
  map: { en: 'World map', fr: 'Carte des mondes' },
  back_map: { en: 'Back to the map', fr: 'Retour à la carte' },
  start: { en: 'Start', fr: 'C\'est parti !' },
  retry: { en: 'Try again', fr: 'Rejouer' },
  next: { en: 'Next world', fr: 'Monde suivant' },
  quit: { en: 'Quit', fr: 'Quitter' },
  pause: { en: 'Pause', fr: 'Pause' },
  resume: { en: 'Resume', fr: 'Reprendre' },
  locked: { en: 'Locked', fr: 'Verrouillé' },
  locked_hint: { en: 'Get a star in the previous world', fr: 'Décroche une étoile au monde précédent' },
  mode: { en: 'Mode', fr: 'Mode' },
  mode_easy: { en: 'Easy', fr: 'Facile' },
  mode_normal: { en: 'Normal', fr: 'Normal' },
  mode_hard: { en: 'Hard', fr: 'Difficile' },
  how_to_play: { en: 'How to play', fr: 'Comment jouer' },
  score: { en: 'Score', fr: 'Score' },
  best: { en: 'Best', fr: 'Record' },
  stars_total: { en: '{n} stars', fr: '{n} étoiles' },
  hall: { en: 'Hall of fame', fr: 'Panthéon' },
  hall_empty: { en: 'No scores yet. Go play!', fr: 'Aucun score. Va jouer !' },
  share: { en: 'Brag on WhatsApp', fr: 'Frimer sur WhatsApp' },
  share_text: { en: 'I scored {score} in "{world}" on Pandadventures! Hoho! {url}', fr: 'J\'ai fait {score} dans « {world} » sur Pandadventures ! Hoho ! {url}' },
  copied: { en: 'Copied! Paste it in the group.', fr: 'Copié ! Colle-le dans le groupe.' },
  your_name: { en: 'Your name', fr: 'Ton prénom' },
  win_title: { en: ['Hoho!', 'Bravo!', 'Stylé!'], fr: ['Hoho !', 'Bravo !', 'Stylé !'] },
  lose_title: { en: ['Arf…', 'Caught!', 'Ouch!'], fr: ['Arf…', 'Grillé !', 'Aïe !'] },
  loading: { en: 'Loading…', fr: 'Chargement…' },
  sound_on: { en: 'Sound on', fr: 'Son activé' },
  sound_off: { en: 'Sound off', fr: 'Son coupé' },
  lang_switch: { en: 'Français', fr: 'English' },
  rotate: { en: 'Turn your phone sideways for more fun', fr: 'Tourne ton téléphone pour plus de fun' },
  tap_to_start: { en: 'Tap or press Space', fr: 'Touche l\'écran ou Espace' },

  // Cameo lines: every friend shows up in every world.
  quote_panda: { en: ['Hoho!', 'Hoho, I deny everything!', 'Drinks at 11:30, then nap.', 'Hoho, New Panda, a reformed man.', 'Hoho, the merguez!', "Hoho, I'm a natural at pole!", "Hoho, y'est me!", "Hoho, y est Louis!", "♪ I see lascars far away… y est me, y es te, y est l'Panda! ♪"], fr: ['Hoho !', 'Hoho, je nie tout en bloc !', 'Un pot à 11h30, et sieste.', 'Hoho, y est New Panda, un repenti.', 'Hoho les merguez !', "Hoho, la barre, c'est mon truc !", "Hoho, y'est me !", "Hoho, y est Louis !", "♪ J'vois des lascars au loin… y est me, y es te, y est l'Panda ! ♪"] },
  quote_cous: { en: ['There is no New Cous!', 'Be wise, Panda…', '20 € per parcel!', "EMILLE-PATTES!", "Emille et une nuit!"], fr: ['Mais bondieu, y a pas de New Cous !', 'Sois sage, Panda…', '20 € par colis !', "EMILLE-PATTES !", "Emille et une nuit !"] },
  quote_romain: { en: ['You want to see work?', 'Do it FOR THE SILO!', 'Looool', 'Look at that!', "Well yes, you've got to work!"], fr: ['Te veux voir du travail ?', 'Do it FOR THE SILO !', 'Looool', 'R\'gard\' don\' !', "Bah oui, faut bosser !"] },
  quote_mamar: { en: ['Aïe aïe aïe aïe', 'Olé!', 'Thanks!', 'Messi is a god', "Batistuta!", "Batigol!", "Nous l'Argentine!"], fr: ['Aïe aïe aïe aïe', 'Olé !', 'Merssi', 'Messi y est un dieu', "Batistuta !", "Batigol !", "Nous l'Argentine !"] },
  quote_victor: { en: ['Get to work, Panda!', 'Good job, monkey!', 'Stylish', "Seen my aubergines? Huge!", "Biggest aubergine on the island!"], fr: ['Bosse don\', Panda !', 'Bon boulot l\'🐒 !', 'Stylé', "T'as vu mes aubergines ? Énormes !", "La plus grosse aubergine de l'île !"] },
  quote_babar: { en: ['Shave it all off!', 'I run, like dad.', 'What do I have to do with it?!', "Ah ben mon Romain…", "My boar is very gentle."], fr: ['Rase z\'y tout !', 'Je fais comme pôpa : je cours.', 'Qué don\' qu\' j\'ai à voir ?!', "Ah ben mon Romain…", "Mon sanglier est très gentil."] },
  quote_greg: { en: ['Le crapa!', 'Happy birthday!', "In the US, that's a small!", "Everything's bigger in America!"], fr: ['Le crapa !', 'Bon anniv !', "Aux States, ça c'est un small !", "En Amérique, tout est plus grand !"] },
  quote_aline: { en: ['We love you anyway!', 'Silo done!'], fr: ['On t\'aime quand même !', 'Silo fini !'] },
  quote_eugenie: { en: ['What is that underwear, Panda?!', 'Bisous!'], fr: ['Mais qu\'est-ce que c\'est que ce slip ?!', 'Bisous !'] },
  quote_violaine: { en: ['Awkward!', 'Go for it!', "Core, Panda! Core!", "Pole class tonight!"], fr: ['Malaisant !', 'Vazy balance !', "Gainage, Panda !", "Cours de pole ce soir !"] },
};

/** Adds a world's texts ({en: {key: text}, fr: {...}}) under a prefix. */
export function registerTexts(prefix, texts) {
  for (const lang of ['en', 'fr']) {
    for (const [key, value] of Object.entries(texts[lang] || {})) {
      const full = `${prefix}.${key}`;
      STRINGS[full] = STRINGS[full] || {};
      STRINGS[full][lang] = value;
    }
  }
}
