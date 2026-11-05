---
name: reallens-horror-animator
description: >-
  End-to-end production workflow and programmatic 2D vector animation system for creating
  "Real Lens" (@real_lens1) style 2.5D geometric flat-vector survival horror, urban legend,
  liminal-space survival, and calculated disaster survival videos. Covers scripting, modular
  HTML5 Canvas rigging, HUD rule/math cards, unified Thai TTS voiceover (prioritizing
  gemini-3.8-flash-tts), procedural SFX + EBU R128 mastering, 16:9 MP4 rendering, YouTube
  thumbnails, and 9:16 vertical Shorts/TikTok/Reels multi-episode splitting with scene-based covers.
---

# Real Lens (@real_lens1) 2.5D Geometric Survival & Horror Animation Skill

This skill encodes the complete visual architecture, narrative pacing, UI/HUD card system, unified `gemini-3.8-flash-tts` audio pipeline, deterministic HTML5-to-MP4 renderer, and vertical Shorts multi-episode adaptation workflow for the **"Real Lens" (@real_lens1)** and **"Rules of Survival / Liminal Space" (เช่น "7 วัน ติดอยู่ในห้างร้างไร้ทางออก")** YouTube animation style.

Unlike static AI image-slideshow channels, this style uses **procedural 2D flat-vector paper-cutout rigging with 2.5D depth-of-field (DoF), volumetric lighting cones, scientific/rules-of-survival HUD overlays, calculated quantitative math, and deadpan first-person narration**.

---

## 1. Visual DNA & Art Direction ("2.5D Geometric Paper-Cutout Survival Horror")

### 1.1 Character Construction (Authentic Real Lens Vector Rig)
Characters are built from clean geometric Canvas2D/SVG primitives with **no heavy black outlines** (lineless flat shading with cylindrical horizontal gradients):
- **Head & Face (Strict Real Lens Standard):**
  - Smooth oval capsule/dome shape (`#D49B66` → `#C0824D` for human skin; `#EAECEF` → `#CFD4DC` for pale entities).
  - **Eyes:** Solid minimalist black bead eyes (`#18181B` ellipse). **STRICTLY PROHIBITED:** White anime eye sclera, specular catchlight dots, and thick cartoon V-eyebrows!
  - **Under-Eye Fatigue Bags:** Subtle soft dark crescent shadows (`rgba(110, 48, 16, 0.32)`) curved directly under each eye, conveying authentic survival exhaustion, lack of sleep, and psychological dread.
  - **Mouth & Nose:** Clean horizontal dark slit line (`#27272A`) for a calm, stoic, focused survival expression; transitions to a small circular open mouth (`o` shape) during sudden shocks, gasps, or near-death close encounters. Flat face (no harsh triangular cartoon nose wedge).
  - **Hair:** Clean rounded black skullcap (`#18181B`) with a smooth side-part fringe wave sweeping across the forehead from right to left, and neat sideburns down to ear level.
- **Protagonist Attire ("ต้น" / Everyday Civilian Standard):**
  - Striped or muted casual wear: Light blue-and-white horizontal striped t-shirt (`#7DD3FC` and `#F8FAFC` alternating bands), dark navy/grey straight-cut trousers (`#1E293B`), and dark rubber-soled walking shoes.
  - Carrying items: White plastic grocery shopping bag in early scenes; forearm wrapped in beige cloth duct tape strips marked with black ink codes (`[A → 4]`, `[K → 1]`, `[P → 9]`) in mid-to-late survival scenes.
- **Entity Construction ("พนักงานทำความสะอาดไร้หน้า / The Faceless Cleaner"):**
  - **Uniform:** Dark slate-grey service uniform and trousers (`#334155` → `#1E293B`), peaked service flat cap (`#475569`).
  - **Head & Mask:** Bloodless smooth white oval head (`#F1F5F9` → `#CBD5E1`).
  - **The Reveal (Image 3 Reference):** Two vertical black hollow eye slits with dark crimson / blood trails dripping down (`#8B0000`). No mouth or nose.
  - **Equipment:** Vintage commercial yellow mop bucket with squeezer cart (`#EAB308`), long natural wood mop pole (`#D4A373`), and damp mop head creating reflective wet tile streaks.
  - **Movement:** Rigid, slow, unhurried mechanical stride (e.g., `y` bobbing `Math.sin(t * 4) * 2px`, mop swaying synchronously).
