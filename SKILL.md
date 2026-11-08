---
name: reallens-horror-animator
description: >-
  ระบบสร้างแอนิเมชัน 2.5D Canvas แนวสยองขวัญเชิงวิเคราะห์และเอาชีวิตรอดด้วยตรรกะ (สไตล์ Real Lens)
  พร้อมระบบ 2-Segment FK Walk Cycle, Dual-System Object Manipulation, HUD Telemetry และ Pipeline เรนเดอร์ MP4 16:9 / Shorts 9:16
---

# Real Lens (@real_lens1) 2.5D Geometric Survival & Horror Animation Skill

This skill encodes the complete visual architecture, narrative pacing, UI/HUD card system, unified `gemini-3.8-flash-tts` audio pipeline, deterministic HTML5-to-MP4 renderer, and vertical Shorts multi-episode adaptation workflow for the **"Real Lens" (@real_lens1)** and **"Rules of Survival / Liminal Space" (เช่น "7 วัน ติดอยู่ในห้างร้างไร้ทางออก")** YouTube animation style.

Unlike static AI image-slideshow channels, this style uses **procedural 2D flat-vector paper-cutout rigging with 2.5D depth-of-field (DoF), volumetric lighting cones, scientific/rules-of-survival HUD overlays, calculated quantitative math, and deadpan first-person narration**.

---

## 1. Antigravity Workspace Setup & Project Stack

### 1.1 Project Initialization & Dependencies
```bash
npm init -y
npm install puppeteer-core ffmpeg-static @fontsource/kanit
export GEMINI_API_KEY="your-api-key"
```

### 1.2 Multi-Theme & Entity Archetypes (Presets)

| หมวดหมู่พล็อต (Theme) | โทนสีหลัก (Palette) | ข้อมูลบน HUD Telemetry | พฤติกรรมตัวละครและสิ่งลี้ลับ (Entity Rig) |
| :--- | :--- | :--- | :--- |
| **A. ห้างไร้ทางออก / Liminal Space** | กรมท่ามืด `#0B0F19`, เขียวไฟฉุกเฉิน `#10B981`, แดงเตือนภัย `#EF4444` | รหัสเสา (`C-13`), เวลาไฟดับ, จำนวนเสบียง (มล. / แคลอรี), สมการ $\pmod{16}$ | พระเอกเดินสำรวจ/แปะเทปกาว; พนักงานไร้หน้าเข็นถังม็อบสีเหลือง (`entity_mop`) |
| **B. ภัยพิบัติคำนวณ (Calculated Disaster)** | น้ำเงินเยือกแข็ง `#082F49`, ฟ้าไซอัน `#38BDF8`, ส้มความร้อน `#F97316` | อุณหภูมิภายนอก ($-40^\circ\text{C}$), อุณหภูมิแกนกลางร่างกาย ($36.8^\circ\text{C}$), ออกซิเจน ($\%$) | ตัวละครเดินสั่น/กอดอก, ลมหายใจเป็นไอขาว, ขอบจอมี Shader น้ำแข็งเกาะ |
| **C. กฎกะดึก (Night Shift Rules)** | ดำสนิท `#09090B`, เหลืองหลอดฟลูออเรสเซนต์ `#FACC15`, เลือดหมู `#991B1B` | กฎข้อที่ $1\text{–}7$, ระยะห่างจากเป้าหมาย ($\text{ม.}$), ระดับเสียง ($\text{dB}$) | ตัวละครซ่อนหลังเคาน์เตอร์/ปิดปากกลั้นหายใจ (`hide_breath`), ผู้โดยสารไร้เงา |

---

## 2. Visual DNA & Art Direction ("2.5D Geometric Paper-Cutout Survival Horror")

