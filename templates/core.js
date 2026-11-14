// =============================================================================
//  Real Lens (@real_lens1) Complete 2.5D Geometric Survival Horror Core Engine
//  Part of skill: reallens-horror-animator
//  Human Proportion Ratio 1:6.5 (Athletic build with continuous trapezius slope)
//  Includes:
//   - Math, color, blurLayer (DoF/rack-focus), deterministic flick()
//   - 2-Segment FK Poses (poseWalk, poseStand, poseKneel, poseSit, poseClimb)
//   - drawPerson() (1:6.5 rig, Theme B coldBreath/shiver, Theme C coverMouth)
//   - drawEntity() + drawJanitor() (Correct Z-Index: suitSh -> Prop -> suitHi)
//   - hand() 400px Macro POV Forearm (watch/marker/tape/flashlight/knife/radio)
//   - corridor() 3D 1-point perspective engine + frostOverlay() + vignette/grain
//   - Theme-agnostic HUD suite: drawCard (auto-fit), drawFlow, drawTele,
//     drawChapter, normalizeCard, and frameless 9:16-aware drawSub
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
const F_MONO = "'JetBrains Mono','Kanit',monospace";

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
  if (sh) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w * 0.28, ny = dx / L * w * 0.28;
    c.strokeStyle = sh; c.lineWidth = w * 0.38; c.beginPath(); c.moveTo(x1 + nx, y1 + ny); c.lineTo(x2 + nx, y2 + ny); c.stroke();
  }
}
function txt(c, s, x, y, size, col, weight = 700, align = 'left', base = 'alphabetic') {
  c.font = `${weight} ${size}px ${FONT}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y);
}
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

// Offscreen Gaussian blur buffer (depth-of-field & HUD rack-focus)
const _tmp = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (_tmp) { _tmp.width = W; _tmp.height = H; }
const _tc = _tmp ? _tmp.getContext('2d') : null;
function blurLayer(c, px, fn, extra = '') {
  if (!_tc) { fn(c); return; }
  _tc.setTransform(1, 0, 0, 1, 0, 0); _tc.clearRect(0, 0, W, H); fn(_tc);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.filter = `blur(${px}px) ${extra}`; c.drawImage(_tmp, 0, 0); c.restore();
}
function flick(i, t, rate = 1) {
  const a = hash(i * 13.1 + Math.floor(t * 14 * rate));
  const bad = hash(i * 7.7) > 0.78;
  return bad ? (a > 0.55 ? 1 : a > 0.3 ? 0.35 : 0.08) : (a > 0.985 ? 0.4 : 1);
}

// ----------------------------------------------------------------- POSES (2-Segment FK)
function poseWalk(t, speed = 1.6, amp = 0.42) {
  const p = t * TAU * speed * 0.5;
  return {
    by: -Math.abs(Math.sin(p)) * 3, lean: 0.03,
    legs: [
      { a: amp * Math.sin(p), b: Math.max(0, -Math.sin(p + 0.9)) * 0.7 },
      { a: -amp * Math.sin(p), b: Math.max(0, Math.sin(p + 0.9)) * 0.7 }
    ],
    arms: [
      { a: -amp * 0.8 * Math.sin(p), b: 0.25 },
      { a: amp * 0.8 * Math.sin(p), b: 0.25 }
    ],
    tilt: 0
  };
}
function poseStand(t, o = {}) {
  const br = Math.sin(t * 2.2) * 1.2;
  return {
    by: br * 0.4, lean: o.lean || 0,
    legs: o.legs || [{ a: 0.05, b: 0 }, { a: -0.05, b: 0 }],
    arms: o.arms || [{ a: 0.08, b: 0.1 }, { a: -0.08, b: 0.1 }],
    tilt: o.tilt || 0
  };
}
function poseKneel(t, o = {}) {
  return {
    by: 37, lean: 0.35,
    legs: [{ a: 1.4, b: 1.4 }, { a: 0.1, b: 1.6 }],
    arms: o.arms || [{ a: 1.2, b: -0.3 }, { a: 0.9, b: -0.2 }],
    tilt: o.tilt || 0.2
  };
}
function poseSit(t, o = {}) {
  return {
    by: 60, lean: o.lean !== undefined ? o.lean : -0.05,
    legs: o.legs || [{ a: 1.25, b: 2.1 }, { a: 1.15, b: 2.0 }],
    arms: o.arms || [{ a: 0.9, b: 0.9 }, { a: 0.8, b: 1.0 }],
    tilt: o.tilt || 0
  };
}
function poseClimb(t, speed = 1.4) {
  const p = t * TAU * speed * 0.5;
  return {
    by: Math.sin(p) * 5, lean: -0.14,
    legs: [
      { a: 0.55 + 0.35 * Math.sin(p), b: Math.max(0, 0.85 + 0.35 * Math.sin(p)) },
      { a: 0.55 - 0.35 * Math.sin(p), b: Math.max(0, 0.85 - 0.35 * Math.sin(p)) }
    ],
    arms: [
      { a: 2.4 + 0.3 * Math.sin(p), b: 0.4 },
      { a: 2.4 - 0.3 * Math.sin(p), b: 0.4 }
    ],
    tilt: -0.22
  };
}

// Semantic prop helpers
function drawOrganicRiceSack(c, x, y, s = 1) {
  // burlap contour with cinched gather and stitches
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#9A7B56'; rr(c, -14, -18, 28, 34, 10); c.fill();
  c.strokeStyle = '#6B5237'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -14); c.lineTo(8, -14); c.stroke();
  c.restore();
}
function drawTacticalFlashlight(c, x, y, s = 1, beamOn = false) {
  // knurl aluminum barrel & reflector bezel
  c.save(); c.translate(x, y); c.scale(s, s);
  if (beamOn) {
    const g = c.createLinearGradient(12, 0, 260, 0);
    g.addColorStop(0, 'rgba(254, 249, 195, 0.55)');
    g.addColorStop(1, 'rgba(254, 249, 195, 0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(12, -4); c.lineTo(260, -85); c.lineTo(260, 85); c.lineTo(12, 4); c.closePath(); c.fill();
  }
  c.fillStyle = '#27272A'; rr(c, -12, -4, 24, 8, 2); c.fill();
  c.fillStyle = '#FACC15'; c.fillRect(10, -4, 3, 8);
  c.restore();
}

// --------------------------------------------------------- PROTAGONIST RIG (1:6.5 Ratio)
const PROTAGONIST = {
  skin: '#C98B5E', skinHi: '#D9A27A', skinSh: '#A66C44',
  shirt: '#9BBBD8', shirtHi: '#B4CEE6', shirtSh: '#7698B8',
  pants: '#2F3A4F', pantsSh: '#222A3A', shoe: '#1E1E22', hair: '#151518'
};
const TON = PROTAGONIST;

function drawPerson(c, x, y, s, o = {}) {
  const P = o.pose || poseStand(o.t || 0), K = { ...PROTAGONIST, ...(o.colors || {}) };
  const thin = o.thin ? 0.84 : 1;
  const shiverX = o.shiver ? Math.sin((o.t || 0) * 42) * 1.6 : 0;
  c.save(); c.translate(x + shiverX, y); c.scale(s * (o.dir || 1), s);
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

  // Back limbs
  leg(-6, P.legs[1], mix(K.pants, '#000000', 0.25), null);
  c.save(); c.rotate(P.lean || 0); arm(1, P.arms[1], mix(K.shirt, '#000000', 0.18)); c.restore();

  // Torso (with continuous trapezius slope)
  c.save(); c.rotate(P.lean || 0);
  c.fillStyle = cyl(c, -22 * thin, 44 * thin, K.shirt, K.shirtHi, K.shirtSh); rr(c, -22 * thin, -152 + by, 44 * thin, torsoH, 12); c.fill();
  c.fillStyle = K.pants; rr(c, -21 * thin, -98 + by, 42 * thin, 14, 5); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-7, -152 + by); c.lineTo(0, -142 + by); c.lineTo(7, -152 + by); c.stroke();
  if (o.tapeArm) { c.fillStyle = '#C3C7CC'; for (let k = 0; k < 3; k++) { rr(c, -20 * thin, -140 + by + k * 14, 40 * thin, 7, 2); c.fill(); } }
  c.fillStyle = K.skin; rr(c, -6, -162 + by, 12, 14, 3); c.fill();

  // Head
  c.save(); c.translate(0, -190 + by); c.rotate(P.tilt || 0);
  c.fillStyle = cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh); rr(c, -26, -32, 52, 62, 22); c.fill();
  c.fillStyle = K.hair;
  if (o.back) {
    rr(c, -27, -35, 54, 54, [22, 22, 14, 14]); c.fill();
  } else {
    rr(c, -28, -36, 56, 26, [22, 22, 6, 6]); c.fill();
    c.beginPath(); c.moveTo(-28, -16); c.lineTo(-28, 4); c.lineTo(-22, -12); c.fill();
    c.beginPath(); c.moveTo(-10, -12); c.lineTo(8, -12); c.lineTo(-4, -4); c.fill();
    const fx = o.profile ? 8 : 3, ex = o.expr || 'neutral';
    const eyeR = ex === 'shock' ? 4.2 : 3.3;
    // Under-eye fatigue bags
    c.strokeStyle = o.thin || ex === 'tired' || ex === 'fear' || ex === 'shock' ? 'rgba(70,30,20,0.45)' : 'rgba(70,30,20,0.22)'; c.lineWidth = 2;
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
    else if (ex === 'relief') { c.beginPath(); c.arc(fx, 10, 6, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
    else { c.beginPath(); c.moveTo(fx - 5, 15); c.lineTo(fx + 5, 15); c.stroke(); }
    if (o.sweat) { c.fillStyle = '#BFE3FF'; c.beginPath(); c.ellipse(24, -6 + ((o.t || 0) * 20 % 18), 2.5, 4, 0, 0, TAU); c.fill(); }
    // Theme B: Cold breath vapor
    if (o.coldBreath) {
      const bt = ((o.t || 0) % 2.4) / 2.4;
      c.save(); c.globalAlpha = (1 - bt) * 0.45;
      c.fillStyle = '#E0F2FE';
      c.beginPath(); c.ellipse(fx + 14 + bt * 26, 15 - bt * 8, 6 + bt * 10, 4 + bt * 6, 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  c.restore();
  c.restore();

  // Front limbs & Hand-Socket Props
  leg(6, P.legs[0], K.pants, K.pantsSh);
  c.save(); c.rotate(P.lean || 0);
  const frontPose = o.coverMouth ? { a: 2.35, b: 1.05 } : P.arms[0];
  const front = arm(0, frontPose, K.shirt);
  if (o.bag) {
    c.fillStyle = '#EDEDE8';
    c.beginPath(); c.moveTo(front[0] - 4, front[1]); c.lineTo(front[0] - 16, front[1] + 46); c.lineTo(front[0] + 16, front[1] + 46); c.lineTo(front[0] + 6, front[1]); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(front[0] - 14, front[1] + 30, 28, 4);
  }
  if (o.milk) {
    c.fillStyle = '#F2F2F2'; rr(c, front[0] - 7, front[1] - 20, 14, 22, 2); c.fill();
    c.fillStyle = '#3B82C4'; c.fillRect(front[0] - 7, front[1] - 12, 14, 6);
  }
  if (o.flashlight) {
    drawTacticalFlashlight(c, front[0] + 8, front[1], 1, o.beamOn !== false);
  }
  c.restore();
  c.restore();
}

// --------------------------------------------------------- GENERALIZED ENTITY RIG (Correct Z-Index Order)
function drawEntity(c, x, y, s, o = {}) {
  const t = o.t || 0, P = o.pose || poseWalk(t, 0.8, 0.22);
  const suit = o.suit || (o.dark ? '#3F4652' : '#5E6672');
  const suitHi = o.suitHi || (o.dark ? '#4D5562' : '#737C89');
  const suitSh = o.suitSh || (o.dark ? '#2A3039' : '#454C57');
  const skin = o.skin || '#CFD3D8';

  c.save(); c.translate(x, y); c.scale(s * (o.dir || 1), s * (o.tall || 1.14));
  if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 0, 40, 7, 0, 0, TAU); c.fill(); }
  const by = P.by || 0, hipY = -96 + by;
  const leg = (hx, L, col) => {
    const kx = hx + 46 * Math.sin(L.a), ky = hipY + 46 * Math.cos(L.a), sa = L.a - L.b, ax = kx + 46 * Math.sin(sa), ay = ky + 46 * Math.cos(sa);
    limb(c, hx, hipY, kx, ky, 17, col, suitSh); limb(c, kx, ky, ax, ay, 15, col, suitSh);
    c.fillStyle = '#121214'; rr(c, ax - 8, ay - 7, 26, 11, 4); c.fill();
  };
  leg(-6, P.legs[1], suitSh);

  // 1. Far arm (suitSh)
  limb(c, 10, -158 + by, 20, -132, 13, suit, suitSh); limb(c, 20, -132, 22, -148, 11, skin);

  // 2. Prop drawn BEFORE front arm (suitHi) so near palm/sleeve occludes shaft
  // NOTE: Default prop is 'none' so non-janitor entities never hold a mop unless explicitly requested!
  const hasMop = o.prop === 'mop' || o.mop === true;
  if (hasMop && o.mop !== false && o.prop !== 'none') {
    const sw = Math.sin(t * 2.4) * 10;
    c.strokeStyle = '#7A5B3A'; c.lineWidth = 5.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(18, -150); c.lineTo(70 + sw, -4); c.stroke();
    c.fillStyle = '#8F8F86'; for (let k = 0; k < 7; k++) { rr(c, 52 + sw + k * 5, -10, 4, 12 + (k % 2) * 3, 2); c.fill(); }
  }

  c.fillStyle = cyl(c, -24, 48, suit, suitHi, suitSh); rr(c, -24, -168 + by, 48, 80, 12); c.fill();
  if (o.badge === true) { c.fillStyle = '#C9CDD2'; rr(c, 4, -150 + by, 14, 8, 2); c.fill(); }
  leg(6, P.legs[0], suit);

  // 3. Front arm (suitHi)
  limb(c, -6, -158 + by, 4, -128, 13, suitHi, suitSh); limb(c, 4, -128, 18, -142, 11, skin);
  c.fillStyle = skin; rr(c, -5, -178 + by, 12, 14, 3); c.fill();

  // Head / Mask
  c.save(); c.translate(0, -206 + by); c.rotate(o.tilt || 0);
  c.fillStyle = cyl(c, -25, 50, o.headColor || '#DEE1E5', o.headHi || '#F1F3F5', o.headSh || '#B8BEC6');
  rr(c, -25, -30, 50, 60, 22); c.fill();
  if (o.cap === true) {
    c.fillStyle = o.capColor || '#353B45';
    rr(c, -27, -36, 54, 18, [20, 20, 3, 3]); c.fill();
    rr(c, 4, -22, 30, 6, 3); c.fill();
  }
  const rv = o.reveal !== undefined ? o.reveal : 0.85;
  if (rv > 0) {
    c.globalAlpha = rv;
    c.fillStyle = o.eyeColor || '#0B0B0D';
    c.beginPath(); c.ellipse(-8, 0, 5, 8 * rv, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(10, 0, 5, 8 * rv, 0, 0, TAU); c.fill();
    if (o.bloodSlits !== false) {
      c.strokeStyle = '#6B0F1A'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(-8, 8); c.lineTo(-8, 8 + 14 * rv); c.moveTo(10, 8); c.lineTo(10, 8 + 10 * rv); c.stroke();
    }
    c.globalAlpha = 1;
  } else {
    c.fillStyle = 'rgba(0,0,0,0.05)'; c.beginPath(); c.ellipse(2, 4, 14, 18, 0, 0, TAU); c.fill();
  }
  c.restore(); c.restore();
}

function drawJanitor(c, x, y, s, o = {}) {
  return drawEntity(c, x, y, s, { cap: true, badge: true, ...o, prop: o.mop === false ? 'none' : 'mop' });
}

function drawBucket(c, x, y, s, dark) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 0, 40, 6, 0, 0, TAU); c.fill();
  c.fillStyle = dark ? '#7D6A22' : '#D1A928'; rr(c, -34, -54, 68, 46, 6); c.fill();
  c.fillStyle = dark ? '#5E4F18' : '#A8861D'; c.fillRect(-34, -40, 68, 6);
  c.fillStyle = '#2A2A2A'; rr(c, -8, -78, 16, 26, 3); c.fill();
  c.fillStyle = '#111'; for (const wx of [-24, 24]) { c.beginPath(); c.arc(wx, -5, 6, 0, TAU); c.fill(); }
  c.restore();
}

// --------------------------------------------------------- MACRO POV FOREARM (400px — NEVER floating!)
function hand(c, x, y, ang = 0, s = 1, o = {}) {
  const K = { ...PROTAGONIST, ...(o.colors || {}) };
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh);
  rr(c, -26, 0, 52, 400, 22); c.fill();
  rr(c, -32, -38, 64, 54, 20); c.fill();
  for (let i = 0; i < 4; i++) { rr(c, -28 + i * 15, -62, 12, 32, 6); c.fill(); }
  if (o.sleeve) { c.fillStyle = o.sleeveColor || K.shirt; rr(c, -30, 90, 60, 320, 14); c.fill(); }
  if (o.watch) {
    const label = typeof o.watch === 'string' ? o.watch : '19:20';
    c.fillStyle = '#222'; c.fillRect(-29, 32, 58, 16);
    c.fillStyle = '#0D1B1E'; rr(c, -18, 26, 36, 28, 5); c.fill();
    txt(c, label, 0, 45, 13, '#5EEAD4', 700, 'center');
  }
  if (o.marker) {
    c.save(); c.rotate(-0.5);
    c.fillStyle = '#18181B'; rr(c, -8, -110, 16, 80, 4); c.fill();
    c.fillStyle = o.marker === true ? '#DC2626' : o.marker; rr(c, -6, -124, 12, 18, 3); c.fill();
    c.restore();
  }
  if (o.tape) {
    c.strokeStyle = '#E2E8F0'; c.lineWidth = 14;
    c.beginPath(); c.arc(0, -48, 24, 0, TAU); c.stroke();
  }
  if (o.flashlight) {
    drawTacticalFlashlight(c, 0, -48, 1.5, o.beamOn !== false);
  }
  if (o.knife) {
    c.save(); c.translate(6, -34); c.rotate(-0.65);
    c.fillStyle = '#3F3F46'; rr(c, -8, -10, 16, 48, 4); c.fill();
    c.fillStyle = '#E2E8F0';
    c.beginPath(); c.moveTo(-4, -10); c.lineTo(-4, -72); c.quadraticCurveTo(6, -62, 6, -10); c.closePath(); c.fill();
    c.restore();
  }
  if (o.radio) {
    c.save(); c.translate(0, -48);
    c.fillStyle = '#18181B'; rr(c, -22, -48, 44, 72, 6); c.fill();
    c.fillStyle = '#334155'; rr(c, -16, -40, 32, 22, 3); c.fill();
    c.fillStyle = '#22C55E'; c.beginPath(); c.arc(10, -8, 3.5, 0, TAU); c.fill();
    c.strokeStyle = '#09090B'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-14, -48); c.lineTo(-14, -96); c.stroke();
    c.restore();
  }
  c.restore();
}

// --------------------------------------------------------- 1-POINT PERSPECTIVE ENGINE
const LIT = { wall: '#C8BEA2', wallSh: '#A99E81', floor: '#D9D0B4', line: '#BCB194', ceil: '#B7AE93', fog: '#E6DFC6', shutter: '#9A988E', rib: '#83827A', panel: '#FFFBE8' };
const DARK = { wall: '#1C202C', wallSh: '#151924', floor: '#1F2330', line: '#2A2F3E', ceil: '#12151E', fog: '#101521', shutter: '#262A35', rib: '#1E222C', panel: '#2B303C' };
const SIGNS = ['#B5654E', '#5E7F8C', '#8C7A4E', '#6E5E7F', '#4E7F68', '#9C5E6E', '#7F7357'];
const PK = { wall: '#9EA2A6', wallSh: '#83878B', floor: '#6E7277', line: '#C9B54B', ceil: '#8A8E92', fog: '#B8BCC0', shutter: '#8E9296', rib: '#7A7E82', panel: '#F3F8FF' };

function corridor(c, t, o = {}) {
  const pal = o.pal || DARK, f = o.f || 700, camH = o.camH || 1.6, ceilH = o.ceilH || 4.2, hw = o.hw || 3.2;
  const vx = o.vx || 640, vy = o.vy || 300, camZ = o.camZ || 0, dark = pal === DARK;
  const P = (X, Y, z) => [vx + f * X / z, vy + f * (camH - Y) / z];
  const fogK = z => 1 - Math.exp(-z / (o.fogD || 20));
  c.fillStyle = pal.fog; c.fillRect(0, 0, W, H);
  const quad = (a, b, cc, d, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...cc); c.lineTo(...d); c.closePath(); c.fill(); };
  const seg = 2.4, zN = 1.0, zF = 70, off = camZ % seg, segs = [];
  for (let k = Math.ceil(zF / seg); k >= 0; k--) {
    const z1 = k * seg - off, z2 = z1 + seg;
    if (z2 < zN) continue;
    segs.push([Math.max(z1, zN), z2, k + Math.floor(camZ / seg)]);
  }
  for (const [z1, z2, id] of segs) {
    const fk = fogK((z1 + z2) / 2);
    quad(P(-hw, 0, z1), P(hw, 0, z1), P(hw, 0, z2), P(-hw, 0, z2), mix(pal.floor, pal.fog, fk));
    quad(P(-hw, ceilH, z1), P(hw, ceilH, z1), P(hw, ceilH, z2), P(-hw, ceilH, z2), mix(pal.ceil, pal.fog, fk));
    for (const side of [-1, 1]) {
      const X = side * hw;
      quad(P(X, 0, z1), P(X, ceilH, z1), P(X, ceilH, z2), P(X, 0, z2), mix(side < 0 ? pal.wall : pal.wallSh, pal.fog, fk));
      if (o.parking) {
        if (id % 2 === 0) {
          quad(P(X - side * 0.3, 0, z1), P(X - side * 0.3, ceilH, z1), P(X - side * 0.3, ceilH, z1 + 0.5), P(X - side * 0.3, 0, z1 + 0.5), mix('#B9BDC1', pal.fog, fk));
          quad(P(X - side * 0.3, 0, z1), P(X - side * 0.3, 0.5, z1), P(X - side * 0.3, 0.5, z1 + 0.5), P(X - side * 0.3, 0, z1 + 0.5), mix('#C9A227', pal.fog, fk));
        }
        continue;
      }
      if (o.mallShops === true || o.plainWalls === false) {
        const a = z1 + 0.25, b = z2 - 0.25;
        if (b > a) {
          quad(P(X, 0, a), P(X, 2.9, a), P(X, 2.9, b), P(X, 0, b), mix(pal.shutter || pal.wall, pal.fog, fk));
          c.strokeStyle = mix(pal.rib || pal.wallSh, pal.fog, fk); c.lineWidth = Math.max(0.5, 60 / z1 * 0.03);
          for (let Y = 0.2; Y < 2.9; Y += 0.22) { c.beginPath(); c.moveTo(...P(X, Y, a)); c.lineTo(...P(X, Y, b)); c.stroke(); }
          const sc = SIGNS[Math.abs(id * 3 + (side > 0 ? 1 : 0)) % SIGNS.length];
          quad(P(X, 3.1, a), P(X, 3.7, a), P(X, 3.7, b), P(X, 3.1, b), mix(dark ? '#2B2833' : sc, pal.fog, fk));
        }
      }
    }
    c.strokeStyle = mix(pal.line, pal.fog, fk); c.lineWidth = 1;
    c.beginPath(); c.moveTo(...P(-hw, 0, z1)); c.lineTo(...P(hw, 0, z1)); c.stroke();
  }
  c.strokeStyle = rgba(dark ? '#2A2F3E' : '#BCB194', 0.7); c.lineWidth = 1;
  for (let X = -hw; X <= hw; X += 0.8) { c.beginPath(); c.moveTo(...P(X, 0, zN)); c.lineTo(...P(X, 0, zF)); c.stroke(); }
  for (const [z1, z2, id] of segs) {
    const zm = (z1 + z2) / 2; if (zm < 1.3) continue;
    let on = o.lightsOff ? (o.lightsOff(id, zm) ? 0 : 1) : 1;
    on *= flick(id, t, o.flickRate || 1);
    if (dark && !o.lightsOff) on = 0.08;
    const fk = fogK(zm);
    const col = on > 0.5 ? mix(o.parking ? PK.panel : (pal.panel || LIT.panel), pal.fog, fk * 0.6) : mix('#5A5850', pal.fog, fk);
    quad(P(-0.5, ceilH, zm - 0.45), P(0.5, ceilH, zm - 0.45), P(0.5, ceilH, zm + 0.45), P(-0.5, ceilH, zm + 0.45), on > 0.2 ? mix(col.startsWith('rgb') ? '#FFFBE8' : col, pal.fog, fk * 0.5) : col);
    if (on > 0.2) {
      const [fx, fy] = P(0, 0, zm), r = f * 1.6 / zm;
      c.save(); c.translate(fx, fy); c.scale(1, 0.22); glow(c, 0, 0, r, '#FFF6D8', 0.22 * on * (1 - fk)); c.restore();
      const [lx, ly] = P(0, ceilH, zm); glow(c, lx, ly, f * 0.9 / zm, '#FFF6D8', 0.35 * on * (1 - fk));
    }
  }
  return P;
}

// --------------------------------------------------------- MULTI-ENVIRONMENT CAMERA & STAGING RIGS
// 1. Open Exterior / Maritime / Rooftop / Wilderness Horizon (2.5D Multi-Plane Parallax)
function outdoorStage(c, t, o = {}) {
  const skyTop = o.skyTop || '#0F172A', skyBot = o.skyBot || '#1E293B';
  const groundCol = o.groundCol || '#172030', horizonY = o.horizonY || 420;
  const g = c.createLinearGradient(0, 0, 0, horizonY);
  g.addColorStop(0, skyTop); g.addColorStop(1, skyBot);
  c.fillStyle = g; c.fillRect(0, 0, W, horizonY);

  // Distant silhouette ridge / skyline / treeline parallax
  const pan = (o.panSpeed || 12) * t;
  c.fillStyle = o.ridgeCol || mix(skyBot, '#090D16', 0.48);
  c.beginPath(); c.moveTo(0, horizonY);
  for (let x = 0; x <= W + 80; x += 80) {
    const h = 18 + hash(Math.floor((x + pan) / 80) * 7.1) * (o.ridgeH || 48);
    c.lineTo(x, horizonY - h);
  }
  c.lineTo(W, horizonY); c.closePath(); c.fill();

  // Ground or Animated Water Plane
  const gg = c.createLinearGradient(0, horizonY, 0, H);
  gg.addColorStop(0, groundCol); gg.addColorStop(1, mix(groundCol, '#090D16', 0.45));
  c.fillStyle = gg; c.fillRect(0, horizonY, W, H - horizonY);

  if (o.water) {
    c.strokeStyle = o.waveCol || 'rgba(125,211,252,0.18)'; c.lineWidth = 2;
    for (let r = 0; r < 9; r++) {
      const wy = horizonY + 18 + r * r * 3.4;
      if (wy > H) break;
      const shift = Math.sin(t * 1.8 + r) * (8 + r * 3);
      c.beginPath();
      for (let x = -40; x < W + 40; x += 90) {
        c.moveTo(x + shift, wy); c.lineTo(x + shift + 36 + r * 4, wy);
      }
      c.stroke();
    }
  }
  return { horizonY };
}

// 2. 2-Point Corner / Room Interior Stage (Asymmetric Left+Right Walls, Floor & Ceiling)
function roomCorner(c, o = {}) {
  const cx = o.cornerX || 520, topY = o.topY || 90, botY = o.botY || 530;
  const wallL = o.wallL || '#1E2638', wallR = o.wallR || '#161D2B';
  const floorCol = o.floor || '#232B3A', ceilCol = o.ceil || '#121722';

  // Ceiling & Floor
  c.fillStyle = ceilCol;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, topY - 20); c.lineTo(cx, topY); c.lineTo(0, topY - 30); c.closePath(); c.fill();
  c.fillStyle = floorCol;
  c.beginPath(); c.moveTo(0, botY + 40); c.lineTo(cx, botY); c.lineTo(W, botY + 30); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();

  // Left & Right Walls meeting at vertical corner seam (cx)
  c.fillStyle = wallL;
  c.beginPath(); c.moveTo(0, topY - 30); c.lineTo(cx, topY); c.lineTo(cx, botY); c.lineTo(0, botY + 40); c.closePath(); c.fill();
  c.fillStyle = wallR;
  c.beginPath(); c.moveTo(cx, topY); c.lineTo(W, topY - 20); c.lineTo(W, botY + 30); c.lineTo(cx, botY); c.closePath(); c.fill();

  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx, topY); c.lineTo(cx, botY); c.stroke();
  return { cx, topY, botY };
}

// 3. Top-Down / Bird's-Eye Architectural Blueprint & Tactical Room View
function topDownRoom(c, o = {}) {
  const rx = o.x || 120, ry = o.y || 90, rw = o.w || 640, rh = o.h || 520;
  c.fillStyle = o.bg || '#111827'; c.fillRect(0, 0, W, H);
  c.fillStyle = o.floor || '#1E293B'; rr(c, rx, ry, rw, rh, 8); c.fill();

  if (o.grid !== false) {
    c.strokeStyle = 'rgba(148,163,184,0.12)'; c.lineWidth = 1;
    for (let x = rx + 40; x < rx + rw; x += 40) { c.beginPath(); c.moveTo(x, ry); c.lineTo(x, ry + rh); c.stroke(); }
    for (let y = ry + 40; y < ry + rh; y += 40) { c.beginPath(); c.moveTo(rx, y); c.lineTo(rx + rw, y); c.stroke(); }
  }
  c.strokeStyle = o.wallCol || '#64748B'; c.lineWidth = 8;
  rr(c, rx, ry, rw, rh, 8); c.stroke();
  return { rx, ry, rw, rh };
}

// 4. Surveillance / Security Monitor / Peephole / Visor Lens Frame
function cctvOverlay(c, t, o = {}) {
  c.save();
  // Scanlines
  c.fillStyle = 'rgba(16, 185, 129, 0.04)';
  for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1.5);
  // Corner viewfinder brackets
  c.strokeStyle = o.col || 'rgba(226,232,240,0.55)'; c.lineWidth = 2.5;
  const m = 38, L = 28;
  for (const [bx, by, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    c.beginPath(); c.moveTo(bx, by + sy * L); c.lineTo(bx, by); c.lineTo(bx + sx * L, by); c.stroke();
  }
  if (o.camLabel) {
    if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#EF4444'; c.beginPath(); c.arc(64, 62, 6, 0, TAU); c.fill(); }
    txt(c, o.camLabel, 80, 68, 16, '#E2E8F0', 700);
  }
  c.restore();
}

// --------------------------------------------------------- ATMOSPHERIC POST & SHADERS
function vignette(c, k = 0.78, inner = 0.44, col = '#000000') {
  const g = c.createRadialGradient(W / 2, H / 2, H * inner, W / 2, H / 2, H * 0.96);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, k)); c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function darken(c, a = 0.28, col = '#0A101E') {
  if (typeof a === 'string') a = 0.25;
  c.fillStyle = rgba(col, a); c.fillRect(0, 0, W, H);
}
function emergency(c, x, y, r, a = 0.35) {
  if (y === undefined || r === undefined) { x = W / 2; y = 180; r = 520; a = 0.32; }
  c.save(); c.globalCompositeOperation = 'screen'; glow(c, x, y, r, '#C81E1E', a); c.restore();
}
// Theme B: Sub-zero border frost shader
function frostOverlay(c, intensity = 0.55, t = 0) {
  const k = clamp(intensity);
  if (k <= 0) return;
  const g = c.createRadialGradient(W / 2, H / 2, H * (0.48 - 0.14 * k), W / 2, H / 2, H * 0.96);
  g.addColorStop(0, 'rgba(186,230,253,0)');
  g.addColorStop(0.7, `rgba(125,211,252,${(0.18 * k).toFixed(3)})`);
  g.addColorStop(1, `rgba(224,242,254,${(0.55 * k).toFixed(3)})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.strokeStyle = `rgba(224,242,254,${(0.35 * k).toFixed(3)})`; c.lineWidth = 1.5;
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * TAU;
    const cx = W / 2 + Math.cos(ang) * (W * 0.48), cy = H / 2 + Math.sin(ang) * (H * 0.48);
    const len = (24 + hash(i * 9.3 + Math.floor(t * 2)) * 34) * k;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - Math.cos(ang) * len, cy - Math.sin(ang) * len); c.stroke();
  }
  c.restore();
}

