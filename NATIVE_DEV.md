# Meow Sushi – one source for Web + TikTok native

Both builds come from this folder. `js/` is shared code (game logic, render, ads, minis). The web build adds
`index.html`, `css/`, `js/ui.js`, `js/input.js`, `js/main.js`. The native build adds `native/`.

```
native/src/adapter.js        tt.* -> browser globals shim (canvas, storage, touch, onShow/onHide)
native/src/uiart_files.js    UI art file list for the native package
native/src/ui_native.js      canvas UI (HUD, nav, panels, popups, toasts, test-ad overlay)
native/src/minis_native.js   canvas popups for Home screen / Revisit / Share / Free coins / Rush
native/src/main_native.js    boot: loading screen -> subpackage 'res' -> game loop + touch joystick
native/project/              game.json, project.config.json, nav/upgrade PNG icons, res/game.js stub
native/emulator.html         desktop tt.* emulator (not uploaded)
tools/build_native.js        builds dist/meow-sushi (upload) + dist/emulator
tools/native_test.js         headless test of the native build (16 checks)
```

## Everyday loop
```
node tools/build_native.js                       # -> dist/meow-sushi, size check vs 4 MB / 30 MB
python3 -m http.server 8000 -d dist              # play: http://localhost:8000/emulator/index.html?fakeads=1
node tools/native_test.js                        # native checks (Playwright)
python3 -m http.server 8765 & node tests/browser_test.js http://localhost:8765/   # web: 14 checks
```
Emulator URL flags: `?fakeads=1` fake TikTok ad SDK · no flag = test-ad overlay · `?noads=1` = client without ad SDK.
In the console: `APP.setAutoplay(true); APP.speed = 8` (bot plays), `__game` = game state, `CST.Ads.events` = ad log.

## Release build
```
node tools/build_native.js --appid <APP_ID> --rewarded <REWARDED_ID> --interstitial <INTER_ID> --zip
cd dist/meow-sushi && ttmg dev                   # needs: npm i -g @ttmg/cli, ttmg login, Node >= 20
```

## Changes vs the first native package
- Ads: on a client with no ad SDK the native build no longer shows the fake test-ad overlay (which granted rewards
  without a real ad); ad offers are switched off instead. The emulator keeps the overlay for testing.
- Source recovered: the build is reproducible from this folder (verified byte-identical to the shipped game.js
  before the change above).
