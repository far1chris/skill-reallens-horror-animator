// =============================================================================
//  generate_audio.js — Complete Real Lens Audio & Subtitle Pipeline
//  Part of skill: reallens-horror-animator
//  Features:
//    - Reads GEMINI_API_KEYS or GEMINI_API_KEY from env / local .env (NO hardcoded keys!)
//    - Gemini Interactions TTS Priority (Single locked model across entire episode):
//        1. gemini-3.8-flash-tts (Puck + speech_metadata)
//        2. gemini-3.8-flash-lite-tts (Puck + speech_metadata)
//        3. gemini-3.1-flash-tts-preview (Puck, NO speech_metadata)
//    - Strict Narrator Vocal Tone Lock (VOICE_NAME='Puck', NARRATOR_STYLE, 2-pass LRA=3.5 loudnorm)
//      with explicit exceptions ONLY for other characters (role:'character'/speaker) and
//      narrator impersonations (role:'impersonate'/impersonate) + multi-segment voSegments/markup
//    - SHA-256 disk audio cache (audio/cache/scene_<id>_<hash>.wav)
//    - Auto RIFF WAV header detection & wrapping
//    - Thai word-boundary subtitle chunking via Intl.Segmenter('th') (<= 26 chars, {t0, t1, text})
//    - Zero-Delay Cold Open (0.06s lead + 0.00s pre-roll subtitle on scene 0 / act openers)
//    - Dual-bus procedural SFX + ambient beds (bedMix 42% duck vs. impactSfxMix <= 10% duck)
//    - Parallel TTS synthesis across GEMINI_API_KEYS with dailyExhausted tracking
//    - EBU R128 Broadcast Mastering (-18.0 LUFS) -> audio/master.wav + audio/master.mp3
//    - Writes timeline.json & timeline.js
// =============================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
let ffmpeg = 'ffmpeg';
try {
  ffmpeg = require('ffmpeg-static') || 'ffmpeg';
} catch (_) {
  ffmpeg = 'ffmpeg';
}
let episode = {};
try {
  episode = require('./episode');
} catch (err) {
  if (require.main === module) throw err;
}

const { SCENES = [], TITLE = '', SUBTITLE = '' } = episode;
const HUD_MODE = episode.HUD_MODE || episode.hudMode || 'survival';
const NARRATIVE_MODE = episode.NARRATIVE_MODE || episode.narrativeMode || (HUD_MODE === 'documentary' ? 'documentary' : 'survival');
const SR = 44100;
const VOICE_SR = 24000;
const TARGET_LUFS = -18.0;
const LEAD = 0.20;
const COLD_OPEN_LEAD = 0.06;

function resolveTailSilenceMs() {
  const idx = process.argv.indexOf('--tail-silence-ms');
  const cliVal = idx !== -1 && process.argv[idx + 1] ? Number(process.argv[idx + 1]) : NaN;
  const epVal = Number(episode.TRAILING_SILENCE_MS ?? episode.trailingSilenceMs);
  const chosen = Number.isFinite(cliVal) ? cliVal : (Number.isFinite(epVal) ? epVal : 420);
  // Keep within 350–500 ms sweet spot (allow 0 only if explicitly forced via negative/zero override? Keep >= 350ms safety floor)
  return Math.max(350, Math.min(500, Math.round(chosen)));
}

const TRAILING_SILENCE_MS = resolveTailSilenceMs();
const DEFAULT_PAD = Math.max(0.42, +(TRAILING_SILENCE_MS / 1000).toFixed(3));
const AUDIO = path.join(__dirname, 'audio');
const CACHE_DIR = path.join(AUDIO, 'cache');
if (require.main === module) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Load .env if present (without extra dependencies)
function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadDotEnv();

const API_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const TTS_MODELS = [
  { id: 'gemini-3.8-flash-tts', supportsStyle: true },
  { id: 'gemini-3.8-flash-lite-tts', supportsStyle: true },
  { id: 'gemini-3.1-flash-tts-preview', supportsStyle: false, simpleAudioFormat: true }
];
const VOICE_NAME = 'Puck';
const UNIFIED_STYLE = 'same single male Thai narrator (Puck) across all scenes, locked low-mid baritone pitch register, calm deadpan documentary tone, steady even cadence, consistent close-mic proximity, zero pitch spikes or theatrical shouting';
const NARRATOR_STYLE = UNIFIED_STYLE;
const CHARACTER_VOICE_POOL = ['Kore', 'Charon', 'Aoede', 'Fenrir'];

const DEFAULT_CHARACTER_VOICES = {
  yai_nuan: {
    voice: 'Aoede',
    preset: 'elder_female',
    style: 'elderly Thai woman speaking in a weathered, earnest, hushed conversational tone, steady natural cadence'
  },
  elder_female: {
    voice: 'Aoede',
    preset: 'elder_female',
    style: 'elderly Thai woman speaking in a weathered, earnest, hushed conversational tone, steady natural cadence'
  },
  grandma: {
    voice: 'Aoede',
    preset: 'elder_female',
    style: 'elderly Thai grandmother speaking naturally in an earnest warm tone, steady calm pacing'
  },
  auntie: {
    voice: 'Aoede',
    preset: 'elder_female',
    style: 'middle-aged Thai auntie speaking in an animated candid everyday tone, natural neighborhood cadence'
  },
  female: {
    voice: 'Kore',
    preset: 'female',
    style: 'clear natural Thai female voice, expressive conversational tone, close-mic clarity'
  },
  fah: {
    voice: 'Kore',
    preset: 'female',
    style: 'lively young Thai female friend, expressive conversational tone, crisp articulation'
  },
  woman: {
    voice: 'Kore',
    preset: 'female',
    style: 'clear natural Thai female voice, composed conversational tone, close-mic clarity'
  },
  mother: {
    voice: 'Aoede',
    preset: 'elder_female',
    style: 'Thai mother speaking softly and earnestly, natural grounded emotion, close-mic clarity'
  },
  nurse: {
    voice: 'Kore',
    preset: 'female',
    style: 'calm composed Thai nurse voice, crisp informative articulation, steady pace'
  },
  clinic_staff: {
    voice: 'Kore',
    preset: 'sweet_sales',
    style: 'cheerful sweet persuasive Thai female salesperson, polite fast promotional cadence'
  },
  sales_girl: {
    voice: 'Kore',
    preset: 'sweet_sales',
    style: 'cheerful sweet persuasive Thai female salesperson, polite fast promotional cadence'
  },
  cashier: {
    voice: 'Kore',
    preset: 'sweet_sales',
    style: 'polite brisk Thai female cashier voice, crisp close-mic conversational delivery'
  },
  boss: {
    voice: 'Charon',
    preset: 'deep_male',
    style: 'authoritative older Thai male voice, deep resonant low register, firm composed delivery'
  },
  elder_male: {
    voice: 'Charon',
    preset: 'deep_male',
    style: 'older Thai man speaking with weathered authority, low grounded baritone, unhurried cadence'
  },
  guard: {
    voice: 'Charon',
    preset: 'deep_male',
    style: 'gruff alert Thai night-shift security guard, low steady voice, cautious earnest cadence'
  },
  shaman: {
    voice: 'Charon',
    preset: 'deep_male',
    style: 'solemn older Thai ritual practitioner, deep resonant voice, measured hushed authority'
  },
  monk: {
    voice: 'Charon',
    preset: 'deep_male',
    style: 'calm measured older Thai male voice, deep grounded tone, deliberate even cadence'
  },
  deep_male: {
    voice: 'Charon',
    preset: 'deep_male',
    style: 'deep resonant Thai male voice, calm authoritative low register'
  },
  friend_male: {
    voice: 'Fenrir',
    preset: 'young_male',
    style: 'casual relatable Thai male voice, distinct midrange timbre separate from narrator'
  },
  barista: {
    voice: 'Fenrir',
    preset: 'young_male',
    style: 'deadpan cool indie Thai male barista voice, relaxed natural midrange cadence'
  },
  rider: {
    voice: 'Fenrir',
    preset: 'young_male',
    style: 'brisk street-smart Thai delivery rider voice, energetic casual midrange timbre'
  },
  vendor_male: {
    voice: 'Fenrir',
    preset: 'young_male',
    style: 'friendly Thai male street vendor voice, lively conversational everyday cadence'
  },
  young_male: {
    voice: 'Fenrir',
    preset: 'young_male',
    style: 'young Thai male voice, clear casual midrange timbre distinct from narrator'
  },
  ghost: {
    voice: 'Aoede',
    preset: 'whisper_ghost',
    style: 'eerie hushed ghostly Thai whisper, chilling breathy delivery'
  },
  entity: {
    voice: 'Aoede',
    preset: 'whisper_ghost',
    style: 'uncanny hushed spectral Thai voice, low chilling whisper, unnatural stillness'
  },
  whisper: {
    voice: 'Aoede',
    preset: 'whisper_ghost',
    style: 'eerie hushed close-mic Thai whisper, tense trembling breathy cadence'
  }
};

function getCharacterVoiceMap() {
  const merged = { ...DEFAULT_CHARACTER_VOICES };
  const custom = episode && episode.CHARACTER_VOICES;
  if (custom && typeof custom === 'object') {
    for (const [k, v] of Object.entries(custom)) {
      if (!v) continue;
      merged[k] = typeof v === 'string' ? { voice: v } : v;
      merged[k.toLowerCase()] = merged[k];
    }
  }
  return merged;
}

