# Programmatic Animation Pipeline, Audio QA & Tooling Guide

End-to-end production reference for **Real Lens** 2.5D survival horror & Thai/Isan folklore science/history documentary videos using Node.js, HTML5 Canvas, **HyperFrames (`heygen-com/hyperframes`)**, Gemini Interactions TTS, Puppeteer, and FFmpeg.

---

## 1. Project File Layout (Copy from `templates/` + `scripts/`)

Initialize a new episode directory from [`templates/`](../templates/) and [`scripts/`](../scripts/). Note that `generate_shorts_overlays.js` lives **exclusively in `scripts/`** (single canonical source — zero duplicate in `templates/`).

| File | Source | Role in Production Pipeline |
| :--- | :--- | :--- |
| `package.json` | [`templates/package.json`](../templates/package.json) | Dependencies (`@fontsource/kanit`, `ffmpeg-static`, `ffprobe-static`, `puppeteer-core`, `gsap`, `hyperframes`) & npm scripts. |
| `episode.js` | [`templates/episode.example.js`](../templates/episode.example.js) | Single source of truth: `NARRATIVE_MODE`, `HUD_MODE`, `TITLE`, `PRONUNCIATION_MAP`, `SHORTS_BRIDGE_CTA_VO`, `SCENES`. |
| `core.js` | [`templates/core.js`](../templates/core.js) | 2.5D rigs, poses, shaders, Rural Thai builders, `hudMode` (`survival` / Clean Cinema `documentary`), subtitles. |
| `views.js` | [`templates/views.example.js`](../templates/views.example.js) | Story-native Canvas2D scene renderers mapped by `scene.view`, plus `window.NO_BLUR_VIEWS`. |
| `generate_audio.js` | [`templates/generate_audio.js`](../templates/generate_audio.js) | Gemini 3.8 TTS (`Puck`), `pronunciation_map.js` loader, 350–500ms trailing silence padding, SHA-256 cache, `-18 LUFS` master, `timeline.json`. |
| `pronunciation_map.js` | [`templates/pronunciation_map.js`](../templates/pronunciation_map.js) | Single source of truth for 150+ curated medical, folklore, Isan & tricky Thai TTS phonetic mappings + `applyPronunciationMap()`. |
| `index.html` | [`templates/index.html`](../templates/index.html) | HyperFrames Native `1920x1080 @ 30fps` composition scaling logical `1280x720` via `rs = 1.5`, exposing `hf-seek`, `window.setRenderResolution`, `window.__timelines['main']`, `hudMode`, and `shortsMode`. |
| `sync_hyperframes.js` | [`scripts/sync_hyperframes.js`](../scripts/sync_hyperframes.js) | Localizes Kanit `.woff2` & `gsap.min.js`, stamps `data-duration`, viewport/CSS size (`1920x1080@30fps` default or `--width/--height/--fps`), & scene `.clip` markers (`<= 3` per lane) into `index.html`. |
| `hf.js` | [`scripts/hf.js`](../scripts/hf.js) | Cross-platform HyperFrames CLI wrapper injecting `ffmpeg-static` & `ffprobe-static` into `PATH`. |
| `narration_qa.js` | [`scripts/narration_qa.js`](../scripts/narration_qa.js) | Shared Automated Narration & Audio Tail QA module (camera leaks, unmapped English, mid-video CTA, tail clipping/cutoff). |
| `audit_all_scenes.js` | [`scripts/audit_all_scenes.js`](../scripts/audit_all_scenes.js) | Runs Automated Narration QA (`--qa-only` supported) + renders all scenes (`1..N`) to `audit_all_scenes.png` (GPU-accelerated). |
| `render_mp4.js` | [`scripts/render_mp4.js`](../scripts/render_mp4.js) | Parallel GPU-accelerated MP4 exporter (`1920x1080@30fps`) with `--720p --fps 24` draft, `--hq` lossless PNG pipe + NVENC `p6`, `--cq`, and `--grade horror\|sitcom\|auto` FFmpeg finishing filters. |
| `shorts_planner.js` | [`scripts/shorts_planner.js`](../scripts/shorts_planner.js) | Cliffhanger Bridge 3-Angle Shorts planner (`40–50s`, anti-spoiler, sentence-snapped) + legacy `events`/`single`/`two_part` modes. |
| `generate_shorts_overlays.js` | [`scripts/generate_shorts_overlays.js`](../scripts/generate_shorts_overlays.js) | Generates minimalist 9:16 title overlays + Related Video Bridge CTA overlays (`overlay_<tag>_cta.png`). |
| `render_all_shorts.js` | [`scripts/render_all_shorts.js`](../scripts/render_all_shorts.js) | Renders native `1080x1920` Shorts (`30fps`, `-14 LUFS`) with Bridge CTA overlay & optional closing CTA VO audio. |
| `inspect_video.js` | [`scripts/inspect_video.js`](../scripts/inspect_video.js) | 16-point automated QA scorecard + Narration/Audio Tail QA + `5x5` contact sheet. |
| `pack_skill.js` | [`scripts/pack_skill.js`](../scripts/pack_skill.js) | Exports clean skill `.zip` strictly excluding `.git/`, `node_modules/`, `.env`, caches, and media junk. |

