---
name: reallens-horror-animator
description: >-
  Use when creating, scripting, rigging, voicing, or rendering 2.5D HTML5 Canvas
  Thai/Isan folklore science-and-history documentary videos or "Real Lens" (@real_lens1)
  survival-horror animations with HyperFrames, Gemini 3.8 Flash TTS (PRONUNCIATION_MAP +
  350-500ms tail silence), Documentary/Survival HUD modes, Automated Narration QA,
  Folk Horror 16:9 YouTube thumbnails/SEO, or 40-50s Cliffhanger Bridge 9:16 Shorts.
---

# Real Lens & Thai Folk Horror Documentary Skill

2.5D HTML5 Canvas + HyperFrames + Gemini TTS production system supporting **two non-breaking modes**:
1. **`documentary` (Thai/Isan Folk Horror Decode — 8–12 min):** ถอดรหัสตำนานผีพื้นบ้านด้วยวิทยาศาสตร์ การแพทย์ และประวัติศาสตร์ (`NARRATIVE_MODE = 'documentary'`, `HUD_MODE = 'documentary'`).
2. **`survival` (Classic Real Lens @real_lens1):** Liminal Space, Night Shift Rules, Disaster Survival (`HUD_MODE = 'survival'` default — backward-compatible 100%).

> **Deep References (อ่านเฉพาะหมวดที่เกี่ยวข้องก่อนเริ่มเฟสนั้น):**
> - **Visuals, Palettes, Camera Pitch & Documentary HUD:** [`references/visual-and-hud-specs.md`](./references/visual-and-hud-specs.md)
> - **Audio TTS, `PRONUNCIATION_MAP`, Tail Pad, QA & HyperFrames:** [`references/pipeline-and-tooling.md`](./references/pipeline-and-tooling.md) · [`reallens-audio-director`](../reallens-audio-director/SKILL.md)
> - **SEO Titles, Folk Horror Thumbnails & Cliffhanger Shorts:** [`references/shorts-and-thumbnails.md`](./references/shorts-and-thumbnails.md)
> - **Multi-Agent Orchestration (4 Subagents):** [`references/multi-agent-workflow.md`](./references/multi-agent-workflow.md)

---

## 1. Iron Rules (กฎเหล็กห้ามฝ่าฝืน)

### 1.1 Hygiene & Context Isolation
- Copy starter files **ONLY** from `templates/` + `scripts/` (`scripts/generate_shorts_overlays.js` is the single canonical source).
- **Zero Cross-Episode Reading:** ห้ามอ่านหรือก๊อปปี้ `episode.js` / `views.js` / `packaging.json` จากโฟลเดอร์ตอนเก่าบนดิสก์
- **API Keys:** โหลด `GEMINI_API_KEYS` / `GEMINI_API_KEY` จาก `.env` หรือ env vars เท่านั้น ห้าม hardcode

### 1.2 Script Structure, Anti-Spoiler Arc & Anti-Repetition (`episode.js`)
- **Documentary Retention Arc (8–12 min):**
  - **`0:00–0:45` (`phase: 'hook'`):** เปิดเหตุการณ์หลอน + คำถามชวนสงสัย (**ห้ามเฉลยคำตอบวิทยาศาสตร์/ประวัติศาสตร์เด็ดขาด**)
  - **`0–50%` (`phase: 'folklore'`):** ปูตำนาน ความเชื่อ พิธีกรรม และความกดดันเต็มที่
  - **`50–90%` (`phase: 'decode'`, `isReveal: true`):** ค่อย ๆ คลี่คลายด้วยหลักฐานการแพทย์ มานุษยวิทยา หรือประวัติศาสตร์
  - **`90–100%` (`phase: 'outro'`, `isFinalScene: true`):** ขมวดข้อคิด + ใส่ CTA ชวนคอมเมนต์/กดติดตามได้ **เฉพาะฉากสุดท้ายเท่านั้น**
- **Strict Field Separation:** แยก `narration` *(หรือ `vo` เดิม — ข้อความ TTS เท่านั้น)* ออกจาก `visual_prompt` และ `camera_note` / `cameraSpec` เด็ดขาด **ห้ามใส่คำสั่งมุมกล้องลงใน `narration`** (เช่น `มุมเสย`, `มุมก้ม`, `มุมกล้อง`, `มองกล้อง`, `แพนกล้อง`, `ซูม`)
- **Anti-Repetition Rule:** ห้ามใช้สูตรแต่งตัวละครสมมติซ้ำทุกตอน (*"พ่อใหญ่/แม่เฒ่าวัย 60–70 ปี นั่งแคร่หน้าบ้าน"*) ให้สลับใช้ **บันทึกข่าวเก่า, งานวิจัยการแพทย์, ปี พ.ศ. จริง, เอกสารสนาม, หรือกรณีศึกษาประวัติศาสตร์**

