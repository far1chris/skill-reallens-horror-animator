// =============================================================================
//  render_all_shorts.js — Render Dynamic Vertical Shorts (EP 1..N, <= 60s each)
//  Part of skill: reallens-horror-animator
//  Automatically packs & splits timeline scenes via shorts_planner.js so every
//  Shorts episode is <= 58s (strictly <= 60s) — scaling from EP 1..5 to EP 6,
//  EP 7, EP 8+ as story length grows.
//  Composites 3 layers with shorts/overlay_epX.png (Minimalist Title + EP Pill).
//
//  Usage:
//    node render_all_shorts.js [--input master.mp4] [--mode letterbox|zoom] [--fps 30] [--lufs -14] [--max-sec 58] [--min-sec 22] [--allow-over-60]
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

function loadPlanner() {
  for (const candidate of [
    path.join(projectDir, 'shorts_planner.js'),
    path.join(__dirname, 'shorts_planner.js')
  ]) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error('Missing shorts_planner.js — copy scripts/shorts_planner.js or run from scripts/.');
}

function resolveFFmpeg() {
  for (const r of [localReq, require]) {
    try {
      const p = r('ffmpeg-static');
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return 'ffmpeg';
}

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
  const outDir = path.join(projectDir, 'shorts');
  fs.mkdirSync(outDir, { recursive: true });

  const mode = (getArg('--mode') || 'letterbox').toLowerCase(); // 'letterbox' (keeps full HUD) | 'zoom' (1.35x Smart Center Zoom)
  const fps = getArg('--fps') || '30';
  const lufs = getArg('--lufs') || '-14.0';
  const maxSec = Number(getArg('--max-sec') || cfg.maxSec || 58);
  const minSec = Number(getArg('--min-sec') || cfg.minSec || 22);
  const allowOver60 = hasFlag('--allow-over-60');
  const prefix = path.basename(inMp4, path.extname(inMp4)).replace(/_16x9$/, '');

  const { planShortsEpisodes, saveShortsPlan } = loadPlanner();
  const epRanges = planShortsEpisodes(tl, cfg, { maxSec, minSec, allowOver60 });
  const planPath = saveShortsPlan(projectDir, epRanges);

  console.log(`=== Rendering ${epRanges.length} Vertical Shorts (1080x1920, ${fps}fps, mode=${mode}, ${lufs} LUFS, cap=${allowOver60 ? `${maxSec}s (override)` : `${Math.min(maxSec, 60)}s <= 60s`}) ===`);
  console.log(`✓ Saved Shorts plan: ${path.relative(projectDir, planPath)} (${epRanges.length} EPs)`);

  for (const item of epRanges) {
    const startSec = Number(item.start);
    const durSec = Number(item.dur);
    if (!allowOver60 && durSec > 60.0) {
      console.error(`❌ EP ${item.ep} duration ${durSec.toFixed(2)}s exceeds 60.0s YouTube Shorts limit. Lower --max-sec or check shorts_config.json.`);
      process.exit(1);
    }

    const overlayFile = path.join(outDir, item.overlayFile || `overlay_ep${item.ep}.png`);
    if (!fs.existsSync(overlayFile)) {
      console.error(`Missing overlay: ${overlayFile}. Run generate_shorts_overlays.js${getArg('--max-sec') ? ` --max-sec ${maxSec}` : ''} first.`);
      process.exit(1);
    }
    const outFile = path.join(outDir, `${prefix}_ep${item.ep}_shorts.mp4`);

    const fgFilter = mode === 'zoom'
      ? '[0:v]scale=1458:820:flags=lanczos,crop=1080:608:(iw-1080)/2:(ih-608)/2[fg];'
      : '[0:v]scale=1080:608:flags=lanczos[fg];';

    const filterComplex =
      '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:5,eq=brightness=-0.16:contrast=0.88[bg];' +
      fgFilter +
      '[bg][fg]overlay=0:576[vbase];' +
      '[vbase][1:v]overlay=0:0[vfinal]';

    console.log(`\n--- Rendering EP ${item.ep} (Start: ${startSec.toFixed(2)}s, Dur: ${durSec.toFixed(2)}s) ---`);
    const t0 = Date.now();
    execFileSync(ffmpeg, [
      '-y',
      '-ss', startSec.toFixed(3),
      '-t', durSec.toFixed(3),
      '-i', inMp4,
      '-i', overlayFile,
      '-filter_complex', filterComplex,
      '-map', '[vfinal]',
      '-map', '0:a',
      '-r', String(fps),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
      '-af', `loudnorm=I=${lufs}:LRA=7.0:TP=-1.0`,
      '-ar', '48000',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
      outFile
    ]);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const size = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
    console.log(`  -> Finished EP ${item.ep} in ${elapsed}s | Size: ${size} MB | ${path.basename(outFile)}`);
  }

  console.log('\n🎉 All Vertical Shorts Episodes Rendered Successfully!');
})();