const grainCv = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (grainCv) {
  grainCv.width = grainCv.height = 256;
  const g = grainCv.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = hash(i * 0.37) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
}
function grain(c, T, a = 0.04) {
  if (!grainCv) return;
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay';
  const ox = Math.floor(hash(Math.floor(T * 30)) * 256), oy = Math.floor(hash(Math.floor(T * 30) + 5) * 256);
  c.translate(-ox, -oy); c.fillStyle = c.createPattern(grainCv, 'repeat'); c.fillRect(0, 0, W + 256, H + 256); c.restore();
}

// --------------------------------------------------------- HUD CARDS, TELEMETRY & SUBTITLES
const CREAM = '#F5EFE6', INK = '#1C1917', RED = '#B91C1C';
const CARD = { bg: CREAM, ink: INK, red: RED, muted: '#57534E' };

function badge(c, x, y, s, dark = true) {
  const isHex = typeof dark === 'string';
  c.font = `600 15px ${FONT}`; const w = c.measureText(s).width + 22;
  c.fillStyle = isHex ? dark : (dark ? '#18181B' : RED);
  rr(c, x, y, w, 26, 13); c.fill();
  txt(c, s, x + 11, y + 18.5, 15, '#fff', 600); return w;
}
function cardBox(c, x, y, w, h) {
  c.save(); c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
  c.fillStyle = CREAM; rr(c, x, y, w, h, 10); c.fill(); c.restore();
  c.strokeStyle = '#D6CFC2'; c.lineWidth = 1.5; rr(c, x, y, w, h, 10); c.stroke();
}
function measure(c, s, size, weight = 700) { c.font = `${weight} ${size}px ${FONT}`; return c.measureText(s).width; }
function fitTextSize(c, s, maxW, startSize, minSize = 14, weight = 700) {
  let sz = startSize;
  while (sz > minSize && measure(c, s, sz, weight) > maxW) sz -= 1;
  return sz;
}
function cardPos(pos, w, h) {
  const shorts = typeof window !== 'undefined' && window.SHORTS_MODE;
  const maxX = shorts ? (W - w - 140) : (W - w - 46);
  let x, y;
  if (pos === 'tl' || pos === 'left') { x = 56; y = 54; }
  else if (pos === 'tr') { x = W - w - 56; y = 178; }
  else if (pos === 'r' || pos === 'right') { x = W - w - 56; y = (H - h) / 2 + 24; }
  else { x = (W - w) / 2; y = (H - h) / 2 - 20; }
  return [clamp(x, 24, Math.max(24, maxX)), clamp(y, 24, Math.max(24, H - h - 76))];
}

