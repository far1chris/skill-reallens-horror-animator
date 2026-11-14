---
name: reallens-horror-animator
description: >-
  Use when creating, scripting, rigging, voicing, or rendering 2.5D HTML5 Canvas analytical
  survival-horror animations in Thai ("Real Lens" / @real_lens1 style) with HyperFrames
  (lint/check/snapshot/preview/render), Gemini 3.8 Flash TTS, 2-segment FK character rigs,
  HUD telemetry/rule cards, 16:9 MP4 videos, YouTube thumbnails/SEO, or 9:16 vertical Shorts.
---

# Real Lens (@real_lens1) 2.5D Survival Horror & HyperFrames Production Skill

Complete production workflow for **"Real Lens" (@real_lens1)** style analytical survival horror, liminal space, and rules-of-survival animations—built on procedural 2.5D geometric flat-vector Canvas2D rigs, volumetric lighting, quantitative survival math HUDs, unified `gemini-3.8-flash-tts` (`Puck`) narration, and **HyperFrames (`heygen-com/hyperframes`)** deterministic rendering & Studio preview.

---

## 0. Intake & Workspace Bootstrap

Before writing Phase 1 (`episode.js`), confirm with the user (or infer from their prompt):
1. **Plot & Theme Preset:** Theme A (Liminal Space), Theme B (Calculated Disaster / Sub-zero), Theme C (Night Shift Rules), or Custom Setting.
2. **Episode Narrative Archetype & Visual Grammar (Unique per Story!):**
   - Never reuse the same scene progression or camera staging across different episodes. Choose a distinct **Narrative Archetype** (e.g., *Rules Escalation*, *Resource/Physics Depletion*, *Forensic Time-Loop Mystery*, *Stealth & Acoustic Pursuit*, or *Multi-Zone Evacuation*) and define a **Story-Specific Camera Plan** before writing `episode.js`.
3. **Target Scope:** Master `16:9` MP4 only (`~5:30–6:30 min`), or full bundle (`16:9` + `1920x1080` Thumbnails + `EP 1..N <= 60s` Vertical `9:16` Shorts + Covers + SEO).
4. **Gemini API Key(s):** Loaded via `.env` or environment variables (`GEMINI_API_KEYS` comma-separated or `GEMINI_API_KEY`)—**never hardcode API keys in source files**.

### Copy Starter Kit into Project Directory
Copy all files from [`templates/`](./templates/) and [`scripts/`](./scripts/) into the new episode folder, then install dependencies:

```powershell
# PowerShell (Windows)
npm install
$env:GEMINI_API_KEYS = "key_proj1,key_proj2,key_proj3"
```
```bash
# Bash (macOS / Linux)
npm install
export GEMINI_API_KEYS="key_proj1,key_proj2,key_proj3"
```
*(Installing both `ffmpeg-static` and `ffprobe-static` via `templates/package.json` allows `node hf.js check`, `audio`, and `render` to run on Windows without touching global `PATH`. Both `scripts/hf.js` and `scripts/sync_hyperframes.js` also work directly from the skill folder via `process.cwd()`.)*

### Multi-Theme Presets

| Theme Preset | Primary Palette | Telemetry Meter (`drawTele`) | Entity & Shader Helpers (`core.js`) |
| :--- | :--- | :--- | :--- |
| **A. ห้างร้าง / Liminal Space** | `#0B0F19`, `#10B981`, `#EF4444` | `kcal` / `kmax`, `shift`, `distance` | `corridor()`, `drawEntity()` / `drawJanitor()`, `emergency()` |
| **B. ภัยพิบัติคำนวณ (Freeze)** | `#082F49`, `#38BDF8`, `#F97316` | `temp` (°C) or `oxygen` (%) | `frostOverlay()`, `coldBreath: true`, `shiver: true` |
| **C. กฎกะดึก (Night Shift)** | `#162030`, `#FACC15`, `#991B1B` | `db` (ระดับเสียง) or custom `bar` | `coverMouth: true`, `drawEntity({ cap: false })`, `vignette()` |

