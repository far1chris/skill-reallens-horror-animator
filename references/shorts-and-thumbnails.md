# YouTube Packaging, Key-Scene Thumbnails & `<= 60s` Vertical Shorts Guide

This reference documents the complete packaging workflow for **Key-Scene 16:9 YouTube Thumbnails**, **Long-Form YouTube SEO Metadata**, **Standalone `45–60s` 9:16 Vertical Shorts (or max 2 EPs: `EP 1` ตอนที่ 1 + `EP 2` ตอนจบ)**, and **Full-Screen Vertical Covers (`1080x1920`)**.

> **Production Templates & Scripts:** Use [`scripts/shorts_planner.js`](../scripts/shorts_planner.js), [`templates/generate_thumbnail.js`](../templates/generate_thumbnail.js), [`templates/generate_shorts_overlays.js`](../templates/generate_shorts_overlays.js), [`scripts/render_all_shorts.js`](../scripts/render_all_shorts.js), and [`templates/generate_scene_covers.js`](../templates/generate_scene_covers.js).

---

## 1. Key-Scene Long-Form YouTube Thumbnails (`1920x1080`, `16:9`)

Generate **2 high-CTR variants** via [`templates/generate_thumbnail.js`](../templates/generate_thumbnail.js) using [`scripts/shorts_planner.js`](../scripts/shorts_planner.js) (`pickTopLongFormHighlights` + `pickKeyTimestampInScene`) so covers always spotlight dramatic danger/climax beats instead of blind fixed timestamps (always fine-tune the hero composition via `packaging.json` + `episode.js` fields `isClimax`, `coverScore`, `focusX`, `CHANNEL_HANDLE`):

### Variant 1 (Primary Default): Cinematic Horror Poster Showdown (`thumbnail_reallens_showdown.png`)
- **Right-Half Dual-Anchor Horror Framing (Ghost/Threat + Foreground Story Prop):**
  - Pick the episode's most iconic eerie scene (`showdownView`, `showdownLt`, `focusX ≈ 720–760`, `coverZoom ≈ 1.28`) that stages **two strong horror cues on the right half (`x ≈ 1120..1920`)**:
    1. **Upper-Right Eerie Threat Silhouette:** Tall dark ghost/entity with **glowing crimson eyes** framed clearly through a window/doorway/corridor depth beside a high-contrast cold rim light (e.g. full moon, flickering neon, lantern) — **never hidden behind left typography**.
    2. **Lower-Right Iconic Story Prop:** Bright, unmistakable foreground object carrying the episode's hook (e.g. red-painted toes peeking under a mosquito net, glowing anomaly, cursed sign), kept cleanly above/clear of YouTube's bottom-right timestamp badge.
  - Applies vivid horror grading (`contrast(1.22) saturate(1.28) brightness(1.07)`), eerie **Teal-Emerald + Crimson backlight rim aura**, drifting mist wisps, floating glowing spores, and perimeter vignette.
- **Left-Third 4-Layer Poster Typography Stack (`x: 96`, over left-to-right dark scrim `0..1180px`):**
  1. **Teal Series + Channel Handle Kicker (`y: 245`, `#5EEAD4`, `Kanit 700`, `32px`):** `●  [ชื่อซีรีส์] · @WaoRueangLhon` — automatically appends `channelHandle` (defaults to **`@WaoRueangLhon`**, customizable via `packaging.json` `channelHandle` or `episode.js` `CHANNEL_HANDLE`).
  2. **Line 1 — Pure White Giant Action Hook (`y: 390`, `#FFFFFF`, `Kanit 900`, up to `146px`, `~16%` black stroke + deep shadow):** Ultra-short concrete visual hook (`<= 14–16` Thai chars, e.g. `ทาเล็บแดงนอน`).
  3. **Line 2 — Giant Crimson Punchline / Question (`titleRedLine: 2` default, `#EF4444`, `Kanit 900`, dynamic Thai diacritic clearance):** Punchy chilling question/twist ending in `?!` or `!` (`<= 14–16` Thai chars, e.g. `กันผีแม่ม่าย?!`).
  4. **Sharp Rectangular Crimson Sub-Hook Tag Box (`y >= 625`, `#dc2626`, `h: 68`, `padX: 38`, sharp `0px` corners, white `Kanit 800`):** Emotional contrast or twist teaser that triggers the click (e.g. `ความจริงเศร้ากว่าผีหลายเท่า!`). ZERO dashed bullseye rings, ZERO rounded pill bars, ZERO Telemetry/Rule boxes.

