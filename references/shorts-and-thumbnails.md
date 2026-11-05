# YouTube Thumbnails & Vertical Shorts (`EP 1–5`) Adaptation Guide

This reference documents the battle-tested workflow for generating **16:9 YouTube Thumbnails**, splitting a full-length 16:9 Real Lens episode into **9:16 Vertical Shorts (`EP 1` – `EP 5`)**, and rendering **Scene-Based Vertical Shorts Covers (`1080x1920`)**.

---

## 1. Long-Form YouTube Thumbnails (`1920x1080`, `16:9`)

Always generate **2 thumbnail options** via Puppeteer Canvas (`generate_thumbnail.js`):

1. **Variant 1 — 5-Panel Escalation Strip (`thumbnail_*_5panel.png`):**
   - Divide `1920x1080` into **5 vertical columns** (`384px` wide each) separated by `4px` dark dividers.
   - Each column depicts one escalating stage of the episode (e.g., `DAY 1` → `DAY 7`, or `+34°C` → `0°C` → `-15°C` → `-30°C` → `-40°C`, or 5 urban legend entities).
   - Top pill badge per column + giant bold bottom/center hook banner (`Kanit 900`, yellow `#FACC15` / red `#DC2626` / white `#FFFFFF` with thick black stroke).
2. **Variant 2 — Cinematic Dark Split / Encounter (`thumbnail_*_scene.png`):**
   - Left vs. Right dramatic contrast (e.g., Protagonist in `3 m³` survival tent with candle pot vs. frozen exterior / entity confrontation) with a high-contrast 2-line Thai hook and red warning arrow/badge.

---

## 2. Vertical Shorts / TikTok / Reels Episode Splitter (`1080x1920`, `9:16`)

### 2.1 Cliffhanger Segmentation Rules
For a 25-scene (~6–7 min) master video, split along **5 natural narrative cliffhangers** (`65s–95s` per episode — optimal retention window for YouTube Shorts, TikTok, and Reels):
- **EP 1 (Scenes 1–5):** Cold-open rule warning + initial catastrophe & mass-panic trap.
- **EP 2 (Scenes 6–10):** Why the building/house itself is a trap + infrastructure failure (pipes/AC/lights).
- **EP 3 (Scenes 11–15):** Total blackout + survival math (`100W` body heat / `3 m³` micro-shelter).
- **EP 4 (Scenes 16–20):** Lethal mistake made by others (`CO` charcoal / wrong turn) vs. clever DIY countermeasure (`160W` terracotta heater).
- **EP 5 (Scenes 21–25):** Peak threat climax (`-40°C` breach / final patrol), physiological trap, and **5 Golden Rules** resolution.

### 2.2 Transparent UI Overlay Generator (`generate_shorts_overlays.js`)
Instead of fragile FFmpeg `drawtext` escaping on Windows, render a crisp `1080x1920` transparent PNG (`overlay_epX.png`, `omitBackground: true`) once per episode in Puppeteer (`waitUntil: 'domcontentloaded'`):
- **Top Header (`y: 0..480`):** Dark top gradient, red `8px` accent bar, series tag (`REAL LENS SURVIVAL ARCHIVE`), bold white series title (`48px`), crimson red episode badge (`EP X: ...`, `46px`), and live telemetry pill (`🌡️ อุณหภูมิ: +34°C ➔ 0°C`).
- **Center Video Frame Guides (`y: 574` & `y: 1184`):** Subtle glowing cyan/amber `4px` horizontal divider lines framing the `1080x608` video stage.
- **Bottom Real Lens HUD Card (`y: 1250..1490`):** Rounded dark-slate card (`x: 50, w: 980, h: 240`) displaying the episode's key **Survival Rule badge + headline + scientific explanation**, leaving `y: 1550..1920` clear for Shorts/TikTok UI buttons.

### 2.3 Three-Layer FFmpeg Vertical Composite (`render_all_shorts.js`)
```javascript
execFileSync(ffmpeg, [
  '-y',
  '-ss', ep.start,
  '-t', ep.dur,
  '-i', 'master_16x9.mp4',
  '-i', `shorts/overlay_ep${ep.ep}.png`,
  '-filter_complex',
  '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:5,eq=brightness=-0.16:contrast=0.88[bg];' +
  '[0:v]scale=1080:608:flags=lanczos[fg];' +
  '[bg][fg]overlay=0:576[vbase];' +
  '[vbase][1:v]overlay=0:0[vfinal]',
  '-map', '[vfinal]',
  '-map', '0:a',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
  `shorts/ep${ep.ep}_shorts.mp4`
]);
```

---

## 3. Scene-Based Vertical Shorts Cover Generator (`1080x1920`, `9:16`)

### 3.1 Always Use Actual Climax Scenes from the Episode
To maximize click-through and visual continuity between cover and clip:
1. **Extract the real climax frame** from each episode using FFmpeg:
   ```bash
   ffmpeg -y -ss <climax_sec> -i master_16x9.mp4 -frames:v 1 shorts/raw_frame_ep1.png
   ```
2. **Compose via Local File URL (`shorts/make_covers.html`):**
   - **Puppeteer Reliability Rule:** Do **NOT** inline 500KB+ `base64` PNG strings inside `page.setContent()` template literals, and do **NOT** use `waitUntil: 'networkidle0'` with local `@fontsource` CSS (causes 30s timeouts).
   - Instead, write `shorts/make_covers.html`, launch Chrome with `--allow-file-access-from-files`, navigate once via `page.goto('file:///' + htmlPath, { waitUntil: 'load' })`, pass `{ imgUrl: 'file:///.../raw_frame_epX.png', ... }` into `page.evaluate((d) => window.drawCover(d), ep)`, and `await page.waitForFunction(() => window.__done === true)` inside `img.onload` before calling `page.screenshot()`.

