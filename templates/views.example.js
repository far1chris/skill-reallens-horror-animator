// =============================================================================
//  views.example.js — Multi-Environment & Multi-Camera Reference Catalog
//  Part of skill: reallens-horror-animator
//
//  ⚠️ ANTI-TEMPLATE RULE FOR AGENTS:
//  Do NOT copy-paste these 4 example views or their exact (x, y, scale) coordinates
//  into your episode! Every story must design its own bespoke camera grammar,
//  character outfit (`colors`), and setting-native geometry using the 5 spatial
//  stage builders in `core.js`:
//    - `outdoorStage(c, t, o)`  : Open exterior / water / horizon / silhouette
//    - `roomCorner(c, o)`       : 2-point asymmetric interior corner room
//    - `topDownRoom(c, o)`      : Bird's-eye architectural / tactical map
//    - `cctvOverlay(c, t, o)`   : Security monitor / peephole / lens frame
//    - `corridor(c, t, o)`      : 1-point perspective tunnel (vary vx, vy, camH!)
// =============================================================================
const VIEWS = (window.VIEWS = window.VIEWS || {});

// Views where left-side diagrams/props should remain sharp behind right-side HUD cards
window.NO_BLUR_VIEWS = ['macro_notebook_calc', 'tactical_blueprint_scan'];

// Example A: 2-Point Interior Corner + CCTV Monitor Framing (Instead of generic corridor!)
VIEWS.platform_corridor = function (c, lt, s) {
  roomCorner(c, { cornerX: 460, topY: 85, botY: 540, wallL: '#1B2434', wallR: '#141C2B', floor: '#202938' });

  // Setting-native industrial bulkhead door & warning beacon on right wall
  c.fillStyle = '#283449'; rr(c, 680, 170, 190, 360, 6); c.fill();
  c.fillStyle = '#0F172A'; rr(c, 710, 210, 130, 90, 4); c.fill();
  glow(c, 775, 145, 160, '#EF4444', 0.35 + 0.15 * Math.sin(lt * 5));

  drawPerson(c, 340, 610, 1.12, {
    t: lt,
    colors: { shirt: '#475569', shirtHi: '#64748B', shirtSh: '#334155' },
    pose: poseWalk(lt, 1.1, 0.32),
    expr: 'focus',
    flashlight: true
  });
  cctvOverlay(c, lt, { camLabel: 'CAM 04 · SECTOR B3' });
  vignette(c, 0.72, 0.45);
};

// Example B: Open Exterior / Maritime Low-Angle Horizon (`outdoorStage`)
VIEWS.ots_entity_approach = function (c, lt, s) {
  outdoorStage(c, lt, {
    skyTop: '#0B1324', skyBot: '#1D2B44', groundCol: '#132033',
    horizonY: 430, water: true, ridgeH: 55
  });

  // Pier / Deck foreground railing
  c.fillStyle = '#273244'; c.fillRect(0, 520, W, 200);
  glow(c, 880, 260, 320, '#38BDF8', 0.22);

  // Distant silhouette figure approaching across the pier
  const approach = prog(lt, 0, s.dur || 6);
  const ex = lerp(980, 720, approach);
  drawEntity(c, ex, 535, lerp(0.68, 0.98, approach), {
    t: lt, dark: true, prop: 'none', cap: false, reveal: 0.9, bloodSlits: false, eyeColor: '#EF4444'
  });

  // Foreground Over-the-Shoulder (OTS) Protagonist
  drawPerson(c, 220, 850, 1.8, {
    t: lt, back: true, dir: 1,
    colors: { shirt: '#475569', shirtHi: '#64748B', shirtSh: '#334155' },
    pose: poseStand(lt, { lean: 0.06 })
  });
  vignette(c, 0.76, 0.42, '#090D16');
};

// Example C: Macro First-Person POV (`hand()` 400px + synchronized `ctx.clip()`)
VIEWS.macro_notebook_calc = function (c, lt, s) {
  const desk = c.createLinearGradient(0, 0, 0, H);
  desk.addColorStop(0, '#3B281B'); desk.addColorStop(1, '#261810');
  c.fillStyle = desk; c.fillRect(0, 0, W, H);
  glow(c, 360, 260, 360, '#F59E0B', 0.22);

  // Open logbook on left half (kept crisp via NO_BLUR_VIEWS)
  c.fillStyle = '#F5EFE6'; rr(c, 90, 140, 460, 420, 12); c.fill();
  c.strokeStyle = '#CBD5E1'; c.lineWidth = 1.5;
  for (let y = 200; y <= 500; y += 36) {
    c.beginPath(); c.moveTo(120, y); c.lineTo(520, y); c.stroke();
  }

  // Synchronized ctx.clip() progressive reveal tied strictly to hand/marker position
  const wr = prog(lt, 0.5, 3.2);
  const penX = lerp(160, 430, clamp(wr));
  if (wr > 0) {
    c.save();
    c.beginPath();
    c.rect(120, 180, Math.max(0, penX - 120), 320);
    c.clip();
    txt(c, '17:00 x 7 = 02:02 น.', 135, 255, 28, '#1C1917', 700);
    txt(c, 'EXIT WINDOW: 30s', 135, 325, 24, '#B91C1C', 700);
    c.restore();
  }

  // 400px Macro POV forearm extending from bottom canvas edge
  hand(c, penX + 45, 760 - clamp(wr) * 140, -0.35, 1.0, {
    sleeve: true, sleeveColor: '#475569', marker: '#B91C1C', watch: '01:45'
  });
  vignette(c, 0.65, 0.5);
};

// Example D: Top-Down Tactical / Architectural Evasion View (`topDownRoom`)
VIEWS.dilemma_booth = function (c, lt, s) {
  const rm = topDownRoom(c, { x: 80, y: 110, w: 520, h: 490, floor: '#172133', wallCol: '#475569' });

  // Sound wave / hazard radius pulsing from corridor door
  const pulseR = 60 + ((lt * 55) % 180);
  c.strokeStyle = 'rgba(239,68,68,0.45)'; c.lineWidth = 2.5;
  c.beginPath(); c.arc(rm.rx + rm.rw, rm.ry + 240, pulseR, Math.PI * 0.5, Math.PI * 1.5); c.stroke();

  // Protagonist crouched in corner
  drawPerson(c, 1020, 620, 1.15, {
    t: lt, dir: -1, profile: true, expr: 'fear', sweat: true,
    colors: { shirt: '#475569', shirtHi: '#64748B', shirtSh: '#334155' },
    pose: poseKneel(lt)
  });
  emergency(c, 640, 220, 500, 0.22 + 0.12 * Math.sin(lt * 8));
  vignette(c, 0.78, 0.42);
};
