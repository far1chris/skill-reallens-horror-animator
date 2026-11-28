// =============================================================================
//  generate_scene_covers.js — Key-Scene Vertical Shorts Covers (1080x1920)
//  Part of skill: reallens-horror-animator
//  Uses shorts_planner.js to pick the highest-impact climax frame in each EP
//  (Event clips / Single Short, 45-60s each), verifies non-black frame luminance
//  in Puppeteer (HUD/Telemetry force-hidden), and composites Top 2-Line Two-Tone Title
//  + Fitted Sharp Rectangular Red Sub-Hook Tag Box (spaced cleanly below Line 2)
//  over bright Full-Bleed Climax Art. STRICTLY NO yellow/red viewfinder frames or
//  corner brackets, NO telemetry HUD, NO bottom stamp (เหตุการณ์ #N / EP N / จบใน 1 คลิป), NO bottom bar.
//
//  Usage:
//    node generate_scene_covers.js [--input master.mp4] [--max-sec 58] [--min-sec 22] [--allow-over-60]
// =============================================================================
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
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

function resolveFFmpeg() {
  for (const r of [localReq, require]) {
    try {
      const p = r('ffmpeg-static');
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return 'ffmpeg';
}

function loadPlanner() {
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

const shortsDir = path.join(projectDir, 'shorts');
fs.mkdirSync(shortsDir, { recursive: true });

function findMasterMp4(required = true) {
  const explicit = getArg('--input', '-i');
  if (explicit) return path.resolve(projectDir, explicit);
  const preferred = ['master_hf.mp4', 'master_16x9.mp4', 'master_1440p.mp4', 'output_hf.mp4', 'output.mp4'];
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) preferred.unshift(`${pkg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`);
    } catch (_) {}
  }
  for (const name of preferred) {
    const p = path.join(projectDir, name);
    if (fs.existsSync(p)) return p;
  }
  const anyMp4 = fs.readdirSync(projectDir).find(f => f.endsWith('.mp4') && !f.includes('shorts'));
  if (anyMp4) return path.join(projectDir, anyMp4);
  if (required) throw new Error('Master 16:9 MP4 not found. Pass --input <path-to-master.mp4>');
  return null;
}