#### Recommended `packaging.json` Blueprint for Every Long-Form Episode
```json
{
  "title": "ทำไมผู้ชายยุค 80 ต้องทาเล็บแดงนอน?! | ถอดรหัสผีแม่ม่าย",
  "channelHandle": "@WaoRueangLhon",
  "seriesName": "ถอดรหัสผีแม่ม่าย",
  "titleTop": "ทาเล็บแดงนอน",
  "titleBot": "กันผีแม่ม่าย?!",
  "titleRedLine": 2,
  "subHook": "ความจริงเศร้ากว่าผีหลายเท่า!",
  "showdownView": "window_shadow_red_toes",
  "showdownLt": 4.2,
  "focusX": 735,
  "focusY": 350,
  "panels": [
    { "num": "1", "label": "เปิดปมสยอง", "view": "scene_hook", "lt": 5.2, "focusX": 620 },
    { "num": "2", "label": "บรรยากาศหลอน", "view": "scene_mid", "lt": 4.0, "focusX": 620 },
    { "num": "3", "label": "เฉลยความจริง", "view": "scene_twist", "lt": 7.2, "focusX": 600 }
  ]
}
```
*(When `seriesName` does not already contain `@` or `·`, `generate_thumbnail.js` automatically formats the teal kicker as `● [seriesName] · [channelHandle]` using `@WaoRueangLhon` by default.)*

### Variant 2: 3-Panel Wide Cinematic Escalation Triptych (`thumbnail_reallens_5panel.png`)
- Divides the upper `1920x760` stage into **3 wide cinematic panels (`640px` wide each)** (Hook $\rightarrow$ Escalation $\rightarrow$ Peak Twist) with auto hero-centering (`1.24x` zoom), teal/crimson rim glow, glowing `#DC2626` dividers, clean corner step badges `1`–`3`, and a bold bottom 2-tone headline + sharp red sub-hook box.
- **Non-Black Sanity Check & Visual QA:** Logs canvas region luminance after rendering to catch dim/unlit views immediately, and ALWAYS visually inspect `thumbnail_reallens_showdown.png` via `read_file` to verify zero text-on-ghost overlap and crisp Thai vowel clearance.

---

## 2. Long-Form YouTube SEO Package Template

Always deliver the complete YouTube publish package alongside the 16:9 master video:

### 2.1 3 High-CTR Title Options (กระชับใจความใน 45 ตัวอักษรแรก)
**กฎการตั้งชื่อคลิป:** เอา **ประโยคคำถามหรือจุดระทึกไว้หน้าสุด** และ **จบใจความสำคัญให้ได้ภายใน 45 ตัวอักษรแรก** จากนั้นต่อท้ายด้วย **`| [ชื่อซีรีส์เหมือนกันเป๊ะทุกตอน]`** เพื่อไม่ให้ข้อความสำคัญโดนตัดคำบนหน้าฟีดมือถือและให้ผู้ชมจำชื่อซีรีส์ได้สม่ำเสมอ:
1. **Question / Anomaly Peak Hook:** `[คำถาม/จุดผิดปกติพีคสุด <= 45 ตัวอักษร] | [ชื่อซีรีส์]`
   *(เช่น `ทำไมเข็มน้ำมันเด้งกลับไปตัว F ตอนตีสาม?! | ปั๊มน้ำมันร้างกลางหมอก`)*
2. **Rule / Survival Crisis Hook:** `[วินาทีวิกฤต/เสียงเคาะประตู <= 45 ตัวอักษร] | [ชื่อซีรีส์]`
   *(เช่น `เสียงเคาะประตูดังจากห้องที่ไม่มีคนอยู่?! | ปั๊มน้ำมันร้างกลางหมอก`)*
3. **Quantitative Math Twist Hook:** `[ตัวเลขวิกฤต/จุดหักมุม <= 45 ตัวอักษร] | [ชื่อซีรีส์]`
   *(เช่น `ออกซิเจนเหลือ 30 วิ แต่ประตูหนีไฟล็อก?! | กฎกะดึกสถานีสายสุดท้าย`)*

