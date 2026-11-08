# Programmatic Animation Pipeline & Tooling Guide

This guide explains how an AI Agent builds, voices, masters, and renders **Real Lens** and **Rules of Survival / Liminal Space** style 2.5D animations end-to-end using Node.js, HTML5 Canvas, **HyperFrames (`heygen-com/hyperframes`)**, Gemini Interactions TTS, Puppeteer, and FFmpeg.

---

## 1. Standard Project File Layout & Tooling Stack

Install local dependencies once (`puppeteer-core`, `ffmpeg-static`, `ffprobe-static`, `@fontsource/kanit`):

| File / Layer | Role in Production Pipeline |
| :--- | :--- |
| `episode.js` | Structured array of scenes (`id`, `view`, `vo` Thai narration, `pad`, `bed` ambience type, `sfx` timestamped cues, HUD metadata). |
| `core.js` | Reusable 2.5D cylindrical character rigs (Protagonist "ต้น", Entity "ภารโรงไร้หน้า"), procedural shaders (wet tile shine, fluorescent flicker, horror vignette), camera rack-focus blur helpers, and Cream/Slate HUD card renderers. |
| `views.js` | Scene-specific Canvas2D painters mapped by `scene.view` (e.g., `parkingB2`, `liminalMall`, `fountainSquare`, `supermarket`, `fittingRoom`, `darknessSneak`, `outroCard`). |
| `generate_audio.js` | Synthesizes unified Thai voiceover (**`gemini-3.8-flash-tts` 1st priority**), normalizes to `-18 LUFS`, mixes procedural SFX/ambience, and outputs `audio/master.wav`, `audio/master.mp3`, `timeline.json`, and `timeline.js`. |
| `index.html` | **HyperFrames-compliant** HTML5 Canvas composition (`1280x720` or `1920x1080`) exposing `window.__timelines['main']`, `hf-seek` listener, and `window.renderAtTime(sec)`. |
| `sync_hyperframes.js` | Synchronizes `timeline.json` total duration + scene `.clip` beat markers (`<= 3` per track lane) into `index.html`, and copies `Kanit` `.woff2` fonts into `assets/fonts/` for offline/Docker/HyperFrames lint compliance. |
| `hf.js` | Cross-platform Node wrapper around `npx hyperframes` that automatically injects `ffmpeg-static` and `ffprobe-static` into `process.env.PATH`. |
| `render_mp4.js` | Steps headless Chrome in frame batches (`24` or `30` FPS) and pipes JPEG frames into `ffmpeg -f image2pipe` with `audio/master.wav` (can be used alongside or interchangeably with `node hf.js render`). |
| `generate_thumbnail.js` | Renders `1920x1080` YouTube thumbnails (Showdown Split + 5-Panel Strip). |
| `generate_shorts_overlays.js` / `render_all_shorts.js` / `generate_scene_covers.js` | Cuts the master MP4 into `1080x1920` (`9:16`) Shorts episodes (`EP 1–5`) with HUD overlays and scene-based vertical covers (see [Shorts & Thumbnails Guide](./shorts-and-thumbnails.md)). |

---

## 2. Unified Voiceover & Sound Design (`gemini-3.8-flash-tts` First Priority)

### 2.1 Critical Rules Learned in Production
1. **Always Try `gemini-3.8-flash-tts` First:** Use the modern **Gemini Interactions API** (`POST https://generativelanguage.googleapis.com/v1beta/interactions`) with `model: 'gemini-3.8-flash-tts'`, `voice: 'Puck'`, and `speech_metadata` style instructions.
2. **Never Mix TTS Engines Mid-Video:** Every scene (`01`..`N`) in an episode MUST use the same vocal persona (`Puck`). If `gemini-3.8-flash-tts` hits a daily Free Tier cap (`HTTP 429`), cascade only to other Gemini TTS models with `voice: 'Puck'`:
   - `gemini-3.8-flash-tts` *(1st priority — supports `speech_metadata`)*
   - `gemini-3.8-flash-lite-tts` *(2nd priority — supports `speech_metadata`)*
   - `gemini-3.1-flash-tts-preview` *(3rd priority — **must omit** `annotations` / `speech_metadata` or the API returns `HTTP 400: Speech metadata is not supported for this model`)*