- **Proportions & Neck (Anti-Stilt Standard):**
  - Proportional cylindrical neck (width ~11px, length ~14px) with continuous sloping **Trapezius collar** into shirt (eliminates disjoint "bowling pin/giraffe" necks).
  - Balanced athletic height: Torso ~40%, Legs ~60%. Articulated knee joints with natural flexion, calf taper, and tactical lug-soled rubber work boots (eliminates rigid stilt legs).
  - Arms hang naturally with subtle $15^\circ$ elbow bend and rounded cuffs/hands.
- **Weight-bearing Movement Ergonomics:**
  - When carrying heavy survival loads (e.g., 15kg rice sack, supplies), supplies rest on the **shoulder and back** so the character's head and face remain **100% visible** in 3/4 view. Spine tilts forward $14^\circ$ and knees bend $20^\circ$ to absorb load. Arms wrap under to lift and grip.

### 1.2 2.5D Multi-Plane Environment & Shaders
Compose every scene from **4 depth planes** plus environmental shaders:
1. **Plane 0 — Sky / Ambient Backdrop:** Deep midnight blue (`#080C18` → `#141D30`), Backrooms sickly fluorescent ochre (`#2A2614` → `#14120A`), or parking lot concrete slate (`#0F172A` → `#020617`).
2. **Plane 1 — Blurred Far Background (`ctx.filter = 'blur(8px)'`):** Distant parking rows, infinite one-point perspective mall corridors, or snow-buried streets. Rack-focus dynamically to `blur(12px–14px)` whenever a HUD Rule/Math Card enters.
3. **Plane 2 — Midground Architecture & Calculated Survival Props:**
   - **Underground Parking B2:** Concrete pillars with black-and-yellow diagonal hazard stripes (`#EAB308` / `#09090B`), minimalist parked cars (blue, white, charcoal), numbered signage pillars (`C-01` to `C-12` vs impossible `C-13`).
   - **Infinite Liminal Mall:** Pastel storefront shutter doors, infinite ceiling rows of diffuse warm fluorescent light tubes (`#FEF08A` @ `0.85`), central fountain square with water jets, supermarket aisles stacked with geometric cereal/bread packaging.
   - **Hiding Spaces:** Clothing store fitting room booths with deep crimson velvet curtains (`#7F1D1D`), emergency exit fire doors with glowing neon green exit indicators (`[P - B2]`).
4. **Plane 3 — Volumetric Light Cones, Floor Reflections & Vignette:**
   - Wet mop floor reflections: Glossy floor tiles (`#0F172A`) reflecting ambient light and entity silhouette with dynamic water puddle shine (`rgba(255, 255, 255, 0.15)`).
   - Flickering streetlights/fluorescents, warm flashlight cones, blackout transitions (lights snapping off row-by-row into darkness), and a dark radial horror vignette (`transparent 45%` → `rgba(0,0,0,0.88) 100%`).

---

## 2. Signature "Rules, Math & Lore" HUD System

Read [Visual & HUD Specs](./references/visual-and-hud-specs.md) for exact coordinates, color tokens, and Canvas blueprints.

1. **Survival Rule Card (`⚠️ กฎข้อ 1` – `กฎข้อ 5`):** Warm-cream card (`#FAF7F2`), dark red/charcoal badge pill (`#B91C1C` / `#18181B`), bold dark slate Thai rule headline (`#18181B`), danger condition highlighted in bold red (`#9E1B1B`), thin divider line, and uppercase English sub-caption (`RULE 1 · WHEN THE LIGHTS GO OUT — DON'T STEP ON THE WET FLOOR`).
2. **Live Telemetry & Status Pill (Top-Right):** Dark charcoal rounded rectangle (`#18181B`):
   - Line 1: `• วันที่ 7 / 7 · ไฟดับ   03:00` (Red pulsating dot `•`, bold white time).
   - Line 2: `พลังงานที่เหลือ: 90 kcal` (Warm yellow/amber `#FACC15`).
