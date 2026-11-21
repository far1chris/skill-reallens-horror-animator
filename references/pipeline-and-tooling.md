# Programmatic Animation Pipeline & Tooling Guide

This guide covers the complete end-to-end production workflow for **Real Lens** 2.5D survival horror videos using Node.js, HTML5 Canvas, **HyperFrames (`heygen-com/hyperframes`)**, Gemini Interactions TTS, Puppeteer, and FFmpeg.

---

## 1. Project File Layout (Copy from `templates/` + `scripts/`)

Initialize a new episode directory from [`templates/`](../templates/) and [`scripts/`](../scripts/):

| File | Source | Role in Production Pipeline |
| :--- | :--- | :--- |
| `package.json` | [`templates/package.json`](../templates/package.json) | Installs `@fontsource/kanit`, `ffmpeg-static`, `ffprobe-static`, `puppeteer-core`, `gsap`, and `hyperframes`. |
| `episode.js` | [`templates/episode.example.js`](../templates/episode.example.js) | Single source of truth for `TITLE`, `SUBTITLE`, `SCENES` (and optional `CUSTOM_SFX` / `CUSTOM_BEDS`). |
| `core.js` | [`templates/core.js`](../templates/core.js) | Complete 2.5D rigs, poses, shaders, `corridor()`, and theme-agnostic HUD/subtitle engine. |
| `views.js` | [`templates/views.example.js`](../templates/views.example.js) | Story-native Canvas2D scene renderers mapped by `scene.view`, plus `window.NO_BLUR_VIEWS`. |
| `generate_audio.js` | [`templates/generate_audio.js`](../templates/generate_audio.js) | Synthesizes Thai voiceover (`gemini-3.8-flash-tts` first), SHA-256 cache, `Intl.Segmenter` subtitles (`{t0, t1, text}`), procedural SFX + 35% ducking, `-18 LUFS` master, `timeline.json` & `timeline.js`. |
| `index.html` | [`templates/index.html`](../templates/index.html) | HyperFrames-compliant `1280x720` composition exposing `hf-seek`, `window.__timelines['main']`, `window.renderAtTime(t)`, and `window.__hyperframes?.getVariables()`. |
| `sync_hyperframes.js` | [`scripts/sync_hyperframes.js`](../scripts/sync_hyperframes.js) | Copies `Kanit` `.woff2` → `assets/fonts/` and `gsap.min.js` → `assets/vendor/`, stamps `data-duration` & scene `.clip` markers (`<= 3` per lane) into `index.html`. |
| `hf.js` | [`scripts/hf.js`](../scripts/hf.js) | Cross-platform wrapper injecting `ffmpeg-static`, `ffprobe-static`, and local `node_modules/.bin` into `PATH`. |
| `audit_all_scenes.js` | [`scripts/audit_all_scenes.js`](../scripts/audit_all_scenes.js) | Renders every scene (`1..N`) to `audit_all_scenes.png` and flags runtime/missing-view errors. |
| `render_mp4.js` | [`scripts/render_mp4.js`](../scripts/render_mp4.js) | Alternative Puppeteer batch-12 `image2pipe` MP4 exporter (`--1080p` supported). |
| `shorts_planner.js` | [`scripts/shorts_planner.js`](../scripts/shorts_planner.js) | Defaults to **1 standalone `45–60s` clip** (or **max 2 EPs** `ตอนที่ 1` + `ตอนจบ` with Part 2 3s recap, `--max-ep 2`) and scores climax frames for covers/thumbnails. |
| `render_all_shorts.js` | [`scripts/render_all_shorts.js`](../scripts/render_all_shorts.js) | Renders standalone / <= 2-EP `9:16` Shorts (`fullscreen` default / `crop`, `30fps`, `48kHz`, `-14 LUFS`, `shorts/shorts_plan.json`). |
| `inspect_video.js` | [`scripts/inspect_video.js`](../scripts/inspect_video.js) | 16-point automated QA scorecard + `5x5` contact sheet (`--shorts` verifies full-screen Safe Zone, `<= 60.0s`, and `<= 2 EP` + Part 2 3s recap). |

---

## 2. `episode.js` & `timeline.json` Data Schema

```javascript
{
  id: '01_cold_open',          // Unique string/number
  act: 1,                      // Optional narrative act 1..2 (or eventId for event cuts)
  view: 'platform_corridor',   // Key in window.VIEWS
  vo: 'ถ้าคุณได้ยินเสียง...',     // Thai voiceover ("" for silent beat; supports [[char:id|...]] / [[impersonate:desc|...]])
  // Optional voice exceptions ONLY for other characters or narrator impersonations (narrator stays locked to Puck):
  // role: 'narrator' | 'character' | 'impersonate',
  // speaker: 'yai_nuan',      // Character ID from DEFAULT_CHARACTER_VOICES or episode.CHARACTER_VOICES
  // impersonate: 'เสียงกระซิบ', // Vocal acting / preset ('sweet_sales'|'elder'|'deep'|'whisper_ghost'|'phone_speaker')
  // voSegments: [{ role: 'narrator', text: '...' }, { role: 'character', speaker: 'yai_nuan', text: '...' }],
  pad: 0.6,                    // Silence (s) after VO finishes
  bed: 'hum',                  // 'hum'|'dark'|'parking'|'wind'|'freeze'|'water'|'none'
  sfx: [{ at: 1.2, type: 'door' }],
  // Optional key-scene hints for covers & thumbnails (NO chapter/telemetry/hud infographic overlays!):
  isClimax: false,             // true boosts scene priority for cover/showdown picks
  coverAt: 1.8,                // Exact seconds from scene start to capture hero frame
  coverScore: 95,              // Manual dramatic priority override
  coverHeadline: ['หัวข้อด้านบน', 'คำแดง!'],
  focusX: 640                  // Horizontal subject center (0..1280) for 5-panel & Shorts crops
}
```
`generate_audio.js` produces `timeline.json` and `timeline.js` (`window.TIMELINE`), appending `start`, `dur`, `voStart`, `voDur`, and `subs: [{ t0, t1, text }]` to each scene.

