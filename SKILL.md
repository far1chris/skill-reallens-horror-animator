---
name: reallens-horror-animator
description: >-
  Use when creating, scripting, rigging, voicing, or rendering 2.5D HTML5 Canvas cinematic
  survival-horror animations in Thai ("Real Lens" / @real_lens1 style) with HyperFrames
  (lint/check/snapshot/preview/render), Gemini 3.8 Flash TTS, 2-segment FK character rigs,
  clean story-only visuals (zero infographic slides/HUD telemetry/red chapter pills),
  16:9 MP4 videos, YouTube thumbnails/SEO, or 9:16 vertical Shorts.
---

# Real Lens (@real_lens1) 2.5D Survival Horror & HyperFrames Production Skill

Complete production workflow for **"Real Lens" (@real_lens1)** style 2.5D survival horror, liminal space, and suspense storytelling animations—built on clean procedural 2.5D geometric flat-vector Canvas2D scenes, volumetric lighting, unified `gemini-3.8-flash-tts` (`Puck`) narration, and **HyperFrames (`heygen-com/hyperframes`)** deterministic rendering & Studio preview.

> **Clean Cinematic Video Rule (NO Infographics / NO Telemetry / NO Red `บทนำ` Pills):**
> Keep inside-story frames **100% clean**: render ONLY pure animated horror artwork + atmosphere + clean frameless subtitles (`drawSub`). **STRICTLY DISABLED inside story videos:**
> - **ห้ามวาดฉากอธิบายแบบอินโฟกราฟิก/สไลด์เลกเชอร์/กระดานลูกศรปลอมตัว** (เช่น กล่องข้อความแบ่งข้อ `1..2..3`, กราฟสรุป, แผนผังความรู้, หรือ **กระดาน/แผ่นเสื่อสี่เหลี่ยมกลางจอ `rr(c, 120, 70, ...)` ที่มีเส้นประลูกศร `setLineDash` + `hand({ marker })` ชี้อธิบาย** — ทุกการกระทำทางกายภาพเช่นผูกเกี๊ยะเปลือกไม้, ตรวจรอยเท้า, หรือหยิบจับวัตถุ ต้องวางบนพื้นดินหรือตัวละครในโลกจริงของฉากเท่านั้น)
> - **ห้ามใส่กล่อง Telemetry มุมขวาบน (`s.telemetry`), การ์ดอธิบาย/กฎ/คณิตศาสตร์/ผังเลือก (`s.hud` / `s.card` -> `drawTele` / `drawCard` / `drawFlow` ปิดเป็นค่าเริ่มต้นแล้ว)**
> - **ห้ามใส่ป้ายแถบสีแดงคำว่า `บทนำ · COLD OPEN` หรือ `องก์ที่ ...` (`drawChapter` ถูกปิดถาวร และห้ามใส่ `chapter:` ใน `episode.js`)**

---

## 0. Intake & Workspace Bootstrap

Before writing Phase 1 (`episode.js`), confirm with the user (or infer from their prompt):
1. **Plot & Theme Preset:** Theme A (Liminal Space), Theme B (Calculated Disaster / Sub-zero), Theme C (Night Shift Rules), or Custom Setting.
2. **Episode Narrative Archetype & Visual Grammar (Unique per Story!):**
   - Never reuse the same scene progression or camera staging across different episodes. Choose a distinct **Narrative Archetype** (e.g., *Rules Escalation*, *Resource/Physics Depletion*, *Forensic Time-Loop Mystery*, *Stealth & Acoustic Pursuit*, or *Multi-Zone Evacuation*) and define a **Story-Specific Camera Plan** before writing `episode.js`.
3. **Target Scope:** Master `16:9` MP4 only (`~5:30–6:30 min`), or **45–60s Vertical Shorts/Reels/TikTok Bundle** (auto-slicing interesting standalone **event clips** inside the story via `format: 'events'`, OR 1 condensed `45–60s` clip, OR max **2 parts** `ตอนที่ 1` + `ตอนจบ` with 3s recap + `1920x1080` Thumbnails + Covers + SEO).
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

### Multi-Theme Atmospheric Palettes

| Theme Preset | Primary Palette | Lighting & Atmosphere (`core.js`) | Entity & Shader Helpers (`core.js`) |
| :--- | :--- | :--- | :--- |
| **A. ห้างร้าง / Liminal Space** | `#0B0F19`, `#10B981`, `#EF4444` | Flickering fluorescent glow, deep depth silhouettes | `corridor()`, `drawEntity()` / `drawJanitor()`, `emergency()` |
| **B. ภัยพิบัติเอาตัวรอด (Freeze / Flood)** | `#082F49`, `#38BDF8`, `#F97316` | Rolling storm/mist lighting, cold vapor & waves | `frostOverlay()`, `coldBreath: true`, `shiver: true`, `outdoorStage()` |
| **C. กฎกะดึก (Night Shift)** | `#162030`, `#FACC15`, `#991B1B` | Heavy slate shadows, tactical beam contrast | `coverMouth: true`, `drawEntity({ cap: false })`, `vignette()` |

