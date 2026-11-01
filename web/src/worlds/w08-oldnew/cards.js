// World 8 cards: a statement about Cous (or a bonus one about Panda) and the
// right answer. 'old' = Old Cous, rock'n'roll and wild; 'new' = New Cous, wise
// and cultured. Panda bonus cards are always 'old': New Panda is a lie.
// One list with both languages, so EN and FR can never drift apart.

export const CARDS = [
  // --- New Cous -------------------------------------------------------------------
  { a: 'new', en: 'Visits the Giverny gardens for his partner\'s birthday.', fr: 'Visite les jardins de Giverny pour l\'anniversaire de sa chérie.' },
  { a: 'new', en: 'Tours an orthodox monastery. In silence.', fr: 'Visite un monastère orthodoxe. En silence.' },
  { a: 'new', en: 'Knows the opening hours of every museum in town.', fr: 'Connaît les horaires de tous les musées de la ville.' },
  { a: 'new', en: 'A Sunday at the Mine museum: "fascinating".', fr: 'Un dimanche au musée de la Mine : « passionnant ».' },
  { a: 'new', en: 'Binge-watches Yellowstone with his partner, under a blanket.', fr: 'Enchaîne Yellowstone avec sa chérie, sous un plaid.' },
  { a: 'new', en: '"Let\'s avoid the beauferies."', fr: '« On évite les beauferies. »' },
  { a: 'new', en: 'Reads sci-fi to fall asleep at 10 pm.', fr: 'Lit de la SF pour s\'endormir à 22h.' },
  { a: 'new', en: 'Suggests a vegan restaurant for the boys\' night.', fr: 'Propose un resto vegan pour la soirée entre potes.' },
  { a: 'new', en: '"There\'s a lovely salad place nearby."', fr: '« Y a un petit resto de salades très sympa à côté. »' },
  { a: 'new', en: 'Waits for parcels at the letterbox. Only the letterbox.', fr: 'Attend les colis à la boîte aux lettres. Uniquement la boîte aux lettres.' },
  { a: 'new', en: 'Builds a video game with Claude, on a Sunday morning.', fr: 'Code un jeu vidéo avec Claude, un dimanche matin.' },
  { a: 'new', en: 'Brings his guinea pigs fresh parsley.', fr: 'Apporte du persil frais à ses cochons d\'Inde.' },
  { a: 'new', en: 'Buys the annual museum pass. Again.', fr: 'Reprend la carte annuelle des musées.' },
  { a: 'new', en: 'Herbal tea after 6 pm.', fr: 'Une tisane après 18h.' },
  { a: 'new', en: 'Reads the exhibition booklet cover to cover.', fr: 'Lit le livret de l\'expo de A à Z.' },
  { a: 'new', en: 'Compares two audio guides before choosing.', fr: 'Compare deux audioguides avant de choisir.' },
  { a: 'new', en: 'Asks about the wine\'s terroir… then orders water.', fr: 'Demande le terroir du vin… puis commande une carafe d\'eau.' },
  { a: 'new', en: 'Explains the plot of Silo, season by season.', fr: 'Explique l\'intrigue de Silo, saison par saison.' },
  { a: 'new', en: 'Says "so rich in history" in front of a chapel.', fr: 'Dit « chargée d\'histoire » devant une chapelle.' },
  { a: 'new', en: 'Plans the holidays in a spreadsheet.', fr: 'Planifie les vacances dans un tableur.' },
  { a: 'new', en: 'Home before midnight, and proud of it.', fr: 'Rentré avant minuit, et fier de l\'être.' },
  { a: 'new', en: '"Be wise, Panda…"', fr: '« Sois sage, Panda… »' },
  { a: 'new', en: 'Leaves a 5-star review for a castle.', fr: 'Laisse 5 étoiles à un château.' },
  { a: 'new', en: 'Watches a cathedral documentary. Takes notes.', fr: 'Regarde un documentaire sur les cathédrales. Prend des notes.' },
  { a: 'new', en: 'Waters the plants, then visits a botanical garden.', fr: 'Arrose les plantes, puis visite un jardin botanique.' },
  { a: 'new', en: 'Keeps a reading list. Colour-coded.', fr: 'Tient une liste de lecture. Avec des couleurs.' },

  // --- Old Cous -------------------------------------------------------------------
  { a: 'old', en: 'Football night with the boys.', fr: 'Soirée foot avec les copains.' },
  { a: 'old', en: '12 episodes in a single day.', fr: '12 épisodes dans la journée.' },
  { a: 'old', en: 'Legendary pranks with Romain, back in 2012.', fr: 'Des blagues légendaires avec Romain, en 2012.' },
  { a: 'old', en: 'Posts Dr Zoidberg GIFs at work.', fr: 'Poste des GIF du Dr Zoidberg au boulot.' },
  { a: 'old', en: 'Rock\'n\'roll party until sunrise.', fr: 'Soirée rock\'n\'roll jusqu\'au lever du soleil.' },
  { a: 'old', en: '"Bois-z-y tout!" (drink it all!)', fr: '« Bois-z-y tout ! »' },
  { a: 'old', en: 'Air guitar solo on the sofa.', fr: 'Solo d\'air guitar sur le canapé.' },
  { a: 'old', en: 'Sings the chorus louder than the band.', fr: 'Chante le refrain plus fort que le groupe.' },
  { a: 'old', en: 'Leather jacket and sunglasses. At night.', fr: 'Blouson en cuir et lunettes de soleil. La nuit.' },
  { a: 'old', en: 'Last one dancing at the Molière.', fr: 'Le dernier à danser au Molière.' },
  { a: 'old', en: '"One last round and we go." Three times.', fr: '« Une dernière et on y va. » Trois fois.' },
  { a: 'old', en: 'Kebab at 4 am, best meal ever.', fr: 'Kebab à 4h du mat\', meilleur repas du monde.' },
  { a: 'old', en: 'Wakes up in a hammock. No idea how.', fr: 'Se réveille dans un hamac. Aucune idée comment.' },
  { a: 'old', en: 'Headbanging at a wedding.', fr: 'Headbang à un mariage.' },
  { a: 'old', en: 'Shaggy hair, Hawaiian shirt, volume at max.', fr: 'Cheveux en bataille, chemise hawaïenne, volume à fond.' },
  { a: 'old', en: '"Vin diou, one more!"', fr: '« Vin diou, encore une ! »' },
  { a: 'old', en: 'Karaoke with Panda: off-key and proud.', fr: 'Karaoké avec Panda : faux et fier.' },
  { a: 'old', en: 'Watches the season finale at 3 am.', fr: 'Regarde le final de la saison à 3h du mat\'.' },
  { a: 'old', en: 'Throws a barbecue for 30 people. On a Tuesday.', fr: 'Organise un barbecue pour 30. Un mardi.' },
  { a: 'old', en: 'Rock horns 🤘 in every single photo.', fr: 'Les cornes 🤘 sur toutes les photos.' },
  { a: 'old', en: 'Road trip with no plan and no map.', fr: 'Road trip sans plan ni carte.' },
  { a: 'old', en: 'Jumps in the pool fully dressed.', fr: 'Saute dans la piscine tout habillé.' },
  { a: 'old', en: 'Calls Panda at 2 am just to say "Hoho".', fr: 'Appelle Panda à 2h du mat\' juste pour dire « Hoho ».' },
  { a: 'old', en: 'Wild animal costume for his own birthday.', fr: 'Déguisé en bête sauvage pour son propre anniversaire.' },
  { a: 'old', en: 'Sleeps 3 hours, then plays five-a-side.', fr: 'Dort 3 heures, puis va au foot à cinq.' },
  { a: 'old', en: 'Starts a conga line at a christening.', fr: 'Lance une chenille à un baptême.' },

  // --- Bonus: Panda swears he has changed (he has not) ------------------------
  { a: 'old', panda: true, en: 'Panda: "Hoho, I\'m New Panda now. A reformed man."', fr: 'Panda : « Hoho, y est New Panda, un repenti. »' },
  { a: 'old', panda: true, en: 'Panda: "Drinks at 11:30? Never again."', fr: 'Panda : « Un pot à 11h30 ? Plus jamais. »' },
  { a: 'old', panda: true, en: 'Panda: "I was in bed by 9, I swear."', fr: 'Panda : « J\'étais couché à 21h, promis. »' },
  { a: 'old', panda: true, en: 'Panda: "No more Soirée fauve for me."', fr: 'Panda : « Fini les soirées fauves pour moi. »' },
  { a: 'old', panda: true, en: 'Panda: "Tomorrow I\'m going to a museum. Hoho."', fr: 'Panda : « Demain je vais au musée. Hoho. »' },
  { a: 'old', panda: true, en: 'Panda: "I work hard, ask my boss."', fr: 'Panda : « Je bosse dur, demande à mon chef. »' },
];

/** The cards for one language: [{ text, answer, panda }]. Same order and answers in every language. */
export function cardSet(lang) {
  const key = lang === 'fr' ? 'fr' : 'en';
  return CARDS.map((c) => ({ text: c[key], answer: c.a, panda: !!c.panda }));
}
