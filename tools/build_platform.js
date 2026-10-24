#!/usr/bin/env node
/**
 * Build script for porting Meow Sushi to multiple web platforms.
 *
 * Usage:
 *   node tools/build_platform.js playgama [--mock] [--out dist/playgama]
 *   node tools/build_platform.js crazygames [--out dist/crazygames]
 *
 * Options:
 *   --mock      Use mock SDK instead of real Bridge (for local testing)
 *   --out PATH  Output directory (default: dist/{platform})
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse CLI args
const args = process.argv.slice(2);
const platform = args[0] || 'playgama';
const isMock = args.includes('--mock');
const outDir = (() => {
  const idx = args.indexOf('--out');
  return idx >= 0 ? args[idx + 1] : `dist/${platform}`;
})();

console.log(`🏗️  Building Meow Sushi for ${platform}`);
console.log(`   Mock SDK: ${isMock ? 'YES' : 'NO'}`);
console.log(`   Output: ${outDir}`);

// Paths
const srcDir = path.join(__dirname, '..');
// Game source: --src <dir>, else the git repo (single source of truth shared with the TikTok native build),
// else the old sibling copy. Building from a stale copy once shipped outdated ad pacing + UI.
// Game source: --src <dir>, else this repository (the game's index.html + js/ sit at the repo root).
const gameDir = (() => {
  const i = args.indexOf('--src'); if (i >= 0) return path.resolve(args[i + 1]);
  return srcDir;
})();
console.log(`   Source: ${gameDir}`);
const platformDir = path.join(srcDir, 'platform');
const commonDir = path.join(platformDir, 'common');
const specificDir = path.join(platformDir, platform);

// Check that source exists
if (!fs.existsSync(gameDir)) {
  console.error(`❌ Game source not found: ${gameDir}`);
  process.exit(1);
}

if (!fs.existsSync(specificDir)) {
  console.error(`❌ Platform not found: ${specificDir}`);
  console.error(`   Available: ${fs.readdirSync(platformDir).join(', ')}`);
  process.exit(1);
}

// Create output dir
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// ========== Build game.js bundle ==========
console.log('\n📦 Bundling JavaScript...');

const bundleParts = [
  // 1. Platform abstraction core
  fs.readFileSync(path.join(commonDir, 'core.js'), 'utf8'),
  '\n',

  // 2. Platform-specific implementation
  fs.readFileSync(path.join(specificDir, `${platform}.js`), 'utf8'),
  '\n',

  // 3. Game modules (from original HTML)
  ...(fs.existsSync(path.join(gameDir, 'index.html'))
    ? parseScriptTags(path.join(gameDir, 'index.html')).map(scriptPath => {
        const fullPath = path.join(gameDir, scriptPath);
        if (!fs.existsSync(fullPath)) {
          console.warn(`   ⚠️  Script not found: ${scriptPath}`);
          return '';
        }
        return fs.readFileSync(fullPath, 'utf8') + '\n';
      })
    : [])
];

const bundled = bundleParts.join('');
const bundlePath = path.join(outDir, 'game.js');
fs.writeFileSync(bundlePath, bundled);
console.log(`   ✓ game.js (${(bundled.length / 1024).toFixed(1)} KB)`);

// ========== Copy CSS ==========
console.log('\n🎨 Copying styles...');

const cssDir = path.join(outDir, 'css');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}

const srcCssDir = path.join(gameDir, 'css');
if (fs.existsSync(srcCssDir)) {
  fs.readdirSync(srcCssDir).forEach(file => {
    if (file.endsWith('.css')) {
      const content = fs.readFileSync(path.join(srcCssDir, file), 'utf8');
      fs.writeFileSync(path.join(cssDir, file), content);
      console.log(`   ✓ ${file}`);
    }
  });
}

// Web-platform CSS overrides (e.g. compact task card) appended to style.css
const webCss = path.join(commonDir, 'web.css');
if (fs.existsSync(webCss) && fs.existsSync(path.join(cssDir, 'style.css'))) {
  fs.appendFileSync(path.join(cssDir, 'style.css'), '\n' + fs.readFileSync(webCss, 'utf8'));
  console.log('   ✓ web.css appended');
}

// ========== Copy assets ==========
console.log('\n🖼️  Copying assets...');

const assetsDir = path.join(outDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const srcAssetsDir = path.join(gameDir, 'assets');
if (fs.existsSync(srcAssetsDir)) {
  copyDirRecursive(srcAssetsDir, assetsDir);
  const fileCount = countFiles(assetsDir);
  console.log(`   ✓ ${fileCount} assets`);
}

// ========== Copy/Create index.html ==========
console.log('\n📄 Creating index.html...');

let indexContent = fs.readFileSync(path.join(specificDir, 'index.html'), 'utf8');

// If mock mode, inject mock SDK before real Bridge script
if (isMock) {
  const mockPath = path.join(platformDir, platform, 'mock', 'mock.js');
  if (fs.existsSync(mockPath)) {
    const mockScript = fs.readFileSync(mockPath, 'utf8');
    const mockTag = `\n<!-- Mock ${platform} Bridge SDK (local testing) -->\n<script>\n${mockScript}\n</script>\n`;

    // Replace the real Bridge script tag with the mock
    indexContent = indexContent.replace(
      /<script src="https:\/\/bridge\.playgama\.com\/[^"]+"><\/script>/,
      mockTag
    );
    console.log(`   ✓ Injected mock Bridge SDK`);
  }
}

fs.writeFileSync(path.join(outDir, 'index.html'), indexContent);
console.log(`   ✓ index.html`);

// ========== Copy platform config files (e.g. playgama-bridge-config.json) ==========
fs.readdirSync(specificDir).filter(f => f.endsWith('.json')).forEach(f => {
  fs.copyFileSync(path.join(specificDir, f), path.join(outDir, f));
  console.log(`   ✓ ${f}`);
});

// ========== Summary ==========
console.log(`\n✅ Build complete!`);
console.log(`\n📂 Output directory: ${path.resolve(outDir)}`);
console.log(`\n🚀 To test locally:`);
if (isMock) {
  console.log(`   python3 -m http.server 8000 --directory ${path.resolve(outDir)}`);
  console.log(`   Open http://localhost:8000`);
} else {
  console.log(`   Upload to ${platform} portal or test via game launcher`);
}

// ========== Utilities ==========

function parseScriptTags(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const regex = /<script\s+src="([^"]+)"><\/script>/g;
  const scripts = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }

  return scripts;
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function countFiles(dir) {
  let count = 0;

  function walk(d) {
    fs.readdirSync(d).forEach(file => {
      const p = path.join(d, file);
      if (fs.statSync(p).isDirectory()) {
        walk(p);
      } else {
        count++;
      }
    });
  }

  walk(dir);
  return count;
}