---

## 2. `episode.js` & `timeline.json` Data Schema

Separate spoken narration from visual & camera instructions on EVERY scene:

```javascript
{
  id: '03_medical_decode_sunds',
  phase: 'decode',               // 'hook' (0-45s) | 'folklore' (0-50%) | 'decode' (50-90%) | 'outro' (90-100%)
  isReveal: true,                // Excluded automatically by Cliffhanger Shorts planner
  isFinalScene: false,           // true ONLY on the very last scene (where comment/subscribe CTA is allowed)
  shortsAngle: 'ritual',         // Optional hint: 'ritual' | 'tension' | 'twist'
  view: 'medical_archive_desk',  // Key in window.VIEWS
  // STRICT SEPARATION:
  narration: 'ข้อความบทพากย์ส่งเข้า TTS และซับไตเติลเท่านั้น ห้ามใส่คำสั่งมุมกล้อง...', // Legacy `vo` still supported
  visual_prompt: 'โต๊ะเหล็กในห้องชันสูตร แสงไฟฉายกวาดผ่านแฟ้มประวัติผู้ป่วยยุค 80',
  camera_note: 'โคลสอัพมุมสูง แพนกล้องช้าๆ จากซ้ายไปขวา',
  cameraSpec: { pitch: 'high-top', horizonY: 180, framing: 'macro-POV', move: 'pan-right' },
  // Clean Cinema Mode (HUD_MODE = 'documentary'): zero on-screen popup boxes — pure visuals + subtitles ONLY!
  pad: 0.45,                     // Trailing silence (s); floored at TRAILING_SILENCE_MS (350-500ms)
  bed: 'hum',                    // 'hum'|'dark'|'parking'|'wind'|'freeze'|'water'|'none'
  sfx: [{ at: 0.5, type: 'marker' }],
  isClimax: false,
  coverAt: 1.4,
  focusX: 640
}
```
`generate_audio.js` writes `timeline.json` and `timeline.js` (`window.TIMELINE`), preserving `narrativeMode`, `hudMode`, `trailingSilenceMs`, `narration`, `vo`, `start`, `dur`, `voStart`, `voDur`, and `subs: [{ t0, t1, text }]`.

---

## 3. Audio Pipeline, `PRONUNCIATION_MAP` & Trailing Silence Padding

### 3.1 Gemini TTS Model Priority & Strict Narrator Lock
1. `gemini-3.8-flash-tts` *(1st priority — `/v1beta/interactions` + `speech_metadata`)*
2. `gemini-3.8-flash-lite-tts` *(2nd priority — `/v1beta/interactions` + `speech_metadata`)*
3. `gemini-3.1-flash-tts-preview` *(3rd priority — **omit** `annotations`/`speech_metadata` to avoid `HTTP 400`)*

- **Narrator Lock (`role: 'narrator'` default):** Always uses `VOICE_NAME = 'Puck'` + `NARRATOR_STYLE` with Two-Pass Linear EBU R128 `loudnorm` (`-18.0 LUFS`, `LRA=3.5`) + `dynaudnorm`.
- **Character / Impersonation Exceptions:** Allowed ONLY when explicitly tagged (`role: 'character'`, `speaker`, `role: 'impersonate'`, `voSegments`, or inline `[[char:id|...]]` / `[[impersonate:desc|...]]`), while `stripVoMarkupForSubs()` keeps on-screen subtitles 100% clean.
- **API Keys:** Provide `GEMINI_API_KEYS` (comma-separated across separate GCP projects for 25+ scenes) or `GEMINI_API_KEY` via `.env` or environment variables — **never hardcode keys**.

