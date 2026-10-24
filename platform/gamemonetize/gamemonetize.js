/* GameMonetize platform integration
   GameMonetize SDK: Limited ad support (banner only, no rewarded)
   Storage: localStorage (no cloud storage)
   Pause: Page visibility API
   */

(function initGameMonetize() {
  console.log('[GameMonetize] Initializing');

  // Override PLATFORM with GameMonetize implementation
  Object.assign(PLATFORM, {
    name: 'gamemonetize',

    // ========== Lifecycle ==========
    async init() {
      console.log('[GameMonetize] init()');
      PLATFORM.markReady();   // nothing in the game waits on the SDK; never block startup
      // Wait for SDK to be available
      if (typeof gameMonetize !== 'undefined') {
        console.log('[GameMonetize] SDK loaded');
        return true;
      }
      console.warn('[GameMonetize] SDK not available (expected at runtime)');
      return true;
    },

    async onGameReady() {
      console.log('[GameMonetize] game ready');
      // Notify GameMonetize that game is ready
      if (typeof gameMonetize !== 'undefined' && gameMonetize.onGameReady) {
        try {
          gameMonetize.onGameReady();
        } catch (e) {
          console.warn('[GameMonetize] onGameReady failed:', e);
        }
      }
    },

    async onGameStart() {
      console.log('[GameMonetize] gameplay started');
    },

    async onGameStop() {
      console.log('[GameMonetize] gameplay stopped');
    },

    // ========== Storage ==========
    async load() {
      try {
        const data = localStorage.getItem('gm_meow_save');
        if (data) {
          console.log('[GameMonetize] load from localStorage');
          return JSON.parse(data);
        }
      } catch (e) {
        console.error('[GameMonetize] localStorage load failed:', e);
      }
      return null;
    },

    async save(data) {
      try {
        localStorage.setItem('gm_meow_save', JSON.stringify(data));
        console.log('[GameMonetize] save to localStorage OK');
        return true;
      } catch (e) {
        console.error('[GameMonetize] localStorage save failed:', e);
        return false;
      }
    },

    // ========== Game State ==========


    // ========== Ads ==========
    // GameMonetize: Banner ads only (no rewarded, no interstitial)
    async showAd(type = 'banner') {
      console.log('[GameMonetize] showAd:', type);

      // GameMonetize only supports banner ads
      if (type === 'banner') {
        if (typeof gameMonetize !== 'undefined' && gameMonetize.showBannerAd) {
          try {
            await gameMonetize.showBannerAd();
            console.log('[GameMonetize] banner ad shown');
            return { success: true };
          } catch (e) {
            console.error('[GameMonetize] banner ad failed:', e);
            return { success: false, reason: e.message };
          }
        } else {
          console.warn('[GameMonetize] banner ad SDK not available');
          return { success: false, reason: 'sdk_not_available' };
        }
      }

      // Other ad types not supported
      console.warn('[GameMonetize] Ad type not supported:', type);
      return { success: false, reason: 'unsupported_type' };
    },

    async canShowAd(type = 'banner') {
      // GameMonetize: banner ads available
      if (type === 'banner') {
        return typeof gameMonetize !== 'undefined';
      }
      return false;
    },

    // ========== Social ==========
    async share(message) {
      console.log('[GameMonetize] share:', message);
      // GameMonetize doesn't have built-in share
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Meow Sushi',
            text: message || 'Check out Meow Sushi!',
          });
          return true;
        } catch (e) {
          console.warn('[GameMonetize] share cancelled:', e);
          return false;
        }
      }
      return false;
    },
  });

  // ========== Auto-pause on visibility change ==========
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      PLATFORM.pause();
    } else {
      PLATFORM.resume();
    }
  });

  console.log('[GameMonetize] Adapter loaded and ready');
})();