function normalizeCard(s) {
  if (!s) return null;
  if (s.card) return s.card;
  if (!s.hud) return null;
  const h = s.hud;
  const at = h.at !== undefined ? h.at : 0.4;
  const pos = h.pos || 'tr';
  if (h.type === 'rule') {
    return { type: 'rule', at, pos, badge: `⚠ ${h.ruleNo || 'กฎข้อ 1'}`, title: Array.isArray(h.title) ? h.title : [h.title || '', h.sub || ''].filter(Boolean), sub: h.eng || 'SURVIVAL RULE' };
  }
  if (h.type === 'info') {
    return { type: 'info', at, pos, badge: h.badge || '● ข้อมูลสำคัญ · CLUE', title: Array.isArray(h.title) ? h.title : [h.title || '', h.sub || ''].filter(Boolean), sub: Array.isArray(h.title) ? (h.sub || '') : (h.eng || '') };
  }
  if (h.type === 'inventory') {
    return { type: 'inventory', at, pos: h.pos || 'tr', badge: h.badge || '● ของที่มี · INVENTORY', items: (h.items || []).map(it => Array.isArray(it) ? it : [it.icon || '•', it.name, it.qty]) };
  }
  if (h.type === 'math' || h.type === 'calc') {
    return { type: 'calc', at, pos: h.pos || 'r', badge: h.badge || '● คำนวณการเอาชีวิตรอด · SURVIVAL MATH', rows: h.rows || [], total: h.total || ['สรุป', 'วิกฤต'], note: h.note || [] };
  }
  if (h.type === 'dilemma' || h.type === 'flow') {
    return {
      type: 'flow', at, head: h.head || 'เลือกทางรอด',
      left: h.left || { tag: h.optA.title, icon: h.optA.icon || '⚠️', res: h.optA.res, en: h.optA.en, danger: h.optA.danger !== false },
      right: h.right || { tag: h.optB.title, icon: h.optB.icon || '✅', res: h.optB.res, en: h.optB.en, danger: Boolean(h.optB.danger) }
    };
  }
  if (h.type === 'anomaly' || h.type === 'clue') {
    return { type: 'clue', at, pos: h.pos || 'r', badge: h.badge || '⚠ หลักฐานผิดปกติ', glyph: h.glyph || '🔎', title: Array.isArray(h.title) ? h.title : [h.title || '', h.sub || ''].filter(Boolean), sub: h.detail || h.eng || '' };
  }
  return null;
}

