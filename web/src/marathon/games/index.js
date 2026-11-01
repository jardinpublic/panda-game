// Every micro-game in the marathon: each file in this folder is one game
// (a default export, see README.md). Bosses have `boss: true` and come every 10th game.
const modules = import.meta.glob('./*.js', { eager: true });

const ALL = Object.entries(modules)
  .filter(([path]) => !path.endsWith('/index.js'))
  .map(([, mod]) => mod.default)
  .filter(Boolean)
  .sort((a, b) => a.id.localeCompare(b.id));

export const GAMES = ALL.filter((d) => !d.boss);
export const BOSSES = ALL.filter((d) => d.boss);