3. **Multi-Project API Key Rotation & Error Diagnosis:**
   - **Free Tier (`10 RPD` / `3 RPM` per Google Cloud Project):** Multiple keys created inside the *same* project share the same 10 RPD quota. For 25 scenes on Free Tier, pass 3 API keys created via **"Create API key in new project"** (`Project-1`, `Project-2`, `Project-3`) and pace calls by `5–6s`.
   - **`HTTP 402 Payment Required`:** Prepay billing project has `$0.00` available credits (`Your prepayment credits are depleted` — top up at `https://ai.studio/projects`).
   - **`HTTP 403 Permission Denied`:** Billing account has an unpaid balance (`Make a payment at https://aistudio.google.com/billing`).

| HTTP Status | Error Message / Cause | Immediate Action / Fix |
| :--- | :--- | :--- |
| **`HTTP 400`** | `Speech metadata is not supported for this model` | Only `gemini-3.8-flash-tts` and `3.8-flash-lite-tts` support `speech_metadata`. For `3.1-flash-tts-preview`, omit `annotations` completely. |
| **`HTTP 400`** | `Unknown parameter 'voice'` | Place `{ voice: 'Puck' }` inside `generation_config: { speech_config: [{ voice: 'Puck' }] }`, never at the top level. |
| **`HTTP 402`** | `Your prepayment credits are depleted` | Project has Prepay billing with `$0.00` balance. Switch to clean Free Tier project keys or top up balance. |
| **`HTTP 403`** | `Billing account has an outstanding balance` | Cloud Billing account has an unpaid invoice. Switch to independent Free Tier project keys. |
| **`HTTP 429`** | `Resource Exhausted / Rate limit` | Google Cloud Project hit the 10 RPD / 3 RPM limit. Sibling keys in the *same* project will fail. Must use keys from **"Create API key in new project"**. |

4. **RIFF Header vs. Raw PCM (`audio/l16`) Auto-Detection:**
   - Unary `gemini-3.8-flash-tts` returns `audio/wav` (`RIFF` header included) in `json.output_audio.data`, whereas `steps[].content[]` or `3.1-flash-tts-preview` may return raw 16-bit mono `24 kHz` PCM (`audio/l16`). Always check `buf.slice(0, 4).toString('ascii') === 'RIFF'` before wrapping with a 44-byte WAV header.

### 2.2 Reference `callGeminiTTS` + EBU R128 Mastering Snippet

```javascript
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const TTS_MODELS = [
  { id: 'gemini-3.8-flash-tts', supportsStyle: true },       // 1ST PRIORITY (ALWAYS TRY FIRST)
  { id: 'gemini-3.8-flash-lite-tts', supportsStyle: true },  // 2ND PRIORITY
  { id: 'gemini-3.1-flash-tts-preview', supportsStyle: false } // 3RD PRIORITY (omit speech_metadata)
];

const VOICE_NAME = 'Puck';
const UNIFIED_STYLE = 'calm, composed, deadpan male survival-horror documentary narrator in Thai, steady pace, low and even pitch, quiet suspense';

function ensureWavHeader(buf, sampleRate = 24000) {
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'RIFF') return buf;
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  return Buffer.concat([h, buf]);
}

async function synthesizeSceneGemini(text, apiKeys, preferredKeyIdx = 0) {
  let lastErr;
  for (const modelCfg of TTS_MODELS) {
    for (let k = 0; k < apiKeys.length; k++) {
      const apiKey = apiKeys[(preferredKeyIdx + k) % apiKeys.length];
      const contentObj = { type: 'text', text };
      if (modelCfg.supportsStyle) {
        contentObj.annotations = [{ type: 'speech_metadata', style: UNIFIED_STYLE }];
      }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelCfg.id,
          input: [{ type: 'user_input', content: [contentObj] }],
          response_format: { type: 'audio' },
          generation_config: { speech_config: [{ voice: VOICE_NAME }] }
        })
      });

      if (!res.ok) {
        lastErr = new Error(`[${modelCfg.id}] HTTP ${res.status}: ${await res.text()}`);
        continue; // Try next key in pool, then next Gemini TTS model
      }

      const json = await res.json();
      let b64 = json.output_audio?.data;
      if (!b64 && json.steps) {
        for (const st of json.steps) {
          for (const item of (st.content || [])) {
            if (item.type === 'audio' && item.data) { b64 = item.data; break; }
          }
          if (b64) break;
        }
      }
      if (!b64) throw new Error('No audio bytes returned in Gemini interaction');
      return ensureWavHeader(Buffer.from(b64, 'base64'), 24000);
    }
  }
  throw lastErr || new Error('All Gemini TTS models/keys exhausted');
}

function unifyVocalTone(rawWav, normWav) {
  const af = [
    'highpass=f=80',
    'lowpass=f=12000',
    'equalizer=f=180:t=q:w=1.2:g=1.2',
    'equalizer=f=3500:t=q:w=1.2:g=-1.0',
    'acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120:makeup=2',
    'loudnorm=I=-18.0:LRA=5.0:TP=-1.5'
  ].join(',');
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', rawWav, '-af', af, '-ar', '24000', '-ac', '1', normWav]);
}
```

