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

## 3. Signature HUD Card Archetypes (Canvas Blueprints)

Whenever a HUD card enters the frame (`normalizeCard()` supports both `s.card` and `s.hud` schemas):
- **Camera Rack-Focus:** `index.html` blurs background views (`blurLayer`) unless `s.view` is listed in `window.NO_BLUR_VIEWS` or `card.type === 'inventory'`.
- **Card Entrance:** `easeBack` pop-scale from `0.92` to `1.0` with automatic Thai width/font fitting (`fitTextSize`) so long Thai lines or tone marks never overflow (`badge` height `26px`, card padding `26px`).

### Archetype 1: Survival Rule Card (`⚠ กฎข้อ 1` – `กฎข้อ N`)
- **Fields:** `{ type: 'rule', at, pos: 'tl', ruleNo: 'กฎข้อ 1', title: [line1, line2], eng: 'RULE 1 · ...' }`
- Line 1 renders in `#1C1917` (Ink), Line 2 renders in `#B91C1C` (Danger Red), separated from the English sub-caption by a `#CFC6B6` rule line.

### Archetype 2: Theme-Agnostic Live Telemetry & Distance Pill (Top-Right)
- **Fields (`s.telemetry` or `s.tele`):**
  - Header: `day` (e.g. `'วันที่ 3 · ห้องควบคุม'` or `0` for baseline), `time` (`'03:00'`), `status` (`'SAFE' | 'WARN' | 'DANGER' | 'CRITICAL'`) or `lights: false`.
  - **Flexible Meter Bar (auto-detected by `drawTele`):**
    - Theme A Energy: `{ kcal: 90, kmax: 2400 }`
    - Theme B Freeze / Oxygen: `{ temp: 35.4 }` or `{ oxygen: 28 }`
    - Theme C Stealth / Sound: `{ db: 68 }`
    - Maritime / Flood: `{ tide: -4.8 }`
    - Custom Metric: `{ bar: { label: 'แบตเตอรี่', value: 18, max: 100, unit: '%', color: '#EF4444', warn: true } }`
  - **Proximity Pill:** `distance: '4 ม.'` or `dist: [40, 2]` (animated countdown) + optional `distLabel: 'ระยะห่าง'`.

### Archetype 3: Inventory Audit Card (`● ของที่มี · INVENTORY`)
- **Fields:** `{ type: 'inventory', at, pos: 'tr', items: [{ icon: '🔦', name: '...', qty: '1 ชิ้น' }, ...] }` (staggered item reveal).

### Archetype 4: Cursed Item / Anomaly Comparison Cards
- Drawn directly in `views.js` for story-specific inspection beats (e.g., 3 food items with calendar paradoxes, thermometer readings, or analog logbook entries), paired with a Rule or Anomaly card (`type: 'anomaly'`, `glyph: '🔎'`).

### Archetype 5: Calculated Survival Math Card (`type: 'math'` / `'calc'`)
- **Fields:** `{ type: 'math', at, pos: 'r', badge: '● คำนวณ...', rows: [[label, val], ...], total: [label, val], note: [...] }`
- Place left-side diagrams in `window.NO_BLUR_VIEWS` so `rackBlur` does not obscure the graphic behind the card.

### Archetype 6: Branching Decision / Dilemma Flowchart (`type: 'dilemma'` / `'flow'`)
- **Fields:** `{ type: 'dilemma', at, head: '...', optA: { title, icon, res, en, danger: true }, optB: { title, icon, res, en, danger: false } }`
- Centered at `cx = 480` so the top-right Telemetry box stays unobstructed.

### Archetype 7: Chapter Title Banner (`s.chapter`)
- **Fields:** `['องก์ที่ 1 · ACT I', 'ชื่อตอน...']` or `{ label, title }`.

---

## 4. Complete `core.js` Reference API

See [`templates/core.js`](../templates/core.js) for the full production implementation:

1. **2-Segment FK Poses:** `poseWalk(t, speed, amp)` (with `Math.max(0, ...)` clamped knees), `poseStand(t, o)`, `poseKneel(t, o)`, `poseSit(t, o)`, `poseClimb(t, speed)`.
2. **Protagonist Rig (`drawPerson(c, x, y, s, o)`):**
   - `1:6.5` ratio (`hipY = -92 + by`, `torsoH = 64`, legs `45 + 45`, arms `32 + 30`), continuous trapezius collar slope, capsule head (`52x62`), symmetrical `[-10, 10]` eyes with `1px` catchlight, periodic blinking, under-eye fatigue bags.
   - Options: `colors` (`{ shirt, shirtHi, shirtSh, pants, pantsSh }` — customize per story protagonist!), `thin`, `dir`, `back`, `profile`, `expr` (`'neutral' | 'focus' | 'fear' | 'shock' | 'squint' | 'tired' | 'relief'`), `sweat`, `coldBreath` (Theme B), `shiver` (Theme B), `coverMouth` (Theme C), `tapeArm`, `bag`, `milk`, `flashlight`.
3. **Entity Rig (`drawEntity(c, x, y, s, o)` & `drawJanitor`):**
   - Enforces strict Z-index layering (`suitSh` far arm → prop → torso → `suitHi` near arm) so gripped props never render over the front forearm.
   - `drawEntity()` defaults to **no mop (`prop: 'none'`) and no cap (`cap: false`)** so every story's antagonist looks distinct (only `drawJanitor()` enables mop/cap by default). Configurable `suit`, `suitHi`, `suitSh`, `skin`, `cap`, `prop: 'none' | 'mop'`, `reveal`, `bloodSlits`, `eyeColor`.
4. **Macro POV Forearm (`hand(c, x, y, ang, s, o)`):**
   - Strictly `400px` long (`rr(c, -26, 0, 52, 400, 22)`) extending off the canvas edge (`y = 760..820`), supporting `sleeve`, `sleeveColor`, `watch`, `marker`, `tape`, `flashlight`, `knife`, `radio`.
   - Always pair writing/taping macro scenes with `ctx.clip()` synchronized to `penX`/`tapeX` for zero ghosting.
5. **Multi-Environment Stage Builders & Post-Processing:**
   - `outdoorStage(c, t, o)` (open horizon, parallax ridge/skyline, animated water waves), `roomCorner(c, o)` (2-point asymmetric interior walls/corner), `topDownRoom(c, o)` (bird's-eye architectural/tactical blueprint), `cctvOverlay(c, t, o)` (surveillance scanlines, viewfinder brackets, REC indicator), `corridor(c, t, o)` (1-pt 3D tunnel with `LIT`, `DARK`, `PK`, or custom palette; plain walls by default unless `mallShops: true`), `blurLayer(c, px, fn, extra)`, `flick(i, t, rate)`, `glow(c, x, y, r, col, a)`, `vignette(c, k, inner, col)`, `darken(c, a, col)`, `emergency(c, x, y, r, a)`, `frostOverlay(c, intensity, t)`, `grain(c, t, a)`.
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
