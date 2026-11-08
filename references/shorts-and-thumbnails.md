# YouTube Thumbnails & Vertical Shorts (`EP 1–5`) Adaptation Guide

This reference documents the battle-tested workflow for generating **16:9 YouTube Thumbnails**, splitting a full-length 16:9 Real Lens episode into **9:16 Vertical Shorts (`EP 1` – `EP 5`)**, and rendering **Scene-Based Vertical Shorts Covers (`1080x1920`)**.

---

## 1. Long-Form YouTube Thumbnails (`1920x1080`, `16:9`)

Always generate **2 thumbnail options** via Puppeteer Canvas (`generate_thumbnail.js`):

### Variant 1: Signature Real Lens Showdown Split (`thumbnail_*_showdown.png`)
*As directly analyzed and proven in "7 วัน ติดอยู่ในห้างสรรพสินค้าที่ไม่มีทางออก" (`maxresdefault.jpg`):*

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────┐                  ┌──────────────────────┐ │
│ │ [ ⚠️ กฎข้อ 1 ]           │                  │ • วันที่ 7/7 · ไฟดับ  │ │
│ │ เมื่อไฟห้างดับ ห้ามวิ่ง  │                  │              03:00   │ │
│ │ และห้ามเหยียบพื้นที่ถูกถู│                  │ พลังงานที่เหลือ: 90 kcal │ │
│ │ RULE 1 · DON'T STEP...   │                  └──────────────────────┘ │
│ └──────────────────────────┘                      ┌──────────────────┐ │
│                                                   │ [ • ระยะห่าง ] 4ม.│ │
│           [ ENTITY ]                                └──────────────────┘ │
│     (The Cleaner with mop &                         [ PROTAGONIST ]    │
│      dripping blood eyes)                       (Crouching, blue shirt, │
│                                                  hand to brow in shock)│
│                                                                        │
│                7 วัน ติดอยู่ในห้างไร้ทางออก                            │
│         “ห้างสลับตำแหน่งทุก 6 ชั่วโมง... และบางสิ่งออกมาถูพื้นตอนตีสาม”         │
└────────────────────────────────────────────────────────────────────────┘
```

- **Composition & Visual Balance:**
  - **Left Subject:** The Entity (The Cleaner / ภารโรงไร้หน้า) leaning on mop, blank white oval face, vertical hollow eye slits with dripping blood streaks (`#8B0000`), grey peaked cap, wet tile reflection.
  - **Right Subject:** The Protagonist ("ต้น") crouching in terror/exhaustion, blue-and-white striped t-shirt, dark fatigue crescent bags under bead eyes, hand to forehead/temple.
  - **Top-Left HUD:** Rule 1 Card (`w: 520, h: 180`) on warm cream `#FAF7F2` with crimson badge `⚠️ กฎข้อ 1`, bold dark slate + danger red text, and English sub-caption.
  - **Top-Right HUD:** Dark telemetry container (`#18181B`) with red dot `วันที่ 7 / 7 · ไฟดับ 03:00` + amber `พลังงานที่เหลือ: 90 kcal`, with the white **Distance Tracker Pill** (`• ระยะห่าง 4 ม.`) right below it.
  - **Bottom Center Title & Hook Banner:**
    - Line 1 (Giant Headline): `7 วัน ติดอยู่ในห้างไร้ทางออก` (`Kanit 900 110px`, pure white with thick black outline + vibrant blood-red ambient glow `drop-shadow(0 0 24px rgba(220, 38, 38, 0.85))`).
    - Line 2 (Yellow Sub-Hook): `“ห้างสลับตำแหน่งทุก 6 ชั่วโมง... และบางสิ่งออกมาถูพื้นตอนตีสาม”` (`Kanit 700 36px`, warm yellow `#FDE047` centered with dark shadow).

### Variant 2: 5-Panel Escalation Strip (`thumbnail_*_5panel.png`)
- Divide `1920x1080` into **5 vertical columns** (`384px` wide each) separated by `4px` dark dividers.
- Each column depicts one escalating stage of the episode:
  - Column 1: `DAY 1 / เสา C-13` (Protagonist walking past parking pillar)
  - Column 2: `DAY 2 / ซูเปอร์มาร์เก็ต` (Product expiry 31 Feb clue)
  - Column 3: `DAY 3 / ตี 3 ไฟดับ` (The Cleaner silhouette with yellow cart)
  - Column 4: `DAY 4 / แผนที่บนแขน` (Forearm with duct tape codes)
  - Column 5: `DAY 7 / วิ่งฝ่าความมืด` (Distance 2m & green exit door)
- Bottom Banner: Giant bold title across all 5 columns with red glow.

---

## 2. Vertical Shorts / TikTok / Reels Episode Splitter (`1080x1920`, `9:16`)

### 2.1 5-Episode Cliffhanger Arc for Liminal / Rules of Survival
For a 5:30–6:00 minute master video, split into **5 high-retention vertical episodes (`60s–80s` each)**:

| Episode | Timestamp Range | Plot Beat / Conflict | Key HUD Card Featured | Cliffhanger Ending |
| :--- | :--- | :--- | :--- | :--- |
| **EP 1** | `0:00` – `1:09` | Cold open warning, mundane parking B2, discovery of impossible pillar C-13, and entering endless liminal mall. | `⚠️ กฎข้อ 1: เมื่อไฟห้างดับ ห้ามวิ่ง` & `ลานจอด B2 มีเสา แค่ C-01 ถึง C-12` | Turns off phone to preserve battery... and hears a low electrical hum in infinite corridors. |
| **EP 2** | `1:09` – `1:53` | Walking for hours only to loop back to the same fountain. Marking floor with tape. Midnight structural rumble! | `⚠️ กฎข้อ 2: ห้างสลับตำแหน่งทุก 6 ชม.` & Circular Sector Dial Map | The entire mall grinds and rotates... the floor arrow points directly into a solid wall! |
| **EP 3** | `1:53` – `2:32` | Supermarket food audit. Impossible expiry dates (31 Feb). Memory loss lore. Calorie math (20km vs 7-day rest). | `⚠️ กฎข้อ 3: วันหมดอายุบนปฏิทินจริง` & `• คำนวณแคลอรี: 4,800 kcal` | Midnight passes... lights start snapping off row-by-row into total darkness. |
| **EP 4** | `2:32` – `3:20` | Squeaking wheels at 03:00. The Cleaner emerges with mop and bleeding eyes. Protagonist hides in fitting room. | `Live Telemetry (03:04)` & `• ระยะห่าง: 40 ม. ➔ 2 ม.!` | The mop passes right under the curtain... one breath away from being wiped out. |
| **EP 5** | `3:20` – `5:43` | Floor clues erased! Forearm tape map. Modulo math exit formula. 17:58 blackout dilemma, escape, and Day 8 paradox. | `• คำนวณหาทางออก (mod 12)` & `• ลายมือปริศนา: "วันที่ 8"` | Back in real parking lot... finding own handwriting on pillar C-12: "Day 8". |

---

### 2.2 Three-Layer FFmpeg Vertical Composite (`render_all_shorts.js`) & Minimalist Overlay (`generate_shorts_overlays.js`)

Composite 3 layers via FFmpeg:
1. **Layer 0 (Background):** `master_16x9.mp4` scaled to `1080x1920`, cropped, blurred (`boxblur=22:5`), and darkened (`brightness=-0.16`).
2. **Layer 1 (Foreground Center):** `master_16x9.mp4` scaled to `1080x608` with `lanczos`, centered at `y: 576`.
3. **Layer 2 (Transparent Overlay — `overlay_epX.png`):** Rendered at `1080x1920` in Puppeteer with **ONLY the Video Title and Red EP Pill at the top**:
   - ✅ **Top Title (`y: 295`):** Bold white series title (`Kanit 900 54px`, red glow), e.g., `9 คืน อาถรรพ์ "ตลาดน้ำร้าง"`.
   - ✅ **Red EP Pill (`y: 335, h: 52`):** Single red rounded pill (`#DC2626`) with white text (`Kanit 700 25px`), e.g., `EP 1: กฎข้อ 1 ธูปดำบังตา & เรือพายตอนตี 3`.
   - ❌ **STRICTLY PROHIBITED ON `overlay_epX.png`:**
     - **ห้ามใส่ข้อความหมวดหมู่สีเหลืองเหนือชื่อคลิป** (เช่น `REAL LENS SURVIVAL ARCHIVE...`)
     - **ห้ามใส่แถบป้ายสีเข้มแถวที่สองใต้แถบสีแดง EP**
     - **ห้ามใส่กล่องข้อความสีครีมหรือการ์ดสรุปกฎด้านล่างของจอเด็ดขาด!** (ปล่อยพื้นที่ด้านล่าง `y: 1184..1920` ให้โล่งสะอาด มีเพียงเกรเดียนต์มืดจางๆ เท่านั้น)

```javascript
// Minimalist renderOverlay(data) inside generate_shorts_overlays.js:
window.renderOverlay = function(data) {
  const cvs = document.getElementById('c');
  const ctx = cvs.getContext('2d');
  const W = 1080, H = 1920;
  ctx.clearRect(0, 0, W, H);

  // Top & Bottom subtle dark gradients (NO bottom card or text box!)
  const topGrad = ctx.createLinearGradient(0, 0, 0, 540);
  topGrad.addColorStop(0, 'rgba(6, 11, 20, 0.96)');
  topGrad.addColorStop(0.75, 'rgba(8, 14, 27, 0.85)');
  topGrad.addColorStop(1, 'rgba(8, 14, 27, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 540);

  const btmGrad = ctx.createLinearGradient(0, 1184, 0, H);
  btmGrad.addColorStop(0, 'rgba(6, 11, 20, 0)');
  btmGrad.addColorStop(0.35, 'rgba(8, 14, 27, 0.85)');
  btmGrad.addColorStop(1, 'rgba(6, 11, 20, 0.96)');
  ctx.fillStyle = btmGrad;
  ctx.fillRect(0, 1184, W, H - 1184);

  const cx = W / 2;

  // 1. Video Title ONLY (no yellow header above it)
  ctx.textAlign = 'center';
  ctx.font = '900 56px "Kanit", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(220, 38, 38, 0.85)';
  ctx.shadowBlur = 18;
  ctx.fillText(data.title, cx, 305);
  ctx.shadowBlur = 0;

  // 2. Red EP Pill ONLY (no second status pill below it, no bottom box!)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(cx - 390, 345, 780, 54, 27);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 25px "Kanit", sans-serif';
  ctx.fillText(data.badge, cx, 381);
};
```

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