### 2.3 Procedural Foley & Atmospheric Synthesis (Liminal Survival Horror)

Synthesize deterministic 44.1 kHz Float32 PCM cues and mix with voiceover sidechain ducking (duck SFX by 35% during speech):
- **`fluorescent_hum`:** 60Hz and 120Hz sine wave layered with low-level white noise to simulate harsh industrial fluorescent lighting ballasts.
- **`mechanical_shift`:** Deep pitch-dropping rumble (`45Hz` → `28Hz`) layered with filtered metallic scraping for the 6-hour mall rotation.
- **`cart_wheels`:** Periodic high-frequency squeaks (`2.8kHz` – `3.4kHz`) occurring every `1.2s` for The Cleaner's cart wheels.
- **`mop_squelch`:** Band-passed noise bursts (`300Hz` – `1.2kHz`) with rapid exponential decay simulating wet mop strokes.
- **`distance_sonar`:** Short high-pitched tick/ping with stereo delay when the Distance Tracker Pill drops closer to the protagonist.
- **`ui_pop`:** Crisp high chime (`880Hz` sine ping with 30ms decay) whenever a HUD rule or math card scales into view.

### 2.4 SHA-256 Audio Cache & Proportional Thai Subtitles (`generate_audio.js` Helper)

To prevent redundant API consumption and quota burnout, always wrap TTS generation with SHA-256 hashed disk caching (`audio/cache/<hash>.wav`). For subtitles, slice Thai lines at natural boundaries under 36 characters and synchronize timestamps proportionally to character length:

```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * สร้างหรือดึงไฟล์เสียงจาก SHA-256 Cache
 */
async function getOrGenerateSceneAudio(sceneId, text, ttsGeneratorFn) {
  const cacheDir = path.join(__dirname, 'audio', 'cache');
  fs.mkdirSync(cacheDir, { recursive: true });

  const hash = crypto.createHash('sha256').update(text.trim()).digest('hex').slice(0, 16);
  const cachedPath = path.join(cacheDir, `scene_${sceneId}_${hash}.wav`);

  if (fs.existsSync(cachedPath)) {
    console.log(`[CACHE HIT] Scene ${sceneId} -> ${path.basename(cachedPath)}`);
    return cachedPath;
  }

  console.log(`[TTS API] Generating audio for Scene ${sceneId}...`);
  const wavBuffer = await ttsGeneratorFn(text);
  fs.writeFileSync(cachedPath, wavBuffer);
  return cachedPath;
}

/**
 * ตัดประโยคภาษาไทยไม่ให้เกิน maxChars และคำนวณเวลาเริ่มต้น-สิ้นสุดตามสัดส่วนความยาวจริง
 */
function sliceThaiSubtitlesProportionally(fullText, totalDurationSec, maxChars = 36) {
  const tokens = fullText.split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const token of tokens) {
    if ((current + ' ' + token).trim().length <= maxChars) {
      current = (current + ' ' + token).trim();
    } else {
      if (current) chunks.push(current);
      current = token;
    }
  }
  if (current) chunks.push(current);

  const totalChars = chunks.reduce((sum, c) => sum + c.length, 0) || 1;
  let elapsed = 0;

  return chunks.map((text) => {
    const duration = (text.length / totalChars) * totalDurationSec;
    const item = {
      text,
      start: Number(elapsed.toFixed(2)),
      end: Number((elapsed + duration).toFixed(2))
    };
    elapsed += duration;
    return item;
  });
}

module.exports = { getOrGenerateSceneAudio, sliceThaiSubtitlesProportionally };
```

---

## 3. Core HTML5 Canvas 2.5D Architecture, HyperFrames Integration & Deterministic MP4 Export

### 3.1 Multi-Plane `window.renderAtTime(t)` + HyperFrames Triple-Adapter (`index.html`)

Every project's `index.html` MUST comply with the **HyperFrames (`heygen-com/hyperframes`) HTML/JS Contract** (`0 errors, 0 warnings` on `node hf.js lint` and `node hf.js check`) while also exposing `window.renderAtTime(t)` for `audit_all_scenes.js` and `render_mp4.js`:

- **Why `@font-face` points to `assets/fonts/kanit-*.woff2`:** HyperFrames fails lint with `font_family_without_font_face` if `'Kanit'` is used in CSS without local `@font-face` files.
- **Why `<canvas id="stage">` has `data-layout-ignore` and `data-hold`:** `data-layout-ignore` prevents false DOM text-overlap checks on the canvas wrapper, and `data-hold` tells the Craft audit (`npx hyperframes check`) that the `<canvas>` DOM box stays stationary while its internal 2D context paints every frame (preventing false `dead_stretch` warnings).
- **Why `<audio id="master-audio">` has NO `play()` / `pause()` / `requestAnimationFrame`:** HyperFrames owns media transport and timeline scrubbing; imperative media calls trigger `imperative_media_control` and `requestanimationframe_in_composition` lint errors.

```html
<!DOCTYPE html>
<html
  lang="th"
  data-composition-variables='[
    {"id":"title","type":"string","label":"Episode Title","default":"Real Lens Survival Horror"},
    {"id":"shortsMode","type":"boolean","label":"Vertical Shorts Mode","default":false}
  ]'
>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=1280, height=720" />
<title>Real Lens 2.5D Survival Horror (HyperFrames)</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
  @font-face {
    font-family: "Kanit";
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url("assets/fonts/kanit-thai-400-normal.woff2") format("woff2"),
         url("assets/fonts/kanit-latin-400-normal.woff2") format("woff2");
  }
  @font-face {
    font-family: "Kanit";
    font-style: normal;
    font-weight: 500;
    font-display: block;
    src: url("assets/fonts/kanit-thai-500-normal.woff2") format("woff2"),
         url("assets/fonts/kanit-latin-500-normal.woff2") format("woff2");
  }
  @font-face {
    font-family: "Kanit";
    font-style: normal;
    font-weight: 600;
    font-display: block;
    src: url("assets/fonts/kanit-thai-600-normal.woff2") format("woff2"),
         url("assets/fonts/kanit-latin-600-normal.woff2") format("woff2");
  }
  @font-face {
    font-family: "Kanit";
    font-style: normal;
    font-weight: 700;
    font-display: block;
    src: url("assets/fonts/kanit-thai-700-normal.woff2") format("woff2"),
         url("assets/fonts/kanit-latin-700-normal.woff2") format("woff2");
  }
  @font-face {
    font-family: "Kanit";
    font-style: normal;
    font-weight: 800;
    font-display: block;
    src: url("assets/fonts/kanit-thai-800-normal.woff2") format("woff2"),
         url("assets/fonts/kanit-latin-800-normal.woff2") format("woff2");
  }
  @font-face {
    font-family: "Kanit";
    font-style: normal;
    font-weight: 900;
    font-display: block;
    src: url("assets/fonts/kanit-thai-900-normal.woff2") format("woff2"),
         url("assets/fonts/kanit-latin-900-normal.woff2") format("woff2");
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1280px;
    height: 720px;
    background: #070A12;
    color: #FAF6EE;
    font-family: "Kanit", sans-serif;
    overflow: hidden;
    user-select: none;
  }
  #root {
    position: relative;
    width: 1280px;
    height: 720px;
    overflow: hidden;
    background: #0B1320;
  }
  #stage {
    position: absolute;
    left: 0;
    top: 0;
    width: 1280px;
    height: 720px;
    background: #0B1320;
    display: block;
    z-index: 1;
  }
</style>
</head>
<body>
<div
  id="root"
  data-composition-id="main"
  data-start="0"
  data-duration="300"
  data-width="1280"
  data-height="720"
  data-fps="24"
>
  <canvas
    id="stage"
    class="clip"
    data-start="0"
    data-duration="300"
    data-track-index="0"
    data-layout-ignore
    data-hold
    width="1280"
    height="720"
  ></canvas>
  <audio
    id="master-audio"
    class="clip"
    data-start="0"
    data-duration="300"
    data-track-index="1"
    data-volume="1"
    src="audio/master.wav"
  ></audio>
</div>

<script src="timeline.js"></script>
<script src="core.js"></script>
<script src="views.js"></script>
<script>
(function () {
  const TL = window.TIMELINE;
  const cvs = document.getElementById('stage');
  const ctx = cvs.getContext('2d');
  const TOTAL = TL.total;
  const SCENES = TL.scenes;

  function findScene(t) {
    t = clamp(t, 0, TOTAL - 0.001);
    for (let i = SCENES.length - 1; i >= 0; i--) {
      if (t >= SCENES[i].start) return SCENES[i];
    }
    return SCENES[0];
  }

  function renderAt(t) {
    t = clamp(t, 0, TOTAL);
    const s = findScene(t);
    const lt = Math.max(0, t - s.start);

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const fn = VIEWS[s.view] || VIEWS[SCENES[0].view];

    const activeCard = s.card || (typeof normalizeCard === 'function' ? normalizeCard(s) : null);
    let rackBlur = 0;
    const noBlurViews = window.NO_BLUR_VIEWS || [];
    if (activeCard && !noBlurViews.includes(s.view) && activeCard.type !== 'inventory') {
      const at = activeCard.at || 0.4;
      const ca = prog(lt, at, at + 0.45) * (1 - 0.85 * prog(lt, s.dur - 0.32, s.dur));
      rackBlur = ca * (activeCard.type === 'flow' ? 6.0 : 4.0);
    }
    if (rackBlur > 0.35) {
      blurLayer(ctx, rackBlur, (b) => fn(b, lt, s), `brightness(${(1 - rackBlur * 0.035).toFixed(2)})`);
    } else {
      fn(ctx, lt, s);
    }

    const fadeIn  = prog(lt, 0, 0.14);
    const fadeOut = 1 - prog(lt, s.dur - 0.14, s.dur);
    const edgeFade = Math.min(fadeIn, fadeOut);

    if (s.chapter) drawChapter(ctx, s.chapter, lt);
    drawTele(ctx, s, lt);
    if (activeCard) drawCard(ctx, activeCard, lt, s.dur);
    grain(ctx, t, 0.04);

    if (edgeFade < 1) {
      ctx.fillStyle = `rgba(10,14,22,${(1 - edgeFade) * 0.38})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawSub(ctx, s, lt);
    ctx.restore();
  }

  // 1. Standalone Puppeteer API (audit_all_scenes.js & render_mp4.js)
  window.__setHeadless = function () { document.body.classList.add('headless'); };
  window.seekTo = function (t) { renderAt(t); };
  window.renderAtTime = function (t) { renderAt(t); };
  window.__TOTAL_DURATION = TOTAL;

  // 2. Native HyperFrames Canvas Seek Protocol
  window.addEventListener('hf-seek', function (e) {
    if (e && e.detail && typeof e.detail.time === 'number') {
      renderAt(e.detail.time);
    }
  });

  // 3. Paused GSAP Root Timeline registered on window.__timelines["main"]
  window.__timelines = window.__timelines || {};
  if (typeof gsap !== 'undefined') {
    const playhead = { t: 0 };
    const tl = gsap.timeline({ paused: true });
    tl.to(playhead, {
      t: TOTAL,
      duration: TOTAL,
      ease: 'none',
      onUpdate: function () { renderAt(playhead.t); }
    }, 0);
    window.__timelines['main'] = tl;
    tl.seek(0);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { renderAt(0); });
  } else {
    renderAt(0);
  }
})();
</script>
</body>
</html>
```

### 3.2 HyperFrames Auto-Sync (`sync_hyperframes.js`) & CLI Wrapper (`hf.js`)

After running `generate_audio.js` (which writes `timeline.json`), always run `node sync_hyperframes.js` to copy `Kanit` `.woff2` fonts into `assets/fonts/` and inject the exact `data-duration` plus scene `.clip` markers (`<= 3` per track lane so `timeline_track_too_dense` is never triggered) into `index.html`:

```javascript
// sync_hyperframes.js — Synchronize timeline.json + Kanit fonts into index.html
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const tlPath = path.join(dir, 'timeline.json');
const htmlPath = path.join(dir, 'index.html');

