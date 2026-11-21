# Visual & HUD Specifications (@real_lens1 Style)

This reference defines the exact color tokens, typography, HUD card blueprints, multi-theme shaders, and the complete `core.js` Canvas2D API used in **Real Lens** 2.5D geometric survival horror animations.

> **Production Source Files:** Copy the complete, runnable implementations from [`templates/core.js`](../templates/core.js), [`templates/views.example.js`](../templates/views.example.js), and [`scripts/audit_all_scenes.js`](../scripts/audit_all_scenes.js) rather than typing partial snippets by hand.

---

## 1. Color Palette Tokens

| Element | Hex / RGBA | Usage |
| :--- | :--- | :--- |
| **Liminal Mall Fluorescent (Theme A)** | `#2A2614` → `#14120A` (Tube: `#FEF08A` @ 0.85) | Infinite mall corridors, sickly yellow ambient light & ceiling fixture grids |
| **Polar Vortex / Deep Freeze (Theme B)** | `#082F49` → `#1E293B` (Ice: `#38BDF8`, Heat: `#F97316`) | Sub-zero disaster backdrop, `frostOverlay()` border creep & `coldBreath` vapor |
| **Night Shift / Visible Midnight (Theme C)** | `#162030` → `#283040` / `#3B281B` | Visible dark interiors, night streets, teak wood — **NEVER pure `#000000`** |
| **HUD Card Surface (Warm Cream)** | `#F5EFE6` (Alt: `#FAF7F2`, Shadow: `rgba(0,0,0,0.45)`) | Signature warm cream surface for in-scene rules, math, and clue cards |
| **HUD Card Border** | `#D6CFC2` (1.5px) | Crisp border separating cards from blurred background |
| **HUD Badge Pill (Danger Red)** | `#B91C1C` (Text: `#FFFFFF`) | Red pill header inside Rule Cards (`⚠ กฎข้อ 1–N`) |
| **HUD Badge Pill (Neutral/Slate)** | `#18181B` (Text: `#FFFFFF`) | Dark charcoal pill header for Info, Inventory, Pattern, or Clue cards |
| **Telemetry Container (Top-Right)** | `rgba(14, 14, 18, 0.84)` | Dark rounded rectangle holding day/location, time, status, and primary meter bar |
| **Distance Tracker Pill** | `#F5EFE6` with `#18181B` inner pill | Cream outer pill, charcoal inner badge (`● ระยะห่าง`), crimson distance text (`4 ม.`) |
| **Protagonist Skin** | `#C98B5E` (`Hi: #D9A27A`, `Sh: #A66C44`) | Warm cylindrical gradient (`cyl()`) on head, neck, and hands |
| **Under-Eye Fatigue Crescent** | `rgba(70, 30, 20, 0.22–0.45)` | Soft crescent shadow under eyes conveying exhaustion and dread |
| **Emergency Exit Sign Neon** | `#22C55E` / `#10B981` (Glow: `rgba(34, 197, 94, 0.4)`) | Glowing green exit sign in distance |

---

## 2. Canvas Resolution & Scaling Standard

- **Base Composition Coordinate Space:** Always author `core.js`, `views.js`, and `index.html` at **`1280x720`** (`W = 1280, H = 720`).
- **Master Export Scaling:** Export natively at `1280x720` (`node hf.js render`), at `2x` integer DPR `2560x1440` (`node hf.js render --resolution 1440p`), or upscale cleanly to `1920x1080` via FFmpeg Lanczos (`node render_mp4.js --1080p`). *(Note: HyperFrames `--resolution` requires integer scale multiples of the composition dimensions.)*
- **9:16 Vertical Shorts Safe Zone:** When rendering native `SHORTS_MODE` or `render_all_shorts.js`, keep subtitles at $Y \le 1580\text{ px}$ (`1080x1920`) or inside the centered `1080x608` frame (`y: 576..1184`), and keep HUD cards $\le 880\text{ px}$ wide with $\ge 140\text{ px}$ right clearance.

---

## 3. Clean Cinematic Story Output (HUD Cards, Telemetry & Red Chapter Pills Disabled)