const IMPERSONATION_PRESETS = {
  narrator_lock: [
    'atempo=1.12',
    'highpass=f=82',
    'lowpass=f=11800',
    'equalizer=f=175:t=q:w=1.1:g=1.4',
    'equalizer=f=420:t=q:w=1.4:g=-1.0',
    'equalizer=f=3350:t=q:w=1.2:g=-1.4',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-21dB:ratio=3.8:attack=6:release=135:makeup=2.5'
  ],
  sweet_sales: [
    'atempo=1.16',
    'highpass=f=115',
    'lowpass=f=13500',
    'equalizer=f=220:t=q:w=1.2:g=-1.0',
    'equalizer=f=2800:t=q:w=1.2:g=1.6',
    'equalizer=f=4500:t=q:w=1.4:g=-0.8',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=3.0:attack=8:release=130:makeup=2.2'
  ],
  elder: [
    'atempo=1.06',
    'highpass=f=100',
    'lowpass=f=10500',
    'equalizer=f=260:t=q:w=1.2:g=1.2',
    'equalizer=f=1900:t=q:w=1.2:g=1.2',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=3.0:attack=8:release=140:makeup=2.2'
  ],
  elder_female: [
    'atempo=1.06',
    'highpass=f=100',
    'lowpass=f=10500',
    'equalizer=f=260:t=q:w=1.2:g=1.2',
    'equalizer=f=1900:t=q:w=1.2:g=1.2',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=3.0:attack=8:release=140:makeup=2.2'
  ],
  deep: [
    'atempo=1.08',
    'highpass=f=65',
    'lowpass=f=11000',
    'equalizer=f=135:t=q:w=1.0:g=2.4',
    'equalizer=f=380:t=q:w=1.3:g=-1.0',
    'equalizer=f=3200:t=q:w=1.2:g=-1.2',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=3.2:attack=8:release=140:makeup=2.4'
  ],
  deep_male: [
    'atempo=1.08',
    'highpass=f=65',
    'lowpass=f=11000',
    'equalizer=f=135:t=q:w=1.0:g=2.4',
    'equalizer=f=380:t=q:w=1.3:g=-1.0',
    'equalizer=f=3200:t=q:w=1.2:g=-1.2',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=3.2:attack=8:release=140:makeup=2.4'
  ],
  excited: [
    'atempo=1.18',
    'highpass=f=95',
    'lowpass=f=13500',
    'equalizer=f=240:t=q:w=1.1:g=0.8',
    'equalizer=f=3000:t=q:w=1.2:g=1.5',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=3.0:attack=6:release=120:makeup=2.2'
  ],
  whisper_ghost: [
    'atempo=1.04',
    'highpass=f=140',
    'lowpass=f=9000',
    'equalizer=f=2200:t=q:w=1.1:g=2.2',
    'aecho=0.8:0.75:45|90:0.25|0.12',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-22dB:ratio=3.2:attack=8:release=150:makeup=2.5'
  ],
  phone_speaker: [
    'atempo=1.12',
    'highpass=f=300',
    'lowpass=f=3400',
    'equalizer=f=1400:t=q:w=1.0:g=2.5',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=4.0:attack=5:release=100:makeup=3.0'
  ],
  impersonate: [
    'atempo=1.12',
    'highpass=f=95',
    'lowpass=f=13000',
    'equalizer=f=200:t=q:w=1.1:g=0.8',
    'equalizer=f=3400:t=q:w=1.2:g=-0.8',
    'dynaudnorm=f=120:g=5:p=0.92:m=3.0',
    'acompressor=threshold=-20dB:ratio=3.0:attack=8:release=135:makeup=2.3'
  ]
};
IMPERSONATION_PRESETS.female = IMPERSONATION_PRESETS.impersonate;
IMPERSONATION_PRESETS.young_male = IMPERSONATION_PRESETS.impersonate;

const dailyExhausted = new Set();
let lockedModelId = process.env.TTS_MODEL_PREFER || null;

function inferPresetFromHint(hint) {
  const s = String(hint || '').toLowerCase();
  if (!s) return null;
  if (IMPERSONATION_PRESETS[s]) return s;
  if (/sweet|sales|หวาน|ขายของ|โปร|คลินิก|พนักงาน/.test(s)) return 'sweet_sales';
  if (/elder|grandma|ยาย|ย่า|ป้า|แก่|ชรา/.test(s)) return 'elder_female';
  if (/deep|boss|บอส|หัวหน้า|เข้ม|ดุ|หมอผี|ยาม/.test(s)) return 'deep_male';
  if (/whisper|ghost|กระซิบ|ผี|วิญญาณ|หลอน/.test(s)) return 'whisper_ghost';
  if (/phone|call|สายเข้า|โทรศัพท์|วิทยุ|ลำโพง/.test(s)) return 'phone_speaker';
  if (/excit|panic|ตกใจ|ตื่นเต้น|รัว|รีบ/.test(s)) return 'excited';
  return null;
}

function deterministicPoolVoice(speakerKey) {
  const h = crypto.createHash('md5').update(String(speakerKey || 'character')).digest()[0];
  return CHARACTER_VOICE_POOL[h % CHARACTER_VOICE_POOL.length];
}

function resolveVoiceProfile(seg = {}, scene = {}) {
  let role = seg.role || scene.role || '';
  if (!role) {
    if (seg.speaker || scene.speaker) role = 'character';
    else if (seg.impersonate || scene.impersonate) role = 'impersonate';
    else role = 'narrator';
  }
  role = String(role).toLowerCase();

  if (role === 'narrator') {
    return {
      role: 'narrator',
      speaker: 'narrator',
      voice: VOICE_NAME,
      style: UNIFIED_STYLE,
      preset: 'narrator_lock'
    };
  }

  if (role === 'impersonate') {
    const desc = String(seg.impersonate || scene.impersonate || 'distinct character impression').trim();
    const voice = seg.voice || scene.voice || VOICE_NAME;
    const presetRaw = seg.preset || seg.voicePreset || scene.voicePreset || inferPresetFromHint(desc) || 'impersonate';
    const preset = IMPERSONATION_PRESETS[presetRaw] ? presetRaw : 'impersonate';
    const style = seg.style || seg.voiceStyle || scene.voiceStyle ||
      `same Thai male narrator (${voice}) dramatically or playfully impersonating another person's voice (${desc}), clear expressive vocal acting while keeping crisp Thai articulation`;
    return {
      role: 'impersonate',
      speaker: `impersonate:${desc}`,
      voice,
      style,
      preset
    };
  }

  const rawSpeaker = String(seg.speaker || scene.speaker || 'character').trim();
  const speakerKey = rawSpeaker.toLowerCase();
  const charMap = getCharacterVoiceMap();
  const entry = charMap[rawSpeaker] || charMap[speakerKey] || null;
  const voice = seg.voice || scene.voice || (entry && entry.voice) || deterministicPoolVoice(speakerKey);
  const presetRaw = seg.preset || seg.voicePreset || scene.voicePreset || (entry && entry.preset) ||
    inferPresetFromHint(speakerKey) || (voice === 'Charon' ? 'deep_male' : (voice === 'Aoede' ? 'elder_female' : (voice === 'Kore' ? 'female' : 'young_male')));
  const preset = IMPERSONATION_PRESETS[presetRaw] ? presetRaw : 'impersonate';
  const style = seg.style || seg.voiceStyle || scene.voiceStyle || (entry && entry.style) ||
    `distinct Thai character (${rawSpeaker}) speaking in a natural expressive conversational tone, close-mic clarity, consistent voice identity across scenes`;

  return {
    role: 'character',
    speaker: speakerKey,
    voice,
    style,
    preset
  };
}

function getSceneRawText(scene) {
  if (!scene || typeof scene !== 'object') return '';
  if (typeof scene.narration === 'string' && scene.narration.trim()) return scene.narration;
  if (typeof scene.vo === 'string') return scene.vo;
  return '';
}

function stripInlineMarkup(text) {
  return String(text || '').replace(
    /\[\[(?:char|character|impersonate|mimic|narrator)(?::[^|\]]*)?\|([\s\S]*?)\]\]/gi,
    '$1'
  );
}

function stripVoMarkupForSubs(sceneOrText) {
  if (sceneOrText && typeof sceneOrText === 'object') {
    const rawDirect = getSceneRawText(sceneOrText);
    if (Array.isArray(sceneOrText.voSegments) && sceneOrText.voSegments.length > 0 && !rawDirect) {
      return sceneOrText.voSegments.map(s => stripInlineMarkup(s.text || '')).join(' ').replace(/\s+/g, ' ').trim();
    }
    return stripInlineMarkup(rawDirect).replace(/\s+/g, ' ').trim();
  }
  return stripInlineMarkup(sceneOrText || '').replace(/\s+/g, ' ').trim();
}

