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
| `shorts_planner.js` | [`scripts/shorts_planner.js`](../scripts/shorts_planner.js) | Enforces `<= 58s` (`<= 60s`) vertical Shorts splitting (`EP 1..N`, auto `EP 6, 7, 8+`) and scores key climax scenes for covers/thumbnails. |
| `render_all_shorts.js` | [`scripts/render_all_shorts.js`](../scripts/render_all_shorts.js) | Renders all planned `EP 1..N` `9:16` Shorts (`letterbox` / `1.35x zoom`, `30fps`, `48kHz`, `-14 LUFS`, `shorts/shorts_plan.json`). |
| `inspect_video.js` | [`scripts/inspect_video.js`](../scripts/inspect_video.js) | 16-point automated QA scorecard + `5x5` contact sheet (`--shorts` verifies UI Safe Zone + `<= 60.0s` duration). |

---

## 2. `episode.js` & `timeline.json` Data Schema

```javascript
{
  id: '01_cold_open',          // Unique string/number
  act: 1,                      // Optional narrative act 1..N (auto-subdivided by shorts_planner.js if > 58s)
  view: 'platform_corridor',   // Key in window.VIEWS
  vo: 'ถ้าคุณได้ยินเสียง...',     // Thai voiceover ("" for silent beat)
  pad: 0.6,                    // Silence (s) after VO finishes
  bed: 'hum',                  // 'hum'|'dark'|'parking'|'wind'|'freeze'|'water'|'none'
  sfx: [{ at: 1.2, type: 'ui_pop' }],
  chapter: ['องก์ที่ 1', 'ชื่อตอน'],
  telemetry: { day: 'วันที่ 1', time: '00:30', status: 'WARN', db: 42, distance: '4 ม.' },
  hud: { type: 'rule', at: 1.5, pos: 'tl', ruleNo: 'กฎข้อ 1', title: '...', sub: '...', eng: '...' },
  // Optional key-scene hints for covers & thumbnails:
  isClimax: false,             // true boosts scene priority for cover/showdown picks
  coverAt: 1.8,                // Exact seconds from scene start to capture hero frame
  coverScore: 95,              // Manual dramatic priority override
  coverHeadline: ['หัวข้อด้านบน', 'คำแดง!'],
  focusX: 640                  // Horizontal subject center (0..1280) for 5-panel crops
}
```
`generate_audio.js` produces `timeline.json` and `timeline.js` (`window.TIMELINE`), appending `start`, `dur`, `voStart`, `voDur`, and `subs: [{ t0, t1, text }]` to each scene.

---

## 3. Unified Voiceover & Sound Design (`gemini-3.8-flash-tts` First Priority)

### 3.1 Critical TTS Rules
1. **Model Priority Order (Voice `Puck`):**
   - `gemini-3.8-flash-tts` *(1st priority — `/v1beta/interactions` with `speech_metadata`)*
   - `gemini-3.8-flash-lite-tts` *(2nd priority — `/v1beta/interactions` with `speech_metadata`)*
   - `gemini-3.1-flash-tts-preview` *(3rd priority — **MUST omit** `annotations` / `speech_metadata` or API returns `HTTP 400`)*
2. **NEVER Mix TTS Engines Mid-Video:** Keep all scenes `01..N` on Gemini `Puck`.
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
| **Shorts 9:16** | `1080x1920`, `<= 60.0s` / EP (`maxSec = 58s`, auto `EP 6, 7, 8+`) | `30 fps` | `-14.0 LUFS` (or `-18.0 LUFS` via `--lufs -18`) | `node render_all_shorts.js --mode letterbox` (or `--mode zoom`) |

Run [`scripts/inspect_video.js`](../scripts/inspect_video.js) after rendering to confirm **`16/16 PASS`**, **`0 Unintended Black Intervals`**, and **`<= 60.0s` per Vertical Short**:
```bash
node inspect_video.js master_hf.mp4 --strict
node inspect_video.js shorts/master_hf_ep1_shorts.mp4 --shorts --strict
```