---

## 1. Visual DNA & Art Direction (Golden Rule)

> ### ⚠️ GOLDEN RULE: แยก "เอนจินภาพ (Visual Engine)" ออกจาก "การดำเนินเรื่องและมุมกล้อง (Story & Camera Identity)"
> 1. **ห้ามอ่าน ก๊อปปี้ หรือถอดแบบโครงสร้าง `episode.js` / `views.js` ข้ามเรื่องเด็ดขาด:** ห้ามเปิดอ่านหรือลอกสูตรจัดฉาก/มุมกล้องจากเรื่องเก่าบนดิสก์ (ไม่ว่าจะเป็น `backrooms-mall-7days`, `reallens-phi-mae-mai-80s`, `reallens-phi-pao-famine`, `reallens-phi-kong-koi`, `krasue-under-stilts` หรือเรื่องอื่น) รวมทั้งห้ามคัดลอกพร็อพเฉพาะเรื่อง (`rolling shutters`, `C-13`, `fittingRoom`, `31 Feb`, ม็อบถูพื้น, ผ้าปูเล็บแดง, กอหญ้า/กระดานลูกศรเดิม) ไปใส่เรื่องใหม่ (`corridor()` และ `drawEntity()` ปิดประตูร้านค้าและไม้ถูพื้นเป็นค่าเริ่มต้นแล้ว)
> 2. **ห้ามใช้ "สูตรโครงบท + มุมกล้องสยองขวัญซ้ำ" (Zero Repeated Beat Formula):**
>    - **ห้าม** เปิดเรื่องด้วยภาพ ECU อวัยวะ (มือ/เท้า) ยื่นออกจากขอบเสื่อ/ผ้าห่มที่พิกัดคล้าย `(540, 540)` + ไฟ/ตะเกียงส้มมุมซ้ายบน แล้ววนกลับมาจบด้วย ECU จุดเดิม
>    - **ห้าม** ตั้งสูตรสัมภาษณ์พยานผมหงอกนั่งม้านั่งในมุมห้อง `roomCorner()` + ตะเกียงผนังซ้าย ให้เล่าพยานใน **สถานที่จริงตามเนื้อเรื่อง** (เช่น ริมชานเรือนใต้ถุน `drawStiltHouse()`, ริมท่าน้ำ, ทางเดินคันนา, โขดหินริมกองไฟ)
>    - **ห้าม** ใช้เส้นแบ่ง `W/2` สีแดงแบบ `Split-Screen` เป็นท่าคั่นมาตรฐาน ให้สลับไปใช้ **มุม 3-Plane Foreground Occlusion POV** (แอบมองลอดปล้องไม้ไผ่, เสาเรือน, ซี่หน้าต่าง, หรือกิ่งไม้ใกล้เลนส์เข้าไปยังความลึกกลางและหลัง)
> 3. **ห้ามคิดว่ารายชื่อ Stage Builders คือเช็กลิสต์ 7 ข้อที่ต้องใส่ให้ครบทุกเรื่อง:** ออกแบบ **Location-Native Camera Bible** เฉพาะของแต่ละเรื่องตั้งแต่ต้น

