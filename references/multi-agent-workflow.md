# Multi-Agent Production Workflow (Role-Based Orchestration)

Optional orchestration pattern for **full-episode productions (`8–12 min` folklore science/history documentaries OR `20–33+` scene survival horror bundles)** where a single context window risks **context rot** or **confirmation bias** during QA.

> **When to stay Single-Agent:** Quick script edits, single-scene view fixes, audio re-runs, or small 5–10 scene prototypes.

---

## 1. Architecture: 4 Specialized Roles

Split work by **cognitive boundary and strict single-file write ownership** (never let two agents edit `episode.js`, `views.js`, or `index.html` concurrently):

| Role | Execution Mode | Primary Ownership (Write) | Required Context to Load |
| :--- | :--- | :--- | :--- |
| **1. Director (Main Agent)** | Coordinator (Always active) | `episode.js`, CLI execution (`generate_audio.js`, `sync_hyperframes.js`, `hf.js`, `shorts_planner.js`, `render_*`) | `SKILL.md`, `references/pipeline-and-tooling.md`, `../reallens-audio-director/SKILL.md` |
| **2. Canvas2D View Artist** | Subagent (Phase 3) | `views.js` (`window.VIEWS`, `window.NO_BLUR_VIEWS`) | `episode.js`, `templates/core.js`, `templates/views.example.js`, `references/visual-and-hud-specs.md` |
| **3. Visual & Pipeline QA** | Fresh Subagent (Phases 4, 6, 7) | *Read-only / Audit report* (never edits `views.js` directly) | `SKILL.md`, `references/visual-and-hud-specs.md`, `references/shorts-and-thumbnails.md`, rendered PNGs & CLI QA logs |
| **4. Packaging & SEO Writer** | Subagent (Parallel in Phase 5–6) | `seo_package.md` & `packaging.json` | `episode.js`, `timeline.json`, `shorts/shorts_plan.json`, `references/shorts-and-thumbnails.md` |

---

## 2. Synchronized Execution Flow

```text
[Director] Phase 0 (Intake: Documentary vs Survival) + Phase 1 (episode.js w/ Anti-Spoiler Arc & narration/camera split)
    │        + Phase 2 (node generate_audio.js -> PRONUNCIATION_MAP + 420ms tail pad + timeline.json)
    │
    ├──► [View Artist] Phase 3: Write views.js + NO_BLUR_VIEWS from visual_prompt & camera_note
    │         │
    │         ▼
    │    [Director] node sync_hyperframes.js + node hf.js lint/check + node audit_all_scenes.js (Narration QA + Grid)
    │         │
    │         ▼
    │    [Visual QA] Phase 4: Audit Narration QA + audit_all_scenes.png + scene_review.html + HUD mode (PASS / FAIL ticket, max 2 loops)
    │         │
    │         ▼
    │    ⏸️ [USER REVIEW GATE 1: SCENE APPROVAL] ส่ง audit_all_scenes.png + scene_review.html + scene_previews/ ให้ผู้ใช้ตรวจทุกฉาก
    │         │  (ถ้ามีจุดแก้ -> View Artist แก้เฉพาะฉาก + `audit_all_scenes.js --scenes ...`; ห้ามเรนเดอร์คลิปยาวจนกว่าจะอนุมัติ!)
    │         ▼
    └──► [Director] Phase 5: Render master_hf.mp4 + Folk Horror 16:9 thumbnails + inspect_video.js master_hf.mp4 --strict
              │
              ▼
         ⏸️ [USER REVIEW GATE 2: LONG-FORM APPROVAL] ส่งคลิปยาว master_hf.mp4 + ปก 16:9 ให้ผู้ใช้ตรวจและอนุมัติก่อน
              │  (หยุดรอที่นี่ — ห้ามทำ Shorts จนกว่าผู้ใช้จะสั่งให้ทำคลิปสั้นต่อ!)
              ▼
         [Director] Phase 6: shorts_planner.js --format cliffhanger (3 angles, 40-50s, anti-spoiler)
              │              -> generate_shorts_overlays.js -> render_all_shorts.js -> generate_scene_covers.js
              ├── (Parallel) [Packaging & SEO Writer] Draft Long-Form + 3-Angle Cliffhanger Shorts SEO
              ▼
         [Visual QA] Phase 6–7: Inspect covers/overlays + verify inspect_video.js --shorts --strict (<= 60s, 0 spoilers)
```

