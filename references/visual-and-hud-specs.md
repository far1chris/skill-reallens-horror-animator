# Visual, Camera & HUD Specifications (@real_lens1 & Folk Horror Documentary)

This reference defines the exact color tokens, dual-mode HUD system (`survival` vs `documentary`), canonical `core.js` Canvas2D rig/stage API, and camera pitch diversity rules.

> **Production Source Files:** Copy runnable implementations from [`templates/core.js`](../templates/core.js), [`templates/views.example.js`](../templates/views.example.js), and [`scripts/audit_all_scenes.js`](../scripts/audit_all_scenes.js).

---

## 1. Multi-Theme Atmospheric Palettes

Never use pure `#000000` for night backgrounds/water (causes `ffmpeg blackdetect` failures). Always layer visible midtones across **4 depth planes**:

| Theme Preset | Primary Palette | Lighting & Atmosphere (`core.js`) | Focal Accent / Helpers |
| :--- | :--- | :--- | :--- |
| **Folk Horror Documentary (Thai/Isan)** | `#040806`, `#091510`, `#0F221A` | Murky deep forest-green/charcoal darkness, lantern warmth, mist | Vivid Crimson `#DC2626`/`#EF4444` or Flashlight `#FACC15`, `drawStiltHouse()`, `outdoorStage()`, Clean Cinema (`hudMode: 'documentary'`) |
| **A. Liminal Space / ห้างร้าง** | `#0B0F19`, `#10B981`, `#EF4444` | Flickering fluorescent glow (`#FEF08A`), deep silhouettes | `corridor()`, `drawEntity()` / `drawJanitor()`, `emergency()` |
| **B. ภัยพิบัติเอาตัวรอด (Freeze / Flood)** | `#082F49`, `#38BDF8`, `#F97316` | Rolling storm/mist, cold vapor & waves | `frostOverlay()`, `coldBreath: true`, `shiver: true`, `outdoorStage()` |
| **C. กฎกะดึก (Night Shift)** | `#162030`, `#283040`, `#3B281B` | Heavy slate shadows, tactical beam contrast | `coverMouth: true`, `drawEntity({ cap: false })`, `vignette()` |

---

## 2. Canvas Resolution & Scaling Standard

- **Logical Composition:** Author `views.js` cleanly in logical **`1280×720`** coordinates (`W = 1280, H = 720`).
- **Native 1080p @ 30fps Export (Default):** `index.html` and `render_mp4.js` render natively onto **`1920×1080 @ 30fps`** via `rs = 1.5` canvas transform + scaled offscreen buffers (`getRenderScale()` / `ensureOffscreenSize()`). Use **`node hf.js render -f 30 -q looks --gpu --browser-gpu`** or **`node render_mp4.js`** (NVENC/AMF GPU + 4 parallel workers).
- **Fast Draft / Cinema Mode:** Pass `--720p --fps 24` to `render_mp4.js` (`node sync_hyperframes.js --width 1280 --height 720 --fps 24`) or `-f 24 -q draft` to `hf.js render`, or `--resolution 1440p` (`2560×1440`) when integer `2×` DPR is requested.
- **9:16 Vertical Shorts Safe Zone (`1080x1920`):** Keep subtitles at `Y <= 1580` (`subY = 1500` default), clear of top `180px`, bottom `320px` (where channel name & Related Video button sit), and right `140px` action buttons.

---

## 3. Dual HUD Architecture (`hudMode: "survival" | "documentary"`)

`templates/core.js` and `templates/index.html` support two mutually exclusive HUD modes via `HUD_MODE` in `episode.js` (propagated to `timeline.json`), `window.HUD_MODE`, `?hudMode=documentary`, HyperFrames composition variable `hudMode`, or per-scene `scene.hudMode`.

