/* Native mini-game runtime adapter (TikTok Mini Games: tt.* / wx.* / TTMinis.game.*).
   The runtime is not a browser: no DOM, no CSS. This shim gives the shared game code (render.js, game.js, assets.js,
   audio.js, ads.js, minis.js) the few browser globals it touches, backed by the mini-game APIs. */
(function () {
  const G = typeof GameGlobal !== 'undefined' ? GameGlobal : globalThis;
  const M = G.TTMinis;
  const T = G.tt || (M && M.game) || G.wx;
  G.__TT = T;
  if (!G.window) G.window = G;
  const sys = (T.getWindowInfo ? T.getWindowInfo() : null) || T.getSystemInfoSync();
  const W = sys.windowWidth || sys.screenWidth, H = sys.windowHeight || sys.screenHeight;
  G.devicePixelRatio = sys.pixelRatio || 2; G.innerWidth = W; G.innerHeight = H;
  // safe area: below the status bar and the platform's top-right capsule
  let top = (sys.safeArea && sys.safeArea.top) || sys.statusBarHeight || 0;
  try { const mb = T.getMenuButtonBoundingClientRect && T.getMenuButtonBoundingClientRect(); if (mb && mb.bottom) top = Math.max(top, mb.bottom + 6); } catch (e) { }
  const bottom = sys.safeArea ? Math.max(0, H - sys.safeArea.bottom) : 0;
  G.__SAFE = { top, bottom, W, H };

  // the first canvas created is the on-screen one
  const screen = G.__screenCanvas || T.createCanvas(); G.__screenCanvas = screen;
  screen.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H });
  G.canvas = screen;

  if (!G.Image || !G.document || !G.document.body) G.Image = function () { return T.createImage(); };   // (left alone in the desktop emulator)
  const listeners = {};
  const doc = G.document && G.document.body ? G.document : (G.document = {
    hidden: false,
    createElement(tag) { if (tag === 'canvas') return T.createCanvas(); return { style: {}, classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } }, appendChild() { } }; },
    getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener(ev, f) { (listeners[ev] = listeners[ev] || []).push(f); }, removeEventListener() { }
  });
  const fire = ev => (listeners[ev] || []).forEach(f => { try { f(); } catch (e) { } });
  T.onHide && T.onHide(() => { try { doc.hidden = true; } catch (e) { } fire('visibilitychange'); (G.__winL.pagehide || []).forEach(f => f()); });
  T.onShow && T.onShow(() => { try { doc.hidden = false; } catch (e) { } fire('visibilitychange'); });
  G.__winL = {};
  if (!G.addEventListener) G.addEventListener = (ev, f) => { (G.__winL[ev] = G.__winL[ev] || []).push(f); };
  if (!G.removeEventListener) G.removeEventListener = (ev, f) => { const a = G.__winL[ev]; if (a) G.__winL[ev] = a.filter(x => x !== f); };

  if (!G.localStorage) G.localStorage = {
    getItem(k) { try { const v = T.getStorageSync(k); return v === '' || v === undefined || v === null ? null : String(v); } catch (e) { return null; } },
    setItem(k, v) { try { T.setStorageSync(k, String(v)); } catch (e) { } },
    removeItem(k) { try { T.removeStorageSync(k); } catch (e) { } }
  };
  if (!G.location) G.location = { search: '', href: '' };
  G.navigator = G.navigator || { userAgent: 'tt-minigame' };
  if (!G.navigator.vibrate) G.navigator.vibrate = ms => { try { (ms > 30 ? T.vibrateLong : T.vibrateShort)({ type: 'light' }); } catch (e) { } return true; };
  if (!G.performance || !G.performance.now) G.performance = { now: () => Date.now() };   // the loop measures its own frame time with this
  if (!G.requestAnimationFrame) G.requestAnimationFrame = f => setTimeout(() => f(G.performance.now()), 16);
  if (!G.URLSearchParams) G.URLSearchParams = function () { this.get = () => null; this.has = () => false; };
  if (T.createWebAudioContext && !G.AudioContext) G.AudioContext = function () { return T.createWebAudioContext(); };
})();
