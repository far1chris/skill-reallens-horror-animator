# Real Lens Horror Animator (Antigravity Skill)

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An end-to-end production workflow and programmatic 2D/2.5D vector animation system for creating **"Real Lens" (@real_lens1)** style survival horror, urban legend, liminal space survival, and calculated disaster survival videos.

---

## 📖 Overview

Unlike static AI slideshows, this skill encodes the complete pipeline to produce deterministic, procedural 2D flat-vector paper-cutout animations with 2.5D depth-of-field, volumetric lighting cones, scientific/rules-of-survival HUD overlays, and deadpan first-person narration.

### Key Capabilities:
- **Modular 2.5D Vector Rigging:** Lineless flat-shaded vector rigs with cylindrical horizontal gradients, shivering micro-jitters, eye bags, and entity reveal swaps.
- **Dynamic HUD & Lore System:** Real Lens signature Survival Rule cards (`⚠️ กฎข้อ 1–5`), calculated survival math/physics comparisons, decision flowcharts, clue cards, and telemetry pills.
- **Unified Voiceover & Sound Protocol:** Strict TTS synthesis prioritizing `gemini-3.8-flash-tts` (`Puck` voice), EBU R128 loudness normalization (`-18 LUFS`), and procedural audio ducking.
- **Deterministic MP4 Rendering:** High-performance HTML5 Canvas animation driven frame-by-frame via Puppeteer into FFmpeg `image2pipe`.
- **Vertical Shorts Adaptation (9:16):** Automated splitting of 25-scene long-form videos into 5 cliffhanger vertical episodes (`EP 1` – `EP 5`) with 3-layer compositing, real climax frame scene covers, and viral copy packages.

---

## 📂 Repository Structure

```
skill-reallens-horror-animator/
├── SKILL.md                          # Main skill instruction & 6-phase protocol
├── README.md                         # Project documentation
├── .gitignore                        # Git ignore file
└── references/
    ├── visual-and-hud-specs.md       # Canvas coordinates, color tokens, and HUD blueprints
    ├── pipeline-and-tooling.md       # TTS audio pipeline, mastering, SFX, and Puppeteer export
    └── shorts-and-thumbnails.md      # 16:9 thumbnails, 9:16 Shorts composite, and scene covers
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

1. **Phase 1: Scripting (`episode.js`)** — 25-scene narrative arc with calculated physics, survival rules, and cliffhangers.
2. **Phase 2: Audio Synthesis (`generate_audio.js`)** — Narration via `gemini-3.8-flash-tts`, mastered to `-18 LUFS` with procedural SFX.
3. **Phase 3: 2.5D Rigging & Scene Views (`core.js`, `views.js`)** — Multi-plane depth, DoF blur, and volumetric lighting cones.
4. **Phase 4: Video Export (`render_mp4.js`)** — Frame-by-frame Puppeteer capture piped to FFmpeg.
5. **Phase 5: Packaging & Thumbnails (`generate_thumbnail.js`)** — 5-panel escalation strips & dark split encounter covers.
6. **Phase 6: Multi-Episode Shorts (`shorts/`)** — 5-part vertical series with real scene climax covers and viral captions.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
