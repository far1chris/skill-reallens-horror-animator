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

## 5. Reference Implementation: Character Rigging, Walk Cycle & HUD Engine (`core.js`)

Copy the complete reference implementation below into `core.js` for 2-segment articulated legs (`thigh` + `calf` + `planted shoe`), hand socket object manipulation, macro POV hands, and auto-fitting Canvas HUD cards:

```javascript
// ============================================================================
// core.js - RealLens 2.5D Character Rigging, Walk Cycle & HUD Telemetry Engine
// ============================================================================

/**
 * 1. วาดตัวละครเต็มตัวพร้อมระบบก้าวเดิน 2 ท่อน (FK Legs) และ Hand Socket จับวัตถุ
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} opts
 */
function drawRealLensActor(ctx, opts = {}) {
  const {
    x = 500,
    y = 560,
    t = 0,
    scale = 1.0,
    facing = 1,               // 1 = หันขวา, -1 = หันซ้าย
    isEntity = false,         // false = ผู้รอดชีวิต, true = พนักงานไร้หน้า
    posture = 'walk',         // 'walk' | 'sneak' | 'idle_inspect' | 'crouch_hold' | 'hide_breath' | 'entity_mop'
    handAction = 'none',      // 'none' | 'carry_bag' | 'crouch_hold_item' | 'hand_to_face' | 'two_hand_mop'
    expr = 'calm'             // 'calm' | 'worried' | 'shock' | 'bleeding_eyes'
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);

  // --- คำนวณพารามิเตอร์จังหวะก้าวเดิน (Locomotion Kinematics) ---
  let freq = 5.2;
  let strideAmp = 0.42;
  let kneeAmp = 0.58;
  let torsoLean = 0.04;
  let headPitch = 0.02;
  let crouchOffsetY = 0;

  if (posture === 'sneak') {
    freq = 3.2;
    strideAmp = 0.28;
    kneeAmp = 0.65;
    torsoLean = 0.12;
    headPitch = 0.10;
  } else if (posture === 'idle_inspect' || posture === 'hide_breath') {
    freq = 1.5;
    strideAmp = 0.0;
    kneeAmp = 0.0;
    torsoLean = posture === 'idle_inspect' ? 0.06 : 0.02;
    headPitch = posture === 'idle_inspect' ? 0.14 : 0.0;
  } else if (posture === 'crouch_hold') {
    freq = 1.2;
    strideAmp = 0.0;
    kneeAmp = 0.0;
    torsoLean = 0.18;
    headPitch = 0.16;
    crouchOffsetY = 48;
  } else if (posture === 'entity_mop') {
    freq = 2.6;
    strideAmp = 0.24;
    kneeAmp = 0.35;
    torsoLean = 0.08;
    headPitch = 0.05;
  }

  const phase = t * freq;
  const pelvisBob = strideAmp > 0 ? -Math.abs(Math.sin(phase)) * 3.5 : Math.sin(t * 2) * 1.2;
  const hipX = 0;
  const hipY = -92 + pelvisBob + crouchOffsetY;

  // --- ฟังก์ชันย่อยวาดขา 2 ท่อน (ต้นขา + หน้าแข้ง + รองเท้า) ---
  function drawArticulatedLeg(legPhase, isNearLeg) {
    const thighLen = 46;
    const calfLen = 44;

    let thighAngle = 0;
    let kneeAngle = 0;

    if (posture === 'crouch_hold') {
      thighAngle = isNearLeg ? -0.95 : -0.82;
      kneeAngle = isNearLeg ? 1.55 : 1.42;
    } else if (strideAmp === 0) {
      thighAngle = isNearLeg ? -0.05 : 0.06;
      kneeAngle = 0.03;
    } else {
      thighAngle = Math.sin(legPhase) * strideAmp;
      // พับเข่าเฉพาะจังหวะยกเท้าพ้นพื้น (Asymmetric Knee Flexion)
      kneeAngle = Math.max(0, -Math.cos(legPhase)) * kneeAmp;
    }

    const kneeX = hipX - Math.sin(thighAngle) * thighLen;
    const kneeY = hipY + Math.cos(thighAngle) * thighLen;

    const totalCalfAngle = thighAngle - kneeAngle;
    const ankleX = kneeX - Math.sin(totalCalfAngle) * calfLen;
    const ankleY = kneeY + Math.cos(totalCalfAngle) * calfLen;

    // วาดกางเกง (ขาด้านในสีเข้มกว่าขาด้านนอก)
    ctx.strokeStyle = isNearLeg ? '#1E293B' : '#0F172A';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(ankleX, ankleY);
    ctx.stroke();

    // วาดรองเท้าขนานพื้น (Planted Shoe Damping)
    ctx.save();
    ctx.translate(ankleX, ankleY);
    const footAngle = Math.max(-0.18, Math.min(0.22, -totalCalfAngle * 0.35));
    ctx.rotate(footAngle);

    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.roundRect(-10, -4, 28, 12, [4, 8, 3, 3]);
    ctx.fill();

    // พื้นรองเท้าสีเทา
    ctx.fillStyle = '#475569';
    ctx.fillRect(-10, 5, 28, 3);
    ctx.restore();
  }

  // 1. วาดขาด้านหลัง (Far Leg)
  drawArticulatedLeg(phase + Math.PI, false);

  // --- คำนวณจุดหมุนลำตัวและไหล่ ---
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(torsoLean);

  const shoulderX = 2;
  const shoulderY = -58;

  // --- ฟังก์ชันย่อยวาดแขน 2 ท่อน และคืนค่าพิกัดข้อมือ (Hand Socket) ---
  function drawArticulatedArm(isNearArm) {
    const upperLen = 34;
    const lowerLen = 32;
    let shoulderAngle = 0;
    let elbowAngle = 0.25;

    const armPhase = isNearArm ? phase + Math.PI : phase;

    if (handAction === 'two_hand_mop') {
      shoulderAngle = isNearArm ? -0.58 : -0.78;
      elbowAngle = isNearArm ? 0.52 : 0.35;
    } else if (handAction === 'crouch_hold_item' && isNearArm) {
      shoulderAngle = -0.65;
      elbowAngle = 1.15;
    } else if (handAction === 'hand_to_face' && isNearArm) {
      shoulderAngle = -0.85;
      elbowAngle = 1.95;
    } else if (handAction === 'carry_bag' && isNearArm) {
      // แขนข้างที่หิ้วถุงแกว่งน้อยลงครึ่งหนึ่งเพื่อสื่อถึงน้ำหนักถุง
      shoulderAngle = Math.sin(armPhase) * (strideAmp * 0.45) - 0.08;
      elbowAngle = 0.38;
    } else {
      shoulderAngle = Math.sin(armPhase) * (strideAmp * 0.85);
      elbowAngle = 0.22 + Math.max(0, Math.sin(armPhase)) * 0.25;
    }

    const elbowX = shoulderX - Math.sin(shoulderAngle) * upperLen;
    const elbowY = shoulderY + Math.cos(shoulderAngle) * upperLen;

    const forearmAngle = shoulderAngle + elbowAngle;
    const handX = elbowX + Math.sin(forearmAngle) * lowerLen;
    const handY = elbowY + Math.cos(forearmAngle) * lowerLen;

    // เสื้อแขนยาว
    ctx.strokeStyle = isEntity
      ? (isNearArm ? '#334155' : '#1E293B')
      : (isNearArm ? '#3B4252' : '#2E3440');
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // ฝ่ามือ
    ctx.fillStyle = isEntity ? '#CBD5E1' : '#E2B897';
    ctx.beginPath();
    ctx.arc(handX, handY, 6, 0, Math.PI * 2);
    ctx.fill();

    return { handX, handY, forearmAngle };
  }

  // 2. วาดแขนด้านหลัง (Far Arm)
  const farHand = drawArticulatedArm(false);

  // 3. วาดลำตัวและกล้ามเนื้อบ่า (Trapezius & Torso)
  ctx.fillStyle = isEntity ? '#CBD5E1' : '#E2B897';
  ctx.beginPath();
  ctx.moveTo(-8, shoulderY - 14);
  ctx.lineTo(10, shoulderY - 14);
  ctx.lineTo(14, shoulderY + 4);
  ctx.lineTo(-12, shoulderY + 4);
  ctx.closePath();
  ctx.fill();

  // เสื้อฮู้ดผู้รอดชีวิต หรือ ชุดหมีพนักงานทำความสะอาด
  ctx.fillStyle = isEntity ? '#334155' : '#3B4252';
  ctx.beginPath();
  ctx.roundRect(-18, shoulderY - 4, 36, 66, [12, 12, 6, 6]);
  ctx.fill();

  // 4. วาดศีรษะและใบหน้า
  ctx.save();
  ctx.translate(2, shoulderY - 26);
  ctx.rotate(headPitch);

  // โครงหน้า
  ctx.fillStyle = isEntity ? '#E2E8F0' : '#E2B897';
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();

  if (!isEntity) {
    // ทรงผมสีดำเข้ม
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-2, -4, 20, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();

    // ถุงใต้ตาและดวงตา
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(8, 1, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(8, -2, expr === 'shock' ? 3.2 : 2.2, 0, Math.PI * 2);
    ctx.fill();

    // เลือดไหลจากตา (กรณี expr === 'bleeding_eyes')
    if (expr === 'bleeding_eyes') {
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(7, 1, 2.5, 10);
    }

    // คิ้วและปากตามอารมณ์
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (expr === 'worried' || expr === 'shock') {
      ctx.moveTo(3, -9);
      ctx.lineTo(12, -6);
    } else {
      ctx.moveTo(4, -7);
      ctx.lineTo(12, -7);
    }
    ctx.stroke();
  } else {
    // พนักงานไร้หน้า: มีเฉพาะรอยบุ๋มเงามืดจางๆ
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.beginPath();
    ctx.ellipse(7, -1, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore(); // จบส่วนศีรษะ

  ctx.restore(); // จบการหมุนลำตัว (กลับสู่พิกัดสะโพก)

  // 5. วาดขาด้านหน้า (Near Leg)
  drawArticulatedLeg(phase, true);

  // 6. วาดแขนด้านหน้า (Near Arm) และวัตถุในมือ (Hand Socket Props)
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(torsoLean);
  const nearHand = drawArticulatedArm(true);

  // --- วาดวัตถุที่ผูกกับพิกัดมือ (Full-Body Hand Sockets) ---
  if (handAction === 'carry_bag') {
    // ถุงพลาสติกสีขาวแกว่งแบบ Pendulum Lag
    const bagLag = Math.sin(phase - 0.6) * 0.18 - torsoLean;
    ctx.save();
    ctx.translate(nearHand.handX, nearHand.handY);
    ctx.rotate(bagLag);

    ctx.strokeStyle = 'rgba(241, 245, 249, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 8, 7, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
    ctx.beginPath();
    ctx.roundRect(-12, 8, 24, 28, 6);
    ctx.fill();
    ctx.restore();
  } else if (handAction === 'crouch_hold_item') {
    // ประคองกล่องนมสีฟ้า-ขาวในท่านั่งยอง
    ctx.save();
    ctx.translate(nearHand.handX + 4, nearHand.handY - 6);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-7, -12, 14, 22);
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(-7, -4, 14, 8);
    ctx.restore();
  } else if (handAction === 'two_hand_mop') {
    // ด้ามไม้ถูพื้นลากผ่านมือทั้งสองข้าง พร้อมถังน้ำสีเหลือง
    const angle = Math.atan2(
      nearHand.handY - farHand.handY + 28,
      nearHand.handX - farHand.handX + 26
    );
    ctx.save();
    ctx.translate(farHand.handX, farHand.handY);
    ctx.rotate(angle);

    ctx.strokeStyle = '#D4A373';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(95, 0);
    ctx.stroke();

    // หัวม็อบถูพื้น
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.roundRect(90, -10, 14, 20, 4);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * 2. วาดฉากโคลสอัพมือและท่อนแขน (Macro POV Hand & Forearm Rig)
 * ใช้สำหรับฉากแปะเทปกาวบนพื้น, เขียนตัวเลขด้วยปากกาเมจิก, และวาดแผนที่โซน
 */
function drawMacroHandRig(ctx, handX, handY, toolType = 'marker_pen', angle = 0.42) {
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(angle);

  // ท่อนแขนเสื้อฮู้ดและข้อมือ
  ctx.fillStyle = '#3B4252';
  ctx.beginPath();
  ctx.roundRect(-28, 35, 56, 140, 16);
  ctx.fill();

  // หลังมือและนิ้วมน 4 นิ้ว
  ctx.fillStyle = '#E2B897';
  ctx.beginPath();
  ctx.roundRect(-24, -18, 48, 58, 18);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(-21 + i * 11, -34, 9.5, 22, 5);
    ctx.fill();
  }

  // อุปกรณ์ในมือ
  if (toolType === 'marker_pen') {
    ctx.save();
    ctx.rotate(-0.35);
    ctx.fillStyle = '#09090B';
    ctx.fillRect(-6, -65, 12, 58);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-6, -50, 12, 8);
    ctx.restore();
  } else if (toolType === 'tape_roll') {
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, -32, 26, 0, Math.PI * 2);
    ctx.stroke();
  } else if (toolType === 'wooden_pencil') {
    ctx.save();
    ctx.rotate(-0.28);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-4, -70, 8, 62);
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.moveTo(-4, -70);
    ctx.lineTo(4, -70);
    ctx.lineTo(0, -82);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 3. วาดการ์ดข้อมูล HUD ปรับขนาดฟอนต์อัตโนมัติไม่ให้ล้นกรอบ (Auto-Fit HUD Card)
 */
function drawAutoFitHudCard(ctx, { x, y, w, h, title, value, subtext, accent = '#10B981' }) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();

  // แถบสีด้านซ้าย
  ctx.fillStyle = accent;
  ctx.fillRect(x, y + 10, 4, h - 20);

  // หัวข้อการ์ด
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 18px "Kanit", sans-serif';
  ctx.fillText(title, x + 18, y + 32);

  // ปรับขนาดฟอนต์ค่าหลักอัตโนมัติหากข้อความยาวเกินกรอบ
  let fontSize = 34;
  ctx.font = `700 ${fontSize}px "Kanit", monospace`;
  while (ctx.measureText(value).width > w - 36 && fontSize > 16) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px "Kanit", monospace`;
  }
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(value, x + 18, y + 74);

  if (subtext) {
    ctx.fillStyle = accent;
    ctx.font = '400 15px "Kanit", sans-serif';
    ctx.fillText(subtext, x + 18, y + h - 16);
  }
  ctx.restore();
}

if (typeof module !== 'undefined') {
  module.exports = { drawRealLensActor, drawMacroHandRig, drawAutoFitHudCard };
}
```
