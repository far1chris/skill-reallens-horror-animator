# Visual & HUD Specifications (@real_lens1 Style)

This reference defines the exact color tokens, typography, HUD card layouts, environmental shaders, camera effects, and Canvas blueprints used in **Real Lens** 2.5D geometric horror, liminal space survival, and calculated disaster survival animations.

---

## 1. Color Palette Tokens

| Element | Hex / RGBA | Usage |
| :--- | :--- | :--- |
| **Liminal Mall Fluorescent** | `#2A2614` → `#14120A` (Tube: `#FEF08A` @ 0.85) | Infinite mall corridors, sickly yellow ambient light & ceiling fixture grids |
| **Parking Lot Concrete B2** | `#1E293B` → `#0F172A` (Hazard: `#EAB308` / `#09090B`) | Underground parking lot, concrete pillars with 45° diagonal warning stripes |
| **Polar Vortex / Deep Freeze** | `#050811` → `#1E293B` (Ice: `#38BDF8`) | Sub-zero disaster backdrop, frost border creep & cold breath |
| **Night Sky / Blackout** | `#070B14` → `#020617` | Total power blackout corridor & dark horror vignette |
| **HUD Card Surface (Warm Cream)** | `#FAF7F2` (Shadow: `rgba(0,0,0,0.35)`) | Signature warm cream surface for in-scene rules, math, and clue cards |
| **HUD Card Border** | `#E2D9CC` / `#D6CFC2` (1.5px–2px) | Crisp subtle border separating cards from blurred background |
| **HUD Badge Pill (Danger Red)** | `#B91C1C` / `#C5221F` (Text: `#FFFFFF`) | Red pill header inside Rule Cards (`⚠️ กฎข้อ 1–5`) |
| **HUD Badge Pill (Neutral/Slate)**| `#18181B` / `#334155` (Text: `#FFFFFF`) | Dark charcoal pill header for Info, Pattern, or Clue cards |
| **Telemetry Container (Top-Right)**| `#18181B` / `rgba(24, 24, 27, 0.92)` | Dark rounded rectangle holding day, time, and remaining calories |
| **Distance Tracker Pill** | `#FFFFFF` with `#18181B` inner pill | White outer pill, charcoal inner badge, bold crimson distance text (`4 ม.`) |
| **Protagonist Skin ("ต้น")** | `#D49B66` (Shadow: `#C0824D`) | Warm cylindrical gradient on head, neck, and hands |
| **Under-Eye Fatigue Crescent** | `rgba(110, 48, 16, 0.32)` | Soft crescent shadow under eyes conveying exhaustion and dread |
| **Protagonist Shirt** | `#7DD3FC` & `#F8FAFC` alternating stripes | Light blue and white horizontal bands (or muted dark tee `#334155`) |
| **The Cleaner (Uniform & Cap)** | `#334155` (Cap: `#475569`, Pants: `#1E293B`)| Slate-grey service uniform and flat peaked cap |
| **The Cleaner (Face & Blood Slits)**| `#F1F5F9` → `#CBD5E1` (Blood: `#8B0000`) | Smooth white oval face with two vertical blood trails dripping from eye slits |
| **Cleaning Cart & Mop Bucket** | `#EAB308` / `#CA8A04` (Mop wood: `#D4A373`)| Vintage commercial yellow plastic mop bucket with squeezer lever |
| **Wet Tile Reflection Shine** | `rgba(255, 255, 255, 0.18)` | Reflective wet trail on dark floor tiles left behind by the entity's mop |
| **Emergency Exit Sign Neon** | `#22C55E` / `#16A34A` (Glow: `rgba(34, 197, 94, 0.4)`) | Glowing green exit sign `[ P - B2 ]` in distance |

---

## 2. Signature HUD Card Archetypes (Canvas Blueprints)

Whenever any HUD card enters the frame:
- **Camera Transition:** Over `0.25s`, ease background blur from `blur(2px)` to `blur(12px)` and darken background exposure by `25%`.
- **Card Entrance:** Pop-scale from `scale(0.92)` to `scale(1.0)` with cubic-bezier easing (`0.22, 1, 0.36, 1`) accompanied by a crisp UI `pop` chime.

