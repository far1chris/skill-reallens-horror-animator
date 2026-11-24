// =============================================================================
//  hf.js — HyperFrames CLI Wrapper with automatic ffmpeg-static & ffprobe-static
//  Part of skill: reallens-horror-animator
//  Resolves binaries from process.cwd() first (works both when copied into a
//  project root OR when invoked directly from the skill's scripts/ directory).
//
//  Usage:
//    node hf.js lint
//    node hf.js check
//    node hf.js timeline
//    node hf.js snapshot --review
//    node hf.js snapshot --at 5,60,180 --no-end
//    node hf.js preview
//    node hf.js render -f 30 -q looks --gpu --browser-gpu -o master_hf.mp4
// =============================================================================
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const { spawnSync } = require('child_process');

const projectDir = process.cwd();
const reqs = [require];
const pkgJson = path.join(projectDir, 'package.json');
try {
  reqs.unshift(createRequire(fs.existsSync(pkgJson) ? pkgJson : path.join(projectDir, '_resolver.js')));
} catch (_) {}

function resolveBinPath(pkgName, getter) {
  for (const r of reqs) {
    try {
      const mod = r(pkgName);
      const binPath = getter ? getter(mod) : mod;
      if (binPath && fs.existsSync(binPath)) return binPath;
    } catch (_) {}
  }
  return null;
}

const extraPaths = [];
const localBinDir = path.join(projectDir, 'node_modules', '.bin');
if (fs.existsSync(localBinDir)) extraPaths.push(localBinDir);

const ffmpegBin = resolveBinPath('ffmpeg-static');
if (ffmpegBin) extraPaths.push(path.dirname(ffmpegBin));

const ffprobeBin = resolveBinPath('ffprobe-static', m => m && m.path);
if (ffprobeBin) extraPaths.push(path.dirname(ffprobeBin));

const env = { ...process.env };
if (ffmpegBin && !env.HYPERFRAMES_FFMPEG_PATH) env.HYPERFRAMES_FFMPEG_PATH = ffmpegBin;
if (ffprobeBin && !env.HYPERFRAMES_FFPROBE_PATH) env.HYPERFRAMES_FFPROBE_PATH = ffprobeBin;
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'PATH';
if (extraPaths.length > 0) {
  env[pathKey] = extraPaths.join(path.delimiter) + path.delimiter + (env[pathKey] || '');
}

if (!env.HYPERFRAMES_BROWSER_PATH) {
  const browserCandidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const foundBrowser = browserCandidates.find(p => p && fs.existsSync(p));
  if (foundBrowser) env.HYPERFRAMES_BROWSER_PATH = foundBrowser;
}

const args = process.argv.slice(2);
const localHfBin = path.join(localBinDir, process.platform === 'win32' ? 'hyperframes.cmd' : 'hyperframes');
const useLocal = fs.existsSync(localHfBin);

const cmd = useLocal ? localHfBin : (process.platform === 'win32' ? 'npx.cmd' : 'npx');
const cmdArgs = useLocal ? args : ['hyperframes', ...args];

const res = spawnSync(cmd, cmdArgs, {
  cwd: projectDir,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
process.exit(res.status ?? 0);
