// =============================================================================
//  generate_shorts_overlays.js — Minimalist Vertical Shorts & Related Video CTA Overlays (1080x1920)
//  Part of skill: reallens-horror-animator (Single canonical source in scripts/)
//  Dynamically generates:
//    1. Main title overlays (overlay_cliff_01_ritual.png / overlay_single.png / overlay_event_01.png ..)
//       STRICTLY Video Title ONLY (NO red/orange pill, zero yellow header, zero bottom rule card).
//    2. Related Video Bridge CTA End-Card overlays (overlay_<tag>_cta.png) for the final 3-4s
//       of Cliffhanger Bridge Shorts: Folk Horror callout + arrow pointing down-left to the
//       YouTube Shorts Related Video link (bottom-left above the channel name).
//
//  Usage:
//    node generate_shorts_overlays.js [--format cliffhanger|events|single|two_part|all] [--max-sec 50] [--min-sec 40] [--allow-over-60]
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

function loadPlanner(dir) {
  for (const candidate of [
    path.join(dir, 'shorts_planner.js'),
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
const tl = fs.existsSync(tlPath) ? JSON.parse(fs.readFileSync(tlPath, 'utf8')) : { title: 'Real Lens Horror', scenes: [] };
const cfgPath = path.join(projectDir, 'shorts_config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
const epJsPath = path.join(projectDir, 'episode.js');
if (fs.existsSync(epJsPath)) {
  try {
    const epMod = require(epJsPath);
    if (!cfg.SHORTS_TITLE && !cfg.shortsTitle && (epMod.SHORTS_TITLE || epMod.shortsTitle)) cfg.SHORTS_TITLE = epMod.SHORTS_TITLE || epMod.shortsTitle;
    if (!cfg.SHORTS_SUB_HOOK && !cfg.shortsSubHook && (epMod.SHORTS_SUB_HOOK || epMod.shortsSubHook)) cfg.SHORTS_SUB_HOOK = epMod.SHORTS_SUB_HOOK || epMod.shortsSubHook;
    if (!cfg.TITLE_RED_LINE && !cfg.titleRedLine && (epMod.TITLE_RED_LINE || epMod.titleRedLine)) cfg.TITLE_RED_LINE = epMod.TITLE_RED_LINE || epMod.titleRedLine;
    if (!cfg.SHORTS_ANGLES && Array.isArray(epMod.SHORTS_ANGLES)) cfg.SHORTS_ANGLES = epMod.SHORTS_ANGLES;
    if (!cfg.SHORTS_BRIDGE_CTA_TEXT && epMod.SHORTS_BRIDGE_CTA_TEXT) cfg.SHORTS_BRIDGE_CTA_TEXT = epMod.SHORTS_BRIDGE_CTA_TEXT;
    if (!cfg.SHORTS_BRIDGE_CTA_VO && epMod.SHORTS_BRIDGE_CTA_VO) cfg.SHORTS_BRIDGE_CTA_VO = epMod.SHORTS_BRIDGE_CTA_VO;
  } catch (_) {}
}

const maxSec = getArg('--max-sec') ? Number(getArg('--max-sec')) : (cfg.maxSec ? Number(cfg.maxSec) : undefined);
const minSec = getArg('--min-sec') ? Number(getArg('--min-sec')) : (cfg.minSec ? Number(cfg.minSec) : undefined);
const format = hasFlag('--cliffhanger') ? 'cliffhanger' : (getArg('--format') || cfg.shortsFormat || undefined);
const allowOver60 = hasFlag('--allow-over-60') || Boolean(cfg.allowOver60);
const onlyEvents = hasFlag('--events-only');
const forceBridgeCta = hasFlag('--bridge-cta');

function deriveOverlays() {
  const { planShortsEpisodes, saveShortsPlan } = loadPlanner(projectDir);
  const planned = planShortsEpisodes(tl, cfg, { maxSec, minSec, allowOver60, format });
  saveShortsPlan(projectDir, planned);

  const selected = onlyEvents ? planned.filter(x => x.isEvent) : planned;
  const manualOverlays = Array.isArray(cfg.overlays) ? cfg.overlays : [];
  return selected.map((item, idx) => {
    const manual = (!onlyEvents && manualOverlays[idx]) ? manualOverlays[idx] : {};
    const tag = item.tag || (item.isCliffhanger ? `cliff_${String(item.ep).padStart(2, '0')}` : (item.isEvent ? `event_${String(item.ep).padStart(2, '0')}` : (item.isSingle ? 'single' : `ep${item.ep}`)));
    const bridgeCta = item.bridgeCta || (forceBridgeCta ? {
      enabled: true,
      dur: 3.5,
      headline: cfg.bridgeCtaText || cfg.SHORTS_BRIDGE_CTA_TEXT || 'ดูเฉลยเต็มที่ลิงก์ด้านล่าง',
      subText: cfg.bridgeCtaSubText || 'กดที่ลิงก์ด้านล่างเพื่อฟังเฉลยเต็มแบบไม่ตัด'
    } : null);
    return {
      ep: item.ep,
      tag,
      isSingle: Boolean(item.isSingle),
      isEvent: Boolean(item.isEvent),
      isCliffhanger: Boolean(item.isCliffhanger),
      angle: item.angle || null,
      dur: item.dur,
      title: manual.title || item.title,
      titleTop: manual.titleTop || item.titleTop,
      titleBot: manual.titleBot || item.titleBot,
      titleRedLine: manual.titleRedLine || item.titleRedLine || 1,
      badge: manual.badge || item.badge || '',
      file: manual.file || item.overlayFile || `overlay_${tag}.png`,
      bridgeCta,
      ctaFile: bridgeCta ? (manual.ctaFile || item.ctaOverlayFile || `overlay_${tag}_cta.png`) : null
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
    @font-face { font-family: "Kanit"; font-weight: 800; src: url("../assets/fonts/kanit-thai-800-normal.woff2") format("woff2"); }
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

    function rr(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    }

    function stripEpPrefixJs(s) {
      return String(s || '')
        .split('|')[0]
        .replace(/^(?:EP\\.?\\s*\\d+(?:\\s*\\([^)]*\\))?|ตอนที่\\s*\\d+|เหตุการณ์\\s*(?:ที่|#)?\\s*\\d+|ตอนจบ|ตอนเดียวจบ|จบใน\\s*\\d*\\s*คลิป(?:\\s*เดียว)?)\\s*[:·\\-–—]?\\s*/i, '')
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

      const sz1 = fitFont(ctx, line1, 920, 94, 46, 900);
      const sz2 = fitFont(ctx, line2, 940, 98, 46, 900);
      drawStrokedHeadlineLine(ctx, line1, safeCx, 252, sz1, col1);
      drawStrokedHeadlineLine(ctx, line2, safeCx, 368, sz2, col2);
    };

    // Related Video Bridge CTA End-Card Overlay (final 3-4s of Cliffhanger Bridge Shorts)
    // Points directly down-left toward YouTube Shorts' Related Video link above channel name!
    window.renderBridgeCtaOverlay = function(data) {
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');
      const W = 1080, H = 1920;
      ctx.clearRect(0, 0, W, H);

      const cta = data.bridgeCta || {};
      const headline = String(cta.headline || 'ดูเฉลยเต็มที่ลิงก์ด้านล่าง').trim();
      const subText = String(cta.subText || 'กดที่ลิงก์ด้านล่างเพื่อฟังเฉลยเต็มแบบไม่ตัด').trim();

      // Atmospheric Folk-Horror bottom readability scrim (keeps right-side UI icons x > 920 clear)
      const btmGrad = ctx.createLinearGradient(0, 1180, 0, H);
      btmGrad.addColorStop(0, 'rgba(4, 8, 7, 0)');
      btmGrad.addColorStop(0.42, 'rgba(5, 11, 9, 0.72)');
      btmGrad.addColorStop(1, 'rgba(3, 6, 5, 0.90)');
      ctx.fillStyle = btmGrad;
      ctx.fillRect(0, 1180, W, H - 1180);

      // Callout panel anchored bottom-left above YouTube Shorts Related Video pill & channel handle
      const cardX = 52;
      const cardY = 1320;
      const cardW = 796;
      const cardH = 186;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = 'rgba(8, 15, 13, 0.94)';
      rr(ctx, cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.restore();

      // Left crimson accent bar & subtle warm gold hairline border
      ctx.save();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.lineWidth = 2.5;
      rr(ctx, cardX, cardY, cardW, cardH, 16);
      ctx.stroke();

      ctx.fillStyle = '#DC2626';
      rr(ctx, cardX, cardY, 12, cardH, [16, 0, 0, 16]);
      ctx.fill();

      // Top red kicker badge inside CTA panel
      const badgeTxt = '▶  คลิปเต็ม · เฉลยปริศนา';
      ctx.font = '800 24px "Kanit", sans-serif';
      const bw = Math.ceil(ctx.measureText(badgeTxt).width) + 34;
      ctx.fillStyle = '#DC2626';
      rr(ctx, cardX + 34, cardY + 22, bw, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeTxt, cardX + 51, cardY + 43);

      // Primary headline ("ดูเฉลยเต็มที่ลิงก์ด้านล่าง")
      const headSz = fitFont(ctx, headline, cardW - 68, 46, 28, 900);
      ctx.font = '900 ' + headSz + 'px "Kanit", sans-serif';
      ctx.fillStyle = '#FACC15';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 10;
      ctx.fillText(headline, cardX + 34, cardY + 104);

      // Subtext line
      ctx.shadowBlur = 0;
      const subSz = fitFont(ctx, subText, cardW - 68, 25, 18, 600);
      ctx.font = '600 ' + subSz + 'px "Kanit", sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(subText, cardX + 34, cardY + 150);
      ctx.restore();

      // Prominent downward-left pointing vector arrow aimed straight at Related Video link (bottom-left above channel name)
      const ax = 128;
      const ayTop = cardY + cardH + 10;
      const ayTip = ayTop + 88;
      ctx.save();
      ctx.shadowColor = 'rgba(250, 204, 21, 0.72)';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#09090B';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(ax - 15, ayTop);
      ctx.lineTo(ax + 15, ayTop);
      ctx.lineTo(ax + 15, ayTip - 36);
      ctx.lineTo(ax + 40, ayTip - 36);
      ctx.lineTo(ax, ayTip);
      ctx.lineTo(ax - 40, ayTip - 36);
      ctx.lineTo(ax - 15, ayTip - 36);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Subtle glowing target ring right above the Related Video zone
      ctx.shadowBlur = 0;
      ctx.font = '800 24px "Kanit", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.strokeText('กดลิงก์คลิปที่เกี่ยวข้องตรงนี้', ax + 58, ayTip - 18);
      ctx.fillText('กดลิงก์คลิปที่เกี่ยวข้องตรงนี้', ax + 58, ayTip - 18);
      ctx.restore();
    };
  </script>
</body>
</html>`;

(async () => {
  const capLabel = allowOver60 ? (maxSec || 58) : Math.min(maxSec || 58, 60);
  console.log(`=== Generating ${EP_OVERLAYS.length} Minimalist Shorts Overlays (1080x1920, <= ${capLabel}s/clip) ===`);
  for (const item of EP_OVERLAYS) {
    const label = item.isCliffhanger ? `Cliffhanger [${item.angle || item.ep}]` : (item.isSingle ? 'Single' : (item.isEvent ? `Event #${item.ep}` : `EP ${item.ep}`));
    console.log(`  · ${label} (${Number(item.dur || 0).toFixed(1)}s): ${item.titleTop || item.title} / ${item.titleBot || ''} -> ${item.file}${item.ctaFile ? ` + ${item.ctaFile}` : ''}`);
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

      if (item.bridgeCta && item.ctaFile) {
        await page.evaluate(d => window.renderBridgeCtaOverlay(d), item);
        const ctaOutPath = path.join(outDir, item.ctaFile);
        await canvasElem.screenshot({ path: ctaOutPath, omitBackground: true });
        console.log(`✓ Saved Bridge CTA Overlay: ${item.ctaFile}`);
      }
    }
  } finally {
    await browser.close();
    try { fs.unlinkSync(htmlPath); } catch (_) {}
  }
  console.log('🎉 All Shorts HUD & Related Video Bridge CTA overlays generated!');
})();
