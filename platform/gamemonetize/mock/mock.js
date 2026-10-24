/* Mock GameMonetize SDK for local testing
   GameMonetize: Banner ads only, no rewarded, localStorage storage. */

(function initMockGameMonetize() {
  console.log('[MockGameMonetize] Initializing mock SDK');

  // Mock GameMonetize SDK
  window.gameMonetize = {
    onGameReady: function() {
      console.log('[MockGameMonetize] onGameReady called');
    },

    showBannerAd: async function() {
      console.log('[MockGameMonetize] showBannerAd called');
      // Simulate banner ad display
      return new Promise(resolve => {
        console.log('[MockGameMonetize] Showing mock banner ad (2s)');
        setTimeout(() => {
          console.log('[MockGameMonetize] Banner ad closed');
          resolve();
        }, 2000);
      });
    }
  };

  // Debug utilities
  window.__gamemonetize_debug = {
    storage: localStorage,

    hidePage() {
      const event = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
        configurable: true,
      });
      document.dispatchEvent(event);
      console.log('[MockGameMonetize] Page hidden (pause triggered)');
    },

    showPage() {
      const event = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
        configurable: true,
      });
      document.dispatchEvent(event);
      console.log('[MockGameMonetize] Page visible (resume triggered)');
    },

    viewSave() {
      const save = localStorage.getItem('gm_meow_save');
      if (save) {
        console.log('[MockGameMonetize] Saved game:', JSON.parse(save));
      } else {
        console.log('[MockGameMonetize] No saved game found');
      }
    },

    clearSave() {
      localStorage.removeItem('gm_meow_save');
      localStorage.removeItem('gm_audio_setting');
      console.log('[MockGameMonetize] Storage cleared');
    },

    showBannerAd() {
      return window.gameMonetize.showBannerAd();
    }
  };

  console.log('[MockGameMonetize] Ready. Use window.__gamemonetize_debug for testing');
})();
