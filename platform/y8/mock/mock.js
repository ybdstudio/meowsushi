/* Mock Y8 SDK for local testing
   Y8: Multiple ad types, cloud storage, game + app ID. */

(function initMockY8() {
  console.log('[MockY8] Initializing mock SDK');

  // Mock Y8 SDK
  window.y8 = {
    gameId: 'meow_sushi',
    appId: 'meow_sushi',
    cloudStorage: {},
    adRequests: 0,

    onGameStart: function() {
      console.log('[MockY8] onGameStart called');
    },

    gameReady: function() {
      console.log('[MockY8] gameReady called');
    },

    onGameStop: function() {
      console.log('[MockY8] onGameStop called');
    },

    showAds: async function(type) {
      console.log('[MockY8] showAds:', type);
      this.adRequests++;

      // Simulate different ad types
      const duration = type === 'interstitial' ? 3000 : type === 'reward' ? 3000 : 2000;

      return new Promise(resolve => {
        console.log(`[MockY8] Showing ${type} ad (${duration / 1000}s)`);
        setTimeout(() => {
          console.log('[MockY8] Ad finished');
          resolve({ finished: true });
        }, duration);
      });
    },

    saveData: async function(gameId, data) {
      console.log(`[MockY8] saveData('${gameId}', <${data.length} bytes>)`);
      this.cloudStorage[gameId] = data;
      return Promise.resolve();
    },

    loadData: async function(gameId) {
      console.log(`[MockY8] loadData('${gameId}')`);
      const data = this.cloudStorage[gameId];
      if (data) {
        console.log(`[MockY8] loadData returned ${data.length} bytes`);
      }
      return Promise.resolve(data || null);
    },

    shareGame: async function(message) {
      console.log('[MockY8] shareGame:', message);
      return Promise.resolve();
    }
  };

  // Debug utilities
  window.__y8_debug = {
    storage: localStorage,
    cloudStorage: window.y8.cloudStorage,

    hidePage() {
      const event = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
        configurable: true,
      });
      document.dispatchEvent(event);
      console.log('[MockY8] Page hidden (pause triggered)');
    },

    showPage() {
      const event = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
        configurable: true,
      });
      document.dispatchEvent(event);
      console.log('[MockY8] Page visible (resume triggered)');
    },

    viewSave() {
      const save = localStorage.getItem('y8_meow_save');
      if (save) {
        console.log('[MockY8] Local save:', JSON.parse(save));
      } else {
        console.log('[MockY8] No local save found');
      }

      const cloudSave = window.y8.cloudStorage['meow_sushi'];
      if (cloudSave) {
        console.log('[MockY8] Cloud save:', JSON.parse(cloudSave));
      } else {
        console.log('[MockY8] No cloud save found');
      }
    },

    clearSave() {
      localStorage.removeItem('y8_meow_save');
      localStorage.removeItem('y8_audio_setting');
      delete window.y8.cloudStorage['meow_sushi'];
      console.log('[MockY8] Storage cleared');
    },

    showAd(type = 'interstitial') {
      return window.y8.showAds(type);
    },

    getAdCount() {
      console.log('[MockY8] Total ad requests:', window.y8.adRequests);
      return window.y8.adRequests;
    }
  };

  console.log('[MockY8] Ready. Use window.__y8_debug for testing');
})();
