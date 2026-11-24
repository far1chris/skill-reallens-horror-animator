// =============================================================================
//  generate_thumbnail.js — Folk Horror Key-Scene YouTube Thumbnails (1920x1080)
//  Part of skill: reallens-horror-animator
//  Features:
//    - Folk Horror Channel Palette: Deep murky dark / black / dark forest green
//      (#040806 -> #091510 -> #0F221A) contrasted with vivid Crimson Red (#EF4444/#DC2626)
//      or Flashlight Yellow (#FACC15) focal accent.
//    - Strict Thumbnail Copy QA:
//        * Max 4 concise words, huge mobile-readable Kanit 900 typography
//        * Must NOT duplicate the video TITLE (validates overlap & warns/blocks in --strict)
//    - Long-Form SEO Title QA:
//        * Primary keyword in first 50-60 chars
//        * NO redundant channel name suffix ("| เว้าเรื่องหลอน")
//        * NO spoiling the scientific/historical cause in the title
//
//  Usage:
//    node generate_thumbnail.js [--dir <projectDir>] [--accent red|flashlight] [--strict]
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

const FOLK_HORROR_PALETTE = {
  bgDeep: '#040806',
  forestDark: '#091510',
  forestMid: '#0F221A',
  accentRed: '#EF4444',
  accentCrimson: '#DC2626',
  accentFlashlight: '#FACC15',
  accentAmber: '#F59E0B',
  mistGreen: 'rgba(16, 68, 52, 0.34)',
  torchGlow: 'rgba(250, 204, 21, 0.24)',
  crimsonGlow: 'rgba(220, 38, 38, 0.26)'
};

function countConciseWords(text) {
  const clean = String(text || '').replace(/[!?؟.,…“”"'()[\]|·●]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return { phraseCount: 0, tokenCount: 0, charCount: 0 };
  const phrases = clean.split(/\s+/).filter(Boolean);
  let tokenCount = phrases.length;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segs = Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(clean))
      .filter(s => s.isWordLike);
    tokenCount = segs.length;
  }
  return { phraseCount: phrases.length, tokenCount, charCount: clean.replace(/\s+/g, '').length };
}