> ### ⚠️ GOLDEN RULE: แยกแยะ "สไตล์ภาพ (Visual Art Style)" ออกจาก "การเล่าเรื่องและมุมกล้อง (Narrative & Camera Direction)"
> ต้นฉบับ **`backrooms-mall-7days` (`8DT1Q3NAgaA`)** คือ **มาตรฐานของสไตล์งานภาพและเอนจินการวาด (Visual & Rigging Engine)** เท่านั้น **ห้ามลอกโครงเรื่อง ฉาก หรือมุมกล้องเฉพาะของเรื่องห้างสรรพสินค้าไปใส่ในเนื้อเรื่องอื่นเด็ดขาด!**
>
> | สิ่งที่ต้องใช้ตามมาตรฐาน `backrooms-mall-7days` 100% (Visual DNA) | สิ่งที่ต้องออกแบบใหม่ตามบริบทของเรื่องนั้นๆ เสมอ (Story-Driven Direction) |
> | :--- | :--- |
> | • **เชดเดอร์และสัดส่วน 2.5D (`core.js`):** การไล่แสงทรงกระบอก `cyl()`, รูปทรงแคปซูล `rr()`, สัดส่วนมนุษย์ `1:6.5` (`drawPerson`, `drawJanitor`), แขนขา 2 ท่อน (`poseWalk`, `poseStand`, `poseKneel`, `poseSit`), และท่อนแขน POV ยาว `400px` ที่ยื่นจากขอบจอ (`hand()`)<br>• **ระบบแสงและบรรยากาศ:** โทนสีกลางคืนที่มองเห็นรายละเอียดชัดเจน (`#283040` / `#162030` + แสง `glow()` / `emergency()`), เบลอฉากหลังอัตโนมัติ `blurLayer()` เมื่อการ์ดเด้ง, และฟิล์มเกรน `grain()`<br>• **ระบบ HUD & ซับไตเติล:** การ์ดสีครีม `#F5EFE6` (`cardBox`, `badge`), กล่อง Telemetry มุมขวาบน (`drawTele`), และซับไตเติลสีขาวขอบดำไร้กรอบ (`drawSub`) | • **การดำเนินเรื่อง (Narrative Flow):** ลำดับเหตุการณ์ จังหวะการเปิดเผยปริศนา และจุดหักมุม ต้องเป็นไปตามพล็อตเรื่องที่ผู้ใช้กำหนด ไม่บังคับใช้โครงสร้าง 7 วันในห้าง<br>• **ฉากและพร็อพตามบริบทจริง (Setting-Native Props):** ห้ามนำพื้นกระเบื้องห้าง (`tiles`), ห้องลองเสื้อ, ป้ายเสา `C-13`, เทปกาวแปะแขน หรือการ์ดเทียบวันหมดอายุขนมปัง 3 ใบ ไปใส่ในเรื่องอื่น (เช่น ตลาดน้ำ, ป่า, โรงพยาบาล, รถไฟ) ให้วาดพื้นผิวและวัตถุตามสถานที่จริงของเรื่องนั้นๆ (เช่น โต๊ะไม้เก่า, ผิวน้ำคลอง, แผงหน้าปัดรถ, หิ้งพระ)<br>• **มุมกล้องตามอารมณ์ฉาก (Story-Driven Camera Angles):** ออกแบบมุมกล้อง (`views.js`) ให้เข้ากับเหตุการณ์ในฉากนั้นๆ (ดูหัวข้อ 2.3) |

### 2.1 Character Construction (Authentic Real Lens Vector Rig — `8DT1Q3NAgaA` Standard)
Characters are built from clean geometric Canvas2D primitives using horizontal cylindrical shading (`cyl()`) with **no third-party channel sprites** (`peachfoow_sprites.js` is strictly prohibited):
- **Head & Face (`drawPerson` in `core.js`):**
  - Rounded capsule head (`52x62px`, `border-radius: 22`) shaded with `cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh)` (`#C98B5E`, `#D9A27A`, `#A66C44`).
  - **Symmetrical Eyes (`[-10, 10]`):** Dark oval pupils (`#141414`) placed strictly at `for (const sx of [-10, 10])` offset by `fx = o.profile ? 8 : 3`, with a `1px` white highlight dot (`sx + fx + 1.2, -4.3`), natural periodic blinking (`(t % 3.7) < 0.12`), and subtle radius change (`eyeR = ex === 'shock' ? 4.2 : 3.3`). **NEVER place both eyes on the right edge (`x = 4, 20`) or draw giant white ovals on `shock`.**
  - **Under-Eye Fatigue Bags:** Soft dark crescent shadows (`rgba(70, 30, 20, 0.45)`) curved directly under each eye, conveying authentic survival exhaustion, lack of sleep, and psychological dread.
  - **Mouth & Nose:** Clean horizontal dark line for calm/stoic expressions; transitions to a small dark oval mouth (`#3a1210`) during sudden shocks (`expr === 'shock'`).
  - **Hair:** Clean rounded black cap (`#151518`) with fringe triangles across the forehead and sideburns.