### 2.2 Structured YouTube Description Template
```markdown
[บรรทัดที่ 1–2: วินาทีพีคเปิดคลิป (0–3 วินาทีแรก) ที่บีบคั้นหัวใจ + คำถามชวนคิด]

[ย่อหน้าที่ 2: ย้อนที่มาและอธิบายปริศนาเชิงตรรกะ/การคำนวณที่ตัวเอกต้องใช้เอาชีวิตรอด (โดยไม่สปอยล์จุดหักมุมท้ายเรื่อง)]

⏱️ สารบัญเวลา (Timestamps)
00:00 วินาทีพีค: จุดผิดปกติแรก (3 วินาทีแรก)
00:XX ย้อนเล่าที่มาและกฎข้อที่ 1
0X:XX องก์ที่ 2: [ชื่อตอน]
0X:XX องก์ที่ 3: [ชื่อตอน]
0X:XX องก์ที่ 4: [ชื่อตอน]
0X:XX องก์ที่ 5: [บทสรุปและจุดหักมุม]

⚠️ กฎการเอาชีวิตรอดในตอนนี้:
• กฎข้อ 1: ...
• กฎข้อ 2: ...
• กฎข้อ 3: ...

#[ชื่อซีรีส์] #RealLens #กฎเอาชีวิตรอด #เรื่องเล่าหลอน #อนิเมชั่นสยองขวัญ
```
- **Tags (10–15 tags):** เรื่องเล่าหลอน, กฎเอาชีวิตรอด, อนิเมชั่นสยองขวัญ, Real Lens, เอาชีวิตรอดด้วยตรรกะ, เรื่องผี 2.5D, Liminal Space, Rules of Survival, [คีย์เวิร์ดเฉพาะสถานที่ในเรื่อง].
- **Pinned Comment:** คำถามชวนคอมเมนต์เกี่ยวกับทางเลือกในนาทีวิกฤต (`"ถ้าคุณเจอเหตุการณ์นี้ตอน ... น. คุณจะเลือก [A] หรือ [B]?"`).

---

## 3. Event-Cut (`45–60s`), Standalone & Max 2-EP Vertical Shorts System

### 3.1 `scripts/shorts_planner.js` — Interesting Event Extraction (`45–60s`), Standalone & Max 2-EP Cap
Every vertical YouTube Shorts / TikTok / Reels clip MUST stay **within `45–60s`** (`minSec = 45s`, `maxSec = 58s` safety margin):
- **Event-Based Cuts (`format: 'events'`, default when full episode `> 58s`):** Automatically extracts distinct interesting events inside a full story (`45–58s` per clip) via explicit `cfg.events` / scene `eventId` tags or `autoPickEventArcs()`, giving each event its own standalone title & cover (`overlay_event_01.png`, `cover_event_01.png`, `master_hf_event_01.mp4`) without serialized EP numbering.
- **Standalone 1-Clip (`format: 'single'`, default when `<= 58s`):** Keeps Hook + Setup + Twist + Resolution cleanly in 1 self-contained `45–58s` clip (`overlay_single.png`, `cover_shorts_single.png`).
- **Max 2-Part Split (`format: 'two_part'`):** Caps serialized splits at max 2 parts (`isRecap: true` 3s recap required at the start of Part 2).
- Saves the unified schedule to `shorts/shorts_plan.json` (`isEvent`, `isSingle`, `tag`, `titleTop`, `titleBot`, `titleRedLine`, `feedTitle`, with empty `stampLeft: ""`, `stampRight: ""`) so overlays, renders, and covers stay synchronized.
- Optional hints in `episode.js` (top-level or per-scene) give writers full manual control:
  - `eventId` / `eventTitle` — group scenes into explicit interesting events (`45–60s` each) with custom event names.
  - `shortsTitle` / `titleRedLine` (`1 | 2`) — explicit short 2-line clip title & which line renders in `#EF4444` Red.
  - `isClimax: true` — prioritizes scene for Shorts covers & Showdown thumbnail (`0.06s` lead).
  - `isRecap: true` — marks the Part 2 opener so `generate_audio.js` starts immediately at `0.06s` and `inspect_video.js` verifies the 3s recap.
  - `coverAt: <secFromSceneStart>` — exact peak moment inside the scene to capture.
  - `coverScore: <number>` — explicit priority score (`0–100+`) over heuristic scoring.
  - `coverHeadline: [titleTop, titleBot]` — custom 2-line punchy Thai cover hook for that scene.
  - `focusX: <0..1280>` — horizontal subject center for full-screen Shorts panning & 5-panel crops.

