// =============================================================================
//  generate_scene_covers.js — Key-Scene Vertical Shorts Covers (1080x1920)
//  Part of skill: reallens-horror-animator
//  Uses shorts_planner.js to pick the highest-impact climax frame in each EP
//  (EP 1..N, <= 58s each), verifies non-black frame luminance in Puppeteer,
//  and composites STRICTLY Top Headline + Center Climax Frame + Bottom EP Stamp
//  (NO speech bubbles, NO bottom text boxes!).
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

function findMasterMp4() {
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
  throw new Error('Master 16:9 MP4 not found. Pass --input <path-to-master.mp4>');
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

    window.drawCover = function(epData) {
      window.__done = false;
      window.__lastStats = null;
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');
      const W = 1080, H = 1920;

      const img = new Image();
      img.onload = function() {
        ctx.save();
        const scale = Math.max(W / img.width, H / img.height) * 1.15;
        const sw = img.width * scale, sh = img.height * scale;
        ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);

        const darkGrad = ctx.createLinearGradient(0, 0, 0, H);
        darkGrad.addColorStop(0, 'rgba(6, 11, 20, 0.96)');
        darkGrad.addColorStop(0.22, 'rgba(8, 14, 27, 0.82)');
        darkGrad.addColorStop(0.5, 'rgba(10, 16, 30, 0.60)');
        darkGrad.addColorStop(0.78, 'rgba(8, 14, 27, 0.86)');
        darkGrad.addColorStop(1, 'rgba(4, 7, 13, 0.98)');
        ctx.fillStyle = darkGrad; ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // Center Hero Frame (1020 x 574)
        const heroY = 480, heroW = 1020, heroH = Math.round(heroW * (9 / 16)), heroX = (W - heroW) / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(239, 68, 68, 0.55)'; ctx.shadowBlur = 40;
        ctx.fillStyle = '#18181b'; ctx.beginPath(); ctx.roundRect(heroX, heroY, heroW, heroH, 22); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.roundRect(heroX, heroY, heroW, heroH, 22); ctx.clip();
        ctx.drawImage(img, heroX, heroY, heroW, heroH);
        const vg = ctx.createRadialGradient(heroX + heroW / 2, heroY + heroH / 2, heroH * 0.35, heroX + heroW / 2, heroY + heroH / 2, heroW * 0.6);
        vg.addColorStop(0, 'rgba(255, 255, 255, 0)'); vg.addColorStop(1, 'rgba(6, 11, 20, 0.65)');
        ctx.fillStyle = vg; ctx.fillRect(heroX, heroY, heroW, heroH);
        ctx.restore();

        // Sample hero frame brightness to flag near-black renders
        const heroSample = ctx.getImageData(heroX + 80, heroY + 60, heroW - 160, heroH - 120).data;
        let hSum = 0, hCount = 0;
        for (let i = 0; i < heroSample.length; i += 64) {
          hSum += 0.2126 * heroSample[i] + 0.7152 * heroSample[i + 1] + 0.0722 * heroSample[i + 2];
          hCount++;
        }
        window.__lastStats = { heroMeanLuma: hCount ? (hSum / hCount) : 0 };

        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.roundRect(heroX, heroY, heroW, heroH, 22); ctx.stroke();

        // Top Headline (2 lines ONLY — shrink safely inside 940px safe box)
        ctx.textAlign = 'center';
        const topSz = fitFont(ctx, epData.topLine, 940, 72, 30, 800);
        ctx.fillStyle = '#ffffff'; ctx.font = '800 ' + topSz + 'px "Kanit", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'; ctx.shadowBlur = 26;
        ctx.fillText(epData.topLine, W / 2, 220);

        const redSz = fitFont(ctx, epData.redWord, 940, 136, 36, 900);
        ctx.font = '900 ' + redSz + 'px "Kanit", sans-serif';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000'; ctx.lineWidth = Math.max(4, Math.round(redSz * 0.085)); ctx.shadowBlur = 0;
        ctx.strokeText(epData.redWord, W / 2, 365);
        ctx.fillStyle = '#dc2626';
        ctx.shadowColor = 'rgba(185, 28, 28, 0.9)'; ctx.shadowBlur = 38;
        ctx.fillText(epData.redWord, W / 2, 365);

        // Bottom Episode Stamp ONLY (NO speech bubble, NO text box!)
        const badgeY = 1380;
        ctx.font = '900 145px "Kanit", sans-serif';
        const epText = 'EP ', numText = String(epData.ep);
        const totalW = ctx.measureText(epText + numText).width;
        const startX = W / 2 - totalW / 2;
        ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'; ctx.shadowBlur = 24;
        ctx.fillText(epText, startX, badgeY);

        const epW = ctx.measureText(epText).width;
        ctx.fillStyle = '#dc2626'; ctx.shadowColor = 'rgba(220, 38, 38, 0.85)'; ctx.shadowBlur = 28;
        ctx.fillText(numText, startX + epW, badgeY);
        ctx.fillStyle = '#dc2626'; ctx.shadowBlur = 0;
        ctx.fillRect(W / 2 - 160, 1435, 320, 8);
        window.__done = true;
      };
      img.src = epData.imgUrl;
    };
  </script>
