// =============================================================================
//  hf.js — HyperFrames CLI Wrapper with automatic ffmpeg-static & ffprobe-static
//  Part of skill: reallens-horror-animator
//  Usage:
//    node hf.js lint
//    node hf.js check
//    node hf.js snapshot --at 5,60,180
//    node hf.js preview
//    node hf.js render -f 24 -q looks -o output_hf.mp4
// =============================================================================
const path = require('path');
const { spawnSync } = require('child_process');

const extraPaths = [];
try {
  const ffmpegPath = require('ffmpeg-static');
  if (ffmpegPath) extraPaths.push(path.dirname(ffmpegPath));
} catch (_) {}

try {
  const ffprobe = require('ffprobe-static');
  if (ffprobe && ffprobe.path) extraPaths.push(path.dirname(ffprobe.path));
} catch (_) {}

const env = { ...process.env };
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'PATH';
if (extraPaths.length > 0) {
  env[pathKey] = extraPaths.join(path.delimiter) + path.delimiter + (env[pathKey] || '');
}

const args = process.argv.slice(2);
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const res = spawnSync(cmd, ['hyperframes', ...args], {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
process.exit(res.status ?? 0);