For **clean cinematic horror storytelling** without infographic lecture clutter:
- **`drawChapter(c, chap, lt)` — PERMANENTLY DISABLED:** Red pill chapter banners such as `บทนำ · COLD OPEN` or `องก์ที่ ...` are removed (`return;`). Do NOT add `chapter:` in `episode.js`.
- **`drawTele(c, s, lt)` & `drawCard` / `drawFlow` — DISABLED BY DEFAULT (`window.__ENABLE_STORY_TELE = false`, `window.__ENABLE_STORY_HUD = false`):** Top-right dark telemetry boxes (`● คืนฝนพรำ ... / ระดับเสียง / ระยะห่าง`), cream info/medical/anthropology explainer cards (`● ถอดรหัส...`), math tables, rule boxes, and dilemma flowcharts NEVER render over story scenes.
- **No Infographic Explainer Diagrams in `views.js`:** Never draw bulleted summary panels, PowerPoint slide layouts, biological/medical chart breakdowns, or marker-pointing lecture boards inside `views.js` — let the 2.5D visual scene and frameless subtitles (`drawSub()`) carry 100% of the story cleanly.

*(Helper utilities `cardBox()` / `badge()` remain defined only if custom external thumbnail scripts use them; do NOT render in-story HUD/Telemetry banners.)*

---

## 4. Complete `core.js` Reference API

See [`templates/core.js`](../templates/core.js) for the full production implementation:

1. **2-Segment FK Poses & Seamless Limbs:** `poseWalk(t, speed, amp)` (with `Math.max(0, ...)` clamped knees), `poseStand(t, o)`, `poseKneel(t, o)`, `poseSit(t, o)` (natural 90°–110° chair `L`-sit `b <= a`, `{ curb: true }` for low ledges, always paired with a drawn seat/ledge under `hipY`), `poseSquat(t, o)`, `poseClimb(t, speed)`. `limbContour2()` + `limb()` automatically render a continuous ambient dark contour underpass behind both segments (eliminating knee/elbow cap seams) plus a delicate lit-edge rim highlight.
2. **Signature Protagonist Rig (`drawPerson(c, x, y, s, o)`):**
   - Keeps the iconic **Real Lens 2.5D Geometric DNA** (`1:6.5` ratio, `hipY = -92 + by`, `torsoH = 64`, legs `45 + 45`, arms `32 + 30`, continuous trapezius collar slope, `52x62` capsule head) refined with a clean "Less is More" channel signature:
   - **Face & Hair:** Side ears with inner-ear shadow crescent, directional cheek/jaw rim-light (`rgba(255,228,196,0.28)`), subtle nose-tip accent ellipse (without long bridge clutter), clean 2-sweep male fringe (`short`) / flowing `long` & `bun` framing, and a soft crown highlight arc (`rgba(255,255,255,0.11)`).
   - **Signature "Real Lens" Eyes:** Symmetrical `[-10, 10]` dark round eyes upgraded with a soft upper-eyelid crease arc (`rgba(45,20,14,0.22)`), **dual catchlights** (top-right primary glint + micro bottom-left secondary glint), periodic blinking, and a single subtle under-eye fatigue crescent.
   - **Torso & Hands:** Neck-to-clavicle shadow, structured collar lapels, subtle chest/waist shirt folds, lit-side rim edge, and contoured fist grip.
   - Options: `colors` (`{ shirt, shirtHi, shirtSh, pants, pantsSh }` — customize per story protagonist!), `thin`, `dir`, `back`, `profile`, `expr` (`'neutral' | 'focus' | 'fear' | 'shock' | 'squint' | 'tired' | 'relief'`), `sweat`, `coldBreath` (Theme B), `shiver` (Theme B), `coverMouth` (Theme C), `tapeArm`, `bag`, `milk`, `flashlight`, `torch`, `wand`, `weaving`, `bundle`, `sinh`, `sash`, `swollenBelly`.
3. **Entity Rig (`drawEntity(c, x, y, s, o)` & `drawJanitor`):**
   - Enforces strict Z-index layering (`suitSh` far arm → prop → torso → `suitHi` near arm) so gripped props never render over the front forearm, with seamless `limbContour2()` limbs, **sunken eye-socket shadow halos**, subtle cold moonlight rim-light along head/torso, and eerie pinpoint socket glares.
   - `drawEntity()` defaults to **no mop (`prop: 'none'`) and no cap (`cap: false`)** so every story's antagonist looks distinct (only `drawJanitor()` enables mop/cap by default). Configurable `suit`, `suitHi`, `suitSh`, `skin`, `cap`, `prop: 'none' | 'mop'`, `reveal`, `bloodSlits`, `eyeColor`.
