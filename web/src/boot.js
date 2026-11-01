// Entry point: the micro-game marathon. The older 3D world-by-world
// version is still reachable with ?classic while it is being retired.
if (new URLSearchParams(location.search).has('classic')) import('./main.js');
else import('./marathon/app.js');