function sanitizeVoForTTS(text, role = 'narrator') {
  const plain = stripInlineMarkup(text);
  if (role === 'character' || role === 'impersonate') {
    return plain
      .replace(/[‘’'“”"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return plain
    .replace(/[‘’'“”"]/g, '')
    .replace(/\.{2,}|…/g, ' ')
    .replace(/[!?؟]+/g, ' ')
    .replace(/[~—–]+/g, ' ')
    .replace(/[:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ----------------------------------------------------------------- PRONUNCIATION_MAP
// Loads the full curated Thai Folk Horror, Medical, Science & Isan TTS dictionary from
// `pronunciation_map.js` (single source of truth), merged with optional `pronunciation_map.json`
// and `episode.PRONUNCIATION_MAP`. Applied ONLY before sending text to Gemini TTS — NEVER alters subtitles.
let externalPronMod = null;
for (const cand of [
  path.join(__dirname, 'pronunciation_map.js'),
  path.join(__dirname, '..', 'templates', 'pronunciation_map.js')
]) {
  if (fs.existsSync(cand)) {
    try { externalPronMod = require(cand); break; } catch (_) {}
  }
}

const FALLBACK_DEFAULT_PRONUNCIATION_MAP = {
  'Brugada Syndrome': 'บรูกาด้า ซินโดรม',
  Brugada: 'บรูกาด้า',
  SUNDS: 'ซันด์ส',
  'นักมานุษยวิทยา': 'นัก-มะ-นุด-สะ-ยะ-วิด-ทะ-ยา',
  'มานุษยวิทยา': 'มะ-นุด-สะ-ยะ-วิด-ทะ-ยา',
  'มลาบรี': 'มะ-ลา-บรี',
  'หนามพุทรา': 'หนาม-พุด-ซา',
  'ใบหนาด': 'ใบ-หนาด',
  'ชะตากรรม': 'ชะ-ตา-กำ',
  LINE: 'ไลน์',
  CCTV: 'ซีซีทีวี',
  GPS: 'จีพีเอส',
  AI: 'เอไอ'
};

const DEFAULT_PRONUNCIATION_MAP = externalPronMod && externalPronMod.PRONUNCIATION_MAP
  ? { ...externalPronMod.PRONUNCIATION_MAP }
  : { ...FALLBACK_DEFAULT_PRONUNCIATION_MAP };

function loadPronunciationMap(extraMap = null, projectDir = __dirname) {
  const merged = { ...DEFAULT_PRONUNCIATION_MAP };
  const localJsMap = path.join(projectDir, 'pronunciation_map.js');
  if (localJsMap !== path.join(__dirname, 'pronunciation_map.js') && fs.existsSync(localJsMap)) {
    try {
      const m = require(localJsMap);
      if (m && m.PRONUNCIATION_MAP) Object.assign(merged, m.PRONUNCIATION_MAP);
    } catch (_) {}
  }
  const jsonMapPath = path.join(projectDir, 'pronunciation_map.json');
  if (fs.existsSync(jsonMapPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonMapPath, 'utf8'));
      if (parsed && typeof parsed === 'object') Object.assign(merged, parsed);
    } catch (_) {}
  }
  if (episode && episode.PRONUNCIATION_MAP && typeof episode.PRONUNCIATION_MAP === 'object') {
    Object.assign(merged, episode.PRONUNCIATION_MAP);
  }
  if (extraMap && typeof extraMap === 'object') {
    Object.assign(merged, extraMap);
  }
  return merged;
}

const PRONUNCIATION_MAP = loadPronunciationMap();

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_SCALES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

function intUnderMillionToThai(num) {
  if (num === 0) return '';
  const s = String(num);
  const len = s.length;
  let out = '';
  for (let i = 0; i < len; i++) {
    const d = Number(s[i]);
    if (d === 0) continue;
    const pos = len - 1 - i;
    if (pos === 0 && d === 1 && len > 1) {
      out += 'เอ็ด';
    } else if (pos === 1 && d === 2) {
      out += 'ยี่สิบ';
    } else if (pos === 1 && d === 1) {
      out += 'สิบ';
    } else {
      out += THAI_DIGITS[d] + THAI_SCALES[pos];
    }
  }
  return out;
}

function intToThaiWords(num) {
  if (!Number.isFinite(num) || num < 0) return '';
  const n = Math.floor(num);
  if (n === 0) return 'ศูนย์';
  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    const rem = n % 1000000;
    return `${intToThaiWords(millions)}ล้าน${rem > 0 ? intUnderMillionToThai(rem) : ''}`;
  }
  return intUnderMillionToThai(n);
}

function numberToThaiWords(numStr) {
  const clean = String(numStr || '').replace(/,/g, '').trim();
  if (clean.startsWith('-')) {
    const rest = clean.slice(1).trim();
    return /^\d+(?:\.\d+)?$/.test(rest) ? `ลบ${numberToThaiWords(rest)}` : String(numStr || '');
  }
  if (!/^\d+(?:\.\d+)?$/.test(clean)) return String(numStr || '');
  if (clean.includes('.')) {
    const [intPart, decPart] = clean.split('.');
    const intWords = /^0\d+$/.test(intPart)
      ? intPart.split('').map(d => THAI_DIGITS[Number(d)]).join('')
      : intToThaiWords(Number(intPart || '0'));
    const decWords = decPart.split('').map(d => THAI_DIGITS[Number(d)]).join('');
    return `${intWords}จุด${decWords}`;
  }
  if (/^0\d+$/.test(clean)) {
    return clean.split('').map(d => THAI_DIGITS[Number(d)]).join('');
  }
  return intToThaiWords(Number(clean));
}

function applyPronunciationEntry(text, key, val) {
  if (externalPronMod && typeof externalPronMod.applyPronunciationEntry === 'function') {
    return externalPronMod.applyPronunciationEntry(text, key, val);
  }
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

function applyPronunciationMap(text, customMap = {}) {
  const merged = loadPronunciationMap(customMap);
  const keys = Object.keys(merged).sort((a, b) => b.length - a.length);
  let result = String(text || '');
  for (const key of keys) {
    result = applyPronunciationEntry(result, key, merged[key]);
  }
  return result;
}

function normalizeThaiForTTS(text, role = 'narrator', extraMap = null) {
  let out = stripInlineMarkup(text);
  if (!out.trim()) return '';

  // Apply merged PRONUNCIATION_MAP (pronunciation_map.js + pronunciation_map.json + episode.PRONUNCIATION_MAP + extraMap)
  out = applyPronunciationMap(out, extraMap || {});

  // Expand Thai time notation (e.g. 03:14 น., 17:59 น., เวลา 08:30)
  out = out.replace(/(^|[\s(])([01]?\d|2[0-3]):([0-5]\d)\s*(?:น\.(?:\s*า)?|นาฬิกา)?(?=$|[\s),.!?؟…])/g, (_, pre, hh, mm) => {
    const hWord = intToThaiWords(parseInt(hh, 10));
    const mNum = parseInt(mm, 10);
    return `${pre}${hWord}นาฬิกา${mNum > 0 ? ' ' + intToThaiWords(mNum) + 'นาที' : ''} `;
  });

  // Expand common Thai historical/documentary abbreviations
  out = out
    .replace(/(?<![\u0E00-\u0E7FA-Za-z])พ\.ศ\.\s*/g, ' พุทธศักราช ')
    .replace(/(?<![\u0E00-\u0E7FA-Za-z])ค\.ศ\.\s*/g, ' คริสต์ศักราช ')
    .replace(/(?<![\u0E00-\u0E7FA-Za-z])กทม\.?/g, ' กรุงเทพมหานคร ')
    .replace(/(?<![\u0E00-\u0E7FA-Za-z])รพ\./g, ' โรงพยาบาล ')
    .replace(/ฯลฯ/g, ' และอื่นๆ ');

  // Expand numeric ranges while keeping second number intact for attached unit rules
  out = out.replace(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*[–-]\s*(?=\d)/g, (_, a) => `${numberToThaiWords(a)} ถึง `);

  const numPattern = '((?:(?<![0-9A-Za-z])-)?\\d+(?:,\\d{3})*(?:\\.\\d+)?)';
  out = out
    .replace(new RegExp(`฿\\s*${numPattern}`, 'g'), (_, n) => ` ${numberToThaiWords(n)}บาท `)
    .replace(new RegExp(`${numPattern}\\s*(?:฿|บ\\.)`, 'g'), (_, n) => ` ${numberToThaiWords(n)}บาท `)
    .replace(new RegExp(`${numPattern}\\s*%`, 'g'), (_, n) => ` ${numberToThaiWords(n)}เปอร์เซ็นต์ `)
    .replace(new RegExp(`${numPattern}\\s*ตร\\.\\s*ม\\.?`, 'g'), (_, n) => ` ${numberToThaiWords(n)}ตารางเมตร `)
    .replace(new RegExp(`${numPattern}\\s*กม\\.?`, 'g'), (_, n) => ` ${numberToThaiWords(n)}กิโลเมตร `)
    .replace(new RegExp(`${numPattern}\\s*ซม\\.?`, 'g'), (_, n) => ` ${numberToThaiWords(n)}เซนติเมตร `)
    .replace(new RegExp(`${numPattern}\\s*มม\\.?`, 'g'), (_, n) => ` ${numberToThaiWords(n)}มิลลิเมตร `)
    .replace(new RegExp(`${numPattern}\\s*มล\\.?`, 'g'), (_, n) => ` ${numberToThaiWords(n)}มิลลิลิตร `)
    .replace(new RegExp(`${numPattern}\\s*กก\\.?`, 'g'), (_, n) => ` ${numberToThaiWords(n)}กิโลกรัม `)
    .replace(new RegExp(`${numPattern}\\s*ชม\\.?`, 'g'), (_, n) => ` ${numberToThaiWords(n)}ชั่วโมง `)
    .replace(new RegExp(`${numPattern}\\s*วิ\\.(?=$|[\\s,.!?])`, 'g'), (_, n) => ` ${numberToThaiWords(n)}วินาที `)
    .replace(new RegExp(`${numPattern}\\s*ม\\.(?=$|[\\s,.!?])`, 'g'), (_, n) => ` ${numberToThaiWords(n)}เมตร `)
    .replace(new RegExp(`${numPattern}\\s*(?:°\\s*C|องศา\\s*C)\\b`, 'gi'), (_, n) => ` ${numberToThaiWords(n)}องศาเซลเซียส `)
    .replace(new RegExp(`${numPattern}\\s*(?:°\\s*F|องศา\\s*F)\\b`, 'gi'), (_, n) => ` ${numberToThaiWords(n)}องศาฟาเรนไฮต์ `)
    .replace(new RegExp(`${numPattern}\\s*dB\\b`, 'gi'), (_, n) => ` ${numberToThaiWords(n)}เดซิเบล `);

  // Numeric ranges (e.g. 45-60 -> 45 ถึง 60) & signed negative numbers (e.g. -18 -> ลบสิบแปด)
  out = out.replace(/(\d+)\s*[–-]\s*(\d+)/g, (_, a, b) => `${numberToThaiWords(a)} ถึง ${numberToThaiWords(b)}`);
  out = out.replace(/(^|[\s(])-(\d+(?:,\d{3})*(?:\.\d+)?)(?=$|[\s),.!?%])/g, (_, pre, n) => `${pre}ลบ${numberToThaiWords(n)}`);

  // Remaining standalone numbers
  out = out.replace(/(?<![A-Za-z0-9])\d+(?:,\d{3})*(?:\.\d+)?(?![A-Za-z0-9])/g, m => ` ${numberToThaiWords(m)} `);

  // Normalize Mai Yamok spacing so repeated words don't glue to following words
  out = out.replace(/\s*ๆ\s*/g, 'ๆ ');

  return sanitizeVoForTTS(out, role);
}

function buildClearerRetryText(ttsText, retryAttempt = 1) {
  const clean = String(ttsText || '').replace(/\s+/g, ' ').trim();
  if (!clean) return clean;
  const maxClause = retryAttempt >= 2 ? 14 : 20;
  const seg = new Intl.Segmenter('th', { granularity: 'word' });
  const parts = [];
  for (const token of clean.split(' ')) {
    if (token.length <= maxClause) {
      parts.push(token);
      continue;
    }
    let chunk = '';
    for (const { segment } of seg.segment(token)) {
      if (chunk && (chunk + segment).length > maxClause) {
        parts.push(chunk);
        chunk = segment;
      } else {
        chunk += segment;
      }
    }
    if (chunk) parts.push(chunk);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function thaiTextSimilarity(a, b) {
  const norm = s => normalizeThaiForTTS(String(s || ''), 'narrator').replace(/[\s!?؟.,…'"“”‘’\-:;()[\]{}]/g, '');
  const sa = norm(a);
  const sb = norm(b);
  if (!sa && !sb) return 1;
  if (!sa || !sb) return 0;
  if (sa === sb) return 1;
  if (sa.length < 2 || sb.length < 2) return sa === sb ? 1 : 0;
  const bigrams = str => {
    const m = new Map();
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.slice(i, i + 2);
      m.set(bg, (m.get(bg) || 0) + 1);
    }
    return m;
  };
  const ma = bigrams(sa);
  const mb = bigrams(sb);
  let overlap = 0;
  for (const [bg, ca] of ma.entries()) {
    const cb = mb.get(bg) || 0;
    overlap += Math.min(ca, cb);
  }
  return (2 * overlap) / ((sa.length - 1) + (sb.length - 1));
}

function trimWithRate(pcm, sampleRate = VOICE_SR) {
  const th = 0.008;
  let a = 0, b = pcm.length - 1;
  while (a < b && Math.abs(pcm[a]) < th) a++;
  while (b > a && Math.abs(pcm[b]) < th) b--;
  a = Math.max(0, a - Math.floor(0.03 * sampleRate));
  b = Math.min(pcm.length - 1, b + Math.floor(0.08 * sampleRate));
  return pcm.slice(a, Math.max(a, b));
}

function appendTrailingSilence(pcm, silenceMs = TRAILING_SILENCE_MS, sampleRate = VOICE_SR) {
  if (!pcm || pcm.length === 0) return new Float32Array(0);
  const padSamples = Math.max(0, Math.round((Math.max(0, silenceMs) / 1000) * sampleRate));
  const out = new Float32Array(pcm.length + padSamples);
  out.set(pcm, 0);
  // Apply subtle 12 ms micro fade-out on the last active samples to prevent click/pop before silent tail
  const fadeSamples = Math.min(pcm.length, Math.max(1, Math.round(0.012 * sampleRate)));
  const fadeStart = pcm.length - fadeSamples;
  for (let i = 0; i < fadeSamples; i++) {
    out[fadeStart + i] *= (1 - (i + 1) / fadeSamples);
  }
  return out;
}

function measureTrailingSilenceMs(pcm, sampleRate = VOICE_SR, thresh = 0.008) {
  if (!pcm || pcm.length === 0) return 0;
  let endIdx = pcm.length - 1;
  while (endIdx > 0 && Math.abs(pcm[endIdx]) < thresh) endIdx--;
  const silentSamples = Math.max(0, (pcm.length - 1) - endIdx);
  return (silentSamples / sampleRate) * 1000;
}

function applyTrailingSilenceToWav(wavPath, silenceMs = TRAILING_SILENCE_MS, sampleRate = VOICE_SR) {
  if (!wavPath || !fs.existsSync(wavPath)) return;
  const decoded = decode(wavPath, sampleRate);
  const trimmed = trimWithRate(decoded, sampleRate);
  const padded = appendTrailingSilence(trimmed, silenceMs, sampleRate);
  writeMonoWav(wavPath, padded, sampleRate);
}

function inspectVoClipClarity(pcm, expectedText, sampleRate = VOICE_SR, opts = {}) {
  const expectedPlain = normalizeThaiForTTS(expectedText || '', opts.role || 'narrator');
  const spokenChars = expectedPlain.replace(/[\s!?؟.,…'"“”‘’\-:;()[\]{}]/g, '').length;
  let wordCount = 0;
  try {
    const seg = new Intl.Segmenter('th', { granularity: 'word' });
    for (const s of seg.segment(expectedPlain)) {
      if (s.isWordLike) wordCount++;
    }
  } catch (_) {
    wordCount = expectedPlain.split(/\s+/).filter(Boolean).length;
  }

  if (!pcm || pcm.length === 0) {
    return {
      score: 0,
      status: 'FAIL',
      durSec: 0,
      spokenChars,
      wordCount,
      charsPerSec: 0,
      wordsPerSec: 0,
      vadRatio: 0,
      maxSilenceGapSec: 0,
      tailDropDb: 0,
      zcr: 0,
      clippingRatio: 0,
      issues: [{ code: 'EMPTY_AUDIO', detail: 'Audio buffer is empty' }]
    };
  }

  const trimmed = trimWithRate(pcm, sampleRate);
  const durSec = trimmed.length / sampleRate;
  const tempoFactor = Number.isFinite(opts.tempoFactor) ? opts.tempoFactor : 1.0;
  const effDur = durSec / tempoFactor;
  const charsPerSec = spokenChars / Math.max(0.1, effDur);
  const wordsPerSec = wordCount / Math.max(0.1, effDur);

  const winSize = Math.max(1, Math.floor(0.025 * sampleRate));
  const numWin = Math.floor(trimmed.length / winSize);
  const winRms = [];
  const winZcr = [];
  let clipCount = 0;
  for (let i = 0; i < trimmed.length; i++) {
    if (Math.abs(trimmed[i]) >= 0.995) clipCount++;
  }
  const clippingRatio = clipCount / Math.max(1, trimmed.length);

  for (let w = 0; w < numWin; w++) {
    const off = w * winSize;
    let sumSq = 0;
    let zc = 0;
    let prev = trimmed[off];
    for (let i = 0; i < winSize; i++) {
      const x = trimmed[off + i];
      sumSq += x * x;
      if (i > 0 && ((x >= 0 && prev < 0) || (x < 0 && prev >= 0))) zc++;
      prev = x;
    }
    winRms.push(Math.sqrt(sumSq / winSize));
    winZcr.push(zc / Math.max(1, winSize - 1));
  }

  const rmsThresh = Number.isFinite(opts.rmsThresh) ? opts.rmsThresh : 0.011;
  const activeIndices = [];
  for (let w = 0; w < winRms.length; w++) {
    if (winRms[w] >= rmsThresh) activeIndices.push(w);
  }
  const vadRatio = activeIndices.length / Math.max(1, winRms.length);

  let maxGapWin = 0;
  if (activeIndices.length >= 2) {
    const firstAct = Math.max(activeIndices[0], 3);
    const lastAct = Math.min(activeIndices[activeIndices.length - 1], winRms.length - 4);
    let curGap = 0;
    for (let w = firstAct; w <= lastAct; w++) {
      if (winRms[w] < rmsThresh) {
        curGap++;
        if (curGap > maxGapWin) maxGapWin = curGap;
      } else {
        curGap = 0;
      }
    }
  }
  const maxSilenceGapSec = maxGapWin * (winSize / sampleRate);

  let tailDropDb = 0;
  if (activeIndices.length >= 8) {
    const startW = activeIndices[0];
    const endW = activeIndices[activeIndices.length - 1];
    const span = winRms.slice(startW, endW + 1);
    const headLen = Math.max(2, Math.floor(span.length * 0.70));
    const tailLen = Math.max(2, Math.floor(span.length * 0.25));
    const headSlice = span.slice(0, headLen);
    const tailSlice = span.slice(span.length - tailLen);
    const rmsOf = arr => Math.sqrt(arr.reduce((s, r) => s + r * r, 0) / Math.max(1, arr.length));
    const headRms = rmsOf(headSlice);
    const tailRms = rmsOf(tailSlice);
    tailDropDb = 20 * Math.log10(Math.max(1e-5, headRms) / Math.max(1e-5, tailRms));
  }

  const zcr = activeIndices.length > 0
    ? activeIndices.reduce((s, idx) => s + winZcr[idx], 0) / activeIndices.length
    : (winZcr.reduce((s, z) => s + z, 0) / Math.max(1, winZcr.length));

  const issues = [];
  let score = 100;

  if (spokenChars >= 12 && charsPerSec > 22.0) {
    score -= 35;
    issues.push({ code: 'CUTOFF_OR_SKIPPED', detail: `Too fast (${charsPerSec.toFixed(1)} ch/s > 22.0) — possible skipped words or truncated TTS` });
  } else if (spokenChars >= 12 && charsPerSec > 19.0) {
    score -= 12;
    issues.push({ code: 'FAST_RUSHED_SPEECH', detail: `Slightly rushed (${charsPerSec.toFixed(1)} ch/s > 19.0)` });
  }
  if (spokenChars >= 10 && charsPerSec < 5.2) {
    score -= 35;
    issues.push({ code: 'DRAWL_OR_BABBLE', detail: `Too slow (${charsPerSec.toFixed(1)} ch/s < 5.2) — possible hallucinated babble or extreme drawl` });
  }
  if (durSec >= 1.5 && maxSilenceGapSec > 1.25) {
    score -= maxSilenceGapSec > 1.60 ? 35 : 25;
    issues.push({ code: 'INTERNAL_DROPOUT_GAP', detail: `Mid-sentence silence gap ${maxSilenceGapSec.toFixed(2)}s > 1.25s` });
  }
  if (durSec >= 1.5 && vadRatio < 0.48) {
    score -= 25;
    issues.push({ code: 'LOW_VOICE_ACTIVITY', detail: `Low speech density ${(vadRatio * 100).toFixed(0)}% < 48%` });
  }
  if (durSec >= 1.5 && tailDropDb > 10.5) {
    score -= 25;
    issues.push({ code: 'MUMBLED_TAIL', detail: `Sentence ending volume drops ${tailDropDb.toFixed(1)} dB > 10.5 dB` });
  }
  if (durSec >= 0.8 && zcr < 0.022) {
    score -= 25;
    issues.push({ code: 'MUFFLED_SPEECH', detail: `Muffled low-clarity articulation (ZCR ${zcr.toFixed(4)} < 0.022)` });
  }
  if (durSec >= 0.8 && zcr > 0.30) {
    score -= 20;
    issues.push({ code: 'HIGH_FREQ_NOISE', detail: `Excessive high-frequency hiss/artifacts (ZCR ${zcr.toFixed(4)} > 0.30)` });
  }
  if (clippingRatio > 0.005) {
    score -= 20;
    issues.push({ code: 'CLIPPING_DISTORTION', detail: `Audio clipping ${(clippingRatio * 100).toFixed(2)}% > 0.5%` });
  }
  // Detect abrupt cutoff right at the end of the raw audio buffer before trailing silence padding
  const rawTailWin = Math.min(pcm.length, Math.max(1, Math.floor(0.04 * sampleRate)));
  let rawTailSq = 0;
  for (let i = pcm.length - rawTailWin; i < pcm.length; i++) rawTailSq += pcm[i] * pcm[i];
  const rawTailEndRms = Math.sqrt(rawTailSq / rawTailWin);
  const trailingSilenceMs = measureTrailingSilenceMs(pcm, sampleRate);
  if (durSec >= 0.8 && rawTailEndRms > 0.045 && trailingSilenceMs < 25) {
    score -= 20;
    issues.push({ code: 'ABRUPT_TAIL_CUT', detail: `Abrupt audio cutoff at end of clip (tail RMS ${rawTailEndRms.toFixed(3)}, trailing silence ${trailingSilenceMs.toFixed(0)}ms)` });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const status = score < 70 ? 'FAIL' : (score < 82 ? 'WARN' : 'PASS');

  return {
    score,
    status,
    durSec: +durSec.toFixed(3),
    spokenChars,
    wordCount,
    charsPerSec: +charsPerSec.toFixed(2),
    wordsPerSec: +wordsPerSec.toFixed(2),
    vadRatio: +vadRatio.toFixed(3),
    maxSilenceGapSec: +maxSilenceGapSec.toFixed(3),
    tailDropDb: +tailDropDb.toFixed(2),
    trailingSilenceMs: +trailingSilenceMs.toFixed(1),
    zcr: +zcr.toFixed(4),
    clippingRatio: +clippingRatio.toFixed(5),
    issues
  };
}

async function verifyClipWithGeminiASR(wavPath, expectedText, apiKey) {
  if (!apiKey || !fs.existsSync(wavPath)) return null;
  const b64 = fs.readFileSync(wavPath).toString('base64');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = [
    `Expected Thai script: "${expectedText}"`,
    'Listen carefully to the attached Thai TTS audio clip.',
    '1. Transcribe the spoken Thai audio verbatim in Thai.',
    '2. Check if any word is mispronounced, skipped, cut off, mumbled, or unintelligible compared to the Expected Thai script.',
    'Return strict JSON only: {"transcript":"...","clarity_ok":true,"mispronounced":false,"unclear_words":[],"notes":""}'
  ].join('\n');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'audio/wav', data: b64 } }
        ]
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json'
      }
    })
  });
  if (!res.ok) {
    throw new Error(`[gemini-2.5-flash ASR] HTTP ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  let parsed = {};
  try {
    parsed = JSON.parse(rawText);
  } catch (_) {
    const m = rawText.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
  }
  const transcript = String(parsed.transcript || '').trim();
  const similarity = +thaiTextSimilarity(expectedText, transcript).toFixed(3);
  const mispronounced = Boolean(parsed.mispronounced);
  const unclearWords = Array.isArray(parsed.unclear_words) ? parsed.unclear_words : [];
  const pass = similarity >= 0.78 && !mispronounced && parsed.clarity_ok !== false;
  return {
    transcript,
    similarity,
    mispronounced,
    unclearWords,
    notes: parsed.notes || '',
    pass
  };
}

function parseInlineTaggedVo(text, scene) {
  const tagRe = /\[\[(char|character|impersonate|mimic|narrator)(?::([^|\]]*))?\|([\s\S]*?)\]\]/gi;
  const segments = [];
  let last = 0;
  let m;
  while ((m = tagRe.exec(text)) !== null) {
    if (m.index > last) {
      const before = text.slice(last, m.index).trim();
      if (before) segments.push({ role: scene.role || 'narrator', text: before });
    }
    const kind = m[1].toLowerCase();
    const arg = (m[2] || '').trim();
    const body = (m[3] || '').trim();
    if (body) {
      if (kind === 'char' || kind === 'character') {
        const [spk, presetHint] = arg.split('@').map(s => s.trim());
        segments.push({ role: 'character', speaker: spk || 'character', preset: presetHint || undefined, text: body });
      } else if (kind === 'impersonate' || kind === 'mimic') {
        const [desc, presetHint] = arg.split('@').map(s => s.trim());
        segments.push({ role: 'impersonate', impersonate: desc || 'distinct character impression', preset: presetHint || undefined, text: body });
      } else {
        segments.push({ role: 'narrator', text: body });
      }
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    const tail = text.slice(last).trim();
    if (tail) segments.push({ role: scene.role || 'narrator', text: tail });
  }
  return segments;
}

function splitSpeechVerbQuotes(text, scene) {
  const quoteRe = /((?:เล่า|พูด|บอก|ถาม|ตอบ|กระซิบ|ตะโกน|ร้อง|คิดในใจ|บ่น|สั่ง|ขู่|อ้อน)ว่า\s*)["“]([^"”]{12,})["”]/g;
  const segments = [];
  let last = 0;
  let m;
  while ((m = quoteRe.exec(text)) !== null) {
    const preEnd = m.index + m[1].length;
    if (preEnd > last) {
      const narr = text.slice(last, preEnd).trim();
      if (narr) segments.push({ role: 'narrator', text: narr });
    }
    const quoted = m[2].trim();
    if (quoted) {
      if (scene.quoteSpeaker) {
        segments.push({
          role: 'character',
          speaker: scene.quoteSpeaker,
          preset: scene.quotePreset,
          text: quoted
        });
      } else if (scene.quoteImpersonate) {
        segments.push({
          role: 'impersonate',
          impersonate: scene.quoteImpersonate,
          preset: scene.quotePreset,
          text: quoted
        });
      } else if (scene.quoteRole) {
        segments.push({
          role: scene.quoteRole,
          preset: scene.quotePreset,
          text: quoted
        });
      } else {
        segments.push({
          role: 'impersonate',
          impersonate: 'acting out quoted dialogue in character',
          preset: scene.quotePreset || 'impersonate',
          text: quoted
        });
      }
    }
    last = m.index + m[0].length;
  }
  if (last === 0) return [{ text }];
  if (last < text.length) {
    const tail = text.slice(last).trim();
    if (tail) segments.push({ role: 'narrator', text: tail });
  }
  return segments;
}

function parseSceneVoSegments(scene = {}) {
  if (Array.isArray(scene.voSegments) && scene.voSegments.length > 0) {
    return scene.voSegments
      .filter(seg => seg && String(seg.text || '').trim())
      .map(seg => ({ ...seg, text: String(seg.text) }));
  }
  const raw = getSceneRawText(scene).trim();
  if (!raw) return [];
  if (/\[\[(?:char|character|impersonate|mimic|narrator)(?::[^|\]]*)?\|/i.test(raw)) {
    return parseInlineTaggedVo(raw, scene);
  }
  const hasExplicitSceneRole = scene.role && String(scene.role).toLowerCase() !== 'narrator';
  if (scene.autoSplitQuotes !== false && !hasExplicitSceneRole && !scene.speaker && !scene.impersonate) {
    return splitSpeechVerbQuotes(raw, scene);
  }
  return [{ text: raw }];
}

function getSceneLead(scene, idx, prevAct) {
  if (scene.lead !== undefined) return Number(scene.lead);
  const isActOpener = scene.act != null && scene.act !== prevAct;
  if (idx === 0 || isActOpener || scene.isClimax === true || scene.isRecap === true) return COLD_OPEN_LEAD;
  return LEAD;
}

function decode(file, targetSr = SR) {
  const buf = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(targetSr), 'pipe:1'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function trim(pcm) {
  return trimWithRate(pcm, SR);
}

function unifyVocalTone(rawWav, normWav, profile = { role: 'narrator', preset: 'narrator_lock' }) {
  const isNarrator = !profile || profile.role === 'narrator';
  const presetKey = isNarrator ? 'narrator_lock' : (profile.preset || 'impersonate');
  const baseFilters = IMPERSONATION_PRESETS[presetKey] || IMPERSONATION_PRESETS.narrator_lock;
  const baseAf = baseFilters.join(',');
  const targetLra = isNarrator ? '3.5' : '4.5';

  // Pass 1: measure true integrated loudness, peak, LRA, and offset for linear 2-pass matching
  const pass1 = spawnSync(ffmpeg, [
    '-y', '-v', 'info', '-i', rawWav,
    '-af', `${baseAf},loudnorm=I=${TARGET_LUFS.toFixed(1)}:LRA=${targetLra}:TP=-1.5:print_format=json`,
    '-f', 'null', '-'
  ], { encoding: 'utf8', maxBuffer: 1 << 24 });

  const pass1Out = (pass1.stderr || '') + '\n' + (pass1.stdout || '');
  const jsonMatch = pass1Out.match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
  let loudFilter = `loudnorm=I=${TARGET_LUFS.toFixed(1)}:LRA=${targetLra}:TP=-1.5`;

  if (jsonMatch) {
    try {
      const m = JSON.parse(jsonMatch[0]);
      const vals = [m.input_i, m.input_tp, m.input_lra, m.input_thresh, m.target_offset].map(Number);
      if (vals.every(v => Number.isFinite(v))) {
        loudFilter = `loudnorm=I=${TARGET_LUFS.toFixed(1)}:LRA=${targetLra}:TP=-1.5:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
      }
    } catch (_) {}
  }

  execFileSync(ffmpeg, [
    '-y', '-v', 'error', '-i', rawWav,
    '-af', `${baseAf},${loudFilter}`,
    '-ar', String(VOICE_SR), '-ac', '1', normWav
  ]);
}

function ensureWavHeader(buf, sampleRate = VOICE_SR) {
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'RIFF') return buf;
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  return Buffer.concat([h, buf]);
}

function writeMonoWav(file, pcm, sampleRate = VOICE_SR) {
  const buf = Buffer.alloc(44 + pcm.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + pcm.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(pcm.length * 2, 40);
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.max(-1, Math.min(1, pcm[i])) * 32767 | 0;
    buf.writeInt16LE(v, 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
}

function concatNormWavsWithGap(wavPaths, outWav, gapSec = 0.10, sampleRate = VOICE_SR) {
  const gapSamples = Math.max(0, Math.round(gapSec * sampleRate));
  const chunks = wavPaths.map(f => decode(f, sampleRate));
  const totalLen = chunks.reduce((s, c) => s + c.length, 0) + Math.max(0, chunks.length - 1) * gapSamples;
  const out = new Float32Array(totalLen);
  let pos = 0;
  chunks.forEach((c, i) => {
    out.set(c, pos);
    pos += c.length;
    if (i < chunks.length - 1) pos += gapSamples;
  });
  writeMonoWav(outWav, out, sampleRate);
}

async function callGeminiInteractionsTTS(text, modelCfg, apiKey, profile = { voice: VOICE_NAME, style: UNIFIED_STYLE }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;
  const contentObj = { type: 'text', text };
  if (modelCfg.supportsStyle) {
    contentObj.annotations = [{ type: 'speech_metadata', style: profile.style || UNIFIED_STYLE }];
  }
  const responseFormat = modelCfg.simpleAudioFormat
    ? { type: 'audio' }
    : { type: 'audio', mime_type: 'audio/wav', sample_rate: VOICE_SR };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelCfg.id,
      input: [{ type: 'user_input', content: [contentObj] }],
      response_format: responseFormat,
      generation_config: { speech_config: [{ voice: profile.voice || VOICE_NAME }] }
    })
  });
  if (!res.ok) {
    const err = new Error(`[${modelCfg.id}] HTTP ${res.status}: ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  let b64 = json.output_audio?.data;
  if (!b64 && json.steps) {
    for (const st of json.steps) {
      for (const item of (st.content || [])) { if (item.type === 'audio' && item.data) { b64 = item.data; break; } }
      if (b64) break;
    }
  }
  if (!b64 && json.outputs) {
    for (const item of json.outputs) { if (item.type === 'audio' && item.data) { b64 = item.data; break; } }
  }
  if (!b64) throw new Error('No audio bytes returned in Gemini interaction');
  return ensureWavHeader(Buffer.from(b64, 'base64'), VOICE_SR);
}

function hashSegmentKey(profile, ttsText) {
  return crypto.createHash('sha256').update(`${profile.voice}|${profile.style}|${ttsText}`).digest('hex').slice(0, 16);
}

async function generateRawFromGemini(sceneId, segSuffix, ttsText, profile, idx, outRawWav) {
  if (API_KEYS.length === 0) {
    throw new Error('Missing GEMINI_API_KEY or GEMINI_API_KEYS environment variable (or .env file).');
  }

  const suffixPart = segSuffix ? `_seg${segSuffix}` : '';
  const modelOrder = lockedModelId
    ? [...TTS_MODELS.filter(m => m.id === lockedModelId), ...TTS_MODELS.filter(m => m.id !== lockedModelId)]
    : TTS_MODELS;

  let lastErr;
  for (const modelCfg of modelOrder) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      let triedAnyKey = false;
      for (let k = 0; k < API_KEYS.length; k++) {
        const ki = (idx + k) % API_KEYS.length;
        const pairKey = `${modelCfg.id}|${ki}`;
        if (dailyExhausted.has(pairKey)) continue;
        triedAnyKey = true;
        try {
          console.log(`  [TTS ${sceneId}${suffixPart} | ${profile.role}:${profile.voice}] ${modelCfg.id} (key #${ki + 1}, attempt ${attempt})...`);
          const wavBuf = await callGeminiInteractionsTTS(ttsText, modelCfg, API_KEYS[ki], profile);
          if (!lockedModelId) lockedModelId = modelCfg.id;
          fs.writeFileSync(outRawWav, wavBuf);
          return { rawWav: outRawWav, model: modelCfg.id };
        } catch (e) {
          lastErr = e;
          console.warn(`  [TTS warn] ${e.message.slice(0, 160)}`);
          if (/per day|PerDay|NOT_FOUND/i.test(e.message) || e.status === 404) {
            dailyExhausted.add(pairKey);
          } else if (e.status === 429) {
            await new Promise(r => setTimeout(r, 5500));
          }
        }
      }
      if (!triedAnyKey) break;
      await new Promise(r => setTimeout(r, 2500));
    }
    if (lockedModelId && modelCfg.id === lockedModelId) {
      console.warn(`  [TTS model lock warn] ${lockedModelId} exhausted all keys/retries; falling back only after exhausting locked model.`);
    }
  }
  throw lastErr || new Error(`Failed to synthesize TTS for scene ${sceneId}`);
}

