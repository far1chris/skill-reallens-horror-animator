// =============================================================================
//  generate_shorts_overlays.js — Minimalist Vertical Shorts Overlays (1080x1920)
//  Part of skill: reallens-horror-animator
//  Dynamically generates overlays (shorts/overlay_ep1.png .. overlay_epN.png)
//  matching shorts_planner.js (each EP <= 58s, auto-splitting into EP 6, 7, 8+).
//  STRICTLY Video Title + Single Red EP Pill ONLY (zero yellow header, zero
//  2nd status pill, zero bottom rule card!).
//
//  Usage:
//    node generate_shorts_overlays.js [--max-sec 58] [--min-sec 22] [--allow-over-60]
// =============================================================================
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

function getArg(...flags) {
  for (const flag of flags) {
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  }
  return null;
}

const hasFlag = flag => process.argv.includes(flag);
const projectDir = path.resolve(getArg('--dir') || process.cwd());
const localReq = createRequire(
  fs.existsSync(path.join(projectDir, 'package.json'))
    ? path.join(projectDir, 'package.json')
    : path.join(projectDir, '_resolver.js')
);

function loadPuppeteer() {
  for (const r of [localReq, require]) {
    try { return r('puppeteer-core'); } catch (_) {}
    try { return r('puppeteer'); } catch (_) {}
  }
  throw new Error('puppeteer-core not found. Run: npm install puppeteer-core');
}

const puppeteer = loadPuppeteer();

function loadPlanner(projectDir) {
  for (const candidate of [
    path.join(projectDir, 'shorts_planner.js'),
    path.join(__dirname, 'shorts_planner.js'),
    path.join(__dirname, '..', 'scripts', 'shorts_planner.js')
  ]) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error('Missing shorts_planner.js — copy scripts/shorts_planner.js into your project folder.');
}

function findBrowserExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of candidates) { if (p && fs.existsSync(p)) return p; }
  return undefined;
}

const outDir = path.join(projectDir, 'shorts');
fs.mkdirSync(outDir, { recursive: true });

const tlPath = path.join(projectDir, 'timeline.json');
const tl = fs.existsSync(tlPath) ? JSON.parse(fs.readFileSync(tlPath, 'utf8')) : { title: 'Real Lens Survival Horror', scenes: [] };
const cfgPath = path.join(projectDir, 'shorts_config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};

const maxSec = Number(getArg('--max-sec') || cfg.maxSec || 58);
const minSec = Number(getArg('--min-sec') || cfg.minSec || 22);
const allowOver60 = hasFlag('--allow-over-60');

function deriveOverlays() {
  const { planShortsEpisodes, saveShortsPlan } = loadPlanner(projectDir);
  const planned = planShortsEpisodes(tl, cfg, { maxSec, minSec, allowOver60 });
  saveShortsPlan(projectDir, planned);

  const manualOverlays = Array.isArray(cfg.overlays) ? cfg.overlays : [];
  return planned.map((item, idx) => {
    const manual = manualOverlays[idx] || {};
    return {
      ep: item.ep,
      dur: item.dur,
      title: manual.title || item.title,
      badge: manual.badge || item.badge,
      file: manual.file || item.overlayFile || `overlay_ep${item.ep}.png`
    };
  });
}

const EP_OVERLAYS = deriveOverlays();

const HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @font-face { font-family: "Kanit"; font-weight: 400; src: url("../assets/fonts/kanit-thai-400-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 700; src: url("../assets/fonts/kanit-thai-700-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 900; src: url("../assets/fonts/kanit-thai-900-normal.woff2") format("woff2"); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1080px; height: 1920px; background: transparent; overflow: hidden; font-family: 'Kanit', sans-serif; }
    canvas { width: 1080px; height: 1920px; display: block; }
  </style>
</head>
<body>
  <canvas id="c" width="1080" height="1920"></canvas>
  <script>
    function fitFont(ctx, text, maxW, startSize, minSize, weight) {
      let sz = startSize;
      while (sz > minSize) {
        ctx.font = weight + ' ' + sz + 'px "Kanit", sans-serif';
        if (ctx.measureText(text).width <= maxW) break;
        sz -= 2;
      }
      return sz;
    }

    window.renderOverlay = function(data) {
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');
      const W = 1080, H = 1920;
      ctx.clearRect(0, 0, W, H);

      // Subtle top & bottom dark framing gradients ONLY (NO bottom card or extra text!)
      const topGrad = ctx.createLinearGradient(0, 0, 0, 540);
      topGrad.addColorStop(0, 'rgba(6, 11, 20, 0.96)');
      topGrad.addColorStop(0.75, 'rgba(8, 14, 27, 0.85)');
      topGrad.addColorStop(1, 'rgba(8, 14, 27, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 540);

      const btmGrad = ctx.createLinearGradient(0, 1184, 0, H);
      btmGrad.addColorStop(0, 'rgba(6, 11, 20, 0)');
      btmGrad.addColorStop(0.35, 'rgba(8, 14, 27, 0.85)');
      btmGrad.addColorStop(1, 'rgba(6, 11, 20, 0.96)');
      ctx.fillStyle = btmGrad;
      ctx.fillRect(0, 1184, W, H - 1184);

      const safeCx = W / 2;

      // 1. Video Title ONLY
      ctx.textAlign = 'center';
      const titleSz = fitFont(ctx, data.title, 960, 56, 34, 900);
      ctx.font = '900 ' + titleSz + 'px "Kanit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(220, 38, 38, 0.85)';
      ctx.shadowBlur = 18;
      ctx.fillText(data.title, safeCx, 305);
      ctx.shadowBlur = 0;

      // 2. Single Red EP Pill ONLY
      const pillW = 820;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(safeCx - pillW / 2, 345, pillW, 54, 27);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      const badgeSz = fitFont(ctx, data.badge, pillW - 48, 25, 16, 700);
      ctx.font = '700 ' + badgeSz + 'px "Kanit", sans-serif';
      ctx.fillText(data.badge, safeCx, 381);
    };
  </script>
</body>
</html>`;

(async () => {
  console.log(`=== Generating ${EP_OVERLAYS.length} Minimalist Shorts Overlays (1080x1920, <= ${allowOver60 ? maxSec : Math.min(maxSec, 60)}s/EP) ===`);
  for (const item of EP_OVERLAYS) {
    console.log(`  · EP ${item.ep} (${Number(item.dur || 0).toFixed(1)}s): ${item.badge} -> ${item.file}`);
  }
  const htmlPath = path.join(outDir, '_overlay_gen.html');
  fs.writeFileSync(htmlPath, HTML, 'utf8');
  const executablePath = findBrowserExecutable();
  const browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const canvasElem = await page.$('#c');
    for (const item of EP_OVERLAYS) {
      await page.evaluate(d => window.renderOverlay(d), item);
      const outPath = path.join(outDir, item.file);
      await canvasElem.screenshot({ path: outPath, omitBackground: true });
      console.log(`✓ Saved: ${item.file}`);
    }
  } finally {
    await browser.close();
    try { fs.unlinkSync(htmlPath); } catch (_) {}
  }
  console.log('🎉 All Shorts HUD overlays generated!');
})();
