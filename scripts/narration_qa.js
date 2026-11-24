// =============================================================================
//  narration_qa.js — Automated Narration & Audio Tail QA Engine
//  Part of skill: reallens-horror-animator
//  Shared by:
//    - scripts/audit_all_scenes.js
//    - scripts/inspect_video.js
//
//  Detects:
//    1. Camera/storyboard commands leaked into narration/vo (ERROR)
//    2. Unmapped English words / acronyms missing from PRONUNCIATION_MAP (WARNING)
//    3. Mid-video CTA ("คอมเมนต์", "กดติดตาม", etc.) before the final scene (ERROR)
//    4. Audio tail clipping / abrupt syllable cutoff & missing 350-500ms trailing silence (ERROR/WARNING)
// =============================================================================
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CAMERA_LEAK_RE = /(มุมเสย|มุมก้ม|มุมกล้อง|เงยหน้ามองกล้อง|หันมามองกล้อง|หันมองกล้อง|มองกล้อง|แพนกล้อง|ซูมเข้า|ซูมออก|ซูม|โคลสอัพ|ลองช็อต|มีเดียมช็อต|คัตไปที่|คัตภาพ|เฟดเข้า|เฟดออก|ดอลลี่|แทร็กกิ้ง|สตอรี่บอร์ด|\b(?:ECU|OTS|POV|CLOSE-?UP|WIDE\s+SHOT|DOLLY|PAN\s+LEFT|PAN\s+RIGHT)\b)/gi;

const MID_VIDEO_CTA_RE = /(คอมเมนต์|คอมเม้นต์|เม้นต์|กดติดตาม|กดซับ|ซับสไครบ์|กดไลก์|กดไลค์|กดแชร์|กดกระดิ่ง|พิมพ์บอกใต้คลิป|แสดงความคิดเห็นใต้คลิป)/gi;

const DOC_EARLY_SPOILER_RE = /(ความจริงคือโรค|สาเหตุที่แท้จริงคือ|แท้จริงแล้วเป็นโรค|แท้จริงแล้วคือโรค|ไม่ใช่ผีแต่คือ|ไม่ใช่ผีแต่เป็น)/gi;

const FALLBACK_PRONUNCIATION_MAP = {
  'Brugada Syndrome': 'บรูกาด้า ซินโดรม',
  Brugada: 'บรูกาด้า',
  SUNDS: 'ซันด์ส',
  'นักมานุษยวิทยา': 'นัก-มะ-นุด-สะ-ยะ-วิท-ทะ-ยา',
  'มานุษยวิทยา': 'มะ-นุด-สะ-ยะ-วิท-ทะ-ยา',
  'มลาบรี': 'มะ-ลา-บรี',
  'หนามพุทรา': 'หนาม-พุด-ซา',
  'ใบหนาด': 'ใบ-หนาด',
  'ชะตากรรม': 'ชะ-ตา-กำ',
  '7-Eleven': 'เซเว่นอีเลฟเว่น',
  '7-11': 'เซเว่นอีเลฟเว่น',
  'Wi-Fi': 'ไวไฟ',
  WiFi: 'ไวไฟ',
  LINE: 'ไลน์',
  CCTV: 'ซีซีทีวี',
  GPS: 'จีพีเอส',
  ATM: 'เอทีเอ็ม',
  OTP: 'โอทีพี',
  VIP: 'วีไอพี',
  KPI: 'เคพีไอ',
  LED: 'แอลอีดี',
  USB: 'ยูเอสบี',
  QR: 'คิวอาร์',
  AI: 'เอไอ',
  BTS: 'บีทีเอส',
  MRT: 'เอ็มอาร์ที',
  SMS: 'เอสเอ็มเอส',
  PDF: 'พีดีเอฟ',
  DNA: 'ดีเอ็นเอ',
  ECG: 'อีซีจี',
  EKG: 'อีเคจี',
  REM: 'เร็ม',
  PTSD: 'พีทีเอสดี',
  WHO: 'ดับเบิลยูเอชโอ',
  EP: 'อีพี',
  HUD: 'ฮัด',
  POV: 'พีโอวี',
  OTS: 'โอทีเอส',
  FPS: 'เฟรมต่อวินาที'
};