3. **Live Distance Tracker Pill (HUD Proximity Meter):**
   - White rounded container below telemetry:
     - Dark charcoal inner pill: `• ระยะห่าง` (Green or white dot).
     - Big bold crimson text: `40 ม.` → `32 ม.` → `22 ม.` → `6 ม.` → `4 ม.` → `2 ม.`! (Builds intense claustrophobic suspense as entity nears).
4. **Inventory & Resource Audit Card (`• ของที่มี · INVENTORY`):**
   - Cream card listing audited supplies with quantities and caloric value: Duct tape 1 roll, Whiteboard markers 2 pens, Water bottle 0.3L, Bread 500 kcal.
5. **Cursed Item / Food Expiry Validation Card:**
   - Side-by-side product cards comparing:
     - Item 1 (Valid): `ขนมปังโฮลวีท` · `EXP 12/11/2026` (Green border/tag).
     - Item 2 (Calendar Anomaly): `แครกเกอร์ผัก` · `EXP 31/02/2026` (Red border: 31 Feb does not exist!).
     - Item 3 (Cursed Anomaly): `ขนมปังลูกเกด` · `EXP เมื่อคุณกิน` (Purple border: Psychological horror warning).
6. **Calculated Survival Math Card (`• คำนวณแคลอรี · CALORIES`):**
   - Quantitative breakdown showing total available calories (`4,800 kcal`) and physics formula:
     - `ถ้าเดิน 20 กม./วัน = 2,400 kcal → อยู่ได้แค่ 2 วัน`
     - `ถ้าพักผ่อนนิ่ง = 690 kcal/วัน → อยู่รอดได้ 7 วัน!`
7. **Spatial Rotation & Modulo Math Card (`• คำนวณหาทางออก · EXIT`):**
   - Circular dial map with 12–16 sectors rotating around a central hub.
   - Modular arithmetic formula:
     - `ทุก 6 ชม. ทุกโซน เลื่อน +5 ช่อง ตามเข็มนาฬิกา`
     - `โซน P (ลานจอด) ตอนนี้: ช่อง 9 ➔ 9 + 5 = 14 ≡ 2 (mod 12)`
     - Precise exit window: `ช่อง 4 = ติดฟู้ดคอร์ท วันที่ 7 · 18:00 (ถ้าพลาดต้องรออีก 72 ชม.)`.