### 3.2 Clean Minimalist Transparent Overlay Spec (`shorts/overlay_*.png`)
Generated by [`templates/generate_shorts_overlays.js`](../templates/generate_shorts_overlays.js) for the planned clip(s) over **transparent `1080x1920` (no black top/bottom letterbox bars!)** matching clean full-screen vertical video styling:
- ✅ **Soft Top Readability Scrim (`y: 0..430`):** Subtle transparent dark vignette fading smoothly to 0% alpha at `y = 430` (`y = 430..1920` stays 100% transparent).
- ✅ **2 Stacked Two-Tone Title Lines (`titleTop` @ `y: 262` + `titleBot` @ `y: 368`):** Giant `Kanit 900` with thick `16px` `#000000` outer stroke & shadow, alternating **`#EF4444` (Red)** and **`#FFFFFF` (White)** lines (`titleRedLine: 1 | 2`) — **always lead directly with short understandable clip/event title!**
- ❌ **STRICTLY DISABLED ON `overlay_*.png`:**
  - **ปิดแถบ Pill สีแดง/ส้มใต้พาดหัวทั้งหมด (ห้ามวาดแคปซูลหรือกล่องสีแดง/ส้มใต้หัวข้อ)**
  - **ห้ามขึ้นต้นด้วย `EP 1`, `เหตุการณ์ #1`, `ตอนที่ 1`, หรือ `จบในคลิป:` บนหัวคลิป**
  - **ห้ามใส่แถบดำทึบหัว-ท้าย, ข้อความหมวดหมู่สีเหลืองเหนือชื่อคลิป, หรือกล่องสรุปกฎด้านล่างของจอ**

### 3.3 Full-Screen 9:16 Vertical Rendering (`scripts/render_all_shorts.js`)
Supports native `1080x1920` full-screen rendering by default (`--format events|single|two_part|both|all`, `--events-only`, `--concurrency 2`, `--ep <N>`):
- **Default (`--mode fullscreen`):** Renders `index.html?shorts=1` natively at **`1080x1920` full-bleed** via `setShortsMode(true)` + `beginShortsWorld()` (`SHORTS_SX = 1.50` horizontally tracking `focusX`, `SHORTS_SY = 2.6667` vertically, with `SHORTS_CHAR_SCALE = 1.85` keeping character proportions 1:1), keeps the canvas clean (NO Telemetry boxes or HUD cards), positions subtitles at `y: 1500` inside the UI Safe Zone, and composites `overlay_*.png` cleanly on top. Falls back cleanly to focal `--mode crop` when rendering standalone MP4s without `index.html`/Puppeteer.
- **Alternative (`--mode crop`):** Focal FFmpeg `scale=1080:1920:force_original_aspect_ratio=increase` cropped around `focusX` + overlay.
- **Legacy (`--mode letterbox` / `--mode zoom`):** Optional 3-layer centered `1080x608` framing over a blurred background if explicitly requested.
- **Audio, FPS & Duration Guard:** Renders at **`30 fps`**, **`48 kHz`** AAC, **`-14.0 LUFS`** (`loudnorm=I=-14.0:LRA=7.0:TP=-2.2` + `alimiter`), and rejects any clip `> 60.0s` (`inspect_video.js --shorts --strict` enforces `totalSec <= 60.0s` unless explicitly waived with `--allow-over-60`).

---

## 4. Key-Scene Vertical Shorts Covers (`1080x1920`, `9:16`)

