# YouTube SEO, Folk Horror Thumbnails & Cliffhanger Bridge Shorts Guide

Production packaging standards for **Long-Form SEO Titles**, **Folk Horror 16:9 Thumbnails**, **Cliffhanger Bridge 3-Angle Shorts (`40–50s`)**, **Related Video Bridge CTAs**, and **Full-Screen 9:16 Covers**.

> **Canonical Scripts & Templates:** [`scripts/shorts_planner.js`](../scripts/shorts_planner.js), [`scripts/generate_shorts_overlays.js`](../scripts/generate_shorts_overlays.js) *(single source of truth)*, [`scripts/render_all_shorts.js`](../scripts/render_all_shorts.js), [`templates/generate_thumbnail.js`](../templates/generate_thumbnail.js), and [`templates/generate_scene_covers.js`](../templates/generate_scene_covers.js).

---

## 1. Long-Form YouTube SEO Title Formula (High-CTR & Searchable)

Every long-form episode (`8–12 min` documentary OR classic survival horror) MUST obey these 4 title rules (verified automatically by `generate_thumbnail.js` and `inspect_video.js`):

1. **Primary Keyword in First 50–60 Characters:** Place the core searchable subject (e.g., ชื่อผี/ตำนาน/ปรากฏการณ์) right inside the first 50–60 characters so mobile feeds & YouTube Search index it immediately.
2. **NO Redundant Channel Name Suffix:** **ห้ามใส่ชื่อช่องต่อท้ายชื่อคลิปซ้ำ** (เช่น ห้ามลงท้ายด้วย `| เว้าเรื่องหลอน`, `| Real Lens`, `| @WaoRueangLhon`) — ชื่อช่องแสดงใต้คลิปอยู่แล้ว การใส่ซ้ำกินพื้นที่ Keyword โดยเปล่าประโยชน์.
3. **Zero Spoilers in Title:** **ห้ามเฉลยสาเหตุทางวิทยาศาสตร์หรือประวัติศาสตร์ไว้ในชื่อคลิป** (❌ `"ผีแม่ม่ายแท้จริงคือโรคไหลตาย SUNDS"` → ✅ `"ตำนานผีแม่ม่ายอีสาน ทำไมชายหนุ่มยุค 80 ต้องทาเล็บแดงนอน?!"`).
4. **No Literary Fluff Eating Keyword Space:** หลีกเลี่ยงชื่อตอนเชิงวรรณกรรมที่กินพื้นที่ 30–40 ตัวอักษรแรกโดยยังไม่มี Keyword (❌ `"เสียงกระซิบแห่งรัตติกาลในหมู่บ้านที่ถูกลืม..."` → ✅ `"ตำนานผีปอบอีสาน ทำไมหมู่บ้านยุคก่อนถึงต้องไล่คนออกจากชุมชน?!"`).

### Good vs. Bad Title Examples
- ✅ `ตำนานผีแม่ม่ายอีสาน ทำไมชายหนุ่มยุค 80 ต้องทาเล็บแดงนอน?!` *(57 chars, keyword first, zero spoiler, zero channel suffix)*
- ✅ `ตำนานผีปอบบ้านดง ทำไมหมอธรรมต้องใช้ไม้หวายเฆี่ยนคนป่วย?!` *(56 chars, clear search term + mystery hook)*
- ❌ `เงาใต้แสงจันทร์ในคืนเดือนดับ: บทบันทึกแห่งความหวาดกลัว | เว้าเรื่องหลอน` *(literary fluff, no keyword, redundant channel suffix)*
- ❌ `เฉลยผีแม่ม่าย ที่แท้คือโรคไหลตาย Brugada Syndrome | เว้าเรื่องหลอน` *(spoils reveal + redundant channel suffix)*

### Structured Long-Form YouTube Description Template
```markdown
[2 บรรทัดแรก: เปิดปมเหตุการณ์หลอน + คำถามชวนสงสัย (ห้ามสปอยล์เฉลยวิทยาศาสตร์!)]

[ย่อหน้าที่ 2: ปูบริบทความเชื่อ พิธีกรรม และบันทึกเหตุการณ์จริงในอดีต ก่อนพาไปสืบค้นหลักฐานการแพทย์/ประวัติศาสตร์]

⏱️ สารบัญเวลา (Timestamps)
00:00 เปิดปมปริศนา (0:00–0:45)
00:45 ตำนาน ความเชื่อ และพิธีกรรมป้องกัน
04:30 ร่องรอยผิดปกติและบันทึกเหตุการณ์จริง
06:15 ถอดรหัสด้วยหลักฐานวิทยาศาสตร์และประวัติศาสตร์
09:40 บทสรุปเบื้องหลังตำนาน

#ตำนานผีไทย #เรื่องเล่าอีสาน #ถอดรหัสตำนาน #สารคดีลี้ลับ #FolkHorror
```
- **Pinned Comment:** คำถามเปิดประเด็นให้คนดูเล่าประสบการณ์ท้องถิ่น (ไม่ซ้ำประโยคเดิมทุกตอน).

