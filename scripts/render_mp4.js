// =============================================================================
//  render_mp4.js — Native 1080p @ 30fps GPU-Accelerated HTML5 Canvas -> MP4 Exporter
//  Shared across: thai-sitcom-animator & reallens-horror-animator
//  (Alternative to `node hf.js render -f 30 -q looks --gpu --browser-gpu -o master_hf.mp4`)
//
//  Features:
//   - Defaults to Native Canvas 1920x1080 @ 30fps (auto-reads #root data-width/height/fps)
//   - Optional `--720p` (`--fps 24`) fast draft mode via runtime canvas scaling (zero blurry resize)
//   - Optional `--hq` (lossless PNG pipe + CQ 16 + NVENC p6 + 256k AAC) or `--png` / `--cq N`
//   - Optional `--grade horror|sitcom|auto|none` FFmpeg finishing filter (deband+grain / ink crispness)
//   - Parallel Puppeteer worker pool (`--workers N`, default auto 2-4 tabs)
//   - Chrome GPU Rasterization (`--no-gpu` to disable) + FFmpeg NVENC / AMF GPU auto-probe (`--cpu` to disable)
//
//  Usage:
//    node render_mp4.js [--dir <projectDir>] [--out master_hf.mp4] [--fps 30] [--workers 4] [--720p] [--1080p] [--hq] [--png] [--cq 17] [--grade none|horror|sitcom|auto] [--cpu] [--no-gpu]
// =============================================================================
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
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

