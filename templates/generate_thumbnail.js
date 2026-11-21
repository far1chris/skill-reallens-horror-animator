// =============================================================================
//  generate_thumbnail.js — Key-Scene Long-Form YouTube Thumbnails (1920x1080)
//  Part of skill: reallens-horror-animator
//  Uses shorts_planner.js (pickTopLongFormHighlights + pickKeyTimestampInScene)
//  to select high-tension showdown + 5 dramatic escalation panels, rather than
//  blind fixed percentages.
//    1. thumbnail_reallens_showdown.png  (High-CTR Poster Showdown: Left 2-Line Hook + Right Rim-Lit Hero)
//    2. thumbnail_reallens_5panel.png    (3-Panel Wide Cinematic Horror Escalation Triptych)
//
//  Usage:
//    node generate_thumbnail.js [--dir <projectDir>]
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
    if (fs.existsSync(candidate)) {
      try { return require(candidate); } catch (_) {}
    }
  }
  return null;
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

const tlPath = path.join(projectDir, 'timeline.json');
if (!fs.existsSync(tlPath)) {
  console.error('Missing timeline.json — run generate_audio.js first.');
  process.exit(1);
}
const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const pkgCfgPath = path.join(projectDir, 'packaging.json');
const pkgCfg = fs.existsSync(pkgCfgPath) ? JSON.parse(fs.readFileSync(pkgCfgPath, 'utf8')) : {};

const scenes = tl.scenes || [];
const planner = loadPlanner(projectDir);
const firstRuleScene = scenes.find(s => (s.hud && s.hud.type === 'rule') || (s.card && s.card.type === 'rule')) || scenes[0];
const firstRuleCard = (firstRuleScene && (firstRuleScene.card || firstRuleScene.hud)) || {};

function fallbackHighlights(allScenes) {
  if (!allScenes.length) return { showdownScene: null, panels: [] };
  const climax = allScenes.find(s => s.isClimax)
    || allScenes.find(s => s.telemetry && /DANGER|CRITICAL|อันตราย|วิกฤต/i.test(`${s.telemetry.day || ''} ${s.telemetry.label || ''}`))
    || allScenes[Math.max(0, allScenes.length - 3)]
    || allScenes[0];
  const idxs = [0, 0.22, 0.45, 0.68, 0.88].map(r => Math.min(allScenes.length - 1, Math.floor(r * allScenes.length)));
  const panels = idxs.map((idx, i) => {
    const sc = allScenes[idx] || allScenes[0];
    return {
      num: String(i + 1),
      label: sc.eventTitle || sc.shortLabel || (Array.isArray(sc.coverHeadline) ? sc.coverHeadline.join(' ') : null) || sc.view,
      view: sc.view,
      lt: Number(Math.min((sc.dur || 3) * 0.65, 2.2).toFixed(2)),
      focusX: sc.focusX || 640
    };
  });
  return { showdownScene: climax, panels };
}

const highlights = planner ? planner.pickTopLongFormHighlights(scenes, 3) : fallbackHighlights(scenes);
const climaxScene = highlights.showdownScene || scenes[Math.max(0, scenes.length - 3)] || scenes[0];
const climaxAbs = planner && climaxScene ? planner.pickKeyTimestampInScene(climaxScene) : ((climaxScene?.start || 0) + Math.min((climaxScene?.dur || 5) * 0.65, 2.5));
const defaultShowdownLt = climaxScene ? Number(Math.max(0.25, Math.min(climaxAbs - (climaxScene.start || 0), Math.max(0.5, (climaxScene.dur || 5) - 0.2))).toFixed(2)) : 1.5;

let epMod = {};
const epJsPath = path.join(projectDir, 'episode.js');
if (fs.existsSync(epJsPath)) {
  try { epMod = require(epJsPath) || {}; } catch (_) {}
}