[`templates/generate_scene_covers.js`](../templates/generate_scene_covers.js) captures **HUD-free** full-screen climax frames (`window.__HIDE_HUD = true` + temporary no-op stubbing of `drawTele`, `drawChapter`, `drawCard`, `drawFlow`, `drawSub`, `drawHud` directly during extraction, plus `hudBaked` center-crop clamp when falling back to master MP4), checks brightness (`meanLuma >= 12`), automatically locates the focal hero subject (`analyzeHeroSubject` + auto cover zoom `1.07x–1.42x` centering the entity/climax around `y = 1075` instead of leaving empty dark sky), and renders:
1. **Top 2-Line Two-Tone Title (`y: 228` & `y: 336`):** Bold `Kanit 900` `#EF4444` / `#FFFFFF` lines with `12px+` `#000000` stroke over subtle top scrim (`y: 0..540`).
2. **Fitted Sharp Rectangular Red Sub-Hook Tag Box (`y >= 418`, spaced `22px+` clear below Line 2, `h: 56`, `#dc2626`):** Crisp centered white teaser punchline (`subHook` / `SHORTS_SUB_HOOK`) right below Title Line 2 without overlapping Thai low vowels (`ุ`/`ู`) (NEVER `EP N` / `เหตุการณ์ #N`).
3. **Poster-Lit Full-Bleed 9:16 Focal Artwork:** Applies high-contrast horror grading (`contrast 1.18 / saturate 1.24 / brightness 1.07`), eerie teal-emerald + subtle crimson backlight rim aura behind the focal subject (`screen` blend), soft fog wisps, floating eerie spores, and dread perimeter vignette — with **ZERO borders or corner brackets in the middle action zone**!
- **Hero Frame Composition Guard:** Always set `isClimax: true` and `coverAt` / `focusX` / optional `coverZoom` on scenes where the **monster, ghostly anomaly, or high-tension close-up action** is prominently visible (avoid empty landscape or tiny distant characters on covers).
- ❌ **STRICTLY DISABLED / PROHIBITED ON COVERS (`cover_*.png`):**
  - **ปิดทั้งกรอบสี่เหลี่ยมสีเหลืองและมุมกรอบ Viewfinder สีแดง 4 มุมตรงกลางภาพทั้งหมด**
  - **ปิดกล่อง Telemetry HUD มุมขวาบน บนภาพปก Shorts (100% HUD-free)**
  - **ปิดข้อความ Stamp ด้านล่าง (`เหตุการณ์ #1–#5`, `EP 1`, `EP 2 (จบ)`, `จบใน 1 คลิป`) และแถบเส้น Gradient เหลือง-แดงด้านล่าง**
  - **ห้ามวาดกล่องคำพูด (Speech Bubble) หรือคำขึ้นต้น `EP` ในแถบแดง**
- ✅ **Mandatory Visual Inspection:** Always inspect generated `shorts/cover_*.png` and `thumbnail_reallens_*.png` with `read_file` to confirm clear focal imagery, clean red sub-hook box spaced clearly below Line 2, zero viewfinder corners/borders, and crisp Thai typography before final delivery.

---

## 5. Shorts / TikTok / Reels Copywriting Framework

### 5.0 โครงสร้างบท Shorts (`45–60s`): ตัดแบ่งแต่ละเหตุการณ์น่าสนใจ หรือจบใน 1 คลิป + สูตรปิดท้ายดึงคอมเมนต์ & Retention
- **คลิปตัดแบ่งตามเหตุการณ์ (`events`):** คัดช่วงเหตุการณ์น่าสนใจจากเรื่องยาวออกมาเป็นคลิปสั้น **`45–60 วินาที` ต่อเหตุการณ์** โดยเปิดด้วย **"วินาทีพีค" ใน `0–3 วินาทีแรก`** (`COLD_OPEN_LEAD = 0.06s`, ซับไตเติล `t0 = 0.00s`) $\rightarrow$ ปูบริบทสั้น $\rightarrow$ จุดหักมุม/บทสรุปเหตุการณ์นั้นจบในตัว เพื่อให้คนดูบนฟีดเข้าใจได้ทันที
- **กรณีเรื่องสั้น 1–2 ตอน (`single` / `two_part`):** ถ้าแบ่ง 2 ตอน (`maxEp = 2`) ตอนที่ 2 (`act: 2, isRecap: true`) ต้องสรุปความเดิมสั้น ๆ ภายใน 3 วินาทีแรก
- **กฎเหล็กปิดท้ายคลิปสั้น 2–5 วินาทีสุดท้าย (`High-Retention Shorts Ending` — ห้ามพูดขอไลก์/แชร์/ซับ!):**
  - ❌ **ห้ามพูดประโยคสำเร็จรูป** อย่าง `"ฝากกดไลก์ กดแชร์ กดติดตามด้วยนะครับ"` ในช่วง 3 วินาทีสุดท้ายเด็ดขาด เพราะคนดูจะรู้ทันว่าคลิปจบแล้วปัดหนีทันที (`inspect_video.js` ตรวจจับอัตโนมัติ)
  - ✅ **1. คำถามปลายเปิดที่เลือกข้าง (Side-Choosing Open Question, 2–3 วินาทีสุดท้าย):** โยนทางเลือกจากในเรื่องให้คนดูตัดสินใจ เช่น *"ถ้าคุณยืนถือไฟฉายอยู่ตรงนั้นคืนนั้น... คุณจะเชื่อกฎบนกระดาษ หรือเชื่อเสียงที่กระซิบอยู่หลังประตู?"*
  - ✅ **2. ปมค้างคา 1 ประโยค / สะพานไปคลิปยาว (Cliffhanger & Full-Story Bridge):** เช่น *"แต่สิ่งที่ปรากฏบนกล้องวงจรปิดหลังตีสี่... ทำให้ไม่มีใครกล้าเข้ากะดึกอีกเลย ติดตามต่อในตอนหน้า"* หรือ *"ฟังเรื่องเต็มแบบไม่ตัด ได้ที่คลิปยาวหน้าช่อง เว้าเรื่องหลอน"*
  - ✅ **3. 2-Second Silent Visual CTA (`drawShortsEndingCTA` ใน `core.js`):** ใน 2.25 วินาทีสุดท้ายของคลิป 9:16 ระบบจะขึ้นป้ายเล็กๆ มุมซ้ายล่าง (`y = 1544`, ในโซนปลอดภัยใต้ซับ `subY = 1482`) พร้อมลูกศรชี้ลง **`▼`** ไปยังปุ่ม **Related Video / ติดตาม** โดยอัตโนมัติ (ปรับข้อความเฉพาะฉากได้ผ่าน `scene.visualCta`) เพื่อคงอารมณ์หลอน 100% โดยไม่พูดขัดจังหวะ
  - ✅ **สูตรรวมปิดท้าย 4–5 วิ (แนะนำ):** *"[ข้อคิด/เฉลยพีคจากเรื่อง] — ถ้าเป็นคุณอยู่ในเหตุการณ์คืนนั้น คุณจะกล้าเดินเข้าไปช่วยไหม? พิมพ์บอกไว้ใต้คลิป แล้วกดติดตามรอฟังบทสรุปในตอนหน้าครับ"*

