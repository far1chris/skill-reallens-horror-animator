# Real Lens Horror Animator (Antigravity Skill)

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An end-to-end production workflow and programmatic 2D/2.5D vector animation system for creating **"Real Lens" (@real_lens1)** and **"Rules of Survival / Liminal Space" (เช่น "7 วัน ติดอยู่ในห้างสรรพสินค้าที่ไม่มีทางออก")** style survival horror, urban legends, and calculated disaster survival videos.

---

## 📖 Overview

Unlike static AI slideshows or generic comic recap videos, this skill encodes the complete pipeline to produce deterministic, procedural 2D flat-vector paper-cutout animations with 2.5D depth-of-field, volumetric lighting cones, scientific/rules-of-survival HUD overlays, calculated quantitative math, and deadpan first-person narration.

### Key Capabilities:
- **Authentic 2.5D Vector Rigging:** Lineless flat-shaded vector rigs with cylindrical horizontal gradients, solid black bead eyes with under-eye fatigue crescent bags, natural joint articulation, and terrifying 2-state horror reveals (e.g. The Cleaner with dripping blood eye slits).
- **Dynamic HUD & Quantitative Survival System:** Real Lens signature Survival Rule cards (`⚠️ กฎข้อ 1–5`), real-time telemetry pills, live distance proximity trackers (`40 ม.` → `2 ม.`), resource audits, food expiration validation (calendar paradoxes), calorie burn calculations, and modular arithmetic exit formulas (`mod 12`).
- **Unified Voiceover & Sound Protocol:** Strict TTS synthesis prioritizing `gemini-3.8-flash-tts` (`Puck` voice), EBU R128 loudness normalization (`-18 LUFS`), and procedural audio ducking with liminal drone foley.
- **Deterministic MP4 Rendering:** High-performance HTML5 Canvas animation driven frame-by-frame via Puppeteer into FFmpeg `image2pipe`.
- **Packaging & Showdown Thumbnails:** Proven high-CTR YouTube thumbnails (Showdown Split: The Cleaner vs. Protagonist crouching in shock, Rule Card, Telemetry & Distance Pill, Giant glowing title + yellow quote).
- **Vertical Shorts Adaptation (9:16):** Automated splitting of master videos into 5 cliffhanger vertical episodes (`EP 1` – `EP 5`) with 3-layer compositing, real climax frame scene covers, and viral copy packages.

---

## 📂 Repository Structure

```
skill-reallens-horror-animator/
├── SKILL.md                          # Main skill instruction & 6-phase protocol
├── README.md                         # Project documentation
├── .gitignore                        # Git ignore file
└── references/
    ├── visual-and-hud-specs.md       # Canvas coordinates, color tokens, and 8 HUD blueprints
    ├── pipeline-and-tooling.md       # TTS audio pipeline, mastering, SFX, and Puppeteer export
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

Once installed, Antigravity will automatically recognize the `reallens-horror-animator` skill. You can invoke it whenever you want to generate scripts, vector animations, HUD cards, voiceover pipelines, or vertical shorts in the Real Lens style.

---

## 🎬 6-Phase Production Protocol

1. **Phase 1: Scripting (`episode.js`)** — 25-scene narrative arc (~5:30–6:00 min) with calculated physics, survival rules, and cliffhangers.
2. **Phase 2: Audio Synthesis (`generate_audio.js`)** — Narration via `gemini-3.8-flash-tts` (`Puck`), mastered to `-18 LUFS` with procedural SFX and sidechain ducking.
3. **Phase 3: 2.5D Rigging & Scene Views (`core.js`, `views.js`)** — Multi-plane depth, DoF blur, and volumetric lighting cones.
4. **Phase 4: Video Export (`render_mp4.js`)** — Frame-by-frame Puppeteer capture piped to FFmpeg.
5. **Phase 5: Packaging & Thumbnails (`generate_thumbnail.js`)** — Showdown split & 5-panel escalation strip thumbnails (`1920x1080`).
6. **Phase 6: Multi-Episode Shorts (`shorts/`)** — 5-part vertical series with real scene climax covers and viral captions.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