### 3.1 `hudMode: "survival"` (Backward-Compatible Default)
- **Clean Cinematic Story Output:** Inside story scenes, `drawChapter()` is permanently disabled (zero red `บทนำ · COLD OPEN` pills). Game telemetry (`drawTele()`) and warm-cream `#F5EFE6` survival rule/math/dilemma cards (`drawCard()`, `drawFlow()`) stay **OFF by default** (`window.__ENABLE_STORY_TELE = false`, `window.__ENABLE_STORY_HUD = false`) unless a legacy survival project explicitly opts in.
- **No Disguised Lecture Boards in `views.js`:** Never draw centered rectangle boards `rr(c, 120, 70, ...)` with dashed `setLineDash` arrows + `hand({ marker })`.

### 3.2 `hudMode: "documentary"` (Clean Cinema Mode — Zero On-Screen Popup Boxes)
When `hudMode === "documentary"`:
- **Clean Screen (100% Pure Animation + Frameless Subtitles ONLY):**
  - `drawTele()`, `drawCard()`, and `drawFlow()` early-return immediately so game-style energy/oxygen/sound meters and survival rule cards NEVER appear.
  - **ห้ามวาดป้ายหรือกรอบข้อความป๊อปอัปใด ๆ ทับบนภาพแทน** — ให้ผู้ชมโฟกัสกับงานภาพแอนิเมชัน แสงเงา บรรยากาศ และซับไตเติล (`drawSub()`) เท่านั้น เพื่อไม่ให้หน้าจอรกลดทอนอารมณ์สารคดีสยองขวัญ
  - หากต้องการเล่าปี พ.ศ., สถานที่, ศัพท์การแพทย์, หรือข้อความจากบันทึกประวัติศาสตร์ ให้เล่าผ่านบทพากย์ (`narration`), ซับไตเติล, หรือ **วัตถุจริงภายในโลกของฉาก** (เช่น หน้าหนังสือพิมพ์เก่า, ป้ายหมู่บ้าน, แฟ้มประวัติบนโต๊ะที่ส่องไฟฉาย) แทนการแปะกล่อง HUD ทับบนหน้าจอ

---

## 4. Complete `core.js` Rig, Pose & Stage API

1. **2-Segment FK Poses & Hip-Pivot Limbs:**
   - `poseWalk(t, speed, amp)` (`Math.max(0, ...)` clamped knees — prevents inverted-knee bug), `poseStand(t, o)`, `poseFloorSit(t, o)` / `poseSit(t, { floor: true })` (`by: 72` for floor mats/dirt/campfire), `poseSit(t, { curb: true })` (`by: 54` low logs/steps), `poseSit(t, o)` (`by: 34` benches/chairs), `poseSquat(t, o)` (`by: 64`), `poseKneel(t, o)` (`by: 58` — NEVER substitute `poseKneel` for floor sitting), `poseClimb(t, speed)`.
   - Torso `lean` pivots at `hipY` (no detached waist), and sitting/kneeling arms pass through `clampSitArms()` (pass `rawArms: true` only when raising props).
2. **Protagonist Rig (`drawPerson(c, x, y, s, o)` — `1:6.5` Ratio):**
   - `hipY = -92 + by`, `torsoH = 64`, legs `45 + 45`, arms `32 + 30`, continuous trapezius slope, `52x62` capsule head with `cyl()` shading, symmetrical `[-10, 10]` eyes with dual catchlights, periodic blink `(t % 3.7) < 0.12`, under-eye fatigue crescents, and automatic 3/4 side-gaze (`isSideGaze`) when `profile`, `flashlight`, `torch`, or `gazeForward` is enabled.
   - Always customize `colors: { shirt, shirtHi, shirtSh, pants, pantsSh }` per episode! Supports `female`, `hairStyle: 'short'|'long'|'bun'`, `sinh`, `sash`, `swollenBelly`, `bundle`, `torch`, `wand`, `weaving`, `flashlight`, `coldBreath`, `shiver`, `coverMouth`.