function stripInlineMarkup(text) {
  return String(text || '').replace(
    /\[\[(?:char|character|impersonate|mimic|narrator)(?::[^|\]]*)?\|([\s\S]*?)\]\]/gi,
    '$1'
  );
}

function getSceneNarrationText(scene) {
  if (!scene || typeof scene !== 'object') return '';
  if (typeof scene.narration === 'string' && scene.narration.trim()) return scene.narration;
  if (typeof scene.vo === 'string' && scene.vo.trim()) return scene.vo;
  if (Array.isArray(scene.voSegments) && scene.voSegments.length > 0) {
    return scene.voSegments.map(seg => String(seg?.text || '')).join(' ').trim();
  }
  return '';
}

function applyPronunciationEntry(text, key, val) {
  if (!key || val === undefined || val === null) return text;
  const regexLiteral = key.match(/^\/(.+)\/([gimsuy]*)$/);
  if (regexLiteral) {
    return text.replace(new RegExp(regexLiteral[1], regexLiteral[2] || 'g'), String(val));
  }
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (/^[A-Za-z0-9_'\-\s]+$/.test(key)) {
    return text.replace(new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'gi'), String(val));
  }
  return text.replace(new RegExp(escaped, 'g'), String(val));
}

function loadMergedPronunciationMap(projectDir, episodeMod = null) {
  const merged = { ...FALLBACK_PRONUNCIATION_MAP };
  const pronJsCandidates = [
    path.join(projectDir, 'pronunciation_map.js'),
    path.join(__dirname, '..', 'templates', 'pronunciation_map.js')
  ];
  for (const cand of pronJsCandidates) {
    if (!fs.existsSync(cand)) continue;
    try {
      const mod = require(cand);
      if (mod?.PRONUNCIATION_MAP) Object.assign(merged, mod.PRONUNCIATION_MAP);
      break;
    } catch (_) {}
  }
  const gaCandidates = [
    path.join(projectDir, 'generate_audio.js'),
    path.join(__dirname, '..', 'templates', 'generate_audio.js')
  ];
  for (const cand of gaCandidates) {
    if (!fs.existsSync(cand)) continue;
    try {
      const mod = require(cand);
      if (mod?.DEFAULT_PRONUNCIATION_MAP) Object.assign(merged, mod.DEFAULT_PRONUNCIATION_MAP);
      if (mod?.PRONUNCIATION_MAP) Object.assign(merged, mod.PRONUNCIATION_MAP);
      break;
    } catch (_) {}
  }
  const jsonMapPath = path.join(projectDir, 'pronunciation_map.json');
  if (fs.existsSync(jsonMapPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonMapPath, 'utf8'));
      if (parsed && typeof parsed === 'object') Object.assign(merged, parsed);
    } catch (_) {}
  }
  if (episodeMod && episodeMod.PRONUNCIATION_MAP && typeof episodeMod.PRONUNCIATION_MAP === 'object') {
    Object.assign(merged, episodeMod.PRONUNCIATION_MAP);
  }
  return merged;
}

function findUnmappedEnglishTokens(rawText, pronMap = {}) {
  let clean = stripInlineMarkup(rawText);
  // Ignore numeric unit tokens natively converted by normalizeThaiForTTS
  clean = clean
    .replace(/\d+(?:\.\d+)?\s*(?:°\s*[CF]|องศา\s*[CF]|dB)\b/gi, ' ')
    .replace(/https?:\/\/\S+/gi, ' ');

  const sortedEntries = Object.entries(pronMap).sort((a, b) => b[0].length - a[0].length);
  for (const [k, v] of sortedEntries) {
    clean = applyPronunciationEntry(clean, k, v);
  }

  const matches = clean.match(/[A-Za-z][A-Za-z0-9'-]*/g) || [];
  const seen = new Set();
  const out = [];
  for (const tok of matches) {
    const key = tok.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tok);
  }
  return out;
}

// Pure-Node PCM WAV tail analyzer (supports standard 16-bit PCM RIFF WAVs without FFmpeg)
function parsePcm16Wav(wavPath) {
  const buf = fs.readFileSync(wavPath);
  if (buf.length < 44 || buf.slice(0, 4).toString('ascii') !== 'RIFF' || buf.slice(8, 12).toString('ascii') !== 'WAVE') {
    return null;
  }
  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bitsPerSample = 16;
  let dataStart = -1;
  let dataSize = 0;

  while (offset + 8 <= buf.length) {
    const id = buf.slice(offset, offset + 4).toString('ascii');
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'fmt ' && offset + 24 <= buf.length) {
      channels = buf.readUInt16LE(offset + 10);
      sampleRate = buf.readUInt32LE(offset + 12);
      bitsPerSample = buf.readUInt16LE(offset + 22);
    } else if (id === 'data') {
      dataStart = offset + 8;
      dataSize = Math.min(size, buf.length - dataStart);
      break;
    }
    offset += 8 + size + (size % 2);
  }

  if (dataStart < 0 || bitsPerSample !== 16 || dataSize < 4) return null;
  const frameCount = Math.floor(dataSize / (2 * channels));
  const samples = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i++) {
    let acc = 0;
    for (let ch = 0; ch < channels; ch++) {
      acc += buf.readInt16LE(dataStart + (i * channels + ch) * 2) / 32768;
    }
    samples[i] = acc / channels;
  }
  return { sampleRate, channels, samples };
}