---

## 1. Visual DNA & Art Direction (Golden Rule)

> ### ⚠️ GOLDEN RULE: แยก "เอนจินภาพ (Visual Engine)" ออกจาก "การดำเนินเรื่องและมุมกล้อง (Story & Camera Identity)"
> 1. **ห้ามคัดลอกพร็อพข้ามเรื่อง:** ต้นฉบับ `backrooms-mall-7days` เป็นเพียงมาตรฐานเอนจิน 2.5D (`core.js`) เท่านั้น **ห้ามคัดลอกพล็อตหรือพร็อพเฉพาะของเรื่องเก่า** (ประตูเหล็กม้วนร้านค้า, ห้องลองเสื้อ, เสา `C-13`, เทปแปะแขน, ขนมปังหมดอายุ 31 ก.พ., ภารโรงถือไม้ถูพื้น) ไปใส่ในเรื่องอื่นเด็ดขาด (`corridor()` และ `drawEntity()` ปิดประตูร้านค้าและไม้ถูพื้นเป็นค่าเริ่มต้นแล้ว)
> 2. **ห้ามใช้แพตเทิร์นมุมกล้องหรือพิกัดตัวละครซ้ำกันทุกเรื่อง:** ห้ามก๊อปปี้ลำดับฉากหรือพิกัด `(x, y, scale)` จาก `views.example.js` ไปใช้ซ้ำตรงๆ แต่ละเรื่องต้องออกแบบ **Staging & Camera Grammar** ของตัวเองตามสภาพแวดล้อมจริง (เช่น เรื่องในทะเลใช้ `outdoorStage({ water: true })`, เรื่องในห้องควบคุมใช้ `roomCorner()` + `cctvOverlay()`, เรื่องวางแผนหลบหนีใช้ `topDownRoom()`)

### 1.1 Authentic Character & POV Rigs ([`templates/core.js`](./templates/core.js))
Always use the canonical functions in `core.js`—never improvise body proportions or face coordinates:
- **Protagonist (`drawPerson` — `1:6.5` Ratio):** `hipY = -92 + by`, `torsoH = 64`, legs `45 + 45`, arms `32 + 30`, continuous trapezius collar slope, `52x62` capsule head shaded with `cyl()`. Customize `colors: { shirt, shirtHi, shirtSh, pants, pantsSh }` per story protagonist so every episode's hero has a distinct outfit!
- **Symmetrical Eyes (`[-10, 10]`):** Dark pupils `#141414` with `1px` white highlight dot, periodic blink `(t % 3.7) < 0.12`, under-eye fatigue crescents `rgba(70,30,20,0.22–0.45)`, and flat stoic mouth (`ellipse` only on `shock`/`fear`).
- **2-Segment FK Poses & Generalized Entity (`drawEntity` / `drawJanitor`):** `poseWalk()` clamps knee flexion via `Math.max(0, ...)` so legs never invert forward (`flamingo` bug). `drawEntity()` defaults to **no mop (`prop: 'none'`) and no cap (`cap: false`)** so threats match your story's lore (only `drawJanitor()` enables mop/cap). Entity arms strictly enforce Z-index layering (`suitSh` far arm $\rightarrow$ prop $\rightarrow$ `suitHi` near arm).
- **Macro POV Forearm (`hand()`):** Strictly `400px` long (`rr(c, -26, 0, 52, 400, 22)`) anchored off the canvas bottom/side edge (`y = 760..820`)—never a short floating arm. Writing/taping macro scenes must tie `ctx.clip()` reveal strictly to the pen/tape tip coordinate.

### 1.2 Multi-Environment Stages & Story-Specific Camera Grammar (`views.js`)
Never use pure `#000000` for night backgrounds/water (causes `ffmpeg blackdetect` failures). Use visible slate-indigo/deep-teak midtones (`#162030`, `#1E293B`, `#283040`, `#3B281B`) across **4 depth planes**.