function drawCard(c, rawCard, lt, sceneDur) {
  const card = rawCard && !rawCard.pos && !rawCard.head && !rawCard.rows && !rawCard.items && !Array.isArray(rawCard.title)
    ? normalizeCard({ hud: rawCard }) : rawCard;
  if (!card) return;
  const at = card.at !== undefined ? card.at : 0.4;
  const k = easeBack(prog(lt, at, at + 0.38)), out = 1 - prog(lt, sceneDur - 0.3, sceneDur);
  const a = clamp(prog(lt, at, at + 0.2)) * out; if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  if (card.type === 'flow') { drawFlow(c, card, lt - at); c.restore(); return; }

  let w, h; const pad = 26;
  const maxCardW = (typeof window !== 'undefined' && window.SHORTS_MODE) ? 880 : 760;

  if (card.type === 'rule' || card.type === 'info' || card.type === 'clue') {
    const baseSize = card.small ? 24 : 28;
    const gw = card.type === 'clue' ? 105 : 0;
    const lines = card.title || [];
    const subStr = card.sub || '';
    const rawW = Math.max(340, ...lines.map(s => measure(c, s, baseSize, 700) + pad * 2 + gw), measure(c, subStr, 13, 600) + pad * 2 + gw, measure(c, card.badge || '', 15, 600) + 64);
    w = Math.min(maxCardW, rawW);
    const innerTextW = w - pad * 2 - gw;
    const lineSizes = lines.map(s => fitTextSize(c, s, innerTextW, baseSize, 17, 700));
    const subSize = subStr ? fitTextSize(c, subStr, innerTextW, 13, 10, 600) : 13;
    const lineStep = Math.max(...lineSizes, baseSize) + 10;
    h = 62 + lines.length * lineStep + (subStr ? 40 : 8);

    const [x, y] = cardPos(card.pos, w, h);
    c.translate(x + w / 2, y + h / 2); c.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); c.translate(-w / 2, -h / 2);
    cardBox(c, 0, 0, w, h);
    badge(c, pad - 6, 18, card.badge, card.type !== 'rule');
    let ty = 62;
    if (gw) {
      c.fillStyle = '#E9E2D5'; rr(c, pad - 4, 58, 88, h - 76, 8); c.fill();
      const gSz = String(card.glyph || '🔎').length > 2 ? 26 : 42;
      txt(c, card.glyph || '🔎', pad + 40, 58 + (h - 76) / 2 + gSz * 0.34, gSz, INK, 700, 'center');
    }
    for (let i = 0; i < lines.length; i++) {
      const sz = lineSizes[i];
      ty += sz + 6;
      txt(c, lines[i], pad + gw, ty, sz, i === 1 && (card.type === 'rule' || card.type === 'clue') ? RED : INK, 700);
      ty += 4;
    }
    if (subStr) {
      c.fillStyle = '#CFC6B6'; c.fillRect(pad + gw, ty + 10, w - pad * 2 - gw, 1.5);
      txt(c, subStr, pad + gw, ty + 32, subSize, card.type === 'rule' ? RED : '#57534E', 600);
    }
  } else if (card.type === 'inventory') {
    const items = card.items || [];
    const maxItemW = Math.max(360, ...items.map(it => 86 + measure(c, it[1], 19, 700) + measure(c, it[2], 18, 700) + 32));
    w = clamp(maxItemW, 380, Math.min(540, maxCardW));
    h = 66 + items.length * 46;
    const [x, y] = cardPos(card.pos, w, h);
    c.translate(x, y); cardBox(c, 0, 0, w, h); badge(c, 20, 18, card.badge);
    items.forEach((it, i) => {
      const ia = prog(lt, at + 0.25 + i * 0.35, at + 0.55 + i * 0.35); if (ia <= 0) return;
      c.globalAlpha = a * ia; const yy = 64 + i * 46;
      c.fillStyle = '#E9E2D5'; rr(c, 20, yy, 36, 36, 8); c.fill(); txt(c, it[0], 38, yy + 26, 20, INK, 400, 'center');
      const qtyW = measure(c, it[2], 17, 700);
      const nameSz = fitTextSize(c, it[1], w - 98 - qtyW, 18, 14, 700);
      txt(c, it[1], 68, yy + 25, nameSz, INK, 700); txt(c, it[2], w - 22, yy + 25, 17, RED, 700, 'right');
    });
  } else if (card.type === 'calc') {
    const rows = card.rows || [], notes = card.note || [], tot = card.total || ['', ''];
    const rowMaxW = Math.max(520, ...rows.map(r => 68 + measure(c, r[0], 18, 600) + measure(c, r[1], 19, 700)), 68 + measure(c, tot[0], 21, 700) + measure(c, tot[1], 23, 700), ...notes.map(n => 68 + measure(c, '▸ ' + n, 15, 600)));
    w = Math.min(maxCardW, Math.max(520, rowMaxW));
    h = 70 + rows.length * 40 + 60 + notes.length * 26 + 10;
    const [x, y] = cardPos(card.pos, w, h);
    c.translate(x + w / 2, y + h / 2); c.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); c.translate(-w / 2, -h / 2);
    cardBox(c, 0, 0, w, h); badge(c, 20, 18, card.badge);
    let yy = 72;
    rows.forEach((r, i) => {
      const ia = prog(lt, at + 0.35 + i * 0.45, at + 0.65 + i * 0.45); c.globalAlpha = a * ia;
      const valW = measure(c, r[1], 19, 700);
      const lblSz = fitTextSize(c, r[0], w - 68 - valW, 18, 13, 600);
      txt(c, r[0], 26, yy + 22, lblSz, INK, 600); txt(c, r[1], w - 26, yy + 22, 19, INK, 700, 'right'); yy += 40;
    });
    const ta = prog(lt, at + 0.35 + rows.length * 0.45, at + 0.75 + rows.length * 0.45); c.globalAlpha = a * ta;
    c.fillStyle = INK; c.fillRect(26, yy + 4, w - 52, 2);
    const totValW = measure(c, tot[1], 23, 700);
    const totLblSz = fitTextSize(c, tot[0], w - 68 - totValW, 21, 15, 700);
    txt(c, tot[0], 26, yy + 40, totLblSz, INK, 700); txt(c, tot[1], w - 26, yy + 40, 23, RED, 700, 'right'); yy += 60;
    notes.forEach((n, i) => {
      const na = prog(lt, at + 1.8 + i * 0.5, at + 2.2 + i * 0.5); c.globalAlpha = a * na;
      const nSz = fitTextSize(c, '▸ ' + n, w - 52, 15, 12, 600);
      txt(c, '▸ ' + n, 26, yy + 20, nSz, i === notes.length - 1 ? RED : '#57534E', 600); yy += 26;
    });
  }
  c.restore();
}