8. **Branching Decision / Dilemma Flowchart:**
   - Splits a sudden crisis at 17:58 (2 minutes before exit gate opens when lights fail early):
     - **Option A:** `รอไฟติด` → `⏳ ทางออกเลื่อนหาย` (Starvation).
     - **Option B:** `เดินฝ่าความมืด` → `🧹 ต้องผ่านมันไปให้ได้` (Execute Rule 1: walk calmly, don't step on wet floor).
9. **Physical Clue & Anomaly Handwriting Card:**
   - Macro close-up on physical artifact (forearm tape map, or mysterious duct tape on pillar C-12: `"วันที่ 8"` with identical handwriting).

---

## 3. Narrative Architectures

### Format A: 2-Minute Urban Legend Micro-Arc (~120–130s, ~20–25 beats)
1. **Cold Open Paradox & Rule 1 (0:00–0:15)** → **Mundane Night Shift & Warning Artifact (0:15–0:45)** → **UI/Environmental Omen (0:45–1:15)** → **Confrontation, Decision Tree & Rule 2 Loophole (1:15–1:50)** → **Amulet Cost & Chilling Epilogue (1:50–2:10)**.

### Format B: Master Calculated Survival Long-Form (~5:30–6:00 Minutes / 330–360s, ~25 Scenes)
Proven in *"7 วัน ติดอยู่ในห้างสรรพสินค้าที่ไม่มีทางออก"* and *"-40°C Tropical Freeze"*:
- **Act 1: Cold Open Warning & Fatal Paradox (0:00–0:35):**
  - Scene 1: Sudden dark corridor confrontation. Pop Rule #1 warning (*"เมื่อไฟห้างดับ ห้ามวิ่ง และห้ามเหยียบพื้นที่เพิ่งถูกถูเด็ดขาด"*).
  - Scene 2: Kinetic Title Card: Spotlight cone on dark wall with giant red title + English sub-label.
- **Act 2: The Baseline & Spatial Anomaly (0:35–1:10):**
  - Scenes 3–5: Protagonist introduction (*"ผมชื่อต้น..."*), mundane post-work routine in Parking B2, locating car near impossible pillar `C-13` (parking lot only has `C-01` to `C-12`). Turning past column and crossing into liminal space.
- **Act 3: Resource Audit & Spatial Paradox (1:10–1:55):**
  - Scenes 6–8: Buzzing fluorescent lights, zero phone signal, turning off phone to preserve battery (`87%`).
  - Scenes 9–10: Emptying pockets onto tile floor for Resource Audit Card (duct tape, 2 markers, water, bread). Walking for hours only to loop back to the same central fountain square. Marking floor tile with tape arrow `07`.
- **Act 4: Architectural Rules & Cursed Sustenance (1:55–2:35):**
  - Scenes 11–12: Midnight structural rumble (`00:00`). Pop Rule #2 (`"ทุก 6 ชั่วโมง โครงสร้างทั้งห้างจะสลับตำแหน่งเอง"`). Circular dial map showing sector shifting.
  - Scenes 13–15: Day 2 in Supermarket. Inspecting food expiry labels. Pop Rule #3 (`"กินเฉพาะของที่วันหมดอายุมีอยู่จริงบนปฏิทิน"`). Lore consequence of eating fake-date food (memory wipe). Calorie Math Card showing 4,800 kcal budget (20 km burn vs 7-day survival resting rate).
- **Act 5: The Entity & The Proximity Chase (2:35–3:25):**
  - Scenes 16–18: Night 2 (`03:00`). Lights shut off row-by-row. Squeaking cleaning cart wheels. Encounter with The Cleaner.
  - Scenes 19–20: Protagonist hides in clothing store fitting room behind red curtain. Live Distance Tracker drops: `40 ม.` → `22 ม.` → `6 ม.` → `2 ม.`! The Cleaner mops past inches away.
- **Act 6: Countermeasure & Calculated Exit Formula (3:25–4:10):**
  - Scenes 21–22: Day 3–4 morning. Discovering all floor tape arrows were mopped away. Solution: Forearm Tape Map (`[A → 4]`, `[K → 1]`, `[P → 9]`).
  - Scenes 23–24: Recording 10 rotation cycles. Pattern Card (+5 slots clockwise every 6 hrs). Modulo Exit Formula calculating Zone P alignment with Food Court at Day 7, 18:00.
- **Act 7: Peak Threat Climax & Execution (4:10–5:00):**
  - Scenes 25–27: Day 7 (`17:58`). Starving, 2 milk cartons left. Lights suddenly fail 2 minutes early!
  - Scene 28: Branching Decision Dilemma Card (`รอไฟติด` vs `เดินฝ่าความมืด`). Protagonist chooses to walk forward in darkness, calmly executing Rule 1.
  - Scene 29: Entity right behind him (`เสียงล้อรถเข็นอยู่ข้างหลังไม่ถึง 5 เมตร`, Distance `4 ม.`). Seeing glowing green exit sign `[P - B2]` and bursting through the door.
- **Act 8: Time Dilation & Chilling Epilogue (5:00–5:43):**
  - Scene 30: Returning to real B2 parking lot. Phone turns on: `19:14` Friday night (only 12 minutes passed in the real world vs 7 days inside!).
  - Scene 31: Looking back at pillar C-13: It has vanished, leaving only C-12. But on C-12 is a fresh duct tape note: `"วันที่ 8"` written in the protagonist's exact handwriting!
  - Scene 32: Outro Title Card with chilling community question (*"ถ้าเป็นคุณ... จะกล้าลงไปลานจอด B2 อีกไหม?"*).

---

## 4. Voiceover & Sound Design Protocol (`gemini-3.8-flash-tts` First!)

Read [Pipeline & Tooling Guide](./references/pipeline-and-tooling.md) for the complete Node.js implementation.

### 4.1 TTS Model Priority Order (MANDATORY)
1. **1st Priority — `gemini-3.8-flash-tts` (ALWAYS TRY FIRST):**
   - Call via the modern **Gemini Interactions API** (`POST https://generativelanguage.googleapis.com/v1beta/interactions`).
   - Use male narrator voice **`Puck`** (`generation_config.speech_config: [{ voice: "Puck" }]`) with `speech_metadata` style annotation (`"calm, composed, deadpan male survival-horror documentary narrator in Thai, steady pace, low and even pitch, quiet suspense"`).
2. **2nd Priority — `gemini-3.8-flash-lite-tts`:**
   - Same `/v1beta/interactions` payload + `speech_metadata` + voice `Puck` if `gemini-3.8-flash-tts` hits quota.
3. **3rd Priority — `gemini-3.1-flash-tts-preview`:**
   - Separate Free Tier quota pool via `/v1beta/interactions` with voice `Puck`. **Important:** Omit `annotations` (`speech_metadata`) for `3.1-flash-tts-preview` (it returns `HTTP 400` if `speech_metadata` is present) and wrap raw `audio/l16` (`24 kHz` mono PCM) in a 44-byte RIFF WAV header if `"RIFF"` is absent.

### 4.2 Strict Single-Persona Consistency & Foley Integration
- **NEVER mix different TTS engines within the same video** (e.g., never mix Gemini `Puck` on Scenes 1–3 with `msedge-tts` on Scenes 4–25). All scenes (`01`..`N`) MUST share one identical vocal persona.
- **Specific Atmospheric SFX for Liminal Survival Horror:**
  - `fluorescent_hum`: Persistent 60Hz + 120Hz electrical buzz ducked under voice.
  - `mechanical_grind`: Deep low-frequency concrete-on-steel friction for the 6-hour sector shifts.
  - `cart_squeak`: Periodic high-pitched metal wheel screech for the cleaning cart (`03:00`).
  - `mop_squelch`: Wet damp fabric friction on tile flooring.
  - `ui_pop` & `radar_ping`: Crisp chimes for HUD card reveals and distance meter updates.
- **Unified Broadcast Mastering (`-18 LUFS`):** Pass every scene WAV through the exact same FFmpeg chain (80Hz highpass, low-mid warmth at `180Hz`, harshness dip at `3.5kHz`, `2.5:1` compressor, `loudnorm=I=-18.0:LRA=5.0:TP=-1.5`) and mix procedural PCM foley/ambience with envelope sidechain ducking (duck by 35% during speech).

---

## 5. End-to-End Deliverables: MP4, Vertical Shorts (`EP 1–5`) & Covers

Read [Shorts & Thumbnails Guide](./references/shorts-and-thumbnails.md) for FFmpeg filter graphs and Puppeteer templates.

1. **Interactive HTML5 Player & Full `16:9` MP4 (`index.html` + `render_mp4.js`):**
   - Modular `episode.js` (script + SFX cues), `core.js` (2.5D rigs + HUD renderer), `views.js` (scene renderers), `timeline.js`, and deterministic `24/30 FPS` Puppeteer-to-FFmpeg `image2pipe` export.
2. **Long-Form YouTube Thumbnails (`1920x1080`) + SEO Package:**
   - Generate **2 variants**:
     - (A) **Showdown / Confrontation Split (The Signature Real Lens Thumbnail):** Entity with mop and bleeding eyes on left, Protagonist crouching in shock on right, Rule 1 card top-left, Telemetry + Distance pill top-right, Giant bold white title with red neon glow + yellow quote banner bottom.
     - (B) **5-Panel Escalation Strip:** 5 vertical columns (`Day 1` → `Day 7` or `Rules 1–4`).
3. **Vertical Shorts / TikTok / Reels Multi-Episode Adaptation (`1080x1920`, `9:16`):**
   - Split master video into **5 Cliffhanger Episodes (`EP 1` – `EP 5`, ~60–80s each)**:
     - `EP 1`: เสาลานจอดรถ C-13 ที่ไม่มีอยู่จริง & กฎข้อ 1
     - `EP 2`: วันที่ 1 วนลานน้ำพุเดิม & กฎข้อ 2 ห้างสลับตำแหน่งทุก 6 ชม.
     - `EP 3`: ซูเปอร์มาร์เก็ตวันหมดอายุ 31 ก.พ. & คำนวณ 4,800 kcal
     - `EP 4`: ตี 3 ไฟดับ... ภารโรงไร้หน้า & ซ่อนตัวในห้องลองเสื้อ
     - `EP 5`: แผนที่บนแขน, คำนวณช่องทางออก mod 12 & โน้ตปริศนาวันที่ 8
4. **Scene-Based Vertical Shorts Covers (`1080x1920`, `9:16`):**
   - Extract real climax frame from each episode (`ffmpeg -ss <t> -i master.mp4 -frames:v 1`) and composite in Puppeteer Canvas with: glowing accent border, Volumetric Flashlight Beam, Comic Speech Bubble, Bold White + Giant Blood-Red Top Headline, and `EP 1–5` Bottom Stamp.
5. **Viral Copywriting Package (Titles, Captions & Hashtags):**
   - Deliver 5 tailored titles (`[EP X] + Trigger Hook + Emoji + | Series Title`), 5-part suspense captions, and full-video YouTube SEO package.

---

## 6. End-to-End Production Checklist (6-Phase Protocol)

When creating a new Real Lens episode from scratch, execute this exact 6-phase pipeline:

```
[Phase 1: Script] ──► [Phase 2: Audio] ──► [Phase 3: Player] ──► [Phase 4: MP4] ──► [Phase 5: Thumbs] ──► [Phase 6: Shorts]
  25-Scene Arc         Gemini 3.8 TTS        Canvas 2.5D          Puppeteer Pipe       16:9 (2 Options)     EP 1–5 (9:16)
  Rules & Physics      EBU -18 LUFS          Views & Shaders      Deterministic        SEO Timestamps       Covers + Captions
```

1. **Phase 1 — Narrative & Scripting (`episode.js`):** Draft 25 scenes (~5:30–6:00 min) following Format B (Rules, Quantitative Math, Anomaly Cards, Cliffhangers).
2. **Phase 2 — Voiceover & Sound Design (`generate_audio.js`):** Synthesize narration via `gemini-3.8-flash-tts` first (`voice: "Puck"`), wrap RIFF headers, normalize to `-18 LUFS`, mix procedural SFX/ambience with sidechain ducking, and output `timeline.json`.
3. **Phase 3 — 2.5D Rigging & Scene Views (`core.js`, `views.js`, `index.html`):** Implement multi-plane Canvas2D scenes, dynamic DoF blur, volumetric cones, and HUD rule cards.
4. **Phase 4 — Deterministic Video Render (`render_mp4.js`):** Step Puppeteer in frame batches (`24 FPS`) and stream into FFmpeg `image2pipe` + `master.wav`.
5. **Phase 5 — Long-Form YouTube Packaging (`generate_thumbnail.js`):** Render Showdown Split & 5-Panel thumbnails (`1920x1080`) + complete timestamps description.
6. **Phase 6 — Vertical Shorts Multi-Episode Adaptation (`shorts/`):**
   - Generate 5 transparent HUD overlays (`generate_shorts_overlays.js`).
   - Render 5 vertical `1080x1920` MP4s (`render_all_shorts.js`) with 3-layer composite.
   - Extract 5 real climax frames and render 5 scene-based vertical covers (`generate_scene_covers.js` + `make_covers.html`).
   - Write 5 viral Titles + 5-Part Captions ready for TikTok, Reels, and YouTube Shorts.