4. **Macro POV Forearm (`hand(c, x, y, ang, s, o)`):**
   - Strictly `400px` long (`rr(c, -26, 0, 52, 400, 22)`) extending off the canvas edge (`y = 760..820`), with subtle ambient forearm contour, lit-side rim highlight, wrist tendon lines, and finger knuckle creases; supporting `sleeve`, `sleeveColor`, `watch`, `wand`, `marker`, `tape`, `flashlight`, `knife`, `radio`.
   - Always pair writing/taping macro scenes with `ctx.clip()` synchronized to `penX`/`tapeX` for zero ghosting.
5. **Multi-Environment Stage Builders (Architectural Ink & Rim-Edge Line-Art Signature) & Post-Processing:**
   - `corridor(c, t, o)` (1-pt 3D tunnel with dual-tone architectural ink + specular rim lines on baseboards, dado rails, ceiling cornices, and pilasters, plus recessed wall panel frames (`กรอบลูกฟักผนัง`), overhead ceiling conduit pipes, perspective floor tile bevels, volumetric trapezoid light cones with drifting dust motes, and specular floor streaks; supports `LIT`, `DARK`, `PK`, or custom palette; plain line-art walls by default unless `mallShops: true`),
   - `outdoorStage(c, t, o)` (open horizon with twinkling night stars, rim-lit cloud wisps (`clouds !== false`), sagging overhead sky wires (`wires !== false`), 2-layer parallax mountain/treeline ridges with crisp moonlit crest rims + organic foliage tufts, atmospheric horizon mist + stylized mist ribbons, and rim-lit swaying foreground corner reeds unless `foreground: false`),
   - `roomCorner(c, o)` (2-point asymmetric interior with dual-line architectural trim + rim highlights on corner junction, sloped baseboards, crown molding, chair rail, framed recessed wainscoting panels (`กรอบบัวผนังลูกฟัก`), perspective wood-plank floor bevels, vertical corner AO gradients, and diagonal slat light shafts with dust motes unless `lightShaft: false`),
   - `topDownRoom(c, o)` (bird's-eye tactical blueprint with 45° diagonal perimeter wall hatching, crisp inner/outer casing rim lines, 3D inner wall drop-shadows, floor tile cross-ticks, structural corner posts, and doorway threshold swing-arc blueprint lines unless `door: false`),
   - `cctvOverlay(c, t, o)` (CRT scanlines, drifting phosphor sweep bar, center optical reticle ticks, viewfinder brackets, blinking `REC` dot, and live `TC` timecode readout),
   - Post/FX utilities: `blurLayer(c, px, fn, extra)`, `flick(i, t, rate)`, `glow(c, x, y, r, col, a)`, `vignette(c, k, inner, col)`, `darken(c, a, col)`, `emergency(c, x, y, r, a)`, `frostOverlay(c, intensity, t)`, `grain(c, t, a)`.
6. **HUD & Subtitles:**
   - `normalizeCard(s)`, `drawCard(c, card, lt, dur)`, `drawFlow(c, card, lt)`, `drawTele(c, s, lt)`, `drawChapter(c, ch, lt)`, `drawSub(c, s, lt)` (reads `{ t0, t1, text }` and clamps `SHORTS_MODE` safely).

---

## 5. Story-Driven Camera Direction & All-Scene Visual Audit

Never copy mall-specific props (`tiles`, `C-13`, `fittingRoom`, `31 Feb` expiry cards) into unrelated stories. Compose every view in `views.js` using setting-native surfaces and varied camera angles (1-pt/2-pt 3D perspective, high establishing wide, Over-the-Shoulder, water/ground low-angle, architectural frame-within-a-frame, Macro POV, and physics diagrams).

Before rendering any MP4, always generate and visually inspect the full-scene contact sheet:
```bash
node audit_all_scenes.js
```
Open `audit_all_scenes.png` with `read_file` to verify zero fallback views, zero distorted faces, zero severed arms, zero dark/black frames, and zero HUD text clipping.
