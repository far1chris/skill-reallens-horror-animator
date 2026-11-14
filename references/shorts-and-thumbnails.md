# YouTube Packaging, Key-Scene Thumbnails & `<= 60s` Vertical Shorts Guide

This reference documents the complete packaging workflow for **Key-Scene 16:9 YouTube Thumbnails**, **Long-Form YouTube SEO Metadata**, **`<= 60s` 9:16 Vertical Shorts (`EP 1..N`, auto-scaling to `EP 6`, `EP 7`, `EP 8+`)**, and **High-Impact Climax Vertical Covers (`1080x1920`)**.

> **Production Templates & Scripts:** Use [`scripts/shorts_planner.js`](../scripts/shorts_planner.js), [`templates/generate_thumbnail.js`](../templates/generate_thumbnail.js), [`templates/generate_shorts_overlays.js`](../templates/generate_shorts_overlays.js), [`scripts/render_all_shorts.js`](../scripts/render_all_shorts.js), and [`templates/generate_scene_covers.js`](../templates/generate_scene_covers.js).

---

## 1. Key-Scene Long-Form YouTube Thumbnails (`1920x1080`, `16:9`)

Generate **2 high-CTR variants** via [`templates/generate_thumbnail.js`](../templates/generate_thumbnail.js) using [`scripts/shorts_planner.js`](../scripts/shorts_planner.js) (`pickTopLongFormHighlights` + `pickKeyTimestampInScene`) so covers always spotlight dramatic danger/climax beats instead of blind fixed timestamps (customize further via `packaging.json` or `episode.js` fields `isClimax`, `coverScore`, `focusX`):

### Variant 1: Signature Real Lens Showdown Split (`thumbnail_reallens_showdown.png`)
- **Left/Center Stage:** Selects the highest-impact climax view (`showdownView` at peak `showdownLt`) — Entity vs. Protagonist inside the story's environment.
- **Top-Left HUD:** Rule 1 Cream Card (`w: 820, h: 248`) with `#B91C1C` badge `⚠ กฎข้อ 1`, dark ink + danger red lines, and English sub-caption.
- **Top-Right HUD:** Dark Telemetry Box (`#0E0E12`) + Cream Proximity Pill (`● ระยะห่าง X ม.`).
- **Bottom Center Title & Hook Banner:** Giant white headline (`Kanit 900`, blood-red ambient glow) + yellow sub-hook (`#FACC15`).

### Variant 2: 5-Panel Key-Scene Escalation Strip (`thumbnail_reallens_5panel.png`)
- Divides `1920x1080` into **5 vertical columns** (`384px` wide each) with `4px` crimson `#B91C1C` dividers, picking 5 dramatic chronological highlights from `views.js` (respecting `focusX` horizontal centering + peak `lt`) with numbered badges `1`–`5`, giant bottom headline, red pill, and yellow hook quote.
- **Non-Black Sanity Check:** Logs canvas region luminance after rendering to catch dim/unlit views immediately.

---

## 2. Long-Form YouTube SEO Package Template

Always deliver the complete YouTube publish package alongside the 16:9 master video:

### 2.1 3 High-CTR Title Options (60–90 chars)
1. **Rule + Paradox Hook:** `[จำนวนวัน/คืน] + [สถานที่] + กฎข้อที่ [X] "[กฎชวนสงสัย]" | Real Lens`
2. **Quantitative Math Hook:** `[สถานการณ์เอาชีวิตรอด] + มีเวลาแค่ [X] วินาที/แคลอรี! ต้องคำนวณทางรอดยังไง?!`
3. **Cliffhanger Twist Hook:** `[เหตุการณ์เริ่มต้นปกติ] + แต่ทำไม [เบาะแสผิดปกติ]?! (วิเคราะห์เอาชีวิตรอด)`

### 2.2 Structured YouTube Description Template
```markdown
[บรรทัดที่ 1–2: คำถามหรือสถานการณ์เปิดคลิปที่บีบคั้นหัวใจ + กฎข้อที่ 1 ของเรื่อง]

[ย่อหน้าที่ 2: อธิบายปริศนาเชิงตรรกะ/การคำนวณที่ตัวเอกต้องใช้เอาชีวิตรอด (โดยไม่สปอยล์จุดหักมุมท้ายเรื่อง)]

⏱️ สารบัญเวลา (Timestamps)
00:00 คำเตือนและกฎข้อแรก
00:XX องก์ที่ 1: [ชื่อตอนจาก timeline.json]
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

## 3. Dynamic Vertical Shorts Splitter (`<= 60s` / EP -> `EP 6`, `EP 7`, `EP 8+`)

### 3.1 `scripts/shorts_planner.js` — Strict `<= 60s` Episode Scaling
Every YouTube Shorts / TikTok / Reels clip MUST stay **strictly `<= 60.0s`** (`maxSec = 58s` default target to leave muxing safety margin, `minSec = 22s`):
- If a full episode runs 5–8+ minutes (or any `act` exceeds `58s`), `planShortsEpisodes()` automatically packs scenes into acts/episodes `<= 58s`, rebalances short tail episodes, and splits long single scenes along `subs` word boundaries so the story naturally expands into **`EP 1` .. `EP 6`, `EP 7`, `EP 8+`** (rather than truncating or exceeding 1 minute).
- Saves the unified schedule to `shorts/shorts_plan.json` so `generate_shorts_overlays.js`, `render_all_shorts.js`, and `generate_scene_covers.js` share identical `EP 1..N` counts and timestamps (pass matching `--max-sec <N>` across all 3 if customized).
- Optional hints in `episode.js` scenes give writers full manual control when desired:
  - `isClimax: true` — prioritizes scene for Shorts covers & Showdown thumbnail.
  - `coverAt: <secFromSceneStart>` — exact peak moment inside the scene to capture.
  - `coverScore: <number>` — explicit priority score (`0–100+`) over heuristic scoring.
  - `coverHeadline: [topLine, redWord]` — custom 2-line punchy Thai cover hook for that scene's EP.
  - `focusX: <0..1280>` — horizontal subject center for 5-panel vertical column crops.

### 3.2 Minimalist Overlay Spec (`shorts/overlay_epX.png`)
Generated by [`templates/generate_shorts_overlays.js`](../templates/generate_shorts_overlays.js) for **all `EP 1..N` planned episodes** with **ONLY the Video Title and Single Red EP Pill at the top**:
- ✅ **Top Title (`y: 305`):** Bold white series title (`Kanit 900`, auto-fit `<= 56px`, red glow).
- ✅ **Single Red EP Pill (`y: 345, h: 54`):** Red rounded pill (`#DC2626`) with white text (`Kanit 700 <= 25px`, ending with `(จบ)` on the final EP).
- ❌ **STRICTLY PROHIBITED ON `overlay_epX.png`:**
  - **ห้ามใส่ข้อความหมวดหมู่สีเหลืองเหนือชื่อคลิป**
  - **ห้ามใส่แถบป้ายสถานะแถวที่สองใต้แถบสีแดง EP**
  - **ห้ามใส่กล่องข้อความสีครีมหรือการ์ดสรุปกฎด้านล่างของจอเด็ดขาด!** (ปล่อยพื้นที่ `y: 1184..1920` ให้โล่งสะอาด)

