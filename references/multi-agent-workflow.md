# Multi-Agent Production Workflow (Role-Based Orchestration)

Use this optional orchestration pattern for **full-episode productions (20–33+ scenes or full 16:9 + Shorts + SEO bundles)** where a single context window risks **context rot** (forgetting `core.js` signatures, Golden Rule separation, or Shorts constraints during late phases) or **confirmation bias** during visual QA.

> **When to stay Single-Agent:** Quick script edits, single-scene view fixes, audio re-runs, or small 5–10 scene prototypes — single-agent execution avoids handoff overhead and uses fewer tokens.

---

## 1. Architecture: 4 Specialized Roles (Not 7 Sequential Agents)

Because Phases 1 → 2 → 3 → 4 → 5 have strict data dependencies (`episode.js` → `timeline.json` → `views.js` + `sync_hyperframes.js` → `render`), splitting 1 agent per phase creates unnecessary waiting. Instead, split by **cognitive boundary and file ownership**:

| Role | Execution Mode | Primary Ownership (Write) | Required Context to Load |
| :--- | :--- | :--- | :--- |
| **1. Director (Main Agent)** | Coordinator (Always active) | `episode.js`, CLI execution (`generate_audio.js`, `sync_hyperframes.js`, `hf.js`, `render_*`) | `SKILL.md`, `references/pipeline-and-tooling.md`, `../reallens-audio-director/SKILL.md` |
| **2. Canvas2D View Artist** | Subagent (Phase 3) | `views.js` (`window.VIEWS`, `window.NO_BLUR_VIEWS`) | `episode.js`, `templates/core.js`, `templates/views.example.js`, `references/visual-and-hud-specs.md` |
| **3. Visual & Pipeline QA** | Subagent (Phase 4 & Phase 6/7) | *Read-only / Audit report* (never edits `views.js` directly) | `SKILL.md`, `references/visual-and-hud-specs.md`, `references/shorts-and-thumbnails.md`, rendered PNGs & CLI outputs |
| **4. Packaging & SEO Writer** | Subagent (Parallel in Phase 5–6) | `seo_package.md` (or final metadata block) | `episode.js`, `timeline.json`, `shorts/shorts_plan.json`, `references/shorts-and-thumbnails.md` |

### Strict File-Lock Rule (Zero Merge Conflicts)
- **Never** let two agents edit the same file concurrently (`views.js`, `episode.js`, `index.html`).
- **Director** owns all CLI steps that mutate `timeline.json`, `index.html`, `audio/`, and `shorts/`.
- **Visual QA** returns structured defect tickets (`scene.id`, `view`, exact fix); **Director** delegates fixes back to **View Artist** (or applies small targeted fixes).

---

## 2. Synchronized Execution Flow

```text
[Director] Phase 0 (Intake) + Phase 1 (episode.js) + Phase 2 (node generate_audio.js -> timeline.json)
    │
    ├──► [View Artist] Phase 3: Write views.js + NO_BLUR_VIEWS
    │         │
    │         ▼
    │    [Director] node sync_hyperframes.js + node hf.js lint/check + node audit_all_scenes.js
    │         │
    │         ▼
    │    [Visual QA] Phase 4: Inspect code guardrails + audit_all_scenes.png (PASS / FAIL ticket)
    │         │  (if FAIL -> View Artist fixes listed views -> re-audit, max 2 loops)
    │         ▼
    └──► [Director] Phase 5: Render master_hf.mp4 + 16:9 thumbnails + inspect_video.js master_hf.mp4 --strict
              │
              ▼
         ⏸️ [USER REVIEW GATE] ส่งคลิปยาว master_hf.mp4 ให้ผู้ใช้ตรวจและอนุมัติก่อน
              │  (หยุดรอที่นี่ — ห้ามทำ Shorts จนกว่าผู้ใช้จะสั่งให้ทำคลิปสั้นต่อ!)
              ▼
         [Director] Phase 6: Run shorts_planner, overlays, render_all_shorts.js, generate_scene_covers.js
              │
              ├── (Parallel) [Packaging & SEO Writer] Draft Long-Form + Shorts SEO from timeline.json + shorts_plan.json
              │
              ▼
         [Visual QA] Phase 6–7: Inspect covers + overlays via read_file & verify inspect_video.js --shorts --strict (16/16 PASS, <= 60s)
```

