// =============================================================================
//  generate_shorts_overlays.js — Minimalist Vertical Shorts Overlays (1080x1920)
//  Part of skill: reallens-horror-animator
//  Dynamically generates overlays (overlay_single.png / overlay_event_01.png ..)
//  matching shorts_planner.js (each clip 45-60s, event-based cuts by default).
//  STRICTLY Video Title ONLY (NO red/orange pill, zero yellow header, zero
//  2nd status pill, zero bottom rule card!).
//
//  Usage:
//    node generate_shorts_overlays.js [--format events|single|two_part|all] [--max-sec 58] [--min-sec 45] [--allow-over-60]
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
const epJsPath = path.join(projectDir, 'episode.js');
if (fs.existsSync(epJsPath)) {
  try {
    const epMod = require(epJsPath);
    if (!cfg.SHORTS_TITLE && !cfg.shortsTitle && (epMod.SHORTS_TITLE || epMod.shortsTitle)) cfg.SHORTS_TITLE = epMod.SHORTS_TITLE || epMod.shortsTitle;
    if (!cfg.SHORTS_SUB_HOOK && !cfg.shortsSubHook && (epMod.SHORTS_SUB_HOOK || epMod.shortsSubHook)) cfg.SHORTS_SUB_HOOK = epMod.SHORTS_SUB_HOOK || epMod.shortsSubHook;
    if (!cfg.TITLE_RED_LINE && !cfg.titleRedLine && (epMod.TITLE_RED_LINE || epMod.titleRedLine)) cfg.TITLE_RED_LINE = epMod.TITLE_RED_LINE || epMod.titleRedLine;
  } catch (_) {}
}

const maxSec = Number(getArg('--max-sec') || cfg.maxSec || 58);
const minSec = Number(getArg('--min-sec') || cfg.minSec || 45);
const format = getArg('--format') || cfg.shortsFormat || undefined;
const allowOver60 = hasFlag('--allow-over-60') || Boolean(cfg.allowOver60);
const onlyEvents = hasFlag('--events-only');

function deriveOverlays() {
  const { planShortsEpisodes, saveShortsPlan } = loadPlanner(projectDir);
  const planned = planShortsEpisodes(tl, cfg, { maxSec, minSec, allowOver60, format });
  saveShortsPlan(projectDir, planned);

  const selected = onlyEvents ? planned.filter(x => x.isEvent) : planned;
  const manualOverlays = Array.isArray(cfg.overlays) ? cfg.overlays : [];
  return selected.map((item, idx) => {
    const manual = (!onlyEvents && manualOverlays[idx]) ? manualOverlays[idx] : {};
    const tag = item.tag || (item.isEvent ? `event_${String(item.ep).padStart(2, '0')}` : (item.isSingle ? 'single' : `ep${item.ep}`));
    return {
      ep: item.ep,
      tag,
      isSingle: Boolean(item.isSingle),
      isEvent: Boolean(item.isEvent),
      dur: item.dur,
      title: manual.title || item.title,
      titleTop: manual.titleTop || item.titleTop,
      titleBot: manual.titleBot || item.titleBot,
      titleRedLine: manual.titleRedLine || item.titleRedLine || 1,
      badge: manual.badge || item.badge || '',
      file: manual.file || item.overlayFile || `overlay_${tag}.png`
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

    function stripEpPrefixJs(s) {
      return String(s || '')
        .split('|')[0]
        .replace(/^(?:EP\.?\\s*\\d+(?:\\s*\\([^)]*\\))?|ตอนที่\\s*\\d+|เหตุการณ์\\s*(?:ที่|#)?\\s*\\d+|ตอนจบ|ตอนเดียวจบ|จบใน\\s*\\d*\\s*คลิป(?:\\s*เดียว)?)\\s*[:·\\-–—]?\\s*/i, '')
        .replace(/\\s+/g, ' ')
        .trim();
    }

    function splitTitleTwoLinesJs(rawTitle) {
      const s = stripEpPrefixJs(rawTitle);
      if (!s) return ['เหตุการณ์หลอน', 'ห้ามพลาด!'];
      const words = s.split(/\\s+/).filter(Boolean);
      if (words.length >= 2) {
        const mid = Math.ceil(words.length / 2);
        return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
      }
      if (s.length <= 10) return [s, 'ห้ามพลาด!'];
      const mid = Math.ceil(s.length * 0.54);
      return [s.slice(0, mid), s.slice(mid)];
    }

    function drawStrokedHeadlineLine(ctx, text, cx, y, sz, fillCol) {
      ctx.save();
      ctx.font = '900 ' + sz + 'px "Kanit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = 16;
      ctx.strokeStyle = '#000000';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.90)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 5;
      ctx.strokeText(text, cx, y);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = fillCol;
      ctx.fillText(text, cx, y);
      ctx.restore();
    }

    window.renderOverlay = function(data) {
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');
      const W = 1080, H = 1920;
      ctx.clearRect(0, 0, W, H);

      // Subtle top readability scrim ONLY (y = 430..1920 stays 100% transparent for Full-Screen 9:16 video!)
      const topGrad = ctx.createLinearGradient(0, 0, 0, 430);
      topGrad.addColorStop(0, 'rgba(6, 11, 20, 0.58)');
      topGrad.addColorStop(0.68, 'rgba(6, 11, 20, 0.22)');
      topGrad.addColorStop(1, 'rgba(6, 11, 20, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 430);

      const safeCx = W / 2;
      const fallbackPair = splitTitleTwoLinesJs(data.title);
      const line1 = stripEpPrefixJs(data.titleTop) || fallbackPair[0];
      const line2 = stripEpPrefixJs(data.titleBot) || fallbackPair[1];
      const redLine = Number(data.titleRedLine) === 2 ? 2 : 1;
      const col1 = redLine === 1 ? '#ef4444' : '#ffffff';
      const col2 = redLine === 2 ? '#ef4444' : '#ffffff';

      // Clean 2-Line Two-Tone Title (Red + White alternating, zero "EP" prefix, NO red/orange pill below!)
      const sz1 = fitFont(ctx, line1, 920, 94, 46, 900);
      const sz2 = fitFont(ctx, line2, 940, 98, 46, 900);
      drawStrokedHeadlineLine(ctx, line1, safeCx, 252, sz1, col1);
      drawStrokedHeadlineLine(ctx, line2, safeCx, 368, sz2, col2);
      // NOTE: Red/orange EP/badge pill under the title is intentionally DISABLED.
    };
  </script>
</body>
</html>`;

(async () => {
  console.log(`=== Generating ${EP_OVERLAYS.length} Minimalist Shorts Overlays (1080x1920, <= ${allowOver60 ? maxSec : Math.min(maxSec, 60)}s/clip) ===`);
  for (const item of EP_OVERLAYS) {
    const label = item.isSingle ? 'Single' : (item.isEvent ? `Event #${item.ep}` : `EP ${item.ep}`);
    console.log(`  · ${label} (${Number(item.dur || 0).toFixed(1)}s): ${item.titleTop || item.title} / ${item.titleBot || ''} -> ${item.file}`);
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