Instead of defaulting to `corridor()` in every scene, build each story's visual world from `core.js`'s **5 distinct spatial stage builders** + custom Canvas2D geometry:
1. **Open Exterior / Maritime / Wilderness (`outdoorStage(c, t, { water, horizonY, ridgeH })`):** Wide horizon, parallax mountain/city silhouettes, animated water waves, extreme wide shots, or low water-level angles.
2. **2-Point Room / Cabin / Control Booth (`roomCorner(c, { cornerX, topY, botY })`):** Asymmetric two-wall interior corners for claustrophobic rooms, offices, shelters, or ship cabins.
3. **Top-Down / Tactical Blueprint (`topDownRoom(c, { x, y, w, h, grid })`):** Bird's-eye spatial layout for patrol routes, sound-radius rings, flood/heat spread, or room-to-room evasion.
4. **Surveillance / Peephole / Lens POV (`cctvOverlay(c, t, { camLabel })`):** Security camera feeds, submarine periscopes, dashcams, bodycams, or thermal monitors.
5. **1-Point Perspective Tunnel / Hallway (`corridor(c, t, o)`):** Plain industrial tunnels, subway platforms, or parking garages (`parking: true`, `mallShops: true` **only** in malls). Vary camera height (`camH: 0.6` low ground-level vs `camH: 3.4` high security-cam angle) and vanishing point (`vx: 380..900`, `vy: 180..440`) so perspective shots never look identical!
6. **First-Person Macro POV (`hand()`):** Setting-native surfaces (control console, radio transceiver, wet deck, surgical tray, compass) with `ctx.clip()` progressive action.
7. **Split-Screen / Simultaneous Threat View:** Left half showing protagonist's hiding spot (`c.clip()`) while right half shows the threat/hazard approaching in real time.

> **Anti-Repetition Camera Rule:** Never repeat the same camera angle or stage builder for more than 2 consecutive scenes, and never place the protagonist at the exact same `(x, y, scale)` across consecutive scenes.

### 1.3 Mandatory Anti-Distortion & Signature Guardrails
1. **Canonical Signatures:**
   - `prog(t, a, b)` takes `(currentTime, startA, endB)` — **NOT** `(t, start, duration)`!
   - `txt(c, s, x, y, size, col, weight, align, base)` takes numeric `size` (e.g. `24`), **NOT** CSS font strings.
   - Add left-side diagram views to `window.NO_BLUR_VIEWS` so `rackBlur` never blurs key graphics behind right-side HUD cards.
2. **Soft Scene Transitions:** `edgeFade` darkens by `38%` (`rgba(10,14,22,0.38)`), never full black hold.
3. **Pre-Render All-Scene Audit:** Run `node audit_all_scenes.js` and visually inspect `audit_all_scenes.png` with `read_file` before rendering MP4.

---

## 2. Flexible Narrative Archetypes & HUD System (No Cookie-Cutter Scripts!)

Read [`references/visual-and-hud-specs.md`](./references/visual-and-hud-specs.md) for HUD blueprints and theme tokens. **Do NOT force every episode into the exact same scene-by-scene template.** Choose the **Narrative Archetype** that fits the story's premise, and vary the order, frequency, and combination of HUD cards (`rule`, `info`, `inventory`, `math`, `dilemma`, `anomaly`):

