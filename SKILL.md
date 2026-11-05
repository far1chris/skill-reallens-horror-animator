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

This skill encodes the complete visual architecture, narrative pacing, UI/HUD card system, unified `gemini-3.8-flash-tts` audio pipeline, deterministic HTML5-to-MP4 renderer, and vertical Shorts multi-episode adaptation workflow for the **"Real Lens" (@real_lens1)** YouTube style.

Unlike static AI image-slideshow channels, this style uses **procedural 2D flat-vector paper-cutout rigging with 2.5D depth-of-field (DoF), volumetric lighting cones, scientific/rules-of-survival HUD overlays, and deadpan first-person narration**.

---

## 1. Visual DNA & Art Direction ("2.5D Geometric Paper-Cutout Survival Horror")

### 1.1 Character Construction (Modular Vector Rig)
Characters are built from clean geometric Canvas2D/SVG primitives with **no heavy black outlines** (lineless flat shading with cylindrical horizontal gradients):
- **Head:** Capsule / rounded-rectangle (`border-radius: 45%`) with cylindrical shading (`#D99B66` → `#C0824D` for human skin; `#EAECEF` → `#CFD4DC` for pale entities; `#B8C7D9` / frost-flushed cheeks `#E17070` for extreme cold).
- **Facial & Physiological States:**
  - Circular dot eyes (`#1A1A1A`) with white specular catchlights, dark under-eye bags (`rgba(0,0,0,0.18)`) for exhaustion/dread, and expressive floating eyebrows.
  - **2-State Horror / Survival Swaps:**
    - *Entity Reveal:* Masked/normal state vs. nightmare reveal (e.g., stitched slit-mouth `#5A0812` with triangle teeth, or faceless pale mall janitor under flickering tubes).
    - *Environmental Stress:* Shivering micro-jitter (`Math.sin(t * 38) * 1.8`), animated cold-breath vapor puffs, multi-layer winter clothing (beanie, scarf, 4-layer shirts), or flashlight hand-rig casting a dynamic cone.
- **Torso & Segmented Limbs:** Pivoted capsules (`UpperArm`, `Forearm`, `Hand`, `Thigh`, `Shin`, `Foot`) driven procedurally by `t` for walking, shivering, sealing doors, taping wall arrows, or aiming a flashlight.

### 1.2 2.5D Multi-Plane Environment & Shaders
Compose every scene from **4 depth planes** plus environmental shaders:
1. **Plane 0 — Sky / Ambient Backdrop:** Deep midnight blue (`#080C18` → `#141D30`), Backrooms sickly fluorescent ochre (`#2A2614` → `#14120A`), or polar vortex slate (`#070D19` → `#1E293B`).
2. **Plane 1 — Blurred Far Background (`ctx.filter = 'blur(8px)'`):** Distant city skylines, infinite mall corridors, or snow-buried streets. Rack-focus dynamically to `blur(12px–14px)` whenever a HUD Rule/Math Card enters.
3. **Plane 2 — Midground Architecture & Calculated Survival Props:**
   - Urban/Interior details: Japanese cinderblocks, vending machines, infinite supermarket shelves, or Thai townhome interiors (high ceilings, louver windows, single-pane glass, exposed blue PVC pipes, cool-only wall AC).
   - Survival setups: Duct-tape wall maps, indoor `3 m³` dome tent microclimates, inverted terracotta pot + 4 tea-light candle radiant heaters (`160W`), wet-towel ice door seals, vs. lethal charcoal braziers (`CO` hazard).
4. **Plane 3 — Volumetric Light Cones, Particles & Vignette:**
   - Flickering streetlights/fluorescents, warm flashlight cones, multi-layer parallax snow/frost creep on window edges, and a dark radial horror vignette (`transparent 45%` → `rgba(0,0,0,0.85) 100%`).

---

## 2. Signature "Rules, Math & Lore" HUD System

Read [Visual & HUD Specs](./references/visual-and-hud-specs.md) for exact coordinates, color tokens, and Canvas blueprints.