- **Protagonist Proportions & Attire (`1:6.5` Ratio):**
  - Lock `hipY = -92 + by`, `torsoH = 64`, upper/lower legs at `45px + 45px`, and upper/lower arms at `32px + 30px`. **NEVER shorten `hipY` to `-50` (which creates a distorted dwarf/chibi figure).**
  - Cylindrical shaded shirt (`K.shirt`, `K.shirtHi`, `K.shirtSh` — customizable per story character), V-neck collar placket, dark trousers (`#2F3A4F` / `#222A3A`), and dark shoes (`#1E1E22`).
- **2-Segment FK Poses (`poseWalk`, `poseStand`, `poseKneel`, `poseSit`) & Macro POV Hand (`hand`):**
  - `poseWalk(t, speed, amp)` uses `Math.max(0, ...)` clamped knee flexion so legs bend naturally backward on lift with zero floor clipping.
  - `hand(c, x, y, ang, s, o)` MUST draw a **`400px`-long forearm (`rr(c, -26, 0, 52, 400, 22)`)** extending from outside the bottom/side edge of the canvas (`y = 760..820`). **NEVER draw a short `150px` rectangle in mid-air (which looks like a severed floating arm).**

### 2.2 Multi-Plane Lighting & Visible Night Palettes (Zero Black Intervals)
Compose every scene with clear depth separation and **100% readable dark-scene lighting**:
1. **Visible Night / Dark Palettes:** Even in total blackout or midnight horror scenes, **NEVER use pure black `#000000` / `#020406` for walls, water, or fog** (which causes `ffmpeg blackdetect` failures and makes the video unwatchable). Always use slate-indigo, deep navy, or dark teak mid-tones (`#162030`, `#1E293B`, `#283040`, `#3B281B`) contrasted against warm lanterns (`#F59E0B`), moonlight/mist (`#94A3B8`), or red danger glow (`emergency()`).
2. **4 Depth Planes:**
   - **Plane 0 (Sky / Distant Atmosphere):** Gradient backdrop appropriate to the story setting.
   - **Plane 1 (Far Background Architecture / Silhouettes):** Parallax distant structures, trees, buildings, or 3D perspective depth (`corridor`).
   - **Plane 2 (Midground Stage & Character Action):** The main interactive space where characters (`drawPerson`, animals, entities) move and interact with story props.
   - **Plane 3 (Foreground Framing, Volumetric Glows & Vignette):** Foreground silhouettes (window frames, eaves, pillars, foliage), `glow()` light pools, `vignette()`, and `grain()`.