### Archetype 1: Survival Rule Card (`⚠️ กฎข้อ 1` – `กฎข้อ 5`)
- **Position:** Top-left (`x: 80, y: 70` on `1920x1080`) or centered (`x: 640, y: 160`).
- **Canvas Blueprint:**
  ```text
  ┌────────────────────────────────────────────────────────────┐
  │  [ ⚠️ กฎข้อ 1 ]                                             │
  │                                                            │
  │     เมื่อไฟห้างดับ ห้ามวิ่ง                                      │
  │     และห้ามเหยียบพื้นที่เพิ่งถูกถูเด็ดขาด                        │
  │  ────────────────────────────────────────────────────────  │
  │     RULE 1 · WHEN THE LIGHTS GO OUT — DON'T STEP ON WET FLOOR│
  └────────────────────────────────────────────────────────────┘
  ```
- **Styling:**
  - Card: `w: 620, h: 220`, `border-radius: 20px`, fill `#FAF7F2`, border `2px solid #E2D9CC`.
  - Badge: `fill #B91C1C`, white text `Kanit 700 24px`.
  - Line 1 (Dark Slate): `#18181B`, `Kanit 800 36px`.
  - Line 2 (Danger Red): `#9E1B1B`, `Kanit 800 36px`.
  - Divider: `1px solid #D6CFC2`.
  - English Sub-caption: `#71717A`, `Kanit 600 16px`, letter-spacing `1.2px`.

---

### Archetype 2: Live Telemetry Container & Distance Tracker Pill (Top-Right)
- **Position:** Top-right (`x: 1460, y: 60` on `1920x1080`).
- **Structure:**
  ```text
  ┌──────────────────────────────────────────────┐
  │  • วันที่ 7 / 7 · ไฟดับ              03:00   │  <-- Dark Container (#18181B)
  │  พลังงานที่เหลือ: 90 kcal                     │
  └──────────────────────────────────────────────┘
          ┌──────────────────────────────────────┐
          │  [ • ระยะห่าง ]                 4 ม. │  <-- Distance Pill (#FFFFFF)
          └──────────────────────────────────────┘
  ```
- **Styling:**
  - **Telemetry Box:** `w: 380, h: 105`, `border-radius: 16px`, fill `rgba(24, 24, 27, 0.94)`.
    - Line 1: Red pulsating circle `•` (`#EF4444`), white text `วันที่ 7 / 7 · ไฟดับ` (`Kanit 600 20px`), right-aligned time `03:00` (`Kanit 800 34px`).
    - Line 2: Amber text `พลังงานที่เหลือ: 90 kcal` (`#FACC15`, `Kanit 600 18px`).
  - **Distance Pill:** Placed `16px` below telemetry box (`w: 300, h: 64` right-aligned), fill `#FFFFFF`, `border-radius: 32px`, subtle drop shadow.
    - Inner Badge: `x: 12, y: 10, w: 140, h: 44`, fill `#18181B`, `border-radius: 22px`, white text `• ระยะห่าง` (`Kanit 700 18px`).
    - Distance Number: Right-aligned bold crimson text `4 ม.` (`#DC2626`, `Kanit 900 32px`). Counts down in real-time (`40 ม.` → `32 ม.` → `22 ม.` → `6 ม.` → `4 ม.` → `2 ม.`).

---

### Archetype 3: Resource & Inventory Audit Card (`• ของที่มี · INVENTORY`)
- **Structure:**
  ```text
  ┌────────────────────────────────────────────────────────┐
  │  [ • ของที่มี · INVENTORY ]                            │
  │                                                        │
  │   🩹  เทปกาวผ้า                1 ม้วน                  │
  │   🖊️  ปากกาเมจิก                2 แท่ง (แดง/น้ำเงิน)     │
  │   💧  น้ำดื่ม                  0.3 ลิตร                │
  │   🍞  ขนมปัง                   500 kcal                │
  └────────────────────────────────────────────────────────┘
  ```
- **Use Case:** Used at `0:35` when protagonist realizes they are trapped in an anomalous space, conducting a systematic resource audit.

---

### Archetype 4: Cursed Item / Food Expiry Validation Card
- **Structure:** Displays 3 items side-by-side on screen:
  ```text
  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
  │  ขนมปังโฮลวีท     │  │  แครกเกอร์ผัก     │  │  ขนมปังลูกเกด     │
  │                   │  │                   │  │                   │
  │  EXP 12/11/2026   │  │  EXP 31/02/2026   │  │  EXP เมื่อคุณกิน  │
  └───────────────────┘  └───────────────────┘  └───────────────────┘
     [ ✅ วันที่จริง ]       [ ❌ วันที่ไม่มีจริง ]     [ ⚠️ หลอนประสาท ]
  ```
