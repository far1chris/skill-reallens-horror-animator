// =============================================================================
//  sync_hyperframes.js — Synchronize timeline.json + Kanit fonts into index.html
//  for 100% HyperFrames CLI & Studio compatibility (0 lint errors / warnings)
//  Part of skill: reallens-horror-animator
// =============================================================================
const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const tlPath = path.join(dir, 'timeline.json');
const htmlPath = path.join(dir, 'index.html');

if (!fs.existsSync(tlPath)) {
  console.error('Missing timeline.json — run generate_audio.js first.');
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error('Missing index.html in current working directory.');
  process.exit(1);
}

// 1. Ensure local Kanit woff2 fonts exist in assets/fonts/ for offline/Docker/HyperFrames lint
const fontsSrcDir = path.join(dir, 'node_modules', '@fontsource', 'kanit', 'files');
const fontsDstDir = path.join(dir, 'assets', 'fonts');
if (fs.existsSync(fontsSrcDir)) {
  fs.mkdirSync(fontsDstDir, { recursive: true });
  for (const file of fs.readdirSync(fontsSrcDir)) {
    if ((file.startsWith('kanit-thai-') || file.startsWith('kanit-latin-')) && file.endsWith('-normal.woff2')) {
      fs.copyFileSync(path.join(fontsSrcDir, file), path.join(fontsDstDir, file));
    }
  }
}

const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const total = Number(tl.total.toFixed(3));

// 2. Build scene track markers grouped by 3 per lane (data-track-index="1"..N, <= 3 per track for 0 lint warnings) + data-beat attributes
const sceneClips = tl.scenes.map((s, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const start = Number(s.start.toFixed(3));
  const dur = Number(s.dur.toFixed(3));
  const trackIdx = 1 + Math.floor(idx / 3);
  const safeView = String(s.view).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `  <div id="scene-${num}-${safeView}" class="clip" data-start="${start}" data-duration="${dur}" data-track-index="${trackIdx}" data-track-kind="graphics" data-beat="s${num}:${safeView}" data-layout-ignore style="pointer-events:none;"></div>`;
}).join('\n');

const audioTrackIdx = 1 + Math.ceil(tl.scenes.length / 3);
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace root composition block with synchronized duration, canvas, scene markers, and master audio
const newRootBlock = `<div
  id="root"
  data-composition-id="main"
  data-start="0"
  data-duration="${total}"
  data-width="1280"
  data-height="720"
  data-fps="24"
>
  <canvas
    id="stage"
    class="clip"
    data-start="0"
    data-duration="${total}"
    data-track-index="0"
    data-layout-ignore
    data-hold
    width="1280"
    height="720"
  ></canvas>
${sceneClips}
  <audio
    id="master-audio"
    class="clip"
    data-start="0"
    data-duration="${total}"
    data-track-index="${audioTrackIdx}"
    data-volume="1"
    src="audio/master.wav"
  ></audio>
</div>`;

html = html.replace(/<div\s+id="root"[\s\S]*?<\/div>\s*(?=<script src="timeline\.js">)/, newRootBlock + '\n\n');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`[HyperFrames Sync] Updated index.html -> duration=${total}s, scenes=${tl.scenes.length}, fonts localized in assets/fonts/`);