### 2.3 Story-Driven Camera Angle Vocabulary (การออกแบบมุมกล้องตามเนื้อเรื่องใน `views.js`)
ห้ามใช้มุมกล้องด้านข้าง (Side View) ซ้ำๆ เกิน 2–3 ฉากติดต่อกัน และห้ามก๊อปปี้ฉากเฉพาะของห้าง (`backrooms-mall-7days`) มาใส่ในเรื่องอื่น ให้เลือกผสมผสาน **มุมกล้อง 7 รูปแบบ** นี้ให้สอดคล้องกับสถานที่และอารมณ์ของเนื้อเรื่องนั้นๆ:
1. **1-Point / 2-Point 3D Perspective Shot (มุมมองความลึก 3 มิติ):** ใช้สมการโปรเจกชัน `P(X, Y, z)` วาดสภาพแวดล้อมตามเนื้อเรื่อง เช่น คลองน้ำยามวิกาลขนาบด้วยบ้านไม้, ทางเดินโรงพยาบาล, ถนนกลางหมอก, หรืออุโมงค์รถไฟ
2. **Wide / High-Angle Establishing Shot (มุมกว้างเปิดพื้นที่และขอบเขตอันตราย):** แสดงโครงสร้างพื้นที่ทั้งหมดและขอบเขตของกฎ (เช่น ชายคาบ้านไม้ที่ยื่นเหนือท่าน้ำ, แผนผังบ้านพัก, หรือระยะห่างระหว่างจุดซ่อนตัวกับจุดเสี่ยง)
3. **Over-the-Shoulder (OTS) / Back-Three-Quarter Shot (มุมมองข้ามไหล่ตัวเอก):** วาดตัวเอกหันหลังหรือหันข้าง (`o.back: true` หรือ `o.profile: true` สเกล `1.5x–2.0x`) อยู่มุมซ้าย/ขวาล่างของจอ มองออกไปเห็นสิ่งลี้ลับที่กำลังเคลื่อนเข้ามาในระยะกลาง
4. **Low-Angle / Water-Level / Ground-Level Shot (มุมเสยจากระดับพื้นหรือผิวน้ำ):** ตั้งกล้องระดับต่ำ (เช่น ระดับผิวน้ำคลอง หรือระดับพื้นใต้เตียง) มองเสยขึ้นไปเห็นเสาเรือนไม้ กระถางธูป หรือเงาร่างที่ยืนค้ำอยู่ด้านบน
5. **Architectural Frame-within-a-Frame (มุมแอบมองผ่านช่องหน้าต่าง/ซี่ไม้/บานประตู):** ใช้กรอบหน้าต่างไม้ ช่องลม หรือมุ้งลวดของสถานที่ในเรื่อง เป็นกรอบหน้า (Foreground) ล้อมรอบสิ่งที่อยู่ด้านนอก ขณะที่ตัวเอกซ่อนตัวอยู่ในเงามืดด้านหน้า
6. **First-Person POV & Setting-Native Surface Shot (มุมมองสายตาตัวเองบนพื้นผิวจริงของเรื่อง):** เมื่อตัวเอกสำรวจสิ่งของ เขียนบันทึก หรือหยิบอุปกรณ์ ให้วาดพื้นผิวตามสถานที่จริงในเรื่อง (เช่น โต๊ะไม้สักเก่า, กระดานไม้ท่าน้ำ, เบาะรถยนต์ — **ห้ามใช้พื้นกระเบื้องห้างหากไม่ได้อยู่ในห้าง**) พร้อมท่อนแขน `hand()` ยื่นมาจากขอบล่างของจอ
7. **Story-Specific Physics / Logic Diagram Shot (มุมมองแผนภาพคำนวณตามกลไกของเรื่อง):** ออกแบบกราฟิกประกอบการคำนวณให้ตรงกับวัตถุในเรื่อง (เช่น สเกลความยาวธูป 30 ซม. ที่กำลังไหม้ลดลงพร้อมควัน, มาตรวัดระดับน้ำ/ออกซิเจน, หรือแผนผังเวลาเดินเรือ) คู่กับการ์ด `calc`