function analyzePcmTail(samples, sampleRate, label = 'audio') {
  if (!samples || samples.length === 0) {
    return {
      label,
      durSec: 0,
      trailingSilenceMs: 0,
      tailEndRms: 0,
      bodyRms: 0,
      clippingRatio: 0,
      tailClipSamples: 0,
      abruptCut: false,
      clipping: false,
      lowSilence: true
    };
  }
  const n = samples.length;
  const durSec = n / sampleRate;
  let sumSq = 0;
  let clipCount = 0;
  for (let i = 0; i < n; i++) {
    const v = samples[i];
    sumSq += v * v;
    if (Math.abs(v) >= 0.995) clipCount++;
  }
  const bodyRms = Math.sqrt(sumSq / n);
  const clippingRatio = clipCount / n;

  // Measure trailing near-silence duration
  let lastActive = n - 1;
  while (lastActive > 0 && Math.abs(samples[lastActive]) < 0.008) lastActive--;
  const trailingSilenceMs = ((n - 1 - lastActive) / sampleRate) * 1000;

  // Inspect final 40 ms RMS and final 250 ms peak clipping
  const tail40 = Math.min(n, Math.max(1, Math.floor(0.04 * sampleRate)));
  let tail40Sq = 0;
  for (let i = n - tail40; i < n; i++) tail40Sq += samples[i] * samples[i];
  const tailEndRms = Math.sqrt(tail40Sq / tail40);

  const tail250 = Math.min(n, Math.max(1, Math.floor(0.25 * sampleRate)));
  let tailClipSamples = 0;
  for (let i = n - tail250; i < n; i++) {
    if (Math.abs(samples[i]) >= 0.995) tailClipSamples++;
  }

  const abruptCut = durSec >= 0.4 && trailingSilenceMs < 45 && (tailEndRms > 0.035 || (bodyRms > 0.01 && tailEndRms / bodyRms > 0.25));
  const clipping = clippingRatio > 0.005 || tailClipSamples >= 8;
  const lowSilence = durSec >= 0.4 && trailingSilenceMs < 300;

  return {
    label,
    durSec: +durSec.toFixed(3),
    trailingSilenceMs: +trailingSilenceMs.toFixed(1),
    tailEndRms: +tailEndRms.toFixed(4),
    bodyRms: +bodyRms.toFixed(4),
    clippingRatio: +clippingRatio.toFixed(5),
    tailClipSamples,
    abruptCut,
    clipping,
    lowSilence
  };
}

function inspectMediaTailWithFFmpeg(mediaPath, ffmpegPath = 'ffmpeg', probeDurSec = 3.0) {
  if (!mediaPath || !fs.existsSync(mediaPath)) return null;
  const sr = 24000;
  const res = spawnSync(ffmpegPath, [
    '-v', 'error',
    '-sseof', `-${probeDurSec}`,
    '-i', mediaPath,
    '-vn', '-f', 'f32le', '-ac', '1', '-ar', String(sr),
    'pipe:1'
  ], { maxBuffer: 1 << 24 });
  if (res.status !== 0 || !res.stdout || res.stdout.length < 16) return null;
  const buf = res.stdout;
  const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  return analyzePcmTail(samples, sr, path.basename(mediaPath));
}