async function synthesizeSegmentVerified(sceneId, segSuffix, rawSegText, profile, normOutWav, idx) {
  const phoneticText = normalizeThaiForTTS(rawSegText, profile.role);
  const legacyText = sanitizeVoForTTS(rawSegText, profile.role);
  if (!phoneticText) return { cached: true, hash: 'empty', clarity: null, asr: null, phoneticText: '' };

  const safeId = String(sceneId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const suffixPart = segSuffix ? `_seg${segSuffix}` : '';
  const phoneticHash = hashSegmentKey(profile, phoneticText);
  const legacyHash = hashSegmentKey(profile, legacyText);
  const phoneticCachedRaw = path.join(CACHE_DIR, `scene_${safeId}${suffixPart}_${phoneticHash}.wav`);
  const legacyCachedRaw = path.join(CACHE_DIR, `scene_${safeId}${suffixPart}_${legacyHash}.wav`);

  const forceRegen = process.argv.includes('--force');
  const repronounce = process.argv.includes('--repronounce');
  const fixUnclear = process.argv.includes('--fix-unclear');
  const verifyAsr = process.argv.includes('--verify-asr');

  let activeRaw = phoneticCachedRaw;
  let activeHash = phoneticHash;
  let cached = false;
  let modelUsed = lockedModelId;

  if (!forceRegen && fs.existsSync(phoneticCachedRaw) && fs.statSync(phoneticCachedRaw).size > 2000) {
    cached = true;
  } else if (!forceRegen && !repronounce && legacyHash !== phoneticHash && fs.existsSync(legacyCachedRaw) && fs.statSync(legacyCachedRaw).size > 2000) {
    activeRaw = legacyCachedRaw;
    activeHash = legacyHash;
    cached = true;
  } else {
    const gen = await generateRawFromGemini(sceneId, segSuffix, phoneticText, profile, idx, phoneticCachedRaw);
    modelUsed = gen.model;
  }

  unifyVocalTone(activeRaw, normOutWav, profile);
  let bestClarity = inspectVoClipClarity(decode(normOutWav, VOICE_SR), phoneticText, VOICE_SR, { role: profile.role });
  let bestAsr = null;
  if (verifyAsr && API_KEYS.length > 0) {
    try {
      bestAsr = await verifyClipWithGeminiASR(normOutWav, phoneticText, API_KEYS[idx % API_KEYS.length]);
    } catch (e) {
      console.warn(`  [ASR warn ${sceneId}${suffixPart}] ${e.message.slice(0, 120)}`);
    }
  }

  const needsHealing = (!cached || fixUnclear) && (bestClarity.status === 'FAIL' || (bestAsr && !bestAsr.pass));
  if (needsHealing && API_KEYS.length > 0) {
    let bestComposite = (bestAsr ? bestAsr.similarity * 50 : 0) + bestClarity.score;
    for (let retry = 1; retry <= 2; retry++) {
      const retryText = buildClearerRetryText(phoneticText, retry);
      const tmpRaw = path.join(CACHE_DIR, `retry_${safeId}${suffixPart}_${retry}.wav`);
      const tmpNorm = path.join(CACHE_DIR, `retry_norm_${safeId}${suffixPart}_${retry}.wav`);
      try {
        console.warn(`  [Clarity retry ${retry}/2 | ${sceneId}${suffixPart}] ${bestClarity.issues.map(x => x.code).join(',') || 'ASR_MISMATCH'} -> retrying with spaced phrasing`);
        const genR = await generateRawFromGemini(sceneId, segSuffix, retryText, profile, idx + retry, tmpRaw);
        unifyVocalTone(tmpRaw, tmpNorm, profile);
        const rClarity = inspectVoClipClarity(decode(tmpNorm, VOICE_SR), phoneticText, VOICE_SR, { role: profile.role });
        let rAsr = null;
        if (verifyAsr) {
          try {
            rAsr = await verifyClipWithGeminiASR(tmpNorm, phoneticText, API_KEYS[(idx + retry) % API_KEYS.length]);
          } catch (_) {}
        }
        const rComposite = (rAsr ? rAsr.similarity * 50 : 0) + rClarity.score;
        if (rComposite > bestComposite) {
          bestComposite = rComposite;
          bestClarity = rClarity;
          bestAsr = rAsr;
          modelUsed = genR.model;
          fs.copyFileSync(tmpRaw, phoneticCachedRaw);
          fs.copyFileSync(tmpNorm, normOutWav);
          activeHash = phoneticHash;
          cached = false;
        }
        if (bestClarity.status === 'PASS' && (!verifyAsr || (bestAsr && bestAsr.pass))) break;
      } finally {
        try { fs.unlinkSync(tmpRaw); } catch (_) {}
        try { fs.unlinkSync(tmpNorm); } catch (_) {}
      }
    }
  }

  return { cached, model: modelUsed, hash: activeHash, clarity: bestClarity, asr: bestAsr, phoneticText };
}

async function synthesizeScene(scene, idx) {
  const segments = parseSceneVoSegments(scene);
  if (segments.length === 0) return { normWav: null, cached: true, clarity: null, asr: null };

  const safeId = String(scene.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const normWav = path.join(AUDIO, `vo_gemini_${safeId}.wav`);

  const prepared = [];
  for (let si = 0; si < segments.length; si++) {
    const profile = resolveVoiceProfile(segments[si], scene);
    const rawSegText = segments[si].ttsVo || (segments.length === 1 && scene.ttsVo) || segments[si].text;
    const phoneticText = normalizeThaiForTTS(rawSegText, profile.role);
    if (phoneticText) prepared.push({ profile, rawSegText, phoneticText, si });
  }
  if (prepared.length === 0) return { normWav: null, cached: true, clarity: null, asr: null };

  if (prepared.length === 1) {
    const { profile, rawSegText } = prepared[0];
    const r = await synthesizeSegmentVerified(scene.id, '', rawSegText, profile, normWav, idx);
    applyTrailingSilenceToWav(normWav, TRAILING_SILENCE_MS, VOICE_SR);
    return { normWav, cached: r.cached, model: r.model, profile, clarity: r.clarity, asr: r.asr, phoneticText: r.phoneticText };
  }

  let allCached = true;
  let usedModel = lockedModelId;
  const segNormWavs = [];
  const segReports = [];
  for (let k = 0; k < prepared.length; k++) {
    const { profile, rawSegText, phoneticText, si } = prepared[k];
    const tmpSegNorm = path.join(CACHE_DIR, `norm_${safeId}_seg${si}_${hashSegmentKey(profile, phoneticText)}_${profile.preset}.wav`);
    const r = await synthesizeSegmentVerified(scene.id, String(si), rawSegText, profile, tmpSegNorm, idx + k);
    if (!r.cached) allCached = false;
    if (r.model) usedModel = r.model;
    segNormWavs.push(tmpSegNorm);
    segReports.push(r.clarity);
  }
  concatNormWavsWithGap(segNormWavs, normWav, 0.10, VOICE_SR);
  const fullExpected = prepared.map(p => p.phoneticText).join(' ');
  const combinedClarity = inspectVoClipClarity(decode(normWav, VOICE_SR), fullExpected, VOICE_SR);
  applyTrailingSilenceToWav(normWav, TRAILING_SILENCE_MS, VOICE_SR);
  return { normWav, cached: allCached, model: usedModel, segments: prepared.length, clarity: combinedClarity, segReports, phoneticText: fullExpected };
}

// Thai word-boundary subtitle slicer (<= 26 chars per cue for fast vertical readability)
function chunkSubs(text, maxLen = 24) {
  if (!text) return [];
  const clean = text.replace(/[‘’']/g, '').replace(/\.\.\./g, '… ').replace(/\s+/g, ' ').trim();
  const toks = clean.split(/\s+/).filter(Boolean);
  const out = [];
  let cur = '';
  const seg = new Intl.Segmenter('th', { granularity: 'word' });

  function pushToken(tk) {
    if (tk.length <= maxLen) {
      if (cur && (cur + ' ' + tk).length > maxLen) { out.push(cur); cur = tk; }
      else cur = cur ? cur + ' ' + tk : tk;
      return;
    }
    if (cur) { out.push(cur); cur = ''; }
    let chunk = '';
    for (const { segment } of seg.segment(tk)) {
      if (chunk && (chunk + segment).length > maxLen) { out.push(chunk); chunk = segment; }
      else chunk += segment;
    }
    if (chunk) cur = chunk;
  }

  for (const tk of toks) pushToken(tk);
  if (cur) out.push(cur);
  for (let i = out.length - 1; i > 0; i--) {
    if (out[i].length <= 6 && (out[i - 1] + ' ' + out[i]).length <= maxLen + 2) {
      out[i - 1] = out[i - 1] + ' ' + out[i];
      out.splice(i, 1);
    }
  }
  return out;
}

// ---------------------------------------------------------------- Procedural SFX & Beds
let seed = 1337;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const nz = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;
const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t / d);

function add(mix, t0, dur, fn) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx >= 0 && idx < mix.length) mix[idx] += fn(i / SR, i);
  }
}

