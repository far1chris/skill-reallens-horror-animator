// =============================================================================
//  audit_all_scenes.js — Mandatory Pre-Render All-Scene Visual & Narration QA
//  Part of skill: reallens-horror-animator
//  1. Runs Automated Narration & Audio Tail QA (camera-command leaks, unmapped
//     English acronyms, mid-video CTAs before final scene, audio tail clipping/cut).
//  2. Renders every scene (1..N or `--scenes ...`) into a 4-column HD overview
//     grid (`audit_all_scenes.png`) with timestamps & Thai caption bars.
//  3. Exports full-resolution per-scene PNGs (`scene_previews/`) and an offline
//     interactive storyboard checklist (`scene_review.html`) for Gate 1 review.
//
//  Usage:
//    node audit_all_scenes.js [--dir <projectDir>] [--cols 4] [--out audit_all_scenes.png] [--scenes 2,5] [--no-singles] [--previews-dir scene_previews] [--qa-only] [--strict-warnings]
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

/** Escape HTML special characters before template injection. */
function escHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format seconds into compact M:SS display. */
function fmtTime(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

function sanitizeFileToken(str) {
  return String(str || 'scene').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 64) || 'scene';
}

function parseSceneFilter(raw) {
  if (!raw) return null;
  const set = new Set(
    raw.split(',').map(v => v.trim().toLowerCase()).filter(Boolean)
  );
  return set.size > 0 ? set : null;
}

/** Read optional scene narration/visual/camera metadata directly from episode.js. */
function loadEpisodeMeta(targetDir) {
  const byId = new Map();
  const byIdx = [];
  const epPath = path.join(targetDir, 'episode.js');
  if (!fs.existsSync(epPath)) return { title: path.basename(targetDir), module: null, byId, byIdx };
  try {
    delete require.cache[require.resolve(epPath)];
    const ep = require(epPath);
    const list = Array.isArray(ep?.SCENES) ? ep.SCENES : [];
    list.forEach((sc, i) => {
      if (!sc || typeof sc !== 'object') return;
      byIdx[i] = sc;
      if (sc.id) byId.set(String(sc.id), sc);
    });
    return { title: ep?.TITLE || path.basename(targetDir), module: ep, byId, byIdx };
  } catch (_) {
    return { title: path.basename(targetDir), module: null, byId, byIdx };
  }
}