const rawTitle = pkgCfg.title || tl.title || epMod.TITLE || 'REAL LENS SURVIVAL HORROR';
const mainHook = pkgCfg.mainHook || (rawTitle.includes('|') ? rawTitle.split('|')[0].trim() : rawTitle.trim());
const rawSeries = pkgCfg.seriesName || (rawTitle.includes('|') ? rawTitle.split('|').pop().trim() : '') || pkgCfg.pillLabel || '';
const channelHandle = pkgCfg.channelHandle !== undefined
  ? String(pkgCfg.channelHandle || '').trim()
  : String(epMod.CHANNEL_HANDLE || epMod.channelHandle || '@WaoRueangLhon').trim();
const seriesBadge = rawSeries
  ? (channelHandle && !rawSeries.includes('@') && !rawSeries.includes('·') ? `${rawSeries} · ${channelHandle}` : rawSeries)
  : (channelHandle || '@WaoRueangLhon');
const epShortsTitle = pkgCfg.titleLines || (Array.isArray(epMod.SHORTS_TITLE) && epMod.SHORTS_TITLE.length >= 2 ? epMod.SHORTS_TITLE : (Array.isArray(climaxScene?.coverHeadline) && climaxScene.coverHeadline.length >= 2 ? climaxScene.coverHeadline : null));
const subHook = pkgCfg.subHook || pkgCfg.hookQuote || epMod.SHORTS_SUB_HOOK || epMod.shortsSubHook || 'ความจริงหลอนกว่าที่คุณคิดหลายเท่า!';

const THUMB_CONFIG = {
  title: rawTitle,
  mainHook,
  titleTop: pkgCfg.titleTop || (epShortsTitle ? epShortsTitle[0] : ''),
  titleBot: pkgCfg.titleBot || (epShortsTitle ? epShortsTitle[1] : ''),
  titleRedLine: Number(pkgCfg.titleRedLine || epMod.TITLE_RED_LINE || epMod.titleRedLine || 2),
  seriesBadge,
  subHook: String(subHook).replace(/^[“"]|[”"]$/g, '').trim(),
  showdownView: pkgCfg.showdownView || climaxScene?.view || scenes[0]?.view,
  showdownLt: pkgCfg.showdownLt != null ? Number(pkgCfg.showdownLt) : defaultShowdownLt,
  focusX: pkgCfg.focusX != null ? Number(pkgCfg.focusX) : (climaxScene?.focusX || 640),
  focusY: pkgCfg.focusY != null ? Number(pkgCfg.focusY) : (climaxScene?.focusY || 350),
  coverZoom: pkgCfg.coverZoom != null ? Number(pkgCfg.coverZoom) : undefined,
  panels: Array.isArray(pkgCfg.panels) && pkgCfg.panels.length ? pkgCfg.panels : highlights.panels
};