function readRootSpecs(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const rootMatch = html.match(/<div\b[^>]*\bid=["']root["'][^>]*>/i);
  const tag = rootMatch ? rootMatch[0] : '';
  const readNum = (name, fallback) => {
    const m = tag.match(new RegExp(`${name}=["'](\\d+)["']`, 'i'));
    return m ? parseInt(m[1], 10) : fallback;
  };
  return {
    width: readNum('data-width', 1920),
    height: readNum('data-height', 1080),
    fps: readNum('data-fps', 30)
  };
}

const GRADE_FILTERS = {
  horror: 'format=yuv420p,deband=1thr=0.02:2thr=0.02:3thr=0.02:blur=1,noise=alls=3:allf=t+u',
  sitcom: 'format=yuv420p,unsharp=3:3:0.35:3:3:0.0',
  none: null
};

/**
 * Resolve optional FFmpeg finishing filter preset (`none`, `horror`, `sitcom`, `auto`).
 */
function resolveGradeFilter(gradeArg, targetDir) {
  let resolved = (gradeArg || 'none').toLowerCase();
  if (resolved === 'auto') {
    const snippets = [];
    for (const rel of ['package.json', 'episode.js', 'timeline.json']) {
      const p = path.join(targetDir, rel);
      if (fs.existsSync(p)) {
        try {
          snippets.push(fs.readFileSync(p, 'utf8').slice(0, 4096));
        } catch (_) {}
      }
    }
    const combined = snippets.join('\n');
    if (/reallens|documentary|HUD_MODE|NARRATIVE_MODE/i.test(combined)) resolved = 'horror';
    else if (/sitcom|\bCAST\b/i.test(combined)) resolved = 'sitcom';
    else resolved = 'none';
  }
  if (!(resolved in GRADE_FILTERS)) {
    throw new Error(`Unsupported --grade "${gradeArg}". Valid values: none, horror, sitcom, auto.`);
  }
  return { name: resolved, filter: GRADE_FILTERS[resolved] };
}

/**
 * Probe hardware/CPU H.264 encoder with dynamic CQ/CRF and HQ preset fallback.
 */
function probeVideoEncoder(ffmpegPath, forceCpu, { cq = 19, isHq = false } = {}) {
  const cqStr = String(cq);
  if (!forceCpu) {
    const gpuSpecs = [];
    if (isHq) {
      gpuSpecs.push({
        name: 'h264_nvenc',
        label: 'h264_nvenc p6 HQ (NVIDIA GPU)',
        args: ['-c:v', 'h264_nvenc', '-preset', 'p6', '-rc', 'vbr', '-cq', cqStr, '-b:v', '0', '-pix_fmt', 'yuv420p']
      });
    }
    gpuSpecs.push(
      {
        name: 'h264_nvenc',
        label: isHq ? 'h264_nvenc p4 (NVIDIA GPU)' : 'h264_nvenc (NVIDIA GPU)',
        args: ['-c:v', 'h264_nvenc', '-preset', 'p4', '-rc', 'vbr', '-cq', cqStr, '-b:v', '0', '-pix_fmt', 'yuv420p']
      },
      {
        name: 'h264_amf',
        label: 'h264_amf (AMD GPU)',
        args: ['-c:v', 'h264_amf', '-quality', 'balanced', '-rc', 'cqp', '-qp_i', cqStr, '-qp_p', cqStr, '-pix_fmt', 'yuv420p']
      }
    );
    for (const spec of gpuSpecs) {
      const testRun = spawnSync(
        ffmpegPath,
        ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=256x256:d=0.04', '-frames:v', '1', ...spec.args, '-f', 'null', '-'],
        { encoding: 'utf8' }
      );
      if (testRun.status === 0) return spec;
    }
  }
  return {
    name: 'libx264',
    label: isHq ? 'libx264 slow HQ (CPU)' : 'libx264 (CPU)',
    args: ['-c:v', 'libx264', '-preset', isHq ? 'slow' : 'fast', '-crf', cqStr, '-pix_fmt', 'yuv420p']
  };
}

async function launchBrowser(puppeteer, executablePath, disableGpu) {
  if (!disableGpu) {
    try {
      const b = await puppeteer.launch({
        ...(executablePath ? { executablePath } : {}),
        headless: 'new',
        protocolTimeout: 600000,
        args: ['--no-sandbox', '--allow-file-access-from-files', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
      });
      return { browser: b, gpuEnabled: true };
    } catch (_) {}
  }
  const b = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: 'new',
    protocolTimeout: 600000,
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });
  return { browser: b, gpuEnabled: false };
}

(async () => {
  const timelinePath = path.join(projectDir, 'timeline.json');
  const htmlPath = path.join(projectDir, 'index.html');
  if (!fs.existsSync(timelinePath)) {
    console.error('Missing timeline.json — run generate_audio.js first.');
    process.exit(1);
  }
  if (!fs.existsSync(htmlPath)) {
    console.error('Missing index.html in:', projectDir);
    process.exit(1);
  }

  const puppeteer = resolvePkg('puppeteer-core') || resolvePkg('puppeteer');
  if (!puppeteer) throw new Error('puppeteer-core not found. Run: npm install puppeteer-core');
  const ffmpegPath = resolvePkg('ffmpeg-static') || 'ffmpeg';

  const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
  const htmlSpecs = readRootSpecs(htmlPath);
  const want720 = hasFlag('--720p');
  const want1080 = hasFlag('--1080p');
  const TARGET_W = want720 ? 1280 : (want1080 ? 1920 : htmlSpecs.width);
  const TARGET_H = want720 ? 720 : (want1080 ? 1080 : htmlSpecs.height);
  const FPS = parseInt(getArg('--fps') || String(htmlSpecs.fps || 30), 10);
  const TOTAL_SEC = timeline.total;
  const TOTAL_FRAMES = Math.ceil(TOTAL_SEC * FPS);

  const cpuCount = Math.max(1, (os.cpus() || []).length);
  const defaultWorkers = Math.min(4, Math.max(2, Math.floor(cpuCount / 4)));
  const WORKERS = Math.max(1, Math.min(8, parseInt(getArg('--workers') || String(defaultWorkers), 10)));
  const forceCpu = hasFlag('--cpu');
  const disableChromeGpu = hasFlag('--no-gpu');
  const isHq = hasFlag('--hq');
  const usePng = isHq || hasFlag('--png');
  const cqRaw = getArg('--cq', '--crf');
  const CQ = Math.max(12, Math.min(28, parseInt(cqRaw || (isHq ? '16' : '19'), 10) || (isHq ? 16 : 19)));
  const gradeArg = (getArg('--grade') || 'none').toLowerCase();
  const grade = resolveGradeFilter(gradeArg, projectDir);

  let defaultOut = 'master_16x9.mp4';
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) defaultOut = `${pkg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
    } catch (_) {}
  }

  const OUT_MP4 = path.resolve(projectDir, getArg('--out', '-o') || defaultOut);
  const AUDIO_WAV = fs.existsSync(path.join(projectDir, 'audio', 'master.wav'))
    ? path.join(projectDir, 'audio', 'master.wav')
    : path.join(projectDir, 'audio', 'master.mp3');

  if (!fs.existsSync(AUDIO_WAV)) {
    console.error('Missing audio/master.wav (or master.mp3). Run generate_audio.js first.');
    process.exit(1);
  }

  const encoder = probeVideoEncoder(ffmpegPath, forceCpu, { cq: CQ, isHq });
  const executablePath = findBrowserExecutable();
  const { browser, gpuEnabled } = await launchBrowser(puppeteer, executablePath, disableChromeGpu);

  console.log(`=== Rendering Native ${TARGET_W}x${TARGET_H} 16:9 MP4: ${path.basename(OUT_MP4)} ===`);
  console.log(
    `Duration: ${TOTAL_SEC.toFixed(2)}s | FPS: ${FPS} | Frames: ${TOTAL_FRAMES} | Encoder: ${encoder.label} | Chrome GPU: ${gpuEnabled ? 'ON' : 'CPU'} | Workers: ${WORKERS}`
  );
  console.log(
    `Pipe: ${usePng ? 'PNG (lossless)' : 'JPEG (0.95)'} | CQ/CRF: ${CQ} | Grade: ${grade.name}`
  );

  const pages = [];
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  for (let w = 0; w < WORKERS; w++) {
    const p = await browser.newPage();
    await p.setViewport({ width: TARGET_W, height: TARGET_H, deviceScaleFactor: 1 });
    await p.goto(fileUrl, { waitUntil: 'load' });
    await p.evaluate(async (tw, th) => {
      if (window.__setHeadless) window.__setHeadless();
      document.body.classList.add('headless', 'export-mode');
      await document.fonts.ready;
      if (typeof window.setRenderResolution === 'function') {
        window.setRenderResolution(tw, th);
      } else {
        window.__RENDER_SCALE = tw / 1280;
        const stage = document.getElementById('stage');
        if (stage) {
          stage.width = tw;
          stage.height = th;
          stage.style.width = tw + 'px';
          stage.style.height = th + 'px';
        }
      }
    }, TARGET_W, TARGET_H);
    pages.push(p);
  }

  const ffArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', usePng ? 'png' : 'mjpeg',
    '-r', String(FPS),
    '-i', '-',
    '-i', AUDIO_WAV,
    ...(grade.filter ? ['-vf', grade.filter] : []),
    ...encoder.args,
    '-c:a', 'aac',
    '-b:a', isHq ? '256k' : '192k',
    '-shortest',
    '-movflags', '+faststart',
    OUT_MP4
  ];

  const ff = spawn(ffmpegPath, ffArgs);
  const ffErrChunks = [];
  ff.stderr.on('data', d => {
    if (ffErrChunks.length < 40) ffErrChunks.push(d.toString());
  });

  const CHUNK_PER_WORKER = usePng ? 3 : 6;
  const SUPER_BATCH = WORKERS * CHUNK_PER_WORKER;
  const t0 = Date.now();
  const frameMime = usePng ? 'image/png' : 'image/jpeg';

  for (let f = 0; f < TOTAL_FRAMES; f += SUPER_BATCH) {
    const batchEnd = Math.min(TOTAL_FRAMES, f + SUPER_BATCH);
    const workerPromises = [];

    for (let w = 0; w < WORKERS; w++) {
      const startIdx = f + w * CHUNK_PER_WORKER;
      if (startIdx >= batchEnd) break;
      const endIdx = Math.min(batchEnd, startIdx + CHUNK_PER_WORKER);
      const ts = [];
      for (let k = startIdx; k < endIdx; k++) {
        ts.push(k / FPS);
      }
      workerPromises.push(
        pages[w].evaluate((times, mime) => {
          const stage = document.getElementById('stage');
          return times.map(t => {
            window.renderAtTime(t);
            return mime === 'image/png'
              ? stage.toDataURL('image/png')
              : stage.toDataURL('image/jpeg', 0.95);
          });
        }, ts, frameMime)
      );
    }

    const workerChunks = await Promise.all(workerPromises);
    for (const chunk of workerChunks) {
      for (const durl of chunk) {
        const buf = Buffer.from(durl.slice(durl.indexOf(',') + 1), 'base64');
        if (!ff.stdin.write(buf)) {
          await new Promise(r => ff.stdin.once('drain', r));
        }
      }
    }

    const doneFrames = batchEnd;
    const pct = ((doneFrames / TOTAL_FRAMES) * 100).toFixed(1);
    const elapsed = Math.max(0.1, (Date.now() - t0) / 1000);
    const fpsCur = (doneFrames / elapsed).toFixed(1);
    const eta = ((TOTAL_FRAMES - doneFrames) / (doneFrames / elapsed)).toFixed(0);
    process.stdout.write(`\r[Render] ${doneFrames}/${TOTAL_FRAMES} frames (${pct}%) | ${fpsCur} fps | ETA: ${eta}s `);
  }

  console.log('\nFinishing MP4 encoding...');
  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}:\n${ffErrChunks.join('')}`)));
  });
  await browser.close();

  const stat = fs.statSync(OUT_MP4);
  const totalSecElapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`🎉 MP4 Render Complete in ${totalSecElapsed}s! ${OUT_MP4} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
})();