---

## 3. Director Scripting Guardrails (Phase 1 — Mandatory Before Writing `episode.js`)

1. **Documentary Retention Arc (`8–12 min` target when `NARRATIVE_MODE = 'documentary'`):**
   - `0:00–0:45` (`phase: 'hook'`): Open with a chilling incident & curiosity question — **STRICTLY NO scientific/medical/historical reveal**.
   - `0–50%` (`phase: 'folklore'`): Build local legends, rituals, taboos, eyewitness dread, and cultural context.
   - `50–90%` (`phase: 'decode'`, `isReveal: true`): Gradually unpack medical, anthropological, or historical evidence through clean visuals, narration, and in-world props (Clean Cinema Mode — zero popup HUD boxes).
   - `90–100%` (`phase: 'outro'`, `isFinalScene: true`): Synthesize social/historical meaning + place comment/subscribe CTA **ONLY in the final scene** (ZERO mid-video CTA!).
2. **Strict Narration vs. Visual Separation:**
   - Put ONLY spoken Thai dialogue/voiceover inside `narration` (legacy `vo`).
   - Put all scene visuals inside `visual_prompt` and camera directions inside `camera_note` / `cameraSpec`.
   - NEVER write `"มุมเสย"`, `"มุมก้ม"`, `"แพนกล้อง"`, `"ซูมเข้า"`, `"เงยหน้ามองกล้อง"` inside `narration` (caught by `audit_all_scenes.js` / `narration_qa.js`).
3. **Anti-Repetition Narrative Framing Rule:**
   - **NEVER recycle** the cliché fictional storyteller setup (*"พ่อใหญ่/แม่เฒ่าวัย 60–70 ปี นั่งแคร่หน้าบ้านเล่าเรื่อง"*) every episode!
   - Rotate framing across episodes: (a) Old newspaper / police / provincial records with real B.E. years, (b) Medical / epidemiological clinical case studies, (c) Anthropological field notes / local chronicles, (d) Economic/war/migration history archives, (e) Multi-perspective rural reconstructions (rural doctor, health officer, field researcher, witnesses in real locations).

---

## 4. Handoff Brief Templates

### A. Brief Template: `Canvas2D View Artist`
```markdown
Role: Canvas2D View Artist for Real Lens / Folk Horror Documentary
Workspace: <EPISODE_DIR>

Read first:
1. <SKILL_DIR>/references/visual-and-hud-specs.md
2. <EPISODE_DIR>/core.js
3. <EPISODE_DIR>/episode.js

Task:
Implement `<EPISODE_DIR>/views.js` defining `window.VIEWS` for every unique `scene.view` in `episode.js` strictly from each scene's `visual_prompt`, `camera_note`, and `cameraSpec`, plus `window.NO_BLUR_VIEWS = []`.

Mandatory Guardrails:
- Never copy props or fixed coordinates from past episodes or `views.example.js`.
- Never draw disguised marker-arrow lecture boards (`hand({ marker })` + `setLineDash`), infographic slides, or popup text boxes in `views.js` — keep `HUD_MODE === 'documentary'` 100% Clean Screen (pure animated artwork + frameless subtitles only).
- Cycle vertical camera pitch (`horizonY` low/high/eye, 3-plane foreground occlusion, Dutch tilt) with `cameraRig()`; never use pure `#000000` backgrounds.
- Canonical signatures: `prog(t, startA, endB)` and numeric `txt(..., size, ...)`.
```

### B. Brief Template: `Visual & Pipeline QA` (Fresh Subagent)
```markdown
Role: Independent Visual & Pipeline QA Critic
Workspace: <EPISODE_DIR>

