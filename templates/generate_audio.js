// =============================================================================
//  generate_audio.js — Complete Real Lens Audio & Subtitle Pipeline
//  Part of skill: reallens-horror-animator
//  Features:
//    - Reads GEMINI_API_KEYS or GEMINI_API_KEY from env / local .env (NO hardcoded keys!)
//    - Gemini Interactions TTS Priority:
//        1. gemini-3.8-flash-tts (Puck + speech_metadata)
//        2. gemini-3.8-flash-lite-tts (Puck + speech_metadata)
//        3. gemini-3.1-flash-tts-preview (Puck, NO speech_metadata)
//    - SHA-256 disk audio cache (audio/cache/scene_<id>_<hash>.wav)
//    - Auto RIFF WAV header detection & wrapping
//    - Thai word-boundary subtitle chunking via Intl.Segmenter('th') (<= 36 chars, {t0, t1, text})
//    - Modular procedural SFX + ambient beds + 35% sidechain voiceover ducking
//    - EBU R128 Broadcast Mastering (-18.0 LUFS) -> audio/master.wav + audio/master.mp3
//    - Writes timeline.json & timeline.js
// =============================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const episode = require('./episode');

const { SCENES, TITLE, SUBTITLE } = episode;
const SR = 44100;
const LEAD = 0.35;
const AUDIO = path.join(__dirname, 'audio');
const CACHE_DIR = path.join(AUDIO, 'cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

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
  { id: 'gemini-3.1-flash-tts-preview', supportsStyle: false }
];
const VOICE_NAME = 'Puck';
const UNIFIED_STYLE = 'calm, composed, deadpan male survival-horror documentary narrator in Thai, steady pace, low and even pitch, quiet suspense';

function decode(file) {
  const buf = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), 'pipe:1'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function trim(pcm) {
  const th = 0.008;
  let a = 0, b = pcm.length - 1;
  while (a < b && Math.abs(pcm[a]) < th) a++;
  while (b > a && Math.abs(pcm[b]) < th) b--;
  a = Math.max(0, a - Math.floor(0.03 * SR));
  b = Math.min(pcm.length - 1, b + Math.floor(0.08 * SR));
  return pcm.slice(a, b);
}

function unifyVocalTone(rawWav, normWav) {
  const af = [
    'atempo=1.12',
    'highpass=f=80',
    'lowpass=f=12000',
    'equalizer=f=180:t=q:w=1.2:g=1.2',
    'equalizer=f=3500:t=q:w=1.2:g=-1.0',
    'acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120:makeup=2',
    'loudnorm=I=-18.0:LRA=5.0:TP=-1.5'
  ].join(',');
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', rawWav, '-af', af, '-ar', '24000', '-ac', '1', normWav]);
}

function ensureWavHeader(buf, sampleRate = 24000) {
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'RIFF') return buf;
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  return Buffer.concat([h, buf]);
}