### 1.1 Authentic Character & POV Rigs ([`templates/core.js`](./templates/core.js))
Always use the canonical functions in `core.js`—never improvise body proportions or face coordinates:
- **Protagonist (`drawPerson` — `1:6.5` Ratio):** `hipY = -92 + by`, `torsoH = 64`, legs `45 + 45`, arms `32 + 30`, continuous trapezius collar slope, `52x62` capsule head shaded with `cyl()`. Customize `colors: { shirt, shirtHi, shirtSh, pants, pantsSh }` per story protagonist so every episode's hero has a distinct outfit!
- **Symmetrical Eyes (`[-10, 10]`):** Dark pupils `#141414` with `1px` white highlight dot, periodic blink `(t % 3.7) < 0.12`, under-eye fatigue crescents `rgba(70,30,20,0.22–0.45)`, and flat stoic mouth (`ellipse` only on `shock`/`fear`). When `profile`, `flashlight`, `torch`, or `gazeForward` is enabled, `isSideGaze` turns the head cleanly into 3/4 forward gaze aligned with the beam.
- **2-Segment FK Poses & Generalized Entity (`drawEntity` / `drawJanitor`):** `poseWalk()` clamps knee flexion via `Math.max(0, ...)` so legs never invert forward (`flamingo` bug). Torso `lean` pivots cleanly at `hipY` (no detached waist!), and sitting/kneeling arms pass through `clampSitArms()` (pass `rawArms: true` only when holding props up high). Choose the exact grounded pose matching the surface: **`poseFloorSit(t)` / `poseSit(t, { floor: true })`** (`by: 72`) for sitting directly on a floor mat, dirt ground, or by a campfire; **`poseSit(t, { curb: true })`** (`by: 54`) for low logs/steps; **`poseSit(t)`** (`by: 34`) for benches/chairs; **`poseSquat(t)`** (`by: 64`) for deep squats; and **`poseKneel(t)`** (`by: 58`) strictly for low kneeling actions (**NEVER use `poseKneel()` as a substitute for sitting on the ground/mat!**). `drawEntity()` defaults to **no mop (`prop: 'none'`) and no cap (`cap: false`)** so threats match your story's lore (only `drawJanitor()` enables mop/cap). Entity arms strictly enforce Z-index layering (`suitSh` far arm $\rightarrow$ prop $\rightarrow$ `suitHi` near arm).
- **Macro POV Forearm (`hand()`):** Strictly `400px` long (`rr(c, -26, 0, 52, 400, 22)`) anchored off the canvas bottom/side edge (`y = 760..820`)—never a short floating arm. Use `hand()` ONLY for **genuine in-world physical interaction** (holding a flashlight/torch, gripping a knife/rope, opening a latch, touching real mud/bark/grass)—**NEVER for drawing dashed diagram arrows (`setLineDash`) or pointing `marker` at a centered rectangle board/map**.

### 1.2 Multi-Environment Stages & Story-Specific Camera Grammar (`views.js`)
Never use pure `#000000` for night backgrounds/water (causes `ffmpeg blackdetect` failures). Use visible slate-indigo/deep-teak midtones (`#162030`, `#1E293B`, `#283040`, `#3B281B`) across **4 depth planes**.

The stage builders below in `core.js` are **optional setting-appropriate tools—NOT a mandatory checklist**: use ONLY the builders that physically match your episode's real locations:
1. **Open Exterior / Rural / Wilderness (`outdoorStage(c, t, { water, horizonY, ridgeH })` + Rural Thai Builders):** Wide horizon, silhouettes, mist, and waves; for Thai rural settings compose natively with `drawStiltHouse(c, t, o)`, `drawSugarPalm(c, x, y, s, sway)`, `drawRiceClump(c, x, y, s, t, seed, litWarm)`, `drawBananaCluster(c, x, y, s, t)`, and `drawDikeGrass(c, x, y, s, seed, warm)`.
2. **2-Point Indoor Room / Cabin (`roomCorner(c, { cornerX, topY, botY })`):** Strictly for **enclosed interior rooms**—never force outdoor wilderness witnesses into `roomCorner()` just for an interview shot; stage outdoor witnesses on open stilts, riverbanks, campfire clearings, or paddy dikes.
3. **Top-Down Architectural Blueprint (`topDownRoom(c, { x, y, w, h, grid })`):** Strictly for **enclosed walled interiors** (offices, prison cells, control booths)—**NEVER use `topDownRoom()` for outdoor forest camps, clearings, or nature scenes** (walled edges look unnatural outdoors!). For bird's-eye outdoor shots, draw natural terrain/canopy directly without `topDownRoom()`.
4. **Surveillance / Optical Lens POV (`cctvOverlay(c, t, { camLabel })`):** Only when the story actually features security feeds, bodycams, trailcams, or binoculars.
5. **1-Point Perspective Tunnel / Hallway (`corridor(c, t, o)`):** Plain industrial tunnels, subway platforms, or parking garages (`parking: true`, `mallShops: true` **only** in malls). Vary camera height (`camH: 0.6` vs `3.4`) and vanishing point (`vx: 380..900`, `vy: 180..440`).
6. **Setting-Native Physical Action (`hand()` & In-World Framing):** Show tools, bindings, tracks, or clues directly on dirt, water, porch floorboards, or tables inside the live scene—not floating explainer cards.
7. **3-Plane Foreground Occlusion POV (Preferred over `Split-Screen`):** Frame tension by shooting past blurred/dark foreground silhouettes (bamboo culms, timber stilts, foliage fronds, window slats) toward midground characters and background threats rather than slicing frames down `W/2` with red lines.

