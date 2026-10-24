/* Playgama Bridge v2 adapter.
   - index.html loads playgama-bridge.js BEFORE game.js, so window.bridge exists synchronously here.
   - Bridge reads playgama-bridge-config.json next to index.html.
   - The game's own ad scheduler (CST.Ads: cooldowns, caps, placements) is kept; only its
     playback (CST.Ads.play) is replaced so ads come from bridge.advertisement instead of the
     TikTok SDK / test overlay. */
(function () {
  'use strict';
  const SAVE_KEY = 'meow_save';
  let B = null;
  let pendingAd = null;   // { type, done, opened, rewarded, timer }

  const ev = name => (B && B.EVENT_NAME && B.EVENT_NAME[name]) || name;
  const send = msg => { try { const p = B && B.platform.sendMessage(msg); if (p && p.catch) p.catch(() => {}); } catch (e) { } };

  function finishAd(ok) {
    const p = pendingAd; if (!p) return;
    pendingAd = null; clearTimeout(p.timer);
    PLATFORM.setPaused('ad', false);
    if (window.CST && CST.Ads) CST.Ads.busy = false;
    send('gameplay_started');
    p.done(ok);
  }

  // Replacement for CST.Ads.play(type, done): type is 'reward' | 'inter'; done(ok)
  function playAd(type, done) {
    const isReward = type === 'reward';
    const A = B && B.advertisement;
    const supported = A && (isReward ? A.isRewardedSupported : A.isInterstitialSupported);
    if (!supported || pendingAd) { done(false); return; }

    if (window.CST && CST.Ads) CST.Ads.busy = true;
    PLATFORM.setPaused('ad', true);
    send('gameplay_stopped');
    // nothing ever opens -> give the game back (rewarded 15 s, interstitial 10 s)
    pendingAd = { type, done, opened: false, rewarded: false,
      timer: setTimeout(() => { if (pendingAd && !pendingAd.opened) finishAd(false); }, isReward ? 15000 : 10000) };
    try {
      if (isReward) A.showRewarded('reward'); else A.showInterstitial('level_end');
    } catch (e) { console.warn('[Playgama] show ad threw:', e); finishAd(false); }
  }

  function hookGame() {
    if (!(window.CST && CST.Ads)) return;
    CST.Ads.play = playAd;
    // the TikTok-only test overlay must never appear on Playgama
    CST.Ads.mock = (type, end) => end(false);
  }

  Object.assign(PLATFORM, {
    name: 'playgama',

    async init() {
      B = (typeof bridge !== 'undefined' && bridge.initialize) ? bridge : null;
      hookGame();
      if (!B) { console.warn('[Playgama] Bridge SDK missing, running on localStorage'); PLATFORM.markReady(); return true; }

      try {
        await B.initialize();
        console.log('[Playgama] bridge.initialize() complete');

        // Platform asks the game to pause / mute. Payloads are booleans.
        B.platform.on(ev('PAUSE_STATE_CHANGED'), isPaused => PLATFORM.setPaused('platform', !!isPaused));
        B.platform.on(ev('AUDIO_STATE_CHANGED'), isEnabled => PLATFORM.setMuted('platform', !isEnabled));
        try {
          if (B.platform.isPaused) PLATFORM.setPaused('platform', true);
          if (B.platform.isAudioEnabled === false) PLATFORM.setMuted('platform', true);
        } catch (e) { }

        // Ad results arrive as state events: opened / rewarded / closed / failed
        B.advertisement.on(ev('INTERSTITIAL_STATE_CHANGED'), state => {
          if (!pendingAd || pendingAd.type === 'reward') return;
          if (state === 'opened') pendingAd.opened = true;
          else if (state === 'closed' || state === 'failed') finishAd(state === 'closed');
        });
        B.advertisement.on(ev('REWARDED_STATE_CHANGED'), state => {
          if (!pendingAd || pendingAd.type !== 'reward') return;
          if (state === 'opened') pendingAd.opened = true;
          else if (state === 'rewarded') pendingAd.rewarded = true;          // grant only on 'rewarded'
          else if (state === 'closed' || state === 'failed') finishAd(pendingAd.rewarded);
        });
      } catch (e) {
        console.error('[Playgama] init failed:', e);
      }

      PLATFORM.markReady();
      send('game_ready');          // string, not {type: ...}
      send('gameplay_started');
      return true;
    },

    async onGameReady() { send('game_ready'); },
    async onGameStart() { send('gameplay_started'); },
    async onGameStop() { send('gameplay_stopped'); },

    async load() {
      if (B && B.storage) {
        try { const d = await B.storage.get(SAVE_KEY); if (d) return typeof d === 'string' ? JSON.parse(d) : d; } catch (e) { }
      }
      try { const d = localStorage.getItem(SAVE_KEY); return d ? JSON.parse(d) : null; } catch (e) { return null; }
    },

    async save(data) {
      const s = JSON.stringify(data);
      try { localStorage.setItem(SAVE_KEY, s); } catch (e) { }
      if (B && B.storage) { try { await B.storage.set(SAVE_KEY, s); } catch (e) { } }
      return true;
    },

    async showAd(type = 'interstitial') {
      return new Promise(res => playAd(type === 'rewarded' ? 'reward' : 'inter', ok => res({ success: ok })));
    },
    async canShowAd(type = 'interstitial') {
      const A = B && B.advertisement;
      return !!(A && (type === 'rewarded' ? A.isRewardedSupported : A.isInterstitialSupported));
    },

    async share(message) {
      if (!navigator.share) return false;
      try { await navigator.share({ title: 'Meow Sushi', text: message || 'Play Meow Sushi!' }); return true; } catch (e) { return false; }
    },
  });
})();