---

## 2. Folk Horror Channel Thumbnails (`1920x1080`, `templates/generate_thumbnail.js`)

`templates/generate_thumbnail.js` enforces the **Folk Horror Channel Visual Identity** and runs automatic **Copy & SEO QA** (`--strict` fails on violations):

### 2.1 Folk Horror Color Identity
- **Background & Scrim:** Deep murky black / dark forest green (`#040806` → `#091510` → `#0F221A`) so every video on the channel looks cohesive and unmistakable on the feed.
- **Focal Eye-Catcher Accent (`--accent red` or `--accent flashlight`):**
  - **Vivid Crimson Red (`#EF4444` / `#DC2626`)** — for dread, taboos, blood-red rituals, warning cues.
  - **Flashlight Yellow (`#FACC15` / `#F59E0B`)** — for night searchlights, lantern glow, eerie focal discoveries.

### 2.2 Strict Thumbnail Copy Rules (`<= 4 Words` & Zero Duplication)
1. **Max 4 Words Total (`<= 4` concise Thai words/phrases):** Massive `Kanit 900` typography (`up to 164px`, `17%` pure black stroke) so text is instantly readable on small mobile screens.
2. **NEVER Duplicate the Video Title:** Thumbnail text must **complement** or heighten emotion — never copy-paste `TITLE`!
   - Video Title: `ตำนานผีแม่ม่ายอีสาน ทำไมชายหนุ่มยุค 80 ต้องทาเล็บแดงนอน?!`
   - Thumbnail (`<= 4` words): Line 1 `ทาเล็บแดงนอน` / Line 2 `กันผี?!` *(2 visual phrases, huge, zero title duplication!)*
3. **Zero Clutter:** No redundant channel handle kicker unless explicitly opted in (`showKicker: true`), no telemetry HUD boxes, no bullseye rings, keep focal monster/prop clear of YouTube's bottom-right timestamp.

#### Recommended `packaging.json` Blueprint
```json
{
  "title": "ตำนานผีแม่ม่ายอีสาน ทำไมชายหนุ่มยุค 80 ต้องทาเล็บแดงนอน?!",
  "theme": "folk_horror",
  "accentMode": "red",
  "titleTop": "ทาเล็บแดงนอน",
  "titleBot": "กันผี?!",
  "titleRedLine": 2,
  "subHook": "",
  "showdownView": "window_shadow_red_toes",
  "showdownLt": 4.2,
  "focusX": 735,
  "focusY": 350
}
```
*(Run `node generate_thumbnail.js --accent red --strict` or `--accent flashlight --strict`.)*

---

## 3. Cliffhanger Bridge 3-Angle Shorts System (`40–50s`, Zero Spoilers!)

To funnel Shorts viewers straight into the `8–12 min` Long-Form video instead of giving away the answer inside Shorts, `scripts/shorts_planner.js` defaults to **`--format cliffhanger`** on long-form episodes (`> 60s`).

### 3.1 Cliffhanger Bridge Architecture (`40–50s` Total)
```text
[0–3s Hook] ──► [3–32s Dread Build-up] ──► [32–44s Twist Tease ("เอ๊ะ!")] ──► [44–47.5s Related Video Bridge CTA]
เหตุการณ์หลอน      พิธีกรรม/ความเชื่อ/พยาน      ปมขัดแย้งชวนสงสัย (ตัดก่อนเฉลย!)     ลูกศรชี้ลงซ้ายล่าง + "ดูเฉลยเต็มที่ลิงก์ด้านล่าง"
```
- **STRICT Anti-Spoiler Filter (`isRevealOrDecodeScene`):** Automatically excludes any scene tagged `isReveal: true`, `isDecode: true`, `isFinalScene: true`, `phase: 'decode' | 'reveal' | 'outro'`, or revealing medical/historical explanations in the back half.
- **STRICT Sentence-Boundary Snapping (`snapSceneWindowToSentence`):** Start and end cuts snap exclusively to complete scenes or complete sentence cue boundaries (never cutting mid-word or mid-clause on Thai conjunctions like `แต่`, `และ`, `ที่`, `ซึ่ง`, `ว่า`).

### 3.2 Multi-Angle Shorts Matrix (1 Long-Form = 3 Distinct Shorts)
| Angle | Tag & Output File | Narrative Focus | Default Sub-Hook |
| :--- | :--- | :--- | :--- |
| **1. Ritual / Belief** | `cliff_01_ritual` (`master_hf_cliff_01_ritual.mp4`) | พิธีกรรม ข้อห้าม ของกันผี ความเชื่อท้องถิ่นสุดหลอน | `พิธีกันผีนี้... ซ่อนอะไรไว้?!` |
| **2. Tense Incident** | `cliff_02_tension` (`master_hf_cliff_02_tension.mp4`) | เหตุการณ์กลางดึก คำบอกเล่าพยาน บันทึกเหตุการณ์สุดตึงเครียด | `คืนนั้น... เกิดอะไรขึ้นกันแน่?!` |
| **3. Twist Paradox** | `cliff_03_twist` (`master_hf_cliff_03_twist.mp4`) | ปมหักมุม/ข้อขัดแย้งชวนสงสัย right before scientific reveal | `ทำไมถึงเกิดซ้ำเฉพาะจุดนี้?!` |