> **Vertical Camera Pitch & Horizon Diversity Rule (NO 80% Flat Eye-Level `horizonY = 410..460`):**
> Never let an episode fall into flat eye-level side views (`horizonY = 410..460`, characters anchored at `y = 500..560`) across most scenes. Explicitly cycle **vertical pitch & horizon altitude** alongside `cameraRig(c, lt, s.dur, ...)`:
> 1. **Worm's-Eye / Low Ground Pitch (`horizonY = 550..640`):** Camera hugging mud/roots/water/under-stilts looking steeply upward at trees, stilts, or canopy threats.
> 2. **High Steep Diagonal Down-Angle (`horizonY = 120..220`):** Looking steeply downward from treetops, stilt decks, or ridge slopes onto characters/terrain below.
> 3. **Foreground Occlusion Depth:** Heavy foreground silhouettes along `x = 0..220` or `1060..1280` partially hiding or framing the subject.
> 4. **Dutch Angle Tilt (`c.rotate(±0.05..0.08)`):** Subtle horizon roll during panic, disorientation, or sudden discovery beats.
> 5. **Anti-Repetition Guard:** Never repeat the same camera angle, horizon band, or `(x, y, scale)` placement across consecutive scenes, and **never leave a frame static for `> 3s`**.

### 1.3 Mandatory Anti-Distortion & Signature Guardrails
1. **Canonical Signatures:**
   - `prog(t, a, b)` takes `(currentTime, startA, endB)` — **NOT** `(t, start, duration)`!
   - `txt(c, s, x, y, size, col, weight, align, base)` takes numeric `size` (e.g. `24`), **NOT** CSS font strings.
   - Keep `views.js` 100% cinematic storytelling (**NO** infographic explanation diagrams, bullet-point slide panels, or marker-pointing lecture boards!).
2. **Soft Scene Transitions:** `edgeFade` darkens by `38%` (`rgba(10,14,22,0.38)`), never full black hold.
3. **Pre-Render All-Scene Audit:** Run `node audit_all_scenes.js` and visually inspect `audit_all_scenes.png` with `read_file` before rendering MP4 (verify zero infographic slides, zero Telemetry boxes, and zero red `บทนำ` pill banners).

---

## 2. Clean Narrative Storytelling Archetypes (Zero Infographics & Zero Red Pills)

Read [`references/visual-and-hud-specs.md`](./references/visual-and-hud-specs.md) for visual tokens and staging specs. **Do NOT put infographic cards, telemetry boxes, red `บทนำ` pills, or PowerPoint-style lecture diagrams inside the video.** Tell the entire mystery through visual staging, camera grammar, lighting, sound, and clean subtitles:

### 2.1 กฎเหล็กโครงสร้างบทคลิปสั้นใหม่: แบ่งเป็นแต่ละเหตุการณ์ (`45–60s`) หรือจบใน 1 คลิป (ไม่เกิน 2 ตอน)
- **ตัดแบ่งเรื่องน่าสนใจภายในคลิปออกเป็นแต่ละเหตุการณ์ (`45–60 วินาที` ต่อคลิป, `format: 'events'`):** สำหรับเรื่องยาว (`> 60s`) ให้ระบุ `eventId` / `eventTitle` ใน `episode.js` (หรือ `events: [...]` ใน `shorts_config.json`) หรือปล่อยให้ `shorts_planner.js` สแกนคัดจุดพีคแยกออกมาเป็น **`master_hf_event_01.mp4 .. event_NN.mp4`** ที่จบความน่าสนใจในตัวเองภายใน `45–58s`
- **จบใน 1 คลิป (`45–60 วินาที`) หรือไม่เกิน 2 ตอน (`maxEp = 2`) เมื่อทำเรื่องสั้น:** แทนการซอย `EP 3..8+` หากเรื่องสั้น `<= 58s` ให้จบในคลิปเดียว หรือหากเป็นแบบ 2 ตอน **ฉากแรกของ `act: 2` ต้องใส่ `isRecap: true` ทวนความเดิมใน 3 วินาทีแรก (`0.06s` Lead)**
- **High-Retention Shorts Ending (`<= 5s` ท้ายคลิป — ห้ามพูด `"ฝากกดไลก์ กดแชร์ กดติดตาม"` เด็ดขาด!):** ใช้ **(1) คำถามปลายเปิดที่เลือกข้าง** ใน 2–3 วินาทีสุดท้าย, **(2) ปมค้างคา 1 ประโยค / สะพานเชื่อมคลิปยาวหน้าช่อง**, และ **(3) 2s Silent Visual CTA (`drawShortsEndingCTA` ใน `core.js` — แสดงป้ายเล็กๆ มุมซ้ายล่าง + ลูกศรชี้ลง `▼` อัตโนมัติในช่วง 2.25 วินาทีสุดท้ายในโซนปลอดภัย)** เพื่อรักษา Retention และบรรยากาศหลอนโดยไม่ให้คนดูปัดหนี
- `SCENES[0]` เปิดด้วยวินาทีที่เจอความผิดปกติทันที (`COLD_OPEN_LEAD = 0.06s`, ซับคิวแรก `t0 = 0.000s`)