const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <style>
    @font-face { font-family: "Kanit"; font-weight: 400; src: url("assets/fonts/kanit-thai-400-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 600; src: url("assets/fonts/kanit-thai-600-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 700; src: url("assets/fonts/kanit-thai-700-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 800; src: url("assets/fonts/kanit-thai-800-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 900; src: url("assets/fonts/kanit-thai-900-normal.woff2") format("woff2"); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; font-family: 'Kanit', sans-serif; }
    canvas { display: block; width: 1920px; height: 1080px; }
  </style>
</head>
<body>
  <canvas id="thumbCanvas" width="1920" height="1080"></canvas>
  <script src="./timeline.js"></script>
  <script src="./core.js"></script>
  <script src="./views.js"></script>
  <script>
    const cv = document.getElementById('thumbCanvas');
    const c = cv.getContext('2d');
    const SCENES = (window.TIMELINE && window.TIMELINE.scenes) || [];

    function drawPanel(x, w, h, fn) {
      c.save(); c.beginPath(); c.rect(x, 0, w, h); c.clip(); fn(x, w, h); c.restore();
    }

    function drawMultiToneHeadline(text, cx, y, maxW, startSize, minSize, strokeCol, strokeW, baseCol, kwCol, dangerCol, glowCol) {
      const sz = fitTextSize(c, text, maxW, startSize, minSize, 900);
      const kwPat = '(?<![\\\\u0E40-\\\\u0E44])(?:\\\\d+(?:[.,:]\\\\d+)?%?|กฎข้อ\\\\s*\\\\d+|ห้าม|ตาย|อันตราย|วิกฤต|ผีปอบ|อีปอบ|คำพิพากษา|โรคระบาด|แพะรับบาป|ตีหนึ่ง|ตีสอง|ตีสาม|ตีสี่|วินาที|นาที|เมตร|องศา|บาท|\\\\?\\\\!)(?![\\\\u0E31\\\\u0E34-\\\\u0E3A\\\\u0E47-\\\\u0E4E])';
      const splitRe = new RegExp('(' + kwPat + ')', 'g');
      const exactRe = new RegExp('^' + kwPat + '$');
      const dangerRe = /^(?:ห้าม|ตาย|อันตราย|วิกฤต|ผีปอบ|อีปอบ|คำพิพากษา|โรคระบาด|แพะรับบาป|\\?\\!)$/;
      const parts = String(text || '').split(splitRe).filter(Boolean);

      c.save();
      c.font = '900 ' + sz + 'px "Kanit", sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.lineJoin = 'round';
      const widths = parts.map(p => c.measureText(p).width);
      const totalW = widths.reduce((a, b) => a + b, 0);

      c.lineWidth = strokeW;
      c.strokeStyle = strokeCol;
      c.shadowColor = glowCol;
      c.shadowBlur = 32;
      let px = cx - totalW / 2;
      for (let i = 0; i < parts.length; i++) {
        c.strokeText(parts[i], px, y);
        px += widths[i];
      }

      c.shadowBlur = 0;
      px = cx - totalW / 2;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const isDanger = dangerRe.test(p);
        const isKw = !isDanger && exactRe.test(p);
        c.fillStyle = isDanger ? dangerCol : (isKw ? kwCol : baseCol);
        c.fillText(p, px, y);
        px += widths[i];
      }
      c.restore();
    }

    function splitHookTwoLines(text) {
      const s = String(text || '').split('|')[0].trim();
      if (!s) return ['ปริศนาสยอง', 'ห้ามพลาด!'];
      const words = s.split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        const mid = Math.ceil(words.length / 2);
        return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
      }
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segs = Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(s), p => p.segment);
        const target = Math.floor(s.length * 0.52);
        let acc = '', splitIdx = Math.ceil(segs.length / 2);
        for (let i = 0; i < segs.length - 1; i++) {
          acc += segs[i];
          if (acc.length >= target && !/^[!?.,…\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+$/.test(segs[i + 1] || '')) {
            splitIdx = i + 1; break;
          }
        }
        const a = segs.slice(0, splitIdx).join('').trim();
        const b = segs.slice(splitIdx).join('').trim();
        if (a && b) return [a, b];
      }
      const mid = Math.ceil(s.length * 0.52);
      return [s.slice(0, mid), s.slice(mid)];
    }

    function renderViewOffscreen(viewName, lt, sceneObj) {
      const off = document.createElement('canvas');
      off.width = 1280; off.height = 720;
      const oc = off.getContext('2d');
      const viewMap = window.VIEWS || (typeof VIEWS !== 'undefined' ? VIEWS : {});
      const fn = viewMap[viewName] || viewMap[sceneObj?.view];
      window.__HIDE_HUD = true;
      try {
        if (fn) fn(oc, lt, sceneObj || { view: viewName, dur: 5 });
        else {
          corridor(oc, 1.5, { pal: DARK, camZ: 2.0 });
          drawEntity(oc, 680, 560, 1.45, { t: 1.5, dark: true, prop: 'none' });
          drawPerson(oc, 440, 680, 1.4, { t: 1.5, back: true, dir: 1, flashlight: true });
        }
      } finally {
        window.__HIDE_HUD = false;
      }
      return off;
    }

    function analyzeHero16x9(offCvs) {
      const pw = 160, ph = 90;
      const probe = document.createElement('canvas');
      probe.width = pw; probe.height = ph;
      const pctx = probe.getContext('2d');
      pctx.drawImage(offCvs, 0, 0, pw, ph);
      const data = pctx.getImageData(0, 0, pw, ph).data;
      let bgR = 0, bgG = 0, bgB = 0, bgN = 0;
      for (const py of [6, 12]) {
        for (const px of [12, pw - 12]) {
          const idx = (py * pw + px) * 4;
          bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2]; bgN++;
        }
      }
      bgR /= bgN; bgG /= bgN; bgB /= bgN;
      let wSum = 0, wx = 0, wy = 0, strong = 0;
      for (let y = 10; y < ph - 6; y++) {
        for (let x = 14; x < pw - 14; x++) {
          const i = (y * pw + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const bgDiff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          const nIdx = ((y - 1) * pw + (x - 1)) * 4;
          const edge = Math.abs(r - data[nIdx]) + Math.abs(g - data[nIdx + 1]) + Math.abs(b - data[nIdx + 2]);
          const dangerPop = (r > g + 35 && r > b + 35) ? 70 : 0;
          const score = Math.max(0, bgDiff * 0.65 + edge * 1.1 + dangerPop - 22);
          if (score > 30) {
            const w = score * score * 0.01;
            wSum += w; wx += x * w; wy += y * w;
            if (score > 75) strong++;
          }
        }
      }
      if (wSum <= 0 || strong < 10) return { cx: 640, cy: 360, found: false };
      return {
        cx: Math.max(260, Math.min(1020, (wx / wSum) / pw * 1280)),
        cy: Math.max(180, Math.min(560, (wy / wSum) / ph * 720)),
        found: true
      };
    }

    function drawPosterAtmosphere(spotX, spotY, radiusX = 620) {
      c.save();
      c.globalCompositeOperation = 'screen';
      const teal = c.createRadialGradient(spotX, spotY - 30, 20, spotX, spotY - 30, radiusX);
      teal.addColorStop(0, 'rgba(20, 184, 166, 0.30)');
      teal.addColorStop(0.50, 'rgba(13, 148, 136, 0.12)');
      teal.addColorStop(1, 'rgba(13, 148, 136, 0)');
      c.fillStyle = teal; c.fillRect(0, 0, 1920, 1080);

      const crim = c.createRadialGradient(spotX, spotY + 45, 10, spotX, spotY + 45, radiusX * 0.68);
      crim.addColorStop(0, 'rgba(220, 38, 38, 0.20)');
      crim.addColorStop(0.55, 'rgba(185, 28, 28, 0.07)');
      crim.addColorStop(1, 'rgba(185, 28, 28, 0)');
      c.fillStyle = crim; c.fillRect(0, 0, 1920, 1080);
      c.restore();

      // Soft ground mist & floating horror spores around focal subject
      c.save();
      for (let m = 0; m < 4; m++) {
        const mx = spotX - 380 + m * 250;
        const my = 820 + (m % 2) * 90;
        const mist = c.createRadialGradient(mx, my, 10, mx, my, 290);
        mist.addColorStop(0, 'rgba(153, 246, 228, 0.09)');
        mist.addColorStop(1, 'rgba(153, 246, 228, 0)');
        c.fillStyle = mist;
        c.beginPath(); c.ellipse(mx, my, 320, 95, 0, 0, TAU); c.fill();
      }
      const motes = [
        [-260, -180, 5.5, '#5eead4'], [240, -140, 4.5, '#f87171'], [-140, 120, 4.5, '#5eead4'],
        [190, 95, 6, '#ef4444'], [-310, 40, 4, '#99f6e4'], [290, 210, 5, '#fca5a5'],
        [60, -240, 4.5, '#ef4444'], [-80, 240, 4, '#5eead4'], [130, -40, 4.5, '#fca5a5']
      ];
      for (const [dx, dy, mr, col] of motes) {
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.globalAlpha = 0.72;
        c.beginPath(); c.arc(spotX + dx, spotY + dy, mr, 0, TAU); c.fill();
      }
      c.restore();
    }

    function drawHeavyCoverLine(text, x, y, maxW, startSize, minSize, isRed, align = 'left') {
      if (!text) return 0;
      const sz = fitTextSize(c, text, maxW, startSize, minSize, 900);
      c.save();
      c.font = '900 ' + sz + 'px "Kanit", sans-serif';
      c.textAlign = align;
      c.textBaseline = 'middle';
      c.lineJoin = 'round';
      c.miterLimit = 2;
      c.lineWidth = Math.max(14, Math.round(sz * 0.16));
      c.strokeStyle = '#000000';
      c.shadowColor = 'rgba(0, 0, 0, 0.94)';
      c.shadowBlur = 22;
      c.shadowOffsetY = 8;
      c.strokeText(text, x, y);
      c.shadowColor = isRed ? 'rgba(220, 38, 38, 0.55)' : 'rgba(0, 0, 0, 0.40)';
      c.shadowBlur = 12;
      c.shadowOffsetY = 0;
      c.fillStyle = isRed ? '#ef4444' : '#ffffff';
      c.fillText(text, x, y);
      c.restore();
      return sz;
    }

    function drawRedSubHookBox(text, anchorX, boxY, maxW, align = 'left') {
      const clean = String(text || '').trim();
      if (!clean) return;
      c.save();
      const sz = fitTextSize(c, clean, maxW - 76, 44, 24, 800);
      c.font = '800 ' + sz + 'px "Kanit", sans-serif';
      const padX = 38;
      const boxW = Math.min(maxW, Math.ceil(c.measureText(clean).width) + padX * 2);
      const boxH = 68;
      const boxX = align === 'center' ? (anchorX - boxW / 2) : anchorX;

      c.shadowColor = 'rgba(0, 0, 0, 0.82)';
      c.shadowBlur = 20;
      c.shadowOffsetY = 8;
      c.fillStyle = '#dc2626';
      c.fillRect(boxX, boxY, boxW, boxH);

      c.shadowBlur = 0; c.shadowOffsetY = 0;
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(clean, boxX + boxW / 2, boxY + boxH / 2 + 1);
      c.restore();
    }

    window.renderShowdown = function (cfg) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, 1920, 1080);

      const sceneObj = SCENES.find(s => s.view === cfg.showdownView) || SCENES[0] || { view: cfg.showdownView, dur: 5 };
      const showdownLt = cfg.showdownLt != null ? Number(cfg.showdownLt) : Math.min((sceneObj.dur || 5) * 0.65, 2.5);
      const off = renderViewOffscreen(cfg.showdownView, showdownLt, sceneObj);
      const hero = analyzeHero16x9(off);

      const hx = (cfg.focusX != null && Number(cfg.focusX) !== 640) ? Number(cfg.focusX) : (hero.found ? hero.cx : 640);
      const hy = (cfg.focusY != null && Number(cfg.focusY) !== 350) ? Number(cfg.focusY) : (hero.found ? hero.cy : 360);

      // Zoom dramatically and frame the horror focal subject onto the Right Rule-of-Thirds (x ~ 1340, y ~ 540)
      const zoom = cfg.coverZoom != null ? Number(cfg.coverZoom) : 1.28;
      const scale = 1.5 * zoom;
      const sw = 1280 * scale, sh = 720 * scale;
      const targetRightX = 1340;
      const targetCenterY = 540;
      const drawX = Math.max(1920 - sw, Math.min(0, targetRightX - hx * scale));
      const drawY = Math.max(1080 - sh, Math.min(0, targetCenterY - hy * scale));

      c.save();
      c.filter = 'contrast(1.22) saturate(1.28) brightness(1.07)';
      c.drawImage(off, drawX, drawY, sw, sh);
      c.filter = 'none';
      c.restore();

      const spotX = Math.max(960, Math.min(1680, drawX + hx * scale));
      const spotY = Math.max(280, Math.min(800, drawY + hy * scale));
      drawPosterAtmosphere(spotX, spotY, 640);

      // Directional Left-to-Right dark scrim for massive left typography (keeps right monster bright & vivid!)
      c.save();
      const leftScrim = c.createLinearGradient(0, 0, 1180, 0);
      leftScrim.addColorStop(0, 'rgba(4, 7, 13, 0.94)');
      leftScrim.addColorStop(0.58, 'rgba(6, 11, 20, 0.72)');
      leftScrim.addColorStop(1, 'rgba(6, 11, 20, 0)');
      c.fillStyle = leftScrim; c.fillRect(0, 0, 1180, 1080);

      const vig = c.createRadialGradient(spotX, spotY, 320, 960, 540, 1280);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(2, 5, 10, 0.56)');
      c.fillStyle = vig; c.fillRect(0, 0, 1920, 1080);
      c.restore();

      // Left-Third High-CTR Poster Typography (clear of right monster & bottom-right YouTube timestamp!)
      const leftX = 96;
      const maxTextW = 980;
      if (cfg.seriesBadge) {
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.88)'; c.shadowBlur = 12;
        txt(c, '●  ' + cfg.seriesBadge, leftX, 245, fitTextSize(c, '●  ' + cfg.seriesBadge, maxTextW, 32, 20, 700), '#5EEAD4', 700, 'left');
        c.restore();
      }

      const fallbackPair = splitHookTwoLines(cfg.mainHook || cfg.title);
      const line1 = (cfg.titleTop || fallbackPair[0] || '').trim();
      const line2 = (cfg.titleBot || fallbackPair[1] || '').trim();
      const redLine = Number(cfg.titleRedLine) === 1 ? 1 : 2;

      const sz1 = drawHeavyCoverLine(line1, leftX, 390, maxTextW, 146, 68, redLine === 1, 'left');
      const sz2Pre = fitTextSize(c, line2, maxTextW, 146, 68, 900);
      const line2Y = Math.max(390 + Math.round(sz1 * 1.12), 390 + Math.round(sz1 * 0.42 + sz2Pre * 0.72));
      const sz2 = drawHeavyCoverLine(line2, leftX, line2Y, maxTextW, 146, 68, redLine === 2, 'left');

      // Sharp Rectangular Red Sub-Hook Box spaced cleanly below Line 2 (zero Thai vowel overlap)
      const boxY = Math.min(860, Math.max(line2Y + Math.round(sz2 * 0.58) + 30, 625));
      drawRedSubHookBox(cfg.subHook, leftX, boxY, maxTextW, 'left');
    };

    window.render5Panel = function (cfg) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, 1920, 1080);
      const list = (cfg.panels || []).slice(0, 3);
      const count = Math.max(1, list.length);
      const pw = 1920 / count, ph = 760;

      list.forEach((p, i) => {
        const sc = SCENES.find(s => s.view === p.view) || SCENES[0] || { view: p.view, dur: 4 };
        const off = renderViewOffscreen(p.view, p.lt || 1.4, sc);
        const hero = analyzeHero16x9(off);
        const hx = (p.focusX != null && Number(p.focusX) !== 640) ? Number(p.focusX) : (hero.found ? hero.cx : 640);
        const hy = hero.found ? hero.cy : 360;

        drawPanel(i * pw, pw, ph, (x, w, h) => {
          const scale = Math.max(w / 1280, h / 720) * 1.24;
          const sw = 1280 * scale, sh = 720 * scale;
          const dx = Math.max(x + w - sw, Math.min(x, x + w * 0.5 - hx * scale));
          const dy = Math.max(h - sh, Math.min(0, h * 0.52 - hy * scale));
          c.save();
          c.filter = 'contrast(1.18) saturate(1.24) brightness(1.07)';
          c.drawImage(off, dx, dy, sw, sh);
          c.filter = 'none';
          c.globalCompositeOperation = 'screen';
          const aura = c.createRadialGradient(x + w / 2, h * 0.5, 20, x + w / 2, h * 0.5, 380);
          aura.addColorStop(0, i === count - 1 ? 'rgba(220, 38, 38, 0.24)' : 'rgba(20, 184, 166, 0.22)');
          aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
          c.fillStyle = aura; c.fillRect(x, 0, w, h);
          c.restore();

          // Clean minimal step number pill at top-left of panel
          c.save();
          c.fillStyle = 'rgba(6, 11, 20, 0.82)'; rr(c, x + 28, 28, 60, 60, 12); c.fill();
          c.strokeStyle = i === count - 1 ? '#EF4444' : 'rgba(94, 234, 212, 0.55)'; c.lineWidth = 3;
          rr(c, x + 28, 28, 60, 60, 12); c.stroke();
          txt(c, String(i + 1), x + 58, 70, 34, i === count - 1 ? '#EF4444' : '#FFFFFF', 900, 'center');
          c.restore();
        });
      });

      // Glowing crimson panel dividers
      c.save();
      c.shadowColor = 'rgba(239, 68, 68, 0.85)'; c.shadowBlur = 18;
      c.strokeStyle = '#DC2626'; c.lineWidth = 6;
      for (let i = 1; i < count; i++) { c.beginPath(); c.moveTo(i * pw, 0); c.lineTo(i * pw, ph); c.stroke(); }
      c.restore();

      // Seamless bottom stage scrim + Massive 2-Tone Hook + Sharp Red Sub-Hook (clear of bottom-right timestamp)
      const bgGrad = c.createLinearGradient(0, 520, 0, 1080);
      bgGrad.addColorStop(0, 'rgba(4, 7, 13, 0)');
      bgGrad.addColorStop(0.45, 'rgba(4, 7, 13, 0.92)');
      bgGrad.addColorStop(1, '#04070D');
      c.fillStyle = bgGrad; c.fillRect(0, 520, 1920, 560);

      const fallbackPair = splitHookTwoLines(cfg.mainHook || cfg.title);
      const singleLineHook = (cfg.mainHook || (fallbackPair[0] + ' ' + fallbackPair[1])).trim();
      drawMultiToneHeadline(singleLineHook, 960, 845, 1740, 116, 56, '#000000', 16, '#FFFFFF', '#FACC15', '#EF4444', 'rgba(220, 38, 38, 0.85)');
      drawRedSubHookBox(cfg.subHook, 960, 916, 1360, 'center');
    };
  </script>
