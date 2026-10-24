/* Mock CrazyGames environment for local testing
   CrazyGames has no SDK - just localStorage storage and visibility handling. */

(function initMockCrazyGames() {
  console.log('[MockCrazyGames] Local testing environment initialized');

  // CrazyGames doesn't have an SDK object, just use standard web APIs
  // localStorage is already available globally

  // Add debug utilities for testing
  window.__crazygames_debug = {
    storage: localStorage,

    // Simulate page visibility changes (pause/resume)
    hidePage() {
      const event = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
        configurable: true,
      });
      document.dispatchEvent(event);
      console.log('[MockCrazyGames] Page hidden (pause triggered)');
    },

    showPage() {
      const event = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
        configurable: true,
      });
      document.dispatchEvent(event);
      console.log('[MockCrazyGames] Page visible (resume triggered)');
    },

    // View stored data
    viewSave() {
      const save = localStorage.getItem('cg_meow_save');
      if (save) {
        console.log('[MockCrazyGames] Saved game:', JSON.parse(save));
      } else {
        console.log('[MockCrazyGames] No saved game found');
      }
    },

    // Clear storage
    clearSave() {
      localStorage.removeItem('cg_meow_save');
      localStorage.removeItem('cg_audio_setting');
      console.log('[MockCrazyGames] Storage cleared');
    },
  };

  console.log('[MockCrazyGames] Debug utilities available at window.__crazygames_debug');
  console.log('[MockCrazyGames] Try: window.__crazygames_debug.hidePage(), showPage(), viewSave()');
})();