| Story Archetype | Core Dramatic Engine | Clean Narrative Flow (Zero HUD / Zero Infographic) | Signature Visual Camera Style |
| :--- | :--- | :--- | :--- |
| **1. กฎสถานที่ปิด (Rules & Contradiction)** | กฎหรือคำเตือนในสถานที่ขัดแย้งกันเอง จนต้องตัดสินใจว่าความจริงคืออะไร | **0–3s Peak Anomaly Cold Open** (เสียงเคาะ/เงาผิดปกติ) $\rightarrow$ ย้อนเหตุการณ์ $\rightarrow$ พบหลักฐาน/สภาพคนที่ไม่รอด $\rightarrow$ วินาทีเผชิญหน้า & หักมุม | มุมแอบมองผ่านช่องประตู/หน้าต่าง, `roomCorner()`, `cctvOverlay()`, แสงไฟกะพริบ |
| **2. ภัยธรรมชาติ/เอาชีวิตรอด (Survival & Hazards)** | สู้กับภัยรอบตัว (หนาวจัด, น้ำท่วม, ห้องปิดตาย, หลบหนี) แสดงผลผ่านภาพตรง ๆ ไม่ขึ้นกราฟ/สไลด์ | **0–3s Crisis Peak Cold Open** (ลมโหม/น้ำทะลัก/ไฟดับ) $\rightarrow$ ย้อนต้นเหตุ $\rightarrow$ ลงมือแก้สถานการณ์ด้วยวัตถุจริงในฉาก $\rightarrow$ วินาทีรอดหวุดหวิดหรือพลิกล็อก | `outdoorStage()`, `topDownRoom()` (เฉพาะห้องปิดมีผนัง), แสงเงาสิ่งแวดล้อม, โคลสอัพมือจับอุปกรณ์จริง |
| **3. ปริศนาและลูปเวลา (Mystery & Twist)** | รายละเอียดรอบตัวเพี้ยนไปทีละนิด ต้องสังเกตเบาะแสจากฉากและวัตถุ | **0–3s Paradox Twist Cold Open** (พบวัตถุ/ตั๋ว/ข้อความผิดเวลา) $\rightarrow$ ย้อนสำรวจจุดเกิดเหตุ $\rightarrow$ เบาะแสเปลี่ยนไปทีละฉาก $\rightarrow$ เฉลยหักมุม | เปรียบเทียบมุมกล้องเดิมที่รายละเอียดเปลี่ยนไป, `hand()` ถือวัตถุจริง, มุมมองกระจกสะท้อน |
| **4. ซ่อนหาและไล่ล่า (Stealth & Pursuit)** | ภัยคุกคามคืบคลานเข้าใกล้ ต้องซ่อนตัวและคุมจังหวะหนีในความมืด | **0–3s Close-Call Peak Cold Open** (เสียงฝีเท้า/เงาประชิด) $\rightarrow$ ย้อนที่มา $\rightarrow$ ลอบเคลื่อนที่ผ่านหลายโซน $\rightarrow$ เผชิญหน้าฉากจบ | มุมเสยต่ำจากพื้น/ใต้โต๊ะ (`camH: 0.6`), มุมแอบมองลอดสิ่งกีดขวาง 3-Plane Foreground Occlusion, OTS ระยะประชิด |

---

## 3. Audio Pipeline (`gemini-3.8-flash-tts` First!)

