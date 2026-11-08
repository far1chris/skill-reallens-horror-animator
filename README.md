# Real Lens Horror Animator (Antigravity Skill)

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HyperFrames Compatible](https://img.shields.io/badge/HyperFrames-Compatible-brightgreen.svg)](https://github.com/heygen-com/hyperframes)

An end-to-end production workflow and programmatic 2D/2.5D vector animation system for creating **"Real Lens" (@real_lens1)** and **"Rules of Survival / Liminal Space" (เช่น "7 วัน ติดอยู่ในห้างสรรพสินค้าที่ไม่มีทางออก")** style survival horror, urban legends, and calculated disaster survival videos.

Fully integrated with **HyperFrames (`heygen-com/hyperframes`)** for visual Studio scrubbing, automated linting/checking gates, instant snapshot contact sheets, and parallel multi-worker rendering.

---

## 📖 Overview

Unlike static AI slideshows or generic comic recap videos, this skill encodes the complete pipeline to produce deterministic, procedural 2D flat-vector paper-cutout animations with 2.5D depth-of-field, volumetric lighting cones, scientific/rules-of-survival HUD overlays, calculated quantitative math, deadpan first-person narration, and studio-grade video engine integration.

### Key Capabilities:
- **Authentic 2.5D Vector Rigging & 2-Segment FK Walk Cycle:** Lineless flat-shaded vector rigs with cylindrical horizontal gradients, 2-segment articulated legs (`thigh` + `calf` + `planted shoe` ground damping), solid black bead eyes with under-eye fatigue crescent bags, natural joint articulation, and terrifying 2-state horror reveals (e.g. The Cleaner with dripping blood eye slits).
- **Dual-System Object Manipulation:** Full-body wrist sockets (`carry_bag` with pendulum lag, `crouch_hold_item`, `two_hand_mop` cart) and Macro POV hand rigs (`marker_pen`, `tape_roll`, `wooden_pencil`) for close-up survival actions.
- **Dynamic HUD & Quantitative Survival System:** Real Lens signature Survival Rule cards (`⚠️ กฎข้อ 1–5`), auto-fit font scaling algorithm, real-time telemetry pills, live distance proximity trackers (`40 ม.` → `2 ม.`), resource audits, food expiration validation (calendar paradoxes), calorie burn calculations, and modular arithmetic exit formulas (`mod 12`).
- **Multi-Theme Presets:** Ready-to-use color tokens, telemetry specs, and entity behaviors for (A) Liminal Mall / Backrooms, (B) Calculated Disaster (Sub-zero freeze), and (C) Night Shift Rules.
- **Unified Voiceover, SHA-256 Cache & Proportional Subtitles:** Strict TTS synthesis prioritizing `gemini-3.8-flash-tts` (`Puck` voice), SHA-256 disk audio caching (`audio/cache/<hash>.wav`), Thai subtitle chunking ($\le 36$ chars) with proportional timing, EBU R128 loudness normalization (`-18 LUFS`), and procedural audio ducking with liminal drone foley.
- **HyperFrames Studio & Deterministic Verification:** 100% compliant with the HyperFrames declarative contract (`data-composition-id`, `data-track-index`, `data-beat`, `data-hold`). Includes automated multi-category audits (`lint` and `check` across runtime, layout, motion, contrast, craft, and audio) and interactive timeline scrubbing via HyperFrames Studio.
- **Dual High-Performance Renderers:** Supports both native parallel multi-worker rendering via HyperFrames (`npx hyperframes render`) and frame-by-frame Puppeteer capture piped to FFmpeg (`render_mp4.js`).
- **Packaging & Showdown Thumbnails:** Proven high-CTR YouTube thumbnails (Showdown Split: The Cleaner vs. Protagonist crouching in shock, Rule Card, Telemetry & Distance Pill, Giant glowing title + yellow quote).
- **Vertical Shorts Adaptation (9:16):** Automated splitting of master videos into 5 cliffhanger vertical episodes (`EP 1` – `EP 5`) with Smart Center Zoom ($1.35\times$), Safe Zone compliance ($Y \le 1580\text{ px}$), 3-layer compositing, real climax frame scene covers, and viral copy packages.

---

## 📂 Repository Structure

```
skill-reallens-horror-animator/
├── SKILL.md                          # Main skill instruction & 7-phase protocol
├── README.md                         # Project documentation
├── .gitignore                        # Git ignore file
├── LICENSE                           # MIT License
├── scripts/
│   ├── sync_hyperframes.js           # Automated timeline sync & Kanit font localizer
│   └── hf.js                         # Cross-platform HyperFrames CLI wrapper with ffmpeg/ffprobe
└── references/
    ├── visual-and-hud-specs.md       # Canvas coordinates, color tokens, and 8 HUD blueprints
    ├── pipeline-and-tooling.md       # TTS audio pipeline, HyperFrames blueprints, Puppeteer export
    └── shorts-and-thumbnails.md      # 16:9 showdown thumbnails, 9:16 Shorts composite, and scene covers
```

---

## 🚀 Installation & Usage in Google Antigravity

Clone this repository directly into your local Antigravity skills directory:

```bash
git clone https://github.com/far1chris/skill-reallens-horror-animator.git ~/.gemini/config/skills/reallens-horror-animator
```

Or for Windows PowerShell:

```powershell
git clone https://github.com/far1chris/skill-reallens-horror-animator.git "$HOME\.gemini\config\skills\reallens-horror-animator"
```

Once installed, Antigravity will automatically recognize the `reallens-horror-animator` skill.

---

## 🎬 7-Phase Production Protocol

1. **Phase 1: Scripting (`episode.js`)** — 25-scene narrative arc (~5:30–6:00 min) with calculated physics, survival rules, and cliffhangers.
2. **Phase 2: Audio Synthesis (`generate_audio.js`)** — Narration via `gemini-3.8-flash-tts` (`Puck`), mastered to `-18 LUFS` with procedural SFX, ducking, and `timeline.json` generation.
3. **Phase 3: 2.5D Rigging & Scene Views (`core.js`, `views.js`, `index.html`)** — Multi-plane depth, DoF blur, volumetric lighting cones, and Triple-Adapter seek implementation.
4. **Phase 4: HyperFrames Sync & Verification Gate (`node hf.js lint` & `check`)** — Synchronize DOM markers via `sync_hyperframes.js`, pass zero-warning verification gate, and audit visual keyframes via snapshot contact sheets.
5. **Phase 5: Video Export (`node hf.js render` or `render_mp4.js`)** — Render master `1280x720` 24fps MP4 with AAC audio.
6. **Phase 6: Packaging & Thumbnails (`generate_thumbnail.js`)** — Showdown split & 5-panel escalation strip thumbnails (`1920x1080`).
7. **Phase 7: Multi-Episode Shorts (`shorts/`)** — 5-part vertical series (`1080x1920`) with real scene climax covers and viral captions.

---

## 🛠️ HyperFrames CLI Quick Reference

The skill includes `scripts/hf.js` which automatically injects `ffmpeg-static` and `ffprobe-static` paths into `PATH` (essential for Windows environments):

```bash
# 1. Synchronize timeline and localize fonts
node scripts/sync_hyperframes.js

# 2. Syntax & attribute audit (must achieve 0 errors, 0 warnings)
node scripts/hf.js lint

# 3. Comprehensive 7-category audit (Lint, Runtime, Layout, Motion, Contrast, Craft, Audio)
node scripts/hf.js check

# 4. Instant visual audit at key timestamp beats + contact sheet
node scripts/hf.js snapshot --at 5,60,180

# 5. Launch interactive Studio preview with visual timeline scrubbing
node scripts/hf.js preview

# 6. High-speed multi-worker rendering
node scripts/hf.js render -f 24 -q looks -o master_hf.mp4
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