</body>
</html>`;

(async () => {
  const ffmpeg = resolveFFmpeg();
  const inMp4 = findMasterMp4();
  const tlPath = path.join(projectDir, 'timeline.json');
  if (!fs.existsSync(tlPath)) {
    console.error('Missing timeline.json — run generate_audio.js first.');
    process.exit(1);
  }
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const cfgPath = path.join(projectDir, 'shorts_config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};

  const maxSec = Number(getArg('--max-sec') || cfg.maxSec || 58);
  const minSec = Number(getArg('--min-sec') || cfg.minSec || 22);
  const allowOver60 = hasFlag('--allow-over-60');

  const { planShortsEpisodes, saveShortsPlan } = loadPlanner();
  const planned = planShortsEpisodes(tl, cfg, { maxSec, minSec, allowOver60 });
  saveShortsPlan(projectDir, planned);

  const manualCovers = Array.isArray(cfg.covers) ? cfg.covers : [];
  const episodes = planned.map((item, idx) => {
    const manual = manualCovers[idx] || {};
    return {
      ep: item.ep,
      start: item.start,
      end: item.end,
      dur: item.dur,
      keySceneId: item.keySceneId,
      keyView: item.keyView,
      keyScore: item.keyScore,
      extractAt: Number(manual.extractAt != null ? manual.extractAt : item.extractAt),
      topLine: manual.topLine || item.topLine,
      redWord: manual.redWord || item.redWord,
      rawImg: manual.rawImg || path.join(shortsDir, `raw_frame_ep${item.ep}.png`),
      outFile: manual.outFile || path.join(shortsDir, item.coverFile || `cover_shorts_ep${item.ep}.png`)
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

    console.log(`=== 1. Extracting Key-Scene Climax Frames (${episodes.length} EPs, <= ${allowOver60 ? maxSec : Math.min(maxSec, 60)}s each) ===`);
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
        execFileSync(ffmpeg, ['-y', '-ss', String(ts), '-i', inMp4, '-frames:v', '1', '-update', '1', '-q:v', '2', ep.rawImg]);
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
        execFileSync(ffmpeg, ['-y', '-ss', String(chosenAt), '-i', inMp4, '-frames:v', '1', '-update', '1', '-q:v', '2', ep.rawImg]);
      }
      if (bestLuma < 8) {
        console.warn(`  ⚠️ EP ${ep.ep} best candidate frame at ${chosenAt}s still very dark (luma=${bestLuma.toFixed(1)}). Check visual output!`);
      }
      ep.extractAt = chosenAt;
      console.log(`✓ EP ${ep.ep}: extracted @ ${chosenAt}s [${ep.keySceneId}/${ep.keyView} | score=${ep.keyScore} | luma=${bestLuma.toFixed(1)}]`);
    }

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
      console.log(`  -> Saved ${path.basename(ep.outFile)} ("${ep.topLine} / ${ep.redWord}")`);
    }
  } finally {
    await browser.close();
    try { fs.unlinkSync(htmlFile); } catch (_) {}
  }
  console.log('🎉 All Key-Scene Shorts Covers Successfully Rendered!');
})();
