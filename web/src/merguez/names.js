/** Golden Merguez names: the people and their weapons (also read by the home page's hero picker). */
export const NAMES = {
  panda: 'Panda', cous: 'Cous', mamar: 'Mamar', babar: 'Babar', victor: 'Victor', romain: 'Romain', eugenie: 'Eugénie', violaine: 'Violaine',
  aline: 'Aline', greg: 'Greg', jojo: 'Jojo', rudy: 'Rudy', jose: 'José', lamoule: 'Lamoule', gogol: 'Pépé Gogol', pineur: 'Pépé Pineur', gardien: 'Eul’ gardien',
  controleur: 'Eul’ contrôleur', videur: 'Eul’ videur', proprio: 'Eul’ proprio', flic: 'Eul’ flic', chasseur: 'Eul’ chasseur',
};

export const WEAPON_NAMES = {
  merguez: { fr: 'Merguez', en: 'Merguez' }, cubi: { fr: 'Cubis d’rouge Villageoise', en: 'Villageoise red wine boxes' },
  megaphone: { fr: 'Mégaphones', en: 'Megaphones' }, citrouille: { fr: 'Citrouilles', en: 'Pumpkins' },
  crotte: { fr: 'Loulous', en: 'Loulous (bogeys)' }, sacdos: { fr: 'Sacs d’os', en: 'Bags of bones' }, rouleau: { fr: 'Rouleau à pâtisserie', en: 'Rolling pin' },
  archet: { fr: 'Archet de violon', en: 'Violin bow' }, treuffe: { fr: 'Treuffes', en: 'Treuffes (spuds)' }, cote: { fr: 'Côte de bœuf XXXXL', en: 'XXXXL rib steak' },
  mouchoir: { fr: 'Mouchoirs', en: 'Tissues' }, museau: { fr: 'Salade de museau', en: 'Snout salad' }, sardine: { fr: 'Sardines', en: 'Sardines' },
  poulet: { fr: 'Poulet', en: 'Chicken' }, boule: { fr: 'Boules de pétanque', en: 'Pétanque balls' }, pomme: { fr: 'Pommes de pin', en: 'Pine cones' },
  pv: { fr: 'PV', en: 'Fines' }, glacon: { fr: 'Glaçons', en: 'Ice cubes' }, pantoufle: { fr: 'Pantoufles', en: 'Slippers' },
};

/** The flying bonuses (the beauf collection). */
export const BONUS_NAMES = {
  pneu: { fr: 'Pneu', en: 'Tyre' }, jambon: { fr: 'Tranche d’jambon', en: 'Slice of ham' }, canette: { fr: 'Canette', en: 'Can of beer' },
  tong: { fr: 'Tong', en: 'Flip-flop' }, banane: { fr: 'Sac banane', en: 'Bum bag' }, rhum: { fr: 'Bouteille d’rhum', en: 'Bottle of rum' },
  malibu: { fr: 'Malibu coco', en: 'Coconut liqueur' }, pastis: { fr: 'Pastaga', en: 'Pastis' }, nain: { fr: 'Nain d’jardin', en: 'Garden gnome' },
};

/**
 * What the people outside the gang say when knocked out (the gang members say
 * one of their own punchlines, quote_<id> in core/strings.js).
 */
export const KO_LINES = {
  jojo: { fr: ['Mmm, j’ai qu’ça à faire.'], en: ['Mmm, like I’ve got nothing better to do.'] },
  lamoule: { fr: ['Mon poulet !', 'José, démarre eul’ 205 !', 'On r’viendra vous chercher !'], en: ['My chicken!', 'José, start the 205!', 'We’ll be back for you!'] },
  jose: { fr: ['Mes sardines !', 'Lamoule, à l’aide !', 'Obrigado… pour rien !'], en: ['My sardines!', 'Lamoule, help!', 'Obrigado… for nothing!'] },
  rudy: { fr: ['Retour au CRAPA…', 'Ma salade de museau !', 'J’retourne vivre dans les bois !'], en: ['Back to the CRAPA…', 'My snout salad!', 'Back to living in the woods!'] },
  gogol: { fr: ['Ma boule était pointée !', 'Eh, y’a mène ici !'], en: ['My ball was right there!', 'Hey, we’re playing here!'] },
  pineur: { fr: ['Bon sang d’bonsoir !', 'De mon temps, on lançait mieux !'], en: ['Good grief!', 'In my day we threw better!'] },
  gardien: { fr: ['Interdit d’marcher sur la pelouse !', 'J’vais siffler la fin !'], en: ['Keep off the grass!', 'I’m blowing the whistle!'] },
  controleur: { fr: ['Vos billets, s’il vous plaît…', 'Pas d’billet, pas d’chocolat !'], en: ['Tickets, please…', 'No ticket, no treat!'] },
  videur: { fr: ['Pas ce soir…', 'Te rentres pas !'], en: ['Not tonight…', 'You’re not getting in!'] },
  proprio: { fr: ['Mes lampes !', 'Revenez ici, bande ed’ voyous !'], en: ['My lamps!', 'Come back here, you hooligans!'] },
  flic: { fr: ['Bonsoir jeune homme…', 'Circulez !'], en: ['Evening, young man…', 'Move along!'] },
  chasseur: { fr: ['J’l’avais dans l’viseur !', 'Y’a du gibier par ici ?'], en: ['I had it in my sights!', 'Any game around here?'] },
};