async function callGeminiInteractionsTTS(text, modelCfg, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;
  const contentObj = { type: 'text', text };
  if (modelCfg.supportsStyle) {
    contentObj.annotations = [{ type: 'speech_metadata', style: UNIFIED_STYLE }];
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelCfg.id,
      input: [{ type: 'user_input', content: [contentObj] }],
      response_format: { type: 'audio', mime_type: 'audio/wav', sample_rate: 24000 },
      generation_config: { speech_config: [{ voice: VOICE_NAME }] }
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
  return ensureWavHeader(Buffer.from(b64, 'base64'), 24000);
}

async function synthesizeScene(scene, idx) {
  if (!scene.vo || !scene.vo.trim()) return { normWav: null, cached: true };
  const hash = crypto.createHash('sha256').update(scene.vo.trim()).digest('hex').slice(0, 16);
  const safeId = String(scene.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const cachedRaw = path.join(CACHE_DIR, `scene_${safeId}_${hash}.wav`);
  const normWav = path.join(AUDIO, `vo_gemini_${safeId}.wav`);

  if (fs.existsSync(cachedRaw) && fs.statSync(cachedRaw).size > 2000 && !process.argv.includes('--force')) {
    unifyVocalTone(cachedRaw, normWav);
    return { normWav, cached: true };
  }

  if (API_KEYS.length === 0) {
    throw new Error('Missing GEMINI_API_KEY or GEMINI_API_KEYS environment variable (or .env file).');
  }

  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    for (const modelCfg of TTS_MODELS) {
      for (let k = 0; k < API_KEYS.length; k++) {
        const ki = (idx + k) % API_KEYS.length;
        try {
          console.log(`  [TTS ${scene.id}] ${modelCfg.id} (key #${ki + 1}, attempt ${attempt})...`);
          const wavBuf = await callGeminiInteractionsTTS(scene.vo, modelCfg, API_KEYS[ki]);
          fs.writeFileSync(cachedRaw, wavBuf);
          unifyVocalTone(cachedRaw, normWav);
          return { normWav, cached: false, model: modelCfg.id };
        } catch (e) {
          lastErr = e;
          console.warn(`  [TTS warn] ${e.message.slice(0, 160)}`);
          if (e.status === 429) await new Promise(r => setTimeout(r, 5500));
        }
      }
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  throw lastErr || new Error(`Failed to synthesize TTS for scene ${scene.id}`);
}

// Thai word-boundary subtitle slicer (<= 36 chars per cue)
function chunkSubs(text, maxLen = 34) {
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
    if (out[i].length <= 6 && (out[i - 1] + ' ' + out[i]).length <= 36) {
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

(async () => {
  console.log(`=== Audio Pipeline: "${TITLE}" — ${SCENES.length} scenes (Voice: ${VOICE_NAME}) ===`);
  const voPcm = [];
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    const r = await synthesizeScene(s, i);
    console.log(`[${i + 1}/${SCENES.length}] ${s.id} ${r.cached ? '(cache)' : `(generated ${r.model})`}`);
    voPcm.push(r.normWav ? trim(decode(r.normWav)) : new Float32Array(0));
    if (!r.cached) await new Promise(res => setTimeout(res, 1500));
  }

  let t = 0;
  const timeline = SCENES.map((s, i) => {
    const voDur = voPcm[i].length / SR;
    const pad = s.pad !== undefined ? s.pad : 0.5;
    const dur = (voDur > 0 ? LEAD + voDur : 0) + pad;
    const chunks = chunkSubs(s.vo);
    const totalChars = chunks.reduce((a, c) => a + c.length, 0) || 1;
    let acc = 0;
    const subs = chunks.map(c => {
      const a = LEAD + voDur * acc / totalChars; acc += c.length;
      const b = LEAD + voDur * acc / totalChars;
      return { t0: +a.toFixed(3), t1: +(b + 0.14).toFixed(3), text: c };
    });
    const entry = { ...s, start: +t.toFixed(3), dur: +dur.toFixed(3), voStart: LEAD, voDur: +voDur.toFixed(3), subs };
    t += dur;
    return entry;
  });

  const totalSec = t;
  console.log(`Timeline total = ${totalSec.toFixed(2)}s (~${(totalSec / 60).toFixed(2)} min)`);

  const mix = new Float32Array(Math.ceil((totalSec + 0.5) * SR));
  const sfxMix = new Float32Array(mix.length);
  timeline.forEach((s, i) => {
    const s0 = Math.floor((s.start + LEAD) * SR);
    const v = voPcm[i];
    for (let k = 0; k < v.length && s0 + k < mix.length; k++) mix[s0 + k] += v[k];
    if (s.bed && s.bed !== 'none') bed(sfxMix, s.bed, s.start, s.start + s.dur);
    for (const cue of s.sfx || []) {
      const key = cue.type || cue.k;
      const at = cue.at !== undefined ? cue.at : (cue.t || 0);
      const fn = SFX[key];
      if (fn) fn(sfxMix, s.start + at, cue, { SR, add, nz, env, TAU, rnd });
      else console.warn('Unknown SFX cue:', key);
    }
  });

  // Sidechain ducking (35% ducking under speech)
  let envF = 0;
  for (let i = 0; i < mix.length; i++) {
    envF = Math.max(Math.abs(mix[i]), envF * 0.9995);
    const duck = 1 - Math.min(0.35, envF * 0.45);
    mix[i] = Math.tanh((mix[i] + sfxMix[i] * 1.0 * duck) * 1.04) * 0.95;
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

  const data = { title: TITLE, subtitle: SUBTITLE, total: +totalSec.toFixed(3), scenes: timeline };
  fs.writeFileSync(path.join(__dirname, 'timeline.json'), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(__dirname, 'timeline.js'), 'window.TIMELINE = ' + JSON.stringify(data) + ';\n');
  console.log('✅ Wrote audio/master.wav, audio/master.mp3, timeline.json, timeline.js');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