### 2.4 Mandatory Anti-Distortion & Visual QA Rules (กฎเหล็ก 6 ข้อป้องกันภาพและตัวละครเพี้ยน)
ก่อนเรนเดอร์วิดีโอทุกครั้ง ต้องตรวจสอบไม่ให้เกิดข้อผิดพลาดทั้ง 6 ข้อนี้เด็ดขาด:
1. **ห้ามเขียนพิกัดใบหน้าและสัดส่วนร่างกายขึ้นใหม่แบบเดาสุ่ม:** ต้องใช้ฟังก์ชัน `drawPerson` และ `drawJanitor` มาตรฐานจาก `core.js` (`hipY = -92`, ขายาวท่อนละ `45px`, ตาสมมาตร `[-10, 10]`) เท่านั้น
2. **ห้ามวาดแขนสั้นลอยกลางอากาศ:** ทุกฉากที่ใช้ `hand()` ต้องวาดท่อนแขนยาว `400px` (`rr(c, -26, 0, 52, 400, 22)`) ยื่นพ้นขอบจอเสมอ หรือถ้าเป็นฉากตัวละครล้วงกระเป๋า/หยิบของในระยะกลาง ให้ใช้แขนของ `drawPerson` ที่เชื่อมกับหัวไหล่จริง
3. **ห้ามปล่อยให้เกิดฉากมืดดำ (`0 Unintended Black Intervals`):** ตรวจสอบว่าทุกฉากมีแสงสว่างและสีพื้นหลังที่มองเห็นได้ชัดเจน และตอนเปลี่ยนฉาก (`edgeFade`) ให้ดรอปแสงลงเพียง `35–40%` (`rgba(10,14,22,0.38)`) ไม่เฟดลงสีดำสนิทค้างไว้
4. **ระวัง Signature ของฟังก์ชันใน `core.js` ให้ตรงกันทั้งโปรเจกต์:**
   - `prog(t, a, b)` รับค่า `(เวลาปัจจุบัน, เวลาเริ่ม a, เวลาจบ b)` **ไม่ใช่** `(เวลาปัจจุบัน, เวลาเริ่ม, ระยะเวลา d)`!
   - `txt(c, s, x, y, size, col, weight, align, base)` รับค่า `size` เป็น **ตัวเลข (`Number` เช่น `24`)** ไม่ใช่สตริง CSS Font!
   - ฉากที่มีแผนภาพหรือวัตถุสำคัญอยู่ฝั่งซ้ายคู่กับการ์ดฝั่งขวา ต้องใส่ชื่อ view ลงใน `noBlurViews` ใน `index.html` เพื่อไม่ให้ `rackBlur` เบลอแผนภาพฝั่งซ้ายจนอ่านไม่ออก
5. **ตรวจสอบลำดับเลเยอร์ (`Z-Index Occlusion`):** วาดแขนหลัง (`suitSh`) $\rightarrow$ วาดด้ามจับ/ไม้พาย/ไม้คีบ $\rightarrow$ วาดลำตัวและแขนหน้า (`suitHi`) ทับด้านบน เพื่อให้มือกำวัตถุอย่างถูกต้อง ไม่ให้วัตถุลอยทับแขนหน้า
6. **บังคับรันสคริปต์สร้างตารางภาพครบทุกฉาก (`audit_all_scenes.png`) และเปิดดูด้วยตา (`read_file`) ก่อนเรนเดอร์ MP4:**
   - ต้องเรนเดอร์ภาพนิ่งของทุกฉาก (`Scene 1..N`) ออกมาเป็นแผ่นเดียว (`audit_all_scenes.png`) แล้วใช้เครื่องมือ `read_file` เปิดตรวจดูทุกช่องว่ามีฉากไหนตกหล่น (`fallback` ไปฉากเริ่มต้นเพราะชื่อ `s.view` ไม่ตรง), มีฉากไหนมืดเกินไป, หรือมีข้อความทับกันหรือไม่ ก่อนสั่งรัน `render_mp4.js`

---

## 3. Signature "Rules, Math & Lore" HUD System (ปรับเนื้อหาตามบริบทเรื่อง)

Read [Visual & HUD Specs](./references/visual-and-hud-specs.md) for exact coordinates, color tokens, and Canvas blueprints. การ์ดทุกชนิดใช้ดีไซน์สีครีม/แดง/เทาดำแบบ Real Lens แต่ **หัวข้อ ไอคอน และเนื้อหาในการ์ดต้องปรับให้ตรงกับเนื้อเรื่องนั้นๆ**:

1. **Survival Rule Card (`⚠️ กฎข้อ 1` – `กฎข้อ N`):** การ์ดสีครีม (`#F5EFE6`), ป้ายกำกับสีแดง (`#B91C1C`), ข้อความกฎบรรทัดแรกสีดำ (`#1C1917`), เงื่อนไขห้ามทำเด็ดขาดสีแดง (`#B91C1C`), เส้นคั่นบางๆ และคำแปลภาษาอังกฤษด้านล่าง
2. **Live Telemetry & Status Pill (Top-Right):** กล่องสีดำโปร่งแสง (`rgba(14,14,18,0.78)`) แสดงวัน/คืน เวลา และทรัพยากรหลักของเรื่องนั้นๆ (เช่น ความยาวธูปที่เหลือ, แคลอรี, อุณหภูมิ, หรือแบตเตอรี่)
3. **Live Distance / Countdown Pill (HUD Proximity Meter):** กล่องสีครีมใต้ Telemetry แสดงระยะห่างของสิ่งลี้ลับ หรือเวลานับถอยหลังที่เป็นอันตรายถึงชีวิต
4. **Inventory & Resource Audit Card (`• ของที่มี · INVENTORY`):** แสดงรายการสิ่งของที่มีอยู่จริงตามเนื้อเรื่อง
5. **Calculated Survival Math Card (`• คำนวณ...`):** แสดงสมการและการคำนวณเชิงตรรกะของเรื่องนั้นๆ (เช่น อัตราการเผาไหม้ธูป, อัตราการใช้ออกซิเจน, แคลอรี, หรือรอบเวลา)
6. **Branching Decision / Dilemma Flowchart (`drawFlow`):** แผนผังทางเลือก 2 ทางในนาทีวิกฤต แสดงผลลัพธ์ทางที่ตาย (`danger: true` สีแดง) เทียบกับทางที่รอดตามกฎ (`danger: false` สีเขียว)
7. **Clue / Anomaly / Lore Card (`clue`):** การ์ดเปิดเผยความจริงหรือวัตถุปริศนาในจุดหักมุมท้ายเรื่อง

---

## 4. Narrative Design Principles (หลักการวางโครงเรื่องตามเนื้อหาจริง)

แทนที่จะลอกโครงเรื่องจากเรื่องใดเรื่องหนึ่ง ให้วางโครงสร้างตามเนื้อเรื่องที่ได้รับมอบหมายโดยยึด **หัวใจ 5 ข้อของแนวสยองขวัญเชิงตรรกะ (Analytical Survival Horror)**:
1. **Cold Open Hook (ประโยคเปิดคลิปเตือนภัยทันที):** เปิดด้วยสถานการณ์เฉพาะของเรื่องนั้นๆ และกฎข้อที่สำคัญที่สุดภายใน 10 วินาทีแรก
2. **Isolation & Rule Discovery (จุดเริ่มต้นการติดอยู่ในสถานที่และที่มาของกฎ):** อธิบายสภาพแวดล้อมจริงของเรื่อง และวิธีที่ตัวเอกค้นพบกฎการเอาชีวิตรอด (เช่น สมุดบันทึกเก่า, ป้ายประกาศ, ข้อความเสียง, หรือคำเตือนของคนพื้นที่)
3. **Quantitative Survival Mechanics (เงื่อนไขเชิงตัวเลขและการคำนวณ):** แปลงกฎในเรื่องให้เป็นโจทย์คณิตศาสตร์หรือฟิสิกส์ที่คำนวณตามได้จริง (เช่น ระยะเวลา, ความเร็วการเผาไหม้, ระยะทาง, จำนวนทรัพยากรที่จำกัด)
4. **Escalating Encounters & Rule Execution (การเผชิญหน้าและการใช้ตรรกะแก้ปัญหา):** ตัวเอกใช้กฎและตัวเลขที่คำนวณไว้รับมือกับเหตุการณ์หลอนที่ทวีความรุนแรงขึ้นทีละขั้น
5. **The Logical Twist (จุดหักมุมที่เกิดจากช่องโหว่ของกฎหรือความเข้าใจผิดเพียงจุดเดียว):** ทำตามกฎและคำนวณถูกทุกข้อ ยกเว้นรายละเอียดเดียวที่มองข้ามไป ซึ่งเปลี่ยนความหมายของการกระทำทั้งหมดในตอนจบ

---

## 5. Voiceover & Sound Design Protocol (`gemini-3.8-flash-tts` First!)

Read [Pipeline & Tooling Guide](./references/pipeline-and-tooling.md) for the complete Node.js implementation.

### 5.1 TTS Model Priority Order (MANDATORY)
1. **1st Priority — `gemini-3.8-flash-tts` (ALWAYS TRY FIRST):**
   - Call via the modern **Gemini Interactions API** (`POST https://generativelanguage.googleapis.com/v1beta/interactions`).
   - Use male narrator voice **`Puck`** (`generation_config.speech_config: [{ voice: "Puck" }]`) with `speech_metadata` style annotation (`"calm, composed, deadpan male survival-horror documentary narrator in Thai, steady pace, low and even pitch, quiet suspense"`).