1. **Survival Rule Card (`⚠️ กฎข้อ 1` – `กฎข้อ 5`):** Warm-cream card (`#F4EFE6`), dark charcoal badge pill (`#18181B`), bold Thai rule headline, and English/Japanese sub-caption.
2. **Branching Decision / Consequence Flowchart:** Splits a lethal dilemma into two branches showing why the instinctive choice kills you vs. the counter-intuitive survival choice.
3. **Calculated Survival Math / Physics Card:** Side-by-side quantitative breakdown (e.g., `60 m³ Room` vs `3 m³ Tent` heated by `100W` body heat; `400 kcal/hr` shivering burn; `9%` water-to-ice expansion bursting PVC pipes).
4. **Clue / Anomaly Callout Card:** Zooms into a phone emergency alert, delivery app kanji pun, or expired food label while blurring the background.
5. **Live Telemetry Pills:** Top-right real-time counters (`🌡️ -40°C · HOUR 40/48`, `🔋 CALORIES: 1,850 kcal`, `● ระยะห่าง: 18 ม.`, or 5-knot red amulet countdown).

---

## 3. Narrative Architectures

### Format A: 2-Minute Urban Legend Micro-Arc (~120–130s, ~20–25 beats)
1. **Cold Open Paradox & Rule 1 (0:00–0:15)** → **Mundane Night Shift & Warning Artifact (0:15–0:45)** → **UI/Environmental Omen (0:45–1:15)** → **Confrontation, Decision Tree & Rule 2 Loophole (1:15–1:50)** → **Amulet Cost & Chilling Epilogue (1:50–2:10)**.

### Format B: 25-Scene Calculated Survival Long-Form (~5–7 Minutes / 300–400s)
Proven in *7 Days in the Backrooms Mall* and *48 Hours at -40°C Tropical Freeze*:
- **Scenes 1–2 (Hook & Title):** Cold open with Rule #1 life-or-death warning ("Never light a charcoal stove in a sealed room...") + kinetic Title Card.
- **Scenes 3–5 (Baseline → Sudden Catastrophe):** Named protagonist (*"ผมชื่อนนท์..."*), ordinary setting, sudden anomaly/alert, and why mass panic (e.g., expressway gridlock) is a death trap.
- **Scenes 6–10 (Architectural Trap & Resource Audit):** Why the local environment works against you (shifting mall corridors / heat-venting Thai houses, bursting PVC pipes, useless cool-only ACs) + inventory audit.
- **Scenes 11–18 (Physics, Micro-Shelter & Lethal Mistakes):** Power blackout, thermodynamic/calorie math, building a micro-shelter (`3 m³` tent, `160W` terracotta candle heater, 4-layer clothing), contrasted with fatal mistakes made nearby.
- **Scenes 19–25 (Peak Crisis, Physiological Trap & Dawn Resolution):** Structural failure at peak threat (`-40°C` window breach / lights-out entity patrol), physiological trap (paradoxical undressing), core-warming countermeasure, survival at final hour, and **5 Golden Rules Summary Endcard**.

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

### 4.2 Strict Single-Persona Consistency & Quota Rules
- **NEVER mix different TTS engines within the same video** (e.g., never mix Gemini `Puck` on Scenes 1–3 with `msedge-tts` on Scenes 4–25). All scenes (`01`..`N`) MUST share one identical vocal persona.
- **Free Tier Quota Handling:** Google AI Studio Free Tier limits TTS to **10 requests/day (RPD) per Google Cloud Project** (~3 RPM). Multiple keys inside the *same* project share the same 10 RPD pool (`HTTP 429`). For a 25-scene video on Free Tier, rotate across 3 API keys created in **separate projects** (`Create API key in new project`), pacing requests by `5–6s`, or use a Paid/Prepay project with positive credit balance (watch for `HTTP 402` depleted prepay credits or `HTTP 403` outstanding billing balance).
- **Unified Broadcast Mastering (`-18 LUFS`):** Pass every scene WAV through the exact same FFmpeg chain (80Hz highpass, low-mid warmth at `180Hz`, harshness dip at `3.5kHz`, `2.5:1` compressor, `loudnorm=I=-18.0:LRA=5.0:TP=-1.5`) and mix procedural PCM foley/ambience with envelope sidechain ducking.

---

## 5. End-to-End Deliverables: MP4, Vertical Shorts (`EP 1–5`) & Covers

Read [Shorts & Thumbnails Guide](./references/shorts-and-thumbnails.md) for FFmpeg filter graphs and Puppeteer templates.

1. **Interactive HTML5 Player & Full `16:9` MP4 (`index.html` + `render_mp4.js`):**
   - Modular `episode.js` (script + SFX cues), `core.js` (2.5D rigs + HUD renderer), `views.js` (25 custom scene renderers), `timeline.js`, and deterministic `24/30 FPS` Puppeteer-to-FFmpeg `image2pipe` export.