const SFX = {
  ui_pop(m, t) { add(m, t, 0.45, x => 0.16 * env(x, 0.004, 0.09) * Math.sin(TAU * 1320 * x) + 0.1 * env(x, 0.004, 0.14) * Math.sin(TAU * 1980 * x)); },
  pop(m, t) { SFX.ui_pop(m, t); },
  tick(m, t) { add(m, t, 0.06, x => 0.07 * env(x, 0.001, 0.012) * Math.sin(TAU * 2400 * x)); },
  tap(m, t) { add(m, t, 0.05, x => 0.12 * env(x, 0.001, 0.008) * nz()); },
  step(m, t, amp = 0.12) { let lp = 0; add(m, t, 0.18, x => { lp += 0.25 * (nz() - lp); return amp * env(x, 0.002, 0.03) * (lp * 1.5 + 0.8 * Math.sin(TAU * 85 * x)); }); },
  steps(m, t, o = {}) { const gap = o.slow ? 0.9 : 0.55; for (let x = 0; x < (o.dur || 3.5); x += gap) SFX.step(m, t + x, o.slow ? 0.09 : 0.11); },
  squeak(m, t) { for (let k = 0; k < 2; k++) add(m, t + k * 0.55, 0.38, x => 0.05 * Math.sin(Math.PI * x / 0.38) * Math.sin(TAU * (1750 + 420 * Math.sin(TAU * 6.5 * x)) * x)); },
  mop(m, t) { let lp = 0, prev = 0; add(m, t, 0.9, x => { lp += 0.18 * (nz() - lp); const hp = lp - prev; prev = lp; return 0.5 * Math.sin(Math.PI * x / 0.9) ** 2 * hp; }); },
  thunk(m, t, amp = 0.35) { add(m, t, 0.7, x => amp * env(x, 0.002, 0.14) * (Math.sin(TAU * (60 - 20 * x) * x) + (x < 0.01 ? nz() : 0))); },
  rumble(m, t, o = {}) { const D = o.soft ? 2.6 : 4.2, A = o.soft ? 0.16 : 0.32; let b = 0; add(m, t, D, x => { b = 0.985 * b + 0.06 * nz(); return A * Math.sin(Math.PI * x / D) ** 0.7 * (b * 2.2 + 0.6 * Math.sin(TAU * 32 * x)); }); },
  blackout(m, t) { for (let k = 0; k < 4; k++) SFX.thunk(m, t + k * 0.38, 0.38 - k * 0.05); },
  flicker(m, t) { add(m, t, 0.7, x => (Math.sin(TAU * 11 * x) > 0.3 ? 1 : 0) * (0.03 * Math.sin(TAU * 120 * x) + (rnd() < 0.02 ? 0.12 * nz() : 0))); },
  boom(m, t) { let lp = 0; add(m, t, 2.4, x => { lp += 0.05 * (nz() - lp); return 0.45 * env(x, 0.005, 0.7) * (Math.sin(TAU * (48 - 14 * x) * x) + lp * 1.2); }); },
  sting(m, t) { add(m, t, 2.2, x => 0.06 * env(x, 0.01, 0.6) * (Math.sin(TAU * 880 * x) + Math.sin(TAU * 932 * x))); SFX.thunk(m, t, 0.25); },
  heartbeat(m, t) { for (let k = 0; k < 4; k++) { const b = t + k * 0.9; add(m, b, 0.16, x => 0.3 * Math.sin(Math.PI * x / 0.16) * Math.sin(TAU * 52 * x)); add(m, b + 0.22, 0.14, x => 0.2 * Math.sin(Math.PI * x / 0.14) * Math.sin(TAU * 46 * x)); } },
  tape(m, t) { let prev = 0; add(m, t, 0.55, x => { const n = nz(), hp = n - prev; prev = n; return 0.11 * Math.sin(Math.PI * x / 0.55) * hp; }); },
  marker(m, t) { for (let k = 0; k < 3; k++) add(m, t + k * 0.22, 0.16, x => 0.04 * Math.sin(Math.PI * x / 0.16) * (Math.sin(TAU * (2900 + 300 * k) * x) * 0.5 + nz() * 0.5)); },
  chapter(m, t) { add(m, t + 0.2, 1.4, x => 0.07 * env(x, 0.01, 0.4) * (Math.sin(TAU * 523 * x) + 0.5 * Math.sin(TAU * 784 * x))); },
  alert(m, t) { for (let k = 0; k < 2; k++) { add(m, t + k * 0.32, 0.14, x => 0.07 * Math.sin(TAU * 880 * x)); add(m, t + k * 0.32 + 0.15, 0.14, x => 0.07 * Math.sin(TAU * 660 * x)); } },
  poweroff(m, t) { add(m, t, 0.45, x => 0.06 * (1 - x / 0.45) * Math.sin(TAU * (800 - 1300 * x) * x)); },
  door(m, t) { SFX.thunk(m, t, 0.38); },
  creak(m, t) { add(m, t, 1.2, x => 0.08 * Math.sin(Math.PI * x / 1.2) * Math.sin(TAU * (190 + 35 * Math.sin(TAU * 6 * x)) * x)); },
  wind_gust(m, t) { let lp = 0; add(m, t, 2.2, x => { lp += 0.04 * (nz() - lp); return 0.28 * Math.sin(Math.PI * x / 2.2) ** 1.5 * lp; }); },
  water_lap(m, t) { let lp = 0; add(m, t, 1.0, x => { lp += 0.12 * (nz() - lp); return 0.18 * env(x, 0.01, 0.2) * lp; }); },
  ice_crack(m, t) { for (let k = 0; k < 5; k++) add(m, t + k * 0.06, 0.05, x => 0.18 * env(x, 0.001, 0.01) * (nz() + Math.sin(TAU * 2400 * x))); },
  ...(episode.CUSTOM_SFX || {})
};