| Story Archetype | Core Dramatic Engine | Pacing & HUD Card Mix (Unique Flow) | Signature Visual Camera Style |
| :--- | :--- | :--- | :--- |
| **1. กฎสถานที่ปิด (Rules & Contradiction)** | กฎชุดแรกขัดแย้งกับกฎลับชุดที่สอง ต้องหาว่ากฎข้อไหนเป็นกับดัก | เปิดด้วย `rule` ต่อเนื่อง $\rightarrow$ `anomaly` (พบคนทำตามกฎแล้วตาย) $\rightarrow$ `dilemma` (เลือกเชื่อกฎไหน) $\rightarrow$ เฉลยผู้เขียนกฎ | มุมแอบมองผ่านช่องประตู/หน้าต่าง, `roomCorner()`, `cctvOverlay()`, แสงไฟกะพริบ |
| **2. ภัยพิบัติคำนวณ (Physics & Resource Depletion)** | สู้กับธรรมชาติ/ฟิสิกส์ (หนาวติดลบ, น้ำท่วม, อากาศหมด, เรืออับปาง) ไม่มีผี | เปิดด้วย `info` (ค่าวิกฤตเริ่มต้น) + `inventory` $\rightarrow$ `math` หลายจังหวะตามทรัพยากรที่ลดลง $\rightarrow$ การดัดแปลงอุปกรณ์เอาชีวิตรอด | `outdoorStage()`, `topDownRoom()`, แผนผังฟิสิกส์/ความร้อน/แรงดัน, โคลสอัพเครื่องมือวัด |
| **3. ลูปเวลาและปริศนาสืบสวน (Forensic Loop / Anomaly)** | ติดอยู่ในสถานที่/เวลาเดิมที่เพี้ยนไปทีละจุด ต้องจับผิดรายละเอียดเพื่อหาทางออกจริง | สลับฉากสำรวจกับ `anomaly`/`clue` 3–4 จุด $\rightarrow$ `math` (คำนวณรอบเวลา/รหัส) $\rightarrow$ หักมุมว่าตัวเองคือคนสร้างเบาะแส | เปรียบเทียบมุมกล้องเดิมที่รายละเอียดเปลี่ยนไป, `macro` ส่องหลักฐาน, มุมมองกระจกสะท้อน |
| **4. ซ่อนหาและคลื่นเสียง (Stealth & Acoustic Pursuit)** | ศัตรูใช้เสียง/ความร้อน/แสงในการล่า ต้องเคลื่อนที่ผ่านหลายโซนโดยห้ามเกินขีดจำกัด | เน้น Live `telemetry` (`db` + `distance` ลดลงเรื่อยๆ) $\rightarrow$ `topDownRoom` วางแผนเส้นทาง $\rightarrow$ `dilemma` วินาทีจวนตัว | มุมต่ำระดับพื้นใต้โต๊ะ/ช่องแอร์ (`camH: 0.6`), Split-screen ตัวเอกซ่อน vs ศัตรูเดินผ่าน, OTS ระยะประชิด |

---

## 3. Audio Pipeline (`gemini-3.8-flash-tts` First!)

Read [`references/pipeline-and-tooling.md`](./references/pipeline-and-tooling.md) and [`reallens-audio-director`](../reallens-audio-director/SKILL.md) (for `Puck` voice persona, `atempo=1.12` cadence, procedural SFX/bed catalog, and ducking/sync rules), and use [`templates/generate_audio.js`](./templates/generate_audio.js):
- **TTS Priority (All `voice: "Puck"`, NEVER mix engines mid-video):**
  1. `gemini-3.8-flash-tts` (`/v1beta/interactions` + `speech_metadata`)
  2. `gemini-3.8-flash-lite-tts` (`/v1beta/interactions` + `speech_metadata`)
  3. `gemini-3.1-flash-tts-preview` (`/v1beta/interactions` — **omit `annotations`/`speech_metadata`**)
- **SHA-256 Cache & Mastering:** Caches raw WAVs in `audio/cache/`, auto-wraps RIFF headers, segments Thai subtitles via `Intl.Segmenter('th')` (`<= 36` chars, `{ t0, t1, text }`), mixes procedural foley/ambience with 35% sidechain ducking, and normalizes to **`-18.0 LUFS`**.

---

## 4. HyperFrames Integration Contract (`v0.9.32`)

