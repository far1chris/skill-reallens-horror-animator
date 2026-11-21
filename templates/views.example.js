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

// Views kept intentionally sharp without soft focus
window.NO_BLUR_VIEWS = [];

// NOTE: Clean Cinematic Storytelling — NEVER draw infographic explainer boards,
// bulleted text slides, classroom/medical lecture charts, or red chapter pills in views.js!

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

// Example B: Open Exterior / Maritime Low-Angle Horizon (`outdoorStage` + Volumetric Spotlight Encounter)
VIEWS.ots_entity_approach = function (c, lt, s) {
  outdoorStage(c, lt, {
    skyTop: '#0B1324', skyBot: '#193242', groundCol: '#132033',
    horizonY: 420, water: true, ridgeH: 62
  });

  // Misty circular full moon (aspect-compensated for 16:9 + 9:16 SHORTS_MODE) + water shimmer
  c.save(); c.translate(640, 210);
  const _mrc = applyShortsRigComp(c);
  glow(c, 0, 0, 260, '#99F6E4', 0.24);
  c.fillStyle = 'rgba(226, 245, 240, 0.88)';
  c.beginPath(); c.arc(0, 0, 42, 0, TAU); c.fill();
  endShortsRigComp(_mrc); c.restore();
  c.fillStyle = 'rgba(153, 246, 228, 0.16)';
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.ellipse(640 + Math.sin(lt * 1.4 + i) * 14, 434 + i * 14, 84 - i * 9, 4, 0, 0, TAU); c.fill();
  }

  // Pier wooden decking & silhouette mooring bollards leading eye toward Entity
  c.fillStyle = '#1E293B'; c.fillRect(0, 505, W, 215);
  c.fillStyle = '#2A3649';
  for (let px = 310; px <= 970; px += 110) {
    c.fillRect(px - 8, 455, 16, 60);
    c.fillRect(px - 10, 452, 20, 10);
  }
  c.strokeStyle = '#334155'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(310, 474); c.lineTo(970, 474); c.stroke();

  // Eerie teal mist backlight + crimson threat glow around approaching Entity
  const approach = prog(lt, 0, s.dur || 6);
  const ex = lerp(700, 648, approach);
  const es = lerp(1.18, 1.48, approach);
  glow(c, ex, 340, 340, '#0D9488', 0.42);
  glow(c, ex, 355, 160, '#EF4444', 0.22 + 0.08 * Math.sin(lt * 6));

  // Towering menacing silhouette Entity centered near focal x=640 for impactful 16:9 + 9:16 covers
  drawEntity(c, ex, 535, es, {
    t: lt, dark: true, prop: 'none', cap: false, reveal: 0.96, bloodSlits: false, eyeColor: '#EF4444'
  });

  // Dramatic Over-the-Shoulder (OTS) Protagonist whose tactical flashlight beam hits Entity directly
  drawPerson(c, 465, 685, 1.52, {
    t: lt, back: true, dir: 1,
    colors: { shirt: '#475569', shirtHi: '#64748B', shirtSh: '#334155' },
    pose: poseStand(lt, { lean: 0.06, arms: [{ a: 1.15, b: 0.42 }, { a: -0.18, b: 0.2 }] }),
    flashlight: true
  });
  vignette(c, 0.72, 0.44, '#090D16');
};

// Example C: Macro First-Person POV (Physical object inspection via `hand()` + synchronized `ctx.clip()`)
VIEWS.macro_bloodstained_ticket = function (c, lt, s) {
  const desk = c.createLinearGradient(0, 0, 0, H);
  desk.addColorStop(0, '#1E293B'); desk.addColorStop(1, '#0F172A');
  c.fillStyle = desk; c.fillRect(0, 0, W, H);
  glow(c, 520, 320, 420, '#FEF08A', 0.16);

  // Physical old subway paper slip lying on steel desk under dim beam
  c.save(); c.translate(420, 220); c.rotate(-0.08);
  c.fillStyle = '#E7E0D3'; rr(c, 0, 0, 440, 230, 8); c.fill();
  c.fillStyle = '#B91C1C'; c.fillRect(0, 0, 440, 26);
  // Subtle crimson smear across ticket corner
  c.fillStyle = 'rgba(153, 27, 27, 0.35)';
  c.beginPath(); c.ellipse(355, 165, 58, 34, 0.3, 0, TAU); c.fill();
  txt(c, 'EXPRESS PASS · B3', 28, 72, 22, '#334155', 700);
  txt(c, '01:12 น.', 28, 162, 54, '#991B1B', 900);
  c.restore();

  // Flashlight sweep revealing the stamped time organically
  const reveal = prog(lt, 0.3, 2.4);
  const sweepX = lerp(420, 760, clamp(reveal));
  hand(c, sweepX, 635 - clamp(reveal) * 95, -0.34, 1.0, {
    sleeve: true, sleeveColor: '#334155', flashlight: true
  });
  vignette(c, 0.72, 0.45);
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