Read [`references/pipeline-and-tooling.md`](./references/pipeline-and-tooling.md) and [`reallens-audio-director`](../reallens-audio-director/SKILL.md) (for `Puck` voice persona, `atempo=1.12` cadence, procedural SFX/bed catalog, and ducking/sync rules), and use [`templates/generate_audio.js`](./templates/generate_audio.js):
- **Strict Narrator Vocal Tone Lock (`Puck`, Single `lockedModelId` per Episode) + Character & Impersonation Exceptions:**
  1. `gemini-3.8-flash-tts` (`/v1beta/interactions` + locked baritone `NARRATOR_STYLE` `speech_metadata`)
  2. `gemini-3.8-flash-lite-tts` (`/v1beta/interactions` + `speech_metadata`)
  3. `gemini-3.1-flash-tts-preview` (`/v1beta/interactions` — **omit `annotations`/`speech_metadata`** and pass `{ type: 'audio' }`)
  - **Main Narrator Locked (`role: 'narrator'` default):** Always uses `VOICE_NAME = 'Puck'` and identical `NARRATOR_STYLE` (per-scene `voice` overrides on narrator lines are forbidden), strips pitch-spiking punctuation via `sanitizeVoForTTS(text, 'narrator')`, tightens dynamics with `dynaudnorm` + `3.8:1` compression, and applies **Two-Pass Linear EBU R128 `loudnorm` (`-18.0 LUFS`, `LRA=3.5`)**.
  - **Explicit Exceptions (`ตัวละครอื่น` & `ตอนทำเสียงเป็นคนอื่น`):** Only allow different voices/presets when explicitly tagged for **other characters** (`role: 'character'`, `speaker: 'yai_nuan' | 'female' | 'boss' | ...`, or `episode.CHARACTER_VOICES`) or **narrator impersonations** (`role: 'impersonate'`, `impersonate: '...'`, `voicePreset: 'sweet_sales' | 'elder' | 'deep' | 'whisper_ghost' | 'phone_speaker'`). Supports mixed-role scenes via `voSegments`, inline `[[char:id|...]]` / `[[impersonate:desc|...]]` tags, or speech-verb quotes (`พูดว่า "..."`), while `stripVoMarkupForSubs()` keeps subtitles 100% clean.
- **AI Pronunciation & Clarity Detector (`normalizeThaiForTTS`, `inspectVoClipClarity`, `audio/pronunciation_report.json`):** Expands numbers/units/time/English acronyms (`LINE`, `CCTV`, `2,490 บ.`, `03:14 น.`, `episode.PRONUNCIATION_MAP`, `scene.ttsVo`) to phonetic Thai for Gemini TTS without altering subtitles; inspects every clip for skipped/truncated speech, dropouts, mumbled endings, or muffled audio, auto-retries failed takes (`--fix-unclear` / `--verify-asr` multimodal ASR round-trip, `--audit-only` for free existing checks), and writes `audio/pronunciation_report.json` verified by `inspect_video.js`.
- **SHA-256 Cache, Fast-Cut Subtitles & Dual-Bus Mastering:** Caches raw WAVs per segment in `audio/cache/` (keyed by `voice|style|ttsText`), auto-wraps RIFF headers, segments Thai subtitles via `Intl.Segmenter('th')` (`maxLen = 24`, `<= 26` chars, `t0 = 0.00s` on cold-open/act-opener, rendered in `core.js` with `0.09s` Pop-In bounce + yellow/red keyword highlight), uses **Dual-Bus Sidechain Ducking** (`bedMix` 42% ducking vs. `impactSfxMix` `<= 10%` ducking so stings/booms punch through speech), tight scene pacing (`LEAD = 0.06s` cold-open / `0.20s` normal, `pad = 0.28s`), and normalizes to **`-18.0 LUFS`**.

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

## 5. Deliverables: Key-Scene Thumbnails, Standalone / Max 2-EP Shorts (`45–60s`), Covers & SEO