function runProjectNarrationAudit(epMeta) {
  const qaMod = loadNarrationQA();
  if (!qaMod) return { pass: true, errors: [], warnings: [] };

  const episodeMod = epMeta.module;
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

/** Generate standalone offline interactive HTML storyboard for Gate 1 scene review. */
function buildSceneReviewHtml({ projectTitle, totalDur, gridRelPath, shots }) {
  const cards = shots.map(s => {
    const timeRange = `${fmtTime(s.start)}–${fmtTime(s.start + s.dur)} (${s.dur.toFixed(1)}s)`;
    const visualBlock = (s.visualPrompt || s.cameraNote)
      ? `<div class="meta-notes">${s.visualPrompt ? `<div><span>ภาพ:</span> ${escHtml(s.visualPrompt)}</div>` : ''}${s.cameraNote ? `<div><span>กล้อง:</span> ${escHtml(s.cameraNote)}</div>` : ''}</div>`
      : '';
    return `
    <article class="card" data-idx="${s.idx}" data-id="${escHtml(s.id)}" data-view="${escHtml(s.view)}" data-time="${escHtml(timeRange)}">
      <div class="card-head">
        <span class="num">#${s.idx}</span>
        <span class="scene-id" title="${escHtml(s.id)}">${escHtml(s.id)}</span>
        <span class="view-pill${s.hasView ? '' : ' missing'}" title="${escHtml(s.view)}">${escHtml(s.view || 'no-view')}${s.hasView ? '' : ' [MISSING]'}</span>
        <span class="time-pill">${escHtml(timeRange)}</span>
      </div>
      <div class="thumb-wrap" data-full="${escHtml(s.previewRel)}" data-caption="${escHtml(s.caption || '')}" title="คลิกเพื่อขยายเต็มจอ 1:1">
        <img src="${escHtml(s.previewRel)}" alt="#${s.idx} ${escHtml(s.id)}" loading="lazy" />
        <span class="zoom-hint">ขยาย 1:1</span>
      </div>
      <div class="card-body">
        <div class="caption-box"><strong>บทพากย์/ซับ:</strong> ${escHtml(s.caption || '— ไม่มีข้อความ —')}</div>
        ${visualBlock}
        <div class="flag-row">
          <label class="flag-label"><input type="checkbox" class="flag-check" /> ต้องแก้ฉากนี้</label>
          <input type="text" class="flag-note" placeholder="ระบุจุดที่อยากแก้ เช่น เปลี่ยนมุมกล้อง / แก้แสง / แก้ซับ..." />
        </div>
      </div>
    </article>`;
  }).join('\n');

  const safeTitle = escHtml(projectTitle || 'Scene Review');
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Gate 1 Scene Review — ${safeTitle}</title>
<style>
  :root { color-scheme: dark; --bg: #080c12; --card: #101722; --border: #232d3f; --text: #f1f5f9; --muted: #94a3b8; --accent: #38bdf8; --warn: #ef4444; --ok: #22c55e; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: "Kanit", "Segoe UI", Tahoma, sans-serif; }
  header.topbar { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 22px; background: rgba(8,12,18,0.95); border-bottom: 1px solid var(--border); backdrop-filter: blur(8px); }
  .title-wrap h1 { margin: 0; font-size: 18px; font-weight: 700; }
  .title-wrap p { margin: 2px 0 0; font-size: 13px; color: var(--muted); }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .count-pill { padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #1e293b; border: 1px solid var(--border); }
  .count-pill.has-flags { background: rgba(239,68,68,0.18); border-color: var(--warn); color: #fca5a5; }
  button { cursor: pointer; border: 1px solid var(--border); background: #1e293b; color: var(--text); padding: 8px 14px; border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 600; }
  button:hover { border-color: var(--accent); }
  button.primary { background: #0284c7; border-color: #38bdf8; color: #fff; }
  button.primary.approve { background: #15803d; border-color: #22c55e; }
  main.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(390px, 1fr)); gap: 16px; padding: 20px 22px 48px; }
  article.card { background: var(--card); border: 2px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: border-color .15s; }
  article.card.flagged { border-color: var(--warn); box-shadow: 0 0 0 1px rgba(239,68,68,0.4); }
  article.card.hidden { display: none; }
  .card-head { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: #161f2e; font-size: 12.5px; border-bottom: 1px solid var(--border); }
  .num { background: #0284c7; color: #fff; font-weight: 700; padding: 2px 7px; border-radius: 6px; flex: 0 0 auto; }
  .scene-id { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
  .view-pill { background: #0b1220; color: #7dd3fc; border: 1px solid #1e3a5f; padding: 2px 7px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; font-size: 11.5px; }
  .view-pill.missing { background: #7f1d1d; color: #fecaca; border-color: #ef4444; }
  .time-pill { margin-left: auto; color: var(--muted); font-size: 11.5px; white-space: nowrap; }
  .thumb-wrap { position: relative; aspect-ratio: 16 / 9; background: #000; cursor: zoom-in; overflow: hidden; }
  .thumb-wrap img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .zoom-hint { position: absolute; right: 8px; bottom: 8px; background: rgba(0,0,0,0.72); color: #e2e8f0; font-size: 11px; padding: 3px 8px; border-radius: 6px; opacity: 0.85; }
  .card-body { padding: 11px 12px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .caption-box { font-size: 13.5px; line-height: 1.45; color: #f8fafc; }
  .meta-notes { font-size: 12px; line-height: 1.4; color: var(--muted); background: #0b111b; padding: 7px 9px; border-radius: 8px; border: 1px solid #1e293b; }
  .meta-notes span { color: #93c5fd; font-weight: 600; }
  .flag-row { margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-top: 6px; border-top: 1px solid #1e293b; }
  .flag-label { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: #fca5a5; cursor: pointer; user-select: none; }
  .flag-check { width: 16px; height: 16px; accent-color: var(--warn); }
  .flag-note { width: 100%; background: #090d16; border: 1px solid var(--border); color: var(--text); border-radius: 7px; padding: 7px 9px; font-family: inherit; font-size: 12.5px; }
  .flag-note:focus { outline: none; border-color: var(--accent); }
  dialog#lightbox { border: none; border-radius: 12px; padding: 0; background: #06090f; color: var(--text); max-width: 95vw; max-height: 94vh; box-shadow: 0 24px 60px rgba(0,0,0,0.85); }
  dialog#lightbox::backdrop { background: rgba(0,0,0,0.84); }
  .lb-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; background: #101722; border-bottom: 1px solid var(--border); font-size: 13px; }
  .lb-img { display: block; max-width: 94vw; max-height: 78vh; margin: 0 auto; object-fit: contain; }
  .lb-cap { padding: 10px 14px; font-size: 14px; background: #0b111b; border-top: 1px solid var(--border); }
</style>
</head>
<body>
<header class="topbar">
  <div class="title-wrap">
    <h1>Gate 1: ตรวจทุกฉากก่อนเรนเดอร์คลิปยาว — ${safeTitle}</h1>
    <p>ทั้งหมด ${shots.length} ฉาก · ความยาวรวม ${escHtml(fmtTime(totalDur))} · ภาพรวม 4 คอลัมน์: <a href="${escHtml(gridRelPath)}" style="color:#7dd3fc">${escHtml(gridRelPath)}</a></p>
  </div>
  <div class="actions">
    <span id="flagCount" class="count-pill">ต้องแก้: 0 ฉาก</span>
    <button type="button" id="toggleFlaggedBtn">ดูเฉพาะฉากที่ติ๊กแก้</button>
    <button type="button" id="clearFlagsBtn">ล้างติ๊กทั้งหมด</button>
    <button type="button" id="copyBtn" class="primary approve">คัดลอกคำสั่งอนุมัติ (0 ฉากต้องแก้)</button>
  </div>
</header>
<main class="grid" id="grid">${cards}</main>
<dialog id="lightbox">
  <div class="lb-bar">
    <span id="lbTitle"></span>
    <div style="display:flex;gap:8px;">
      <button type="button" id="lbPrev">← ฉากก่อนหน้า</button>
      <button type="button" id="lbNext">ฉากถัดไป →</button>
      <button type="button" id="lbClose">ปิด (Esc)</button>
    </div>
  </div>
  <img id="lbImg" class="lb-img" src="" alt="" />
  <div id="lbCap" class="lb-cap"></div>
</dialog>
<script>
(() => {
  const cards = Array.from(document.querySelectorAll('article.card'));
  const flagCountEl = document.getElementById('flagCount');
  const copyBtn = document.getElementById('copyBtn');
  const toggleBtn = document.getElementById('toggleFlaggedBtn');
  const clearBtn = document.getElementById('clearFlagsBtn');
  let onlyFlagged = false;

  function syncState() {
    let n = 0;
    cards.forEach(c => {
      const checked = c.querySelector('.flag-check').checked;
      c.classList.toggle('flagged', checked);
      c.classList.toggle('hidden', onlyFlagged && !checked);
      if (checked) n++;
    });
    flagCountEl.textContent = 'ต้องแก้: ' + n + ' ฉาก';
    flagCountEl.classList.toggle('has-flags', n > 0);
    copyBtn.textContent = n > 0
      ? 'คัดลอกรายการฉากที่ต้องแก้ (' + n + ')'
      : 'คัดลอกคำสั่งอนุมัติ (0 ฉากต้องแก้)';
    copyBtn.classList.toggle('approve', n === 0);
  }

  cards.forEach(c => {
    c.querySelector('.flag-check').addEventListener('change', syncState);
    c.querySelector('.flag-note').addEventListener('input', e => {
      const chk = c.querySelector('.flag-check');
      if (e.target.value.trim() && !chk.checked) {
        chk.checked = true;
        syncState();
      }
    });
  });

  toggleBtn.addEventListener('click', () => {
    onlyFlagged = !onlyFlagged;
    toggleBtn.textContent = onlyFlagged ? 'แสดงทุกฉาก' : 'ดูเฉพาะฉากที่ติ๊กแก้';
    syncState();
  });

  clearBtn.addEventListener('click', () => {
    cards.forEach(c => {
      c.querySelector('.flag-check').checked = false;
      c.querySelector('.flag-note').value = '';
    });
    onlyFlagged = false;
    toggleBtn.textContent = 'ดูเฉพาะฉากที่ติ๊กแก้';
    syncState();
  });

  copyBtn.addEventListener('click', async () => {
    const flagged = cards.filter(c => c.querySelector('.flag-check').checked);
    const msg = flagged.length === 0
      ? 'ตรวจครบทุกฉากแล้ว อนุมัติให้เรนเดอร์คลิปยาวได้เลย'
      : 'แก้ฉากก่อนเรนเดอร์คลิปยาว:\\n' + flagged.map(c => {
          const note = c.querySelector('.flag-note').value.trim() || 'ตรวจสอบ/ปรับภาพหรือมุมกล้อง';
          return '- ฉาก #' + c.dataset.idx + ' (' + c.dataset.id + ' | ' + c.dataset.view + ' @ ' + c.dataset.time + '): ' + note;
        }).join('\\n');
    try {
      await navigator.clipboard.writeText(msg);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    const prev = copyBtn.textContent;
    copyBtn.textContent = 'คัดลอกลงคลิปบอร์ดแล้ว!';
    setTimeout(() => { copyBtn.textContent = prev; syncState(); }, 1500);
  });

  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbTitle = document.getElementById('lbTitle');
  const lbCap = document.getElementById('lbCap');
  let cur = 0;

  function openLb(index) {
    cur = (index + cards.length) % cards.length;
    const c = cards[cur];
    const tw = c.querySelector('.thumb-wrap');
    lbImg.src = tw.dataset.full;
    lbTitle.textContent = '#' + c.dataset.idx + ' ' + c.dataset.id + ' (' + c.dataset.view + ') · ' + c.dataset.time;
    lbCap.textContent = tw.dataset.caption || '';
    if (!lb.open) lb.showModal();
  }

  cards.forEach((c, i) => c.querySelector('.thumb-wrap').addEventListener('click', () => openLb(i)));
  document.getElementById('lbPrev').addEventListener('click', () => openLb(cur - 1));
  document.getElementById('lbNext').addEventListener('click', () => openLb(cur + 1));
  document.getElementById('lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  window.addEventListener('keydown', e => {
    if (!lb.open) return;
    if (e.key === 'ArrowLeft') openLb(cur - 1);
    else if (e.key === 'ArrowRight') openLb(cur + 1);
  });
})();
</script>
</body>
</html>`;
}

(async () => {
  const epMeta = loadEpisodeMeta(projectDir);
  const qaResult = runProjectNarrationAudit(epMeta);
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
  const cols = Math.max(1, parseInt(getArg('--cols') || '4', 10));
  const sceneFilter = parseSceneFilter(getArg('--scenes'));
  const noSingles = hasFlag('--no-singles');
  const previewsDirName = getArg('--previews-dir') || 'scene_previews';
  const defaultOutName = sceneFilter ? 'audit_selected_scenes.png' : 'audit_all_scenes.png';
  const tw = 480, th = 270;
  const outPath = path.resolve(projectDir, getArg('--out') || defaultOutName);

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

  const timelineScenes = await page.evaluate(() => {
    const tl = window.TIMELINE;
    if (!tl || !Array.isArray(tl.scenes)) return { total: 0, scenes: [] };
    const views = window.VIEWS || (typeof VIEWS !== 'undefined' ? VIEWS : {});
    return {
      total: Number(tl.total) || 0,
      scenes: tl.scenes.map((s, i) => ({
        idx: i + 1,
        id: s.id || `scene_${i + 1}`,
        view: s.view || '',
        start: Number(s.start) || 0,
        dur: Number(s.dur) || 0,
        hasView: typeof views[s.view] === 'function',
        subsText: Array.isArray(s.subs) ? s.subs.map(x => (x && x.text ? String(x.text).trim() : '')).filter(Boolean).join(' ') : '',
        tlNarration: s.narration ? String(s.narration) : '',
        tlVo: s.vo ? String(s.vo) : '',
        tlVisual: s.visual_prompt ? String(s.visual_prompt) : '',
        tlCamera: s.camera_note ? String(s.camera_note) : '',
        tlPhase: s.phase ? String(s.phase) : ''
      }))
    };
  });

  if (timelineScenes.scenes.length === 0) {
    await browser.close();
    console.error('No scenes found in window.TIMELINE.scenes.');
    process.exit(1);
  }

  const enriched = timelineScenes.scenes.map((s, i) => {
    const epSc = epMeta.byId.get(s.id) || epMeta.byIdx[i] || {};
    const narration = epSc.narration || s.tlNarration || '';
    const vo = epSc.vo || s.tlVo || '';
    const visualPrompt = epSc.visual_prompt || s.tlVisual || '';
    const cameraNote = epSc.camera_note || s.tlCamera || '';
    const phase = epSc.phase || s.tlPhase || '';
    const caption = (narration || vo || s.subsText || '').replace(/\s+/g, ' ').trim();
    return { ...s, narration, vo, visualPrompt, cameraNote, phase, caption };
  });

  const targetScenes = sceneFilter
    ? enriched.filter(s => sceneFilter.has(String(s.idx)) || sceneFilter.has(String(s.id).toLowerCase()))
    : enriched;

  if (targetScenes.length === 0) {
    await browser.close();
    console.error(`No scenes matched --scenes "${getArg('--scenes')}". Available: 1..${enriched.length}`);
    process.exit(1);
  }

  const previewsDir = path.resolve(projectDir, previewsDirName);
  if (!noSingles) fs.mkdirSync(previewsDir, { recursive: true });

  const missingViews = targetScenes.filter(s => !s.hasView);
  const shots = [];
  for (const s of targetScenes) {
    const sampleT = s.start + Math.min(s.dur * 0.65, Math.max(Math.min(1.0, s.dur * 0.5), s.dur - 0.5));
    await page.evaluate(t => window.renderAtTime(t), sampleT);
    const b64 = await page.evaluate(() => document.getElementById('stage').toDataURL('image/png'));
    let previewRel = '';
    if (!noSingles) {
      const fileName = `${String(s.idx).padStart(2, '0')}_${sanitizeFileToken(s.id)}.png`;
      const absFile = path.join(previewsDir, fileName);
      fs.writeFileSync(absFile, Buffer.from(b64.slice(b64.indexOf(',') + 1), 'base64'));
      previewRel = path.relative(projectDir, absFile).replace(/\\/g, '/');
    }
    shots.push({ ...s, b64, previewRel });
  }

  const gridCols = Math.min(cols, shots.length);
  const rows = Math.ceil(shots.length / gridCols);
  const cellH = 34 + th + 32;
  const gridPage = await browser.newPage();
  await gridPage.setViewport({ width: gridCols * tw, height: rows * cellH, deviceScaleFactor: 1 });
  const cells = shots.map(s => {
    const timeLabel = `${fmtTime(s.start)}–${fmtTime(s.start + s.dur)} (${s.dur.toFixed(1)}s)`;
    return `
    <div style="width:${tw}px;height:${cellH}px;background:#111;border:1px solid ${s.hasView ? '#2b3242' : '#ef4444'};box-sizing:border-box;font-family:'Kanit','Segoe UI',Tahoma,sans-serif;overflow:hidden;">
      <div style="height:34px;line-height:34px;padding:0 10px;color:#fff;font-size:13px;font-weight:700;background:${s.hasView ? '#1b2232' : '#7f1d1d'};display:flex;justify-content:space-between;gap:8px;">
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">#${s.idx} ${escHtml(s.id)} (${escHtml(s.view)})${s.hasView ? '' : ' [MISSING VIEW!]'}</span>
        <span style="color:#93c5fd;font-weight:600;flex:0 0 auto;">${escHtml(timeLabel)}</span>
      </div>
      <img src="${s.b64}" style="width:${tw}px;height:${th}px;display:block;background:#000;" />
      <div style="height:32px;line-height:32px;padding:0 10px;color:#e2e8f0;font-size:12.5px;background:#12161f;border-top:1px solid #242b3a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${escHtml(s.caption || '— ไม่มีบทพากย์/ซับ —')}
      </div>
    </div>`;
  }).join('');

  await gridPage.setContent(`<html><body style="margin:0;display:flex;flex-wrap:wrap;background:#000;">${cells}</body></html>`);
  await gridPage.screenshot({ path: outPath, fullPage: true });
  await browser.close();

  const totalDur = timelineScenes.total || enriched.reduce((acc, s) => Math.max(acc, s.start + s.dur), 0);
  const reviewHtmlPath = path.join(projectDir, 'scene_review.html');
  if (!sceneFilter && !noSingles) {
    const gridRelPath = path.relative(projectDir, outPath).replace(/\\/g, '/');
    fs.writeFileSync(
      reviewHtmlPath,
      buildSceneReviewHtml({ projectTitle: epMeta.title, totalDur, gridRelPath, shots }),
      'utf8'
    );
  }

  console.log(`\nSaved ${shots.length}-scene HD audit grid (${gridCols} cols): ${outPath}`);
  if (!noSingles) console.log(`Saved ${shots.length} full-resolution scene previews in: ${previewsDir}`);
  if (!sceneFilter && !noSingles) console.log(`Saved interactive Gate 1 scene review gallery: ${reviewHtmlPath}`);
  console.log('Gate 1 (Pre-Render Scene Review): Present audit grid + scene_review.html to the user and wait for approval before rendering long-form MP4.');

  if (missingViews.length > 0) {
    console.error(`Missing VIEWS mappings for ${missingViews.length} scene(s):`, missingViews.map(s => s.view).join(', '));
  }
  if (pageErrors.length > 0) {
    console.error('Runtime errors captured during scene sweep:\n' + pageErrors.join('\n'));
    process.exit(1);
  }
  if (missingViews.length > 0) process.exit(1);
  if (!qaResult.pass || (strictWarnings && qaResult.warnings.length > 0)) {
    console.error('Automated Narration & Audio Tail QA failed. Fix errors listed above before rendering.');
    process.exit(1);
  }
})();
