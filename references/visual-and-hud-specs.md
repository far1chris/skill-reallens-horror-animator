# Visual & HUD Specifications (@real_lens1 Style)

This reference defines the exact color tokens, typography, HUD card layouts, environmental shaders, and camera effects used in **Real Lens** 2.5D geometric horror & calculated survival animations.

---

## 1. Color Palette Tokens

| Element | Hex / RGBA | Usage |
| :--- | :--- | :--- |
| **Night Sky Deep** | `#070B14` → `#121B2E` | Primary background gradient for urban legend / blackout night scenes |
| **Polar Vortex / Freeze** | `#050811` → `#1E293B` (Ice: `#38BDF8`) | Extreme sub-zero disaster backdrop & frost border highlights |
| **Backrooms Fluorescent** | `#2A2614` → `#14120A` (Tube: `#FEF08A`) | Liminal mall corridors & flickering neon ceiling grids |
| **Streetlight / Flashlight Cone** | `rgba(254, 240, 138, 0.25)` / `rgba(210, 230, 255, 0.18)` | Volumetric beam trapezoids from lamps or protagonist's flashlight |
| **HUD Card Surface** | `#F5EFE6` (Dark variant: `#0F172A` @ 90%) | Warm cream surface for in-scene rule/math cards; dark slate for Shorts HUD |
| **HUD Card Border** | `#D6CFC2` (Ice variant: `#38BDF8` @ 45%) | 1.5px–3px crisp border around HUD cards |
| **HUD Badge Pill** | `#18181B` / `#0284C7` | Dark charcoal or ice-blue pill header inside HUD cards |
| **HUD Accent Red** | `#DC2626` / `#B91C1C` | Danger text, lethal branch, CO hazard, thumbnail headline red |
| **Protagonist Skin** | `#D99B66` (Shadow: `#B87B48`) | Warm cylindrical gradient on head/hands (add `#E17070` cheek flush in `-40°C`) |
| **Entity / Pale Skin** | `#E5E7EB` (Shadow: `#CBD5E1`) | Bloodless cylindrical gradient for ghosts or faceless janitors |
| **Crimson Mouth** | `#4C0519` (Teeth: `#F8FAFC`) | Slit-mouth reveal interior & jagged triangle teeth |
| **Amulet Ochre BG** | `#85681A` → `#42330B` | Radial golden-brown backdrop for the 5-knot charm shot |

---

## 2. HUD Card Archetypes (Canvas / CSS Blueprints)

Whenever a HUD card enters the frame:
- **Camera Transition:** Over `0.25s`, ease background blur from `blur(2px)` to `blur(12px)` and darken background exposure by `25%`.
- **Card Entrance:** Pop-scale from `scale(0.92)` to `scale(1.0)` with cubic-bezier easing (`0.22, 1, 0.36, 1`) accompanied by a crisp UI `pop` chime.

### Archetype A: Single Rule / Info Card (`กฎข้อ 1` – `กฎข้อ 5`)
- **Position:** Top-left (`x: 80, y: 70` on `1920x1080`) or centered (`x: 660, y: 200`).
- **Structure:**
  ```text
  ┌──────────────────────────────────────────────────────┐
  │  [ ⚠️ กฎข้อ 1 ]                                       │
  │                                                      │
  │     ห้ามจุดเตาถ่านผิงไฟในห้องที่ปิดมิดชิดเด็ดขาด         │
  │  ──────────────────────────────────────────────────  │
  │     RULE 1 · NEVER BURN CHARCOAL IN A SEALED ROOM    │
  └──────────────────────────────────────────────────────┘
  ```

### Archetype B: Bilingual Etymology / UI Anomaly Card
- **Use case:** Explaining a Japanese kanji pun on a delivery app, a strange expiration date on Backrooms food, or an emergency AMOC collapse alert on a smartphone.
- **Structure:**
  ```text
  ┌──────────────────────────────────────────┐
  │  [ ● แจ้งเตือนฉุกเฉิน · EMERGENCY ALERT ]  │
  │   📱  AMOC COLLAPSE DETECTED             │
  │       อุณหภูมิดิ่งลง -40°C ใน 48 ชั่วโมง   │
  └──────────────────────────────────────────┘
  ```