function bed(m, kind, t0, t1) {
  if (episode.CUSTOM_BEDS && typeof episode.CUSTOM_BEDS[kind] === 'function') {
    episode.CUSTOM_BEDS[kind](m, t0, t1, { SR, add, nz, env, TAU });
    return;
  }
  const F = 0.4;
  const leadF = t0 > 0 ? Math.min(F, t0) : 0;
  const start = t0 - leadF;
  const totalDur = (t1 - start) + F;
  let b = 0, lp = 0;
  add(m, start, totalDur, x => {
    const fadeIn = leadF > 0 ? x / leadF : x / F;
    const fadeOut = (totalDur - x) / F;
    const g = Math.min(1, fadeIn, fadeOut);
    const abs = start + x;
    if (kind === 'hum') {
      lp += 0.02 * (nz() - lp);
      return g * (0.016 * Math.sin(TAU * 100 * abs) + 0.008 * Math.sin(TAU * 200 * abs) + 0.025 * lp);
    }
    if (kind === 'dark' || kind === 'tense_pulse') {
      b = 0.995 * b + 0.02 * nz();
      return g * (0.042 * Math.sin(TAU * 43 * abs) + 0.028 * Math.sin(TAU * 45.5 * abs) + 0.2 * b);
    }
    if (kind === 'wind' || kind === 'freeze') {
      lp += 0.03 * (nz() - lp);
      return g * (0.06 * lp * (0.65 + 0.35 * Math.sin(TAU * 0.28 * abs)) + 0.012 * Math.sin(TAU * 68 * abs));
    }
    if (kind === 'water' || kind === 'pier_waves') {
      lp += 0.02 * (nz() - lp);
      return g * (0.05 * (0.55 + 0.45 * Math.sin(TAU * 0.16 * abs) ** 2) * lp + 0.012 * Math.sin(TAU * 54 * abs));
    }
    if (kind === 'parking' || kind === 'interior_hush' || kind === 'silence_room') {
      b = 0.99 * b + 0.025 * nz();
      return g * (0.16 * b + 0.008 * Math.sin(TAU * 58 * abs));
    }
    return 0;
  });
}

