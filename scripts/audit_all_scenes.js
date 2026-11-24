// =============================================================================
//  audit_all_scenes.js — Mandatory Pre-Render All-Scene Visual & Narration QA
//  Part of skill: reallens-horror-animator
//  1. Runs Automated Narration & Audio Tail QA (camera-command leaks, unmapped
//     English acronyms, mid-video CTAs before final scene, audio tail clipping/cut).
//  2. Renders every scene (1..N) from timeline.json/index.html into one composite
//     PNG (audit_all_scenes.png) and checks for JS errors & missing VIEWS mappings.
//
//  Usage:
//    node audit_all_scenes.js [--dir <projectDir>] [--cols 6] [--out audit_all_scenes.png] [--qa-only] [--strict-warnings]
// =============================================================================
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
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

function loadNarrationQA() {
  for (const candidate of [
    path.join(projectDir, 'narration_qa.js'),
    path.join(__dirname, 'narration_qa.js'),
    path.join(__dirname, '..', 'scripts', 'narration_qa.js')
  ]) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  return null;
}

function findBrowserExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ]
    : process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
        ]
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

function runProjectNarrationAudit() {
  const qaMod = loadNarrationQA();
  if (!qaMod) return { pass: true, errors: [], warnings: [] };

  let episodeMod = null;
  const epPath = path.join(projectDir, 'episode.js');
  if (fs.existsSync(epPath)) {
    try {
      delete require.cache[require.resolve(epPath)];
      episodeMod = require(epPath);
    } catch (_) {}
  }

  let scenes = Array.isArray(episodeMod?.SCENES) ? episodeMod.SCENES : [];
  const tlPath = path.join(projectDir, 'timeline.json');
  if (scenes.length === 0 && fs.existsSync(tlPath)) {
    try {
      const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
      if (Array.isArray(tl.scenes)) scenes = tl.scenes;
    } catch (_) {}
  }

  const qa = qaMod.runNarrationQA({ projectDir, scenes, episodeMod, checkAudioFiles: true });
  qaMod.printNarrationQAReport(qa);
  return qa;
}

(async () => {
  const qaResult = runProjectNarrationAudit();
  const strictWarnings = hasFlag('--strict-warnings');

  if (hasFlag('--qa-only')) {
    if (!qaResult.pass || (strictWarnings && qaResult.warnings.length > 0)) {
      process.exit(1);
    }
    return;
  }

  const htmlPath = path.join(projectDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('Missing index.html in:', projectDir);
    process.exit(1);
  }

  const puppeteer = loadPuppeteer();
  const executablePath = findBrowserExecutable();
  const cols = Math.max(1, parseInt(getArg('--cols') || '6', 10));
  const tw = 440, th = 248;
  const outPath = path.resolve(projectDir, getArg('--out') || 'audit_all_scenes.png');

  const htmlRaw = fs.readFileSync(htmlPath, 'utf8');
  const rootMatch = htmlRaw.match(/<div\b[^>]*\bid=["']root["'][^>]*>/i);
  const rootTag = rootMatch ? rootMatch[0] : '';
  const wMatch = rootTag.match(/data-width=["'](\d+)["']/i);
  const hMatch = rootTag.match(/data-height=["'](\d+)["']/i);
  const viewW = wMatch ? parseInt(wMatch[1], 10) : 1920;
  const viewH = hMatch ? parseInt(hMatch[1], 10) : 1080;

  let browser;
  try {
    browser = await puppeteer.launch({
      ...(executablePath ? { executablePath } : {}),
      headless: 'new',
      args: ['--no-sandbox', '--allow-file-access-from-files', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
    });
  } catch (_) {
    browser = await puppeteer.launch({
      ...(executablePath ? { executablePath } : {}),
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
    });
  }

  const pageErrors = [];
  const page = await browser.newPage();
  page.on('pageerror', err => pageErrors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(`CONSOLE ERR: ${msg.text()}`);
  });

  await page.setViewport({ width: viewW, height: viewH, deviceScaleFactor: 1 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.evaluate(async () => {
    if (window.__setHeadless) window.__setHeadless();
    await document.fonts.ready;
  });

  const scenes = await page.evaluate(() => {
    const tl = window.TIMELINE;
    if (!tl || !Array.isArray(tl.scenes)) return [];
    const views = window.VIEWS || (typeof VIEWS !== 'undefined' ? VIEWS : {});
    return tl.scenes.map((s, i) => ({
      idx: i + 1,
      id: s.id,
      view: s.view,
      start: s.start,
      dur: s.dur,
      hasView: typeof views[s.view] === 'function'
    }));
  });

  if (scenes.length === 0) {
    await browser.close();
    console.error('No scenes found in window.TIMELINE.scenes.');
    process.exit(1);
  }

  const missingViews = scenes.filter(s => !s.hasView);
  const shots = [];
  for (const s of scenes) {
    const sampleT = s.start + Math.min(s.dur * 0.65, Math.max(1.0, s.dur - 0.5));
    await page.evaluate(t => window.renderAtTime(t), sampleT);
    const b64 = await page.evaluate(() => document.getElementById('stage').toDataURL('image/png'));
    shots.push({ ...s, b64 });
  }

  const rows = Math.ceil(shots.length / cols);
  const gridPage = await browser.newPage();
  await gridPage.setViewport({ width: cols * tw, height: rows * (th + 34), deviceScaleFactor: 1 });
  const cells = shots.map(s => `
    <div style="width:${tw}px;height:${th + 34}px;background:#111;border:1px solid ${s.hasView ? '#333' : '#ef4444'};box-sizing:border-box;font-family:sans-serif;">
      <div style="height:34px;line-height:34px;padding:0 10px;color:#fff;font-size:13px;font-weight:bold;background:${s.hasView ? '#1e1e24' : '#7f1d1d'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        #${s.idx} ${s.id} (${s.view})${s.hasView ? '' : ' [MISSING VIEW!]'}
      </div>
      <img src="${s.b64}" style="width:${tw}px;height:${th}px;display:block;" />
    </div>`).join('');

  await gridPage.setContent(`<html><body style="margin:0;display:flex;flex-wrap:wrap;background:#000;">${cells}</body></html>`);
  await gridPage.screenshot({ path: outPath, fullPage: true });
  await browser.close();

  console.log(`\nSaved ${shots.length}-scene audit grid to: ${outPath}`);
  if (missingViews.length > 0) {
    console.error(`❌ Missing VIEWS mappings for ${missingViews.length} scene(s):`, missingViews.map(s => s.view).join(', '));
  }
  if (pageErrors.length > 0) {
    console.error('❌ Runtime errors captured during scene sweep:\n' + pageErrors.join('\n'));
    process.exit(1);
  }
  if (missingViews.length > 0) process.exit(1);
  if (!qaResult.pass || (strictWarnings && qaResult.warnings.length > 0)) {
    console.error('❌ Automated Narration & Audio Tail QA failed. Fix errors listed above before rendering.');
    process.exit(1);
  }
})();