### Archetype C: Branching Survival Flowchart
- **Use case:** Showing why instinctive choices kill you before revealing the clever survival rule.
- **Structure:**
  - Top Header Pill: `"กระจกบานเกล็ดชั้นล่างแตกที่ -40°C"` (or `"ฉันสวยไหม"`)
  - Two curved connector lines branching into two cards:
    - **Left Branch (Lethal):** Red icon/text (`ลงไปซ่อมชั้นล่าง` → `เสียความร้อนเฉียบพลัน / แข็งตาย`)
    - **Right Branch (Survival):** Green/Ice icon/text (`สละชั้นล่างทันที` → `เอาผ้าชุบน้ำอุดร่องประตูให้แข็งเป็นน้ำแข็งซีลอากาศ`)

### Archetype D: Calculated Survival Math / Physics Comparison Card
- **Use case:** Quantitative survival breakdowns (thermodynamics, room volume, calorie burn, structural timing).
- **Structure:**
  ```text
  ┌──────────────────────────────────────────────────────────┐
  │  [ 📐 คำนวณความร้อน · HEAT BUDGET (100W HUMAN BODY) ]    │
  │                                                          │
  │   ห้องนอนปกติ:  60 ลบ.ม.  ──►  เก็บความร้อนไม่อยู่ (-25°C) │
  │   กางเต็นท์โดม:  3 ลบ.ม.  ──►  ลดปริมาตร 20 เท่า (+10°C) │
  └──────────────────────────────────────────────────────────┘
  ```

### Archetype E: Live Telemetry Counter Pill
- **Position:** Top-right corner (`x: 1520, y: 60` on `1080p` / `x: 980, y: 36` on `720p`).
- **Examples:**
  - Temperature & Hour: `[ 🌡️ -40°C · ชม.ที่ 40 / 48 ]`
  - Calorie / Shift timer: `[ ⏱️ NEXT SHIFT: 01:12:00 · 1,640 kcal ]`
  - Distance / Item / Amulet: `[ ● ระยะห่าง: 18 ม. ]` or `[ ● ● ● ● ○ ×4 ]`

---

## 3. Environmental Shaders & Rig Micro-Animations

- **Cold Breath Vapor Puffs:** Spawn translucent white circles near mouth every `2.4s`, expanding radius (`4px` → `22px`), drifting upward while fading alpha (`0.45` → `0`).
- **Shivering & Hypothermia Jitter:** Offset torso/head X by `Math.sin(t * 42) * intensity` (`intensity = 0` above `10°C`, `1.5px` at `-15°C`, `3.0px` during shivering scenes).
- **Window Frost Creep:** Radial/corner ice-crystal polygons (`rgba(186, 230, 253, 0.35)`) growing inward along frame borders as temperature drops below `0°C`.
- **Fluorescent Flicker (Liminal / Blackout):** `const f = Math.sin(t * 19) * Math.sin(t * 43) > 0.78 ? 0.12 : 1.0;` applied to ceiling light alpha and floor reflection.

---

## 4. Burned-In Subtitle Typography Spec

- **Position:** Bottom center (`y: 665` on `1280x720` / `y: 960` on `1920x1080`).
- **Font Family:** `@fontsource/kanit` (`'Kanit'`, `'Prompt'`, or `'Leelawadee UI'`), Weight `700 (Bold)`.
- **Fill & Stroke:** Pure white `#FFFFFF` fill with `5px–6px` dark outer stroke (`#09090B`) and dark translucent pill backdrop (`rgba(6, 9, 17, 0.72)`), chunked to `<= 34` Thai characters per cue synced linearly to trimmed scene voiceover duration.
