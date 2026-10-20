# Cat Sushi Conveyor Tycoon

A mobile-first (portrait 9:16) HTML5 idle/tycoon game, the second game in the Cat Restaurant Tycoon series. Plain JavaScript, no external dependencies, works offline. `index.html` sits at the root, so the folder can be deployed to Netlify as-is.

## Play

* **Netlify:** drag the folder (or the ZIP) onto app.netlify.com/drop.
* **Locally:** open `index.html` directly, or run `python3 -m http.server` and visit http://localhost:8000.
* **Controls:** drag anywhere to move (floating joystick), or use WASD / arrow keys on desktop. All interactions happen automatically when you walk into a station, crate, loader, seat, register, coin pile or price pad.
* **Debug URL params:** `?autoplay=1` (bot plays), `&speed=8` (time multiplier), `&zoom=0.6`, `&autostart=1&fresh=1` (skip the splash with a new save).

## Core loop

Collect ingredients from a crate → stand at a station (sushi is prepared over time) → pick up the plates → drop them at **LOAD** (6-plate staging tray) → the plates ride the conveyor → seated customers grab the plates they want → eat → pay at the register → collect the coin pile → clear dirty plates at the **Dish Return** → buy expansions and upgrades.

## Project layout

```
index.html          entry point (Netlify root)
css/style.css       UI (HUD, nav, panels, toasts, joystick)
js/manifest.js      generated atlas + animation index
js/config.js        ALL tunables: economy, recipes, layout, unlocks, tasks, upgrades
js/nav.js           nav grid + A* + line-of-sight smoothing
js/conveyor.js      belts, plates, capacity, A→B junction
js/game.js          game state, stations, customers, staff AI, player interactions, tasks, save
js/bot.js           autoplay bot (used by the simulator and ?autoplay=1)
js/assets.js        atlas loader + animation controller (8-dir with side fallback)
js/render.js        canvas renderer (y-sorted scene, belts, overlays)
js/input.js         joystick + keyboard
js/ui.js            HUD, Shop / Upgrade / Task / Map / Settings panels
js/audio.js         synthesised sound effects
js/main.js          boot + fixed-step loop
assets/*.webp       character atlases + props atlas
tools/              asset pipeline (python), pacing simulator, doc generator
tests/              Playwright browser test, sprite check page, results
docs/               deliverable documents
```

## Rebuilding

* Re-cut the art from the source sheets: `python3 tools/build_sprites.py && python3 tools/cprops_crop.py && python3 tools/props.py && python3 tools/build_assets.py`. The source sheet paths are set at the top of the scripts.
* Pacing simulation: `node tools/sim.js --seeds 10 --minutes 70 --json docs/sim_results.json`
* Regenerate docs: `node tools/gen_docs.js docs/sim_results.json`
* Browser test: `node tests/browser_test.js http://localhost:8000/` (needs `playwright`)
