/* Mock Playgama Bridge v2 SDK for local development/testing.
   Mimics real Bridge behavior for: storage, ads, pause/resume events. */

(function initMockBridge() {
  // If real bridge is already loaded, don't mock it
  if (typeof window !== 'undefined' && window.bridge) {
    console.log('[MockBridge] Real bridge detected, skipping mock');
    return;
  }

  console.log('[MockBridge] Initializing mock Playgama Bridge v2');

  // Simulated cloud storage
  const cloudStorage = {};

  // Simulated ad state
  let adRequests = 0;
  let lastAdTime = 0;

  // Mock bridge object
  window.bridge = {
    initialized: false,
    listeners: {},

    // ========== Lifecycle ==========
    async initialize() {
      console.log('[MockBridge] initialize()');
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async init
      this.initialized = true;
      console.log('[MockBridge] Initialized');
      return true;
    },

    // ========== Event System ==========
    addEventListener(event, callback) {
      console.log(`[MockBridge] addEventListener('${event}')`);
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    },

    removeEventListener(event, callback) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      }
    },

    emit(event, data) {
      console.log(`[MockBridge] emit('${event}')`, data);
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try {
            cb(data);
          } catch (e) {
            console.error(`[MockBridge] Error in ${event} listener:`, e);
          }
        });
      }
    },

    // ========== Storage API ==========
    storage: {
      async get(key) {
        console.log(`[MockBridge] storage.get('${key}')`);
        await new Promise(resolve => setTimeout(resolve, 50));
        const value = cloudStorage[key];
        if (value) {
          console.log(`[MockBridge] storage.get returned ${value.length} bytes`);
        } else {
          console.log(`[MockBridge] storage.get returned null`);
        }
        return value || null;
      },

      async set(key, value) {
        console.log(`[MockBridge] storage.set('${key}', <${value.length} bytes>)`);
        await new Promise(resolve => setTimeout(resolve, 50));
        cloudStorage[key] = value;
        console.log(`[MockBridge] storage.set OK`);
        return true;
      },

      async remove(key) {
        console.log(`[MockBridge] storage.remove('${key}')`);
        await new Promise(resolve => setTimeout(resolve, 50));
        delete cloudStorage[key];
        return true;
      },

      async clear() {
        console.log(`[MockBridge] storage.clear()`);
        await new Promise(resolve => setTimeout(resolve, 50));
        Object.keys(cloudStorage).forEach(key => delete cloudStorage[key]);
        return true;
      }
    },

    // ========== Platform API ==========
    platform: {
      async sendMessage(msg) {
        console.log('[MockBridge] platform.sendMessage()', msg);
        await new Promise(resolve => setTimeout(resolve, 20));
        return { success: true };
      },

      async showInterstitial() {
        console.log('[MockBridge] platform.showInterstitial()');
        adRequests++;

        // Throttle ads: max once per 3 seconds
        const now = Date.now();
        if (now - lastAdTime < 3000) {
          console.warn('[MockBridge] Ad throttled (need 3s between ads)');
          return { success: false, error: 'throttled' };
        }

        lastAdTime = now;

        // Simulate ad display
        return new Promise(resolve => {
          console.log('[MockBridge] Showing mock interstitial ad (3s)');
          setTimeout(() => {
            console.log('[MockBridge] Mock interstitial closed');
            resolve({ success: true });
          }, 3000);
        });
      },

      async showRewarded() {
        console.log('[MockBridge] platform.showRewarded()');
        adRequests++;

        // Throttle ads: max once per 3 seconds
        const now = Date.now();
        if (now - lastAdTime < 3000) {
          console.warn('[MockBridge] Ad throttled (need 3s between ads)');
          return { success: false, error: 'throttled' };
        }

        lastAdTime = now;

        // Simulate ad display + reward
        return new Promise(resolve => {
          console.log('[MockBridge] Showing mock rewarded ad (3s)');
          setTimeout(() => {
            console.log('[MockBridge] Mock rewarded completed, user earned reward');
            resolve({ finished: true }); // Indicate user watched to completion
          }, 3000);
        });
      }
    },

    // ========== Utilities for Testing ==========
    __debug: {
      cloudStorage,
      adRequests,
      getStorageSize() {
        return Object.keys(cloudStorage).reduce((sum, k) => sum + (cloudStorage[k] || '').length, 0);
      },
      triggerPause() {
        window.bridge.emit('PAUSE_STATE_CHANGED', { paused: true });
      },
      triggerResume() {
        window.bridge.emit('PAUSE_STATE_CHANGED', { paused: false });
      },
      triggerAudioDisable() {
        window.bridge.emit('AUDIO_STATE_CHANGED', { enabled: false });
      },
      triggerAudioEnable() {
        window.bridge.emit('AUDIO_STATE_CHANGED', { enabled: true });
      }
    }
  };

  console.log('[MockBridge] Ready. Use window.bridge.__debug for testing utilities.');
})();