function drawFlow(c, card, lt) {
  const cx = 480, top = 110;
  const headSz = fitTextSize(c, card.head, 640, 22, 16, 700);
  c.font = `700 ${headSz}px ${FONT}`; const hw = Math.min(700, c.measureText(card.head).width + 44);
  c.fillStyle = '#18181B'; rr(c, cx - hw / 2, top, hw, 44, 22); c.fill();
  txt(c, card.head, cx, top + 29, headSz, '#fff', 700, 'center');
  const k = easeOut(prog(lt, 0.2, 0.9));
  c.strokeStyle = '#E5E7EB'; c.lineWidth = 3;
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx, top + 44);
    c.quadraticCurveTo(cx + s * 190 * k, top + 56, cx + s * 195 * k, top + 98 * k + 2);
    c.stroke();
  }
  [['left', -1, 0.6], ['right', 1, 1.1]].forEach(([key, s, at]) => {
    const b = card[key]; if (!b) return;
    const ka = easeBack(prog(lt, at, at + 0.4)); if (ka <= 0) return;
    const w = 320, h = 186, x = cx + s * 195 - w / 2, y = top + 98;
    c.save(); c.globalAlpha *= clamp(ka); c.translate(x + w / 2, y); c.scale(0.9 + 0.1 * ka, 0.9 + 0.1 * ka); c.translate(-w / 2, 0);
    cardBox(c, 0, 0, w, h);
    txt(c, b.tag, w / 2, 34, fitTextSize(c, b.tag, w - 30, 19, 13, 700), '#57534E', 700, 'center');
    txt(c, b.icon, w / 2, 92, 42, INK, 400, 'center');
    txt(c, b.res, w / 2, 138, fitTextSize(c, b.res, w - 30, 22, 14, 700), b.danger ? RED : '#15803D', 700, 'center');
    if (b.en) txt(c, b.en, w / 2, 166, fitTextSize(c, b.en, w - 30, 12, 10, 600), '#7C7468', 600, 'center');
    c.restore();
  });
}

