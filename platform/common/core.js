/* Platform abstraction layer: game-agnostic interface for save, ads, pause, etc.
   Each platform (playgama, crazygames, etc) overrides this with SDK-specific implementation. */

const PLATFORM = {
  name: 'unknown',

  // ========== Initialization ==========
  ready: false,
  _readyResolve: null,

  markReady() {
    console.log('[PLATFORM] ✅ Ready');
    this.ready = true;
    if (this._readyResolve) {
      this._readyResolve();
    }
  },

  waitReady() {
    if (this.ready) return Promise.resolve();
    return new Promise(resolve => {
      this._readyResolve = resolve;
    });
  },

  // ========== Lifecycle ==========
  async init() {
    console.warn('[PLATFORM] init() not implemented');
  },

  async onGameReady() {
    console.log('[PLATFORM] game ready');
  },

  async onGameStart() {
    console.log('[PLATFORM] game started');
  },

  async onGameStop() {
    console.log('[PLATFORM] game stopped');
  },

  // ========== Storage & Save ==========
  /** Load game state from backend (or localStorage fallback) */
  async load() {
    try {
      const data = localStorage.getItem('meow_save');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[PLATFORM] load error:', e);
      return null;
    }
  },

  /** Save game state to backend (or localStorage fallback) */
  async save(data) {
    try {
      localStorage.setItem('meow_save', JSON.stringify(data));
      console.log('[PLATFORM] save OK');
      return true;
    } catch (e) {
      console.error('[PLATFORM] save error:', e);
      return false;
    }
  },

  // ========== Game State ==========
  // The game loop stops while APP.paused is true; CST.Audio.muted is a transient mute.
  // CST.Audio.on is the PLAYER's sound setting and must never be touched here.
  // Several sources can pause/mute at once (platform overlay, platform audio, an ad), so track reasons.
  _pauseBy: {},
  _muteBy: {},
  _apply() {
    const paused = Object.values(this._pauseBy).some(Boolean);
    const muted = paused || Object.values(this._muteBy).some(Boolean);
    if (window.APP) window.APP.paused = paused;
    if (window.CST && window.CST.Audio) window.CST.Audio.muted = muted;
  },
  setPaused(reason, on) { this._pauseBy[reason] = !!on; this._apply(); },
  setMuted(reason, on) { this._muteBy[reason] = !!on; this._apply(); },

  /** Platform asks the game to pause (overlay, hidden tab) */
  pause() { console.log('[PLATFORM] pause'); this.setPaused('platform', true); },
  /** Platform lets the game run again */
  resume() { console.log('[PLATFORM] resume'); this.setPaused('platform', false); },

  // ========== Ads ==========
  /** Show ad: 'banner' | 'interstitial' | 'rewarded' */
  async showAd(type = 'interstitial') {
    console.log('[PLATFORM] showAd:', type);
    return { success: false, reason: 'no_implementation' };
  },

  /** Check if ad is available */
  async canShowAd(type = 'interstitial') {
    console.log('[PLATFORM] canShowAd:', type);
    return false;
  },

  // ========== Social ==========
  /** Share game to friend (platform-specific) */
  async share(message) {
    console.log('[PLATFORM] share:', message);
    return false;
  },

  // ========== Utilities ==========
  log(msg) {
    console.log(`[${this.name.toUpperCase()}]`, msg);
  },
};

// Hook into game's save/pause events
(function hookGameEvents() {
  if (typeof window !== 'undefined' && window.CST) {
    const originalSave = window.CST.Game.prototype.save;
    if (originalSave) {
      window.CST.Game.prototype.save = function() {
        originalSave.call(this);
        PLATFORM.save(this.S); // Auto-save to platform backend
      };
    }
  }
})();

// Task title on one line like the TikTok native card: shrink 14px -> 10.5px to fit, then CSS ellipsis.
(function fitTaskTitle() {
  if (typeof document === 'undefined') return;
  const fit = el => {
    let s = 14; el.style.fontSize = s + 'px';
    while (el.scrollWidth > el.clientWidth + 1 && s > 10.5) { s -= 0.5; el.style.fontSize = s + 'px'; }
  };
  const start = () => {
    const el = document.getElementById('taskText'); if (!el) return;
    new MutationObserver(() => fit(el)).observe(el, { childList: true, characterData: true, subtree: true });
    window.addEventListener('resize', () => fit(el));
    fit(el);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

console.log('[PLATFORM] Core loaded. Name:', PLATFORM.name);