3. **Entity Rig (`drawEntity(c, x, y, s, o)` & `drawJanitor`):**
   - Strict Z-index order: `suitSh` far arm → prop → torso → `suitHi` near arm.
   - `drawEntity()` defaults to `prop: 'none'` and `cap: false` so every threat matches its lore (only `drawJanitor()` enables mop/cap). Supports eerie upgrades: `aura` (dark spectral halo), `tattered` (jagged shroud hem), `hair: 'straggly'`, `eyeGlow`, hollow cheek shadows, and `mouth`.
4. **Macro POV Forearm (`hand(c, x, y, ang, s, o)`):**
   - Strictly `400px` long anchored off the canvas edge (`y = 760..820`) — never a short floating arm. Pair writing/taping reveals with synchronized `ctx.clip()`. Use ONLY for physical in-world interaction (never pointing `marker` at diagram boards).
5. **Setting-Native Stage Builders (Optional Tools — NOT a Mandatory Checklist):**
   - `outdoorStage(c, t, { skyTop, skyBot, groundCol, horizonY, water, ridgeH })` + **Rural Thai Builders:** `drawStiltHouse(c, t, o)` (raised timber floor beam `floorY: 322` with `recommendedScale: 0.86` for seated `underStiltFn` characters so heads clear the floor beam cleanly), `drawSugarPalm(c, x, y, s, sway)`, `drawRiceClump(c, x, y, s, t, seed, litWarm)`, `drawBananaCluster(c, x, y, s, t)`, `drawDikeGrass(c, x, y, s, seed, warm)`.
   - `roomCorner(c, { cornerX, topY, botY })` — strictly for enclosed interiors (never force outdoor witnesses into `roomCorner()`).
   - `topDownRoom(c, { x, y, w, h, grid })` — strictly for walled interiors (never for forests/camps).
   - `cctvOverlay(c, t, { camLabel })` — only for security/trailcam/optical feeds.
   - `corridor(c, t, o)` — tunnels/hallways (`mallShops: true` only in malls; vary `camH`, `vx`, `vy`).
   - Post/FX & Atmosphere: `cameraRig(c, lt, dur, o, fn)`, `blurLayer(c, px, fn, extra, cacheKey)` (pass static `'cacheKey'` on non-moving blurred layers for 40–60% faster `1080p` renders), `drawGroundMist(c, t, o)` (low drifting fog ribbons), `drawDustMotes(c, t, o)` (fireflies/dust/embers), `flick()`, `glow()`, `vignette()`, `darken()`, `emergency()`, `frostOverlay()`, `grain()`.
6. **Canonical Signatures (Anti-Distortion):**
   - `prog(t, startA, endB)` takes `(t, start, end)` — **NOT** `(t, start, duration)`.
   - `txt(c, s, x, y, numericSize, col, weight, align, base)` takes numeric `size` — **NOT** CSS font strings.

---

## 5. Camera Pitch Diversity & Anti-Template Rules

Never clone past episodes or leave 80% of scenes at flat eye-level (`horizonY = 410..460`). Explicitly cycle vertical pitch alongside `cameraRig()` and keep frames moving (`<= 3s` static max):
1. **Worm's-Eye / Low Ground Pitch (`horizonY = 550..640`):** Looking steeply upward from mud/roots/under-stilts.
2. **High Steep Down-Angle (`horizonY = 120..220`):** Looking down from treetops, stilt decks, or ridges.
3. **3-Plane Foreground Occlusion POV (Preferred over `W/2` Red Split-Screen):** Shoot past dark foreground silhouettes (bamboo, timber stilts, window slats, banana leaves) into mid/background depth.
4. **Dutch Angle Tilt (`c.rotate(±0.05..0.08)`):** Subtle horizon roll during dread or sudden discovery beats.
5. **Pre-Render Audit:** Always run `node audit_all_scenes.js` (checks Narration QA + renders `audit_all_scenes.png`) and visually inspect `audit_all_scenes.png` via `read_file` before MP4 render.