---

## 3. Strict Narrator Vocal Lock & Sound Design (`gemini-3.8-flash-tts` First Priority)

### 3.1 Critical TTS Rules
1. **Model Priority Order (Locked per Episode via `lockedModelId`):**
   - `gemini-3.8-flash-tts` *(1st priority — `/v1beta/interactions` with `speech_metadata`)*
   - `gemini-3.8-flash-lite-tts` *(2nd priority — `/v1beta/interactions` with `speech_metadata`)*
   - `gemini-3.1-flash-tts-preview` *(3rd priority — **MUST omit** `annotations` / `speech_metadata` or API returns `HTTP 400`)*
2. **Strict Narrator Lock vs. Character / Impersonation Exceptions:**
   - **Narrator Lines (`role: 'narrator'` default):** Always locked to `VOICE_NAME = 'Puck'` + `NARRATOR_STYLE` (`UNIFIED_STYLE`), phonetic/number normalized (`normalizeThaiForTTS` + `sanitizeVoForTTS`), and normalized with Two-Pass Linear EBU R128 (`I=-18.0`, `LRA=3.5`) + `dynaudnorm` so the narrator sounds like one consistent speaker across all scenes. Never override `voice` on narrator lines.
   - **Other Characters & Impersonations:** Exceptions apply **only** for distinct speaking characters (`role: 'character'` / `speaker` + `episode.CHARACTER_VOICES`) or narrator voice impressions (`role: 'impersonate'` / `impersonate` / `voicePreset`), including mixed scenes via `voSegments`, inline `[[char:id|...]]` / `[[impersonate:desc|...]]`, or speech-verb quotes (`พูดว่า "..."`). Subtitles strip markup automatically via `stripVoMarkupForSubs()`.
   - **AI Pronunciation & Clarity Detection:** `generate_audio.js` checks every clip via `inspectVoClipClarity` (and optional `--verify-asr` Gemini `2.5-flash` transcription match), auto-retries unclear fresh takes (or cached takes with `--fix-unclear` / `--repronounce`), writes `audio/pronunciation_report.json` (also supports `node generate_audio.js --audit-only`), and supports custom `episode.PRONUNCIATION_MAP` / `scene.ttsVo` phonetic overrides.
3. **API Keys via Environment / `.env` (Never Hardcode Keys):**
   - Set `GEMINI_API_KEY` or comma-separated multi-project `GEMINI_API_KEYS` (Free Tier `10 RPD` / `3 RPM` is scoped per Google Cloud Project — multiple keys in the *same* project share quota; create keys across separate projects for 25+ scenes):
   - Windows PowerShell: `$env:GEMINI_API_KEYS = "key1,key2,key3"` (or place `GEMINI_API_KEYS=...` in project `.env`, ignored by `.gitignore`).
4. **RIFF Header Check & SHA-256 Cache:**
   - Always check `buf.slice(0, 4).toString('ascii') === 'RIFF'` before wrapping `24 kHz` mono PCM in a 44-byte WAV header.
   - Cache raw TTS per hashed text (`audio/cache/scene_<id>_<hash>.wav`) so script tweaks only regenerate changed scenes.
5. **Thai Subtitle Word Segmentation:**
   - Thai prose lacks word spaces. Always use `Intl.Segmenter('th', { granularity: 'word' })` inside `chunkSubs()` (implemented in [`templates/generate_audio.js`](../templates/generate_audio.js)) so cues strictly stay `<= 36` characters and emit `{ t0, t1, text }` matching `drawSub()`.

| HTTP Status | Error Cause | Immediate Fix |
| :--- | :--- | :--- |
| **`HTTP 400`** | `Speech metadata is not supported for this model` | Omit `annotations` on `gemini-3.1-flash-tts-preview`. |
| **`HTTP 400`** | `Unknown parameter 'voice'` | Nest `{ voice: 'Puck' }` inside `generation_config.speech_config`. |
| **`HTTP 402`** | `Your prepayment credits are depleted` | Top up billing or switch to active Free Tier project keys. |
| **`HTTP 403`** | `Billing account has an outstanding balance` | Switch to independent Free Tier project keys. |
| **`HTTP 429`** | `Resource Exhausted / Rate limit` | Project hit 10 RPD / 3 RPM; rotate to keys from a *different* Google Cloud project. |