- **Styling:**
  - Card 1 (Valid): Warm yellow card, green expiry badge (`#15803D`).
  - Card 2 (Anomaly): Greenish card, red expiry badge (`#B91C1C`) highlighting calendar paradox (February 31).
  - Card 3 (Cursed): Purple card, dark purple badge (`#6B21A8`) with horror condition (`"EXP เมื่อคุณกิน"`).
  - Narrator warns: *"ผมลองกัดห่อที่เป็นวันที่ไม่มีจริงไปคำเดียว... แล้วจำชื่อแม่ตัวเองไม่ได้"*.

---

### Archetype 5: Calculated Survival Math Card (`• คำนวณแคลอรี · CALORIES`)
- **Structure:**
  ```text
  ┌────────────────────────────────────────────────────────────┐
  │  [ • คำนวณแคลอรี · CALORIES ]                              │
  │                                                            │
  │   ขนมปัง 8 ห่อ × 200 kcal      =  1,600 kcal               │
  │   ถั่ว 4 ถุง × 520 kcal        =  2,080 kcal               │
  │   นมกล่อง 8 กล่อง × 130 kcal   =  1,040 kcal               │
  │  ────────────────────────────────────────────────────────  │
  │   รวมที่กินได้                 =  4,800 kcal               │
  │                                                            │
  │   • ถ้าเดิน 20 กม./วัน = เผา 2,400 kcal  ──►  อยู่ได้แค่ 2 วัน │
  │   • ถ้าพักผ่อนนิ่ง     = เผา 690 kcal    ──►  อยู่รอดได้ 7 วัน! │
  └────────────────────────────────────────────────────────────┘
  ```

---

### Archetype 6: Spatial Rotation Pattern & Modulo Exit Formula Card
- **Structure:**
  - **Left Graphic:** Circular dial map of the mall divided into 12 sectors (A, B, C, D, E, F, G, H, J, K, L, P) with central Food Court / Fountain hub.
  - **Right HUD Card:**
    ```text
    ┌────────────────────────────────────────────────────────────┐
    │  [ • คำนวณหาทางออก · EXIT (MOD 12) ]                       │
    │                                                            │
    │   ทุก 6 ชม. ทุกโซนเลื่อน:     +5 ช่อง ตามเข็มนาฬิกา          │
    │   โซน P (ลานจอด) ตอนนี้:     ช่อง 9                        │
    │   สูตรหมุนรอบถัดไป:          (9 + 5) = 14 ≡ 2 (mod 12)    │
    │   ช่อง 4 (ติดฟู้ดคอร์ท/ทางออก): วันที่ 7 เวลา 18:00 น.      │
    │  ────────────────────────────────────────────────────────  │
    │   ⚠️ ถ้าพลาดรอบนี้: ต้องรออีก 12 รอบ = 72 ชม. (อดอาหารตาย) │
    └────────────────────────────────────────────────────────────┘
    ```

---

### Archetype 7: Branching Decision / Dilemma Flowchart
- **Use Case:** Crisis at 17:58 when lights fail 2 minutes before the exit gate window.
- **Structure:**
  - Top Pill: `17:58 · ไฟดับก่อนเวลา (เหลือ 2 นาที)`
  - Two curved branches pointing to cards:
    - **Branch A (Starvation):** Icon `⏳`, Title: `รอไฟติด` → Consequence: `ทางออกเลื่อนหาย (ต้องรออีก 72 ชม.)`.
    - **Branch B (Survival Rule):** Icon `🧹`, Title: `เดินฝ่าความมืด` → Consequence: `ต้องผ่านมันไปให้ได้ (ห้ามวิ่ง + ห้ามเหยียบพื้นเปียก)`.

---

### Archetype 8: Physical Artifact & Handwriting Anomaly Card
- **Structure:**
  - Macro zoom card on duct tape artifact:
    ```text
    ┌────────────────────────────────────────────────────────────┐
    │  [ • ลายมือปริศนา · HANDWRITING ]                          │
    │   ข้อความบนเทป: "วันที่ 8"                                   │
    │   ลายมือตรงกับของผม ทุกตัวอักษร...                            │
    │   แต่ผมติดอยู่ข้างในนั้นแค่ "7 วัน"                            │
    └────────────────────────────────────────────────────────────┘
    ```

---

## 3. Environmental Shaders & Rig Micro-Animations