function textBigramSimilarity(a, b) {
  const norm = s => String(s || '').toLowerCase().replace(/[\s!?؟.,…“”"'()[\]|·●\-]+/g, '');
  const sa = norm(a);
  const sb = norm(b);
  if (!sa || !sb) return 0;
  if (sa === sb) return 1;
  if (sa.length < 2 || sb.length < 2) return 0;
  const toMap = str => {
    const m = new Map();
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.slice(i, i + 2);
      m.set(bg, (m.get(bg) || 0) + 1);
    }
    return m;
  };
  const ma = toMap(sa);
  const mb = toMap(sb);
  let overlap = 0;
  for (const [k, v] of ma.entries()) overlap += Math.min(v, mb.get(k) || 0);
  return (2 * overlap) / ((sa.length - 1) + (sb.length - 1));
}

function validateThumbnailCopy({ titleTop = '', titleBot = '', videoTitle = '' }) {
  const combined = `${titleTop} ${titleBot}`.replace(/\s+/g, ' ').trim();
  const counts = countConciseWords(combined);
  const similarity = textBigramSimilarity(combined, videoTitle);
  const normThumb = combined.replace(/[\s!?؟.,…]+/g, '');
  const normTitle = String(videoTitle || '').replace(/[\s!?؟.,…]+/g, '');
  const warnings = [];

  // Max 4 words / short visual punch phrases for instant mobile readability
  if (counts.phraseCount > 4 || counts.tokenCount > 6 || counts.charCount > 26) {
    warnings.push(`ข้อความบนปกยาวเกินเกณฑ์ <= 4 คำ ("${combined}" = ${counts.phraseCount} วลี / ${counts.tokenCount} คำ / ${counts.charCount} ตัวอักษร) — ควรย่อให้สั้น 2–4 คำ ตัวใหญ่ อ่านชัดบนมือถือ`);
  }
  if (normThumb && normTitle && (normThumb === normTitle || similarity >= 0.72 || (normTitle.includes(normThumb) && normThumb.length >= normTitle.length * 0.70))) {
    warnings.push(`ข้อความบนปก ("${combined}") ซ้ำกับชื่อคลิป ("${videoTitle}") — กฎภาพปกห้ามใช้ข้อความซ้ำกับชื่อคลิป`);
  }

  return {
    pass: warnings.length === 0,
    combined,
    ...counts,
    similarity: +similarity.toFixed(2),
    warnings
  };
}

function validateSeoTitle(videoTitle = '') {
  const title = String(videoTitle || '').trim();
  const warnings = [];
  if (!title) return { pass: false, warnings: ['Missing video TITLE'] };
  if (/\|\s*(?:เว้าเรื่องหลอน|Real\s*Lens|@[\w.-]+)\s*$/i.test(title)) {
    warnings.push(`ชื่อคลิปมีชื่อช่องต่อท้ายซ้ำ ("${title.split('|').pop().trim()}") — ห้ามใส่ชื่อช่องต่อท้ายชื่อคลิป`);
  }
  if (title.length > 85) {
    warnings.push(`ชื่อคลิปยาว ${title.length} ตัวอักษร — ควรวาง Keyword หลักไว้ใน 50–60 ตัวอักษรแรกและกระชับไม่เกิน 85 ตัวอักษร`);
  }
  if (/(ความจริงคือโรค|สาเหตุที่แท้จริงคือ|แท้จริงแล้วคือโรค|ไม่ใช่ผีแต่คือ)/i.test(title)) {
    warnings.push('ชื่อคลิปเฉลยสาเหตุทางวิทยาศาสตร์เร็วเกินไป — ห้ามสปอยล์คำตอบไว้ในชื่อคลิป');
  }
  return { pass: warnings.length === 0, title, length: title.length, warnings };
}

function loadPuppeteer(localReq) {
  for (const r of [localReq, require]) {
    try { return r('puppeteer-core'); } catch (_) {}
    try { return r('puppeteer'); } catch (_) {}
  }
  throw new Error('puppeteer-core not found. Run: npm install puppeteer-core');
}

function loadPlanner(dir) {
  for (const candidate of [
    path.join(dir, 'shorts_planner.js'),
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

function buildThumbConfig(projectDir) {
  const tlPath = path.join(projectDir, 'timeline.json');
  if (!fs.existsSync(tlPath)) {
    throw new Error('Missing timeline.json — run generate_audio.js first.');
  }
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const pkgCfgPath = path.join(projectDir, 'packaging.json');
  const pkgCfg = fs.existsSync(pkgCfgPath) ? JSON.parse(fs.readFileSync(pkgCfgPath, 'utf8')) : {};

  const scenes = tl.scenes || [];
  const planner = loadPlanner(projectDir);

  function fallbackHighlights(allScenes) {
    if (!allScenes.length) return { showdownScene: null, panels: [] };
    const climax = allScenes.find(s => s.isClimax)
      || allScenes.find(s => s.telemetry && /DANGER|CRITICAL|อันตราย|วิกฤต/i.test(`${s.telemetry.day || ''} ${s.telemetry.label || ''}`))
      || allScenes[Math.max(0, allScenes.length - 3)]
      || allScenes[0];
    const idxs = [0, 0.45, 0.82].map(r => Math.min(allScenes.length - 1, Math.floor(r * allScenes.length)));
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

  const rawTitle = pkgCfg.title || tl.title || epMod.TITLE || 'ตำนานสยองขวัญไทย';
  const mainHook = pkgCfg.mainHook || (rawTitle.includes('|') ? rawTitle.split('|')[0].trim() : rawTitle.trim());
  // Folk Horror rule: keep kicker optional & minimal (never clutter thumbnails with redundant channel suffix by default)
  const seriesBadge = pkgCfg.showKicker === true || pkgCfg.seriesBadge
    ? String(pkgCfg.seriesBadge || pkgCfg.seriesName || '').trim()
    : '';
  const epShortsTitle = pkgCfg.titleLines
    || (Array.isArray(epMod.SHORTS_TITLE) && epMod.SHORTS_TITLE.length >= 2 ? epMod.SHORTS_TITLE : null)
    || (Array.isArray(climaxScene?.coverHeadline) && climaxScene.coverHeadline.length >= 2 ? climaxScene.coverHeadline : null);

  const accentMode = (getArg('--accent') || pkgCfg.accentMode || pkgCfg.accentColor || 'red').toLowerCase() === 'flashlight'
    ? 'flashlight'
    : 'red';
  const theme = (pkgCfg.theme || 'folk_horror').toLowerCase();
  const subHook = pkgCfg.subHook !== undefined
    ? String(pkgCfg.subHook || '').replace(/^[“"]|[”"]$/g, '').trim()
    : '';

  return {
    title: rawTitle,
    mainHook,
    titleTop: pkgCfg.titleTop || (epShortsTitle ? epShortsTitle[0] : ''),
    titleBot: pkgCfg.titleBot || (epShortsTitle ? epShortsTitle[1] : ''),
    titleRedLine: Number(pkgCfg.titleRedLine || epMod.TITLE_RED_LINE || epMod.titleRedLine || 2),
    accentMode,
    theme,
    seriesBadge,
    subHook,
    showdownView: pkgCfg.showdownView || climaxScene?.view || scenes[0]?.view,
    showdownLt: pkgCfg.showdownLt != null ? Number(pkgCfg.showdownLt) : defaultShowdownLt,
    focusX: pkgCfg.focusX != null ? Number(pkgCfg.focusX) : (climaxScene?.focusX || 640),
    focusY: pkgCfg.focusY != null ? Number(pkgCfg.focusY) : (climaxScene?.focusY || 350),
    coverZoom: pkgCfg.coverZoom != null ? Number(pkgCfg.coverZoom) : undefined,
    panels: Array.isArray(pkgCfg.panels) && pkgCfg.panels.length ? pkgCfg.panels : highlights.panels
  };
}

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

    function drawPosterAtmosphere(spotX, spotY, radiusX = 620, accentMode = 'red') {
      // Folk Horror channel color identity: dark murky forest-green shadow contrasted with vivid red or flashlight yellow
      c.save();
      c.globalCompositeOperation = 'screen';
      const forestRim = c.createRadialGradient(spotX, spotY - 30, 20, spotX, spotY - 30, radiusX);
      forestRim.addColorStop(0, accentMode === 'flashlight' ? 'rgba(250, 204, 21, 0.24)' : 'rgba(16, 86, 62, 0.34)');
      forestRim.addColorStop(0.52, 'rgba(10, 56, 42, 0.14)');
      forestRim.addColorStop(1, 'rgba(10, 56, 42, 0)');
      c.fillStyle = forestRim; c.fillRect(0, 0, 1920, 1080);

      const focalEye = c.createRadialGradient(spotX, spotY + 35, 10, spotX, spotY + 35, radiusX * 0.66);
      if (accentMode === 'flashlight') {
        focalEye.addColorStop(0, 'rgba(250, 204, 21, 0.28)');
        focalEye.addColorStop(0.55, 'rgba(245, 158, 11, 0.10)');
        focalEye.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        focalEye.addColorStop(0, 'rgba(220, 38, 38, 0.28)');
        focalEye.addColorStop(0.55, 'rgba(185, 28, 28, 0.10)');
        focalEye.addColorStop(1, 'rgba(185, 28, 28, 0)');
      }
      c.fillStyle = focalEye; c.fillRect(0, 0, 1920, 1080);
      c.restore();

      // Deep forest ground mist & Folk Horror ember/spore motes (crimson + torch amber)
      c.save();
      for (let m = 0; m < 4; m++) {
        const mx = spotX - 380 + m * 250;
        const my = 820 + (m % 2) * 90;
        const mist = c.createRadialGradient(mx, my, 10, mx, my, 290);
        mist.addColorStop(0, 'rgba(20, 68, 52, 0.16)');
        mist.addColorStop(1, 'rgba(20, 68, 52, 0)');
        c.fillStyle = mist;
        c.beginPath(); c.ellipse(mx, my, 320, 95, 0, 0, TAU); c.fill();
      }
      const motes = [
        [-260, -180, 5.5, '#FACC15'], [240, -140, 4.5, '#EF4444'], [-140, 120, 4.5, '#F59E0B'],
        [190, 95, 6, '#DC2626'], [-310, 40, 4, '#FDE047'], [290, 210, 5, '#EF4444'],
        [60, -240, 4.5, '#DC2626'], [-80, 240, 4, '#FACC15'], [130, -40, 4.5, '#F87171']
      ];
      for (const [dx, dy, mr, col] of motes) {
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.globalAlpha = 0.72;
        c.beginPath(); c.arc(spotX + dx, spotY + dy, mr, 0, TAU); c.fill();
      }
      c.restore();
    }

    function drawHeavyCoverLine(text, x, y, maxW, startSize, minSize, isAccent, align = 'left', accentMode = 'red') {
      if (!text) return 0;
      const sz = fitTextSize(c, text, maxW, startSize, minSize, 900);
      const accentHex = accentMode === 'flashlight' ? '#FACC15' : '#EF4444';
      const glowRgba = accentMode === 'flashlight' ? 'rgba(250, 204, 21, 0.55)' : 'rgba(220, 38, 38, 0.60)';
      c.save();
      c.font = '900 ' + sz + 'px "Kanit", sans-serif';
      c.textAlign = align;
      c.textBaseline = 'middle';
      c.lineJoin = 'round';
      c.miterLimit = 2;
      c.lineWidth = Math.max(16, Math.round(sz * 0.17));
      c.strokeStyle = '#000000';
      c.shadowColor = 'rgba(0, 0, 0, 0.96)';
      c.shadowBlur = 24;
      c.shadowOffsetY = 9;
      c.strokeText(text, x, y);
      c.shadowColor = isAccent ? glowRgba : 'rgba(0, 0, 0, 0.45)';
      c.shadowBlur = 14;
      c.shadowOffsetY = 0;
      c.fillStyle = isAccent ? accentHex : '#FFFFFF';
      c.fillText(text, x, y);
      c.restore();
      return sz;
    }

    function drawRedSubHookBox(text, anchorX, boxY, maxW, align = 'left', accentMode = 'red') {
      const clean = String(text || '').trim();
      if (!clean) return;
      c.save();
      const sz = fitTextSize(c, clean, maxW - 76, 44, 24, 800);
      c.font = '800 ' + sz + 'px "Kanit", sans-serif';
      const padX = 38;
      const boxW = Math.min(maxW, Math.ceil(c.measureText(clean).width) + padX * 2);
      const boxH = 68;
      const boxX = align === 'center' ? (anchorX - boxW / 2) : anchorX;

      c.shadowColor = 'rgba(0, 0, 0, 0.85)';
      c.shadowBlur = 20;
      c.shadowOffsetY = 8;
      c.fillStyle = accentMode === 'flashlight' ? '#FACC15' : '#DC2626';
      c.fillRect(boxX, boxY, boxW, boxH);

      c.shadowBlur = 0; c.shadowOffsetY = 0;
      c.fillStyle = accentMode === 'flashlight' ? '#09090B' : '#FFFFFF';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(clean, boxX + boxW / 2, boxY + boxH / 2 + 1);
      c.restore();
    }

    window.renderShowdown = function (cfg) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, 1920, 1080);

      // Deep murky Folk Horror base backdrop (#040806 -> #091510)
      const baseBg = c.createLinearGradient(0, 0, 1920, 1080);
      baseBg.addColorStop(0, '#040806');
      baseBg.addColorStop(0.55, '#091510');
      baseBg.addColorStop(1, '#050B08');
      c.fillStyle = baseBg;
      c.fillRect(0, 0, 1920, 1080);

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
      c.filter = 'contrast(1.24) saturate(1.18) brightness(1.04)';
      c.drawImage(off, drawX, drawY, sw, sh);
      c.filter = 'none';
      // Subtle dark forest-green color grade wash for unified Folk Horror channel palette
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = 'rgba(210, 232, 222, 0.90)';
      c.fillRect(0, 0, 1920, 1080);
      c.restore();

      const spotX = Math.max(960, Math.min(1680, drawX + hx * scale));
      const spotY = Math.max(280, Math.min(800, drawY + hy * scale));
      const accentMode = cfg.accentMode === 'flashlight' ? 'flashlight' : 'red';
      drawPosterAtmosphere(spotX, spotY, 640, accentMode);

      // Directional Left-to-Right murky dark-green/black scrim for massive mobile-readable <=4-word typography
      c.save();
      const leftScrim = c.createLinearGradient(0, 0, 1200, 0);
      leftScrim.addColorStop(0, 'rgba(4, 8, 6, 0.96)');
      leftScrim.addColorStop(0.58, 'rgba(7, 17, 13, 0.78)');
      leftScrim.addColorStop(1, 'rgba(7, 17, 13, 0)');
      c.fillStyle = leftScrim; c.fillRect(0, 0, 1200, 1080);

      const vig = c.createRadialGradient(spotX, spotY, 310, 960, 540, 1280);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(2, 6, 4, 0.64)');
      c.fillStyle = vig; c.fillRect(0, 0, 1920, 1080);
      c.restore();

      // Left-Third Massive Mobile-Readable Typography (<= 4 words total, huge Kanit 900)
      const leftX = 96;
      const maxTextW = 980;
      if (cfg.seriesBadge) {
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.88)'; c.shadowBlur = 12;
        txt(c, '●  ' + cfg.seriesBadge, leftX, 235, fitTextSize(c, '●  ' + cfg.seriesBadge, maxTextW, 32, 20, 700), accentMode === 'flashlight' ? '#FACC15' : '#F87171', 700, 'left');
        c.restore();
      }

      const fallbackPair = splitHookTwoLines(cfg.mainHook || cfg.title);
      const line1 = (cfg.titleTop || fallbackPair[0] || '').trim();
      const line2 = (cfg.titleBot || fallbackPair[1] || '').trim();
      const accentLine = Number(cfg.titleRedLine) === 1 ? 1 : 2;
      const topY = cfg.subHook ? 380 : 420;

      const sz1 = drawHeavyCoverLine(line1, leftX, topY, maxTextW, 164, 80, accentLine === 1, 'left', accentMode);
      const sz2Pre = fitTextSize(c, line2, maxTextW, 164, 80, 900);
      const line2Y = Math.max(topY + Math.round(sz1 * 1.12), topY + Math.round(sz1 * 0.44 + sz2Pre * 0.72));
      const sz2 = drawHeavyCoverLine(line2, leftX, line2Y, maxTextW, 164, 80, accentLine === 2, 'left', accentMode);

      if (cfg.subHook) {
        const boxY = Math.min(860, Math.max(line2Y + Math.round(sz2 * 0.58) + 30, 650));
        drawRedSubHookBox(cfg.subHook, leftX, boxY, maxTextW, 'left', accentMode);
      }
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

      // Seamless Folk Horror bottom stage scrim + Massive 2-Tone Hook (<= 4 words, zero duplicate title!)
      const bgGrad = c.createLinearGradient(0, 520, 0, 1080);
      bgGrad.addColorStop(0, 'rgba(4, 8, 6, 0)');
      bgGrad.addColorStop(0.45, 'rgba(6, 14, 10, 0.94)');
      bgGrad.addColorStop(1, '#040806');
      c.fillStyle = bgGrad; c.fillRect(0, 520, 1920, 560);

      const fallbackPair = splitHookTwoLines(cfg.mainHook || cfg.title);
      const thumbHeadline = ((cfg.titleTop || cfg.titleBot)
        ? ((cfg.titleTop || '') + ' ' + (cfg.titleBot || ''))
        : (fallbackPair[0] + ' ' + fallbackPair[1])).trim();
      const accentMode = cfg.accentMode === 'flashlight' ? 'flashlight' : 'red';
      drawMultiToneHeadline(thumbHeadline, 960, cfg.subHook ? 845 : 900, 1740, 128, 64, '#000000', 18, '#FFFFFF', '#FACC15', '#EF4444', 'rgba(220, 38, 38, 0.85)');
      if (cfg.subHook) drawRedSubHookBox(cfg.subHook, 960, 916, 1360, 'center', accentMode);
    };
  </script>
</body>
</html>`;

async function runThumbnailGenerator(projectDir) {
  const localReq = createRequire(
    fs.existsSync(path.join(projectDir, 'package.json'))
      ? path.join(projectDir, 'package.json')
      : path.join(projectDir, '_resolver.js')
  );
  const puppeteer = loadPuppeteer(localReq);
  const THUMB_CONFIG = buildThumbConfig(projectDir);

  // Run Long-Form SEO Title & <=4-Word Non-Duplicate Thumbnail Copy QA
  const seoCheck = validateSeoTitle(THUMB_CONFIG.title);
  const copyCheck = validateThumbnailCopy({
    titleTop: THUMB_CONFIG.titleTop,
    titleBot: THUMB_CONFIG.titleBot,
    videoTitle: THUMB_CONFIG.title
  });
  console.log(`=== Key-Scene Folk Horror Thumbnails (accent=${THUMB_CONFIG.accentMode}) ===`);
  if (!seoCheck.pass) {
    for (const w of seoCheck.warnings) console.warn(`  ⚠️ [SEO Title QA] ${w}`);
  } else {
    console.log(`  ✓ [SEO Title QA] PASS (${seoCheck.length} chars, clean keyword-first title)`);
  }
  if (!copyCheck.pass) {
    for (const w of copyCheck.warnings) console.warn(`  ⚠️ [Thumbnail Copy QA] ${w}`);
    if (process.argv.includes('--strict')) {
      throw new Error('Thumbnail Copy / SEO QA failed in --strict mode.');
    }
  } else {
    console.log(`  ✓ [Thumbnail Copy QA] PASS ("${copyCheck.combined}", ${copyCheck.phraseCount} phrases, non-duplicate)`);
  }

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
}

if (require.main === module) {
  const projectDir = path.resolve(getArg('--dir') || process.cwd());
  runThumbnailGenerator(projectDir).catch(err => {
    console.error('FATAL:', err.message || err);
    process.exit(1);
  });
}

module.exports = {
  FOLK_HORROR_PALETTE,
  countConciseWords,
  textBigramSimilarity,
  validateThumbnailCopy,
  validateSeoTitle,
  buildThumbConfig,
  runThumbnailGenerator
};