[`templates/index.html`](./templates/index.html) + [`scripts/sync_hyperframes.js`](./scripts/sync_hyperframes.js) + [`scripts/hf.js`](./scripts/hf.js) enforce 0 errors and 0 warnings across HyperFrames:
1. **Root Composition (`#root`):** `1280x720` @ `24fps` wrapped in `<!-- HF:ROOT_START -->...<!-- HF:ROOT_END -->` (`sync_hyperframes.js` updates `data-duration` & scene `.clip` markers automatically).
2. **Canvas (`#stage`):** Requires `data-layout-ignore` and `data-hold` (`0` false `dead_stretch` warnings).
3. **Scene Markers:** `#scene-XX-<view>` grouped $\le 3$ per `data-track-index` lane with `data-beat="sXX:<view>"`.
4. **Declarative Audio & Local Assets:** `<audio id="master-audio" ... src="audio/master.wav">`, local `@fontsource/kanit` `.woff2` in `assets/fonts/`, local `gsap.min.js` in `assets/vendor/` (no `play()`, `requestAnimationFrame`, or CSS `transition`).
5. **Triple-Adapter Seek Bridge:** Registers `hf-seek`, `window.__timelines['main'] = tl` (registered synchronously before `document.fonts.ready`), `window.renderAtTime`, `window.seekTo`, and reads `window.__hyperframes?.getVariables()`.
6. **Resolution Scaling:** Author at `1280x720`; HyperFrames `--resolution` requires an integer scale multiple (e.g. native `720p`, or `2x` `--resolution 1440p` for `2560x1440`). For exact `1920x1080`, use `node render_mp4.js --1080p` (or FFmpeg Lanczos scale on `master_hf.mp4`).

---

## 5. Deliverables: Key-Scene Thumbnails, Shorts (`EP 1..N <= 60s`), Covers & SEO

Read [`references/shorts-and-thumbnails.md`](./references/shorts-and-thumbnails.md) and use [`templates/generate_thumbnail.js`](./templates/generate_thumbnail.js), [`templates/generate_shorts_overlays.js`](./templates/generate_shorts_overlays.js), [`scripts/shorts_planner.js`](./scripts/shorts_planner.js), [`scripts/render_all_shorts.js`](./scripts/render_all_shorts.js), and [`templates/generate_scene_covers.js`](./templates/generate_scene_covers.js):
- **2 Key-Scene Long-Form Thumbnails (`1920x1080`):** Showdown Split + 5-Panel Strip — `generate_thumbnail.js` selects the highest-tension showdown and 5 dramatic beats via `pickTopLongFormHighlights()`.
- **Dynamic Vertical Shorts (`1080x1920`, `30 fps`, `-14 LUFS`, STRICTLY `<= 60s` per EP):**
  - `scripts/shorts_planner.js` packs scenes with `maxSec = 58s` (never exceeding `60s`), automatically expanding to **`EP 6`, `EP 7`, `EP 8+`** when total duration requires it, and writes `shorts/shorts_plan.json` so overlays, MP4s, and covers stay synchronized.
  - Minimalist `overlay_epX.png`: **ONLY Video Title + Single Red EP Pill** at top (NO yellow header above title, NO 2nd status pill, NO bottom rule card!).
  - Composite via `node render_all_shorts.js` (`--mode letterbox` default keeps full 16:9 HUD cards uncropped; `--mode zoom` for `1.35x` Smart Center Zoom; `--max-sec 58`).
- **Key-Scene Vertical Covers (`EP 1..N`, `1080x1920`):** Extracts each EP's highest-impact climax frame (`scoreSceneDramaticImpact` + `pickKeyTimestampInScene`, with Puppeteer non-black fallback check) and renders Top Headline + Center Climax Frame + Bottom `EP 1..N` Stamp **ONLY** (NO speech bubbles or bottom text boxes).
- **SEO Copywriting:** Long-form YouTube titles + structured timestamps description + Shorts captions & hashtags covering **every planned episode (`EP 1..N`)**.

---

## 6. Mandatory 7-Phase Production Pipeline

