// =============================================================================
//  render_all_shorts.js — Render Standalone (45-60s) & Max-2-Part Shorts (9:16)
//  Part of skill: reallens-horror-animator
//  Supports:
//    - Format "single"   : Condensed 1-clip full arc (45-58s) -> master_hf_single_short.mp4
//    - Format "two_part" : Max 2 parts (EP 1 + EP 2 ตอนจบ <= 58s each), with 3s recap in EP 2
//    - Format "both"     : Renders BOTH standalone 1-clip Short AND 2-part Shorts
//    - Multi-segment highlight & 3s recap assembly (video + audio concat with anti-click fade)
//
//  Usage:
//    node render_all_shorts.js [--format single|two_part|both] [--mode fullscreen|crop|letterbox|zoom] [--fps 30] [--lufs -14] [--max-sec 58] [--ep N] [--concurrency 2]
// =============================================================================
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
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

function resolvePkg(name) {
  for (const r of [localReq, require]) {
    try { return r(name); } catch (_) {}
  }
  return null;
}

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

function findBrowserExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of candidates) { if (p && fs.existsSync(p)) return p; }
  return undefined;
}

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

function findAudioSource(inMp4) {
  for (const rel of [path.join('audio', 'master.wav'), path.join('audio', 'master.mp3')]) {
    const p = path.join(projectDir, rel);
    if (fs.existsSync(p)) return p;
  }
  if (inMp4 && fs.existsSync(inMp4)) return inMp4;
  throw new Error('Missing audio/master.wav (or master MP4) for Shorts audio.');
}

function mapLocalTimeToSegment(u, segments, durSec = 0, item = null) {
  const remSec = durSec > 0 ? +(Math.max(0, durSec - u)).toFixed(3) : null;
  const isFinal = item ? item.isFinal !== false : true;
  const ctaText = (item && item.visualCta) || null;
  let acc = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segDur = Number(seg.dur || 0);
    if (u < acc + segDur || i === segments.length - 1) {
      const localT = Math.max(0, Math.min(segDur - 0.001, u - acc));
      if (seg.isRecap) {
        return { isRecap: true, t: localT, recap: seg.recap || {}, remSec, isFinal, ctaText };
      }
      return { isRecap: false, t: Number(seg.start) + localT, remSec, isFinal, ctaText };
    }
    acc += segDur;
  }
  return { isRecap: false, t: 0, remSec, isFinal, ctaText };
}

