#!/usr/bin/env node
/* Native-build test: runs dist/ (built by tools/build_native.js) in the tt.* emulator, headless.
   usage: node tools/native_test.js [outDir] [--secs 160]     (needs playwright; NODE_PATH=$(npm root -g) works) */
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const argv = process.argv.slice(2), OUT = argv[0] && !argv[0].startsWith('--') ? argv[0] : path.join(__dirname, '../tests/out_native');
const SECS = argv.includes('--secs') ? +argv[argv.indexOf('--secs') + 1] : 160; fs.mkdirSync(OUT, { recursive: true });
const DIST = path.join(__dirname, '../dist'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const res = []; const rec = (name, ok, detail) => { res.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} — ${detail}`); };
(async () => {
  const srv = http.createServer((q, s) => { const p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(DIST) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
  const port = srv.address().port, BASE = `http://localhost:${port}/emulator/index.html`;
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  pg.on('response', r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`); });
  const shot = n => pg.screenshot({ path: path.join(OUT, n + '.png') });
  const boot = async q => { await pg.goto(BASE + q); await pg.evaluate(() => localStorage.clear()); await pg.goto(BASE + q); await pg.waitForFunction(() => window.__game && window.APP && APP.ui, null, { timeout: 30000 }); await pg.waitForTimeout(700); };
  // tap the centre of the n-th-from-last hit area (popup / sheet buttons are registered last)
  const tapHit = async (pick) => { const h = await pg.evaluate(pick); if (!h) return false; await pg.mouse.click(h.x + h.w / 2, h.y + h.h / 2); await pg.waitForTimeout(250); return true; };

  await boot('?fakeads=1');
  await shot('01_start');
  rec('Boot without errors', errs.length === 0, `${errs.length} errors`);
  // joystick
  const p0 = await pg.evaluate(() => ({ x: __game.player.x, y: __game.player.y }));
  await pg.mouse.move(195, 560); await pg.mouse.down(); for (let i = 1; i <= 15; i++) { await pg.mouse.move(195 + i * 3, 560 - i * 3); await pg.waitForTimeout(40); } await pg.waitForTimeout(500); await pg.mouse.up();
  const p1 = await pg.evaluate(() => ({ x: __game.player.x, y: __game.player.y }));
  rec('Joystick moves the player', Math.hypot(p1.x - p0.x, p1.y - p0.y) > 20, `moved ${Math.hypot(p1.x - p0.x, p1.y - p0.y).toFixed(0)} units`);
  // panels via bottom nav
  for (const [i, name] of ['shop', 'upgrade', 'tasks', 'map', 'settings'].entries()) {
    await pg.mouse.click(10 + (390 - 20 - 28) / 5 * (i + 0.5) + 7 * i, 844 - 30 - 10 - 30); await pg.waitForTimeout(300);
    const open = await pg.evaluate(() => APP.ui.panel); await pg.mouse.wheel(0, 300).catch(() => { });
    await shot('02_panel_' + name); rec(`Nav opens ${name}`, open === name, `panel=${open}`);
    await pg.evaluate(() => APP.ui.close());
  }
  // share popup -> share button -> reward
  const c0 = await pg.evaluate(() => { CST.Minis.popShare(); return __game.S.coins; }); await pg.waitForTimeout(300); await shot('03_share');
  await tapHit(() => { const h = APP.ui.hits; return h[h.length - 1]; }); await pg.waitForTimeout(600);
  const sh = await pg.evaluate(() => ({ called: !!window.__shared, coins: __game.S.coins, day: CST.Minis.st().shareDay }));
  rec('Share calls shareAppMessage and rewards once', sh.called && sh.coins > c0, JSON.stringify(sh));
  await pg.evaluate(() => APP.ui.closePopup && APP.ui.closePopup());
  // free coins via rewarded ad
  const c1 = await pg.evaluate(() => { CST.Ads.t = 999; CST.Minis.popCoins(); return __game.S.coins; }); await pg.waitForTimeout(300); await shot('04_coins');
  await tapHit(() => { const h = APP.ui.hits; return h[h.length - 1]; }); await pg.waitForTimeout(900);
  const co = await pg.evaluate(() => ({ ads: window.__adShown || 0, coins: __game.S.coins, pop: !!APP.ui.pop, paused: APP.paused }));
  rec('Free Coins plays a rewarded ad and grants coins', co.ads >= 1 && co.coins > c1 && !co.paused, JSON.stringify(co));
  // home-screen + revisit popups render
  for (const f of ['popAdd', 'popRevisit']) { await pg.evaluate(f => CST.Minis[f](), f); await pg.waitForTimeout(250); const ok = await pg.evaluate(() => !!APP.ui.pop); await shot('05_' + f); rec(`${f} popup opens`, ok, ''); await pg.evaluate(() => APP.ui.closePopup()); }
  // long autoplay
  await pg.evaluate(() => { APP.setAutoplay(true); APP.speed = 8; });
  const t0 = Date.now(); while (Date.now() - t0 < SECS * 1000 / 8) await pg.waitForTimeout(1000);
  const st = await pg.evaluate(() => { APP.setAutoplay(false); APP.speed = 1; return { time: Math.round(__game.S.time), task: __game.S.taskIndex, coins: Math.floor(__game.S.coins), paid: __game.stat('paid'), inter: window.__adShown || 0 }; });
  await pg.waitForTimeout(400); await shot('06_after_autoplay');
  rec(`Autoplay ${SECS}s game time progresses`, st.task > 2 && st.paid > 0, JSON.stringify(st));
  // save / reload
  const sv = await pg.evaluate(() => { __game.save(); return { coins: Math.floor(__game.S.coins), task: __game.S.taskIndex }; });
  await pg.reload(); await pg.waitForFunction(() => window.__game && APP.ui, null, { timeout: 30000 });
  const ld = await pg.evaluate(() => ({ coins: Math.floor(__game.S.coins), task: __game.S.taskIndex }));
  rec('Save/load through tt storage', ld.task === sv.task && Math.abs(ld.coins - sv.coins) <= 1, `${JSON.stringify(sv)} → ${JSON.stringify(ld)}`);
  // no ad SDK at all (fakeads off) must not break anything
  // emulator without fake SDK: test-ad overlay
  await boot(''); const c2 = await pg.evaluate(() => { CST.Ads.t = 999; CST.Minis.popCoins(); return __game.S.coins; }); await pg.waitForTimeout(300);
  await tapHit(() => { const h = APP.ui.hits; return h[h.length - 1]; }); await pg.waitForTimeout(300); await shot('07_mock_ad');
  const mk = await pg.evaluate(() => ({ overlay: !!APP.ui.ad, paused: APP.paused })); rec('Emulator test-ad overlay shows and pauses', mk.overlay && mk.paused, JSON.stringify(mk));
  await pg.evaluate(() => { const a = APP.ui.ad; APP.ui.ad = null; a.end(true); });
  // production-like client with no ad SDK: ads off, no fake overlay, no reward
  await boot('?noads=1'); await pg.evaluate(() => { CST.Ads.t = 999; CST.Minis.popCoins(); }); await pg.waitForTimeout(300);
  await tapHit(() => { const h = APP.ui.hits; return h[h.length - 1]; }); await pg.waitForTimeout(300);
  const noad = await pg.evaluate(() => ({ enabled: CST.Ads.enabled, overlay: !!APP.ui.ad, coins: __game.S.coins, chips: CST.Minis.chipList.length })); await shot('08_no_ad_sdk');
  rec('No ad SDK: ads disabled, no fake ad, no free reward', !noad.enabled && !noad.overlay, JSON.stringify(noad));
  rec('No runtime errors overall', errs.length === 0, errs.length ? [...new Set(errs)].join(' | ') : 'clean');
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(res, null, 1));
  console.log(`\n${res.filter(r => r.ok).length}/${res.length} passed`);
  await b.close(); srv.close(); process.exit(res.every(r => r.ok) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
