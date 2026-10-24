# Meow Sushi - Multi-Platform Web Port

Vanilla JavaScript game ported from TikTok Minis native format to multiple web gaming platforms (Playgama, CrazyGames, GameDistribution, GameMonetize, Y8).

## Architecture

### Platform Abstraction Pattern

The project uses a **platform abstraction layer** to handle SDK differences while keeping game logic platform-agnostic:

```
┌─────────────────────────┐
│   Game Logic            │  ← Vanilla JS (no framework)
│ (canvas, DOM, events)   │
└────────────┬────────────┘
             │ calls
             ↓
┌─────────────────────────┐
│   PLATFORM interface    │  ← Common API
│   (core.js)             │
└────────────┬────────────┘
             │ overridden by
             ↓
┌─────────────────────────┐
│  Platform SDK adapter   │  ← Platform-specific (playgama.js, etc)
│  (storage, ads, pause)  │
└─────────────────────────┘
```

## Build & Test

### Local Testing with Mock SDK

```bash
# Build for Playgama with mock Bridge SDK (no real ads):
node tools/build_platform.js playgama --mock --out dist/playgama

# Start local test server (opens browser automatically):
node tools/test_platform.js playgama
```

This will:
- Open http://localhost:8765 in your browser
- Show [MockBridge] logs in console for all SDK calls
- Provide test utilities:
  - `window.bridge.__debug.triggerPause()`
  - `window.bridge.__debug.triggerResume()`
  - `window.bridge.__debug.triggerAudioDisable()`
  - `window.bridge.__debug.triggerAudioEnable()`
  - `window.bridge.__debug.cloudStorage` (view saved state)

### Production Build

```bash
# Build for Playgama with real Bridge SDK:
node tools/build_platform.js playgama --out dist/playgama

# Upload dist/playgama/ to Playgama portal
```

## PLATFORM Interface

All platform adapters implement this interface (see `platform/common/core.js`):

```javascript
const PLATFORM = {
  name: 'platform_name',
  
  // Lifecycle
  async init()              // Initialize SDK
  async onGameReady()       // Game loaded, ready to play
  async onGameStart()       // Gameplay started
  async onGameStop()        // Gameplay stopped
  
  // Storage
  async load()              // Load saved game state
  async save(data)          // Save game state
  
  // Game State
  pause()                   // Pause game + mute audio
  resume()                  // Resume game + restore audio
  
  // Ads
  async showAd(type)        // 'interstitial' or 'rewarded'
  async canShowAd(type)     // Check if ad available
  
  // Social
  async share(message)      // Share to friend
};
```

## Folder Structure

```
meow-sushi-web/
├── platform/
│   ├── common/
│   │   └── core.js                 # PLATFORM abstraction interface
│   │
│   ├── playgama/
│   │   ├── playgama.js             # Playgama Bridge v2 integration
│   │   ├── index.html              # Playgama HTML wrapper
│   │   └── mock/
│   │       └── mock.js             # Mock Bridge SDK for local testing
│   │
│   ├── crazygames/                 # (to be implemented)
│   ├── gamedistribution/           # (to be implemented)
│   ├── gamemonetize/               # (to be implemented)
│   └── y8/                         # (to be implemented)
│
├── tools/
│   ├── build_platform.js           # Build script (bundle + copy assets)
│   └── test_platform.js            # Local test server + browser launcher
│
└── dist/
    ├── playgama/                   # Build output
    │   ├── index.html
    │   ├── game.js                 # Concatenated bundle
    │   ├── css/
    │   └── assets/
    └── (other platforms)
```

## Platform Integration Checklist

For each new platform:

- [ ] Create `platform/{name}/{name}.js` with PLATFORM implementation
- [ ] Create `platform/{name}/index.html` wrapper
- [ ] Create `platform/{name}/mock/mock.js` for testing
- [ ] Build: `node tools/build_platform.js {name} --mock`
- [ ] Test locally: `node tools/test_platform.js {name}`
- [ ] Create account on platform
- [ ] Upload to platform portal
- [ ] Test on mobile device
- [ ] Configure ads in platform dashboard

## Playgama Status ✅

**COMPLETED:**
- ✅ Platform abstraction layer (core.js)
- ✅ Playgama Bridge v2 adapter (playgama.js)
- ✅ HTML wrapper with SDK injection (index.html)
- ✅ Mock Bridge SDK for local testing (mock.js)
- ✅ Build system (build_platform.js)
- ✅ Test server with browser launcher (test_platform.js)
- ✅ Local testing with mock SDK verified

**NEXT:**
- ⏳ Manual live testing on Playgama portal
- ⏳ Port to CrazyGames
- ⏳ Port to GameDistribution
- ⏳ Port to GameMonetize
- ⏳ Port to Y8

## Game Source

Original TikTok Minis game in `../meow-sushi-dev/`:
- Canvas-based 2D game (no framework)
- Vanilla JS + DOM hybrid UI
- ~3000 LOC across 12 modules
- All files bundled into single game.js

## Troubleshooting

**Build fails: "Game source not found"**
- Ensure `../meow-sushi-dev/index.html` exists
- Run from project root: `cd meow-sushi-web && node tools/...`

**Game doesn't load**
- Check browser console (F12) for errors
- Look for PLATFORM logs: `[PLATFORM]` in console
- Verify game.js was created (726 KB)

**Mock SDK not working**
- Build with `--mock` flag
- Look for `[MockBridge]` logs (not `[PLATFORM]`)
- Try: `window.bridge.__debug.triggerPause()`

**Local server won't start**
- Check port 8765 is available
- Try different port: `node tools/test_platform.js playgama --port 9000`