function writeWav(file, pcm, sampleRate = SR) {
  const buf = Buffer.alloc(44 + pcm.length * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + pcm.length * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(pcm.length * 4, 40);
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.max(-1, Math.min(1, pcm[i])) * 32767 | 0;
    buf.writeInt16LE(v, 44 + i * 4); buf.writeInt16LE(v, 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

const AMBIENT_CUES = new Set(['steps', 'mop', 'rumble', 'wind_gust', 'water_lap', 'heartbeat']);

async function auditExistingProject() {
  const verifyAsr = process.argv.includes('--verify-asr');
  const entries = [];
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    const cleanExpected = stripVoMarkupForSubs(s);
    if (!cleanExpected.trim()) continue;
    const safeId = String(s.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const normWav = path.join(AUDIO, `vo_gemini_${safeId}.wav`);
    const profile = resolveVoiceProfile({}, s);
    const phoneticText = normalizeThaiForTTS(s.ttsVo || cleanExpected, profile.role);
    const legacyText = sanitizeVoForTTS(s.ttsVo || cleanExpected, profile.role);

    let wavToInspect = null;
    let tmpWav = null;
    if (fs.existsSync(normWav) && fs.statSync(normWav).size > 2000) {
      wavToInspect = normWav;
    } else {
      const pCand = path.join(CACHE_DIR, `scene_${safeId}_${hashSegmentKey(profile, phoneticText)}.wav`);
      const lCand = path.join(CACHE_DIR, `scene_${safeId}_${hashSegmentKey(profile, legacyText)}.wav`);
      const foundRaw = fs.existsSync(pCand) ? pCand : (fs.existsSync(lCand) ? lCand : null);
      if (foundRaw) {
        tmpWav = path.join(CACHE_DIR, `audit_tmp_${safeId}.wav`);
        unifyVocalTone(foundRaw, tmpWav, profile);
        wavToInspect = tmpWav;
      }
    }

    if (!wavToInspect) {
      entries.push({
        id: s.id,
        status: 'MISSING_AUDIO',
        score: 0,
        issues: [{ code: 'MISSING_AUDIO', detail: 'No synthesized VO file found to audit' }]
      });
      continue;
    }

    const clarity = inspectVoClipClarity(decode(wavToInspect, VOICE_SR), phoneticText, VOICE_SR, { role: profile.role });
    let asr = null;
    if (verifyAsr && API_KEYS.length > 0) {
      try {
        asr = await verifyClipWithGeminiASR(wavToInspect, phoneticText, API_KEYS[i % API_KEYS.length]);
      } catch (e) {
        console.warn(`  [ASR warn ${s.id}] ${e.message.slice(0, 120)}`);
      }
    }
    if (tmpWav) {
      try { fs.unlinkSync(tmpWav); } catch (_) {}
    }
    const status = (asr && !asr.pass && clarity.status === 'PASS') ? 'WARN' : clarity.status;
    entries.push({ id: s.id, role: profile.role, voice: profile.voice, status, clarity, asr });
  }
  return writePronunciationReport(entries);
}

function writePronunciationReport(entries) {
  const valid = entries.filter(e => e && e.clarity);
  const passCount = entries.filter(e => e.status === 'PASS').length;
  const warnCount = entries.filter(e => e.status === 'WARN').length;
  const failCount = entries.filter(e => e.status === 'FAIL' || e.status === 'MISSING_AUDIO').length;
  const avgScore = valid.length > 0
    ? +(valid.reduce((s, e) => s + e.clarity.score, 0) / valid.length).toFixed(1)
    : 100;

  const report = {
    generatedAt: new Date().toISOString(),
    title: TITLE,
    targetLufs: TARGET_LUFS,
    summary: {
      totalAudited: entries.length,
      pass: passCount,
      warn: warnCount,
      fail: failCount,
      avgScore
    },
    scenes: entries
  };
  const reportPath = path.join(AUDIO, 'pronunciation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`🗣️ Pronunciation & Clarity Audit: ${passCount}/${entries.length} PASS (warn: ${warnCount}, fail: ${failCount}, avg score ${avgScore}/100) -> audio/pronunciation_report.json`);
  for (const e of entries) {
    if (e.status === 'FAIL' || e.status === 'WARN') {
      const codes = (e.clarity?.issues || []).map(x => `${x.code}: ${x.detail}`).join('; ');
      console.log(`   [${e.status}] ${e.id}: ${codes}${e.asr ? ` | ASR sim=${e.asr.similarity}` : ''}`);
    }
  }
  return report;
}

async function main() {
  if (process.argv.includes('--audit-only')) {
    console.log(`=== Pronunciation & Clarity Audit Only: "${TITLE}" — ${SCENES.length} scenes ===`);
    await auditExistingProject();
    return;
  }

  console.log(`=== Audio Pipeline: "${TITLE}" — ${SCENES.length} scenes (Voice: ${VOICE_NAME}, Mode: ${NARRATIVE_MODE}/${HUD_MODE}, TailPad: ${TRAILING_SILENCE_MS}ms) ===`);
  const voPcm = new Array(SCENES.length);
  const voActiveDur = new Array(SCENES.length).fill(0);
  const results = new Array(SCENES.length);
  const concurrency = Math.max(1, Math.min(API_KEYS.length || 1, 3));
  let nextIdx = 0;

  function loadSceneVoPcm(normWav) {
    if (!normWav) return { pcm: new Float32Array(0), activeDur: 0 };
    const active = trim(decode(normWav));
    const activeDur = active.length / SR;
    return { pcm: appendTrailingSilence(active, TRAILING_SILENCE_MS, SR), activeDur };
  }

  while (nextIdx < SCENES.length) {
    const i = nextIdx++;
    const s = SCENES[i];
    const r = await synthesizeScene(s, i);
    results[i] = r;
    const clarityTag = r.clarity ? ` | clarity ${r.clarity.score}/100 (${r.clarity.status})` : '';
    console.log(`[${i + 1}/${SCENES.length}] ${s.id} ${r.cached ? '(cache)' : `(generated ${r.model}, locked)`}${clarityTag}`);
    const loaded = loadSceneVoPcm(r.normWav);
    voPcm[i] = loaded.pcm;
    voActiveDur[i] = loaded.activeDur;
    if (!r.cached) {
      await new Promise(res => setTimeout(res, 600));
      break;
    }
  }
  if (!lockedModelId) lockedModelId = TTS_MODELS[0].id;

  async function worker() {
    while (true) {
      const i = nextIdx++;
      if (i >= SCENES.length) return;
      const s = SCENES[i];
      const r = await synthesizeScene(s, i);
      results[i] = r;
      const clarityTag = r.clarity ? ` | clarity ${r.clarity.score}/100 (${r.clarity.status})` : '';
      console.log(`[${i + 1}/${SCENES.length}] ${s.id} ${r.cached ? '(cache)' : `(generated ${r.model})`}${clarityTag}`);
      const loaded = loadSceneVoPcm(r.normWav);
      voPcm[i] = loaded.pcm;
      voActiveDur[i] = loaded.activeDur;
      if (!r.cached) await new Promise(res => setTimeout(res, 800));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  // Optional: synthesize 3-4s Related Video Bridge CTA voiceover for Cliffhanger Shorts
  const bridgeCtaVo = String(episode.SHORTS_BRIDGE_CTA_VO || episode.shortsBridgeCtaVo || '').trim();
  let bridgeCtaAudioFile = null;
  if (bridgeCtaVo) {
    try {
      const ctaWav = path.join(AUDIO, 'shorts_bridge_cta.wav');
      const narratorProfile = resolveVoiceProfile({ role: 'narrator' }, {});
      await synthesizeSegmentVerified('shorts_bridge_cta', '', bridgeCtaVo, narratorProfile, ctaWav, SCENES.length + 1);
      applyTrailingSilenceToWav(ctaWav, TRAILING_SILENCE_MS, VOICE_SR);
      bridgeCtaAudioFile = 'audio/shorts_bridge_cta.wav';
      console.log(`✓ Synthesized Shorts Bridge CTA VO -> ${bridgeCtaAudioFile}`);
    } catch (e) {
      console.warn(`  [Shorts Bridge CTA VO warn] ${e.message.slice(0, 140)}`);
    }
  }

  const reportEntries = [];
  SCENES.forEach((s, i) => {
    const r = results[i];
    if (!r || !r.normWav || !r.clarity) return;
    const status = (r.asr && !r.asr.pass && r.clarity.status === 'PASS') ? 'WARN' : r.clarity.status;
    reportEntries.push({
      id: s.id,
      role: r.profile?.role || (r.segments > 1 ? 'mixed' : 'narrator'),
      voice: r.profile?.voice || VOICE_NAME,
      status,
      clarity: r.clarity,
      asr: r.asr || null
    });
  });
  writePronunciationReport(reportEntries);

  let t = 0;
  let prevAct = null;
  const tailSilenceSec = TRAILING_SILENCE_MS / 1000;
  const timeline = SCENES.map((s, i) => {
    const lead = getSceneLead(s, i, prevAct);
    prevAct = s.act != null ? s.act : prevAct;
    const voDur = voActiveDur[i];
    const reqPad = s.pad !== undefined ? Number(s.pad) : DEFAULT_PAD;
    const effectivePad = voDur > 0 ? Math.max(reqPad, tailSilenceSec) : reqPad;
    const dur = (voDur > 0 ? lead + voDur : 0) + effectivePad;
    const cleanVo = stripVoMarkupForSubs(s);
    const chunks = chunkSubs(cleanVo);
    const totalChars = chunks.reduce((a, c) => a + c.length, 0) || 1;
    let acc = 0;
    const subs = chunks.map((c, ci) => {
      const a = (ci === 0 && lead <= 0.08) ? 0.0 : (lead + voDur * acc / totalChars);
      acc += c.length;
      const b = lead + voDur * acc / totalChars;
      return { t0: +a.toFixed(3), t1: +(b + 0.14).toFixed(3), text: c };
    });
    const entry = {
      ...s,
      narration: cleanVo,
      vo: cleanVo,
      start: +t.toFixed(3),
      dur: +dur.toFixed(3),
      voStart: lead,
      voDur: +voDur.toFixed(3),
      trailingSilenceMs: voDur > 0 ? TRAILING_SILENCE_MS : 0,
      subs
    };
    t += dur;
    return entry;
  });

  const totalSec = t;
  console.log(`Timeline total = ${totalSec.toFixed(2)}s (~${(totalSec / 60).toFixed(2)} min)`);

  const mix = new Float32Array(Math.ceil((totalSec + 0.5) * SR));
  const bedMix = new Float32Array(mix.length);
  const impactSfxMix = new Float32Array(mix.length);
  timeline.forEach((s, i) => {
    const lead = s.voStart !== undefined ? s.voStart : LEAD;
    const s0 = Math.floor((s.start + lead) * SR);
    const v = voPcm[i];
    for (let k = 0; k < v.length && s0 + k < mix.length; k++) mix[s0 + k] += v[k];
    if (s.bed && s.bed !== 'none') bed(bedMix, s.bed, s.start, s.start + s.dur);
    for (const cue of s.sfx || []) {
      const key = cue.type || cue.k;
      const at = cue.at !== undefined ? cue.at : (cue.t || 0);
      const fn = SFX[key];
      const targetMix = AMBIENT_CUES.has(key) ? bedMix : impactSfxMix;
      if (fn) fn(targetMix, s.start + at, cue, { SR, add, nz, env, TAU, rnd });
      else console.warn('Unknown SFX cue:', key);
    }
  });

  // Dual-bus sidechain ducking: duck beds/continuous cues up to 42%, keep impact SFX punchy (<= 10% duck)
  let envF = 0;
  for (let i = 0; i < mix.length; i++) {
    envF = Math.max(Math.abs(mix[i]), envF * 0.9995);
    const bedDuck = 1 - Math.min(0.42, envF * 0.55);
    const impactDuck = 1 - Math.min(0.10, envF * 0.14);
    mix[i] = Math.tanh((mix[i] + bedMix[i] * bedDuck + impactSfxMix[i] * impactDuck) * 1.04) * 0.95;
  }

  const rawMaster = path.join(AUDIO, 'master_raw.wav');
  const finalMaster = path.join(AUDIO, 'master.wav');
  writeWav(rawMaster, mix);
  execFileSync(ffmpeg, [
    '-y', '-v', 'error', '-i', rawMaster,
    '-af', 'highpass=f=40,equalizer=f=180:t=q:w=1.0:g=0.8,equalizer=f=3500:t=q:w=1.2:g=-0.8,acompressor=threshold=-18dB:ratio=2.5:attack=15:release=120:makeup=1.5,loudnorm=I=-18.0:LRA=6.0:TP=-1.5',
    '-ar', '44100', '-ac', '2', finalMaster
  ]);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', finalMaster, '-c:a', 'libmp3lame', '-b:a', '192k', path.join(AUDIO, 'master.mp3')]);
  try { fs.unlinkSync(rawMaster); } catch (_) {}

  const data = {
    title: TITLE,
    subtitle: SUBTITLE,
    narrativeMode: NARRATIVE_MODE,
    hudMode: HUD_MODE,
    trailingSilenceMs: TRAILING_SILENCE_MS,
    ...(bridgeCtaAudioFile ? { shortsBridgeCtaAudio: bridgeCtaAudioFile } : {}),
    ...(bridgeCtaVo ? { shortsBridgeCtaVo: bridgeCtaVo } : {}),
    total: +totalSec.toFixed(3),
    scenes: timeline
  };
  fs.writeFileSync(path.join(__dirname, 'timeline.json'), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(__dirname, 'timeline.js'), 'window.TIMELINE = ' + JSON.stringify(data) + ';\n');
  console.log('✅ Wrote audio/master.wav, audio/master.mp3, timeline.json, timeline.js');
}

if (require.main === module) {
  main().catch(e => { console.error('FATAL:', e); process.exit(1); });
}

module.exports = {
  VOICE_NAME,
  UNIFIED_STYLE,
  NARRATOR_STYLE,
  HUD_MODE,
  NARRATIVE_MODE,
  TRAILING_SILENCE_MS,
  DEFAULT_CHARACTER_VOICES,
  DEFAULT_PRONUNCIATION_MAP,
  PRONUNCIATION_MAP,
  loadPronunciationMap,
  applyPronunciationEntry,
  applyPronunciationMap,
  getSceneRawText,
  getCharacterVoiceMap,
  resolveVoiceProfile,
  sanitizeVoForTTS,
  intToThaiWords,
  numberToThaiWords,
  normalizeThaiForTTS,
  buildClearerRetryText,
  thaiTextSimilarity,
  appendTrailingSilence,
  measureTrailingSilenceMs,
  applyTrailingSilenceToWav,
  inspectVoClipClarity,
  verifyClipWithGeminiASR,
  stripInlineMarkup,
  stripVoMarkupForSubs,
  parseSceneVoSegments,
  unifyVocalTone,
  chunkSubs
};
