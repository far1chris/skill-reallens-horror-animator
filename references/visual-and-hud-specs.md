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
