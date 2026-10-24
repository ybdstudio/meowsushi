#!/usr/bin/env node
/**
 * Local testing helper for Playgama builds.
 *
 * Usage:
 *   node tools/test_platform.js playgama
 *   node tools/test_platform.js playgama --build-first
 *   node tools/test_platform.js playgama --port 9000
 *
 * Opens a local HTTP server at dist/{platform} and launches test page.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// Parse CLI args
const args = process.argv.slice(2);
const platform = args[0] || 'playgama';
const buildFirst = args.includes('--build-first');
const portArg = args.indexOf('--port');
const port = portArg >= 0 ? parseInt(args[portArg + 1]) : 8765;

const outDir = `dist/${platform}`;

// ========== Build if requested ==========
if (buildFirst) {
  console.log(`🔨 Building ${platform} with mock SDK...`);
  try {
    require('child_process').execSync(
      `node tools/build_platform.js ${platform} --mock --out ${outDir}`,
      { stdio: 'inherit', cwd: path.join(__dirname, '..') }
    );
  } catch (e) {
    console.error(`❌ Build failed`);
    process.exit(1);
  }
}

// Check if build exists
if (!fs.existsSync(path.join(__dirname, '..', outDir))) {
  console.error(`❌ Build not found: ${outDir}`);
  console.error(`   Run: node tools/build_platform.js ${platform} --mock --out ${outDir}`);
  process.exit(1);
}

// ========== Start HTTP server ==========
console.log(`\n🌐 Starting test server...`);

const fullPath = path.resolve(path.join(__dirname, '..', outDir));
const server = http.createServer((req, res) => {
  let filePath = path.join(fullPath, req.url === '/' ? 'index.html' : req.url);

  // Security: prevent directory traversal
  if (!filePath.startsWith(fullPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Serve file
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg'
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(port, 'localhost', () => {
  const url = `http://localhost:${port}`;
  console.log(`✓ Server running at ${url}\n`);

  // ========== Open in browser ==========
  console.log(`🎮 Testing instructions:`);
  console.log(`   1. Open ${url} in your browser`);
  console.log(`   2. Open DevTools (F12) to see console logs`);
  console.log(`   3. Test controls:`);
  console.log(`      - Drag to move (or WASD on desktop)`);
  console.log(`      - Tap/click buttons to test UI`);
  console.log(`   4. Test mock Bridge API (in DevTools console):`);
  console.log(`      - window.bridge.__debug.triggerPause()`);
  console.log(`      - window.bridge.__debug.triggerResume()`);
  console.log(`      - window.bridge.__debug.triggerAudioDisable()`);
  console.log(`      - window.bridge.__debug.triggerAudioEnable()`);
  console.log(`      - window.bridge.__debug.cloudStorage`);
  console.log(`\n📋 Logs will appear in DevTools Console (Network, Storage tabs too)\n`);

  // Try to open in browser (cross-platform)
  const openCmd = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' :
                  'xdg-open';

  try {
    spawn(openCmd, [url], { detached: true, stdio: 'ignore' }).unref();
    console.log(`🌐 Browser opening...`);
  } catch (e) {
    console.log(`📝 Open manually: ${url}`);
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
      console.log('✓ Done');
      process.exit(0);
    });
  });
});

// ========== Watch for rebuild (optional) ==========
if (process.argv.includes('--watch')) {
  console.log(`📁 Watching for changes...`);
  // Simple file watcher could go here
}
