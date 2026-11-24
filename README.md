# Real Lens & Folk Horror Documentary Animator (Antigravity Skill)

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HyperFrames Compatible](https://img.shields.io/badge/HyperFrames-Compatible-brightgreen.svg)](https://github.com/heygen-com/hyperframes)

An end-to-end 2.5D Canvas animation, voice synthesis, and YouTube packaging system supporting both:
- **Thai/Isan Folk Horror Science & History Documentaries (`8–12 min`):** Anti-spoiler Retention Arc, Clean Cinema Mode (`hudMode: "documentary"` — zero HUD/popup boxes), `PRONUNCIATION_MAP`, Automated Narration QA, Folk Horror Thumbnails (`<= 4` words), and 3-Angle Cliffhanger Bridge Shorts (`40–50s`) with Related Video CTA.
- **Classic "Real Lens" (@real_lens1) Survival Horror:** Full backward compatibility for Liminal Space, Night Shift Rules, and Calculated Disaster episodes.

---

## 📖 Key Capabilities

- **Dual HUD Modes (`templates/core.js`, `templates/index.html`):** Configurable `hudMode: "survival" | "documentary"`. Documentary mode runs as **Clean Cinema Mode** — automatically disabling all game-like survival bars/rule cards without drawing any popup text overlays on screen (pure animated visuals + frameless subtitles only), while keeping `survival` mode 100% backward compatible.
- **Thai TTS + `PRONUNCIATION_MAP` + Trailing Silence (`templates/generate_audio.js`):** Gemini 3.8 Flash TTS (`Puck` narrator lock), customizable phonetic dictionary (`SUNDS`, `Brugada`, `นักมานุษยวิทยา`, `มลาบรี`, `หนามพุทรา`, `ใบหนาด`, `ชะตากรรม`, etc.) that leaves subtitles untouched, 350–500 ms trailing silence padding preventing clipped endings, optional Shorts Bridge CTA VO synthesis, and `-18.0 LUFS` mastering.
- **Automated Narration & Audio Tail QA (`scripts/narration_qa.js`, `scripts/audit_all_scenes.js`, `scripts/inspect_video.js`):** Flags camera commands leaked into narration, unmapped English words/acronyms, mid-video CTAs before the final scene, and audio tail clipping/abrupt cuts alongside the 16-point video QA scorecard.
- **Cliffhanger Bridge 3-Angle Shorts (`scripts/shorts_planner.js`, `scripts/generate_shorts_overlays.js`, `scripts/render_all_shorts.js`):** Extracts 3 spoiler-free `40–50s` angles per long-form episode (`ritual`, `tension`, `twist`) with strict sentence-boundary snapping and a 3–4s bottom-left **Related Video Bridge CTA** (`overlay_<tag>_cta.png` + optional spoken CTA VO).
- **Folk Horror Thumbnails & SEO QA (`templates/generate_thumbnail.js`):** Deep murky dark/forest-green palette contrasted with vivid red or flashlight-yellow focal accents, automated `<= 4`-word check, title non-duplication check, and keyword-first Long-Form SEO title validation.

---

## 📂 Repository Structure

```text
reallens-horror-animator/
├── SKILL.md                             # Concise core workflow, iron rules & pre-flight checklist
├── README.md                            # Project documentation
├── .gitignore                           # Excludes .git/, .env, zips, caches, media outputs
├── .gitattributes                       # export-ignore rules for clean git archives
├── LICENSE                              # MIT License
├── scripts/
│   ├── hf.js                            # Portable HyperFrames CLI wrapper (ffmpeg/ffprobe PATH)
│   ├── sync_hyperframes.js              # Timeline sync + local Kanit & GSAP copier
│   ├── narration_qa.js                  # Shared Automated Narration & Audio Tail QA engine
│   ├── audit_all_scenes.js              # Narration QA + full-scene PNG grid checker
│   ├── render_mp4.js                    # Puppeteer batch-12 -> FFmpeg image2pipe exporter
│   ├── shorts_planner.js                # Cliffhanger Bridge 3-Angle (40-50s) & legacy planner CLI
│   ├── generate_shorts_overlays.js      # Single canonical 9:16 title + Related Video CTA overlays
│   ├── render_all_shorts.js             # Native 9:16 Shorts renderer + Bridge CTA audio/overlay
│   ├── inspect_video.js                 # 16-point QA scorecard + Narration/Audio Tail QA
│   └── pack_skill.js                    # Clean .zip skill packager (strictly skips .git/)
├── templates/
│   ├── package.json                     # Project dependencies & npm scripts
│   ├── index.html                       # HyperFrames composition (shortsMode + hudMode)
│   ├── core.js                          # 2.5D engine + Rural Thai builders + Clean Cinema HUD mode
│   ├── episode.example.js               # Documentary/Survival schema (narration/camera split)
│   ├── views.example.js                 # Multi-plane 2.5D starter views
│   ├── generate_audio.js                # Gemini 3.8 TTS + pronunciation_map.js + 420ms tail pad
│   ├── pronunciation_map.js             # Curated 150+ word Folk Horror/Medical/Isan TTS dictionary
│   ├── generate_thumbnail.js            # Folk Horror 1920x1080 thumbnails + Copy/SEO QA
│   └── generate_scene_covers.js         # HUD-free 1080x1920 climax covers + luma check
└── references/
    ├── visual-and-hud-specs.md          # Palettes, Documentary HUD specs & core.js API
    ├── pipeline-and-tooling.md          # Audio pipeline, PRONUNCIATION_MAP, QA & HyperFrames
    ├── shorts-and-thumbnails.md         # Long-Form SEO, Folk Horror thumbs & Cliffhanger Shorts
    └── multi-agent-workflow.md          # 4-role subagent orchestration & updated QA checklists
```

---

## 🛠️ Quick Workflow Commands (Inside an Episode Directory)

```bash
npm install
# Set GEMINI_API_KEYS in .env or environment, then:
node audit_all_scenes.js --qa-only
node generate_audio.js
node sync_hyperframes.js

node hf.js lint && node hf.js check
node audit_all_scenes.js
node hf.js render -f 24 -q looks -o master_hf.mp4
node generate_thumbnail.js --accent red --strict
node inspect_video.js master_hf.mp4 --strict

# After user approves master_hf.mp4 -> Cliffhanger Bridge 3-Angle Shorts:
node shorts_planner.js --format cliffhanger --min-sec 40 --max-sec 50
node generate_shorts_overlays.js --format cliffhanger
node render_all_shorts.js --format cliffhanger
node generate_scene_covers.js --format cliffhanger
node inspect_video.js shorts/master_hf_cliff_01_ritual.mp4 --shorts --strict
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