*(You can override angles manually via `SHORTS_ANGLES` in `episode.js` or `cliffhangerAngles` in `shorts_config.json`, or let `shorts_planner.js` auto-pick all 3 angles!)*

### 3.3 Related Video Bridge CTA (Final 3–4 Seconds)
- **Visual Overlay (`overlay_<tag>_cta.png`):** Generated automatically by [`scripts/generate_shorts_overlays.js`](../scripts/generate_shorts_overlays.js) for every Cliffhanger Short. Renders a high-contrast Folk Horror callout panel (`"ดูเฉลยเต็มที่ลิงก์ด้านล่าง"`) + glowing downward-left vector arrow anchored at **bottom-left above YouTube Shorts' channel name & Related Video button** (`x: 52..848, y: 1320..1605`, clear of right UI icons `x > 940`).
- **Spoken CTA Voiceover Support:** Define `SHORTS_BRIDGE_CTA_VO` in `episode.js` (e.g., `"ความจริงเบื้องหลังตำนานนี้คืออะไร กดดูเฉลยเต็มที่ลิงก์ด้านล่างได้เลยครับ"`). `generate_audio.js` synthesizes `audio/shorts_bridge_cta.wav` with the locked `Puck` voice, and `render_all_shorts.js` automatically splices it into the final 3.5s Bridge CTA segment alongside `overlay_<tag>_cta.png`!

### 3.4 Cliffhanger CLI Workflow
```bash
# 1. Plan 3 Cliffhanger Bridge Shorts (40-50s, anti-spoiler, sentence-snapped)
node shorts_planner.js --format cliffhanger --min-sec 40 --max-sec 50

# 2. Generate top title overlays + Related Video Bridge CTA overlays
node generate_shorts_overlays.js --format cliffhanger

# 3. Render all 3 Shorts in native 1080x1920 fullscreen (30fps, -14 LUFS)
node render_all_shorts.js --format cliffhanger

# 4. Generate clean HUD-free 9:16 covers & run strict QA
node generate_scene_covers.js --format cliffhanger
node inspect_video.js shorts/master_hf_cliff_01_ritual.mp4 --shorts --strict
```

---

## 4. Legacy Shorts Formats & Vertical Covers (`1080x1920`)

- **Legacy Formats (100% Preserved for Survival Horror & Standalone Shorts):**
  - `--format events`: 45–58s standalone event cuts (`master_hf_event_01.mp4 ..`)
  - `--format single`: 1 condensed 45–58s clip (`master_hf_single_short.mp4`)
  - `--format two_part`: Max 2 parts (`EP 1` + `EP 2` with 3s recap `isRecap: true`)
- **Overlay Rules (`overlay_*.png`):** Subtle top scrim (`y: 0..430`) + 2-line two-tone stroked title (`#EF4444` / `#FFFFFF`) ONLY — ZERO red pill below headline, ZERO leading `EP 1:` / `เหตุการณ์ #1:`, ZERO black letterbox bars.
- **Cover Rules (`cover_*.png` via `templates/generate_scene_covers.js`):** Captures 100% HUD-free (`__HIDE_HUD = true`, stubbing `drawTele`, `drawCard`, `drawSub`, `drawShortsEndingCTA`) climax artwork with auto hero-focus (`analyzeHeroSubject`), Top 2-line title + optional red sub-hook box. Strictly ZERO viewfinder corner brackets, ZERO bottom stamps, ZERO Telemetry HUD. Always inspect covers via `read_file`.

---

## 5. Shorts Copywriting & Caption Framework

- **Shorts Feed Title (`<= 42` chars, NO leading `EP` / `เหตุการณ์ #`, NO channel name suffix):**
  - Angle 1 (Ritual): `ทำไมชาวบ้านยุค 80 ต้องแขวนใบหนาดหน้าเรือน?!`
  - Angle 2 (Tension): `ชายหนุ่มหลับแล้วไม่ตื่นทั้งหมู่บ้าน คืนนั้นเกิดอะไรขึ้น?!`
  - Angle 3 (Twist): `ไร้บาดแผลแต่ตายเฉพาะผู้ชาย... ปริศนาที่หมอยุคนั้นยังงง?!`
- **Bridge Caption:** 1-line mystery hook + 1-line tease + `"▶ กดดูเฉลยเต็มแบบวิทยาศาสตร์และประวัติศาสตร์ได้ที่ลิงก์คลิปด้านล่าง!"` + `#ตำนานผีไทย #เรื่องเล่าอีสาน #สารคดีลี้ลับ #Shorts`
- **Cliché Outro Ban:** NEVER say `"ฝากกดไลก์ กดแชร์ กดติดตามด้วยนะครับ"` in Shorts — end directly on the Twist Tease → 3–4s Related Video Bridge CTA!
