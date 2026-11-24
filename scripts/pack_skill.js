// =============================================================================
//  pack_skill.js — Clean Skill Exporter (.zip) Skipping .git/ and Junk Files
//  Part of skill: reallens-horror-animator
//
//  Usage:
//    node scripts/pack_skill.js [--out dist/reallens-horror-animator.zip]
// =============================================================================
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getArg(...flags) {
  for (const flag of flags) {
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  }
  return null;
}

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'output',
  'temp',
  'audio',
  'shorts',
  'assets'
]);

const EXCLUDE_FILE_PATTERNS = [
  /^\.env(?:\..+)?$/i,
  /\.(?:zip|skill|tmp|mp4|wav|mp3|pcm|log|stackdump)$/i,
  /^(?:Thumbs\.db|Desktop\.ini|\.DS_Store)$/i,
  /^(?:audit_all_scenes\.png|thumbnail_.*\.png|contact_sheet_.*\.png|timeline\.js|timeline\.json)$/i
];

function shouldExcludeFile(name) {
  return EXCLUDE_FILE_PATTERNS.some(re => re.test(name));
}

function collectCleanFiles(rootDir, relDir = '', out = []) {
  const absDir = path.join(rootDir, relDir);
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      collectCleanFiles(rootDir, path.join(relDir, entry.name), out);
    } else if (entry.isFile()) {
      if (shouldExcludeFile(entry.name)) continue;
      out.push(path.join(relDir, entry.name));
    }
  }
  return out;
}

function copyStagedFiles(rootDir, stageDir, relFiles) {
  for (const rel of relFiles) {
    const src = path.join(rootDir, rel);
    const dst = path.join(stageDir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

function packSkill(rootDir, outZipPath) {
  const relFiles = collectCleanFiles(rootDir);
  if (relFiles.length === 0) {
    throw new Error(`No clean files found in ${rootDir}`);
  }
  if (relFiles.some(f => f.split(path.sep).includes('.git'))) {
    throw new Error('Safety abort: .git/ leaked into package file list.');
  }

  const outAbs = path.resolve(rootDir, outZipPath);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  if (fs.existsSync(outAbs)) fs.unlinkSync(outAbs);

  const stageParent = fs.mkdtempSync(path.join(require('os').tmpdir(), 'reallens-pack-'));
  const skillName = path.basename(rootDir);
  const stageDir = path.join(stageParent, skillName);

  try {
    copyStagedFiles(rootDir, stageDir, relFiles);
    if (process.platform === 'win32') {
      const psCmd = `Compress-Archive -Path '${stageDir.replace(/'/g, "''")}' -DestinationPath '${outAbs.replace(/'/g, "''")}' -Force`;
      const res = spawnSync('powershell.exe', ['-NoProfile', '-Command', psCmd], { encoding: 'utf8' });
      if (res.status !== 0) {
        throw new Error(`Compress-Archive failed: ${res.stderr || res.stdout}`);
      }
    } else {
      const res = spawnSync('zip', ['-r', '-q', outAbs, skillName], { cwd: stageParent, encoding: 'utf8' });
      if (res.status !== 0) {
        throw new Error(`zip failed: ${res.stderr || res.stdout}`);
      }
    }
  } finally {
    fs.rmSync(stageParent, { recursive: true, force: true });
  }

  return { outAbs, fileCount: relFiles.length, files: relFiles };
}

if (require.main === module) {
  const skillRoot = path.resolve(__dirname, '..');
  const outArg = getArg('--out', '-o') || path.join('dist', `${path.basename(skillRoot)}.zip`);
  const result = packSkill(skillRoot, outArg);
  console.log(`✅ Packed ${result.fileCount} clean files (0 .git/ files) -> ${result.outAbs}`);
}

module.exports = { collectCleanFiles, packSkill, EXCLUDE_DIRS };