### 1.3 Dual HUD Mode & Visual Guardrails (`core.js`, `views.js`)
- **`hudMode: "survival" | "documentary"`:**
  - `survival` (default): รักษาการทำงานเดิมสำหรับคลิปเอาชีวิตรอด (ภาพเล่าเรื่องสะอาด; game telemetry/cards opt-in เท่านั้น)
  - `documentary` (**Clean Cinema Mode**): ปิดแถบพลังและการ์ดกฎแบบเกมเอาชีวิตรอดทั้งหมด **โดยไม่วาดป้ายหรือกรอบข้อความป๊อปอัปใด ๆ ทับบนภาพแทน** — ให้หน้าจอสะอาด 100% เหลือเพียงภาพแอนิเมชันล้วน ๆ กับซับไตเติลเท่านั้น
- **Strictly Banned:** ป้ายแดง `บทนำ` (`drawChapter` ปิดถาวร), กรอบข้อความสารคดี/ป้ายป๊อปอัปทับบนจอ, กระดานสไลด์ `hand({ marker })` + `setLineDash`, พื้นหลัง `#000000` ล้วน, และ `horizonY` ระดับสายตาซ้ำ > 2 ซีน
- **Canonical API:** `prog(t, startA, endB)` (not duration) และ `txt(c, s, x, y, numericSize, ...)`

### 1.4 AI TTS, `PRONUNCIATION_MAP` & Automated Narration QA
- **Voice Lock:** `gemini-3.8-flash-tts` (`Puck`, `-18 LUFS`) เปลี่ยนเสียงได้เฉพาะ `role: 'character'` หรือ `'impersonate'`
- **`PRONUNCIATION_MAP` (`templates/pronunciation_map.js` + `generate_audio.js`):** พจนานุกรมคำอ่านแยกไฟล์กว่า 150 คำ (การแพทย์/วิทยาศาสตร์, ผีพื้นบ้าน/พิธีกรรม, คำอีสาน, คำไทยอ่านยาก) แปลงเฉพาะก่อนส่ง TTS โดย **ไม่แก้ซับไตเติล** และเติม/แก้เฉพาะตอนได้ใน `episode.PRONUNCIATION_MAP`
- **Isan TTS Rule:** จำกัดคำอีสานเฉพาะคำสั้น ๆ ที่ออกเสียงเป็นธรรมชาติ หรือแมปรูปสะกดตามเสียงอ่านใน `PRONUNCIATION_MAP`
- **Trailing Silence Padding:** เติมช่วงเงียบท้ายไฟล์ทุกซีน `350–500 ms` (`TRAILING_SILENCE_MS = 420` ms) กันตัดคำท้าย
- **Narration QA (`audit_all_scenes.js` & `inspect_video.js`):** ตรวจอัตโนมัติ (1) คำสั่งมุมกล้องหลุดในบทพากย์, (2) คำอังกฤษยังไม่แมป, (3) CTA โผล่ก่อนฉากสุดท้าย, (4) audio clipping / ตัดฉับปลายไฟล์

### 1.5 Cliffhanger Bridge 3-Angle Shorts (`40–50s`, Anti-Spoiler)
- **Default (`--format cliffhanger`):** 40–50s โครงสร้าง **Hook 3s → Dread Build-up → Twist Tease → ตัดจบก่อนเฉลย** (**ห้ามดึงซีนเฉลยมาสปอยล์**)
- **Sentence-Boundary Snapping:** จุดเริ่ม-จบตรงขอบประโยค/ซีนสมบูรณ์เท่านั้น ห้ามตัดกลางคำ
- **1 Long-Form = 3 Shorts:** (1) `cliff_01_ritual` พิธีกรรม/ความเชื่อ, (2) `cliff_02_tension` เหตุการณ์ตึงเครียด, (3) `cliff_03_twist` ปมหักมุมชวนสงสัย *(โหมดเดิม `events|single|two_part` ยังใช้ได้)*
- **Related Video Bridge CTA (3–4s ท้ายคลิป):** `overlay_<tag>_cta.png` ลูกศรชี้ลงซ้ายล่างไปยังปุ่ม **Related Video** (`"ดูเฉลยเต็มที่ลิงก์ด้านล่าง"`) + รองรับเสียง CTA (`SHORTS_BRIDGE_CTA_VO`)

### 1.6 SEO Title & Folk Horror Thumbnail Standard
- **Long-Form Title:** Keyword หลักอยู่ใน **50–60 ตัวอักษรแรก**, **ห้ามต่อท้ายชื่อช่องซ้ำ** (`| เว้าเรื่องหลอน`), **ห้ามสปอยล์เฉลย**, เลี่ยงชื่อเชิงวรรณกรรมที่กินพื้นที่ Keyword
- **Thumbnail (`generate_thumbnail.js`):** โทน **Folk Horror** (ดำ/เขียวเข้ม `#040806`–`#0F221A` ตัดด้วยแดงสด `#EF4444` หรือเหลืองไฟฉาย `#FACC15`), ข้อความ **<= 4 คำ** ตัวใหญ่ชัดบนมือถือ, และ **ห้ามซ้ำกับชื่อคลิป**