function runNarrationQA({ projectDir, scenes = [], episodeMod = null, videoPath = null, ffmpegPath = 'ffmpeg', checkAudioFiles = true }) {
  const errors = [];
  const warnings = [];
  const pronMap = loadMergedPronunciationMap(projectDir, episodeMod);
  const narrativeMode = String(episodeMod?.NARRATIVE_MODE || episodeMod?.narrativeMode || '').toLowerCase();
  const isDoc = narrativeMode === 'documentary' || String(episodeMod?.HUD_MODE || episodeMod?.hudMode || '').toLowerCase() === 'documentary';

  const totalScenes = Array.isArray(scenes) ? scenes.length : 0;

  for (let i = 0; i < totalScenes; i++) {
    const s = scenes[i] || {};
    const id = s.id || `scene_${i + 1}`;
    const rawText = getSceneNarrationText(s);
    const cleanText = stripInlineMarkup(rawText);
    if (!cleanText.trim()) continue;

    // 1. Camera / Storyboard directions leaked into narration/vo
    CAMERA_LEAK_RE.lastIndex = 0;
    const camHits = [];
    let m;
    while ((m = CAMERA_LEAK_RE.exec(cleanText)) !== null) {
      if (!camHits.includes(m[1])) camHits.push(m[1]);
    }
    if (camHits.length > 0) {
      errors.push({
        code: 'CAMERA_IN_NARRATION',
        sceneId: id,
        detail: `พบคำสั่งมุมกล้อง/สตอรี่บอร์ดหลุดเข้าบทพากย์ (${camHits.join(', ')}) — ให้ย้ายไปไว้ใน camera_note หรือ visual_prompt`
      });
    }

    // 2. Unmapped English words / acronyms missing from PRONUNCIATION_MAP
    const unmapped = findUnmappedEnglishTokens(rawText, pronMap);
    if (unmapped.length > 0) {
      warnings.push({
        code: 'UNMAPPED_ENGLISH_TTS',
        sceneId: id,
        tokens: unmapped,
        detail: `พบคำอังกฤษ/ตัวย่อที่ยังไม่ได้แมปใน PRONUNCIATION_MAP: ${unmapped.join(', ')}`
      });
    }

    // 3. Mid-video CTA ("คอมเมนต์", "กดติดตาม") before final scene
    const isFinal = i === totalScenes - 1 || s.isFinalScene === true || s.phase === 'outro';
    if (!isFinal && totalScenes > 1) {
      MID_VIDEO_CTA_RE.lastIndex = 0;
      const ctaHits = [];
      while ((m = MID_VIDEO_CTA_RE.exec(cleanText)) !== null) {
        if (!ctaHits.includes(m[1])) ctaHits.push(m[1]);
      }
      if (ctaHits.length > 0) {
        errors.push({
          code: 'MID_VIDEO_CTA',
          sceneId: id,
          detail: `พบประโยคชวนคอมเมนต์/กดติดตาม (${ctaHits.join(', ')}) โผล่ก่อนฉากสุดท้าย — อนุญาตเฉพาะฉากสุดท้ายเท่านั้น`
        });
      }
    }

    // 3B. Documentary Anti-Spoiler warning in Cold Open Hook (0:00-0:45)
    const inHookWindow = i === 0 || s.phase === 'hook' || (typeof s.start === 'number' && s.start < 45);
    if (isDoc && inHookWindow) {
      DOC_EARLY_SPOILER_RE.lastIndex = 0;
      const spoilMatch = cleanText.match(DOC_EARLY_SPOILER_RE);
      if (spoilMatch) {
        warnings.push({
          code: 'EARLY_HOOK_SPOILER',
          sceneId: id,
          detail: `ช่วงเปิด 0:00–0:45 มีแนวโน้มเฉลยคำตอบเร็วเกินไป (${spoilMatch[0]}) — ควรเก็บเฉลยไว้ช่วง 50–90%`
        });
      }
    }
  }

  // 4. Audio tail clipping / abrupt cut check on per-scene WAV files & optional rendered video
  const audioTailStats = [];
  if (checkAudioFiles) {
    const audioDir = path.join(projectDir, 'audio');
    if (fs.existsSync(audioDir)) {
      const wavFiles = fs.readdirSync(audioDir)
        .filter(f => /^vo_gemini_.*\.wav$/i.test(f))
        .sort();
      for (const wf of wavFiles) {
        const full = path.join(audioDir, wf);
        try {
          const parsed = parsePcm16Wav(full);
          if (!parsed) continue;
          const st = analyzePcmTail(parsed.samples, parsed.sampleRate, wf);
          audioTailStats.push(st);
          if (st.abruptCut) {
            errors.push({
              code: 'AUDIO_ABRUPT_TAIL_CUT',
              sceneId: wf,
              detail: `ไฟล์เสียง ${wf} ถูกตัดฉับที่ปลายไฟล์ (tail RMS=${st.tailEndRms}, trailing silence=${st.trailingSilenceMs}ms < 45ms)`
            });
          } else if (st.lowSilence) {
            warnings.push({
              code: 'LOW_TRAILING_SILENCE',
              sceneId: wf,
              detail: `ไฟล์เสียง ${wf} มีช่วงเงียบท้ายไฟล์เพียง ${st.trailingSilenceMs}ms (แนะนำ 350–500ms เพื่อกันตัดคำท้าย)`
            });
          }
          if (st.clipping) {
            errors.push({
              code: 'AUDIO_TAIL_CLIPPING',
              sceneId: wf,
              detail: `ไฟล์เสียง ${wf} พบสัญญาณ Clipping (ratio=${(st.clippingRatio * 100).toFixed(2)}%, tail clips=${st.tailClipSamples})`
            });
          }
        } catch (_) {}
      }
    }
  }

  let videoTailStats = null;
  if (videoPath && fs.existsSync(videoPath)) {
    videoTailStats = inspectMediaTailWithFFmpeg(videoPath, ffmpegPath, 3.0);
    if (videoTailStats) {
      if (videoTailStats.abruptCut) {
        errors.push({
          code: 'VIDEO_ABRUPT_AUDIO_END',
          sceneId: path.basename(videoPath),
          detail: `ปลายเสียงของวิดีโอถูกตัดฉับ (tail RMS=${videoTailStats.tailEndRms}, trailing silence=${videoTailStats.trailingSilenceMs}ms)`
        });
      }
      if (videoTailStats.clipping) {
        errors.push({
          code: 'VIDEO_TAIL_CLIPPING',
          sceneId: path.basename(videoPath),
          detail: `ปลายเสียงของวิดีโอพบ Clipping (ratio=${(videoTailStats.clippingRatio * 100).toFixed(2)}%, tail clips=${videoTailStats.tailClipSamples})`
        });
      }
    }
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    audioTailStats,
    videoTailStats,
    checkedScenes: totalScenes
  };
}