---

## 3. Handoff Contracts & Subagent Brief Templates

### A. Brief Template: `Canvas2D View Artist`
Pass this contract when invoking the Phase 3 subagent (after `episode.js` and `timeline.json` exist):

```markdown
Role: Canvas2D View Artist for Real Lens (@real_lens1)
Workspace: <EPISODE_DIR>

Read first:
1. <SKILL_DIR>/references/visual-and-hud-specs.md
2. <EPISODE_DIR>/core.js
3. <EPISODE_DIR>/episode.js

Task:
Implement `<EPISODE_DIR>/views.js` defining `window.VIEWS` for every unique `scene.view` in `episode.js`, with clean `window.NO_BLUR_VIEWS = []`.

Mandatory Guardrails:
- GOLDEN RULE (CLEAN CINEMATIC STORYTELLING): Tell 100% of the horror story through environmental scenes, lighting, camera composition, and character acting. **STRICTLY PROHIBITED inside `views.js`:** infographic explanation slides, bulleted lecture panels (`1..2..3`), chalkboard/slide summary diagrams (e.g., medical/anthropology breakdown cards), or markers pointing at text charts! NEVER copy mall props (shutters, mall tiles, fitting rooms, C-13, arm tape, 31 Feb bread, janitor mop) into non-mall stories, and NEVER copy fixed character coordinates `(x, y, scale)` from `views.example.js`.
- Custom Protagonist & Threat Look: Pass a story-appropriate outfit palette via `colors: { shirt, shirtHi, shirtSh, pants, pantsSh }` to `drawPerson()`, and customize `drawEntity()` (`suit`, `cap`, `prop`, `eyeColor`) to match this story's specific antagonist/hazard.
- Varied Spatial Stage Builders: Mix `outdoorStage()`, `roomCorner()`, `topDownRoom()`, `cctvOverlay()`, `corridor()` (with varied `vx`, `vy`, `camH`), Macro POV `hand()` (400px + `ctx.clip()`), and Split-Screen views — never repeat the same camera angle or `(x, y)` staging for > 2 consecutive scenes.
- Canonical signatures: `prog(t, startA, endB)` (NOT duration), `txt(c, s, x, y, numericSize, ...)` (NOT CSS font strings).
- Never use pure `#000000` for night/water backgrounds (use `#162030`, `#1E293B`, `#283040`, `#3B281B`).

Done Criteria:
- Every `scene.view` in `episode.js` has a working, visually distinct renderer in `views.js`.
- Reply with: list of views implemented, spatial stage builders/camera angles used, protagonist palette, and `NO_BLUR_VIEWS` array.
```

### B. Brief Template: `Visual & Pipeline QA`
Run this in a **fresh subagent** (never reuse the View Artist conversation) so inspection is unbiased:

```markdown
Role: Independent Visual & Pipeline QA Critic
Workspace: <EPISODE_DIR>

Read/Inspect:
1. <SKILL_DIR>/SKILL.md (Sections 1, 4, 5)
2. <EPISODE_DIR>/episode.js & <EPISODE_DIR>/views.js
3. Visually inspect via `read_file`:
   - Phase 4: `<EPISODE_DIR>/audit_all_scenes.png` (and `review-beats.jpg` if present)
   - Phase 6: `<EPISODE_DIR>/thumbnail_reallens_showdown.png`, `<EPISODE_DIR>/thumbnail_reallens_5panel.png`, `<EPISODE_DIR>/shorts/overlay_ep*.png`, `<EPISODE_DIR>/shorts/cover_shorts_ep*.png`
4. Verify command outputs (run if not already provided):
   - `node hf.js lint` (must be 0 errors, 0 warnings)
   - `node hf.js check`
   - `node inspect_video.js master_hf.mp4 --strict` (Phase 7)
   - `node inspect_video.js shorts/<ep>.mp4 --shorts --strict` (Phase 7, every EP <= 60.0s)

