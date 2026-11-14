// =============================================================================
//  render_mp4.js — Deterministic HTML5 Canvas -> MP4 Exporter (Puppeteer + FFmpeg)
//  Part of skill: reallens-horror-animator
//  (Alternative to `node hf.js render -f 24 -q looks -o master_hf.mp4`)
//
//  Usage:
//    node render_mp4.js [--dir <projectDir>] [--out master_16x9.mp4] [--fps 24] [--1080p]
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
  const FPS = parseInt(getArg('--fps') || '24', 10);
  const upscale1080 = process.argv.includes('--1080p');
  const TOTAL_SEC = timeline.total;
  const TOTAL_FRAMES = Math.ceil(TOTAL_SEC * FPS);

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

  console.log(`=== Rendering 16:9 MP4: ${path.basename(OUT_MP4)} ===`);
  console.log(`Duration: ${TOTAL_SEC.toFixed(2)}s | FPS: ${FPS} | Frames: ${TOTAL_FRAMES}${upscale1080 ? ' | Upscale: 1920x1080' : ''}`);

  const executablePath = findBrowserExecutable();
  const browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.evaluate(async () => {
    if (window.__setHeadless) window.__setHeadless();
    document.body.classList.add('headless', 'export-mode');
    await document.fonts.ready;
  });

  const ffArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', '-',
    '-i', AUDIO_WAV
  ];
  if (upscale1080) {
    ffArgs.push('-vf', 'scale=1920:1080:flags=lanczos');
  }
  ffArgs.push(
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    OUT_MP4
  );

  const ff = spawn(ffmpegPath, ffArgs);
  const ffErrChunks = [];
  ff.stderr.on('data', d => {
    if (ffErrChunks.length < 40) ffErrChunks.push(d.toString());
  });

  const BATCH = 12;
  const t0 = Date.now();

  for (let f = 0; f < TOTAL_FRAMES; f += BATCH) {
    const times = [];
    for (let k = 0; k < BATCH && f + k < TOTAL_FRAMES; k++) {
      times.push((f + k) / FPS);
    }

    const dataUrls = await page.evaluate((ts) => {
      const stage = document.getElementById('stage');
      return ts.map(t => {
        window.renderAtTime(t);
        return stage.toDataURL('image/jpeg', 0.92);
      });
    }, times);

    for (const durl of dataUrls) {
      const buf = Buffer.from(durl.slice(durl.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) {
        await new Promise(r => ff.stdin.once('drain', r));
      }
    }

    const doneFrames = Math.min(TOTAL_FRAMES, f + BATCH);
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
  console.log(`🎉 MP4 Render Complete! ${OUT_MP4} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
})();