### 3.1 Extracting Actual Climax Frames
Always extract the authentic climax moment from each episode (`ffmpeg -ss <t> -i master.mp4 -frames:v 1`).

### 3.2 Layout Specs for Shorts Covers (`1080x1920`) — Clean Title + EP Only (No Bottom Text Box!)
- **Top Hook Headline (`y: 220` & `y: 365`):**
  - Line 1 (Series / Hook Title): Pure White (`Kanit 800 76px`).
  - Line 2 (Key Highlight): Giant Blood Red (`Kanit 900 140px`, `#DC2626` with `7px` black outer stroke + red glow).
- **Center Hero Card (`x: 30, y: 480, w: 1020, h: 574`):**
  - Clipped video frame inside a `22px` rounded card with `5px` glowing yellow/red border (`#EAB308` or `#EF4444`) and subtle volumetric spotlight beam.
- **NO Bottom Speech Bubble or Text Box:** Do NOT render any comic speech bubble or text box below the center hero frame.
- **Bottom Episode Stamp (`y: 1380`):**
  - Giant `Kanit 900 145px`: Pure white `"EP "` + crimson red `"1"`..`"5"`.

---

## 4. Viral Social Media Copywriting Framework (Shorts, TikTok, Reels)

### 4.1 Short Video Title Formula (`50–75 chars`)
`[EP X] + [Trigger Hook / กฎอันตรายหรือความจริงที่ซ่อนอยู่] + [Emoji] + | [ชื่อซีรีส์]`
- **EP 1:** `EP 1: ลานจอดรถมีเสาแค่ C-01 ถึง C-12... แล้วผมเดินเลี้ยวตรงเสา C-13 ได้ยังไง?! 🏢⚠️ | ห้างไร้ทางออก`
- **EP 2:** `EP 2: เดินตรงไปเรื่อยๆ แต่วนกลับมาที่เดิม... ห้างนี้ "สลับตำแหน่งทุก 6 ชม."?! 🔄🕒 | ห้างไร้ทางออก`
- **EP 3:** `EP 3: อย่ากินอาหารที่หมดอายุวันที่ 31 ก.พ. เด็ดขาด... ถ้าไม่อยากลืมชื่อตัวเอง 🍞💀 | ห้างไร้ทางออก`
- **EP 4:** `EP 4: ตี 3 ไฟดับพรึ่บ! ภารโรงไร้หน้าลากไม้ถูพื้น... ระยะห่างเหลือแค่ 2 เมตร?! 🧹🩸 | ห้างไร้ทางออก`
- **EP 5:** `EP 5 (จบ): รอดออกมาได้ แต่เวลาข้างนอกผ่านไปแค่ 12 นาที... แล้วใครเขียนเทป "วันที่ 8"?! 😱⏱️ | ห้างไร้ทางออก`

### 4.2 5-Part Suspense Caption Architecture
1. **Hook:** *"ถ้าคุณติดอยู่ในห้างสรรพสินค้าที่ไม่มีคน และไฟดับทุกตีสาม... คุณจะทำตามกฎข้อนี้ได้ไหม?"*
2. **Beat Summary:** สรุปเหตุการณ์ระทึกขวัญประจำตอน (เช่น ตอนที่ 4 ภารโรงเดินมาหยุดหน้าม่านห้องลองเสื้อ).
3. **⚠️ Survival Rule / Math Warning:** เน้นย้ำกฎการเอาชีวิตรอดและสูตรคำนวณ เช่น กฎข้อ 1 ห้ามวิ่งและห้ามเหยียบพื้นเปียก หรือสูตร mod 12 คำนวณรอบหมุนโซน.
4. **👉 Next EP CTA:** *"👉 ดูต่อ EP X: ลิงก์ใต้คอมเมนต์ / หน้าโปรไฟล์"*
5. **Hashtag Set:** `#RealLens #กฎเอาชีวิตรอด #เรื่องเล่าหลอน #Backrooms #ห้างไร้ทางออก #อนิเมชั่นสยองขวัญ #Shorts #TikTokความรู้ #เรื่องผี`