2. **Long-Form YouTube Thumbnails (`1920x1080`) + SEO Package:**
   - Generate **2 variants**: (A) **5-Panel Escalation Strip** and (B) **Dark Split / Climax Encounter**, plus high-CTR Thai titles, description, timestamps, and tags.
3. **Vertical Shorts / TikTok / Reels Multi-Episode Adaptation (`1080x1920`, `9:16`):**
   - Split the master video into **5 Cliffhanger Episodes (`EP 1` – `EP 5`, ~65–95s each)**.
   - Composite 3 layers via FFmpeg: (1) blurred/darkened `1080x1920` dynamic ambient video backdrop, (2) crisp `1080x608` `lanczos` center animation (`y: 576`), and (3) transparent `1080x1920` Puppeteer PNG overlay (`overlay_epX.png`) featuring Top Series Header + Red `EP X` Badge + Live Telemetry Pill and Bottom Real Lens HUD Rule Card.
4. **Scene-Based Vertical Shorts Covers (`1080x1920`, `9:16`):**
   - Extract the **actual climax video frame** from each episode (`ffmpeg -ss <t> -i master.mp4 -frames:v 1`) and composite it inside a local HTML Canvas (`make_covers.html` via `file:///` + `window.__done` sync) with: glowing cyan border, **Volumetric Flashlight Beam**, **Comic Speech Bubble**, **Bold White + Giant Blood-Red Grunge Top Headline**, and **`EP 1–5` Bottom Stamp**.
5. **Viral Copywriting Package (Titles, Captions & Hashtags):**
   - Provide 5 tailored titles (`[EP X] + Trigger Hook + Emoji + | Series Title`), 5-part suspense captions (Hook + Story beat + ⚠️ Rule/Math Warning + 👉 Next EP Cliffhanger CTA + Hashtags), and full-video YouTube SEO package.

---

## 6. End-to-End Production Checklist (6-Phase Protocol)

When creating a new Real Lens episode from scratch, execute this exact 6-phase pipeline:

```
[Phase 1: Script] ──► [Phase 2: Audio] ──► [Phase 3: Player] ──► [Phase 4: MP4] ──► [Phase 5: Thumbs] ──► [Phase 6: Shorts]
  25-Scene Arc         Gemini 3.8 TTS        Canvas 2.5D          Puppeteer Pipe       16:9 (2 Options)     EP 1–5 (9:16)
  Rules & Physics      EBU -18 LUFS          Views & Shaders      Deterministic        SEO Timestamps       Covers + Captions
```

1. **Phase 1 — Narrative & Scripting (`episode.js`):** Draft 25 scenes (~5–7 min) following Format B (Rules, Math, Anomaly Cards, Cliffhangers).
2. **Phase 2 — Voiceover & Sound Design (`generate_audio.js`):** Synthesize narration via `gemini-3.8-flash-tts` first (`voice: "Puck"`), wrap RIFF headers, normalize to `-18 LUFS`, mix procedural SFX/ambience with sidechain ducking, and output `timeline.json`.
3. **Phase 3 — 2.5D Rigging & Scene Views (`core.js`, `views.js`, `index.html`):** Implement multi-plane Canvas2D scenes, dynamic DoF blur, volumetric cones, and HUD rule cards.
4. **Phase 4 — Deterministic Video Render (`render_mp4.js`):** Step Puppeteer in frame batches (`24 FPS`) and stream into FFmpeg `image2pipe` + `master.wav`.
5. **Phase 5 — Long-Form YouTube Packaging (`generate_thumbnail.js`):** Render 5-Panel Escalation Strip & Dark Split thumbnails (`1920x1080`) + complete timestamps description.
6. **Phase 6 — Vertical Shorts Multi-Episode Adaptation (`shorts/`):**
   - Generate 5 transparent HUD overlays (`generate_shorts_overlays.js`).
   - Render 5 vertical `1080x1920` MP4s (`render_all_shorts.js`) with 3-layer composite.
   - Extract 5 real climax frames and render 5 scene-based vertical covers (`generate_scene_covers.js` + `make_covers.html`).
   - Write 5 viral Titles + 5-Part Captions ready for TikTok, Reels, and YouTube Shorts.