2. **2nd Priority — `gemini-3.8-flash-lite-tts`:**
   - Same `/v1beta/interactions` payload + `speech_metadata` + voice `Puck` if `gemini-3.8-flash-tts` hits quota.
3. **3rd Priority — `gemini-3.1-flash-tts-preview`:**
   - Separate Free Tier quota pool via `/v1beta/interactions` with voice `Puck`. **Important:** Omit `annotations` (`speech_metadata`) for `3.1-flash-tts-preview` (it returns `HTTP 400` if `speech_metadata` is present) and wrap raw `audio/l16` (`24 kHz` mono PCM) in a 44-byte RIFF WAV header if `"RIFF"` is absent.

### 5.2 Strict Single-Persona Consistency, SHA-256 Cache & Story-Matched SFX
- **NEVER mix different TTS engines within the same video** (e.g., never mix Gemini `Puck` on Scenes 1–3 with `msedge-tts` on Scenes 4–25). All scenes (`01`..`N`) MUST share one identical vocal persona.
- **SHA-256 Disk Caching (`audio/cache/<hash>.wav`):** Hash the scene text payload to prevent redundant API calls when regenerating or modifying unrelated scenes.
- **Proportional Thai Subtitles:** Chunk Thai dialogue to `<= 36` characters per cue and calculate start/end timestamps proportionally by character length.
- **Story-Matched Procedural SFX:** Synthesize ambient beds and foley cues that match the story's setting (e.g., canal water lapping, wooden boat creaks, brass bell chimes, dog barks, fluorescent hum, wind/rain, footsteps, and crisp `ui_pop` chimes for HUD card reveals).
- **Unified Broadcast Mastering (`-18 LUFS`):** Pass every scene WAV through the exact same FFmpeg chain (80Hz highpass, low-mid warmth at `180Hz`, harshness dip at `3.5kHz`, `2.5:1` compressor, `loudnorm=I=-18.0:LRA=5.0:TP=-1.5`) and mix procedural PCM foley/ambience with envelope sidechain ducking (duck by 35% during speech).

---

## 6. End-to-End Deliverables: MP4, Vertical Shorts (`EP 1–5`) & Covers

Read [Shorts & Thumbnails Guide](./references/shorts-and-thumbnails.md) for FFmpeg filter graphs and Puppeteer templates.

1. **Interactive HTML5 Player & Full `16:9` MP4 (`index.html` + `render_mp4.js`):**
   - Modular `episode.js` (script + SFX cues), `core.js` (2.5D rigs + HUD renderer), `views.js` (story-specific scene renderers), `timeline.js`, and deterministic `24/30 FPS` Puppeteer-to-FFmpeg `image2pipe` export at `loudnorm=I=-18:TP=-1.5:LRA=11`.
2. **Long-Form YouTube Thumbnails (`1920x1080`) + SEO Package:**
   - Generate **2 variants** tailored to the story's setting and main threat:
     - (A) **Showdown / Confrontation Split (The Signature Real Lens Thumbnail):** Protagonist vs. the story's Entity in the story's environment, Rule 1 card top-left, Telemetry + Distance pill top-right, Giant bold white title with red neon glow + yellow quote banner bottom.
     - (B) **5-Panel Escalation Strip:** 5 vertical columns depicting 5 key escalating beats/rules of the story.
3. **Vertical Shorts / TikTok / Reels Multi-Episode Adaptation (`1080x1920`, `9:16`):**
   - Split master video into **5 Cliffhanger Episodes (`EP 1` – `EP 5`, ~60–80s each)** following the story's natural act breaks.
   - **Minimalist Overlay (`overlay_epX.png`):** Render **ONLY the Video Title (`ชื่อคลิป`) and the single Red EP Pill (`EP X: ...`)** at the top (`y: 305` and `y: 345`). **ห้ามใส่ข้อความหมวดหมู่ด้านบนสุด, ห้ามใส่ป้ายสถานะแถวที่สองใต้ป้าย EP, และห้ามใส่กล่องข้อความสีครีม/การ์ดสรุปกฎด้านล่างของจอเด็ดขาด!**
   - **Shorts Mastering & Framing:** Mastered to `-18 LUFS` / `-14 LUFS`, rendered with 3-layer composite and **Safe Zone Check** (subtitles strictly $Y \le 1580\text{ px}$, right margin $\ge 140\text{ px}$).