- **Wet Floor Mop Trail:** Floor tile polygon rendered with dynamic linear gradient `rgba(255,255,255,0.22)` to `transparent`, matching the path of The Cleaner's mop.
- **Fluorescent Flicker / Blackout Wave:**
  ```javascript
  // Lights shutting down row by row
  const rowDelay = rowIndex * 0.18;
  const isOff = localT > blackoutStart + rowDelay;
  const lightAlpha = isOff ? 0.04 : (0.85 + Math.sin(t * 30 + rowIndex) * 0.08);
  ```
- **Heartbeat Camera Pulse:** When distance `< 10m`, apply camera scale pulse `1.0 + Math.sin(t * 14) * 0.025` and radial edge vignette crimson pulse `rgba(139, 0, 0, 0.25)`.
- **Character Exhaustion Jitter:** Subtle torso Y-offset breathing heave `Math.sin(t * 3) * 1.5px` and under-eye dark crescent opacity increasing from `0.2` on Day 1 to `0.45` on Day 7.

---

## 4. Burned-In Subtitle Typography Spec

- **Position:** Bottom center (`y: 960` on `1920x1080` / `y: 650` on `1280x720`).
- **Font Family:** `'Kanit'`, `'Prompt'`, or `'Leelawadee UI'`, Weight `700 (Bold)`.
- **Styling:** Pure white `#FFFFFF` fill with `6px` black outer stroke (`#09090B`), subtle dark shadow (`rgba(0,0,0,0.85)` blur `8px`), chunked to `<= 36` Thai characters per cue synchronized to the speech narration.

---

## 5. Reference Implementation: Authentic Real Lens 2.5D Engine (`core.js` — `8DT1Q3NAgaA` Standard)

Copy the authentic reference implementation below into `core.js`. This is the exact production engine from `backrooms-mall-7days` (`https://www.youtube.com/watch?v=8DT1Q3NAgaA`) featuring:
1. **`drawPerson` & `drawJanitor`**: Cylindrical 2.5D shading (`cyl()`), capsule head (`52x62px`, `border-radius: 22`), natural blinking eyes with `1px` white catchlight, under-eye fatigue bags, 2-segment FK legs (`poseWalk`, `poseStand`, `poseKneel`, `poseSit`), and hand-socket props.
2. **`corridor(c, t, o)`**: 3D 1-point perspective projection (`P = (X, Y, z) => [vx + f * X / z, vy + f * (camH - Y) / z]`) with exponential distance fog (`fogK = z => 1 - Math.exp(-z / fogD)`), flickering fluorescent panels/lanterns (`flick()`), and specular floor/water reflections.
3. **`blurLayer(c, px, fn, extra)`**: Offscreen Gaussian blur buffer used both for depth-of-field background layers and automatic rack-focus when HUD cards pop in.
4. **`drawCard`, `drawFlow`, `drawTele`, `drawChapter`, `grain`, and frameless `drawSub`**.