---

## 2. Core 7-Phase Workflow

```text
[1. Script] -> [2. Audio+QA] -> [3. Views+Sync] -> [4. Audit Gate] -> [5. Master+Thumb] -> [⏸️ Review] -> [6. 3x Shorts] -> [7. Shorts QA]
```

1. **Phase 1 — Script (`episode.js`):** ตั้ง `NARRATIVE_MODE` / `HUD_MODE`, แยก `narration`/`visual_prompt`/`camera_note`, ใส่ `PRONUNCIATION_MAP`, รัน `node audit_all_scenes.js --qa-only`
2. **Phase 2 — Audio (`node generate_audio.js`):** สังเคราะห์เสียง `Puck` + 420ms tail pad + `shorts_bridge_cta.wav` (ถ้ามี) + `timeline.json`
3. **Phase 3 — Views & Sync (`views.js`, `node sync_hyperframes.js`):** วาดฉากตาม `visual_prompt`/`camera_note` + สลับ `horizonY` (ใช้ `blurLayer(c, px, fn, '', 'cacheKey')` สำหรับฉากหลังนิ่งเพื่อลดภาระ 1080p) + ซิงก์ `index.html` (`1920x1080 @ 30fps`)
4. **Phase 4 — Verification Gate:** `node hf.js lint` (`0 err/warn`), `node hf.js check`, `node audit_all_scenes.js` → ตรวจ `audit_all_scenes.png` ด้วย `read_file`
5. **Phase 5 — Long-Form Native 1080p @ 30fps & Thumbnails:** `node hf.js render -f 30 -q looks --gpu --browser-gpu -o master_hf.mp4` *(หรือ `node render_mp4.js` ที่ใช้ NVENC GPU + parallel workers; โหมดร่างใช้ `-f 24 -q draft` หรือ `--720p`)*, `node generate_thumbnail.js --strict`, `node inspect_video.js master_hf.mp4 --strict` (`16/16 PASS`)
   - **⏸️ MANDATORY USER REVIEW GATE:** ส่งคลิปยาว + ปก 16:9 ให้ผู้ใช้ตรวจและอนุมัติก่อน **ห้ามรันสคริปต์ทำ Shorts อัตโนมัติจนกว่าผู้ใช้จะสั่งทำต่อ** *(ยกเว้นกรณีสั่งทำเฉพาะ Shorts ตั้งแต่ต้น)*
6. **Phase 6 — Cliffhanger Shorts (หลังอนุมัติ):** `node shorts_planner.js --format cliffhanger`, `node generate_shorts_overlays.js --format cliffhanger`, `node render_all_shorts.js --format cliffhanger`, `node generate_scene_covers.js --format cliffhanger` → ตรวจปก/overlay ด้วย `read_file`
7. **Phase 7 — Final Shorts QA:** `node inspect_video.js shorts/<clip>.mp4 --shorts --strict` (`16/16 PASS`, `<= 60.0s`)

---

## 3. Pre-Flight Checklist

- [ ] **Arc & Framing:** 0:00–0:45 ไร้สปอยล์, CTA เฉพาะฉากสุดท้าย, ไม่ซ้ำสูตร "พ่อใหญ่/แม่เฒ่านั่งแคร่หน้าบ้าน"
- [ ] **Narration QA:** `node audit_all_scenes.js --qa-only` ผ่าน 0 errors (ไม่มีมุมกล้องหลุด, แมปคำอังกฤษครบ, ไร้ CTA กลางคลิป)
- [ ] **Audio Tails:** ทุกซีนมี silence padding `350–500 ms` ไม่มี clipping หรือตัดพยางค์สุดท้าย
- [ ] **HUD & Visuals:** `HUD_MODE` ตรงแนวคลิป (`documentary` = Clean Screen ภาพแอนิเมชันล้วน + ซับไตเติล ไร้ป้าย/กรอบข้อความป๊อปอัป), ตรวจ `audit_all_scenes.png` ครบทุกซีน
- [ ] **SEO & Thumb:** Keyword ใน 50–60 ตัวแรก, ไร้ชื่อช่องต่อท้าย, ปก Folk Horror `<= 4` คำ ไม่ซ้ำชื่อคลิป
- [ ] **Shorts Bridge:** 3 มุม (พิธีกรรม / เหตุการณ์ / หักมุม) ยาว `40–50s`, จบขอบประโยค, ไร้สปอยล์เฉลย, มีลูกศร Related Video ชี้ลงซ้ายล่าง
- [ ] **Clean Pack:** ใช้ `node scripts/pack_skill.js` เมื่อบีบอัด `.zip` (ข้าม `.git/` เสมอ)