### 5.1 Short Video Title Formula (`<= 38` ตัวอักษร + `| ชื่อซีรีส์`, ห้ามนำหน้าด้วย `EP` / `เหตุการณ์ #`)
- **กฎเหล็กชื่อคลิปสั้น (Shorts / TikTok / Reels):** **เอาชื่อคลิปหรือชื่อเหตุการณ์สั้นๆ ที่คนแปลกหน้าอ่านแล้วเข้าใจทันทีขึ้นหน้าสุด — ห้ามขึ้นต้นด้วย `EP 1:`, `เหตุการณ์ #1:`, `ตอนที่ 1:`, หรือ `จบในคลิป:`**
- **คลิปเหตุการณ์ / คลิปจบใน 1 คลิป (`45–60 วินาที`):** **`[ชื่อเหตุการณ์/จุดพีคสั้นเข้าใจง่าย <= 38 ตัวอักษร] | [ชื่อซีรีส์]`**
  - *(เช่น `ใครเคาะกระจกตีหนึ่ง?! | กฎกะดึกสถานีสายสุดท้าย`)*
- **กรณีแบ่ง 2 ตอน (ไม่เกิน 2 ตอนเท่านั้น):**
  - **ตอนที่ 1:** **`[ชื่อคลิปสั้นเข้าใจง่าย <= 38 ตัวอักษร] | [ชื่อซีรีส์เหมือนกันเป๊ะ]`** *(เช่น `เข็มน้ำมันตีกลับตีสาม?! | ปั๊มน้ำมันร้างกลางหมอก`)*
  - **ตอนที่ 2 (จบ):** **`[ชื่อคลิปตอนสรุป <= 32 ตัวอักษร] (ตอนจบ) | [ชื่อซีรีส์เหมือนกันเป๊ะ]`** *(เช่น `ความจริงหลังห้องเครื่อง (ตอนจบ) | ปั๊มน้ำมันร้างกลางหมอก`)*

### 5.2 5-Part Suspense Caption Architecture (Standalone 1-Clip or 2-Part Max)
1. **Hook:** คำถามเปิดชวนระทึกให้ผู้ชมเอาตัวเองไปอยู่ในสถานการณ์
2. **Beat Summary:** สรุปจุดไคลแมกซ์ประจำคลิป 1–2 บรรทัด
3. **⚠ Survival Rule / Math Warning:** ย้ำกฎหรือสูตรคำนวณสำคัญ
4. **👉 CTA:** สำหรับคลิปจบในตัว: `"💬 ถ้าเป็นคุณจะทำตามกฎข้อไหน? คอมเมนต์บอกหน่อย!"` / สำหรับตอน 1 ใน 2 ตอน: `"👉 ดูตอนจบ (EP 2) ได้ที่หน้าโปรไฟล์ / ลิงก์ใต้คอมเมนต์"`
5. **Hashtags:** `#RealLens #กฎเอาชีวิตรอด #เรื่องเล่าหลอน #อนิเมชั่นสยองขวัญ #Shorts #เรื่องผี`