### 3.2 `PRONUNCIATION_MAP` (`templates/pronunciation_map.js`) & Isan Dialect TTS Rules
`applyPronunciationMap()` inside [`templates/pronunciation_map.js`](../templates/pronunciation_map.js) (used by `generate_audio.js` and `narration_qa.js`) converts English acronyms, medical/scientific terms, folklore/ritual props, Isan dialect words, and tricky Thai words into phonetic Thai **ONLY before sending to the TTS API** — on-screen subtitles retain the original clean spelling.

- **Merge Priority (Longest Key Matched First):** `templates/pronunciation_map.js` → optional project `pronunciation_map.json` → `episode.PRONUNCIATION_MAP`.
- **5 Built-in Categories (150+ entries):**
  1. Medical / Science / Anthropology (`SUNDS`, `Brugada Syndrome`, `Sleep Paralysis`, `Hypokalemia`, `Kwashiorkor`, `Phosphine`, `Methane`, `Sepsis`, `Hallucination`, `Ergotism`, `Psychosis`, `Hypoxia`, `Malaria`, `Mlabri`, `นักมานุษยวิทยา`, `ชันสูตรพลิกศพ`, `อหิวาตกโรค`, `พยาธิใบไม้ตับ`, etc.)
  2. Thai/Isan Folklore, Rituals & Herbs (`ผีแม่ม่าย`, `ผีปอบ`, `ผีกระสือ`, `ผีกองกอย`, `หนามพุทรา`, `ใบหนาด`, `ว่านผีเป้า`, `หมอธรรม`, `ธรณีประตู`, `ไสยศาสตร์`, etc.)
  3. Isan Dialect & Regional Terms (`โป้ตีน`, `มิดจี่หลี่`, `ซอดแจ้ง`, `จอบเบิ่ง`, `อีหยัง`, `บ่ฮู้`, `บ่แม่น`, `ซุมเฮา`, `แล่นหนี`, `ป่ารกชัฏ`, etc.)
  4. Commonly Mispronounced Thai Words (`ชะตากรรม`, `พรุ่งนี้`, `แคมป์พักแรม`, `ยามวิกาล`, `ประชาทัณฑ์`, `อมนุษย์`, `พฤติกรรม`, `เกราะกำบัง`, etc.)
  5. Common Acronyms (`LINE`, `CCTV`, `GPS`, `DNA`, `ECG`, `PTSD`, `WHO`, etc.)
- **กติกาคำภาษาอีสานกับ AI TTS ทั่วไป:**
  - จำกัดคำอีสานเฉพาะคำสั้น ๆ ที่ AI ออกเสียงได้เป็นธรรมชาติ (เช่น `ผีปอบ`, `หมอธรรม`, `แคร่ไม้ไผ่`)
  - สำหรับคำอีสานเฉพาะถิ่นที่ TTS มักอ่านเพี้ยน ให้แมปเป็นรูปสะกดตามเสียงอ่านใน `PRONUNCIATION_MAP` (เช่น `'อีหยัง': 'อี-หยัง'`, `'บ่แม่น': 'บ่อ-แม่น'`, `'เฮ็ดหยัง': 'เฮ็ด-หยัง'`) และหลีกเลี่ยงประโยคอีสานยาวหลายอนุประโยคติดกัน

### 3.3 Trailing Silence Padding (350–500 ms)
To prevent final syllables from getting clipped during scene assembly or Shorts cutting:
- `generate_audio.js` enforces **`TRAILING_SILENCE_MS = 420`** (configurable via `episode.TRAILING_SILENCE_MS` or `--tail-silence-ms`, clamped cleanly within **`350–500 ms`**).
- Every `audio/vo_gemini_<id>.wav` (and optional `audio/shorts_bridge_cta.wav`) receives a smooth 12 ms micro fade-out followed by exact `350–500 ms` zero-padded trailing silence (`applyTrailingSilenceToWav`), while subtitles remain tightly aligned to `activeVoDur` (pre-padding speech duration).

