# Programmatic Animation Pipeline & Tooling Guide

This guide explains how an AI Agent builds, voices, masters, and renders **Real Lens** and **Rules of Survival / Liminal Space** style 2.5D animations end-to-end using Node.js, HTML5 Canvas, Gemini Interactions TTS, Puppeteer, and FFmpeg.

---

## 1. Standard Project File Layout & Tooling Stack

Install local dependencies once (`puppeteer-core`, `ffmpeg-static`, `@fontsource/kanit`):

| File / Layer | Role in Production Pipeline |
| :--- | :--- |
| `episode.js` | Structured array of scenes (`id`, `view`, `vo` Thai narration, `pad`, `bed` ambience type, `sfx` timestamped cues, HUD metadata). |
| `core.js` | Reusable 2.5D cylindrical character rigs (Protagonist "ต้น", Entity "ภารโรงไร้หน้า"), procedural shaders (wet tile shine, fluorescent flicker, horror vignette), camera rack-focus blur helpers, and Cream/Slate HUD card renderers. |
| `views.js` | Scene-specific Canvas2D painters mapped by `scene.view` (e.g., `parkingB2`, `liminalMall`, `fountainSquare`, `supermarket`, `fittingRoom`, `darknessSneak`, `outroCard`). |
| `generate_audio.js` | Synthesizes unified Thai voiceover (**`gemini-3.8-flash-tts` 1st priority**), normalizes to `-18 LUFS`, mixes procedural SFX/ambience, and outputs `audio/master.wav`, `audio/master.mp3`, `timeline.json`, and `timeline.js`. |
| `index.html` | Interactive HTML5 Canvas player (`1280x720` or `1920x1080`) exposing deterministic `window.renderAtTime(sec)` and `body.export-mode`. |
| `render_mp4.js` | Steps headless Chrome in frame batches (`24` or `30` FPS) and pipes JPEG frames into `ffmpeg -f image2pipe` with `audio/master.wav`. |
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

---

## 3. Core HTML5 Canvas 2.5D Architecture & Deterministic MP4 Export

### 3.1 Multi-Plane `window.renderAtTime(t)`

```javascript
window.renderAtTime = function(t) {
  const scene = findSceneAt(t);
  const localT = t - scene.start;
  ctx.clearRect(0, 0, W, H);

  // Plane 0–2: Backdrop, Architecture & Characters (blurred when HUD focus is active)
  ctx.save();
  if (scene.hudBlur) ctx.filter = 'blur(10px) brightness(0.72)';
  VIEWS[scene.view](ctx, localT, t, scene);
  ctx.restore();

  // Plane 3–5: Horror Vignette, HUD Rule/Math Cards, Telemetry & Subtitles
  drawHorrorVignette(ctx, W, H);
  if (scene.hud) drawHudCard(ctx, localT, scene.hud);
  if (scene.telemetry) drawTelemetry(ctx, localT, scene.telemetry);
  drawSubtitleAt(ctx, localT, scene.subs);
};
```

### 3.2 Batched Puppeteer -> FFmpeg `image2pipe` Exporter (`render_mp4.js`)

Step `BATCH = 12` frames per `page.evaluate` call returning base64 JPEG data URLs (`canvas.toDataURL('image/jpeg', 0.92)`), and stream decoded buffers into:

```bash
ffmpeg -y -f image2pipe -vcodec mjpeg -r 24 -i - -i audio/master.wav \
  -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -shortest -movflags +faststart output.mp4
```