// Theme-Agnostic Telemetry Renderer (supports Energy/Kcal, Tide, Temp, O2, dB, or Custom Bar)
function drawTele(c, s, lt) {
  const tl = s.tele || s.telemetry; if (!tl) return;
  const x = W - 46, y = 40, w = 320;
  const dayStr = tl.day === 0 ? '● ปกติ · BASELINE' : `● ${tl.day}`;
  const timeStr = tl.time || '';
  const subLabel = tl.label || tl.shift || '';

  // Resolve metric bar across all themes (A/B/C/Custom)
  let bar = tl.bar || null;
  if (!bar && tl.kcal != null) {
    const r = clamp(tl.kcal / (tl.kmax || 2400)), low = r < 0.3 || tl.kcal < 200;
    bar = { label: 'พลังงาน', ratio: r, text: `${tl.kcal} kcal`, color: low ? '#EF4444' : '#FACC15', warn: low };
  } else if (!bar && tl.tide !== undefined) {
    const r = clamp((5.0 + tl.tide) / 5.0), low = tl.tide <= -2.0;
    bar = { label: 'ระดับน้ำ', ratio: r, text: `${tl.tide.toFixed(1)} ม.`, color: low ? '#2DD4BF' : '#38BDF8', warn: low };
  } else if (!bar && tl.temp !== undefined) {
    const r = clamp((tl.temp - 28) / 10), low = tl.temp < 35.0;
    bar = { label: 'อุณหภูมิแกน', ratio: r, text: `${tl.temp.toFixed(1)}°C`, color: low ? '#38BDF8' : '#F97316', warn: low };
  } else if (!bar && tl.oxygen !== undefined) {
    const r = clamp(tl.oxygen / 100), low = tl.oxygen < 30;
    bar = { label: 'ออกซิเจน', ratio: r, text: `${tl.oxygen}%`, color: low ? '#EF4444' : '#38BDF8', warn: low };
  } else if (!bar && tl.db !== undefined) {
    const r = clamp(tl.db / 120), high = tl.db >= 60;
    bar = { label: 'ระดับเสียง', ratio: r, text: `${tl.db} dB`, color: high ? '#EF4444' : '#10B981', warn: high };
  }

  c.save(); c.globalAlpha = clamp(lt / 0.3);
  const h = 62 + (bar ? 30 : 0) + (subLabel ? 26 : 0);
  c.fillStyle = 'rgba(14,14,18,0.84)'; rr(c, x - w, y, w, h, 10); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1; rr(c, x - w, y, w, h, 10); c.stroke();
  txt(c, dayStr, x - w + 16, y + 26, fitTextSize(c, dayStr, w - 120, 15, 12, 600), '#F5EFE6', 600);
  if (timeStr) txt(c, timeStr, x - 16, y + 46, 30, '#fff', 700, 'right');

  let statusTxt = tl.statusText || '';
  let statusCol = '#D6D3D1';
  if (tl.lights === false) { statusTxt = statusTxt || '◼ ไฟดับ'; statusCol = '#F87171'; }
  else if (tl.status === 'CRITICAL') { statusTxt = statusTxt || '◼ ภัยคุกคามวิกฤต'; statusCol = '#F87171'; }
  else if (tl.status === 'DANGER') { statusTxt = statusTxt || '◼ สัญญาณอันตราย'; statusCol = '#F87171'; }
  else if (tl.status === 'SAFE') { statusTxt = statusTxt || '◻ ปลอดภัย'; statusCol = '#9AE6B4'; }
  else if (tl.status === 'WARN') { statusTxt = statusTxt || '◻ ผิดปกติ · เฝ้าระวัง'; statusCol = '#FBBF24'; }
  else if (tl.lights === true) { statusTxt = statusTxt || '◻ ไฟเปิด'; statusCol = '#D6D3D1'; }
  if (statusTxt) txt(c, statusTxt, x - w + 16, y + 50, 14, statusCol, 600);

  let yy = y + 62;
  if (bar) {
    const r = clamp(bar.ratio !== undefined ? bar.ratio : (bar.value / (bar.max || 100)));
    txt(c, bar.label || 'สถานะ', x - w + 16, yy + 18, 13, '#A8A29E', 600);
    c.fillStyle = 'rgba(255,255,255,0.12)'; rr(c, x - w + 86, yy + 8, 126, 10, 5); c.fill();
    c.fillStyle = bar.color || '#FACC15'; rr(c, x - w + 86, yy + 8, Math.max(6, 126 * r), 10, 5); c.fill();
    txt(c, bar.text || `${bar.value}${bar.unit || ''}`, x - 16, yy + 19, 13, bar.warn ? '#FCA5A5' : '#E7E5E4', 600, 'right');
    yy += 30;
  }

  if (subLabel) {
    const text = tl.shift && !tl.label ? `${tl.shiftLabel || '⟳ รอบถัดไป'} ${tl.shift}` : subLabel;
    txt(c, text, x - w + 16, yy + 15, fitTextSize(c, text, w - 32, 14, 11, 600), '#FACC15', 600);
  }

  if (tl.dist || tl.distance) {
    const dy = y + h + 8;
    const distVal = Array.isArray(tl.dist)
      ? `${Math.round(lerp(tl.dist[0], tl.dist[1], ease(lt / Math.max(1, s.dur - 1))))} ม.`
      : tl.distance;
    c.fillStyle = CREAM; rr(c, x - 246, dy, 246, 44, 10); c.fill();
    badge(c, x - 238, dy + 9, `● ${tl.distLabel || 'ระยะห่าง'}`, true);
    txt(c, distVal, x - 14, dy + 31, fitTextSize(c, distVal, 96, 23, 15, 700), RED, 700, 'right');
  }
  c.restore();
}