### 3.3 3-Layer FFmpeg Vertical Composite (`scripts/render_all_shorts.js`)
Supports two framing modes cleanly:
- **Default (`--mode letterbox`):** Scales the `16:9` master cleanly to `1080x608` centered at `y: 576` over a blurred/darkened `1080x1920` background (`boxblur=22:5,eq=brightness=-0.16:contrast=0.88`). **Recommended whenever `16:9` HUD cards sit near left/right edges**, guaranteeing zero cropping of HUD text or subtitles (`y = 576..1184`, strictly inside Safe Zone $Y \le 1580\text{ px}$).
- **Optional (`--mode zoom` — `1.35x` Smart Center Zoom):** Scales to `1458x820` and center-crops `1080x608` for action beats without edge HUD cards.
- **Audio, FPS & Duration Guard:** Renders at **`30 fps`**, **`48 kHz`** AAC, **`-14.0 LUFS`** (`loudnorm=I=-14.0:LRA=7.0:TP=-1.0`), and rejects any clip `> 60.0s` (`inspect_video.js --shorts --strict` enforces `totalSec <= 60.0s` unless explicitly waived with `--allow-over-60`).

---

## 4. Key-Scene Vertical Shorts Covers (`1080x1920`, `9:16`)

[`templates/generate_scene_covers.js`](../templates/generate_scene_covers.js) uses `scoreSceneDramaticImpact()` + `pickKeyTimestampInScene()` from `scripts/shorts_planner.js` to extract the **most intense, eye-catching key frame** from each planned `EP 1..N` window (prioritizing `isClimax`, `DANGER`/`CRITICAL`/`WARN` telemetry, close entity proximity, active HUD reveal/climax beat — never static fade-outs), verifies frame brightness in Puppeteer (`meanLuma >= 12`, retrying alternate EP timestamps if near-black), and renders **ONLY**:
1. **Top Hook Headline (`y: 220` & `y: 365`):** Line 1 pure white (`Kanit 800`), Line 2 giant blood red (`#DC2626`, `10px` black round outline + red glow) generated from `coverHeadline`, HUD `ruleNo`, or dramatic chapter/VO hook.
2. **Center Hero Card (`x: 30, y: 480, w: 1020, h: 574`):** Clipped climax frame inside a `22px` rounded card with `5px` `#FACC15` border.
3. **Bottom Episode Stamp (`y: 1380`):** Giant `"EP 1"`..`"EP N"` (`Kanit 900 145px`) + red underline bar.
- ❌ **STRICTLY PROHIBITED:** Never draw comic speech bubbles or summary text boxes below the hero frame.
- ✅ **Mandatory Visual Inspection:** Always inspect generated `shorts/cover_shorts_ep*.png` and `thumbnail_reallens_*.png` with `read_file` to confirm clear focal imagery and crisp Thai typography before final delivery.

---

## 5. Shorts / TikTok / Reels Copywriting Framework

### 5.1 Short Video Title Formula (`50–75 chars`, repeat per `EP 1..N`)
`[EP X] + [Trigger Hook / กฎหรือปริศนา] + [Emoji] + | [ชื่อซีรีส์]`

### 5.2 5-Part Suspense Caption Architecture (Generate for ALL Planned `EP 1..N`)
1. **Hook:** คำถามเปิดชวนระทึกให้ผู้ชมเอาตัวเองไปอยู่ในสถานการณ์
2. **Beat Summary:** สรุปจุดไคลแมกซ์ประจำตอน 1–2 บรรทัด
3. **⚠ Survival Rule / Math Warning:** ย้ำกฎหรือสูตรคำนวณสำคัญประจำตอน
4. **👉 Next EP CTA:** `"👉 ดูต่อ EP X ได้ที่หน้าโปรไฟล์ / ลิงก์ใต้คอมเมนต์"` (adjust dynamically up to the final planned EP!)
5. **Hashtags:** `#RealLens #กฎเอาชีวิตรอด #เรื่องเล่าหลอน #อนิเมชั่นสยองขวัญ #Shorts #เรื่องผี`
