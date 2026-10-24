/* Y8 platform integration
   Y8 SDK: Multiple ad types, saveData/loadData API, game + app ID required
   Storage: Cloud (saveData/loadData) + localStorage fallback
   Pause: Page visibility API
   */

(function initY8() {
  console.log('[Y8] Initializing');

  // Y8 configuration (get from Y8 dashboard)
  const Y8_GAME_ID = 'meow_sushi';  // Set via dashboard
  const Y8_APP_ID = 'meow_sushi';   // Set via dashboard

  // Override PLATFORM with Y8 implementation
  Object.assign(PLATFORM, {
    name: 'y8',

    // ========== Lifecycle ==========
    async init() {
      console.log('[Y8] init()');
      PLATFORM.markReady();   // nothing in the game waits on the SDK; never block startup
      // Wait for Y8 SDK to load
      if (typeof y8 !== 'undefined') {
        console.log('[Y8] SDK loaded');
        try {
          // Initialize Y8
          if (y8.onGameStart) {
            y8.onGameStart();
          }
          return true;
        } catch (e) {
          console.warn('[Y8] init failed:', e);
          return true; // Still continue even if SDK init fails
        }
      }
      console.warn('[Y8] SDK not available (expected at runtime)');
      return true;
    },

    async onGameReady() {
      console.log('[Y8] game ready');
      if (typeof y8 !== 'undefined' && y8.gameReady) {
        try {
          y8.gameReady();
        } catch (e) {
          console.warn('[Y8] gameReady failed:', e);
        }
      }
    },

    async onGameStart() {
      console.log('[Y8] gameplay started');
      if (typeof y8 !== 'undefined' && y8.onGameStart) {
        try {
          y8.onGameStart();
        } catch (e) {
          console.warn('[Y8] onGameStart failed:', e);
        }
      }
    },

    async onGameStop() {
      console.log('[Y8] gameplay stopped');
      if (typeof y8 !== 'undefined' && y8.onGameStop) {
        try {
          y8.onGameStop();
        } catch (e) {
          console.warn('[Y8] onGameStop failed:', e);
        }
      }
    },

    // ========== Storage ==========
    async load() {
      // Try Y8 cloud storage first (for signed-in players)
      if (typeof y8 !== 'undefined' && y8.loadData) {
        try {
          const cloudData = await y8.loadData(Y8_GAME_ID);
          if (cloudData) {
            console.log('[Y8] load from cloud storage');
            return JSON.parse(cloudData);
          }
        } catch (e) {
          console.warn('[Y8] cloud load failed:', e);
        }
      }

      // Fallback to localStorage
      try {
        const data = localStorage.getItem('y8_meow_save');
        if (data) {
          console.log('[Y8] load from localStorage (fallback)');
          return JSON.parse(data);
        }
      } catch (e) {
        console.error('[Y8] localStorage load failed:', e);
      }

      return null;
    },

    async save(data) {
      const saveStr = JSON.stringify(data);

      // Try Y8 cloud storage first
      if (typeof y8 !== 'undefined' && y8.saveData) {
        try {
          await y8.saveData(Y8_GAME_ID, saveStr);
          console.log('[Y8] save to cloud storage');
        } catch (e) {
          console.warn('[Y8] cloud save failed:', e);
        }
      }

      // Always save to localStorage as backup
      try {
        localStorage.setItem('y8_meow_save', saveStr);
        console.log('[Y8] save to localStorage (backup)');
        return true;
      } catch (e) {
        console.error('[Y8] localStorage save failed:', e);
        return false;
      }
    },

    // ========== Game State ==========


    // ========== Ads ==========
    // Y8: Multiple ad types (start, next, browse, reward)
    async showAd(type = 'interstitial') {
      console.log('[Y8] showAd:', type);

      if (typeof y8 === 'undefined' || !y8.showAds) {
        console.warn('[Y8] SDK not available');
        return { success: false, reason: 'sdk_not_available' };
      }

      try {
        const result = await y8.showAds(type);
        console.log('[Y8] ad result:', result);
        return {
          success: result && result.finished,
          finished: result && result.finished
        };
      } catch (e) {
        console.error('[Y8] showAds failed:', e);
        return { success: false, reason: e.message };
      }
    },

    async canShowAd(type = 'interstitial') {
      // Y8: assume always ready (they manage throttling)
      return typeof y8 !== 'undefined' && y8.showAds !== undefined;
    },

    // ========== Social ==========
    async share(message) {
      console.log('[Y8] share:', message);
      // Y8 has share API
      if (typeof y8 !== 'undefined' && y8.shareGame) {
        try {
          await y8.shareGame(message);
          return true;
        } catch (e) {
          console.warn('[Y8] share failed:', e);
          return false;
        }
      }
      // Fallback to Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Meow Sushi',
            text: message || 'Check out Meow Sushi on Y8!',
          });
          return true;
        } catch (e) {
          console.warn('[Y8] share cancelled:', e);
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

  console.log('[Y8] Adapter loaded and ready');
})();