```javascript
// =============================================================================
//  Real Lens style renderer core — helpers, 2.5D rigs, 3D perspective, HUD
//  Human Proportion Ratio 1:6.5 (Image 3 athletic build with continuous trapezius slope)
// =============================================================================
const W = 1280, H = 720, TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k = clamp(k), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const easeBack = k => { k = clamp(k); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
const FONT = "'Kanit','Leelawadee UI','Tahoma',sans-serif";

function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mix(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})`; }
function rgba(h, a) { const A = hex2rgb(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function cyl(c, x, w, base, hi, sh) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, base); g.addColorStop(0.35, hi); g.addColorStop(1, sh); return g;
}
function limb(c, x1, y1, x2, y2, w, col, sh) {
  c.lineCap = 'round';
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  if (sh) { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w * 0.28, ny = dx / L * w * 0.28;
    c.strokeStyle = sh; c.lineWidth = w * 0.38; c.beginPath(); c.moveTo(x1 + nx, y1 + ny); c.lineTo(x2 + nx, y2 + ny); c.stroke(); }
}
function txt(c, s, x, y, size, col, weight = 700, align = 'left', base = 'alphabetic') {
  c.font = `${weight} ${size}px ${FONT}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y);
}
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
// Draw into an offscreen buffer, then composite blurred (for rack-focus & depth of field)
const _tmp = document.createElement('canvas'); _tmp.width = W; _tmp.height = H; const _tc = _tmp.getContext('2d');
function blurLayer(c, px, fn, extra = '') {
  _tc.setTransform(1, 0, 0, 1, 0, 0); _tc.clearRect(0, 0, W, H); fn(_tc);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.filter = `blur(${px}px) ${extra}`; c.drawImage(_tmp, 0, 0); c.restore();
}
function flick(i, t, rate = 1) {
  const a = hash(i * 13.1 + Math.floor(t * 14 * rate));
  const bad = hash(i * 7.7) > 0.78;
  return bad ? (a > 0.55 ? 1 : a > 0.3 ? 0.35 : 0.08) : (a > 0.985 ? 0.4 : 1);
}

// ----------------------------------------------------------------- POSES
function poseWalk(t, speed = 1.6, amp = 0.42) {
  const p = t * TAU * speed * 0.5;
  return { by: -Math.abs(Math.sin(p)) * 3, lean: 0.03,
    legs: [{ a: amp * Math.sin(p), b: Math.max(0, -Math.sin(p + 0.9)) * 0.7 }, { a: -amp * Math.sin(p), b: Math.max(0, Math.sin(p + 0.9)) * 0.7 }],
    arms: [{ a: -amp * 0.8 * Math.sin(p), b: 0.25 }, { a: amp * 0.8 * Math.sin(p), b: 0.25 }], tilt: 0 };
}
function poseStand(t, o = {}) {
  const br = Math.sin(t * 2.2) * 1.2;
  return { by: br * 0.4, lean: o.lean || 0, legs: [{ a: 0.05, b: 0 }, { a: -0.05, b: 0 }],
    arms: o.arms || [{ a: 0.08, b: 0.1 }, { a: -0.08, b: 0.1 }], tilt: o.tilt || 0 };
}
function poseKneel(t, o = {}) {
  return { by: 37, lean: 0.35, legs: [{ a: 1.4, b: 1.4 }, { a: 0.1, b: 1.6 }],
    arms: o.arms || [{ a: 1.2, b: -0.3 }, { a: 0.9, b: -0.2 }], tilt: o.tilt || 0.2 };
}
function poseSit(t, o = {}) {
  return { by: 60, lean: -0.05, legs: [{ a: 1.25, b: 2.1 }, { a: 1.15, b: 2.0 }],
    arms: o.arms || [{ a: 0.9, b: 0.9 }, { a: 0.8, b: 1.0 }], tilt: o.tilt || 0 };
}

// --------------------------------------------------------- PROTAGONIST RIG
const TON = { skin: '#C98B5E', skinHi: '#D9A27A', skinSh: '#A66C44', shirt: '#9BBBD8', shirtHi: '#B4CEE6', shirtSh: '#7698B8', pants: '#2F3A4F', pantsSh: '#222A3A', shoe: '#1E1E22', hair: '#151518' };
function drawPerson(c, x, y, s, o = {}) {
  const P = o.pose || poseStand(o.t || 0), K = { ...TON, ...(o.colors || {}) };
  const thin = o.thin ? 0.84 : 1;
  c.save(); c.translate(x, y); c.scale(s * (o.dir || 1), s);
  if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(0, 0, 34, 6, 0, 0, TAU); c.fill(); }
  const by = P.by || 0, hipY = -92 + by, torsoH = 64;
  const leg = (hx, L, col, sh) => {
    const kx = hx + 45 * Math.sin(L.a), ky = hipY + 45 * Math.cos(L.a);
    const sa = L.a - L.b, ax = kx + 45 * Math.sin(sa), ay = ky + 45 * Math.cos(sa);
    limb(c, hx, hipY, kx, ky, 16 * thin, col, sh); limb(c, kx, ky, ax, ay, 14 * thin, col, sh);
    c.fillStyle = K.shoe; rr(c, ax - 6, ay - 5, 22, 9, 4); c.fill();
  };
  c.save(); c.rotate(P.lean || 0);
  const sh = (i) => [14 * thin * (i ? -1 : 1) * 0.3, -144 + by];
  const arm = (i, A, col) => {
    const [sx, sy] = sh(i);
    const ex = sx + 32 * Math.sin(A.a), ey = sy + 32 * Math.cos(A.a);
    const fa = A.a + A.b, wx = ex + 30 * Math.sin(fa), wy = ey + 30 * Math.cos(fa);
    limb(c, sx, sy, ex, ey, 13 * thin, col, K.shirtSh); limb(c, ex, ey, wx, wy, 11 * thin, K.skin, K.skinSh);
    c.fillStyle = K.skin; c.beginPath(); c.arc(wx, wy, 6.5, 0, TAU); c.fill();
    return [wx, wy];
  };
  c.restore();
  // back limbs
  leg(-6, P.legs[1], mix(K.pants, '#000000', 0.25), null);
  c.save(); c.rotate(P.lean || 0); arm(1, P.arms[1], mix(K.shirt, '#000000', 0.18)); c.restore();
  // torso (with trapezius collar slope)
  c.save(); c.rotate(P.lean || 0);
  c.fillStyle = cyl(c, -22 * thin, 44 * thin, K.shirt, K.shirtHi, K.shirtSh); rr(c, -22 * thin, -152 + by, 44 * thin, torsoH, 12); c.fill();
  c.fillStyle = K.pants; rr(c, -21 * thin, -98 + by, 42 * thin, 14, 5); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-7, -152 + by); c.lineTo(0, -142 + by); c.lineTo(7, -152 + by); c.stroke();
  c.fillStyle = K.skin; rr(c, -6, -162 + by, 12, 14, 3); c.fill();
  // head
  c.save(); c.translate(0, -190 + by); c.rotate(P.tilt || 0);
  c.fillStyle = cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh); rr(c, -26, -32, 52, 62, 22); c.fill();
  c.fillStyle = K.hair;
  rr(c, -28, -36, 56, 26, [22, 22, 6, 6]); c.fill();
  c.beginPath(); c.moveTo(-28, -16); c.lineTo(-28, 4); c.lineTo(-22, -12); c.fill();
  c.beginPath(); c.moveTo(-10, -12); c.lineTo(8, -12); c.lineTo(-4, -4); c.fill();
  const fx = o.profile ? 8 : 3, ex = o.expr || 'neutral';
  const eyeR = ex === 'shock' ? 4.2 : 3.3;
  c.strokeStyle = o.thin || ex === 'tired' ? 'rgba(70,30,20,0.45)' : 'rgba(70,30,20,0.22)'; c.lineWidth = 2;
  for (const sx of [-10, 10]) { c.beginPath(); c.arc(sx + fx, 2, 5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
  const blink = o.t != null && (o.t % 3.7) < 0.12;
  c.fillStyle = '#141414';
  for (const sx of [-10, 10]) {
    if (blink || ex === 'squint') { c.fillRect(sx + fx - 3.5, -4, 7, 2); continue; }
    c.beginPath(); c.arc(sx + fx, -3, eyeR, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(sx + fx + 1.2, -4.3, 1, 0, TAU); c.fill(); c.fillStyle = '#141414';
  }
  c.strokeStyle = '#141414'; c.lineWidth = 2.6; c.lineCap = 'round';
  const bi = ex === 'fear' || ex === 'shock' ? -3 : ex === 'focus' ? 3 : 0;
  c.beginPath(); c.moveTo(-15 + fx, -12); c.lineTo(-6 + fx, -12 + bi); c.stroke();
  c.beginPath(); c.moveTo(15 + fx, -12); c.lineTo(6 + fx, -12 + bi); c.stroke();
  c.lineWidth = 2.2;
  if (ex === 'shock' || ex === 'fear') { c.fillStyle = '#3a1210'; c.beginPath(); c.ellipse(fx, 15, 4, ex === 'shock' ? 5.5 : 3, 0, 0, TAU); c.fill(); }
  else { c.beginPath(); c.moveTo(fx - 5, 15); c.lineTo(fx + 5, 15); c.stroke(); }
  if (o.sweat) { c.fillStyle = '#BFE3FF'; c.beginPath(); c.ellipse(24, -6 + ((o.t || 0) * 20 % 18), 2.5, 4, 0, 0, TAU); c.fill(); }
  c.restore();
  c.restore();
  // front limbs
  leg(6, P.legs[0], K.pants, K.pantsSh);
  c.save(); c.rotate(P.lean || 0); const front = arm(0, P.arms[0], K.shirt);
  if (o.bag) { c.fillStyle = '#EDEDE8'; c.beginPath(); c.moveTo(front[0] - 4, front[1]); c.lineTo(front[0] - 16, front[1] + 46); c.lineTo(front[0] + 16, front[1] + 46); c.lineTo(front[0] + 6, front[1]); c.fill(); }
  if (o.milk) { c.fillStyle = '#F2F2F2'; rr(c, front[0] - 7, front[1] - 20, 14, 22, 2); c.fill(); }
  c.restore();
  c.restore();
}

// --------------------------------------------------------- ENTITY RIG (Correct Z-Index Order: Far Arm -> Prop -> Front Arm)
function drawJanitor(c, x, y, s, o = {}) {
  const t = o.t || 0, P = o.pose || poseWalk(t, 0.8, 0.22);
  const suit = o.dark ? '#3F4652' : '#5E6672', suitSh = o.dark ? '#2A3039' : '#454C57';
  c.save(); c.translate(x, y); c.scale(s * (o.dir || 1), s * 1.14);
  if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 0, 40, 7, 0, 0, TAU); c.fill(); }
  const by = P.by || 0, hipY = -96 + by;
  const leg = (hx, L, col) => {
    const kx = hx + 46 * Math.sin(L.a), ky = hipY + 46 * Math.cos(L.a), sa = L.a - L.b, ax = kx + 46 * Math.sin(sa), ay = ky + 46 * Math.cos(sa);
    limb(c, hx, hipY, kx, ky, 17, col, suitSh); limb(c, kx, ky, ax, ay, 15, col, suitSh);
    c.fillStyle = '#121214'; rr(c, ax - 8, ay - 7, 26, 11, 4); c.fill();
  };
  leg(-6, P.legs[1], suitSh);
  // 1. Far arm (suitSh)
  limb(c, 10, -158 + by, 20, -132, 13, suit, suitSh); limb(c, 20, -132, 22, -148, 11, '#CFD3D8');
  // 2. Prop / Tool held by both hands (drawn BEFORE front arm suitHi so near hand occludes shaft!)
  if (o.mop !== false) {
    const sw = Math.sin(t * 2.0) * 8;
    c.strokeStyle = '#7A5B3A'; c.lineWidth = 5.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(18, -150); c.lineTo(62 + sw, 8); c.stroke();
  }
  const suitHi = o.dark ? '#4D5562' : '#737C89';
  c.fillStyle = cyl(c, -24, 48, suit, suitHi, suitSh); rr(c, -24, -168 + by, 48, 80, 12); c.fill();
  leg(6, P.legs[0], suit);
  // 3. Front arm (suitHi)
  limb(c, -6, -158 + by, 4, -128, 13, suitHi, suitSh); limb(c, 4, -128, 18, -142, 11, '#DADDE1');
  c.fillStyle = '#CFD3D8'; rr(c, -5, -178 + by, 12, 14, 3); c.fill();
  c.save(); c.translate(0, -206 + by); c.rotate(o.tilt || 0);
  c.fillStyle = cyl(c, -25, 50, '#DEE1E5', '#F1F3F5', '#B8BEC6'); rr(c, -25, -30, 50, 60, 22); c.fill();
  c.fillStyle = '#353B45'; rr(c, -27, -36, 54, 18, [20, 20, 3, 3]); c.fill(); rr(c, 4, -22, 30, 6, 3); c.fill();
  const rv = o.reveal !== undefined ? o.reveal : 0.85;
  if (rv > 0) {
    c.globalAlpha = rv;
    c.fillStyle = '#0B0B0D'; c.beginPath(); c.ellipse(-8, 0, 5, 8 * rv, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(10, 0, 5, 8 * rv, 0, 0, TAU); c.fill();
    c.strokeStyle = '#6B0F1A'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-8, 8); c.lineTo(-8, 8 + 14 * rv); c.moveTo(10, 8); c.lineTo(10, 8 + 10 * rv); c.stroke();
    c.globalAlpha = 1;
  }
  c.restore(); c.restore();
}

// --------------------------------------------------------- MACRO POV FOREARM (400px long — NEVER floating in mid-air!)
function hand(c, x, y, ang = 0, s = 1, o = {}) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = cyl(c, -26, 52, TON.skin, TON.skinHi, TON.skinSh);
  rr(c, -26, 0, 52, 400, 22); c.fill();
  rr(c, -32, -38, 64, 54, 20); c.fill();
  for (let i = 0; i < 4; i++) { rr(c, -28 + i * 15, -62, 12, 32, 6); c.fill(); }
  if (o.sleeve) { c.fillStyle = TON.shirt; rr(c, -30, 90, 60, 320, 14); c.fill(); }
  if (o.watch) {
    c.fillStyle = '#222'; c.fillRect(-29, 32, 58, 16);
    c.fillStyle = '#0D1B1E'; rr(c, -18, 26, 36, 28, 5); c.fill();
    txt(c, o.watch, 0, 45, 13, '#5EEAD4', 700, 'center');
  }
  if (o.marker) {
    c.save(); c.rotate(-0.5);
    c.fillStyle = '#18181B'; rr(c, -8, -110, 16, 80, 4); c.fill();
    c.fillStyle = o.marker; rr(c, -6, -124, 12, 18, 3); c.fill();
    c.restore();
  }
  c.restore();
}

// --------------------------------------------------------- SUBTITLES (FRAMELESS)
function drawSub(c, s, lt) {
  if (!s.subs) return;
  const cue = s.subs.find(q => lt >= q.t0 && lt < q.t1); if (!cue) return;
  const subY = (typeof window !== 'undefined' && window.SHORTS_MODE) ? 1420 : (H - 46);
  c.save(); c.font = `700 30px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.lineJoin = 'round'; c.lineWidth = 7; c.strokeStyle = 'rgba(9,9,11,0.92)'; c.strokeText(cue.text, W / 2, subY);
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText(cue.text, W / 2, subY); c.restore();
}
```

---

## 6. Story-Driven Camera Direction & Pre-Render All-Scene Audit Grid (`audit_all_scenes.js`)

### 6.1 Do Not Copy Story-Specific Scenes Across Unrelated Plots
The examples in Section 2 (Parking B2, Supermarket Expiry Cards, Mall Sector Modulo 12) illustrate how `backrooms-mall-7days` used the HUD system for a **shopping mall story**. When creating a video for a different story:
- **Keep the Visual Rendering Style (`core.js`):** Same `cyl()` shading, `drawPerson` `1:6.5` rig, `hand()` `400px` POV forearm, visible dark palettes (`#162030`–`#283040`), `blurLayer()` rack-focus, and Cream/Red/Charcoal HUD cards.
- **Invent Story-Native Camera Shots (`views.js`):** Every scene in `views.js` must depict the actual environment, surfaces, and camera angles of the user's story (e.g., wooden canal pier, old teak table, boat bow, bedroom window slats, forest trail, hospital ward, train compartment) rather than reusing mall tiles or mall props.