const MAKE_COVERS_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @font-face { font-family: "Kanit"; font-weight: 400; src: url("../assets/fonts/kanit-thai-400-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 700; src: url("../assets/fonts/kanit-thai-700-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 800; src: url("../assets/fonts/kanit-thai-800-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 900; src: url("../assets/fonts/kanit-thai-900-normal.woff2") format("woff2"); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1080px; height: 1920px; background: #060b14; overflow: hidden; font-family: 'Kanit', sans-serif; }
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

    window.measureImageLuma = function(imgUrl) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = function() {
          const probe = document.createElement('canvas');
          const pw = 160, ph = 90;
          probe.width = pw; probe.height = ph;
          const pctx = probe.getContext('2d');
          pctx.drawImage(img, 0, 0, pw, ph);
          const data = pctx.getImageData(0, 0, pw, ph).data;
          let sum = 0, brightPixels = 0;
          const total = pw * ph;
          for (let i = 0; i < data.length; i += 4) {
            const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            sum += luma;
            if (luma > 20) brightPixels++;
          }
          resolve({ meanLuma: sum / total, brightRatio: brightPixels / total });
        };
        img.onerror = function() { resolve({ meanLuma: 0, brightRatio: 0, error: true }); };
        img.src = imgUrl;
      });
    };

    window.analyzeHeroSubject = function(img, hudBaked) {
      const pw = img.width > img.height ? 160 : 108;
      const ph = img.width > img.height ? 90 : 192;
      const probe = document.createElement('canvas');
      probe.width = pw; probe.height = ph;
      const pctx = probe.getContext('2d');
      pctx.drawImage(img, 0, 0, pw, ph);
      const data = pctx.getImageData(0, 0, pw, ph).data;

      // Sample top-sky corners as background baseline
      let bgR = 0, bgG = 0, bgB = 0, bgN = 0;
      for (const py of [Math.floor(ph * 0.08), Math.floor(ph * 0.14)]) {
        for (const px of [Math.floor(pw * 0.10), Math.floor(pw * 0.90)]) {
          const idx = (py * pw + px) * 4;
          bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2]; bgN++;
        }
      }
      bgR /= bgN; bgG /= bgN; bgB /= bgN;

      const xLo = Math.floor(pw * (hudBaked ? 0.18 : 0.08));
      const xHi = Math.floor(pw * (hudBaked ? 0.78 : 0.92));
      const yLo = Math.floor(ph * 0.16);
      const yHi = Math.floor(ph * 0.90);

      let wSum = 0, wx = 0, wy = 0;
      let minSy = ph, maxSy = 0, strongPts = 0;
      for (let y = yLo; y < yHi; y++) {
        for (let x = xLo; x < xHi; x++) {
          const i = (y * pw + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const bgDiff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          const nIdx = ((Math.max(0, y - 1)) * pw + Math.max(0, x - 1)) * 4;
          const edge = Math.abs(r - data[nIdx]) + Math.abs(g - data[nIdx + 1]) + Math.abs(b - data[nIdx + 2]);
          const dangerPop = (r > g + 35 && r > b + 35) ? 65 : 0; // glowing crimson / eyes / horror props
          const score = Math.max(0, bgDiff * 0.65 + edge * 1.15 + chroma * 0.55 + dangerPop + (luma > 38 ? 14 : 0) - 24);
          if (score > 28) {
            const w = score * score * 0.01;
            wSum += w; wx += x * w; wy += y * w;
            if (score > 75) {
              strongPts++;
              if (y < minSy) minSy = y;
              if (y > maxSy) maxSy = y;
            }
          }
        }
      }
      if (wSum <= 0 || strongPts < 12) {
        return { cxRatio: 0.5, cyRatio: 0.56, spanYRatio: 0.45, found: false };
      }
      return {
        cxRatio: Math.max(0.20, Math.min(0.80, (wx / wSum) / pw)),
        cyRatio: Math.max(0.28, Math.min(0.76, (wy / wSum) / ph)),
        spanYRatio: Math.max(0.16, Math.min(0.82, (maxSy - minSy) / ph)),
        found: true
      };
    };

    window.drawCover = function(epData) {
      window.__done = false;
      window.__lastStats = null;
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');
      const W = 1080, H = 1920;

      const img = new Image();
      img.onload = function() {
        const hero = window.analyzeHeroSubject(img, epData.hudBaked);
        const manualFocusRatio = (Number(epData.focusX) || 640) / 1280;
        const focusXRatio = epData.hudBaked
          ? Math.max(0.38, Math.min(0.62, manualFocusRatio))
          : (epData.focusX != null && Number(epData.focusX) !== 640
              ? Math.max(0.18, Math.min(0.82, manualFocusRatio))
              : (hero.found ? hero.cxRatio : 0.5));
        const focusYRatio = epData.focusY != null
          ? Math.max(0.28, Math.min(0.74, Number(epData.focusY) / 720))
          : (hero.found ? hero.cyRatio : 0.56);

        // Smart cover zoom: zoom closer on wide/distant heroes, keep tight close-ups unclipped
        const autoZoom = epData.coverZoom != null
          ? Number(epData.coverZoom)
          : (hero.found && hero.spanYRatio < 0.34 ? 1.28 : (hero.found && hero.spanYRatio < 0.48 ? 1.16 : 1.07));
        const baseCoverScale = Math.max(W / img.width, H / img.height);
        const scale = baseCoverScale * Math.max(1.06, Math.min(1.42, autoZoom));
        const sw = img.width * scale, sh = img.height * scale;

        // Place focal hero cleanly inside bright middle spotlight band (y ~ 1075, clear below red subHook)
        const targetScreenY = 1075;
        const drawX = Math.max(W - sw, Math.min(0, W * 0.5 - focusXRatio * sw));
        const drawY = Math.max(H - sh, Math.min(0, targetScreenY - focusYRatio * sh));

        // 1. High-contrast vivid horror poster grade on scene artwork
        ctx.save();
        ctx.filter = 'contrast(1.18) saturate(1.24) brightness(1.07)';
        ctx.drawImage(img, drawX, drawY, sw, sh);
        ctx.filter = 'none';

        // 2. Eerie teal-emerald backlight rim aura + subtle crimson danger glow centered on focal action
        const spotX = Math.max(240, Math.min(W - 240, drawX + focusXRatio * sw));
        const spotY = Math.max(660, Math.min(1380, drawY + focusYRatio * sh));
        ctx.globalCompositeOperation = 'screen';
        const tealAura = ctx.createRadialGradient(spotX, spotY - 40, 20, spotX, spotY - 40, 560);
        tealAura.addColorStop(0, 'rgba(20, 184, 166, 0.28)');
        tealAura.addColorStop(0.50, 'rgba(13, 148, 136, 0.11)');
        tealAura.addColorStop(1, 'rgba(13, 148, 136, 0)');
        ctx.fillStyle = tealAura;
        ctx.fillRect(0, 420, W, 1180);

        const dangerRim = ctx.createRadialGradient(spotX, spotY + 40, 10, spotX, spotY + 40, 380);
        dangerRim.addColorStop(0, 'rgba(220, 38, 38, 0.16)');
        dangerRim.addColorStop(0.55, 'rgba(185, 28, 28, 0.06)');
        dangerRim.addColorStop(1, 'rgba(185, 28, 28, 0)');
        ctx.fillStyle = dangerRim;
        ctx.fillRect(0, 420, W, 1180);
        ctx.restore();

        // 3. Soft drifting mist wisps + floating eerie ember/spore particles around focal horror zone
        ctx.save();
        for (let m = 0; m < 4; m++) {
          const mx = 180 + m * 240;
          const my = 1220 + (m % 2) * 110;
          const mist = ctx.createRadialGradient(mx, my, 10, mx, my, 260);
          mist.addColorStop(0, 'rgba(153, 246, 228, 0.08)');
          mist.addColorStop(1, 'rgba(153, 246, 228, 0)');
          ctx.fillStyle = mist;
          ctx.beginPath(); ctx.ellipse(mx, my, 280, 90, 0, 0, Math.PI * 2); ctx.fill();
        }
        const motes = [
          [0.26, 0.44, 5, '#5eead4'], [0.74, 0.48, 4, '#f87171'], [0.34, 0.56, 4.5, '#5eead4'],
          [0.68, 0.60, 5.5, '#ef4444'], [0.42, 0.68, 3.5, '#99f6e4'], [0.60, 0.72, 4, '#fca5a5'],
          [0.22, 0.64, 3.5, '#ef4444'], [0.79, 0.66, 4, '#5eead4'], [0.48, 0.49, 4, '#fca5a5']
        ];
        for (const [rx, ry, mr, col] of motes) {
          const px = W * rx, py = H * ry;
          ctx.fillStyle = col;
          ctx.shadowColor = col; ctx.shadowBlur = 12;
          ctx.globalAlpha = 0.68;
          ctx.beginPath(); ctx.arc(px, py, mr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        // 4. Outer dread vignette + Top (0..540) & Bottom (1360..1920) readability scrims
        ctx.save();
        const vig = ctx.createRadialGradient(spotX, spotY, 260, W / 2, H / 2, 1120);
        vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vig.addColorStop(1, 'rgba(3, 6, 12, 0.52)');
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

        const topGrad = ctx.createLinearGradient(0, 0, 0, 540);
        topGrad.addColorStop(0, 'rgba(6, 11, 20, 0.90)');
        topGrad.addColorStop(0.68, 'rgba(8, 14, 27, 0.54)');
        topGrad.addColorStop(1, 'rgba(10, 16, 30, 0)');
        ctx.fillStyle = topGrad; ctx.fillRect(0, 0, W, 540);

        const btmGrad = ctx.createLinearGradient(0, 1360, 0, H);
        btmGrad.addColorStop(0, 'rgba(6, 11, 20, 0)');
        btmGrad.addColorStop(0.45, 'rgba(8, 14, 27, 0.56)');
        btmGrad.addColorStop(1, 'rgba(4, 7, 13, 0.92)');
        ctx.fillStyle = btmGrad; ctx.fillRect(0, 1360, W, H - 1360);
        ctx.restore();

        // Luminance probe across bright center focal action zone (zero corner brackets / boxes)
        const heroX = 36, heroY = 496, heroW = 1008, heroH = 840;
        const heroSample = ctx.getImageData(heroX + 80, heroY + 60, heroW - 160, heroH - 120).data;
        let hSum = 0, hCount = 0;
        for (let i = 0; i < heroSample.length; i += 64) {
          hSum += 0.2126 * heroSample[i] + 0.7152 * heroSample[i + 1] + 0.0722 * heroSample[i + 2];
          hCount++;
        }
        window.__lastStats = { heroMeanLuma: hCount ? (hSum / hCount) : 0 };

        // Top Title: 2 Stacked Two-Tone Lines (Red / White) + Spaced Rectangular Red Sub-Hook Box (NO corner brackets, NO yellow border)
        const rawTop = String(epData.titleTop || epData.topLine || '').trim();
        const rawBot = String(epData.titleBot || epData.redWord || '').trim();
        const redLine = Number(epData.titleRedLine) === 2 ? 2 : 1;

        function drawHeavyTitleLine(text, yCenter, isRed) {
          if (!text) return 0;
          const sz = fitFont(ctx, text, 950, 114, 48, 900);
          ctx.save();
          ctx.font = '900 ' + sz + 'px "Kanit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.lineWidth = Math.max(12, Math.round(sz * 0.16));
          ctx.strokeStyle = '#000000';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
          ctx.shadowBlur = 14;
          ctx.shadowOffsetY = 6;
          ctx.strokeText(text, W / 2, yCenter);
          ctx.shadowColor = isRed ? 'rgba(220, 38, 38, 0.45)' : 'rgba(0, 0, 0, 0.40)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
          ctx.fillText(text, W / 2, yCenter);
          ctx.restore();
          return sz;
        }

        let botCenterY = 290;
        let botUsedSz = 96;
        if (rawTop && rawBot) {
          const topCenterY = 212;
          const topUsedSz = drawHeavyTitleLine(rawTop, topCenterY, redLine === 1);
          const botPreSz = fitFont(ctx, rawBot, 950, 114, 48, 900);
          botCenterY = Math.max(352, Math.round(topCenterY + topUsedSz * 0.54 + botPreSz * 0.88));
          botUsedSz = drawHeavyTitleLine(rawBot, botCenterY, redLine === 2);
        } else if (rawTop || rawBot) {
          botUsedSz = drawHeavyTitleLine(rawTop || rawBot, botCenterY, redLine === 1);
        }

        // Fitted Sharp Rectangular Red Sub-Hook Tag Box spaced cleanly below Line 2 (clearing Thai low vowels + stroke)
        const subHook = String(epData.subHook || '').trim();
        if (subHook && !/^(?:EP\.?\s*\d+|ตอนที่\s*\d+|เหตุการณ์\s*(?:ที่|#)?\s*\d+|จบใน\s*\d*\s*คลิป)/i.test(subHook)) {
          ctx.save();
          const subSz = fitFont(ctx, subHook, 880, 38, 22, 700);
          ctx.font = '700 ' + subSz + 'px "Kanit", sans-serif';
          const padX = 34;
          const boxW = Math.min(940, Math.ceil(ctx.measureText(subHook).width) + padX * 2);
          const boxH = 56;
          const boxX = (W - boxW) / 2;
          const boxY = Math.max((rawTop && rawBot) ? 436 : 366, Math.round(botCenterY + botUsedSz * 0.58 + 26));

          ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
          ctx.shadowBlur = 16;
          ctx.shadowOffsetY = 6;
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(boxX, boxY, boxW, boxH);

          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(subHook, W / 2, boxY + boxH / 2 + 1);
          ctx.restore();
        }

        window.__done = true;
      };
      img.src = epData.imgUrl;
    };
  </script>
</body>
</html>`;

(async () => {
  const ffmpeg = resolveFFmpeg();
  const stageHtmlPath = path.join(projectDir, 'index.html');
  const hasStageHtml = fs.existsSync(stageHtmlPath);
  const inMp4 = findMasterMp4(!hasStageHtml);
  const tlPath = path.join(projectDir, 'timeline.json');
  if (!fs.existsSync(tlPath)) {
    console.error('Missing timeline.json — run generate_audio.js first.');
    process.exit(1);
  }
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
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
    } catch (_) {}
  }

  const maxSec = getArg('--max-sec') ? Number(getArg('--max-sec')) : (cfg.maxSec ? Number(cfg.maxSec) : undefined);
  const minSec = getArg('--min-sec') ? Number(getArg('--min-sec')) : (cfg.minSec ? Number(cfg.minSec) : undefined);
  const format = hasFlag('--cliffhanger') ? 'cliffhanger' : (hasFlag('--single') ? 'single' : (getArg('--format') || cfg.shortsFormat || undefined));
  const allowOver60 = hasFlag('--allow-over-60') || Boolean(cfg.allowOver60);
  const onlyEvents = hasFlag('--events-only');

  const { planShortsEpisodes, saveShortsPlan } = loadPlanner();
  const planned = planShortsEpisodes(tl, cfg, { maxSec, minSec, allowOver60, format });
  saveShortsPlan(projectDir, planned);

  const selected = onlyEvents ? planned.filter(item => item.isEvent) : planned;
  const manualCovers = Array.isArray(cfg.covers) ? cfg.covers : [];
  const episodes = selected.map((item, idx) => {
    const manual = (!onlyEvents && manualCovers[idx]) ? manualCovers[idx] : {};
    const keySc = (tl.scenes || []).find(s => s.id === item.keySceneId);
    const keyStart = keySc ? Number(keySc.start) : item.start;
    const keyEnd = keySc ? Number(keySc.start + keySc.dur) : item.end;
    const tag = item.tag || (item.isEvent ? `event_${String(item.ep).padStart(2, '0')}` : (item.isSingle ? 'single' : `ep${item.ep}`));
    return {
      ep: item.ep,
      isSingle: Boolean(item.isSingle),
      tag,
      start: keyStart,
      end: keyEnd,
      dur: item.dur,
      keySceneId: item.keySceneId,
      keyView: item.keyView,
      keyScore: item.keyScore,
      focusX: manual.focusX != null ? manual.focusX : (item.focusX || 640),
      focusY: manual.focusY != null ? manual.focusY : (keySc && keySc.focusY != null ? keySc.focusY : undefined),
      coverZoom: manual.coverZoom != null ? manual.coverZoom : (keySc && keySc.coverZoom != null ? keySc.coverZoom : undefined),
      isFinal: item.isFinal !== undefined ? item.isFinal : (item.ep === planned.length && planned.length > 1),
      extractAt: Number(manual.extractAt != null ? manual.extractAt : item.extractAt),
      titleTop: manual.titleTop || item.titleTop || manual.topLine || item.topLine,
      titleBot: manual.titleBot || item.titleBot || manual.redWord || item.redWord,
      titleRedLine: manual.titleRedLine || item.titleRedLine || 1,
      subHook: manual.subHook || item.subHook || manual.shortsSubHook || '',
      topLine: manual.topLine || item.topLine,
      redWord: manual.redWord || item.redWord,
      rawImg: manual.rawImg || path.join(shortsDir, `raw_frame_${tag}.png`),
      outFile: manual.outFile || path.join(shortsDir, item.coverFile || `cover_shorts_${tag}.png`)
    };
  });

  const htmlFile = path.join(shortsDir, '_make_covers.html');
  fs.writeFileSync(htmlFile, MAKE_COVERS_HTML, 'utf8');
  const executablePath = findBrowserExecutable();
  const browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto('file:///' + htmlFile.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    let scenePage = null;
    if (hasStageHtml) {
      scenePage = await browser.newPage();
      await scenePage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
      await scenePage.goto('file:///' + stageHtmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
      await scenePage.evaluate(async () => {
        if (window.__setHeadless) window.__setHeadless();
        await document.fonts.ready;
        if (typeof window.setRenderResolution === 'function') window.setRenderResolution(1920, 1080);
      });
    }

    async function captureCandidateFrame(ts, destPath) {
      if (scenePage) {
        const b64 = await scenePage.evaluate(t => {
          // Hard-disable ALL HUD layers (Telemetry top-right, chapter, cards, subtitles) on cover frames,
          // even when the project's index.html predates the __HIDE_HUD guard.
          const HUD_FNS = ['drawTele', 'drawChapter', 'drawCard', 'drawFlow', 'drawSub', 'drawHud', 'drawShortsEndingCTA'];
          const saved = {};
          for (const k of HUD_FNS) {
            if (typeof window[k] === 'function') { saved[k] = window[k]; try { window[k] = function () {}; } catch (_) {} }
          }
          window.__HIDE_HUD = true;
          try {
            window.renderAtTime(t);
            const stage = document.getElementById('stage');
            return stage ? stage.toDataURL('image/png') : null;
          } finally {
            window.__HIDE_HUD = false;
            for (const k of Object.keys(saved)) { try { window[k] = saved[k]; } catch (_) {} }
          }
        }, ts);
        if (b64) {
          fs.writeFileSync(destPath, Buffer.from(b64.slice(b64.indexOf(',') + 1), 'base64'));
          return 'stage';
        }
      }
      execFileSync(ffmpeg, ['-y', '-ss', String(ts), '-i', inMp4, '-frames:v', '1', '-update', '1', '-q:v', '2', destPath]);
      return 'ffmpeg';
    }

    const resolvedCap = maxSec || (planned.some(p => p.isCliffhanger) ? 50 : 58);
    console.log(`=== 1. Extracting Full-Screen Key-Scene Climax Frames (${episodes.length} clips, <= ${allowOver60 ? resolvedCap : Math.min(resolvedCap, 60)}s each) ===`);
    for (const ep of episodes) {
      const span = Math.max(0.5, ep.end - ep.start);
      const candidates = [
        ep.extractAt,
        Number((ep.start + span * 0.55).toFixed(2)),
        Number((ep.start + span * 0.35).toFixed(2)),
        Number((ep.start + span * 0.78).toFixed(2))
      ];
      let chosenAt = ep.extractAt;
      let bestLuma = -1;
      for (let i = 0; i < candidates.length; i++) {
        const ts = Math.max(0, candidates[i]);
        await captureCandidateFrame(ts, ep.rawImg);
        const imgUrl = 'file:///' + ep.rawImg.replace(/\\/g, '/') + `?t=${Date.now()}_${i}`;
        const stats = await page.evaluate(u => window.measureImageLuma(u), imgUrl);
        if (stats.meanLuma > bestLuma) {
          bestLuma = stats.meanLuma;
          chosenAt = ts;
        }
        if (stats.meanLuma >= 12 && stats.brightRatio >= 0.08) break;
        if (i < candidates.length - 1) {
          console.warn(`  ⚠️ EP ${ep.ep} frame at ${ts}s is near-black (luma=${stats.meanLuma.toFixed(1)}); trying brighter keyframe...`);
        }
      }
      if (chosenAt !== ep.extractAt) {
        await captureCandidateFrame(chosenAt, ep.rawImg);
      }
      if (!scenePage) {
        // FFmpeg fallback frames have HUD baked in (Telemetry top-right) — keep the 9:16 crop near center.
        ep.hudBaked = true;
        console.warn(`  ⚠️ ${ep.tag}: no index.html — frame taken from master MP4 (HUD baked in); cover crop clamped to center to hide Telemetry.`);
      }
      if (bestLuma < 8) {
        console.warn(`  ⚠️ EP ${ep.ep} best candidate frame at ${chosenAt}s still very dark (luma=${bestLuma.toFixed(1)}). Check visual output!`);
      }
      ep.extractAt = chosenAt;
      console.log(`✓ EP ${ep.ep}: extracted @ ${chosenAt}s [${ep.keySceneId}/${ep.keyView} | score=${ep.keyScore} | luma=${bestLuma.toFixed(1)}]`);
    }

    if (scenePage) await scenePage.close().catch(() => {});

    console.log('\n=== 2. Rendering Key-Scene Shorts Covers (1080x1920) ===');
    for (const ep of episodes) {
      const epData = { ...ep, imgUrl: 'file:///' + ep.rawImg.replace(/\\/g, '/') + `?v=${Date.now()}` };
      await page.evaluate(d => window.drawCover(d), epData);
      await page.waitForFunction(() => window.__done === true, { timeout: 8000 });
      await new Promise(r => setTimeout(r, 120));
      const coverStats = await page.evaluate(() => window.__lastStats);
      if (coverStats && coverStats.heroMeanLuma < 8) {
        console.warn(`  ⚠️ Cover EP ${ep.ep} hero frame is very dark (luma=${coverStats.heroMeanLuma.toFixed(1)}).`);
      }
      await page.screenshot({ path: ep.outFile, type: 'png' });
      try { fs.unlinkSync(ep.rawImg); } catch (_) {}
      console.log(`  -> Saved ${path.basename(ep.outFile)} ("${ep.titleTop || ep.topLine} / ${ep.titleBot || ep.redWord}")`);
    }
  } finally {
    await browser.close();
    try { fs.unlinkSync(htmlFile); } catch (_) {}
  }
  console.log('🎉 All Key-Scene Shorts Covers Successfully Rendered!');
})();