(async () => {
  const ffmpeg = resolveFFmpeg();
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

  const requestedMode = (getArg('--mode') || cfg.mode || 'fullscreen').toLowerCase();
  const format = hasFlag('--single') ? 'single' : (getArg('--format') || cfg.shortsFormat || undefined);
  const fps = getArg('--fps') || '30';
  const fpsNum = Number(fps) || 30;
  const lufs = getArg('--lufs') || '-14.0';
  const maxSec = Number(getArg('--max-sec') || cfg.maxSec || 58);
  const minSec = Number(getArg('--min-sec') || cfg.minSec || 45);
  const allowOver60 = hasFlag('--allow-over-60') || Boolean(cfg.allowOver60);
  const onlyEp = getArg('--ep') ? Number(getArg('--ep')) : null;
  const onlyEvents = hasFlag('--events-only');
  const concurrency = Math.max(1, Math.min(4, Number(getArg('--concurrency') || 2)));

  const htmlPath = path.join(projectDir, 'index.html');
  const puppeteer = resolvePkg('puppeteer-core') || resolvePkg('puppeteer');
  const executablePath = findBrowserExecutable();
  const hasNativeHtml = fs.existsSync(htmlPath) && puppeteer && (executablePath || resolvePkg('puppeteer'));
  const useNativeFullscreen = requestedMode === 'fullscreen' && hasNativeHtml;
  const effectiveMode = requestedMode === 'fullscreen' && !hasNativeHtml ? 'crop' : requestedMode;

  const inMp4 = findMasterMp4(!useNativeFullscreen);
  if (requestedMode === 'fullscreen' && !useNativeFullscreen) {
    console.warn('⚠️ index.html or Chrome/Puppeteer not found; falling back from native fullscreen to FFmpeg focal 9:16 crop.');
  }

  let defaultPrefix = 'master_hf';
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) defaultPrefix = pkg.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch (_) {}
  }
  const prefix = inMp4 ? path.basename(inMp4, path.extname(inMp4)).replace(/_16x9$/, '') : defaultPrefix;
  const audioSrc = useNativeFullscreen ? findAudioSource(inMp4) : inMp4;

  const { planShortsEpisodes, saveShortsPlan } = loadPlanner();
  const epRanges = planShortsEpisodes(tl, cfg, { maxSec, minSec, allowOver60, format });
  const planPath = saveShortsPlan(projectDir, epRanges);

  const onlyTag = getArg('--tag');
  const selected = onlyTag
    ? epRanges.filter(item => item.tag === onlyTag)
    : (onlyEvents
      ? epRanges.filter(item => item.isEvent)
      : (onlyEp ? epRanges.filter(item => item.ep === onlyEp && !item.isSingle && !item.isEvent) : epRanges));
  console.log(`=== Rendering ${selected.length} Vertical Shorts (1080x1920, ${fps}fps, mode=${effectiveMode}${useNativeFullscreen ? ' [native canvas]' : ''}, ${lufs} LUFS, concurrency=${concurrency}, cap=${allowOver60 ? `${maxSec}s (override)` : `${Math.min(maxSec, 60)}s <= 60s`}) ===`);
  console.log(`✓ Saved Shorts plan: ${path.relative(projectDir, planPath)} (${epRanges.length} outputs)`);

  for (const item of selected) {
    const durSec = Number(item.dur);
    if (!allowOver60 && durSec > 60.0) {
      console.error(`❌ Output ${item.outFileName} duration ${durSec.toFixed(2)}s exceeds 60.0s YouTube Shorts limit.`);
      process.exit(1);
    }
    const overlayFile = path.join(outDir, item.overlayFile || (item.isSingle ? 'overlay_single.png' : `overlay_ep${item.ep}.png`));
    if (!fs.existsSync(overlayFile)) {
      console.error(`Missing overlay: ${overlayFile}. Run generate_shorts_overlays.js first.`);
      process.exit(1);
    }
  }

  function runFFmpegAsync(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let errTail = '';
      child.stderr.on('data', d => { errTail = (errTail + d.toString()).slice(-1200); });
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${errTail}`)));
    });
  }

  const browser = useNativeFullscreen
    ? await puppeteer.launch({
        ...(executablePath ? { executablePath } : {}),
        headless: 'new',
        args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
      })
    : null;

  let cursor = 0;
  async function renderWorker() {
    let page = null;
    let hasNativeSetter = false;
    if (browser) {
      page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
      await page.goto('file:///' + htmlPath.replace(/\\/g, '/') + '?shorts=1', { waitUntil: 'load' });
      hasNativeSetter = await page.evaluate(async () => {
        if (window.__setHeadless) window.__setHeadless();
        document.body.classList.add('headless', 'export-mode');
        await document.fonts.ready;
        if (typeof window.setShortsMode === 'function') {
          window.setShortsMode(true);
          return true;
        }
        window.SHORTS_MODE = true;
        return false;
      });
    }

    try {
      while (true) {
        const idx = cursor++;
        if (idx >= selected.length) return;
        const item = selected[idx];
        const startSec = Number(item.start);
        const durSec = Number(item.dur);
        const segments = Array.isArray(item.segments) && item.segments.length > 0
          ? item.segments
          : [{ isRecap: false, start: startSec, dur: durSec }];
        const isMultiSeg = segments.length > 1 || Boolean(segments[0].isRecap);

        const overlayFile = path.join(outDir, item.overlayFile || (item.isSingle ? 'overlay_single.png' : `overlay_ep${item.ep}.png`));
        const outName = item.outFileName || (item.isSingle ? `${prefix}_single_short.mp4` : `${prefix}_ep${item.ep}_shorts.mp4`);
        const outFile = path.join(outDir, outName);
        const tag = item.isSingle ? 'Single Short' : (item.isEvent ? `Event #${item.ep}` : `EP ${item.ep}${item.isFinal ? ' (จบ)' : ''}`);

        console.log(`--- Rendering ${tag} (${outName}, Dur: ${durSec.toFixed(2)}s, segments=${segments.length}, mode=${effectiveMode}) ---`);
        const t0 = Date.now();

        if (useNativeFullscreen && page) {
          const totalFrames = Math.max(1, Math.round(durSec * fpsNum));
          const ffArgs = [
            '-y',
            '-f', 'image2pipe',
            '-vcodec', 'mjpeg',
            '-r', String(fps),
            '-i', '-',
            '-i', overlayFile
          ];

          let filterComplex;
          if (!isMultiSeg) {
            ffArgs.push('-ss', startSec.toFixed(3), '-t', durSec.toFixed(3), '-i', audioSrc);
            filterComplex = `[0:v][1:v]overlay=0:0[vfinal];[2:a]loudnorm=I=${lufs}:LRA=7.0:TP=-2.5,aresample=48000,alimiter=limit=0.65:attack=0.1:release=50:level=0,volume=-1.5dB,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo[afinal]`;
          } else {
            const aChains = [];
            const aLabels = [];
            segments.forEach((seg, k) => {
              const inIdx = 2 + k;
              const segDur = Number(seg.dur);
              if (seg.isRecap) {
                const recapPath = seg.recap && seg.recap.audioFile
                  ? path.resolve(projectDir, seg.recap.audioFile)
                  : null;
                if (recapPath && fs.existsSync(recapPath)) {
                  ffArgs.push('-t', segDur.toFixed(3), '-i', recapPath);
                } else {
                  ffArgs.push('-f', 'lavfi', '-t', segDur.toFixed(3), '-i', 'anullsrc=r=44100:cl=stereo');
                }
              } else {
                ffArgs.push('-ss', Number(seg.start).toFixed(3), '-t', segDur.toFixed(3), '-i', audioSrc);
              }
              const fadeOutSt = Math.max(0.02, segDur - 0.015).toFixed(3);
              aChains.push(`[${inIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,afade=t=in:d=0.015,afade=t=out:st=${fadeOutSt}:d=0.015[a${k}]`);
              aLabels.push(`[a${k}]`);
            });
            filterComplex =
              `[0:v][1:v]overlay=0:0[vfinal];` +
              `${aChains.join(';')};` +
              `${aLabels.join('')}concat=n=${segments.length}:v=0:a=1[aconcat];` +
              `[aconcat]loudnorm=I=${lufs}:LRA=7.0:TP=-2.5,aresample=48000,alimiter=limit=0.65:attack=0.1:release=50:level=0,volume=-1.5dB,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo[afinal]`;
          }

          ffArgs.push(
            '-filter_complex', filterComplex,
            '-map', '[vfinal]',
            '-map', '[afinal]',
            '-r', String(fps),
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '4', '-pix_fmt', 'yuv420p',
            '-ar', '48000',
            '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
            outFile
          );

          const ff = spawn(ffmpeg, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
          let errTail = '';
          let ffClosed = false;
          ff.stderr.on('data', d => { errTail = (errTail + d.toString()).slice(-1200); });
          ff.stdin.on('error', () => { ffClosed = true; });
          const ffDone = new Promise((resolve, reject) => {
            ff.on('error', reject);
            ff.on('close', code => {
              ffClosed = true;
              if (code === 0) resolve();
              else reject(new Error(`ffmpeg exited ${code}: ${errTail}`));
            });
          });

          if (hasNativeSetter) {
            const BATCH = 16;
            for (let f = 0; f < totalFrames && !ffClosed; f += BATCH) {
              const framesBatch = [];
              for (let k = 0; k < BATCH && f + k < totalFrames; k++) {
                framesBatch.push(mapLocalTimeToSegment((f + k) / fpsNum, segments, durSec, item));
              }
              const dataUrls = await page.evaluate((items) => {
                const stage = document.getElementById('stage');
                return items.map(it => {
                  window.__SHORTS_REM_SEC = it.remSec;
                  window.__SHORTS_IS_FINAL = it.isFinal;
                  window.__SHORTS_CTA_TEXT = it.ctaText || null;
                  if (it.isRecap && typeof window.renderRecapAtTime === 'function') {
                    window.renderRecapAtTime(it.t, it.recap);
                  } else {
                    window.renderAtTime(it.t);
                  }
                  return stage.toDataURL('image/jpeg', 0.88);
                });
              }, framesBatch);
              for (const durl of dataUrls) {
                if (ffClosed) break;
                const buf = Buffer.from(durl.slice(durl.indexOf(',') + 1), 'base64');
                if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
              }
            }
          } else {
            for (let f = 0; f < totalFrames && !ffClosed; f++) {
              const m = mapLocalTimeToSegment(f / fpsNum, segments, durSec, item);
              await page.evaluate((it) => {
                window.__SHORTS_REM_SEC = it.remSec;
                window.__SHORTS_IS_FINAL = it.isFinal;
                window.__SHORTS_CTA_TEXT = it.ctaText || null;
                if (it.isRecap && typeof window.renderRecapAtTime === 'function') window.renderRecapAtTime(it.t, it.recap);
                else window.renderAtTime(it.t);
              }, m);
              if (ffClosed) break;
              const buf = await page.screenshot({ type: 'jpeg', quality: 88 });
              if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
            }
          }
          ff.stdin.end();
          await ffDone;
        } else {
          // FFmpeg fallback crop/letterbox (supports single contiguous window)
          const focusRatio = Math.max(0.15, Math.min(0.85, (Number(item.focusX) || 640) / 1280)).toFixed(3);
          const filterComplex =
            `[0:v]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920:(iw-1080)*${focusRatio}:0[vbase];` +
            '[vbase][1:v]overlay=0:0[vfinal]';

          await runFFmpegAsync([
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
            '-af', `loudnorm=I=${lufs}:LRA=7.0:TP=-2.2,aresample=48000,alimiter=limit=0.81:attack=1:release=50:level=false`,
            '-ar', '48000',
            '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
            outFile
          ]);
        }

        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        const size = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
        console.log(`  -> Finished ${tag} in ${elapsed}s | Size: ${size} MB | ${outName}`);
      }
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, selected.length)) }, () => renderWorker()));
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  console.log('\n🎉 All Vertical Shorts Episodes Rendered Successfully!');
})();