### 3.2 Procedural Foley, Sidechain Ducking & Broadcast Mastering (`-18 LUFS`)
[`templates/generate_audio.js`](../templates/generate_audio.js) synthesizes deterministic `44.1 kHz` PCM foley (`ui_pop`, `tick`, `steps`, `squeak`, `mop`, `rumble`, `blackout`, `flicker`, `heartbeat`, `tape`, `marker`, `wind_gust`, `water_lap`, `ice_crack`, plus custom `episode.CUSTOM_SFX` / `CUSTOM_BEDS`), mixes with 35% envelope-follower ducking under speech, and masters `audio/master.wav` + `audio/master.mp3` via FFmpeg (`loudnorm=I=-18.0:LRA=6.0:TP=-1.5`).

---

## 4. HyperFrames (`v0.9.32`) Composition Contract & Workflows

[`templates/index.html`](../templates/index.html) satisfies all HyperFrames checks (`0 errors, 0 warnings`) while keeping standalone Puppeteer exports working:

1. **Local Fonts & Local GSAP:** [`scripts/sync_hyperframes.js`](../scripts/sync_hyperframes.js) copies `Kanit` `.woff2` into `assets/fonts/` and `gsap.min.js` into `assets/vendor/gsap.min.js` — zero external CDN dependency.
2. **Canvas & Timeline Contract:**
   - `<canvas id="stage" class="clip" data-start="0" data-duration="..." data-track-index="0" data-layout-ignore data-hold width="1280" height="720"></canvas>` (`data-hold` prevents false `dead_stretch` craft warnings).
   - Scene markers `#scene-XX-<view>` use `data-track-index="${1 + Math.floor(idx / 3)}"` ($\le 3$ clips per lane prevents `timeline_track_too_dense`) and `data-beat="sXX:<view>"`.
   - `<audio id="master-audio" ... src="audio/master.wav">` is purely declarative — never call `play()`, `pause()`, `requestAnimationFrame`, or CSS `transition` in `index.html`.
3. **GSAP Registration Order:** Build and register `window.__timelines['main'] = tl` synchronously at script init (before async `document.fonts.ready` redraw) so `gsap_timeline_registered_before_async_build` never fires.
4. **Triple-Adapter Seek Bridge:** Exposes `hf-seek` listener, `window.__timelines['main']`, `window.renderAtTime(t)`, and `window.seekTo(t)`, and reads `window.__hyperframes?.getVariables()` (`title`, `shortsMode`).

### HyperFrames CLI Commands (Always Run via `node hf.js`)
```bash
node sync_hyperframes.js                                              # Sync timeline.json + local fonts/GSAP into index.html
node hf.js lint                                                       # Verify 0 errors, 0 warnings
node hf.js check                                                      # 7-gate check (Lint, Runtime, Layout, Motion, Contrast, Craft, Audio)
node hf.js timeline                                                   # Print tracks, clips, and beat markers
node hf.js snapshot --review                                          # Capture review-beats.jpg, seam strips, and phone previews
node hf.js snapshot --at 5,60,180 --no-end                            # Capture specific timestamps
node hf.js preview                                                    # Open HyperFrames Studio interactive scrubber
node hf.js render -f 24 -q looks -o master_hf.mp4                          # Parallel multi-worker HyperFrames render (720p)
node hf.js render -f 24 -q looks --resolution 1440p -o master_1440p.mp4 # 2x integer DPR 1440p render
```
*(Note: HyperFrames `--resolution` requires integer scale multiples of `1280x720` — use `1440p`/`4k` or omit `--resolution` for `720p`; for exact `1920x1080`, use `node render_mp4.js --1080p` or FFmpeg Lanczos scaling. Use `--frames-cache-dir` if your Windows `C:` drive temp space is tight during long renders, or `--start <s0> --end <s1>` to render a segment directly.)*

---

## 5. Render Standards & 16-Point Final QA Gate

| Render Target | Resolution | FPS | EBU R128 Loudness | Export Command |
| :--- | :--- | :--- | :--- | :--- |
| **Master 16:9** | `1280x720` / `2560x1440` (`2x` DPR) / `1920x1080` | `24` or `30 fps` | `-18.0 LUFS`, `TP <= -1.5 dBTP` | `node hf.js render -f 24 -q looks -o master_hf.mp4` or `node render_mp4.js --1080p` |
| **Shorts 9:16** | `1080x1920`, Standalone `45–60s` (or max `2 EPs`, `<= 58s` / EP) | `30 fps` | `-14.0 LUFS` (or `-18.0 LUFS` via `--lufs -18`) | `node render_all_shorts.js` (`--mode fullscreen` default) |

Run [`scripts/inspect_video.js`](../scripts/inspect_video.js) after rendering to confirm **`16/16 PASS`**, **`0 Unintended Black Intervals`**, and **`<= 60.0s` per Vertical Short**:
```bash
node inspect_video.js master_hf.mp4 --strict
node inspect_video.js shorts/master_hf_ep1_shorts.mp4 --shorts --strict
```