</body>
</html>`;

(async () => {
  const tmpHtml = path.join(projectDir, '_tmp_thumb_render.html');
  fs.writeFileSync(tmpHtml, htmlContent, 'utf8');
  const executablePath = findBrowserExecutable();
  const browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto('file:///' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const checkCanvasLuma = () => {
      const data = c.getImageData(120, 120, 1680, 720).data;
      let sum = 0, cnt = 0;
      for (let i = 0; i < data.length; i += 128) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        cnt++;
      }
      return cnt ? sum / cnt : 0;
    };

    console.log(`=== Key-Scene Thumbnails ===`);
    console.log(`  Showdown: view=${THUMB_CONFIG.showdownView} @ lt=${THUMB_CONFIG.showdownLt}s`);
    THUMB_CONFIG.panels.forEach(p => console.log(`  Panel ${p.num}: ${p.view} (${p.label}) @ lt=${p.lt}s focusX=${p.focusX || 640}`));

    const out1 = path.join(projectDir, 'thumbnail_reallens_showdown.png');
    await page.evaluate(cfg => window.renderShowdown(cfg), THUMB_CONFIG);
    const luma1 = await page.evaluate(checkCanvasLuma);
    if (luma1 < 8) console.warn(`  ⚠️ Showdown thumbnail luma very low (${luma1.toFixed(1)}) — verify scene lighting!`);
    await page.screenshot({ path: out1, type: 'png' });
    console.log(`✓ Saved Thumbnail 1: ${path.basename(out1)} (luma=${luma1.toFixed(1)})`);

    const out2 = path.join(projectDir, 'thumbnail_reallens_5panel.png');
    await page.evaluate(cfg => window.render5Panel(cfg), THUMB_CONFIG);
    const luma2 = await page.evaluate(checkCanvasLuma);
    if (luma2 < 8) console.warn(`  ⚠️ 5-Panel thumbnail luma very low (${luma2.toFixed(1)}) — verify panel views!`);
    await page.screenshot({ path: out2, type: 'png' });
    console.log(`✓ Saved Thumbnail 2: ${path.basename(out2)} (luma=${luma2.toFixed(1)})`);
  } finally {
    await browser.close();
    try { fs.unlinkSync(tmpHtml); } catch (_) {}
  }
})();