### 3.2 Signature Real Lens Shorts Cover Layout (`1080x1920`)
- **Top Hook Headline (`y: 175` & `y: 325`):**
  - Line 1: Bold Pure White (`Kanit 800`, `82px`, e.g., `คนทั้งกรุงเทพฯ` / `ไฟดับทั้งประเทศ`).
  - Line 2: Massive Blood Red (`Kanit 900`, `156px`, `#DC2626` with `7px` `#000000` outer stroke + red drop glow, e.g., `แข็งตาย` / `ติดลบ 40°C`).
- **Background:** Full-bleed `1.15x` scaled `raw_frame_epX.png` covered by a dark vertical vignette gradient (`rgba(4,7,14,0.96)` → `rgba(6,12,24,0.62)` → `rgba(2,4,8,0.98)`).
- **Center Hero Scene Card (`x: 30, y: 460, w: 1020, h: 574`):**
  - Crisp `raw_frame_epX.png` clipped inside a `22px` rounded card with a `5px` glowing accent border (`#38BDF8` or `#EF4444`).
  - **Volumetric Flashlight Beam:** Radial yellow-white cone (`rgba(254,240,138,0.9)` → `0`) sweeping diagonally across the frame onto the key danger/clue.
- **Comic Speech Bubble (`y: 1144`):** White rounded pill (`#FFFFFF`, `border-radius: 24px`) with upward pointer tail and bold quote (`"ข้างนอก... หิมะตก?!"`, `"กลิ่นควันถ่าน... ห้ามจุด!"`) + muted sub-caption below.
- **Bottom Episode Stamp (`y: 1770`):** Giant `Kanit 900` (`145px`) — pure white `"EP "` + crimson red `"1"`..`"5"` + `320x8px` bottom red safe-zone bar at `y: 1850`.

### 3.3 Genre Color Token Presets for Covers & Overlays
| Preset | Dark BG Gradient | Accent Glow Border | Subtext / Telemetry | Flashlight Beam | Headline Red |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A: Polar Vortex / Freeze Disaster** | `#04070E` → `#060C18` | Ice Cyan `#38BDF8` | Soft Ice `#BAE6FD` | Pale Yellow `rgba(254,240,138,0.9)` | Blood Red `#DC2626` |
| **B: Backrooms / Liminal Horror** | `#0A0E14` → `#12141A` | Amber Fluorescent `#FACC15` | Muted Yellow `#FEF08A` | Warm Amber `rgba(253,224,71,0.9)` | Crimson Grunge `#DC2626` |

---

## 4. Viral Social Media Copywriting Framework (Shorts, TikTok, Reels)

Every 5-episode Shorts package must be delivered with ready-to-post, high-converting Thai titles, captions, and hashtag blocks:

### 4.1 Short Video Title Formula (`50–75 chars`)
`[EP X] + [Trigger Hook / พาดหัวชวนสงสัยหรือคำเตือนถึงตาย] + [Emoji] + | [ชื่อซีรีส์ย่อ]`
- *Disaster example:* `EP 1: ถ้ากรุงเทพฯ อุณหภูมิดิ่งลง 0°C กะทันหัน... ห้ามขับรถหนีขึ้นทางด่วนเด็ดขาด! ❄️🚗 | เอาชีวิตรอด -40°C`
- *Liminal horror example:* `EP 3: ตี 3 ไฟดับพรึ่บ... ภารโรงชุดเทาเดินลากถังน้ำ แต่บนหัว "ไม่มีหน้า"?! 💀 | 7 วันติดในห้างมิติ`

### 4.2 5-Part Caption Architecture
1. **Hook Sentence (1–2 lines):** Establish the sudden anomaly, date/time, or life-or-death situation.
2. **Episode Narrative Beat:** Synopsis of what happens in this episode, highlighting the counter-intuitive physics or horrifying encounter.
3. **⚠️ Survival Rule / Math Warning:** The exact survival rule or thermodynamic calculation explained in the clip (e.g., *Rule 1*, *PVC expansion 9%*, *CO poisoning from charcoal*, *3 m³ tent*).
4. **👉 Next Episode Cliffhanger CTA:** Direct the viewer to the next episode (`👉 ดูต่อ EP X: ...`) or the full video on YouTube.
5. **Trending Hashtag Block:** `#RealLens #เรื่องเล่าสยองขวัญ #เอาชีวิตรอด #อนิเมชั่นสยองขวัญ #Shorts #TikTokความรู้ #เรื่องลึกลับ`

---

## 5. Long-Form YouTube SEO Packaging Checklist

Deliver every completed episode with ready-to-paste Thai metadata:
- **Long-Form:** 3 high-CTR title options (curiosity + survival rule + exact numbers), 2-paragraph hook description, full scene timestamps (`00:00`..end), and 10+ niche tags (`#reallens`, `#กฎเอาชีวิตรอด`, `#เรื่องเล่าหลอน`, `#เอาชีวิตรอดเชิงคำนวณ`).
- **Shorts (`EP 1–5`):** 5 sets of Titles + 5-Part Captions following Section 4.