Read/Inspect:
1. <SKILL_DIR>/SKILL.md
2. <EPISODE_DIR>/episode.js & <EPISODE_DIR>/views.js
3. Visually inspect via `read_file`: `audit_all_scenes.png`, `thumbnail_reallens_*.png`, `shorts/overlay_*.png`, `shorts/cover_*.png`
4. Verify CLI outputs: `node hf.js lint`, `node hf.js check`, `node audit_all_scenes.js`, `node inspect_video.js master_hf.mp4 --strict`, and `node inspect_video.js shorts/<clip>.mp4 --shorts --strict`.

Audit Checklist:
- [ ] Retention Arc respected: 0:00–0:45 anti-spoiler hook, 0–50% folklore/dread, 50–90% science/history decode, CTA ONLY on final scene.
- [ ] Narration QA clean (0 errors): zero camera commands in `narration`/`vo`, English/medical acronyms mapped in `PRONUNCIATION_MAP`, zero mid-video CTAs, clean 350–500ms trailing silence with zero abrupt tail cuts or clipping.
- [ ] Anti-Repetition respected: no recycled fictional "พ่อใหญ่/แม่เฒ่านั่งแคร่หน้าบ้าน" framing.
- [ ] HUD Mode verified: if `HUD_MODE === 'documentary'`, Clean Screen is strictly enforced (zero survival bars/rule cards, zero popup text boxes, pure animated visuals + frameless subtitles only); zero red chapter pills (`drawChapter`) and zero disguised lecture boards.
- [ ] Long-Form SEO Title: keyword in first 50–60 chars, zero redundant channel suffix (`| เว้าเรื่องหลอน`), zero spoilers.
- [ ] Folk Horror Thumbnail: dark/black/forest-green palette + red or flashlight-yellow focal accent, <= 4 words, huge mobile-readable text, NOT duplicating video title.
- [ ] Cliffhanger Bridge Shorts (3 angles: ritual, tension, twist): 40–50s each, zero scientific reveal spoilers, sentence-boundary snapped, 3–4s Related Video Bridge CTA (`overlay_<tag>_cta.png` pointing down-left) clearly readable.
- [ ] `16/16 PASS` on Master and all rendered Shorts (`<= 60.0s`).

Output Format: `STATUS: PASS` or `STATUS: FAIL` with defect table (`Phase | File/Scene | Defect | Required Fix`).
```

### C. Brief Template: `Packaging & SEO Writer`
```markdown
Role: YouTube Documentary & Shorts SEO Copywriter
Workspace: <EPISODE_DIR>

Read:
1. <SKILL_DIR>/references/shorts-and-thumbnails.md
2. <EPISODE_DIR>/episode.js, <EPISODE_DIR>/timeline.json, <EPISODE_DIR>/shorts/shorts_plan.json

Task:
Write `<EPISODE_DIR>/seo_package.md` and `<EPISODE_DIR>/packaging.json`:
1. 3 High-CTR Long-Form Titles: primary keyword inside first 50–60 chars, ZERO redundant channel name suffix, ZERO reveal spoilers, zero literary fluff.
2. Folk Horror Thumbnail copy (`<= 4` words, NOT duplicating TITLE, `accentMode: 'red' | 'flashlight'`).
3. Long-Form Description with exact `timeline.json` timestamps (anti-spoiler hook first) + Tags + Pinned Comment.
4. 3-Angle Cliffhanger Shorts Titles & Bridge Captions pointing viewers to the Related Video link below (no leading `EP` / `เหตุการณ์ #`, no reveal spoilers, no cliché "ฝากกดไลก์ กดแชร์").
```

---

## 5. Fallback & Cost Guardrails
- If subagents are unavailable, execute the 4 roles sequentially using the same checklists.
- Cap `View Artist ↔ Visual QA` retry loops at **2 iterations** before surfacing remaining defects to the user.