function printNarrationQAReport(qa, heading = '🎙️ AUTOMATED NARRATION & AUDIO TAIL QA:') {
  console.log(`\n${heading}`);
  if (qa.checkedScenes === 0 && qa.audioTailStats.length === 0 && !qa.videoTailStats) {
    console.log('   - (No scenes/audio found to audit)');
    return;
  }
  console.log(`   - Audited Scenes: ${qa.checkedScenes} | Scene WAV Tails: ${qa.audioTailStats.length}${qa.videoTailStats ? ` | Video Audio Tail: ${qa.videoTailStats.trailingSilenceMs}ms silence` : ''}`);
  if (qa.errors.length === 0 && qa.warnings.length === 0) {
    console.log('   - Status: ✅ PASS (0 errors, 0 warnings — clean narration, mapped English terms, no mid-video CTA, clean audio tails)');
    return;
  }
  for (const err of qa.errors) {
    console.log(`   - ❌ ERROR   [${err.code}] (${err.sceneId}): ${err.detail}`);
  }
  for (const warn of qa.warnings) {
    console.log(`   - ⚠️ WARNING [${warn.code}] (${warn.sceneId}): ${warn.detail}`);
  }
}

module.exports = {
  CAMERA_LEAK_RE,
  MID_VIDEO_CTA_RE,
  FALLBACK_PRONUNCIATION_MAP,
  getSceneNarrationText,
  loadMergedPronunciationMap,
  findUnmappedEnglishTokens,
  parsePcm16Wav,
  analyzePcmTail,
  inspectMediaTailWithFFmpeg,
  runNarrationQA,
  printNarrationQAReport
};
