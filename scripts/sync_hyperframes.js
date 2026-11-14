// =============================================================================
//  sync_hyperframes.js — Synchronize timeline.json + local Kanit & GSAP assets
//  into index.html for 100% HyperFrames CLI & Studio compatibility (0 warnings).
//  Part of skill: reallens-horror-animator
//
//  Usage:
//    node sync_hyperframes.js [--dir <projectDir>] [--width 1280] [--height 720] [--fps 24]
// =============================================================================
const fs = require('fs');
const path = require('path');

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

const dir = path.resolve(getArg('--dir') || process.cwd());
const tlPath = path.join(dir, 'timeline.json');
const htmlPath = path.join(dir, 'index.html');

if (!fs.existsSync(tlPath)) {
  console.error('Missing timeline.json — run generate_audio.js first.');
  process.exit(1);
}
if (!fs.existsSync(htmlPath)) {
  console.error('Missing index.html in:', dir);
  process.exit(1);
}

// 1. Localize Kanit woff2 fonts into assets/fonts/ for offline/Docker/HyperFrames lint
const fontsSrcDir = path.join(dir, 'node_modules', '@fontsource', 'kanit', 'files');
const fontsDstDir = path.join(dir, 'assets', 'fonts');
let copiedFonts = 0;
if (fs.existsSync(fontsSrcDir)) {
  fs.mkdirSync(fontsDstDir, { recursive: true });
  for (const file of fs.readdirSync(fontsSrcDir)) {
    if ((file.startsWith('kanit-thai-') || file.startsWith('kanit-latin-')) && file.endsWith('-normal.woff2')) {
      fs.copyFileSync(path.join(fontsSrcDir, file), path.join(fontsDstDir, file));
      copiedFonts++;
    }
  }
}

// 2. Localize GSAP runtime into assets/vendor/gsap.min.js if installed in node_modules
const gsapSrc = path.join(dir, 'node_modules', 'gsap', 'dist', 'gsap.min.js');
const gsapDstDir = path.join(dir, 'assets', 'vendor');
let copiedGsap = false;
if (fs.existsSync(gsapSrc)) {
  fs.mkdirSync(gsapDstDir, { recursive: true });
  fs.copyFileSync(gsapSrc, path.join(gsapDstDir, 'gsap.min.js'));
  copiedGsap = true;
}

const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const total = Number(tl.total.toFixed(3));
let html = fs.readFileSync(htmlPath, 'utf8');

// Preserve existing #root dimensions/fps if present, or override via CLI flags
const rootTagMatch = html.match(/<div\b[^>]*\bid=["']root["'][^>]*>/i);
const existingTag = rootTagMatch ? rootTagMatch[0] : '';
const readAttr = (name, fallback) => {
  const m = existingTag.match(new RegExp(`${name}=["'](\\d+)["']`, 'i'));
  return m ? m[1] : fallback;
};

const width = getArg('--width') || readAttr('data-width', '1280');
const height = getArg('--height') || readAttr('data-height', '720');
const fps = getArg('--fps') || readAttr('data-fps', '24');

// 3. Build scene track markers (<= 3 per lane for 0 lint warnings) + data-beat attributes
const sceneClips = tl.scenes.map((s, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const start = Number(s.start.toFixed(3));
  const dur = Number(s.dur.toFixed(3));
  const trackIdx = 1 + Math.floor(idx / 3);
  const safeView = String(s.view).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `  <div id="scene-${num}-${safeView}" class="clip" data-start="${start}" data-duration="${dur}" data-track-index="${trackIdx}" data-track-kind="graphics" data-beat="s${num}:${safeView}" data-layout-ignore style="pointer-events:none;"></div>`;
}).join('\n');

const audioTrackIdx = 1 + Math.ceil(tl.scenes.length / 3);
const audioRelPath = fs.existsSync(path.join(dir, 'audio', 'master.wav'))
  ? 'audio/master.wav'
  : (fs.existsSync(path.join(dir, 'audio', 'master.mp3')) ? 'audio/master.mp3' : 'audio/master.wav');

const newRootBlock = `<div
  id="root"
  data-composition-id="main"
  data-start="0"
  data-duration="${total}"
  data-width="${width}"
  data-height="${height}"
  data-fps="${fps}"
>
  <canvas
    id="stage"
    class="clip"
    data-start="0"
    data-duration="${total}"
    data-track-index="0"
    data-layout-ignore
    data-hold
    width="${width}"
    height="${height}"
  ></canvas>
${sceneClips}
  <audio
    id="master-audio"
    class="clip"
    data-start="0"
    data-duration="${total}"
    data-track-index="${audioTrackIdx}"
    data-volume="1"
    src="${audioRelPath}"
  ></audio>
</div>`;

// Replace either marker-wrapped block or balanced <div id="root">...</div>
const markerPattern = /<!--\s*HF:ROOT_START\s*-->[\s\S]*?<!--\s*HF:ROOT_END\s*-->/;
if (markerPattern.test(html)) {
  html = html.replace(
    markerPattern,
    `<!-- HF:ROOT_START -->\n${newRootBlock}\n<!-- HF:ROOT_END -->`
  );
} else {
  const rootStartMatch = html.match(/<div\b[^>]*\bid=["']root["'][^>]*>/i);
  if (!rootStartMatch) {
    console.error('Could not locate <div id="root"> inside index.html.');
    process.exit(1);
  }
  const startIdx = rootStartMatch.index;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = startIdx;
  let depth = 0;
  let endIdx = -1;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    if (m[0].startsWith('</')) {
      depth--;
      if (depth === 0) {
        endIdx = m.index + m[0].length;
        break;
      }
    } else {
      depth++;
    }
  }
  if (endIdx === -1) {
    console.error('Unbalanced <div> tags around <div id="root"> in index.html.');
    process.exit(1);
  }
  html = html.slice(0, startIdx) + newRootBlock + html.slice(endIdx);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(
  `[HyperFrames Sync] Updated index.html -> ${width}x${height}@${fps}fps, duration=${total}s, scenes=${tl.scenes.length}, fonts=${copiedFonts}, localGsap=${copiedGsap}`
);