// 1. Localize Kanit woff2 fonts into assets/fonts/
const fontsSrcDir = path.join(dir, 'node_modules', '@fontsource', 'kanit', 'files');
const fontsDstDir = path.join(dir, 'assets', 'fonts');
if (fs.existsSync(fontsSrcDir)) {
  fs.mkdirSync(fontsDstDir, { recursive: true });
  for (const file of fs.readdirSync(fontsSrcDir)) {
    if ((file.startsWith('kanit-thai-') || file.startsWith('kanit-latin-')) && file.endsWith('-normal.woff2')) {
      fs.copyFileSync(path.join(fontsSrcDir, file), path.join(fontsDstDir, file));
    }
  }
}

const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const total = Number(tl.total.toFixed(3));

// 2. Build scene track markers (<= 3 per lane for 0 lint warnings) + data-beat attributes
const sceneClips = tl.scenes.map((s, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const start = Number(s.start.toFixed(3));
  const dur = Number(s.dur.toFixed(3));
  const trackIdx = 1 + Math.floor(idx / 3);
  const safeView = String(s.view).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `  <div id="scene-${num}-${safeView}" class="clip" data-start="${start}" data-duration="${dur}" data-track-index="${trackIdx}" data-track-kind="graphics" data-beat="s${num}:${safeView}" data-layout-ignore style="pointer-events:none;"></div>`;
}).join('\n');