| HTTP Status | Cause | Fix |
| :--- | :--- | :--- |
| **`HTTP 400`** | `Speech metadata not supported` | Omit `annotations` on `gemini-3.1-flash-tts-preview`. |
| **`HTTP 429`** | `Resource Exhausted / Rate limit` | Rotate to keys from a *different* Google Cloud project (`GEMINI_API_KEYS`). |

---

## 4. Automated Narration & Audio Tail QA (`narration_qa.js`)

Executed automatically by both `node audit_all_scenes.js` (or `node audit_all_scenes.js --qa-only`) and `node inspect_video.js <video.mp4> --strict`:
1. **`CAMERA_IN_NARRATION` (ERROR):** Flags camera/storyboard commands leaked into `narration`/`vo` (`มุมเสย`, `มุมก้ม`, `มุมกล้อง`, `มองกล้อง`, `แพนกล้อง`, `ซูม`, `โคลสอัพ`, `คัตไปที่`, `ECU`/`OTS`/`POV`).
2. **`UNMAPPED_ENGLISH_TTS` (WARNING):** Flags Latin words/acronyms not yet covered by `PRONUNCIATION_MAP`.
3. **`MID_VIDEO_CTA` (ERROR):** Flags comment/subscribe prompts (`คอมเมนต์`, `กดติดตาม`, `กดไลก์`, `กดแชร์`, `ซับสไครบ์`) appearing before the final scene.
4. **`AUDIO_ABRUPT_TAIL_CUT` / `AUDIO_TAIL_CLIPPING` (ERROR) & `LOW_TRAILING_SILENCE` (WARNING):** Probes every `audio/vo_gemini_*.wav` AND the rendered MP4's closing audio tail for peak clipping, abrupt mid-syllable cutoff, or `< 300 ms` trailing silence.

---

## 5. HyperFrames + FFmpeg Hybrid Workflow & Clean Skill Export

1. **HyperFrames Rules (`0 errors, 0 warnings`):** Local Kanit `.woff2` (`assets/fonts/`) and `gsap.min.js` (`assets/vendor/`); `<canvas id="stage" ... data-layout-ignore data-hold>`; `<= 3` scene `.clip` markers per `data-track-index` lane; declarative `<audio id="master-audio">` (zero `play()`, `requestAnimationFrame`, or CSS `transition`); synchronous `window.__timelines['main'] = tl` registration before `document.fonts.ready`.
2. **Core Hybrid CLI Commands (`hf.js` + `render_mp4.js`):**
   - **Draft / Scrubbing:** `node hf.js preview` (interactive timeline) or `node render_mp4.js --720p --fps 24 -o draft_720p.mp4`
   - **Fast Daily Master (`1080p @ 30fps`):** `node render_mp4.js --grade horror --cq 17 -o master_hf.mp4` (4 workers + NVENC + dark-gradient `deband` & subtle film grain, zero disk bloat)
   - **HQ Lossless-Pipe Master:** `node render_mp4.js --hq --grade horror -o master_hf.mp4` (lossless PNG pipe + NVENC `p6` + `CQ 16` + `256k` AAC)
   - **HyperFrames Studio Special Exports:** `node hf.js render -f 30 -q looks --gpu --browser-gpu -o master_hf.mp4` (supports `--start/--end` segment fixes, `--resume`, `--format mov` alpha, `--resolution 4k`)
   ```bash
   node generate_audio.js                                             # TTS + PRONUNCIATION_MAP + 420ms tail pad
   node sync_hyperframes.js                                           # Sync timeline + local fonts/GSAP into index.html (1920x1080@30fps)
   node hf.js lint && node hf.js check                                # 0 errors, 0 warnings + 7-gate check
   node audit_all_scenes.js                                           # Narration QA + audit_all_scenes.png grid
   node render_mp4.js --grade horror --cq 17 -o master_hf.mp4         # Fast 1080p NVENC Master (or `--hq` for lossless PNG / `hf.js render` for Studio)
   node inspect_video.js master_hf.mp4 --strict                       # 16/16 PASS + Narration/Audio Tail QA
   ```
3. **Clean Skill Packaging (Never Bundling `.git/`):**
   ```bash
   node scripts/pack_skill.js --out dist/reallens-horror-animator.zip
   ```
   `.gitignore`, `.gitattributes`, and `scripts/pack_skill.js` strictly skip `.git/`, `node_modules/`, `.env`, `audio/`, `shorts/`, and media binaries whenever archiving or exporting `.zip`.