### 6.2 Mandatory Pre-Render All-Scene Audit Script (`audit_all_scenes.js`)
Before running `render_mp4.js`, always generate a single composite PNG grid of all scenes (`1..N`) and inspect it visually with `read_file` to verify that every scene has a distinct, well-lit composition and zero visual distortions:

```javascript
// Run from project root: node audit_all_scenes.js
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  const cols = 5, tw = 480, th = 270;
  const htmlPath = path.join(__dirname, 'index.html');
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => { if (window.__setHeadless) window.__setHeadless(); return document.fonts.ready; });

  const scenes = await page.evaluate(() => window.TIMELINE.scenes.map((s, i) => ({
    idx: i + 1, id: s.id, view: s.view, start: s.start, dur: s.dur
  })));

  const shots = [];
  for (const s of scenes) {
    const sampleT = s.start + Math.min(s.dur * 0.55, Math.max(1.2, s.dur - 0.8));
    await page.evaluate((t) => window.renderAtTime(t), sampleT);
    const b64 = await page.evaluate(() => document.getElementById('stage').toDataURL('image/png'));
    shots.push({ ...s, b64 });
  }

  const rows = Math.ceil(shots.length / cols);
  const gridPage = await browser.newPage();
  await gridPage.setViewport({ width: cols * tw, height: rows * (th + 34), deviceScaleFactor: 1 });
  const cells = shots.map(s => `
    <div style="width:${tw}px;height:${th + 34}px;background:#111;border:1px solid #333;box-sizing:border-box;font-family:sans-serif;">
      <div style="height:34px;line-height:34px;padding:0 10px;color:#fff;font-size:15px;font-weight:bold;background:#1e1e24;">
        #${s.idx} ${s.id} (${s.view})
      </div>
      <img src="${s.b64}" style="width:${tw}px;height:${th}px;display:block;" />
    </div>`).join('');
  await gridPage.setContent(`<html><body style="margin:0;display:flex;flex-wrap:wrap;background:#000;">${cells}</body></html>`);
  const outPath = path.join(__dirname, 'audit_all_scenes.png');
  await gridPage.screenshot({ path: outPath, fullPage: true });
  console.log('Saved all-scene audit grid to:', outPath);
  await browser.close();
})();
```