4. **Scene-Based Vertical Shorts Covers (`1080x1920`, `9:16`):**
   - Extract real climax frame from each episode (`ffmpeg -ss <t> -i master.mp4 -frames:v 1`) and composite in Puppeteer Canvas with **ONLY the Top Headline (`ชื่อคลิป`), Center Climax Frame, and `EP 1–5` Stamp** (ห้ามใส่กล่องคำพูดหรือกล่องข้อความด้านล่าง).
5. **Viral Copywriting Package (Titles, Captions & Hashtags):**
   - Deliver tailored YouTube titles, full timestamps description, and 5 Shorts captions + hashtags.

---

## 7. End-to-End Production Checklist & Mandatory Visual QA Gate

When creating a new Real Lens episode from scratch, execute this exact 7-phase pipeline:

```
[Phase 1: Script] ─► [Phase 2: Audio] ─► [Phase 3: Views] ─► [Phase 4: Audit Grid] ─► [Phase 5: MP4] ─► [Phase 6: Thumbs/Shorts] ─► [Phase 7: Final QA]
  Story-Specific       Gemini 3.8 TTS      2.5D Visual Style    audit_all_scenes.png     Puppeteer Pipe     16:9 + EP 1–5 (9:16)        inspect_video.js
  Rules & Math         EBU -18 LUFS        Story Camera Shots   Read & Verify Every      Deterministic      Covers + Captions           16/16 PASS (0 Black)
```

1. **Phase 1 — Story-Specific Narrative & Scripting (`episode.js`):** Draft 25–30 scenes (~5:30–6:30 min) tailored to the user's story prompt (Rules, Quantitative Math, Setting-Native Clues, Logical Twist).
2. **Phase 2 — Voiceover & Sound Design (`generate_audio.js`):** Synthesize narration via `gemini-3.8-flash-tts` first (`voice: "Puck"`), use SHA-256 audio cache, wrap RIFF headers, normalize to `-18 LUFS`, slice Thai subtitles ($\le 36$ chars), mix story-matched procedural SFX/ambience, and output `timeline.json` + `timeline.js`.
3. **Phase 3 — 2.5D Rigging & Story-Driven Scene Views (`core.js`, `views.js`, `index.html`):** Use the canonical `backrooms-mall-7days` (`8DT1Q3NAgaA`) 2.5D visual engine in `core.js`, and design story-native camera angles and environments in `views.js` (zero copied mall tropes!).
4. **Phase 4 — Mandatory Pre-Render All-Scene Visual Audit (`audit_all_scenes.png`):** Render a grid image showing every single scene (`1..N`) with its scene ID and `s.view` name, and inspect it visually with `read_file` to confirm 0 distorted faces, 0 floating severed arms, 0 black scenes, and 0 missing view mappings before rendering MP4.
5. **Phase 5 — Deterministic Video Render (`render_mp4.js`):** Step Puppeteer in frame batches (`24/30 FPS`) and stream into FFmpeg `image2pipe` + `master.wav` (`-18 LUFS`).
6. **Phase 6 — Long-Form Thumbnails & Vertical Shorts (`generate_thumbnail.js`, `render_all_shorts.js`, `generate_scene_covers.js`):** Render Showdown & 5-Panel thumbnails (`1920x1080`), 5 vertical Shorts (`1080x1920`), and 5 vertical covers.
7. **Phase 7 — Final Automated QA Gate (`inspect_video.js`):** Run `node inspect_video.js <video.mp4>` and `node inspect_video.js shorts/<ep1.mp4> --shorts` and verify **16/16 PASS (`100% PRODUCTION READY & COMPLIANT`)** with **0 Unintended Black Intervals**.