```text
[1. Script] ─► [2. Audio] ─► [3. Views+Sync] ─► [4. HF Gate & Grid] ─► [5. MP4] ─► [6. Thumbs/Shorts] ─► [7. Final QA]
episode.js     generate_     views.js           node hf.js check       hf.js render  shorts_planner.js    inspect_video.js
core.js        audio.js      sync_hyperframes   audit_all_scenes.png   render_mp4    thumbs+shorts+covers 16/16 PASS (<=60s)
```

1. **Phase 1 — Script (`episode.js`):** Draft 25–33 scenes (`act: 1..N`, `view`, `vo`, `bed`, `sfx`, `telemetry`, `hud`, plus optional climax metadata `isClimax`, `coverAt`, `coverScore`, `coverHeadline`, `focusX`).
2. **Phase 2 — Audio (`node generate_audio.js`):** Synthesize `Puck` voiceover (`gemini-3.8-flash-tts` first), `-18 LUFS` master, `timeline.json` & `timeline.js`.
3. **Phase 3 — Views & Sync (`views.js`, `node sync_hyperframes.js`):** Implement story-native views, localize fonts & GSAP, sync `index.html`.
4. **Phase 4 — Verification Gate:** Run `node hf.js lint` (`0 errors, 0 warnings`), `node hf.js check`, `node hf.js snapshot --review`, and `node audit_all_scenes.js` $\rightarrow$ inspect `audit_all_scenes.png` visually via `read_file`. Optionally launch `node hf.js preview` for Studio timeline inspection.
5. **Phase 5 — Master Render:** `node hf.js render -f 24 -q looks -o master_hf.mp4` (or `--resolution 1440p` for `2x` DPR, or `node render_mp4.js --1080p` for `1920x1080`).
6. **Phase 6 — Packaging & Shorts:** Run `generate_thumbnail.js`, `generate_shorts_overlays.js`, `render_all_shorts.js`, `generate_scene_covers.js` (keeping `scripts/shorts_planner.js` alongside or invoking from `scripts/`), visually inspect generated covers/thumbnails via `read_file`, and write Long-Form + Shorts (`EP 1..N`) SEO metadata.
7. **Phase 7 — Final QA Gate:** Run `node inspect_video.js master_hf.mp4 --strict` and `node inspect_video.js shorts/<ep>.mp4 --shorts --strict` on rendered episodes $\rightarrow$ verify **`16/16 PASS`**, **`0 Unintended Black Intervals`**, and **every Short `<= 60.0s`**.

---

## 7. Multi-Agent Workflow (Optional for Full Episodes)

For full-episode bundles (`20–33+` scenes, `16:9` + `EP 1..N` Shorts + Covers + SEO), read [`references/multi-agent-workflow.md`](./references/multi-agent-workflow.md) to split work across **4 role-bounded agents** instead of 7 sequential phases:

1. **Director (Main Agent):** Handles Intake, drafts `episode.js`, and runs all mutating CLI steps (`generate_audio.js`, `sync_hyperframes.js`, `hf.js render`, `render_all_shorts.js`).
2. **Canvas2D View Artist (Subagent — Phase 3):** Owns `views.js` + `window.NO_BLUR_VIEWS` from `episode.js` & `core.js` without context bleed from late packaging steps.
3. **Visual & Pipeline QA (Fresh Subagent — Phases 4, 6, 7):** Independently inspects `audit_all_scenes.png`, thumbnails, covers, overlays, and `inspect_video.js --strict` (`16/16 PASS`, `<= 60.0s`) — never the same conversation that wrote `views.js` (max 2 fix loops).
4. **Packaging & SEO Writer (Subagent — Parallel in Phase 5–6):** Generates Long-Form + `EP 1..N` Shorts SEO copy in `seo_package.md` from `timeline.json` & `shorts/shorts_plan.json` while renders run.

*(Keep single-file write locks strict—never let two agents edit `views.js` or `episode.js` simultaneously. Stay single-agent for small edits or quick prototypes, and fall back to sequential self-audit if subagents are unavailable.)*