Audit Checklist:
- [ ] `episode.js` (`SCENES[0]`) opens within 0–3s at the peak anomaly/twist (`isClimax: true` or acute trigger) before rewinding to backstory (no slow chronological intro)
- [ ] Zero `#000000` background fills or `blackdetect` failures
- [ ] Correct `prog(t, a, b)` and numeric `txt()` signatures in `views.js`
- [ ] **Clean Story Visuals (ZERO Infographics / Telemetry / Red Chapter Pills):** Zero infographic explanation slides or bulleted diagram boards inside `views.js`, zero Telemetry HUD boxes (`drawTele`), zero Rule/Info/Math/Dilemma HUD cards (`drawCard`/`drawFlow`) in-scene, and zero red `บทนำ · COLD OPEN` / `องก์ที่ ...` pill banners (`drawChapter`)
- [ ] Zero mall-prop contamination in non-mall stories (Golden Rule) and zero default janitor mop/cap on non-janitor entities
- [ ] Bespoke camera staging across scenes (no monotonous 3+ consecutive `corridor()` or identical `(x, y)` character placement)
- [ ] Zero distorted faces, inverted knees, or short floating POV arms (`hand()` must be 400px off-edge)
- [ ] `overlay_*.png`: Transparent top scrim + 2-Line Two-Tone Stroked Title (`#EF4444` / `#FFFFFF`) only (NO red/orange pill/box bar below headline, NO leading `EP` / `เหตุการณ์ #` / `จบในคลิป:`, NO black letterbox bars, NO yellow category header, NO bottom rule card)
- [ ] `cover_*.png` / `cover_shorts*.png`: Full-Bleed Scene Art + Top 2-Line Two-Tone Title + Fitted Rectangular Red Sub-Hook Box (`subHook` spaced cleanly below Line 2) (**STRICTLY NO viewfinder borders or red/yellow corner brackets**, NO top-right Telemetry HUD box, NO bottom stamp `เหตุการณ์ #1–#5`/`EP 1`/`จบใน 1 คลิป`, NO bottom yellow-red bar)
- [ ] Shorts structure strictly **45–60s event cuts** (`isEvent: true`, coherent setup + climax per event) OR **1 standalone `45–60s` clip** OR **max 2 parts** (`act: 2` opens with 3s recap `isRecap: true`); titles lead directly with short understandable event/clip titles following `[Short Hook <= 38 chars] | [Series]` (ZERO leading `EP` / `เหตุการณ์ #`)
- [ ] `16/16 PASS` and every Short `<= 60.0s`

Output Format:
Return `STATUS: PASS` or `STATUS: FAIL` with a numbered defect table (`Phase | File/Scene | Defect | Required Fix`).
```

### C. Brief Template: `Packaging & SEO Writer`
Launch in **parallel** once `timeline.json` and `shorts/shorts_plan.json` are generated:

```markdown
Role: YouTube & Vertical Shorts SEO Copywriter
Workspace: <EPISODE_DIR>

Read:
1. <SKILL_DIR>/references/shorts-and-thumbnails.md (Sections 2 & 5)
2. <EPISODE_DIR>/episode.js
3. <EPISODE_DIR>/timeline.json
4. <EPISODE_DIR>/shorts/shorts_plan.json

Task:
Write `<EPISODE_DIR>/seo_package.md` containing:
1. 3 High-CTR Long-Form YouTube Titles following `[Question or Suspense Hook <= 45 chars] | [Exact Series Name]` (core meaning completed within the first 45 characters, exact same series name strictly after `|`)
2. Structured Long-Form Description using exact act timestamps from `timeline.json` (starting with `00:00 วินาทีพีค: จุดผิดปกติแรก (3 วินาทีแรก)` without spoiling the final twist) + Rules summary + 10–15 Tags + Pinned Comment
3. Shorts / TikTok / Reels Titles leading directly with short understandable event/clip titles (NEVER leading with `EP X:`, `เหตุการณ์ #X:`, or `จบในคลิป:`) following `[Short Event Hook <= 38 chars] | [Series Name]` (for 45-60s event cuts or 1-clip default) or Part 1 + `[Payoff Hook <= 32 chars] (ตอนจบ) | [Series Name]` (max 2 parts) + 5-Part Suspense Captions & Hashtags matching `shorts/shorts_plan.json`.
```

---

## 4. Fallback & Cost Guardrails
- **If subagents are unavailable** in the host runtime, the single agent executes all 4 roles sequentially using the same phase boundaries and QA checklists above (forcing an explicit self-audit pass before rendering).
- **Max QA Retry Cap:** Cap `View Artist ↔ Visual QA` fix loops at **2 iterations**; if visual defects persist on specific views, present the diagnostic findings to the user before spending more render/token quota.
