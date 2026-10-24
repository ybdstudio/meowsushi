/* CrazyGames platform integration
   CrazyGames has no official SDK - games communicate via:
   1. localStorage (storage)
   2. Manual ad management (CrazyGames shows ads, game just notifies lifecycle)
   3. No pause/resume events (CrazyGames handles this)
   */

(function initCrazyGames() {
  console.log('[CrazyGames] Initializing');

  // Override PLATFORM with CrazyGames implementation
  Object.assign(PLATFORM, {
    name: 'crazygames',

    // ========== Lifecycle ==========
    async init() {
      console.log('[CrazyGames] init()');
      // Basic Launch: no SDK, and NO ads of any kind (CrazyGames rule).
      // Every ad entry point in the game checks CST.Ads.enabled, so this hides all
      // "watch ad" chips / rush offers; the TikTok test overlay is disabled as a safety net.
      if (window.CST && CST.Ads) {
        CST.Ads.enabled = false;
        CST.Ads.mock = (type, end) => end(false);
      }
      PLATFORM.markReady();
      return true;
    },

    async onGameReady() {
      console.log('[CrazyGames] game ready - can show ads now');
      // CrazyGames: game is ready to accept ad requests
    },

    async onGameStart() {
      console.log('[CrazyGames] gameplay started');
      // CrazyGames: notify that gameplay has started
    },

    async onGameStop() {
      console.log('[CrazyGames] gameplay stopped');
      // CrazyGames: notify that gameplay ended
    },

    // ========== Storage ==========
    async load() {
      try {
        const data = localStorage.getItem('cg_meow_save');
        if (data) {
          console.log('[CrazyGames] load from localStorage');
          return JSON.parse(data);
        }
      } catch (e) {
        console.error('[CrazyGames] localStorage load failed:', e);
      }
      return null;
    },

    async save(data) {
      try {
        localStorage.setItem('cg_meow_save', JSON.stringify(data));
        console.log('[CrazyGames] save to localStorage OK');
        return true;
      } catch (e) {
        console.error('[CrazyGames] localStorage save failed:', e);
        return false;
      }
    },

    // ========== Game State ==========
    // CrazyGames handles pause/resume automatically, but we mute audio on visibility change


    // ========== Ads ==========
    // CrazyGames doesn't have a built-in ads SDK
    // Games typically show ads at strategic points
    // For now, we return success but don't show actual ads
    async showAd(type = 'interstitial') {
      console.log('[CrazyGames] showAd:', type);
      // In a real implementation, you'd call CrazyGames ad endpoints
      // For now, just acknowledge the request
      return { success: true };
    },

    async canShowAd(type = 'interstitial') {
      // CrazyGames: always allow ads (they manage throttling)
      return true;
    },

    // ========== Social ==========
    async share(message) {
      console.log('[CrazyGames] share:', message);
      // CrazyGames doesn't have built-in share
      // Could use Web Share API instead
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Meow Sushi',
            text: message || 'Check out Meow Sushi!',
          });
          return true;
        } catch (e) {
          console.warn('[CrazyGames] share cancelled:', e);
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

  console.log('[CrazyGames] Adapter loaded and ready');
})();