const audioTrackIdx = 1 + Math.ceil(tl.scenes.length / 3);
let html = fs.readFileSync(htmlPath, 'utf8');

const newRootBlock = `<div
  id="root"
  data-composition-id="main"
  data-start="0"
  data-duration="${total}"
  data-width="1280"
  data-height="720"
  data-fps="24"
>
  <canvas
    id="stage"
    class="clip"
    data-start="0"
    data-duration="${total}"
    data-track-index="0"
    data-layout-ignore
    data-hold
    width="1280"
    height="720"
  ></canvas>
${sceneClips}
  <audio
    id="master-audio"
    class="clip"
    data-start="0"
    data-duration="${total}"
    data-track-index="${audioTrackIdx}"
    data-volume="1"
    src="audio/master.wav"
  ></audio>
</div>`;

html = html.replace(/<div\s+id="root"[\s\S]*?<\/div>\s*(?=<script src="timeline\.js">)/, newRootBlock + '\n\n');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`[HyperFrames Sync] Updated index.html -> duration=${total}s, scenes=${tl.scenes.length}`);
```

```javascript
// hf.js — HyperFrames CLI Wrapper with automatic ffmpeg-static & ffprobe-static PATH injection
const path = require('path');
const { spawnSync } = require('child_process');

const extraPaths = [];
try { const ffmpegPath = require('ffmpeg-static'); if (ffmpegPath) extraPaths.push(path.dirname(ffmpegPath)); } catch (_) {}
try { const ffprobe = require('ffprobe-static'); if (ffprobe?.path) extraPaths.push(path.dirname(ffprobe.path)); } catch (_) {}

const env = { ...process.env };
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'PATH';
if (extraPaths.length > 0) {
  env[pathKey] = extraPaths.join(path.delimiter) + path.delimiter + (env[pathKey] || '');
}

const args = process.argv.slice(2);
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const res = spawnSync(cmd, ['hyperframes', ...args], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
process.exit(res.status ?? 0);
```

### 3.3 Batched Puppeteer -> FFmpeg `image2pipe` Exporter (`render_mp4.js`) or `node hf.js render`

You can render the final MP4 using either our batched `image2pipe` exporter (`node render_mp4.js`) OR HyperFrames' multi-worker renderer (`node hf.js render -f 24 -q looks -w 4 -o output.mp4`). For `render_mp4.js`, step `BATCH = 12` frames per `page.evaluate` call returning base64 JPEG data URLs (`canvas.toDataURL('image/jpeg', 0.92)`), and stream decoded buffers into:

```bash
ffmpeg -y -f image2pipe -vcodec mjpeg -r 24 -i - -i audio/master.wav \
  -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -shortest -movflags +faststart output.mp4
```

---

## 4. Rendering Standards & QA Gate Protocols

| Render Target | Resolution | Frame Rate | EBU R128 Loudness | Visual & Composition Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Master 16:9** (`render_mp4.js`) | `1920x1080` | `24` or `30 fps` | `loudnorm=I=-18:TP=-1.5:LRA=11` | Full landscape view with 4 depth planes, volumetric lighting, and centered HUD cards. |
| **Shorts 9:16** (`render_all_shorts.js`) | `1080x1920` | `30 fps` | `loudnorm=I=-14:TP=-1.0:LRA=9` | **Smart Center Zoom ($1.35\times$)** on protagonist/entity action, blurred dynamic backdrop, and **Safe Zone Check**. |

### Safe Zone Check for Vertical Shorts:
- **Bottom Clearance:** Never position Thai burned-in subtitles below $Y = 1580\text{ px}$.
- **Right Margin Clearance:** Keep interactive HUD text and telemetry at least $140\text{ px}$ away from the right screen edge to avoid collision with TikTok, Instagram Reels, and YouTube Shorts action buttons (Like, Comment, Share, Audio Disc).