Read [`references/shorts-and-thumbnails.md`](./references/shorts-and-thumbnails.md) and use [`templates/generate_thumbnail.js`](./templates/generate_thumbnail.js), [`templates/generate_shorts_overlays.js`](./templates/generate_shorts_overlays.js), [`scripts/shorts_planner.js`](./scripts/shorts_planner.js), [`scripts/render_all_shorts.js`](./scripts/render_all_shorts.js), and [`templates/generate_scene_covers.js`](./templates/generate_scene_covers.js):
- **2 Key-Scene Long-Form Thumbnails (`1920x1080`):**
  - **Primary Poster Showdown (`thumbnail_reallens_showdown.png`):** Left-Third 4-Layer Poster Stack over a left-to-right dark scrim — **(1)** Teal Series + Channel Kicker `● [ชื่อซีรีส์] · @WaoRueangLhon` (`channelHandle` defaults to `@WaoRueangLhon`), **(2)** Giant Pure White Line 1 (`<= 14–16` chars, `Kanit 900`), **(3)** Giant Crimson Line 2 (`titleRedLine: 2` default, ending in `?!`/`!`, dynamic Thai diacritic clearance), **(4)** Sharp rectangular `#dc2626` Red Emotional/Twist Sub-Hook box (`0px` corners) — paired with **Right-Half Dual-Anchor Horror Art** (upper-right glowing-eyed ghost/entity silhouette + cold rim light + lower-right iconic story prop, configured via `packaging.json`, clear of YouTube's bottom-right timestamp, zero bullseye rings).
  - **3-Panel Wide Cinematic Triptych (`thumbnail_reallens_5panel.png`):** 3 wide `640px` escalation panels with glowing `#DC2626` dividers via `pickTopLongFormHighlights(scenes, 3)`.
- **Full-Screen Vertical Shorts (`1080x1920`, `30 fps`, `-14 LUFS`, `45–60s` Event Cuts / Standalone / Max 2 EPs):**
  - `scripts/shorts_planner.js` automatically extracts interesting **45–58s event cuts** (`format: 'events'` default when total runtime `> 58s`, or `cfg.events` / `s.eventId`), packs `<= 58s` stories into 1 standalone clip (`--format single`), or splits into max 2 parts (`--format two_part` with `isRecap: true` 3s recap) and writes `shorts/shorts_plan.json` (ZERO leading `EP` / `เหตุการณ์ #` / `จบในคลิป:` prefix!).
  - Transparent `overlay_event_01.png` / `overlay_single.png`: **ONLY subtle top scrim + clean 2-Line Two-Tone Stacked Title (`titleTop` @ `y: 262` + `titleBot` @ `y: 368`, `#EF4444` Red / `#FFFFFF` White with `16px` black stroke)** while `y = 430..1920` stays 100% transparent — **NO red/orange pill/box bar below the headline!**
  - Render full-screen in parallel via `node render_all_shorts.js` (default `--mode fullscreen`, `--format events|single|two_part|both|all`, `--events-only`, `--max-sec 58`, `--min-sec 45`, `--ep N`).
- **Full-Screen Vertical Covers (`1080x1920`):** Force-hides **ALL HUD & top-right Telemetry (`__HIDE_HUD = true` + direct stub/guard inside `core.js`)** before capturing full-bleed 9:16 climax art, and composites **Top 2-Line Two-Tone Title (`titleTop` @ `y: 228` + `titleBot` @ `y: 336`, `#EF4444`/`#FFFFFF`) + Fitted Sharp Rectangular Red Sub-Hook Tag Box (`subHook` spaced clearly below Line 2 @ `y >= 418`, `#dc2626`)** over poster-lit full-bleed scene artwork (auto hero-focus & eerie teal/crimson rim glow) — **STRICTLY DISABLED on covers: all viewfinder frames & corner brackets (both yellow square border AND 4 red corner L-brackets), top-right Telemetry HUD box, bottom EP/event stamp (`เหตุการณ์ #1–#5`, `EP 1`, `EP 2 (จบ)`, `จบใน 1 คลิป`), and bottom yellow-red gradient bar**.
- **SEO Copywriting (Short Clip/Event Title First — NO leading `EP` or `เหตุการณ์ #`, `<= 38–45` chars + Exact Series Suffix Rule):** เอาชื่อคลิปหรือชื่อเหตุการณ์สั้นๆ เข้าใจง่ายขึ้นหน้าสุดทันที (**ห้ามขึ้นต้นด้วย `EP 1:`, `เหตุการณ์ #1:`, `ตอนที่ 1:`, หรือ `จบในคลิป:`**) ความยาว `<= 38` ตัวอักษร (45 ตัวอักษรสำหรับ Long-Form) แล้วต่อท้ายด้วย **`| [ชื่อซีรีส์]`**:
  - Shorts แบ่งตามเหตุการณ์ / จบใน 1 คลิป (`45–60s`, แนะนำ): **`[ชื่อเหตุการณ์/จุดพีคสั้นเข้าใจง่าย <= 38 ตัวอักษร] | [ชื่อซีรีส์]`** *(เช่น `ใครเคาะกระจกตีหนึ่ง?! | กฎกะดึกสถานีสายสุดท้าย`)*
  - Shorts แบบ 2 ตอน (กรณีแบ่ง 2 ตอน ห้ามเกิน 2 ตอน): **`[ชื่อคลิปตอนเปิด <= 38 ตัวอักษร] | [ชื่อซีรีส์]`** และ **`[ชื่อคลิปตอนสรุป <= 32 ตัวอักษร] (ตอนจบ) | [ชื่อซีรีส์]`**

---

## 6. Mandatory 7-Phase Production Pipeline

```text
[1. Script] ─► [2. Audio] ─► [3. Views+Sync] ─► [4. HF Gate & Grid] ─► [5. Long-Form MP4 + QA] ─► [⏸️ User Review] ─► [6. Shorts + Covers] ─► [7. Shorts QA]
episode.js     generate_     views.js           node hf.js check       hf.js render + inspect      ตรวจคลิปยาวก่อน      shorts_planner.js        inspect_video.js
core.js        audio.js      sync_hyperframes   audit_all_scenes.png   master_hf.mp4 + 16:9 thumb  รอคำสั่งทำคลิปสั้น    render_all_shorts.js     --shorts --strict
```

1. **Phase 1 — Script (`episode.js`):** Target **1 standalone `45–60s` complete story (`act: 1`)** or **max 2 acts (`act: 1` + `act: 2` with `isRecap: true` 3s recap in Part 2)**. `SCENES[0]` MUST open within `0–3s` directly at the peak anomaly/twist (`isClimax: true`); `TITLE` MUST follow `[ประโยคคำถาม/จุดระทึก <= 40 ตัวอักษร] | [ชื่อซีรีส์]`.
2. **Phase 2 — Audio (`node generate_audio.js`):** Synthesize `Puck` voiceover (`gemini-3.8-flash-tts` first), `-18 LUFS` master, `timeline.json` & `timeline.js`.
3. **Phase 3 — Views & Sync (`views.js`, `node sync_hyperframes.js`):** Implement story-native views, localize fonts & GSAP, sync `index.html`.
4. **Phase 4 — Verification Gate:** Run `node hf.js lint` (`0 errors, 0 warnings`), `node hf.js check`, `node hf.js snapshot --review`, and `node audit_all_scenes.js` $\rightarrow$ inspect `audit_all_scenes.png` visually via `read_file`. Optionally launch `node hf.js preview` for Studio timeline inspection.
5. **Phase 5 — Long-Form Master Render & QA:** Run `node hf.js render -f 24 -q looks -o master_hf.mp4` (or `--resolution 1440p` / `node render_mp4.js --1080p`), `node generate_thumbnail.js` (16:9 thumbnails), and `node inspect_video.js master_hf.mp4 --strict` (`16/16 PASS`).
   - **⏸️ MANDATORY USER REVIEW GATE (ตรวจคลิปยาวก่อนทำคลิปสั้น):** หลังจากเรนเดอร์และตรวจ `master_hf.mp4` เสร็จแล้ว **ให้หยุดส่งคลิปยาว (และปก 16:9) ให้ผู้ใช้ตรวจสอบและอนุมัติก่อนเสมอ ห้ามรัน `generate_shorts_overlays.js`, `render_all_shorts.js`, หรือ `generate_scene_covers.js` อัตโนมัติจนกว่าผู้ใช้จะสั่งให้ทำคลิปสั้นต่อ** *(ยกเว้นกรณีผู้ใช้สั่งทำเฉพาะคลิปสั้นตั้งแต่ต้น)*
6. **Phase 6 — Shorts Packaging & Covers *(รันหลังผู้ใช้ตรวจคลิปยาวและสั่งให้ทำต่อเท่านั้น)*:** Run `generate_shorts_overlays.js`, `render_all_shorts.js`, and `generate_scene_covers.js` (keeping `scripts/shorts_planner.js` alongside or invoking from `scripts/`), visually inspect generated covers via `read_file`, and write Long-Form + Shorts SEO metadata.
7. **Phase 7 — Final Shorts QA Gate:** Run `node inspect_video.js shorts/<ep>.mp4 --shorts --strict` on rendered Shorts $\rightarrow$ verify **`16/16 PASS`**, **`0 Unintended Black Intervals`**, and **every Short `<= 60.0s`**.

---

## 7. Multi-Agent Workflow (Optional for Full Episodes)

For full-episode bundles (`20–33+` scenes, `16:9` + `EP 1..N` Shorts + Covers + SEO), read [`references/multi-agent-workflow.md`](./references/multi-agent-workflow.md) to split work across **4 role-bounded agents** instead of 7 sequential phases:

1. **Director (Main Agent):** Handles Intake, drafts `episode.js`, and runs all mutating CLI steps (`generate_audio.js`, `sync_hyperframes.js`, `hf.js render`, `render_all_shorts.js`).
2. **Canvas2D View Artist (Subagent — Phase 3):** Owns `views.js` + `window.NO_BLUR_VIEWS` from `episode.js` & `core.js` without context bleed from late packaging steps.
3. **Visual & Pipeline QA (Fresh Subagent — Phases 4, 6, 7):** Independently inspects `audit_all_scenes.png`, thumbnails, covers, overlays, and `inspect_video.js --strict` (`16/16 PASS`, `<= 60.0s`) — never the same conversation that wrote `views.js` (max 2 fix loops).
4. **Packaging & SEO Writer (Subagent — Parallel in Phase 5–6):** Generates Long-Form + `EP 1..N` Shorts SEO copy in `seo_package.md` from `timeline.json` & `shorts/shorts_plan.json` while renders run.

*(Keep single-file write locks strict—never let two agents edit `views.js` or `episode.js` simultaneously. Stay single-agent for small edits or quick prototypes, and fall back to sequential self-audit if subagents are unavailable.)*