function drawChapter(c, chap, lt) {
  const label = Array.isArray(chap) ? chap[0] : (chap.label || '');
  const title = Array.isArray(chap) ? chap[1] : (chap.title || '');
  const a = clamp(prog(lt, 0, 0.35)) * (1 - prog(lt, 2.8, 3.3));
  if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  const g = c.createLinearGradient(0, H / 2 - 120, 0, H / 2 + 120);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.72)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, H / 2 - 120, W, 240);
  const ox = (1 - easeOut(lt / 0.6)) * -30;
  c.font = `600 20px ${FONT}`; const bw = c.measureText(label).width + 30;
  c.fillStyle = RED; rr(c, W / 2 - bw / 2 + ox, H / 2 - 62, bw, 34, 17); c.fill();
  txt(c, label, W / 2 + ox, H / 2 - 38, 20, '#fff', 600, 'center');
  txt(c, title, W / 2 - ox, H / 2 + 28, fitTextSize(c, title, W - 120, 44, 24, 700), CREAM, 700, 'center');
  c.restore();
}

// --------------------------------------------------------- SUBTITLES (FRAMELESS — 9:16 Safe Zone Aware)
function drawSub(c, s, lt) {
  if (!s.subs) return;
  const cue = s.subs.find(q => {
    const t0 = q.t0 !== undefined ? q.t0 : q.start;
    const t1 = q.t1 !== undefined ? q.t1 : q.end;
    return lt >= t0 && lt < t1;
  });
  if (!cue) return;
  const isShorts = typeof window !== 'undefined' && window.SHORTS_MODE;
  const subY = isShorts ? Math.min(H - 42, 1420) : (H - 42);
  const subSz = fitTextSize(c, cue.text, W - 120, 29, 20, 700);
  c.save(); c.font = `700 ${subSz}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.lineJoin = 'round'; c.lineWidth = 7; c.strokeStyle = 'rgba(9,9,11,0.92)'; c.strokeText(cue.text, W / 2, subY);
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText(cue.text, W / 2, subY); c.restore();
}
