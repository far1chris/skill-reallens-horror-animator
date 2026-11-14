# Real Lens Horror Animator (Antigravity Skill)

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HyperFrames Compatible](https://img.shields.io/badge/HyperFrames-Compatible-brightgreen.svg)](https://github.com/heygen-com/hyperframes)

An end-to-end production workflow, starter template kit, and programmatic 2D/2.5D Canvas vector animation system for creating **"Real Lens" (@real_lens1)** and **"Rules of Survival / Liminal Space"** style survival horror, urban legends, and calculated disaster survival videos.

Fully integrated with **HyperFrames (`heygen-com/hyperframes`)** for visual Studio scrubbing, automated 7-gate linting/checking, snapshot review contact sheets, DPR-scaled `1080p` parallel rendering, and 16-point automated QA inspection.

---

## 📖 Key Capabilities

- **Complete 2.5D Vector Rigging & 2-Segment FK Walk Cycle (`templates/core.js`):** Lineless cylindrical shading (`cyl()`), `1:6.5` athletic proportions with continuous trapezius slope, symmetrical blinking eyes with under-eye fatigue bags, clamped `poseWalk()` knees (`Math.max(0, ...)`), generalized `drawEntity()` with Z-index layering, Theme B (`frostOverlay()`, `coldBreath`, `shiver`), Theme C (`coverMouth`), and `400px` Macro POV `hand()` rigs.
- **Theme-Agnostic Dynamic HUD System:** Signature warm cream `#F5EFE6` cards (`rule`, `info`, `inventory`, `calc`/`math`, `dilemma`/`flow`, `anomaly`/`clue`) with automatic Thai text fitting (`fitTextSize`), flexible `drawTele()` supporting Energy (`kcal`), Tide (`ม.`), Temp (`°C`), Oxygen (`%`), Sound (`dB`), or custom bars, plus `9:16` Safe Zone-aware frameless subtitles.
- **Unified Gemini TTS, SHA-256 Cache & Thai Segmentation (`templates/generate_audio.js`):** Prioritizes `gemini-3.8-flash-tts` (`Puck`) → `gemini-3.8-flash-lite-tts` → `gemini-3.1-flash-tts-preview` via env/ `.env` keys (zero hardcoded keys), SHA-256 disk audio caching, `Intl.Segmenter('th')` word-boundary subtitles (`<= 36` chars, `{ t0, t1, text }`), procedural SFX/beds with 35% sidechain ducking, and `-18.0 LUFS` EBU R128 mastering.
- **HyperFrames Studio & Parallel Renderers (`scripts/hf.js`, `scripts/sync_hyperframes.js`):** Localizes `@fontsource/kanit` `.woff2` and `gsap.min.js` offline, stamps scene `.clip` markers ($\le 3$ per lane), passes `hf.js lint` & `hf.js check` with `0 errors, 0 warnings`, and supports both `node hf.js render` (`720p` / `2x` DPR `1440p`) and `scripts/render_mp4.js --1080p`.
- **Automated Visual & Technical QA (`scripts/audit_all_scenes.js`, `scripts/inspect_video.js`):** All-scene visual grid checker (`audit_all_scenes.png`) plus 16-point stream, loudness, black-frame, rig AST, and 9:16 Safe Zone verification (`16/16 PASS`).
- **Complete YouTube & Shorts Packaging (`templates/` + `scripts/shorts_planner.js` + `scripts/render_all_shorts.js`):** Key-scene `1920x1080` YouTube thumbnails (Showdown + 5-Panel Strip), dynamic `1080x1920` Shorts strictly **`<= 60s` per EP (`maxSec = 58s`, auto-scaling into `EP 6`, `EP 7`, `EP 8+` as needed)** with `letterbox` or `1.35x` `zoom` mode, high-impact non-black climax covers, and Long-Form + Shorts SEO templates.

---

## 📂 Repository Structure

```text
reallens-horror-animator/
├── SKILL.md                             # Main skill instructions & 7-phase protocol
├── README.md                            # Project documentation
├── .gitignore
├── LICENSE                              # MIT License
├── scripts/
│   ├── hf.js                            # Portable HyperFrames CLI wrapper (ffmpeg/ffprobe PATH)
│   ├── sync_hyperframes.js              # Timeline sync + local Kanit & GSAP copier
│   ├── audit_all_scenes.js              # Full-scene PNG grid & missing-view checker
│   ├── render_mp4.js                    # Puppeteer batch-12 -> FFmpeg image2pipe exporter
│   ├── shorts_planner.js                # <= 58s EP splitter (EP 6,7,8+) & key-scene scorer
│   ├── render_all_shorts.js             # Dynamic 9:16 Shorts composite (letterbox / 1.35x zoom)
│   └── inspect_video.js                 # 16-point QA scorecard (incl. <= 60s Shorts duration)
├── templates/
│   ├── package.json                     # Project dependencies & npm scripts
│   ├── index.html                       # HyperFrames-compliant Dual-Mode composition
│   ├── core.js                          # Complete 2.5D engine + HUD + theme shaders
│   ├── episode.example.js               # Annotated episode schema template
│   ├── views.example.js                 # Multi-plane 2.5D & ctx.clip() starter views
│   ├── generate_audio.js                # Gemini 3.8 TTS + SHA-256 cache + SFX + -18 LUFS
│   ├── generate_thumbnail.js            # Key-scene 1920x1080 Showdown & 5-Panel thumbnails
│   ├── generate_shorts_overlays.js      # Dynamic EP 1..N minimalist 1080x1920 Shorts overlays
│   └── generate_scene_covers.js         # Key-scene 1080x1920 climax frame covers + luma check
└── references/
    ├── visual-and-hud-specs.md          # Color tokens, HUD blueprints & core.js API
    ├── pipeline-and-tooling.md          # Audio pipeline, HyperFrames workflows & QA specs
    └── shorts-and-thumbnails.md         # Thumbnails, Long-Form SEO, <= 60s Shorts & Covers
```

---

## 🚀 Installation in Google Antigravity

```powershell
git clone https://github.com/far1chris/skill-reallens-horror-animator.git "$HOME\.gemini\config\skills\reallens-horror-animator"
```

---

## 🛠️ Quick Workflow Commands (Inside an Episode Directory)

```bash
npm install
# Set GEMINI_API_KEYS in .env or environment, then:
node generate_audio.js
node sync_hyperframes.js

node hf.js lint
node hf.js check
node hf.js snapshot --review
node audit_all_scenes.js

# Preview in HyperFrames Studio or render Master MP4:
node hf.js preview
node hf.js render -f 24 -q looks -o master_hf.mp4

# Packaging & Final 16-Point QA Gate:
node generate_thumbnail.js
node generate_shorts_overlays.js
node render_all_shorts.js
node generate_scene_covers.js
node inspect_video.js master_hf.mp4 --strict
node inspect_video.js shorts/master_ep1_shorts.mp4 --shorts --strict
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
