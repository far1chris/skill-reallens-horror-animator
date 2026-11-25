// =============================================================================
//  Real Lens (@real_lens1) Complete 2.5D Geometric Survival Horror Core Engine
//  Part of skill: reallens-horror-animator
//  Human Proportion Ratio 1:6.5 (Athletic build with continuous trapezius slope)
//  Includes:
//   - Math, color, blurLayer (DoF/rack-focus), deterministic flick()
//   - 2-Segment FK Poses (poseWalk, poseStand, poseKneel, poseSit, poseSquat, poseClimb)
//   - drawPerson() (1:6.5 rig, Theme B coldBreath/shiver, Theme C coverMouth)
//   - drawEntity() + drawJanitor() (Correct Z-Index: suitSh -> Prop -> suitHi)
//   - hand() 400px Macro POV Forearm (watch/marker/tape/flashlight/knife/radio)
//   - corridor() 3D 1-point perspective engine + frostOverlay() + vignette/grain
//   - Clean Storytelling Output: drawSub() frameless 9:16-aware subtitles ONLY
//     (red pill drawChapter removed; drawTele/drawCard/drawFlow off by default)
// =============================================================================
const W = 1280, H = 720, TAU = Math.PI * 2;
const SHORTS_W = 1080, SHORTS_H = 1920;
const SHORTS_SX = 1.50, SHORTS_SY = SHORTS_H / H; // 1.50x horizontal (720px visible width), 2.6667x vertical (full 0..1920 height)
const SHORTS_CHAR_SCALE = 1.85;
let _inShortsWorld = false;
let _inShortsRig = false;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k = clamp(k), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const easeBack = k => { k = clamp(k); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
const FONT = "'Kanit','Leelawadee UI','Tahoma',sans-serif";
const F_MONO = "'JetBrains Mono','Kanit',monospace";

function isShortsMode() {
  return typeof window !== 'undefined' && Boolean(window.SHORTS_MODE);
}
function beginShortsWorld(c, s) {
  if (!isShortsMode()) return false;
  const rawFx = s && typeof s.focusX === 'number' ? s.focusX : W / 2;
  const halfVisW = (SHORTS_W / SHORTS_SX) / 2; // 360px
  const fx = clamp(rawFx, halfVisW, W - halfVisW);
  c.save();
  c.translate(SHORTS_W / 2, 0);
  c.scale(SHORTS_SX, SHORTS_SY);
  c.translate(-fx, 0);
  _inShortsWorld = true;
  return true;
}
function endShortsWorld(c, active) {
  if (!active) return;
  _inShortsWorld = false;
  c.restore();
}
function applyShortsRigComp(c) {
  if (!_inShortsWorld || _inShortsRig) return false;
  c.scale(SHORTS_CHAR_SCALE / SHORTS_SX, SHORTS_CHAR_SCALE / SHORTS_SY);
  _inShortsRig = true;
  return true;
}
function endShortsRigComp(applied) {
  if (applied) _inShortsRig = false;
}
function getRenderScale() {
  if (_inShortsWorld || isShortsMode()) return 1;
  if (typeof window !== 'undefined' && typeof window.__RENDER_SCALE === 'number' && window.__RENDER_SCALE > 0) {
    return window.__RENDER_SCALE;
  }
  return 1;
}
function ensureOffscreenSize(cv, rs = 1) {
  if (!cv) return false;
  const tw = Math.round(W * rs), th = Math.round(H * rs);
  if (cv.width !== tw || cv.height !== th) { cv.width = tw; cv.height = th; }
  return true;
}

function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mix(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})`; }
function rgba(h, a) { const A = hex2rgb(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function cyl(c, x, w, base, hi, sh) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, base); g.addColorStop(0.35, hi); g.addColorStop(1, sh); return g;
}
function limb(c, x1, y1, x2, y2, w, col, sh, opts = {}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  c.lineCap = 'round';
  if (opts.contour !== false) {
    c.strokeStyle = 'rgba(8, 10, 16, 0.24)';
    c.lineWidth = w + 2.0;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  if (sh) {
    const sx = nx * w * 0.28, sy = ny * w * 0.28;
    c.strokeStyle = sh; c.lineWidth = w * 0.38;
    c.beginPath(); c.moveTo(x1 + sx, y1 + sy); c.lineTo(x2 + sx, y2 + sy); c.stroke();
  }
  // Delicate rim highlight along lit edge
  const rx = -nx * w * 0.34, ry = -ny * w * 0.34;
  c.strokeStyle = 'rgba(255, 245, 230, 0.14)'; c.lineWidth = Math.max(1.2, w * 0.16);
  c.beginPath(); c.moveTo(x1 + rx, y1 + ry); c.lineTo(x2 + rx, y2 + ry); c.stroke();
}
function limbContour2(c, x1, y1, x2, y2, x3, y3, w) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = 'rgba(8, 10, 16, 0.44)'; c.lineWidth = w + 2.4;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.stroke();
}
function txt(c, s, x, y, size, col, weight = 700, align = 'left', base = 'alphabetic') {
  c.font = `${weight} ${size}px ${FONT}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y);
}
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

// Offscreen Gaussian blur buffer (depth-of-field & HUD rack-focus) + static LRU cache
const _tmp = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (_tmp) { _tmp.width = W; _tmp.height = H; }
const _tc = _tmp ? _tmp.getContext('2d') : null;
const _blurCache = new Map();
const _BLUR_CACHE_MAX = 8;
function clearBlurCache() { _blurCache.clear(); }
function blurLayer(c, px, fn, extra = '', cacheKey = null) {
  if (!_tc) { fn(c); return; }
  const rs = getRenderScale();
  const tw = Math.round(W * rs), th = Math.round(H * rs);
  const filterStr = `blur(${(px * rs).toFixed(2)}px)${extra ? ' ' + extra : ''}`;

  if (typeof cacheKey === 'string' && cacheKey.length > 0 && typeof document !== 'undefined') {
    const fullKey = `${cacheKey}|${px}|${extra}|${tw}x${th}|${_inShortsWorld ? 1 : 0}`;
    if (_blurCache.has(fullKey)) {
      const hitCv = _blurCache.get(fullKey);
      _blurCache.delete(fullKey);
      _blurCache.set(fullKey, hitCv);
      c.save(); c.drawImage(hitCv, 0, 0, W, H); c.restore();
      return;
    }
    if (_blurCache.size >= _BLUR_CACHE_MAX) {
      const oldestKey = _blurCache.keys().next().value;
      _blurCache.delete(oldestKey);
    }
    ensureOffscreenSize(_tmp, rs);
    const wasShortsRig = _inShortsRig;
    _inShortsRig = false;
    try {
      _tc.setTransform(rs, 0, 0, rs, 0, 0); _tc.clearRect(0, 0, W, H); fn(_tc);
    } finally {
      _inShortsRig = wasShortsRig;
    }
    const cacheCv = document.createElement('canvas');
    cacheCv.width = tw; cacheCv.height = th;
    const cacheCtx = cacheCv.getContext('2d');
    cacheCtx.filter = filterStr;
    cacheCtx.drawImage(_tmp, 0, 0);
    _blurCache.set(fullKey, cacheCv);
    c.save(); c.drawImage(cacheCv, 0, 0, W, H); c.restore();
    return;
  }

  ensureOffscreenSize(_tmp, rs);
  const wasShortsRig = _inShortsRig;
  _inShortsRig = false;
  try {
    _tc.setTransform(rs, 0, 0, rs, 0, 0); _tc.clearRect(0, 0, W, H); fn(_tc);
  } finally {
    _inShortsRig = wasShortsRig;
  }
  c.save();
  c.filter = filterStr; c.drawImage(_tmp, 0, 0, W, H); c.restore();
}
function flick(i, t, rate = 1) {
  const a = hash(i * 13.1 + Math.floor(t * 14 * rate));
  const bad = hash(i * 7.7) > 0.78;
  return bad ? (a > 0.55 ? 1 : a > 0.3 ? 0.35 : 0.08) : (a > 0.985 ? 0.4 : 1);
}

// Dynamic Camera Motion Rig: slow push-in, punch snap-zoom, handheld drift, impact shake
function cameraRig(c, lt, dur, o = {}, drawFn = null) {
  const safeDur = Math.max(0.5, Number(dur) || 5);
  const k = clamp(lt / safeDur);
  const fx = o.focusX !== undefined ? o.focusX : W / 2;
  const fy = o.focusY !== undefined ? o.focusY : H / 2;
  const zFrom = o.zoomFrom !== undefined ? o.zoomFrom : (o.handheld !== false ? 1.015 : 1.0);
  const zTo = o.zoomTo !== undefined ? o.zoomTo : (o.push === false ? zFrom : 1.08);
  let scale = lerp(zFrom, zTo, ease(k));
  if (o.snapAt !== undefined) {
    const snapK = easeOut(prog(lt, o.snapAt, o.snapAt + (o.snapDur || 0.14)));
    scale *= 1 + ((o.snapScale || 1.14) - 1) * snapK;
  }
  let tx = (o.panX || 0) * k;
  let ty = (o.panY || 0) * k;
  let rot = 0;
  if (o.handheld !== false) {
    const amp = o.handheldAmp !== undefined ? o.handheldAmp : 1.0;
    tx += Math.sin(lt * 1.9) * 2.2 * amp + Math.cos(lt * 3.1) * 0.9 * amp;
    ty += Math.cos(lt * 1.5) * 1.8 * amp + Math.sin(lt * 2.7) * 0.8 * amp;
    rot += Math.sin(lt * 1.3) * 0.0022 * amp;
  }
  if (o.shakeAt !== undefined && lt >= o.shakeAt) {
    const dt = lt - o.shakeAt;
    const shDur = o.shakeDur || 0.35;
    if (dt <= shDur) {
      const decay = Math.pow(1 - dt / shDur, 2) * (o.shakeAmp || 9);
      tx += Math.sin(dt * 95) * decay;
      ty += Math.cos(dt * 115) * decay * 0.8;
      rot += Math.sin(dt * 80) * 0.01 * (1 - dt / shDur);
    }
  }
  const apply = () => {
    c.translate(fx + tx, fy + ty);
    if (rot) c.rotate(rot);
    c.scale(scale, scale);
    c.translate(-fx, -fy);
  };
  if (typeof drawFn === 'function') {
    c.save();
    apply();
    drawFn();
    c.restore();
  } else {
    apply();
  }
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
function clampSitArms(arms, defArms, raw = false) {
  if (!arms) return defArms;
  if (raw) return arms;
  return arms.map((A, i) => {
    const d = defArms[i] || defArms[0];
    if (!A || typeof A.a !== 'number') return d;
    let a = A.a, b = typeof A.b === 'number' ? A.b : d.b;
    if (a > 0.62) a = 0.28 + Math.min(0.34, (a - 0.62) * 0.32);
    if (a + b > 1.36) b = Math.max(0.25, 1.32 - a);
    if (a + b < 0.45) b = 0.55 - a;
    return { a, b };
  });
}
function poseKneel(t, o = {}) {
  const defArms = [{ a: 0.36, b: 0.76 }, { a: 0.24, b: 0.72 }];
  return {
    by: o.by !== undefined ? o.by : 58,
    lean: o.lean !== undefined ? o.lean : 0.16,
    legs: o.legs || [{ a: 1.78, b: 1.56 }, { a: 0.72, b: 2.24 }],
    arms: clampSitArms(o.arms, defArms, o.rawArms),
    tilt: o.tilt !== undefined ? o.tilt : 0.08
  };
}
function poseFloorSit(t, o = {}) {
  const breathe = Math.sin(t * 2.0) * 0.012;
  const defArms = [{ a: 0.28, b: 0.78 }, { a: 0.20, b: 0.74 }];
  return {
    by: o.by !== undefined ? o.by : 72,
    lean: (o.lean !== undefined ? o.lean : 0.06) + breathe,
    legs: o.legs || [{ a: 1.32, b: 2.72 }, { a: 1.22, b: 2.66 }],
    arms: clampSitArms(o.arms, defArms, o.rawArms),
    tilt: o.tilt || 0
  };
}
function poseSit(t, o = {}) {
  if (o.floor) return poseFloorSit(t, o);
  const isCurb = Boolean(o.curb || o.low);
  const breathe = Math.sin(t * 2.0) * 0.012;
  const defArms = isCurb
    ? [{ a: 0.32, b: 0.78 }, { a: 0.22, b: 0.74 }]
    : [{ a: 0.26, b: 0.84 }, { a: 0.18, b: 0.80 }];
  return {
    by: o.by !== undefined ? o.by : (isCurb ? 54 : 34),
    lean: o.lean !== undefined ? o.lean : ((isCurb ? 0.08 : 0.02) + breathe),
    legs: o.legs || (isCurb
      ? [{ a: 1.72, b: 1.58 }, { a: 1.64, b: 1.50 }]
      : [{ a: 1.38, b: 1.34 }, { a: 1.30, b: 1.26 }]),
    arms: clampSitArms(o.arms, defArms, o.rawArms),
    tilt: o.tilt || 0
  };
}
function poseSquat(t, o = {}) {
  const defArms = [{ a: 0.42, b: 0.68 }, { a: 0.32, b: 0.66 }];
  return {
    by: o.by !== undefined ? o.by : 64,
    lean: o.lean !== undefined ? o.lean : 0.18,
    legs: o.legs || [{ a: 2.02, b: 2.38 }, { a: 1.94, b: 2.30 }],
    arms: clampSitArms(o.arms, defArms, o.rawArms),
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

// --------------------------------------------------------- PROTAGONIST RIG (1:6.5 Ratio — Painterly Storybook Folk)
const PROTAGONIST = {
  skin: '#E6BDA0', skinHi: '#F1D0B8', skinSh: '#C28C72',
  shirt: '#6B6257', shirtHi: '#857B6F', shirtSh: '#474139',
  pants: '#2F3B42', pantsSh: '#1D262B', shoe: '#1B1A1E', hair: '#221916'
};
const TON = PROTAGONIST;

function _traceStorybookHead(c, isFem, isElder) {
  const w = isFem ? 24.0 : (isElder ? 25.0 : 25.6);
  const chin = isFem ? 30.5 : (isElder ? 32.0 : 32.5);
  c.beginPath();
  c.moveTo(0, -34);
  c.bezierCurveTo(18, -34, w, -20, w - 0.5, -2);
  c.bezierCurveTo(w - 1.5, 15.5, 13, chin - 2, 1.5, chin);
  c.bezierCurveTo(-12, chin - 1, -w, 15, -w, -2);
  c.bezierCurveTo(-w, -20, -18, -34, 0, -34);
  c.closePath();
}

function _drawStorybookEye(c, ex, ey, cfg) {
  const { rightEye, isFem, isElder, exName, noirMood, blink, skinLine, t } = cfg;
  const fear = exName === 'fear' || exName === 'shock';
  const susp = exName === 'suspicious' || exName === 'dread' || exName === 'focus';
  const tired = exName === 'tired';

  const w = rightEye ? 6.0 : 6.9;
  if (blink || exName === 'squint') {
    c.save();
    c.strokeStyle = skinLine;
    c.lineWidth = isFem ? 2.1 : 2.0;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(ex - w * 0.85, ey + 0.5);
    c.quadraticCurveTo(ex, ey + 2.6, ex + w * 0.85, ey + 0.3);
    c.stroke();
    c.restore();
    return;
  }

  const baseH = isElder ? 4.3 : (isFem ? 5.8 : 5.4);
  const h = baseH * (fear ? 1.24 : (susp ? 0.72 : (tired ? 0.78 : 1.0)));
  const tilt = rightEye ? 0.03 : -0.04;

  c.save();
  c.translate(ex, ey);
  c.rotate(tilt);

  // Adaptive V2-D Folk-Noir atmospheric orbital shading on eerie/tense/fear scenes
  if (noirMood) {
    c.fillStyle = 'rgba(84, 58, 78, 0.22)';
    c.beginPath();
    c.ellipse(0, 1.5, w * 1.08, h * 1.18, 0, 0, TAU);
    c.fill();
  }

  const topArch = susp ? -h * 0.46 : ((tired || (noirMood && !fear)) ? -h * 0.86 : -h * 1.12);
  c.beginPath();
  c.moveTo(-w, 0.8);
  c.bezierCurveTo(-w * 0.5, topArch, w * 0.5, topArch, w, 0.3);
  c.bezierCurveTo(w * 0.5, h * 0.90, -w * 0.5, h * 0.92, -w, 0.8);
  c.closePath();
  c.fillStyle = fear ? '#FFFFFF' : '#F8FAFC';
  c.fill();

  c.save();
  c.clip();
  c.fillStyle = 'rgba(100, 116, 139, 0.14)';
  c.fillRect(-w - 2, -h - 2, w * 2 + 4, h * 0.42);

  const lookX = susp ? 2.2 : (0.8 + Math.sin((t || 0) * 1.4) * 0.15);
  const lookY = fear ? 0.2 : -0.1;
  const irisRx = fear ? 2.75 : (isElder ? 3.5 : 4.15);
  const irisRy = fear ? 3.05 : (isElder ? 3.8 : 4.55);

  // V2-A Deep-Chestnut Thai Iris Gradient
  const ig = c.createLinearGradient(lookX, -irisRy, lookX, irisRy);
  ig.addColorStop(0, '#1E130D');
  ig.addColorStop(1, '#6B4026');
  c.fillStyle = ig;
  c.beginPath(); c.ellipse(lookX, lookY, irisRx, irisRy, 0, 0, TAU); c.fill();

  c.fillStyle = '#090A0E';
  c.beginPath();
  c.ellipse(lookX, lookY + 0.1, irisRx * (fear ? 0.42 : 0.52), irisRy * (fear ? 0.42 : 0.52), 0, 0, TAU);
  c.fill();

  // Warm amber-cream lower iris luminance crescent
  c.fillStyle = 'rgba(254, 240, 215, 0.24)';
  c.beginPath(); c.ellipse(lookX, lookY + irisRy * 0.52, irisRx * 0.5, irisRy * 0.2, 0, 0, TAU); c.fill();

  // Primary & micro catchlights
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.arc(lookX + irisRx * 0.38, lookY - irisRy * 0.34, fear ? 0.98 : 1.42, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255, 255, 255, 0.82)';
  c.beginPath(); c.arc(lookX - irisRx * 0.34, lookY + irisRy * 0.32, 0.64, 0, TAU); c.fill();
  c.restore();

  // Sepia upper lash arch
  c.strokeStyle = skinLine;
  c.lineWidth = isFem ? 2.05 : 1.9;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-w - 0.5, 0.8);
  c.bezierCurveTo(-w * 0.5, topArch, w * 0.5, topArch, w + 0.5, 0.25);
  c.stroke();

  if (isFem) {
    c.lineWidth = 1.45;
    c.beginPath();
    if (rightEye) {
      c.moveTo(w + 0.2, 0.2); c.quadraticCurveTo(w + 1.9, -0.4, w + 2.5, -1.5);
    } else {
      c.moveTo(-w - 0.3, 0.7); c.quadraticCurveTo(-w - 1.8, 0.1, -w - 2.4, -1.0);
    }
    c.stroke();
  }

  c.strokeStyle = isElder ? 'rgba(95, 55, 42, 0.45)' : 'rgba(78, 49, 39, 0.32)';
  c.lineWidth = isElder ? 1.05 : 0.85;
  c.beginPath();
  c.moveTo(-w * 0.45, h * 0.84);
  c.quadraticCurveTo(0, h * 0.98, w * 0.45, h * 0.80);
  c.stroke();
  if (isElder) {
    c.strokeStyle = 'rgba(105, 62, 46, 0.32)';
    c.lineWidth = 0.85;
    c.beginPath();
    c.moveTo(-w * 0.3, h * 1.24);
    c.quadraticCurveTo(0, h * 1.40, w * 0.35, h * 1.18);
    c.stroke();
  }
  c.restore();
}

function _drawStorybookHairBack(c, cfg) {
  const { isBack, hairStyle, isElder, hairCol, hairLine, skinCol, skinLine, noirMood } = cfg;
  c.save();
  c.fillStyle = hairCol;
  c.strokeStyle = hairLine;
  c.lineWidth = 1.45;
  c.lineJoin = 'round';
  c.lineCap = 'round';

  if (isBack) {
    if (hairStyle === 'long') {
      c.beginPath();
      c.moveTo(-26, -12); c.bezierCurveTo(-31, -35, -14, -46, 0, -46); c.bezierCurveTo(14, -46, 31, -35, 26, -12);
      c.bezierCurveTo(33, 16, 31, 40, 24, 54); c.quadraticCurveTo(10, 46, 0, 55); c.quadraticCurveTo(-10, 46, -24, 54);
      c.bezierCurveTo(-31, 40, -33, 16, -26, -12);
      c.closePath(); c.fill(); c.stroke();
    } else if (hairStyle === 'bun') {
      c.beginPath();
      c.moveTo(-26, -8); c.bezierCurveTo(-30, -32, -14, -45, 0, -45); c.bezierCurveTo(14, -45, 30, -32, 26, -8);
      c.bezierCurveTo(22, 12, 12, 24, 0, 24); c.bezierCurveTo(-12, 24, -22, 12, -26, -8);
      c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(0, -14, 12.5, 11.5, 0, 0, TAU); c.fill(); c.stroke();
    } else if (hairStyle === 'wolf') {
      c.beginPath();
      c.moveTo(-27, -6); c.bezierCurveTo(-33, -32, -16, -49, 0, -49); c.bezierCurveTo(16, -49, 33, -32, 27, -6);
      c.bezierCurveTo(33, 14, 31, 32, 24, 43); c.quadraticCurveTo(14, 36, 7, 45);
      c.quadraticCurveTo(0, 36, -8, 46); c.quadraticCurveTo(-16, 36, -25, 43);
      c.bezierCurveTo(-31, 30, -33, 14, -27, -6);
      c.closePath(); c.fill(); c.stroke();
    } else if (hairStyle === 'comma' || isElder) {
      c.beginPath();
      c.moveTo(-26, -6); c.bezierCurveTo(-30, -30, -15, -46, 0, -46); c.bezierCurveTo(15, -46, 30, -30, 26, -6);
      c.bezierCurveTo(23, 13, 13, 23, 0, 24); c.bezierCurveTo(-13, 23, -23, 13, -26, -6);
      c.closePath(); c.fill(); c.stroke();
    } else {
      // Polished S6 Rear Undercut: smooth vertical nape fade + overhanging sculpted back crown
      c.beginPath();
      c.moveTo(-24, -13); c.lineTo(24, -13);
      c.bezierCurveTo(22, 10, 12, 20, 0, 20); c.bezierCurveTo(-12, 20, -22, 10, -24, -13);
      c.closePath();
      c.fillStyle = skinCol; c.fill();
      c.save(); c.clip();
      const nf = c.createLinearGradient(0, -14, 0, 17);
      const topStub = hairCol.startsWith('#') && skinCol.startsWith('#') ? mix(hairCol, skinCol, 0.25) : '#3B302C';
      const midStub = hairCol.startsWith('#') && skinCol.startsWith('#') ? mix(hairCol, skinCol, 0.68) : '#7D5C4F';
      const botStub = skinCol.startsWith('#') ? rgba(skinCol, 0) : 'rgba(230, 189, 160, 0)';
      nf.addColorStop(0, topStub); nf.addColorStop(0.55, midStub); nf.addColorStop(1, botStub);
      c.fillStyle = nf; c.fillRect(-26, -15, 52, 36);
      c.restore();
      c.strokeStyle = skinLine; c.lineWidth = 1.25; c.stroke();

      // Overhanging Sculpted Upper Back Mass
      c.fillStyle = hairCol; c.strokeStyle = hairLine; c.lineWidth = 1.45;
      c.beginPath();
      c.moveTo(-28, -14);
      c.bezierCurveTo(-30, -37, -14, -52, 0, -54);
      c.bezierCurveTo(14, -52, 30, -37, 28, -14);
      c.quadraticCurveTo(14, -6, 0, -4);
      c.quadraticCurveTo(-14, -6, -28, -14);
      c.closePath(); c.fill();
      c.save(); c.clip();
      c.strokeStyle = 'rgba(12, 10, 14, 0.36)'; c.lineWidth = 1.05;
      c.beginPath();
      c.moveTo(-14, -46); c.quadraticCurveTo(-12, -28, -8, -10);
      c.moveTo(14, -46); c.quadraticCurveTo(12, -28, 8, -10);
      c.stroke();
      c.restore();
      c.stroke();
    }
    c.strokeStyle = noirMood ? 'rgba(167, 139, 250, 0.34)' : 'rgba(125, 211, 252, 0.32)';
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-24, -22); c.bezierCurveTo(-16, -44, 16, -44, 24, -22); c.stroke();
  } else {
    // Behind-ear back layers on 3/4 view
    if (hairStyle === 'bun') {
      c.beginPath(); c.ellipse(-28, -2, 10.5, 12.5, -0.25, 0, TAU); c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(-33, 7); c.quadraticCurveTo(-35, 17, -29, 24); c.quadraticCurveTo(-26, 16, -25, 9);
      c.closePath(); c.fill(); c.stroke();
    } else if (hairStyle === 'wolf') {
      c.fillStyle = mix(hairCol, '#000000', 0.18);
      c.beginPath();
      c.moveTo(-24, -6); c.bezierCurveTo(-34, 8, -36, 24, -31, 38);
      c.quadraticCurveTo(-24, 31, -21, 41); c.quadraticCurveTo(-15, 32, -8, 35);
      c.quadraticCurveTo(-5, 24, -5, 10);
      c.closePath(); c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(21, -8); c.bezierCurveTo(28, 2, 30, 12, 26, 22);
      c.quadraticCurveTo(22, 16, 19, 18); c.closePath(); c.fill(); c.stroke();
    } else if (hairStyle === 'comma' || isElder) {
      c.fillStyle = mix(hairCol, '#000000', 0.16);
      c.beginPath();
      c.moveTo(-23, -2); c.bezierCurveTo(-27, 8, -24, 16, -15, 20);
      c.lineTo(-6, 15); c.lineTo(-10, -2); c.closePath(); c.fill(); c.stroke();
    }
  }
  c.restore();
}

function _drawStorybookHairFront(c, cfg) {
  const { hairStyle, isElder, hairCol, hairLine, noirMood } = cfg;
  c.save();
  c.fillStyle = hairCol;
  c.strokeStyle = hairLine;
  c.lineWidth = 1.4;
  c.lineJoin = 'round';
  c.lineCap = 'round';

  const flows = [];
  const isFemBangs = !isElder && (hairStyle === 'long' || hairStyle === 'bun');
  const isUndercut = !isElder && !isFemBangs && hairStyle !== 'comma' && hairStyle !== 'wolf';

  if (isUndercut) {
    // 2.5D Soft Cast Shadow directly under overhanging wavy fringe
    c.fillStyle = 'rgba(18, 12, 10, 0.30)';
    c.beginPath();
    c.moveTo(-27, -19); c.quadraticCurveTo(-12, -11, 2, -16); c.quadraticCurveTo(16, -15, 28, -14);
    c.lineTo(28, -22); c.lineTo(-27, -24); c.closePath(); c.fill();
    c.fillStyle = hairCol;
  } else if (isFemBangs) {
    // Soft warm cast shadow directly under airy curved bangs
    c.fillStyle = 'rgba(90, 48, 36, 0.14)';
    c.beginPath();
    c.moveTo(-19, -14);
    c.quadraticCurveTo(-9, -8, 0, -9);
    c.quadraticCurveTo(10, -8, 19, -14);
    c.lineTo(19, -20);
    c.lineTo(-19, -20);
    c.closePath();
    c.fill();
    c.fillStyle = hairCol;
  }

  const hairPath = new Path2D();
  if (isFemBangs) {
    // Cute soft airy curved bangs + cheek-framing side locks (หน้าม้าน่ารักๆ)
    hairPath.moveTo(-26, 2);
    hairPath.bezierCurveTo(-30, -22, -19, -47, 0, -47);
    hairPath.bezierCurveTo(19, -47, 30, -23, 26, 2);
    hairPath.quadraticCurveTo(25, 11, 21, 14);
    hairPath.bezierCurveTo(20, 4, 20, -8, 17, -15);
    hairPath.quadraticCurveTo(13, -11, 9, -12);
    hairPath.quadraticCurveTo(10, -17, 7, -19);
    hairPath.quadraticCurveTo(6, -14, 4, -11);
    hairPath.quadraticCurveTo(0, -10, -4, -11);
    hairPath.quadraticCurveTo(-5, -15, -6, -19);
    hairPath.quadraticCurveTo(-8, -14, -10, -12);
    hairPath.quadraticCurveTo(-14, -11, -17, -15);
    hairPath.bezierCurveTo(-20, -8, -20, 5, -21, 15);
    hairPath.quadraticCurveTo(-25, 11, -26, 2);
    hairPath.closePath();
    flows.push([[-11, -43], [-12, -28], [-11, -15]]);
    flows.push([[0, -45], [0, -30], [-1, -14]]);
    flows.push([[12, -42], [14, -27], [13, -15]]);
  } else if (isElder) {
    hairPath.moveTo(-25, -2);
    hairPath.bezierCurveTo(-30, -24, -19, -46, 1, -46);
    hairPath.bezierCurveTo(20, -46, 29, -27, 26, -5);
    hairPath.bezierCurveTo(22, -19, 13, -26, 2, -25);
    hairPath.bezierCurveTo(-3, -18, -6, -15, -8, -17);
    hairPath.bezierCurveTo(-6, -22, -8, -25, -12, -24);
    hairPath.bezierCurveTo(-18, -19, -20, -6, -22, 7);
    hairPath.quadraticCurveTo(-25, 2, -25, -2);
    hairPath.closePath();
    flows.push([[-10, -43], [-2, -33], [9, -27]]);
    flows.push([[4, -43], [14, -34], [21, -21]]);
  } else if (hairStyle === 'comma') {
    hairPath.moveTo(-26, -3);
    hairPath.bezierCurveTo(-32, -26, -22, -49, -4, -50);
    hairPath.bezierCurveTo(4, -50, 9, -46, 13, -44);
    hairPath.bezierCurveTo(24, -46, 33, -29, 27, -4);
    hairPath.bezierCurveTo(26, -11, 22, -19, 17, -23);
    hairPath.bezierCurveTo(15, -13, 10, -8, 6, -9);
    hairPath.bezierCurveTo(11, -15, 11, -22, 7, -25);
    hairPath.bezierCurveTo(2, -14, -3, -8, -7, -9);
    hairPath.bezierCurveTo(-4, -16, -5, -22, -10, -24);
    hairPath.bezierCurveTo(-18, -17, -20, -4, -22, 10);
    hairPath.quadraticCurveTo(-25, 4, -26, -3);
    hairPath.closePath();
    flows.push([[-6, -48], [2, -33], [1, -20]]);
    flows.push([[-19, -37], [-12, -26], [-8, -18]]);
  } else if (hairStyle === 'wolf') {
    hairPath.moveTo(-28, 2);
    hairPath.bezierCurveTo(-36, -22, -25, -49, -5, -51);
    hairPath.quadraticCurveTo(1, -55, 7, -49);
    hairPath.bezierCurveTo(25, -49, 34, -28, 28, 0);
    hairPath.quadraticCurveTo(26, -12, 22, -19);
    hairPath.bezierCurveTo(19, -9, 15, -4, 12, -8);
    hairPath.bezierCurveTo(14, -16, 9, -22, 4, -10);
    hairPath.bezierCurveTo(-1, -11, -3, -20, -7, -22);
    hairPath.bezierCurveTo(-12, -10, -16, -3, -19, 12);
    hairPath.quadraticCurveTo(-24, 6, -28, 2);
    hairPath.closePath();
    flows.push([[-5, -49], [-2, -33], [-4, -19]]);
    flows.push([[12, -45], [17, -30], [18, -16]]);
  } else {
    // Polished S6 Modern Textured Undercut (sculpted asymmetric crown + 3 unequal tapered wavy locks)
    hairPath.moveTo(-27, -21);
    hairPath.bezierCurveTo(-27, -39, -15, -54, 1, -55);
    hairPath.bezierCurveTo(17, -56, 30, -42, 31, -23);
    hairPath.bezierCurveTo(31, -17, 29, -11, 25, -10);
    hairPath.bezierCurveTo(26, -16, 23, -21, 18, -22);
    hairPath.bezierCurveTo(15, -14, 10, -9, 6, -10);
    hairPath.bezierCurveTo(9, -16, 8, -22, 2, -24);
    hairPath.bezierCurveTo(-3, -17, -8, -13, -12, -15);
    hairPath.bezierCurveTo(-11, -19, -14, -23, -19, -20);
    hairPath.quadraticCurveTo(-23, -19, -27, -21);
    hairPath.closePath();
    flows.push([[-11, -51], [1, -43], [14, -28]]);
    flows.push([[-18, -40], [-7, -33], [3, -25]]);
    flows.push([[12, -51], [21, -39], [25, -24]]);
  }

  c.fill(hairPath);

  c.save();
  c.clip(hairPath);
  c.strokeStyle = isElder ? 'rgba(248, 250, 252, 0.36)' : 'rgba(125, 211, 252, 0.16)';
  c.lineWidth = 1.9;
  c.beginPath();
  if (isFemBangs) {
    c.moveTo(-14, -35); c.quadraticCurveTo(-7, -38, -2, -33);
    c.moveTo(4, -34); c.quadraticCurveTo(11, -36, 16, -30);
  } else {
    c.moveTo(-13, -38); c.quadraticCurveTo(-6, -40, -1, -35);
    c.moveTo(6, -36); c.quadraticCurveTo(13, -37, 18, -30);
  }
  c.stroke();

  c.strokeStyle = isElder ? 'rgba(71, 85, 105, 0.44)' : 'rgba(12, 10, 14, 0.44)';
  c.lineWidth = 1.05;
  for (const fl of flows) {
    c.beginPath();
    c.moveTo(fl[0][0], fl[0][1]);
    c.quadraticCurveTo(fl[1][0], fl[1][1], fl[2][0], fl[2][1]);
    c.stroke();
  }

  c.strokeStyle = noirMood ? 'rgba(167, 139, 250, 0.38)' : 'rgba(125, 211, 252, 0.36)';
  c.lineWidth = 2.0;
  c.beginPath();
  if (isFemBangs) {
    c.moveTo(-26, -15);
    c.bezierCurveTo(-24, -36, -11, -46, 6, -46);
  } else {
    c.moveTo(-27, -21);
    c.bezierCurveTo(-25, -43, -11, -52, 6, -52);
  }
  c.stroke();
  c.restore();

  c.stroke(hairPath);
  c.restore();
}

function drawBoot(c, ax, ay, thin, K, clothLine, isBack, isFar) {
  const bootCol = isFar && typeof K.shoe === 'string' && K.shoe.startsWith('#') ? mix(K.shoe, '#000000', 0.22) : K.shoe;
  c.save();
  if (isBack) {
    const bw = 7.5 * thin;
    rr(c, ax - bw, ay - 4.5, bw * 2, 8.0, [3, 3, 2.5, 2.5]);
    c.fillStyle = bootCol; c.fill();
    c.fillStyle = 'rgba(148, 163, 184, 0.20)';
    c.fillRect(ax - bw + 1, ay + 1.4, bw * 2 - 2, 1.8);
    rr(c, ax - bw, ay - 4.5, bw * 2, 8.0, [3, 3, 2.5, 2.5]);
    c.strokeStyle = clothLine; c.lineWidth = 1.15; c.stroke();
  } else {
    const p = new Path2D();
    p.moveTo(ax - 6.5 * thin, ay + 3.5);
    p.lineTo(ax + 15.5 * thin, ay + 3.5);
    p.quadraticCurveTo(ax + 17.5 * thin, ay + 1.0, ax + 15.0 * thin, ay - 1.2);
    p.quadraticCurveTo(ax + 9.5 * thin, ay - 2.6, ax + 5.5 * thin, ay - 4.5);
    p.lineTo(ax - 6.0 * thin, ay - 4.5);
    p.quadraticCurveTo(ax - 7.5 * thin, ay - 0.5, ax - 6.5 * thin, ay + 3.5);
    p.closePath();
    c.fillStyle = bootCol; c.fill(p);
    c.save(); c.clip(p);
    c.fillStyle = 'rgba(148, 163, 184, 0.22)';
    c.fillRect(ax - 8, ay + 1.4, 27, 2.4);
    c.fillStyle = 'rgba(255, 245, 230, 0.10)';
    c.beginPath(); c.ellipse(ax + 8.5 * thin, ay - 1.2, 5 * thin, 1.5, 0.15, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = clothLine; c.lineWidth = 1.15; c.lineJoin = 'round'; c.stroke(p);
  }
  c.restore();
}

function drawTrouserLeg(c, hx, hy, kx, ky, ax, ay, thin, col, sh, clothLine, L, isFar) {
  const cuffX = lerp(kx, ax, 0.90), cuffY = lerp(ky, ay, 0.90);
  const rHip = 9.2 * thin, rKnee = 7.4 * thin, rAnk = 5.6 * thin;
  const kneeBend = Math.abs(L?.b || 0);

  const tDx = kx - hx, tDy = ky - hy, tL = Math.hypot(tDx, tDy) || 1;
  const tx = tDx / tL, ty = tDy / tL;
  const hfX = ty, hfY = -tx, hbX = -ty, hbY = tx;

  const sDx = cuffX - kx, sDy = cuffY - ky, sL = Math.hypot(sDx, sDy) || 1;
  const sx = sDx / sL, sy = sDy / sL;
  const afX = sy, afY = -sx, abX = -sy, abY = sx;

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';

  if (kneeBend < 1.05) {
    const rawKfX = hfX + afX, rawKfY = hfY + afY;
    const kL = Math.hypot(rawKfX, rawKfY) || 1;
    const kfX = rawKfX / kL, kfY = rawKfY / kL;
    const kbX = -kfX, kbY = -kfY;

    const hFx = hx + hfX * rHip, hFy = hy + hfY * rHip;
    const hBx = hx + hbX * rHip, hBy = hy + hbY * rHip;
    const kFx = kx + kfX * rKnee * 1.12, kFy = ky + kfY * rKnee * 1.12;
    const kBx = kx + kbX * rKnee * 0.94, kBy = ky + kbY * rKnee * 0.94;
    const cFx = cuffX + afX * rAnk, cFy = cuffY + afY * rAnk;
    const cBx = cuffX + abX * rAnk, cBy = cuffY + abY * rAnk;

    const legPath = new Path2D();
    legPath.moveTo(hFx, hFy);
    legPath.quadraticCurveTo(kFx, kFy, cFx, cFy);
    legPath.quadraticCurveTo(cuffX + sx * 1.5, cuffY + sy * 1.5, cBx, cBy);
    legPath.quadraticCurveTo(kBx, kBy, hBx, hBy);
    legPath.closePath();

    c.fillStyle = col;
    c.fill(legPath);

    c.save();
    c.clip(legPath);
    if (sh) {
      c.strokeStyle = sh; c.lineWidth = rKnee * 0.9;
      c.beginPath(); c.moveTo(hBx, hBy); c.quadraticCurveTo(kBx, kBy, cBx, cBy); c.stroke();
    }
    c.strokeStyle = isFar ? 'rgba(125, 211, 252, 0.08)' : 'rgba(125, 211, 252, 0.16)';
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(hFx, hFy); c.quadraticCurveTo(kFx, kFy, cFx, cFy); c.stroke();
    if (kneeBend > 0.18) {
      c.strokeStyle = 'rgba(15, 12, 16, 0.28)'; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(kx + kbX * rKnee * 0.45, ky + kbY * rKnee * 0.45); c.lineTo(kx + kbX * 1.5, ky + kbY * 1.5); c.stroke();
    }
    c.restore();

    // Tailored trouser contour (omit top hip edge so leg blends seamlessly into pelvis)
    c.strokeStyle = clothLine; c.lineWidth = 1.35;
    c.beginPath();
    c.moveTo(hFx, hFy);
    c.quadraticCurveTo(kFx, kFy, cFx, cFy);
    c.quadraticCurveTo(cuffX + sx * 1.5, cuffY + sy * 1.5, cBx, cBy);
    c.quadraticCurveTo(kBx, kBy, hBx, hBy);
    c.stroke();
  } else {
    // High-flexion pose (Sit / Squat / Kneel): cleanly overlapped shin + thigh with rounded knee cap
    const sTopFx = kx + afX * rKnee, sTopFy = ky + afY * rKnee;
    const sTopBx = kx + abX * rKnee, sTopBy = ky + abY * rKnee;
    const cFx = cuffX + afX * rAnk, cFy = cuffY + afY * rAnk;
    const cBx = cuffX + abX * rAnk, cBy = cuffY + abY * rAnk;

    const shinPath = new Path2D();
    shinPath.moveTo(sTopFx, sTopFy);
    shinPath.lineTo(cFx, cFy);
    shinPath.quadraticCurveTo(cuffX + sx * 1.5, cuffY + sy * 1.5, cBx, cBy);
    shinPath.lineTo(sTopBx, sTopBy);
    shinPath.closePath();

    c.fillStyle = col; c.fill(shinPath);
    c.save(); c.clip(shinPath);
    if (sh) {
      c.strokeStyle = sh; c.lineWidth = rKnee * 0.85;
      c.beginPath(); c.moveTo(sTopBx, sTopBy); c.lineTo(cBx, cBy); c.stroke();
    }
    c.strokeStyle = isFar ? 'rgba(125, 211, 252, 0.08)' : 'rgba(125, 211, 252, 0.16)';
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(sTopFx, sTopFy); c.lineTo(cFx, cFy); c.stroke();
    c.restore();

    c.strokeStyle = clothLine; c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(sTopFx, sTopFy); c.lineTo(cFx, cFy);
    c.quadraticCurveTo(cuffX + sx * 1.5, cuffY + sy * 1.5, cBx, cBy);
    c.lineTo(sTopBx, sTopBy);
    c.stroke();

    const hFx = hx + hfX * rHip, hFy = hy + hfY * rHip;
    const hBx = hx + hbX * rHip, hBy = hy + hbY * rHip;
    const tEndFx = kx + hfX * rKnee, tEndFy = ky + hfY * rKnee;
    const tEndBx = kx + hbX * rKnee, tEndBy = ky + hbY * rKnee;

    const thighPath = new Path2D();
    thighPath.moveTo(hFx, hFy);
    thighPath.lineTo(tEndFx, tEndFy);
    thighPath.quadraticCurveTo(kx + tx * rKnee * 1.25, ky + ty * rKnee * 1.25, tEndBx, tEndBy);
    thighPath.lineTo(hBx, hBy);
    thighPath.closePath();

    c.fillStyle = col; c.fill(thighPath);
    c.save(); c.clip(thighPath);
    if (sh) {
      c.strokeStyle = sh; c.lineWidth = rKnee * 0.85;
      c.beginPath(); c.moveTo(hBx, hBy); c.lineTo(tEndBx, tEndBy); c.stroke();
    }
    c.strokeStyle = isFar ? 'rgba(125, 211, 252, 0.08)' : 'rgba(125, 211, 252, 0.16)';
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(hFx, hFy); c.lineTo(tEndFx, tEndFy); c.stroke();
    c.restore();

    c.strokeStyle = clothLine; c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(hFx, hFy);
    c.lineTo(tEndFx, tEndFy);
    c.quadraticCurveTo(kx + tx * rKnee * 1.25, ky + ty * rKnee * 1.25, tEndBx, tEndBy);
    c.lineTo(hBx, hBy);
    c.stroke();
  }
  c.restore();
}

function drawPerson(c, x, y, s, o = {}) {
  const P = o.pose || poseStand(o.t || 0);
  const isElder = Boolean(o.elder);
  const hairStyle = o.hairStyle || (o.female ? 'long' : 'short');
  const isFem = !!(o.female || o.sinh || hairStyle === 'long' || hairStyle === 'bun');
  const K = {
    ...PROTAGONIST,
    ...(isElder ? { skin: '#D5AA8C', skinHi: '#E3BF9F', skinSh: '#AD7E66', hair: '#94A3B8' } : {}),
    ...(o.colors || {})
  };
  const thin = (o.thin ? 0.84 : 1) * (isFem ? 0.92 : 1);
  const shiverX = o.shiver ? Math.sin((o.t || 0) * 42) * 1.6 : 0;
  const skinLine = '#52342A';
  const hairLine = isElder ? '#475569' : '#241B18';
  const clothLine = '#312A28';

  c.save(); c.translate(x + shiverX, y); const _rc = applyShortsRigComp(c); c.scale(s * (o.dir || 1), s);
  if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,0.24)'; c.beginPath(); c.ellipse(0, 0, 34, 6, 0, 0, TAU); c.fill(); }
  const by = P.by || 0, hipY = -92 + by, torsoH = 64, lean = P.lean || 0;
  const pivotHip = () => { if (lean) { c.translate(0, hipY); c.rotate(lean); c.translate(0, -hipY); } };
  const legPts = (hx, L) => {
    const kx = hx + 45 * Math.sin(L.a), ky = hipY + 45 * Math.cos(L.a);
    const sa = L.a - L.b, ax = kx + 45 * Math.sin(sa), ay = ky + 45 * Math.cos(sa);
    return { kx, ky, ax, ay };
  };
  const leg = (hx, L, col, sh, isFar = false) => {
    const { kx, ky, ax, ay } = legPts(hx, L);
    if (!o.sinh) {
      drawBoot(c, ax, ay, thin, K, clothLine, Boolean(o.back), isFar);
      drawTrouserLeg(c, hx, hipY, kx, ky, ax, ay, thin, col, sh, clothLine, L, isFar);
    } else {
      const calfEndX = lerp(kx, ax, 0.90), calfEndY = lerp(ky, ay, 0.90);
      limb(c, lerp(kx, ax, 0.55), lerp(ky, ay, 0.55), calfEndX, calfEndY, 11.5 * thin, col, sh);
      drawBoot(c, ax, ay, thin, K, clothLine, Boolean(o.back), isFar);
    }
  };
  const backHx = o.back ? -7.2 * thin : -5.5 * thin;
  const frontHx = o.back ? 7.2 * thin : 5.5 * thin;
  const p0Pre = legPts(frontHx, P.legs[0]);
  const isHighKnee = !o.sinh && (by > 20 || p0Pre.ky < hipY + 8);
  const sh = (i) => {
    if (o.back) return [(i ? -16 : 16) * thin, -144 + by];
    return [(i ? 11 : -11) * thin, -144 + by];
  };
  const arm = (i, A, col) => {
    const [sx, sy] = sh(i);
    const ex = sx + 32 * Math.sin(A.a), ey = sy + 32 * Math.cos(A.a);
    const fa = A.a + A.b, wx = ex + 30 * Math.sin(fa), wy = ey + 30 * Math.cos(fa);
    limbContour2(c, sx, sy, ex, ey, wx, wy, 12.5 * thin);
    limb(c, sx, sy, ex, ey, 12.5 * thin, col, K.shirtSh, { contour: false });
    // Subtle sleeve cuff seam at elbow transition
    c.strokeStyle = 'rgba(49, 42, 40, 0.42)'; c.lineWidth = 1.2;
    const enx = -Math.cos(A.a) * 5.2 * thin, eny = Math.sin(A.a) * 5.2 * thin;
    c.beginPath(); c.moveTo(ex - enx, ey - eny); c.lineTo(ex + enx, ey + eny); c.stroke();
    limb(c, ex, ey, wx, wy, 10.5 * thin, K.skin, K.skinSh, { contour: false });
    c.fillStyle = K.skinSh; c.beginPath(); c.arc(wx, wy + 0.8, 6.8, 0, TAU); c.fill();
    c.fillStyle = K.skin; c.beginPath(); c.arc(wx, wy, 6.2, 0, TAU); c.fill();
    c.strokeStyle = skinLine; c.lineWidth = 1.15; c.stroke();
    return [wx, wy, fa];
  };

  // Back limbs & behind-shoulder long hair (when o.back, draw far arm behind legs/seat so inward swing stays occluded)
  let backArm;
  if (o.back) {
    c.save(); pivotHip();
    backArm = arm(1, P.arms[1], mix(K.shirt, '#000000', 0.16));
    c.restore();
    leg(backHx, P.legs[1], o.sinh ? mix(K.skinSh, '#000000', 0.14) : mix(K.pants, '#000000', 0.24), null, true);
  } else {
    leg(backHx, P.legs[1], o.sinh ? mix(K.skinSh, '#000000', 0.14) : mix(K.pants, '#000000', 0.24), null, true);
    c.save(); pivotHip();
    backArm = arm(1, P.arms[1], mix(K.shirt, '#000000', 0.16));
    if (hairStyle === 'long') {
      const hairSway = Math.sin((o.t || 0) * 4.5) * 2.2;
      c.fillStyle = mix(K.hair, '#000000', 0.18);
      c.strokeStyle = hairLine; c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(-25, -206 + by);
      c.bezierCurveTo(-34 + hairSway, -168 + by, -35 + hairSway, -138 + by, -28 + hairSway, -118 + by);
      c.quadraticCurveTo(-8 + hairSway * 0.5, -124 + by, 18 + hairSway * 0.4, -120 + by);
      c.bezierCurveTo(26, -150 + by, 26, -182 + by, 22, -204 + by);
      c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }

  const chestW = (isFem ? 38 : 44) * thin, chestX = -chestW / 2;
  const hipW = (isFem ? 44 : 42) * thin;
  const drawPelvis = () => {
    const pelvTopW = Math.max((isFem ? 36 : 39) * thin, chestW * 0.88);
    const pelvBotW = o.back ? 32 * thin : 30 * thin;
    const pelvTop = hipY - 4;
    const pelvBot = o.back ? hipY + 13 : hipY + 11;
    const pelvHi = typeof K.pants === 'string' && K.pants.startsWith('#') ? mix(K.pants, '#FFFFFF', 0.08) : K.pants;
    const p = new Path2D();
    p.moveTo(-pelvTopW / 2, pelvTop);
    p.lineTo(pelvTopW / 2, pelvTop);
    p.quadraticCurveTo(pelvTopW * 0.50, hipY + 4, pelvBotW / 2, pelvBot);
    p.quadraticCurveTo(0, pelvBot + (o.back ? 4 : 3), -pelvBotW / 2, pelvBot);
    p.quadraticCurveTo(-pelvTopW * 0.50, hipY + 4, -pelvTopW / 2, pelvTop);
    p.closePath();
    c.fillStyle = cyl(c, -pelvTopW / 2, pelvTopW, K.pants, pelvHi, K.pantsSh);
    c.fill(p);
    c.strokeStyle = clothLine; c.lineWidth = 1.35; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(pelvTopW / 2, pelvTop);
    c.quadraticCurveTo(pelvTopW * 0.50, hipY + 4, pelvBotW / 2, pelvBot);
    c.moveTo(-pelvTopW / 2, pelvTop);
    c.quadraticCurveTo(-pelvTopW * 0.50, hipY + 4, -pelvBotW / 2, pelvBot);
    c.stroke();
  };

  // Front leg drawn underneath shirt hem in standing/walking/back poses; under sinh for Thai skirt
  if (o.sinh) {
    leg(frontHx, P.legs[0], K.skin, K.skinSh, false);
  } else if (!isHighKnee) {
    c.save(); pivotHip(); drawPelvis(); c.restore();
    leg(frontHx, P.legs[0], K.pants, K.pantsSh, false);
  }

  // Torso (painterly tailored silhouette with warm sepia-umber contour & fold details)
  c.save(); pivotHip();
  c.fillStyle = cyl(c, chestX, chestW, K.shirt, K.shirtHi, K.shirtSh); rr(c, chestX, -152 + by, chestW, torsoH, [12, 12, 5, 5]); c.fill();
  // Optional vest layering (clean V2 rural vest look)
  if (o.vest) {
    const vestCol = typeof o.vest === 'string' ? o.vest : '#2F3B36';
    c.fillStyle = vestCol;
    rr(c, chestX + 1, -151 + by, chestW * 0.34, torsoH - 2, [10, 2, 2, 5]); c.fill();
    rr(c, -chestX - chestW * 0.34 - 1, -151 + by, chestW * 0.34, torsoH - 2, [2, 10, 5, 2]); c.fill();
  }
  rr(c, chestX, -152 + by, chestW, torsoH, [12, 12, 5, 5]);
  c.strokeStyle = clothLine; c.lineWidth = 1.45; c.stroke();
  if (!o.sinh && !isHighKnee) {
    c.fillStyle = 'rgba(15, 12, 16, 0.22)';
    c.fillRect(chestX + 4, -88 + by, chestW - 8, 3);
  }

  // Twilight rim edge + soft shirt fold creases
  c.strokeStyle = 'rgba(125, 211, 252, 0.30)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(chestX + 2.5, -145 + by); c.lineTo(chestX + 2.5, -104 + by); c.stroke();
  c.strokeStyle = 'rgba(49, 42, 40, 0.32)'; c.lineWidth = 1.25; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-chestW * 0.26, -128 + by); c.quadraticCurveTo(-2, -122 + by, chestW * 0.16, -126 + by);
  c.moveTo(-chestW * 0.18, -112 + by); c.quadraticCurveTo(4, -107 + by, chestW * 0.22, -113 + by);
  c.stroke();

  if (o.swollenBelly) {
    c.fillStyle = cyl(c, -12, 38, K.shirt, K.shirtHi, K.shirtSh);
    c.beginPath(); c.ellipse(9 * thin, -110 + by, 18, 15, 0.12, 0, TAU); c.fill();
    c.strokeStyle = clothLine; c.lineWidth = 1.4;
    c.beginPath(); c.arc(9 * thin, -108 + by, 16, 0.15 * Math.PI, 0.78 * Math.PI); c.stroke();
  }
  if (o.sinh) {
    c.fillStyle = typeof o.sinh === 'string' ? o.sinh : (K.sinh || '#4A2525');
    rr(c, -hipW * 0.44, -95 + by, hipW * 0.88, 10, 4); c.fill();
  }

  if (o.phakhaoma) {
    c.save();
    c.beginPath();
    c.moveTo(-chestW * 0.42, -151 + by);
    c.lineTo(-chestW * 0.18, -152 + by);
    c.quadraticCurveTo(2, -125 + by, hipW * 0.42, -92 + by);
    c.lineTo(hipW * 0.16, -92 + by);
    c.closePath();
    c.fillStyle = typeof o.phakhaoma === 'string' ? o.phakhaoma : '#991B1B';
    c.fill();
    c.clip();
    c.fillStyle = 'rgba(250, 204, 21, 0.30)';
    for (let py = -154 + by; py < -90 + by; py += 9) c.fillRect(-30, py, 60, 2.5);
    c.fillStyle = 'rgba(255, 255, 255, 0.24)';
    for (let px = -26; px < 26; px += 9) c.fillRect(px, -155 + by, 2.5, 65);
    c.restore();
    c.strokeStyle = clothLine; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-chestW * 0.42, -151 + by);
    c.lineTo(-chestW * 0.18, -152 + by);
    c.quadraticCurveTo(2, -125 + by, hipW * 0.42, -92 + by);
    c.lineTo(hipW * 0.16, -92 + by);
    c.closePath(); c.stroke();
  } else if (o.sash) {
    const sashCol = typeof o.sash === 'string' ? o.sash : '#991B1B';
    c.strokeStyle = sashCol; c.lineWidth = 8.0; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-chestW * 0.34, -144 + by); c.lineTo(hipW * 0.40, -94 + by); c.stroke();
    c.strokeStyle = 'rgba(253, 230, 138, 0.42)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-chestW * 0.34 + 1.5, -144 + by); c.lineTo(hipW * 0.40 + 1.5, -94 + by); c.stroke();
    c.fillStyle = sashCol; rr(c, hipW * 0.32, -96 + by, 9, 28, 3); c.fill();
  }

  // Crew tee V-cut & collar lapels (front/side only — omitted on o.back)
  if (!o.back) {
    c.fillStyle = '#F0ECE3';
    c.beginPath(); c.moveTo(-9, -152 + by); c.quadraticCurveTo(0, -138 + by, 9, -152 + by); c.closePath(); c.fill();
    c.fillStyle = K.shirtHi;
    c.strokeStyle = clothLine; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-11, -152 + by); c.quadraticCurveTo(-15, -142 + by, -3, -139 + by); c.lineTo(-8, -151 + by); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(11, -152 + by); c.quadraticCurveTo(15, -142 + by, 3, -139 + by); c.lineTo(8, -151 + by); c.closePath(); c.fill(); c.stroke();
  }
  if (o.tapeArm) { c.fillStyle = '#C3C7CC'; for (let k = 0; k < 3; k++) { rr(c, -20 * thin, -140 + by + k * 14, 40 * thin, 7, 2); c.fill(); } }

  // Slender curved neck with trapezius slope & warm chin shadow (stroke side edges cleanly, no chest loop)
  const nw = isFem ? 5.8 : 6.8;
  c.beginPath();
  c.moveTo(-nw, -163 + by); c.lineTo(nw, -163 + by);
  c.quadraticCurveTo(nw + 1.2, -154 + by, nw + 2.8, -149 + by);
  c.quadraticCurveTo(0, -144 + by, -nw - 2.8, -149 + by);
  c.quadraticCurveTo(-nw - 1.2, -154 + by, -nw, -163 + by);
  c.closePath();
  c.fillStyle = K.skin; c.fill();
  c.save(); c.clip();
  c.fillStyle = K.skinSh;
  c.beginPath(); c.ellipse(0, -158 + by, nw + 5, 7.5, 0, 0, TAU); c.fill();
  c.restore();
  c.strokeStyle = skinLine; c.lineWidth = 1.25; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-nw, -163 + by); c.quadraticCurveTo(-nw - 1.2, -154 + by, -nw - 2.8, -149 + by);
  c.moveTo(nw, -163 + by); c.quadraticCurveTo(nw + 1.2, -154 + by, nw + 2.8, -149 + by);
  c.stroke();

  // Head — Painterly Storybook Folk (V2-C Sepia Lines + V2-A Deep-Chestnut Eyes + Adaptive V2-D Folk-Noir Mood)
  c.save(); c.translate(0, -187 + by); c.rotate(P.tilt || 0); c.scale(0.93, 0.93);
  const ex = o.expr || 'neutral';
  const noirMood = Boolean(
    o.noirMood || ex === 'fear' || ex === 'shock' || ex === 'suspicious' || ex === 'dread' || ex === 'tired'
  );
  const isSideGaze = Boolean(o.profile || o.flashlight || o.torch || o.gazeForward);
  const fear = ex === 'fear' || ex === 'shock';
  const susp = ex === 'suspicious' || ex === 'dread' || ex === 'focus';

  if (o.back) {
    for (const dirEar of [-1, 1]) {
      c.save(); c.scale(dirEar, 1);
      c.beginPath();
      c.moveTo(-23, -7); c.bezierCurveTo(-31, -8.5, -31.5, 4, -24.5, 10); c.quadraticCurveTo(-22, 10.5, -21, 7); c.closePath();
      c.fillStyle = K.skinSh; c.fill();
      c.strokeStyle = skinLine; c.lineWidth = 1.3; c.stroke();
      c.restore();
    }
    _drawStorybookHairBack(c, { isBack: true, hairStyle, isElder, hairCol: K.hair, hairLine, skinCol: K.skin, skinLine, noirMood });
  } else {
    _drawStorybookHairBack(c, { isBack: false, hairStyle, isElder, hairCol: K.hair, hairLine, skinCol: K.skin, skinLine, noirMood });
    // Far curved ear with subtle inner fold
    c.save();
    c.beginPath();
    c.moveTo(-23, -7); c.bezierCurveTo(-30.5, -8.5, -31, 4, -24.5, 10); c.quadraticCurveTo(-22, 10.5, -21, 7); c.closePath();
    c.fillStyle = K.skinSh; c.fill();
    c.strokeStyle = skinLine; c.lineWidth = 1.25; c.stroke();
    c.strokeStyle = 'rgba(110, 55, 42, 0.36)'; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(-27.0, -3); c.quadraticCurveTo(-28.4, 2.5, -25.0, 5.2); c.stroke();
    if (!isSideGaze) {
      c.beginPath();
      c.moveTo(23, -6); c.bezierCurveTo(29.5, -7.5, 30, 4, 24, 9.5); c.quadraticCurveTo(21.5, 10, 20.5, 6.5); c.closePath();
      c.fillStyle = K.skin; c.fill();
      c.strokeStyle = skinLine; c.lineWidth = 1.15; c.stroke();
    }
    c.restore();

    // Smooth Bezier Storybook Face Contour + V2-C Gradient Skin Fill
    _traceStorybookHead(c, isFem, isElder);
    const pg = c.createLinearGradient(-24, -10, 24, 24);
    pg.addColorStop(0, K.skinSh);
    pg.addColorStop(0.32, K.skin);
    pg.addColorStop(1, K.skin);
    c.fillStyle = pg;
    c.fill();

    c.save();
    _traceStorybookHead(c, isFem, isElder);
    c.clip();

    // Soft curved left temple/cheek shadow plane (adaptive V2-D twilight-plum tint when noirMood active!)
    c.fillStyle = noirMood ? 'rgba(118, 82, 94, 0.42)' : 'rgba(182, 120, 102, 0.34)';
    c.beginPath();
    c.moveTo(-29, -40);
    c.lineTo(-10, -40);
    c.bezierCurveTo(-18, -14, -17, 6, -12, 18);
    c.bezierCurveTo(-7, 27, 2, 31, 10, 35);
    c.lineTo(-29, 36);
    c.closePath();
    c.fill();

    // Polished S6 Seamless Vertical Undercut Temple Fade (no hard black bottom outline)
    if (!isElder && hairStyle !== 'long' && hairStyle !== 'bun' && hairStyle !== 'comma' && hairStyle !== 'wolf') {
      const fadeG = c.createLinearGradient(0, -24, 0, 5);
      const topStub = K.hair.startsWith('#') && K.skin.startsWith('#') ? mix(K.hair, K.skin, 0.25) : '#3B302C';
      const midStub = K.hair.startsWith('#') && K.skin.startsWith('#') ? mix(K.hair, K.skin, 0.65) : '#7D5C4F';
      const botStub = K.skin.startsWith('#') ? rgba(K.skin, 0) : 'rgba(230, 189, 160, 0)';
      fadeG.addColorStop(0, topStub);
      fadeG.addColorStop(0.55, midStub);
      fadeG.addColorStop(1, botStub);
      c.fillStyle = fadeG;
      c.beginPath();
      c.moveTo(-28, -25);
      c.lineTo(-12, -25);
      c.quadraticCurveTo(-15, -11, -18, 5);
      c.lineTo(-22, 10);
      c.lineTo(-28, 6);
      c.closePath();
      c.fill();
    }

    if (isFem) {
      c.fillStyle = 'rgba(225, 110, 105, 0.11)';
      c.beginPath(); c.ellipse(-10, 8, 5.5, 2.8, -0.1, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(17, 7, 4.8, 2.4, 0.1, 0, TAU); c.fill();
    }

    const warmIntensity = o.warmBounce ? 0.50 : (o.torch ? 0.32 : ((o.flashlight && fear) ? 0.42 : 0));
    if (warmIntensity > 0) {
      const ug = c.createRadialGradient(6, 34, 3, 6, 12, 42);
      ug.addColorStop(0, `rgba(253, 186, 116, ${warmIntensity})`);
      ug.addColorStop(0.6, `rgba(245, 158, 11, ${(warmIntensity * 0.28).toFixed(2)})`);
      ug.addColorStop(1, 'rgba(245, 158, 11, 0)');
      c.fillStyle = ug; c.fillRect(-32, -38, 66, 78);
    }

    // Soft twilight rim arc along lit/moon edge
    c.strokeStyle = noirMood ? 'rgba(167, 139, 250, 0.55)' : 'rgba(125, 211, 252, 0.56)';
    c.lineWidth = 1.85; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-23, -14); c.bezierCurveTo(-24, 6, -16, 22, -4, 30);
    c.stroke();
    c.restore();

    // Warm sepia outer head contour
    _traceStorybookHead(c, isFem, isElder);
    c.strokeStyle = skinLine; c.lineWidth = 1.45; c.lineJoin = 'round'; c.stroke();

    if (isElder) {
      c.strokeStyle = 'rgba(110, 62, 44, 0.42)'; c.lineWidth = 1.0; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-4, -22); c.quadraticCurveTo(4, -23.5, 11, -21.5);
      c.moveTo(-4.5, 11); c.quadraticCurveTo(-6.5, 17, -4.5, 22);
      c.moveTo(13.5, 11); c.quadraticCurveTo(15.2, 16, 13.5, 21);
      c.stroke();
    }

    const fx = o.profile ? 2.8 : (isSideGaze ? 1.8 : 0);
    const ey = -2.0;
    const lx = -6.8 + fx, rx = 12.6 + fx;
    const blink = o.t != null && (o.t % 3.7) < 0.12;
    _drawStorybookEye(c, lx, ey, { rightEye: false, isFem, isElder, exName: ex, noirMood, blink, skinLine, t: o.t });
    _drawStorybookEye(c, rx, ey, { rightEye: true, isFem, isElder, exName: ex, noirMood, blink, skinLine, t: o.t });

    // Expressive smooth curved brows
    c.strokeStyle = isElder ? '#64748B' : skinLine;
    c.lineWidth = isFem ? 1.55 : (isElder ? 2.2 : 1.9);
    c.lineCap = 'round';
    const by = fear ? -12.6 : (susp ? -9.3 : -10.3);
    const lTilt = fear ? -2.7 : (susp ? 2.1 : 0.4);
    const rTilt = fear ? -2.7 : (susp ? -1.1 : 0.4);
    c.beginPath();
    c.moveTo(lx - 6.8, by + 1.1); c.quadraticCurveTo(lx, by - 1.5, lx + 5.4, by + lTilt); c.stroke();
    c.beginPath();
    c.moveTo(rx - 4.6, by + rTilt); c.quadraticCurveTo(rx + 0.4, by - 1.3, rx + 5.4, by + 1.0); c.stroke();

    // Refined minimal nose (tiny delicate curve + soft underside tint)
    const nx = 4.6 + fx * 0.7, ny = 6.2;
    c.fillStyle = 'rgba(155, 86, 62, 0.20)';
    c.beginPath(); c.ellipse(nx + 0.6, ny + 2.1, 2.2, 1.1, -0.15, 0, TAU); c.fill();
    c.strokeStyle = skinLine; c.lineWidth = 1.05; c.lineCap = 'round';
    c.beginPath(); c.moveTo(nx + 0.8, ny - 2.1); c.quadraticCurveTo(nx + 2.7, ny + 0.8, nx + 0.8, ny + 1.8); c.stroke();

    // Expressive curved mouth + fear gasp + talking + elder mustache
    const mx = 3.4 + fx * 0.7, my = 18.2;
    if (fear) {
      c.fillStyle = '#3B1116'; c.strokeStyle = skinLine; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(mx, my + 1.8, 5.0, 4.1, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#F8FAFC';
      c.beginPath(); c.ellipse(mx, my - 0.5, 3.3, 1.1, 0, 0, TAU); c.fill();
    } else if (o.talking) {
      const mOpen = 1.4 + Math.abs(Math.sin((o.t || 0) * 14)) * 2.8;
      c.fillStyle = '#3B1116'; c.strokeStyle = skinLine; c.lineWidth = 1.3;
      c.beginPath(); c.ellipse(mx, my + 0.8, 4.4, mOpen, 0, 0, TAU); c.fill(); c.stroke();
    } else if (susp) {
      c.strokeStyle = skinLine; c.lineWidth = 1.55; c.lineCap = 'round';
      c.beginPath(); c.moveTo(mx - 5.0, my + 1.2); c.quadraticCurveTo(mx, my - 0.4, mx + 5.2, my + 0.4); c.stroke();
    } else if (ex === 'relief') {
      c.strokeStyle = isFem ? '#8F4046' : skinLine; c.lineWidth = 1.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(mx - 4.8, my - 0.2); c.quadraticCurveTo(mx, my + 3.2, mx + 5.4, my - 0.2); c.stroke();
    } else {
      c.strokeStyle = isFem ? '#8F4046' : skinLine; c.lineWidth = isFem ? 1.45 : 1.55; c.lineCap = 'round';
      c.beginPath(); c.moveTo(mx - 4.6, my + 0.2); c.quadraticCurveTo(mx, my + (isFem ? 1.6 : 0.8), mx + 5.4, my - 0.2); c.stroke();
      if (isFem) {
        c.fillStyle = 'rgba(190, 82, 92, 0.24)';
        c.beginPath(); c.ellipse(mx + 0.4, my + 1.6, 3.5, 1.1, 0, 0, TAU); c.fill();
      }
    }
    if (isElder && !isFem) {
      c.strokeStyle = '#94A3B8'; c.lineWidth = 1.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(mx - 5.2, my - 2.6); c.quadraticCurveTo(mx + 0.4, my - 3.5, mx + 6.0, my - 2.6); c.stroke();
    }

    if (o.sweat) {
      const syDrop = (o.t || 0) * 16 % 8;
      c.fillStyle = 'rgba(186, 230, 253, 0.90)'; c.strokeStyle = skinLine; c.lineWidth = 0.95;
      c.beginPath();
      c.moveTo(-16.2, -13 + syDrop);
      c.bezierCurveTo(-13.4, -7.5 + syDrop, -14.0, -4.0 + syDrop, -16.2, -4.0 + syDrop);
      c.bezierCurveTo(-18.4, -4.0 + syDrop, -19.0, -7.5 + syDrop, -16.2, -13 + syDrop);
      c.fill(); c.stroke();
    }

    if (o.coldBreath) {
      const bt = ((o.t || 0) % 2.4) / 2.4;
      c.save(); c.globalAlpha = (1 - bt) * 0.45;
      c.fillStyle = '#E0F2FE';
      c.beginPath(); c.ellipse(mx + 14 + bt * 26, my - bt * 8, 6 + bt * 10, 4 + bt * 6, 0, 0, TAU); c.fill();
      c.restore();
    }

    // Stylized layered front hair (S6 Modern Textured Undercut default + long/bun/elder/comma/wolf)
    _drawStorybookHairFront(c, { hairStyle, isElder, hairCol: K.hair, hairLine, noirMood });
  }
  c.restore();
  c.restore();

  // Traditional Isan Phaa Sinh (ผ้าซิ่น) OR Trousers front leg
  if (o.sinh) {
    const p0 = legPts(6, P.legs[0]), p1 = legPts(-6, P.legs[1]);
    const sinhCol = typeof o.sinh === 'string' ? o.sinh : (K.sinh || '#4A2525');
    const sinhSh = mix(sinhCol, '#000000', 0.34);
    const sinhHem = K.sinhHem || '#7F2E2E';
    const wL = -19 * thin, wR = 18 * thin, wY = hipY - 8;
    let bL, bR, bY;
    c.save();
    c.beginPath();
    if (by > 20 && by < 66) {
      const kFrontX = Math.max(p0.kx, p1.kx) + 8;
      const kTopY = Math.min(p0.ky, p1.ky) - 7;
      bY = Math.max(p0.ay, p1.ay) - 4;
      bR = Math.max(p0.ax, p1.ax, p0.kx) + 8;
      bL = Math.max(wR - 4, Math.min(p0.ax, p1.ax) - 14);
      const seatBotY = Math.min(bY - 10, hipY + 9);
      c.moveTo(wL, wY);
      c.lineTo(wR, wY);
      c.quadraticCurveTo((wR + kFrontX) * 0.5, kTopY - 2, kFrontX, kTopY + 3);
      c.lineTo(bR, bY);
      c.lineTo(bL, bY);
      c.lineTo(bL - 2, seatBotY);
      c.quadraticCurveTo(wL - 2, seatBotY, wL - 2, hipY + 2);
      c.closePath();
    } else if (by >= 66) {
      const kFrontX = Math.max(p0.kx, p1.kx) + 9;
      const kTopY = Math.min(p0.ky, p1.ky) - 7;
      bY = Math.max(p0.ay, p1.ay, hipY + 14) - 2;
      bL = wL - 4;
      bR = kFrontX + 2;
      c.moveTo(wL, wY);
      c.lineTo(wR, wY);
      c.quadraticCurveTo((wR + kFrontX) * 0.5, kTopY - 2, kFrontX, kTopY + 4);
      c.lineTo(bR, bY);
      c.lineTo(bL, bY);
      c.closePath();
    } else {
      bY = Math.min(-10, Math.max(p0.ay, p1.ay) - 10);
      bL = Math.min(wL - 3, p0.ax - 11, p1.ax - 11);
      bR = Math.max(wR + 3, p0.ax + 12, p1.ax + 12);
      c.moveTo(wL, wY); c.lineTo(wR, wY); c.lineTo(bR, bY); c.lineTo(bL, bY);
      c.closePath();
    }
    c.save();
    c.clip();
    const spanL = Math.min(wL - 6, bL - 6), spanW = Math.max(36, bR - spanL + 12);
    c.fillStyle = cyl(c, spanL, spanW, sinhCol, mix(sinhCol, '#FFFFFF', 0.14), sinhSh);
    c.fillRect(spanL - 10, Math.min(wY, hipY - 20) - 10, spanW + 40, (bY - Math.min(wY, hipY - 20)) + 30);
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 2;
    for (let ry = wY + 14; ry < bY - 12; ry += 14) {
      c.beginPath(); c.moveTo(spanL - 10, ry); c.lineTo(bR + 30, ry); c.stroke();
    }
    c.fillStyle = sinhHem; c.fillRect(spanL - 10, bY - 11, spanW + 40, 14);
    c.fillStyle = 'rgba(250, 204, 21, 0.25)'; c.fillRect(spanL - 10, bY - 12, spanW + 40, 2.5);
    c.restore();
    c.strokeStyle = 'rgba(8, 10, 16, 0.38)'; c.lineWidth = 1.6; c.stroke();
    c.restore();
  } else if (isHighKnee) {
    c.save(); pivotHip(); drawPelvis(); c.restore();
    leg(frontHx, P.legs[0], K.pants, K.pantsSh, false);
  }

  // Front limb & Wrist-Socket Held Props (with thumb & curled finger grip)
  c.save(); pivotHip();
  let frontPose = o.coverMouth ? { a: 2.35, b: 1.05 } : P.arms[0];
  if (o.torch && !o.keepArmPose) {
    frontPose = { a: 0.74 + Math.sin((o.t || 0) * 5) * 0.06, b: 0.72 };
  }
  const front = arm(0, frontPose, K.shirt);
  const wrapGrip = (hx, hy, ang = 0) => {
    c.save(); c.translate(hx, hy); c.rotate(ang);
    c.fillStyle = K.skinSh; rr(c, -4.5, -5.5, 9, 11, 3.5); c.fill();
    c.fillStyle = K.skin; rr(c, -3.5, -4.5, 8, 9, 3); c.fill();
    c.restore();
  };
  if (o.bundle) {
    const bx = front[0], byp = front[1];
    c.fillStyle = '#574636';
    c.beginPath(); c.moveTo(bx - 3, byp); c.lineTo(bx - 16, byp + 26);
    c.quadraticCurveTo(bx, byp + 38, bx + 16, byp + 26); c.lineTo(bx + 3, byp); c.closePath(); c.fill();
    c.strokeStyle = '#3F2E21'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(bx - 6, byp + 7); c.lineTo(bx + 6, byp + 7); c.stroke();
    wrapGrip(bx, byp, 0);
  } else if (o.bag) {
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
    wrapGrip(front[0], front[1], 0);
  }
  if (o.torch) {
    const tx = front[0], ty = front[1], tAng = typeof o.torch === 'object' && o.torch.ang != null ? o.torch.ang : 0.24;
    const tSeed = typeof o.torch === 'object' && o.torch.seed != null ? o.torch.seed : 1;
    const tt = o.t || 0;
    c.save(); c.translate(tx, ty); c.rotate(tAng);
    c.fillStyle = '#4A3728'; rr(c, -3.5, -52, 7, 68, 3); c.fill();
    c.fillStyle = '#291E16'; rr(c, -6.5, -62, 13, 15, 3); c.fill();
    const fl = 0.85 + 0.15 * Math.sin(tt * 22 + tSeed * 5);
    const sway = Math.sin(tt * 14 + tSeed * 3) * 4;
    glow(c, 0, -76, 86 * fl, '#F97316', 0.34);
    c.fillStyle = '#EA580C';
    c.beginPath(); c.moveTo(-10, -60); c.quadraticCurveTo(-12, -82 * fl, sway, -100 * fl); c.quadraticCurveTo(12, -82 * fl, 10, -60); c.closePath(); c.fill();
    c.fillStyle = '#FACC15';
    c.beginPath(); c.moveTo(-5, -62); c.quadraticCurveTo(-6, -74 * fl, sway * 0.6, -86 * fl); c.quadraticCurveTo(6, -74 * fl, 5, -62); c.closePath(); c.fill();
    c.restore();
    wrapGrip(tx, ty, tAng);
  }
  if (o.wand) {
    const wx = front[0], wy = front[1], wAng = typeof o.wand === 'object' && o.wand.ang != null ? o.wand.ang : 1.05;
    const wLen = typeof o.wand === 'object' && o.wand.len != null ? o.wand.len : 88;
    c.save(); c.translate(wx, wy); c.rotate(wAng);
    c.fillStyle = cyl(c, -3, 6, '#C69249', '#E2B870', '#8A5E24');
    c.beginPath(); c.moveTo(-3, 14); c.lineTo(3, 14); c.lineTo(1.8, -wLen); c.lineTo(-1.8, -wLen); c.closePath(); c.fill();
    c.fillStyle = '#B91C1C'; c.fillRect(-3.5, -18, 7, 5);
    c.restore();
    wrapGrip(wx, wy, wAng);
  }
  if (o.weaving) {
    const mx = (front[0] + backArm[0]) * 0.5 + 8, my = (front[1] + backArm[1]) * 0.5 + 2;
    c.save(); c.translate(mx, my);
    c.fillStyle = cyl(c, -16, 32, '#B68D4C', '#D6AF6E', '#8A6530');
    rr(c, -16, -12, 32, 24, 6); c.fill();
    c.strokeStyle = '#6B4E23'; c.lineWidth = 1.6;
    for (let sOff = -2; sOff <= 2; sOff++) {
      c.beginPath(); c.moveTo(sOff * 5, -12); c.lineTo(sOff * 7 + Math.sin((o.t || 0) * 6 + sOff) * 2, -24); c.stroke();
    }
    c.restore();
    wrapGrip(front[0], front[1], 0.4);
  }
  c.restore();
  endShortsRigComp(_rc);
  c.restore();
}

// --------------------------------------------------------- GENERALIZED ENTITY RIG (Correct Z-Index Order)
function drawEntity(c, x, y, s, o = {}) {
  const t = o.t || 0, P = o.pose || poseWalk(t, 0.8, 0.22);
  const suit = o.suit || (o.dark ? '#3F4652' : '#5E6672');
  const suitHi = o.suitHi || (o.dark ? '#4D5562' : '#737C89');
  const suitSh = o.suitSh || (o.dark ? '#2A3039' : '#454C57');
  const skin = o.skin || '#CFD3D8';
  const showAura = o.aura !== undefined ? Boolean(o.aura) : Boolean(o.dark);
  const showTattered = o.tattered !== undefined ? Boolean(o.tattered) : (Boolean(o.dark) && o.cap !== true && o.prop !== 'mop' && o.prop !== true);

  c.save(); c.translate(x, y); const _rc = applyShortsRigComp(c); c.scale(s * (o.dir || 1), s * (o.tall || 1.14));
  if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,0.34)'; c.beginPath(); c.ellipse(0, 0, 42, 8, 0, 0, TAU); c.fill(); }
  const by = P.by || 0, hipY = -96 + by;
  if (showAura) {
    glow(c, 0, -148 + by, 86, o.auraColor || '#020617', 0.42);
  }
  const leg = (hx, L, col) => {
    const kx = hx + 46 * Math.sin(L.a), ky = hipY + 46 * Math.cos(L.a), sa = L.a - L.b, ax = kx + 46 * Math.sin(sa), ay = ky + 46 * Math.cos(sa);
    limbContour2(c, hx, hipY, kx, ky, ax, ay, 17);
    limb(c, hx, hipY, kx, ky, 17, col, suitSh, { contour: false }); limb(c, kx, ky, ax, ay, 15, col, suitSh, { contour: false });
    c.fillStyle = '#121214'; rr(c, ax - 8, ay - 7, 26, 11, 4); c.fill();
  };
  leg(-6, P.legs[1], suitSh);

  // 1. Far arm (suitSh)
  limbContour2(c, 10, -158 + by, 20, -132, 22, -148, 13);
  limb(c, 10, -158 + by, 20, -132, 13, suit, suitSh, { contour: false }); limb(c, 20, -132, 22, -148, 11, skin, null, { contour: false });

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
  c.strokeStyle = 'rgba(5, 7, 12, 0.55)'; c.lineWidth = 2; c.stroke();
  if (showTattered) {
    c.fillStyle = suitSh;
    c.beginPath();
    c.moveTo(-24, -92 + by);
    c.lineTo(-20, -68 + by); c.lineTo(-12, -82 + by); c.lineTo(-3, -64 + by);
    c.lineTo(6, -80 + by); c.lineTo(14, -66 + by); c.lineTo(24, -84 + by); c.lineTo(24, -94 + by);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(5, 7, 12, 0.55)'; c.lineWidth = 1.6; c.stroke();
  }
  c.strokeStyle = 'rgba(148, 197, 255, 0.26)'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(-21, -160 + by); c.lineTo(-21, -96 + by); c.stroke();
  if (o.badge === true) { c.fillStyle = '#C9CDD2'; rr(c, 4, -150 + by, 14, 8, 2); c.fill(); }
  leg(6, P.legs[0], suit);

  // 3. Front arm (suitHi)
  limbContour2(c, -6, -158 + by, 4, -128, 18, -142, 13);
  limb(c, -6, -158 + by, 4, -128, 13, suitHi, suitSh, { contour: false }); limb(c, 4, -128, 18, -142, 11, skin, null, { contour: false });
  c.fillStyle = skin; rr(c, -5, -178 + by, 12, 14, 3); c.fill();

  // Head / Mask (with sunken hollow eye-sockets, optional straggly hair & eerie glow)
  c.save(); c.translate(0, -206 + by); c.rotate(o.tilt || 0);
  if (o.hair === 'straggly') {
    c.fillStyle = '#07090F';
    c.beginPath();
    c.moveTo(-28, -16);
    c.quadraticCurveTo(-33, 18, -28, 52); c.lineTo(-20, 38); c.lineTo(-16, 48); c.lineTo(-12, 22);
    c.lineTo(14, 22); c.lineTo(20, 46); c.lineTo(25, 34); c.lineTo(31, 50);
    c.quadraticCurveTo(33, 14, 27, -18);
    c.closePath();
    c.fill();
  }
  c.fillStyle = cyl(c, -25, 50, o.headColor || '#DEE1E5', o.headHi || '#F1F3F5', o.headSh || '#B8BEC6');
  rr(c, -25, -30, 50, 60, 22); c.fill();
  c.strokeStyle = 'rgba(5, 7, 12, 0.5)'; c.lineWidth = 1.8; c.stroke();
  c.save(); c.clip();
  c.strokeStyle = 'rgba(148, 197, 255, 0.30)'; c.lineWidth = 3.2;
  c.beginPath(); c.moveTo(-22, -22); c.quadraticCurveTo(-24.5, 0, -15, 24); c.stroke();
  c.restore();
  if (o.hair === 'straggly') {
    c.fillStyle = '#07090F';
    c.beginPath();
    c.moveTo(-27, -12); c.quadraticCurveTo(-24, -38, 0, -37); c.quadraticCurveTo(26, -37, 27, -10);
    c.lineTo(21, -2); c.lineTo(15, -18); c.lineTo(8, -6); c.lineTo(1, -20); c.lineTo(-7, -7); c.lineTo(-15, -19); c.lineTo(-22, -2);
    c.closePath();
    c.fill();
  } else if (o.cap === true) {
    c.fillStyle = o.capColor || '#353B45';
    rr(c, -27, -36, 54, 18, [20, 20, 3, 3]); c.fill();
    rr(c, 4, -22, 30, 6, 3); c.fill();
  }
  const rv = o.reveal !== undefined ? o.reveal : 0.85;
  if (rv > 0) {
    c.globalAlpha = rv;
    // Gaunt hollow cheek shadows
    c.strokeStyle = 'rgba(8, 10, 16, 0.34)'; c.lineWidth = 2.0; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-17, 6); c.quadraticCurveTo(-15, 14, -10, 18); c.stroke();
    c.beginPath(); c.moveTo(19, 6); c.quadraticCurveTo(17, 14, 12, 18); c.stroke();
    // Eerie sunken eye-socket shadow halos
    for (const sx of [-8, 10]) {
      const hg = c.createRadialGradient(sx, 0, 2, sx, 0, 12);
      hg.addColorStop(0, 'rgba(8, 10, 16, 0.58)');
      hg.addColorStop(1, 'rgba(8, 10, 16, 0)');
      c.fillStyle = hg; c.beginPath(); c.arc(sx, 0, 12, 0, TAU); c.fill();
    }
    if (o.eyeGlow !== false && o.eyeColor && o.eyeColor !== '#0B0B0D') {
      glow(c, -8, 0, 15, o.eyeColor, 0.42 * rv);
      glow(c, 10, 0, 15, o.eyeColor, 0.42 * rv);
    }
    c.fillStyle = o.eyeColor || '#0B0B0D';
    c.beginPath(); c.ellipse(-8, 0, 5, 8 * rv, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(10, 0, 5, 8 * rv, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(248, 250, 252, 0.68)';
    c.beginPath(); c.arc(-7, -2 * rv, 1.1, 0, TAU); c.arc(11, -2 * rv, 1.1, 0, TAU); c.fill();
    if (o.bloodSlits !== false) {
      c.strokeStyle = '#6B0F1A'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(-8, 8); c.lineTo(-8, 8 + 14 * rv); c.moveTo(10, 8); c.lineTo(10, 8 + 10 * rv); c.stroke();
    }
    if (o.mouth !== false && rv >= 0.75) {
      c.fillStyle = 'rgba(8, 10, 16, 0.75)';
      c.beginPath(); c.ellipse(1, 17.5, 4.5, 3.0 * rv, 0, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  } else {
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.beginPath(); c.ellipse(2, 4, 14, 18, 0, 0, TAU); c.fill();
  }
  c.restore(); endShortsRigComp(_rc); c.restore();
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
  const shaftGrip = !!(o.wand || o.marker || o.knife || o.grip);
  const horzGrip = !!(o.flashlight || o.radio);
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh);
  rr(c, -26, 0, 52, 400, 22); c.fill();
  c.strokeStyle = 'rgba(8, 10, 16, 0.35)'; c.lineWidth = 2.2; c.stroke();
  // Subtle forearm rim-light & wrist tendons
  c.strokeStyle = 'rgba(255, 240, 220, 0.20)'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(-23, 18); c.lineTo(-23, 380); c.stroke();
  c.strokeStyle = 'rgba(70, 30, 20, 0.20)'; c.lineWidth = 2.0; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-8, 14); c.lineTo(-10, 66); c.moveTo(6, 16); c.lineTo(8, 62); c.stroke();
  c.fillStyle = cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh);
  rr(c, -32, -38, 64, 54, 20); c.fill();
  c.strokeStyle = 'rgba(8, 10, 16, 0.34)'; c.lineWidth = 2.0; c.stroke();
  if (!shaftGrip && !horzGrip) {
    for (let i = 0; i < 4; i++) {
      c.fillStyle = K.skin; rr(c, -28 + i * 15, -62, 12, 32, 6); c.fill();
      c.strokeStyle = 'rgba(8, 10, 16, 0.30)'; c.lineWidth = 1.6; c.stroke();
      c.strokeStyle = 'rgba(70, 30, 20, 0.25)'; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(-25 + i * 15, -45); c.lineTo(-19 + i * 15, -45); c.stroke();
    }
  }
  if (o.sleeve) { c.fillStyle = o.sleeveColor || K.shirt; rr(c, -30, 90, 60, 320, 14); c.fill(); }
  if (o.watch) {
    const label = typeof o.watch === 'string' ? o.watch : '19:20';
    c.fillStyle = '#222'; c.fillRect(-29, 32, 58, 16);
    c.fillStyle = '#0D1B1E'; rr(c, -18, 26, 36, 28, 5); c.fill();
    txt(c, label, 0, 45, 13, '#5EEAD4', 700, 'center');
  }
  if (o.wand) {
    const wLen = o.wandLen || 380;
    c.save(); c.rotate(o.wandAngle || 0);
    c.fillStyle = cyl(c, -7, 14, '#C69249', '#E6BF78', '#80561E');
    c.beginPath(); c.moveTo(-6.5, 42); c.lineTo(6.5, 42); c.lineTo(4, -wLen); c.lineTo(-4, -wLen); c.closePath(); c.fill();
    // Bamboo/rattan nodes
    c.strokeStyle = '#6B4516'; c.lineWidth = 2.5;
    for (let ny = -58; ny > -wLen + 20; ny -= 62) {
      const nw = lerp(6, 4.2, -ny / wLen);
      c.beginPath(); c.moveTo(-nw, ny); c.lineTo(nw, ny); c.stroke();
    }
    // Red ritual cord tie above fist
    c.fillStyle = '#B91C1C'; rr(c, -7, -64, 14, 12, 3); c.fill();
    c.strokeStyle = '#DC2626'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-6, -54); c.quadraticCurveTo(-14, -36, -10, -24); c.stroke();
    c.restore();
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
  // Curled fingers & thumb wrapping OVER held props
  if (shaftGrip) {
    const fCol = cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh);
    for (let i = 0; i < 4; i++) {
      const fy = -46 + i * 12;
      c.fillStyle = K.skinSh; rr(c, -25, fy + 1.5, 48, 11, 5); c.fill();
      c.fillStyle = fCol; rr(c, -24, fy, 45, 10, 4.5); c.fill();
    }
    // Opposing thumb clasping diagonally across top-right of fist
    c.save(); c.translate(16, -24); c.rotate(-0.55);
    c.fillStyle = K.skinSh; rr(c, -12, -8, 30, 16, 7); c.fill();
    c.fillStyle = K.skin; rr(c, -11, -7, 28, 14, 6.5); c.fill();
    c.restore();
  } else if (horzGrip) {
    for (let i = 0; i < 4; i++) {
      c.fillStyle = K.skinSh; rr(c, -24 + i * 13, -59, 11, 21, 5); c.fill();
      c.fillStyle = K.skin; rr(c, -23.5 + i * 13, -58, 10, 19, 4.5); c.fill();
    }
    c.save(); c.translate(20, -28); c.rotate(-0.4);
    c.fillStyle = K.skinSh; rr(c, -12, -7, 26, 14, 6); c.fill();
    c.fillStyle = K.skin; rr(c, -11, -6, 24, 12, 5.5); c.fill();
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
  const lineColStr = dark ? '148, 197, 255' : '255, 251, 232';
  for (const [z1, z2, id] of segs) {
    const fk = fogK((z1 + z2) / 2);
    const vis = clamp(1 - fk);
    quad(P(-hw, 0, z1), P(hw, 0, z1), P(hw, 0, z2), P(-hw, 0, z2), mix(pal.floor, pal.fog, fk));
    quad(P(-hw, ceilH, z1), P(hw, ceilH, z1), P(hw, ceilH, z2), P(-hw, ceilH, z2), mix(pal.ceil, pal.fog, fk));
    const trimCol = mix(pal.ceil, pal.fog, fk);
    const corniceCol = mix(dark ? '#0A0D14' : '#78725E', pal.fog, fk);
    const pilasterCol = mix(pal.rib || pal.wallSh, pal.fog, fk);
    const lineFog = mix(pal.line, pal.fog, fk);
    const inkRgba = `rgba(7, 9, 15, ${(0.72 * vis).toFixed(3)})`;
    const rimRgba = `rgba(${lineColStr}, ${(0.24 * vis).toFixed(3)})`;
    for (const side of [-1, 1]) {
      const X = side * hw;
      quad(P(X, 0, z1), P(X, ceilH, z1), P(X, ceilH, z2), P(X, 0, z2), mix(side < 0 ? pal.wall : pal.wallSh, pal.fog, fk));
      // Architectural baseboard/skirting trim & ceiling cornice shadow
      quad(P(X, 0, z1), P(X, 0.18, z1), P(X, 0.18, z2), P(X, 0, z2), trimCol);
      quad(P(X, ceilH - 0.16, z1), P(X, ceilH, z1), P(X, ceilH, z2), P(X, ceilH - 0.16, z2), corniceCol);
      if (o.parking) {
        if (id % 2 === 0) {
          quad(P(X - side * 0.3, 0, z1), P(X - side * 0.3, ceilH, z1), P(X - side * 0.3, ceilH, z1 + 0.5), P(X - side * 0.3, 0, z1 + 0.5), mix('#B9BDC1', pal.fog, fk));
          quad(P(X - side * 0.3, 0, z1), P(X - side * 0.3, 0.5, z1), P(X - side * 0.3, 0.5, z1 + 0.5), P(X - side * 0.3, 0, z1 + 0.5), mix('#C9A227', pal.fog, fk));
        }
        continue;
      }
      // Dual-tone architectural linework: dark ink edge + crisp 1.2px specular rim highlight
      c.lineWidth = Math.max(0.7, 1.5 * vis);
      c.strokeStyle = inkRgba;
      c.beginPath();
      c.moveTo(...P(X, 0.18, z1)); c.lineTo(...P(X, 0.18, z2));
      c.moveTo(...P(X, 1.15, z1)); c.lineTo(...P(X, 1.15, z2));
      c.moveTo(...P(X, ceilH - 0.16, z1)); c.lineTo(...P(X, ceilH - 0.16, z2));
      c.stroke();

      c.lineWidth = Math.max(0.5, 1.15 * vis);
      c.strokeStyle = rimRgba;
      c.beginPath();
      c.moveTo(...P(X, 0.16, z1)); c.lineTo(...P(X, 0.16, z2));
      c.moveTo(...P(X, 1.13, z1)); c.lineTo(...P(X, 1.13, z2));
      c.stroke();

      // Structural pilaster post with crisp ink contour + camera-facing specular rim
      const pilZ = Math.min(z2, z1 + 0.14);
      quad(P(X, 0.18, z1), P(X, ceilH - 0.16, z1), P(X, ceilH - 0.16, pilZ), P(X, 0.18, pilZ), pilasterCol);
      c.strokeStyle = inkRgba; c.lineWidth = Math.max(0.6, 1.4 * vis);
      c.beginPath(); c.moveTo(...P(X, 0, z1)); c.lineTo(...P(X, ceilH, z1)); c.moveTo(...P(X, 0.18, pilZ)); c.lineTo(...P(X, ceilH - 0.16, pilZ)); c.stroke();
      c.strokeStyle = rimRgba; c.lineWidth = Math.max(0.5, 1.2 * vis);
      c.beginPath(); c.moveTo(...P(X, 0.18, pilZ + 0.02)); c.lineTo(...P(X, ceilH - 0.16, pilZ + 0.02)); c.stroke();

      if (o.mallShops === true || o.plainWalls === false) {
        const a = z1 + 0.25, b = z2 - 0.25;
        if (b > a) {
          quad(P(X, 0, a), P(X, 2.9, a), P(X, 2.9, b), P(X, 0, b), mix(pal.shutter || pal.wall, pal.fog, fk));
          c.strokeStyle = mix(pal.rib || pal.wallSh, pal.fog, fk); c.lineWidth = Math.max(0.5, 60 / z1 * 0.03);
          for (let Y = 0.2; Y < 2.9; Y += 0.22) { c.beginPath(); c.moveTo(...P(X, Y, a)); c.lineTo(...P(X, Y, b)); c.stroke(); }
          const sc = SIGNS[Math.abs(id * 3 + (side > 0 ? 1 : 0)) % SIGNS.length];
          quad(P(X, 3.1, a), P(X, 3.7, a), P(X, 3.7, b), P(X, 3.1, b), mix(dark ? '#2B2833' : sc, pal.fog, fk));
        }
      } else {
        // Signature recessed wall panel frames (กรอบลูกฟักผนัง) + subtle texture ticks
        const pA = pilZ + 0.16, pB = z2 - 0.16;
        if (pB > pA + 0.2) {
          const drawRecess = (y1, y2) => {
            c.strokeStyle = `rgba(7, 9, 15, ${(0.48 * vis).toFixed(3)})`; c.lineWidth = Math.max(0.5, 1.1 * vis);
            c.beginPath(); c.moveTo(...P(X, y1, pA)); c.lineTo(...P(X, y2, pA)); c.lineTo(...P(X, y2, pB)); c.lineTo(...P(X, y1, pB)); c.closePath(); c.stroke();
            c.strokeStyle = `rgba(${lineColStr}, ${(0.13 * vis).toFixed(3)})`; c.lineWidth = Math.max(0.4, 0.9 * vis);
            c.beginPath(); c.moveTo(...P(X, y1 + 0.03, pA + 0.04)); c.lineTo(...P(X, y1 + 0.03, pB - 0.04)); c.lineTo(...P(X, y2 - 0.03, pB - 0.04)); c.stroke();
          };
          drawRecess(1.36, ceilH - 0.42);
          drawRecess(0.32, 0.96);
          // Delicate procedural masonry/panel joint tick
          const tZ = lerp(pA, pB, 0.5), tY = 1.85 + (hash(id * 5.1 + side) - 0.5) * 0.8;
          c.strokeStyle = `rgba(7, 9, 15, ${(0.24 * vis).toFixed(3)})`; c.lineWidth = Math.max(0.4, 0.9 * vis);
          c.beginPath(); c.moveTo(...P(X, tY, tZ - 0.15)); c.lineTo(...P(X, tY, tZ + 0.15)); c.stroke();
        }
      }
    }
    c.strokeStyle = lineFog; c.lineWidth = 1;
    c.beginPath(); c.moveTo(...P(-hw, 0, z1)); c.lineTo(...P(hw, 0, z1)); c.stroke();
    // Subtle perspective floor tile bevel highlight
    c.strokeStyle = `rgba(${lineColStr}, ${(0.10 * vis).toFixed(3)})`; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(...P(-hw, 0, z1 + 0.04)); c.lineTo(...P(hw, 0, z1 + 0.04)); c.stroke();
  }
  c.strokeStyle = rgba(dark ? '#2A2F3E' : '#BCB194', 0.7); c.lineWidth = 1;
  for (let X = -hw; X <= hw; X += 0.8) { c.beginPath(); c.moveTo(...P(X, 0, zN)); c.lineTo(...P(X, 0, zF)); c.stroke(); }
  // Overhead ceiling conduit pipes running continuously into depth
  for (const cx of [-0.95, 0.95]) {
    c.strokeStyle = dark ? 'rgba(6, 8, 14, 0.72)' : 'rgba(90, 84, 68, 0.55)'; c.lineWidth = 3.2;
    c.beginPath(); c.moveTo(...P(cx, ceilH - 0.05, zN)); c.lineTo(...P(cx, ceilH - 0.05, zF)); c.stroke();
    c.strokeStyle = `rgba(${lineColStr}, 0.22)`; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(...P(cx - Math.sign(cx) * 0.03, ceilH - 0.07, zN)); c.lineTo(...P(cx - Math.sign(cx) * 0.03, ceilH - 0.07, zF)); c.stroke();
  }
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
      const [lx, ly] = P(0, ceilH, zm);
      // Volumetric trapezoid light cone + drifting dust motes + specular floor reflection
      const tl = P(-0.48, ceilH, zm), tr = P(0.48, ceilH, zm);
      const bl = P(-1.85, 0, zm), br = P(1.85, 0, zm);
      const cg = c.createLinearGradient(0, ly, 0, fy);
      cg.addColorStop(0, `rgba(255, 246, 216, ${(0.055 * on * (1 - fk)).toFixed(3)})`);
      cg.addColorStop(1, 'rgba(255, 246, 216, 0)');
      c.save(); c.globalCompositeOperation = 'screen';
      c.fillStyle = cg;
      c.beginPath(); c.moveTo(...tl); c.lineTo(...tr); c.lineTo(...br); c.lineTo(...bl); c.closePath(); c.fill();
      if (zm < 24) {
        for (let m = 0; m < 4; m++) {
          const my = lerp(0.4, ceilH - 0.4, hash(id * 13.7 + m * 5.3));
          const mx = (hash(id * 7.1 + m * 17.9) - 0.5) * 1.8 + Math.sin(t * 1.3 + id + m) * 0.14;
          const [dx, dy] = P(mx, my + Math.cos(t * 0.9 + m) * 0.08, zm);
          c.fillStyle = `rgba(255, 248, 225, ${(0.34 * on * (1 - fk)).toFixed(3)})`;
          c.beginPath(); c.arc(dx, dy, Math.max(0.8, 3.2 / zm), 0, TAU); c.fill();
        }
      }
      c.fillStyle = `rgba(255, 246, 216, ${(0.14 * on * (1 - fk)).toFixed(3)})`;
      c.beginPath(); c.ellipse(fx, fy, Math.max(8, f * 0.42 / zm), Math.max(2, f * 0.045 / zm), 0, 0, TAU); c.fill();
      c.restore();
      c.save(); c.translate(fx, fy); c.scale(1, 0.22); glow(c, 0, 0, r, '#FFF6D8', 0.22 * on * (1 - fk)); c.restore();
      glow(c, lx, ly, f * 0.9 / zm, '#FFF6D8', 0.35 * on * (1 - fk));
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

  // Subtle twinkling night sky star / atmospheric dust particles
  if (o.stars !== false) {
    for (let i = 0; i < 28; i++) {
      const sx = hash(i * 19.7) * W;
      const sy = hash(i * 31.3) * horizonY * 0.82;
      const tw = 0.14 + 0.42 * (0.5 + 0.5 * Math.sin(t * 2.1 + i * 3.1));
      c.fillStyle = `rgba(226, 238, 255, ${tw.toFixed(3)})`;
      c.beginPath(); c.arc(sx, sy, 0.8 + hash(i * 5.9) * 1.0, 0, TAU); c.fill();
    }
  }

  // Layered cloud-band ink wisps across upper night sky
  const pan = (o.panSpeed || 12) * t;
  if (o.clouds !== false) {
    for (let i = 0; i < 4; i++) {
      const cy = horizonY * (0.20 + i * 0.12);
      const cw = 210 + (i % 2) * 90;
      const cx = ((hash(i * 23.1) * W - pan * (0.18 + i * 0.04)) % (W + cw * 2) + W + cw * 2) % (W + cw * 2) - cw;
      c.fillStyle = 'rgba(15, 24, 38, 0.38)';
      c.beginPath(); c.ellipse(cx, cy, cw * 0.5, 11 + i * 2, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(186, 230, 253, 0.16)'; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(cx - cw * 0.42, cy - 2); c.quadraticCurveTo(cx, cy - 12 - i * 2, cx + cw * 0.42, cy - 2); c.stroke();
    }
  }

  // Overhead sagging utility / spirit-cord lines spanning across upper sky
  if (o.wires !== false) {
    for (const [y1, sag, y2] of [[54, 42, 72], [74, 54, 96]]) {
      c.strokeStyle = 'rgba(7, 10, 16, 0.72)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(-20, y1); c.quadraticCurveTo(W * 0.52, y1 + sag, W + 20, y2); c.stroke();
      c.strokeStyle = 'rgba(186, 230, 253, 0.14)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(-20, y1 - 1); c.quadraticCurveTo(W * 0.52, y1 + sag - 1, W + 20, y2 - 1); c.stroke();
    }
  }

  // 2-Layer Multi-Plane Parallax Silhouette Ridge + Moonlit Rim Edge & Organic Treeline Tufts
  const rH = o.ridgeH || 48;
  c.fillStyle = mix(skyBot, '#090D16', 0.25);
  c.beginPath(); c.moveTo(0, horizonY);
  for (let x = 0; x <= W + 90; x += 90) {
    const h = 24 + hash(Math.floor((x + pan * 0.45) / 90) * 5.3) * (rH * 1.15);
    c.lineTo(x, horizonY - h);
  }
  c.lineTo(W, horizonY); c.closePath(); c.fill();

  const ridgePts = [];
  for (let x = 0; x <= W + 64; x += 64) {
    const h = 14 + hash(Math.floor((x + pan) / 64) * 7.1) * rH;
    ridgePts.push([x, horizonY - h]);
  }
  c.fillStyle = o.ridgeCol || mix(skyBot, '#090D16', 0.52);
  c.beginPath(); c.moveTo(0, horizonY);
  for (const [rx, ry] of ridgePts) c.lineTo(rx, ry);
  c.lineTo(W, horizonY); c.closePath(); c.fill();

  // Crisp dark ink shadow + moonlit rim-edge highlight tracing top contour of nearer ridge
  c.strokeStyle = 'rgba(6, 8, 14, 0.75)'; c.lineWidth = 2.0; c.lineJoin = 'round';
  c.beginPath();
  ridgePts.forEach(([rx, ry], idx) => idx === 0 ? c.moveTo(rx, ry + 1.5) : c.lineTo(rx, ry + 1.5));
  c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.25)'; c.lineWidth = 1.4;
  c.beginPath();
  ridgePts.forEach(([rx, ry], idx) => idx === 0 ? c.moveTo(rx, ry) : c.lineTo(rx, ry));
  c.stroke();

  // Organic treeline / bamboo foliage tufts along ridge horizon
  c.fillStyle = o.ridgeCol || mix(skyBot, '#090D16', 0.55);
  for (let idx = 1; idx < ridgePts.length - 1; idx += 2) {
    const [tx, ty] = ridgePts[idx];
    for (const [dx, th] of [[-12, 16], [0, 22], [11, 14]]) {
      c.beginPath(); c.moveTo(tx + dx - 8, ty + 6); c.quadraticCurveTo(tx + dx, ty - th, tx + dx + 8, ty + 6); c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(186, 230, 253, 0.18)'; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(tx - 8, ty + 2); c.quadraticCurveTo(tx, ty - 22, tx + 8, ty + 2); c.stroke();
  }

  // Ground or Animated Water Plane
  const gg = c.createLinearGradient(0, horizonY, 0, H);
  gg.addColorStop(0, groundCol); gg.addColorStop(1, mix(groundCol, '#090D16', 0.45));
  c.fillStyle = gg; c.fillRect(0, horizonY, W, H - horizonY);

  // Horizon atmospheric mist glow band
  const hg = c.createLinearGradient(0, horizonY - 42, 0, horizonY + 34);
  hg.addColorStop(0, 'rgba(148, 175, 205, 0)');
  hg.addColorStop(0.55, 'rgba(148, 175, 205, 0.20)');
  hg.addColorStop(1, 'rgba(148, 175, 205, 0)');
  c.fillStyle = hg; c.fillRect(0, horizonY - 42, W, 76);

  if (o.water) {
    c.strokeStyle = o.waveCol || 'rgba(125,211,252,0.22)'; c.lineWidth = 2;
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

  // Stylized drifting low ground/water mist ribbons with subtle moonlit top edge
  for (let m = 0; m < 2; m++) {
    const my = horizonY + 34 + m * 46;
    const mxOff = Math.sin(t * 0.55 + m * 2.1) * 45;
    const mg = c.createLinearGradient(0, my - 20, 0, my + 24);
    mg.addColorStop(0, 'rgba(148, 163, 184, 0)');
    mg.addColorStop(0.5, 'rgba(148, 163, 184, 0.13)');
    mg.addColorStop(1, 'rgba(148, 163, 184, 0)');
    c.fillStyle = mg; c.fillRect(Math.max(0, mxOff), my - 20, W - Math.abs(mxOff), 44);
    c.strokeStyle = 'rgba(186, 230, 253, 0.18)'; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(120 + mxOff, my - 4);
    c.quadraticCurveTo(W * 0.5 + mxOff, my - 12 + m * 4, W - 120 + mxOff, my - 4);
    c.stroke();
  }

  // Rim-lit foreground corner grass/reed silhouettes for 3-plane 2.5D depth
  if (o.foreground !== false) {
    for (const [baseX, dir] of [[0, 1], [W, -1]]) {
      for (let b = 0; b < 5; b++) {
        const bx = baseX + dir * (10 + b * 17);
        const bh = 68 + (b % 3) * 28;
        const sway = Math.sin(t * 1.7 + b * 1.3 + baseX) * 4;
        c.fillStyle = '#070A10';
        c.beginPath();
        c.moveTo(bx - 5, H);
        c.quadraticCurveTo(bx + sway * 0.5, H - bh * 0.6, bx + dir * 12 + sway, H - bh);
        c.quadraticCurveTo(bx + 4 + sway * 0.4, H - bh * 0.5, bx + 5, H);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(186, 230, 253, 0.28)'; c.lineWidth = 1.0;
        c.beginPath();
        c.moveTo(bx + (dir > 0 ? 4 : -4), H);
        c.quadraticCurveTo(bx + sway * 0.5 + dir * 2, H - bh * 0.55, bx + dir * 12 + sway, H - bh);
        c.stroke();
      }
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

  // Perspective wood-plank floor lines, bevel highlights & grain ticks
  c.save();
  c.beginPath(); c.moveTo(0, botY + 40); c.lineTo(cx, botY); c.lineTo(W, botY + 30); c.lineTo(W, H); c.lineTo(0, H); c.closePath();
  c.clip();
  for (let d = 1; d <= 5; d++) {
    const dy = d * d * 12;
    c.strokeStyle = 'rgba(5, 7, 12, 0.28)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(0, botY + 40 + dy); c.lineTo(cx, botY + dy * 0.85); c.lineTo(W, botY + 30 + dy); c.stroke();
    c.strokeStyle = 'rgba(255, 240, 220, 0.08)'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(0, botY + 41.5 + dy); c.lineTo(cx, botY + 1.5 + dy * 0.85); c.lineTo(W, botY + 31.5 + dy); c.stroke();
  }
  const lSlope = -40 / Math.max(1, cx), rSlope = 30 / Math.max(1, W - cx);
  for (let u = 0.2; u < 1; u += 0.2) {
    const lx = cx * u, ly = botY + (1 - u) * 40;
    const lx2 = lx + (H - ly) / Math.abs(rSlope + 0.35);
    c.strokeStyle = 'rgba(5, 7, 12, 0.26)'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx2, H); c.stroke();
    c.strokeStyle = 'rgba(255, 240, 220, 0.07)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(lx + 1.5, ly); c.lineTo(lx2 + 1.5, H); c.stroke();
    const rx = cx + (W - cx) * u, ry = botY + u * 30;
    const rx2 = rx - (H - ry) / Math.abs(lSlope - 0.35);
    c.strokeStyle = 'rgba(5, 7, 12, 0.26)'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx2, H); c.stroke();
  }
  c.restore();

  // Left & Right Walls meeting at vertical corner seam (cx)
  c.fillStyle = wallL;
  c.beginPath(); c.moveTo(0, topY - 30); c.lineTo(cx, topY); c.lineTo(cx, botY); c.lineTo(0, botY + 40); c.closePath(); c.fill();
  c.fillStyle = wallR;
  c.beginPath(); c.moveTo(cx, topY); c.lineTo(W, topY - 20); c.lineTo(W, botY + 30); c.lineTo(cx, botY); c.closePath(); c.fill();

  // Chair rail (ราวกั้นผนังกลาง) + Framed recessed wall wainscoting panels (กรอบบัวผนังลูกฟัก)
  const railFrac = 0.56;
  const lyRail = lerp(topY - 30, botY + 40, railFrac), cyRail = lerp(topY, botY, railFrac), ryRail = lerp(topY - 20, botY + 30, railFrac);
  c.strokeStyle = 'rgba(5, 7, 12, 0.65)'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(0, lyRail); c.lineTo(cx, cyRail); c.lineTo(W, ryRail); c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.18)'; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(0, lyRail - 1.5); c.lineTo(cx, cyRail - 1.5); c.lineTo(W, ryRail - 1.5); c.stroke();

  const drawWallPanel = (xA, yTopA, yBotA, xB, yTopB, yBotB) => {
    c.strokeStyle = 'rgba(5, 7, 12, 0.45)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(xA, yTopA); c.lineTo(xB, yTopB); c.lineTo(xB, yBotB); c.lineTo(xA, yBotA); c.closePath(); c.stroke();
    c.strokeStyle = 'rgba(186, 230, 253, 0.11)'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(xA + 2, yBotA - 2); c.lineTo(xB - 2, yBotB - 2); c.lineTo(xB - 2, yTopB + 2); c.stroke();
  };
  for (const [u1, u2] of [[0.12, 0.44], [0.54, 0.86]]) {
    drawWallPanel(cx * u1, lerp(lyRail, cyRail, u1) + 14, lerp(botY + 40, botY, u1) - 24,
      cx * u2, lerp(lyRail, cyRail, u2) + 14, lerp(botY + 40, botY, u2) - 24);
    drawWallPanel(lerp(cx, W, u1), lerp(cyRail, ryRail, u1) + 14, lerp(botY, botY + 30, u1) - 24,
      lerp(cx, W, u2), lerp(cyRail, ryRail, u2) + 14, lerp(botY, botY + 30, u2) - 24);
  }

  // Perspective-aligned Baseboards (บัวพื้น) & Crown Molding Shadow (บัวเพดาน) + Dual-Line Rim Trim
  const bb = 15, cm = 12;
  c.fillStyle = 'rgba(10, 12, 18, 0.46)';
  c.beginPath(); c.moveTo(0, botY + 40 - bb); c.lineTo(cx, botY - bb); c.lineTo(cx, botY); c.lineTo(0, botY + 40); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(cx, botY - bb); c.lineTo(W, botY + 30 - bb); c.lineTo(W, botY + 30); c.lineTo(cx, botY); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(5, 7, 12, 0.65)'; c.lineWidth = 2.0;
  c.beginPath(); c.moveTo(0, botY + 40 - bb); c.lineTo(cx, botY - bb); c.lineTo(W, botY + 30 - bb); c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.18)'; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(0, botY + 41.2 - bb); c.lineTo(cx, botY + 1.2 - bb); c.lineTo(W, botY + 31.2 - bb); c.stroke();

  c.fillStyle = 'rgba(0, 0, 0, 0.36)';
  c.beginPath(); c.moveTo(0, topY - 30); c.lineTo(cx, topY); c.lineTo(cx, topY + cm); c.lineTo(0, topY - 30 + cm); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(cx, topY); c.lineTo(W, topY - 20); c.lineTo(W, topY - 20 + cm); c.lineTo(cx, topY + cm); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(186, 230, 253, 0.14)'; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(0, topY - 30 + cm); c.lineTo(cx, topY + cm); c.lineTo(W, topY - 20 + cm); c.stroke();

  // Diagonal window/vent slat light shaft (แสงลอดระแนงช่องลม) + floating dust motes
  if (o.lightShaft !== false) {
    c.save(); c.globalCompositeOperation = 'screen';
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const sxTop = 70 + sIdx * 68;
      const sxBot = 330 + sIdx * 105;
      const sg = c.createLinearGradient(sxTop, topY, sxBot, botY + 75);
      sg.addColorStop(0, 'rgba(205, 228, 255, 0.055)');
      sg.addColorStop(1, 'rgba(205, 228, 255, 0)');
      c.fillStyle = sg;
      c.beginPath(); c.moveTo(sxTop, topY - 8); c.lineTo(sxTop + 38, topY - 4); c.lineTo(sxBot + 72, botY + 85); c.lineTo(sxBot, botY + 85); c.closePath(); c.fill();
    }
    for (let d = 0; d < 12; d++) {
      const u = hash(d * 7.9), dx = lerp(95, 580, u), dy = lerp(topY + 25, botY + 45, hash(d * 13.1));
      c.fillStyle = `rgba(226, 240, 255, ${(0.18 + hash(d * 3.7) * 0.22).toFixed(3)})`;
      c.beginPath(); c.arc(dx, dy, 1.0 + hash(d * 5.3) * 1.1, 0, TAU); c.fill();
    }
    c.restore();
  }

  // Corner Ambient Occlusion Gradients along vertical seam cx + dual-line corner seam
  const aol = c.createLinearGradient(cx - 55, 0, cx, 0);
  aol.addColorStop(0, 'rgba(0, 0, 0, 0)'); aol.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
  c.fillStyle = aol;
  c.beginPath(); c.moveTo(cx - 55, lerp(topY - 30, topY, 1 - 55 / cx)); c.lineTo(cx, topY); c.lineTo(cx, botY); c.lineTo(cx - 55, lerp(botY + 40, botY, 1 - 55 / cx)); c.closePath(); c.fill();
  const aor = c.createLinearGradient(cx, 0, cx + 55, 0);
  aor.addColorStop(0, 'rgba(0, 0, 0, 0.36)'); aor.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = aor;
  c.beginPath(); c.moveTo(cx, topY); c.lineTo(cx + 55, lerp(topY, topY - 20, 55 / (W - cx))); c.lineTo(cx + 55, lerp(botY, botY + 30, 55 / (W - cx))); c.lineTo(cx, botY); c.closePath(); c.fill();

  c.strokeStyle = 'rgba(5, 7, 12, 0.72)'; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(cx, topY); c.lineTo(cx, botY); c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.16)'; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(cx + 2, topY + 2); c.lineTo(cx + 2, botY - 2); c.stroke();
  return { cx, topY, botY };
}

// 3. Top-Down / Bird's-Eye Architectural Blueprint & Tactical Room View
function topDownRoom(c, o = {}) {
  const rx = o.x || 120, ry = o.y || 90, rw = o.w || 640, rh = o.h || 520;
  c.fillStyle = o.bg || '#111827'; c.fillRect(0, 0, W, H);
  // Subtle outer floor shadow beneath room footprint
  c.fillStyle = 'rgba(0, 0, 0, 0.38)'; rr(c, rx + 8, ry + 10, rw + 4, rh + 4, 10); c.fill();
  c.fillStyle = o.floor || '#1E293B'; rr(c, rx, ry, rw, rh, 8); c.fill();

  if (o.grid !== false) {
    c.strokeStyle = 'rgba(148,163,184,0.12)'; c.lineWidth = 1;
    for (let x = rx + 40; x < rx + rw; x += 40) { c.beginPath(); c.moveTo(x, ry); c.lineTo(x, ry + rh); c.stroke(); }
    for (let y = ry + 40; y < ry + rh; y += 40) { c.beginPath(); c.moveTo(rx, y); c.lineTo(rx + rw, y); c.stroke(); }
    // Architectural blueprint floor tile cross-ticks
    c.strokeStyle = 'rgba(148, 163, 184, 0.22)'; c.lineWidth = 1;
    for (let x = rx + 80; x < rx + rw - 20; x += 80) {
      for (let y = ry + 80; y < ry + rh - 20; y += 80) {
        c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.moveTo(x, y - 4); c.lineTo(x, y + 4); c.stroke();
      }
    }
  }
  // Inner wall 3D drop-shadow along top & left edges
  c.save(); rr(c, rx, ry, rw, rh, 8); c.clip();
  const ts = c.createLinearGradient(0, ry, 0, ry + 22);
  ts.addColorStop(0, 'rgba(0, 0, 0, 0.42)'); ts.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = ts; c.fillRect(rx, ry, rw, 22);
  const ls = c.createLinearGradient(rx, 0, rx + 22, 0);
  ls.addColorStop(0, 'rgba(0, 0, 0, 0.38)'); ls.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = ls; c.fillRect(rx, ry, 22, rh);
  c.restore();

  // Architectural double-wall casing with 45-degree blueprint wall hatching & crisp rim lines
  c.strokeStyle = '#07090F'; c.lineWidth = 17;
  rr(c, rx, ry, rw, rh, 8); c.stroke();
  c.strokeStyle = 'rgba(15, 23, 42, 0.78)'; c.lineWidth = 14;
  rr(c, rx, ry, rw, rh, 8); c.stroke();
  c.save();
  c.beginPath();
  c.rect(rx - 7, ry - 7, rw + 14, rh + 14);
  c.rect(rx + 7, ry + 7, Math.max(0, rw - 14), Math.max(0, rh - 14), true);
  c.clip('evenodd');
  c.strokeStyle = 'rgba(226, 232, 240, 0.18)'; c.lineWidth = 1.0;
  for (let d = -rh; d < rw + rh; d += 10) {
    c.beginPath(); c.moveTo(rx + d, ry - 10); c.lineTo(rx + d + rh + 20, ry + rh + 10); c.stroke();
  }
  c.restore();
  c.strokeStyle = o.wallCol || '#64748B'; c.lineWidth = 3.5;
  rr(c, rx, ry, rw, rh, 8); c.stroke();
  c.strokeStyle = 'rgba(148, 197, 255, 0.24)'; c.lineWidth = 1.2;
  rr(c, rx + 6, ry + 6, Math.max(0, rw - 12), Math.max(0, rh - 12), 5); c.stroke();

  // Doorway threshold swing-arc blueprint line
  if (o.door !== false) {
    const dx = rx + rw - 6, dy = ry + rh * 0.45, dw = 48;
    c.fillStyle = o.floor || '#1E293B'; c.fillRect(dx - 4, dy - dw, 20, dw);
    c.strokeStyle = 'rgba(148, 197, 255, 0.28)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - dw, dy); c.stroke();
    c.save(); c.setLineDash([4, 4]);
    c.beginPath(); c.arc(dx, dy, dw, Math.PI, Math.PI * 1.5); c.stroke();
    c.restore();
  }

  c.fillStyle = '#94A3B8';
  for (const [px, py] of [[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]]) {
    rr(c, px - 7, py - 7, 14, 14, 2); c.fill();
    c.strokeStyle = '#07090F'; c.lineWidth = 1.2; c.stroke();
  }
  return { rx, ry, rw, rh };
}

// 4. Surveillance / Security Monitor / Peephole / Visor Lens Frame
function cctvOverlay(c, t, o = {}) {
  c.save();
  // Scanlines + subtle drifting CRT phosphor bar
  c.fillStyle = 'rgba(16, 185, 129, 0.04)';
  for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1.5);
  const scanY = ((t * 85) % (H + 90)) - 90;
  const sg = c.createLinearGradient(0, scanY, 0, scanY + 90);
  sg.addColorStop(0, 'rgba(148, 226, 200, 0)');
  sg.addColorStop(0.5, 'rgba(148, 226, 200, 0.055)');
  sg.addColorStop(1, 'rgba(148, 226, 200, 0)');
  c.fillStyle = sg; c.fillRect(0, scanY, W, 90);
  // Subtle center optical reticle tick marks
  c.strokeStyle = 'rgba(226, 232, 240, 0.24)'; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(W / 2 - 14, H / 2); c.lineTo(W / 2 - 5, H / 2);
  c.moveTo(W / 2 + 5, H / 2); c.lineTo(W / 2 + 14, H / 2);
  c.moveTo(W / 2, H / 2 - 14); c.lineTo(W / 2, H / 2 - 5);
  c.moveTo(W / 2, H / 2 + 5); c.lineTo(W / 2, H / 2 + 14);
  c.stroke();
  // Corner viewfinder brackets
  c.strokeStyle = o.col || 'rgba(226,232,240,0.55)'; c.lineWidth = 2.5;
  const m = 38, L = 28;
  for (const [bx, by, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    c.beginPath(); c.moveTo(bx, by + sy * L); c.lineTo(bx, by); c.lineTo(bx + sx * L, by); c.stroke();
  }
  if (o.camLabel) {
    if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#EF4444'; c.beginPath(); c.arc(64, 62, 6, 0, TAU); c.fill(); }
    const pad2 = n => String(Math.floor(Math.max(0, n))).padStart(2, '0');
    const sec = Math.max(0, t || 0);
    const tc = `TC 01:${pad2(sec / 60)}:${pad2(sec % 60)}:${pad2((sec * 30) % 30)}`;
    txt(c, `${o.camLabel}  ·  ${tc}`, 80, 68, 16, '#E2E8F0', 700);
  }
  c.restore();
}

// --------------------------------------------------------- RURAL THAI STAGE BUILDERS
function drawSugarPalm(c, x, y, s = 1, sway = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = '#090D16'; c.lineWidth = 8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-8 + sway * 0.4, -75, sway, -155); c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.22)'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-3.5, 0); c.quadraticCurveTo(-11.5 + sway * 0.4, -75, -3 + sway, -155); c.stroke();
  c.translate(sway, -156);
  for (const ang of [-2.55, -2.0, -1.55, -1.05, -0.55, 0.05, 0.65]) {
    c.save(); c.rotate(ang);
    c.fillStyle = '#080C14';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(18, -11, 34, -2); c.quadraticCurveTo(18, 6, 0, 2); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(186, 230, 253, 0.18)'; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(4, -2); c.quadraticCurveTo(18, -9, 32, -2); c.stroke();
    c.restore();
  }
  c.restore();
}

function drawRiceClump(c, x, y, s = 1, t = 0, seed = 0, litWarm = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = 'rgba(125, 211, 252, 0.12)'; c.lineWidth = 1.0;
  c.beginPath(); c.ellipse(0, 1, 10, 2.2, 0, 0, TAU); c.stroke();
  const blades = [[-9, 23, -17], [-4, 29, -8], [0, 32, 1], [4, 28, 10], [8, 22, 18]];
  for (let i = 0; i < blades.length; i++) {
    const [bx, bh, bend] = blades[i];
    const sw = Math.sin(t * 1.9 + seed + i * 0.7) * 2.6;
    c.strokeStyle = '#090E14'; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx * 0.35, 0); c.quadraticCurveTo(bx * 0.5 + sw * 0.4, -bh * 0.6, bend + sw, -bh); c.stroke();
    c.strokeStyle = litWarm > 0.25
      ? `rgba(251, 191, 36, ${(0.28 * litWarm).toFixed(3)})`
      : 'rgba(186, 230, 253, 0.20)';
    c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(bx * 0.35 - 0.8, -3); c.quadraticCurveTo(bx * 0.5 + sw * 0.4 - 0.8, -bh * 0.6, bend + sw - 0.4, -bh); c.stroke();
  }
  c.restore();
}

function drawDikeGrass(c, x, y, s = 1, seed = 0, warm = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = -2; i <= 2; i++) {
    const h = 11 + hash(seed + i * 3.7) * 11;
    const lean = i * 5.2 + (hash(seed + i * 9.1) - 0.5) * 4;
    c.strokeStyle = '#0B1012'; c.lineWidth = 2.0; c.lineCap = 'round';
    c.beginPath(); c.moveTo(i * 2.2, 2); c.quadraticCurveTo(i * 2.5 + lean * 0.4, -h * 0.5, lean, -h); c.stroke();
    c.strokeStyle = warm > 0.2 ? `rgba(251, 191, 36, ${(0.24 * warm).toFixed(2)})` : 'rgba(186, 230, 253, 0.18)';
    c.lineWidth = 0.85;
    c.beginPath(); c.moveTo(i * 2.2 - 0.6, -2); c.quadraticCurveTo(i * 2.5 + lean * 0.4 - 0.6, -h * 0.55, lean, -h); c.stroke();
  }
  c.restore();
}

function drawBananaCluster(c, x, y, s = 1, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.40)'; c.beginPath(); c.ellipse(2, 2, 26, 6, 0, 0, TAU); c.fill();
  c.fillStyle = '#18241C';
  c.beginPath(); c.moveTo(-16, 0); c.lineTo(-14, -108); c.lineTo(-6, -108); c.lineTo(-4, 0); c.closePath(); c.fill();
  c.strokeStyle = '#06080B'; c.lineWidth = 1.8; c.stroke();
  c.fillStyle = '#1B2A20';
  c.beginPath(); c.moveTo(-7, 0); c.lineTo(-5, -148); c.lineTo(7, -148); c.lineTo(9, 0); c.closePath(); c.fill();
  c.strokeStyle = '#06080B'; c.lineWidth = 2.0; c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.22)'; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(-5.5, -4); c.lineTo(-4, -146); c.stroke();

  const drawTornLeaf = (ox, oy, ang, len, wid, flip = 1) => {
    const sw = Math.sin(t * 1.4 + ang * 3.5) * 3.5;
    c.save(); c.translate(ox, oy); c.rotate(ang); c.scale(1, flip);
    c.fillStyle = '#16271D';
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.35, -wid * 0.95 + sw, len * 0.62, -wid * 0.65 + sw);
    c.lineTo(len * 0.64, -wid * 0.12 + sw * 0.8);
    c.lineTo(len * 0.69, -wid * 0.55 + sw);
    c.quadraticCurveTo(len * 0.88, -wid * 0.28 + sw, len, 10 + sw * 1.2);
    c.quadraticCurveTo(len * 0.62, wid * 0.45 + sw * 0.5, len * 0.46, wid * 0.22 + sw * 0.4);
    c.lineTo(len * 0.43, wid * 0.05 + sw * 0.3);
    c.lineTo(len * 0.39, wid * 0.28 + sw * 0.3);
    c.quadraticCurveTo(len * 0.16, wid * 0.22, 0, 2);
    c.closePath(); c.fill();
    c.strokeStyle = '#06080B'; c.lineWidth = 1.9; c.lineJoin = 'round'; c.stroke();
    c.strokeStyle = 'rgba(186, 230, 253, 0.26)'; c.lineWidth = 1.15;
    c.beginPath(); c.moveTo(2, 0); c.quadraticCurveTo(len * 0.55, -wid * 0.22 + sw * 0.7, len, 10 + sw * 1.2); c.stroke();
    c.restore();
  };

  drawTornLeaf(-10, -104, -2.55, 76, 21, -1);
  drawTornLeaf(0, -142, -2.72, 94, 24, -1);
  drawTornLeaf(1, -145, -2.18, 92, 23, -1);
  drawTornLeaf(2, -146, -1.62, 74, 20, 1);
  drawTornLeaf(4, -142, -0.52, 82, 22, 1);
  drawTornLeaf(4, -135, 0.18, 78, 21, 1);
  c.restore();
}

function drawStiltHouse(c, t = 0, o = {}) {
  c.save();
  if (o.x || o.y) c.translate(o.x || 0, o.y || 0);
  if (o.s != null && o.s !== 1) c.scale(o.s, o.s);

  const floorY = o.floorY !== undefined ? o.floorY : 322;
  const lift = floorY - 350;
  const groundY = 512, peakX = 762, peakY = 132;
  const winOn = o.windowLight !== false;

  if (o.mound !== false) {
    c.fillStyle = '#181411';
    c.beginPath(); c.moveTo(575, 520); c.quadraticCurveTo(640, 492, 860, 494); c.quadraticCurveTo(1060, 496, 1140, 522);
    c.lineTo(1165, 540); c.lineTo(540, 536); c.closePath(); c.fill();
    c.strokeStyle = '#07090F'; c.lineWidth = 2.0; c.stroke();
    c.strokeStyle = 'rgba(251, 191, 36, 0.18)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(600, 506); c.quadraticCurveTo(750, 493, 1020, 498); c.stroke();
  }

  const drawStilt = (sx, syTop, syBot, w, rimWarm = 0.25) => {
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.ellipse(sx + w / 2, syBot, w * 1.2, 5, 0, 0, TAU); c.fill();
    c.fillStyle = cyl(c, sx, w, '#2D1E15', '#422D20', '#18100B');
    c.fillRect(sx, syTop, w, syBot - syTop);
    c.strokeStyle = '#07090F'; c.lineWidth = 2.0;
    c.strokeRect(sx, syTop, w, syBot - syTop);
    c.strokeStyle = 'rgba(7, 9, 15, 0.55)'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(sx + w * 0.45, syTop + 18); c.lineTo(sx + w * 0.45, syBot - 16); c.stroke();
    c.strokeStyle = `rgba(251, 191, 36, ${rimWarm})`; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(sx + 1.5, syTop + 4); c.lineTo(sx + 1.5, syBot - 4); c.stroke();
    c.restore();
  };

  if (o.haystack !== false) {
    c.save(); c.translate(1055, 502);
    c.fillStyle = 'rgba(0,0,0,0.42)'; c.beginPath(); c.ellipse(0, 2, 56, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#33281A';
    c.beginPath(); c.moveTo(-48, 0); c.quadraticCurveTo(-40, -62, 0, -76); c.quadraticCurveTo(40, -62, 48, 0); c.closePath(); c.fill();
    c.strokeStyle = '#07090F'; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = 'rgba(186, 230, 253, 0.22)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-42, -14); c.quadraticCurveTo(-30, -62, 0, -75); c.stroke();
    c.strokeStyle = 'rgba(217, 179, 108, 0.25)'; c.lineWidth = 1.2;
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(k * 9, -62 + Math.abs(k) * 5); c.lineTo(k * 12, -10); c.stroke(); }
    c.restore();
  }

  drawStilt(972, floorY, 496, 14, 0.12);

  if (o.bambooBed !== false) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.52)'; c.beginPath(); c.ellipse(892, 502, 72, 8, 0, 0, TAU); c.fill();
    for (const bx of [838, 940]) {
      c.fillStyle = '#241810'; c.fillRect(bx, 462, 7, 38);
      c.strokeStyle = '#07090F'; c.lineWidth = 1.6; c.strokeRect(bx, 462, 7, 38);
    }
    c.fillStyle = '#362519'; rr(c, 825, 454, 134, 11, 3); c.fill();
    c.strokeStyle = '#07090F'; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = 'rgba(251, 191, 36, 0.16)'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(827, 455.5); c.lineTo(957, 455.5); c.stroke();
    c.restore();
  }

  if (typeof o.underStiltFn === 'function') {
    o.underStiltFn(c, t, { floorY, groundY, bedY: 454, seatAnchorX: 896, seatAnchorY: 506, recommendedScale: 0.86 });
  } else if (o.entity) {
    drawEntity(c, 896, 506, 0.68, Object.assign({
      t, dark: true, tall: 1.0, dir: -1, prop: 'none', cap: false,
      suit: '#161C26', suitHi: '#222B3B', suitSh: '#0E131B',
      skin: '#202836',
      headColor: '#283242', headHi: '#38465C', headSh: '#151B24',
      reveal: 0.96, bloodSlits: true, eyeColor: '#FEF3C7',
      pose: poseSit(t), tilt: 0.16
    }, typeof o.entity === 'object' ? o.entity : {}));
  }

  drawStilt(820, floorY, 496, 16, 0.18);

  if (winOn) {
    c.save(); c.globalCompositeOperation = 'screen';
    for (const [gx, gw] of [[785, 16], [855, 20], [912, 14]]) {
      const lg = c.createLinearGradient(gx, floorY, gx - 24, groundY);
      lg.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
      lg.addColorStop(1, 'rgba(245, 158, 11, 0)');
      c.fillStyle = lg;
      c.beginPath(); c.moveTo(gx, floorY); c.lineTo(gx + gw, floorY); c.lineTo(gx + gw - 34, groundY); c.lineTo(gx - 34, groundY); c.closePath(); c.fill();
    }
    c.restore();
  }

  drawStilt(692, floorY, groundY, 19, 0.34);
  drawStilt(956, floorY, groundY, 19, 0.20);

  if (o.banana !== false) drawBananaCluster(c, 626, 510, 1.08, t);
  if (o.jars !== false) {
    for (const [jx, jy, js] of [[656, 510, 0.92], [682, 514, 0.72]]) {
      c.save(); c.translate(jx, jy); c.scale(js, js);
      c.fillStyle = 'rgba(0,0,0,0.42)'; c.beginPath(); c.ellipse(0, 0, 22, 5, 0, 0, TAU); c.fill();
      c.fillStyle = '#2B201C'; c.beginPath(); c.ellipse(0, -16, 19, 22, 0, 0, TAU); c.fill();
      c.strokeStyle = '#07090F'; c.lineWidth = 2.0; c.stroke();
      c.fillStyle = '#3B2C26'; rr(c, -11, -40, 22, 6, 2); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(186, 230, 253, 0.25)'; c.lineWidth = 1.2;
      c.beginPath(); c.arc(0, -16, 17, -2.5, -1.2); c.stroke();
      c.restore();
    }
  }

  if (o.ladder !== false) {
    c.save();
    c.strokeStyle = '#07090F'; c.lineWidth = 7.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(732, 510); c.lineTo(766, floorY - 4); c.moveTo(754, 510); c.lineTo(786, floorY - 4); c.stroke();
    c.strokeStyle = '#4A3425'; c.lineWidth = 4.5;
    c.beginPath(); c.moveTo(732, 510); c.lineTo(766, floorY - 4); c.moveTo(754, 510); c.lineTo(786, floorY - 4); c.stroke();
    c.strokeStyle = 'rgba(251, 191, 36, 0.28)'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(730.5, 510); c.lineTo(764.5, floorY - 4); c.stroke();
    for (let r = 1; r <= 7; r++) {
      const k = r / 8, rx1 = lerp(732, 766, k), rx2 = lerp(754, 786, k), ry = lerp(510, floorY - 4, k);
      c.strokeStyle = '#07090F'; c.lineWidth = 5.5; c.beginPath(); c.moveTo(rx1, ry); c.lineTo(rx2, ry); c.stroke();
      c.strokeStyle = '#5C4230'; c.lineWidth = 3.0; c.beginPath(); c.moveTo(rx1, ry); c.lineTo(rx2, ry); c.stroke();
    }
    c.restore();
  }

  // Upper house timber body raised smoothly by `lift` for clear under-stilt headroom
  c.save();
  if (lift) c.translate(0, lift);
  c.fillStyle = '#241811'; c.fillRect(838, 234, 148, 114);
  for (let py = 240; py < 346; py += 14) {
    c.strokeStyle = '#07090F'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(838, py); c.lineTo(986, py); c.stroke();
    c.strokeStyle = 'rgba(251, 191, 36, 0.08)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(838, py + 1.5); c.lineTo(986, py + 1.5); c.stroke();
  }
  c.strokeStyle = '#07090F'; c.lineWidth = 2.4; c.strokeRect(838, 234, 148, 114);

  c.fillStyle = '#2E1F16';
  c.beginPath(); c.moveTo(682, 348); c.lineTo(682, 234); c.lineTo(peakX, peakY); c.lineTo(842, 234); c.lineTo(842, 348); c.closePath(); c.fill();
  for (let py = 150; py < 346; py += 14) {
    const lx = py < 234 ? lerp(peakX, 682, (py - peakY) / (234 - peakY)) : 682;
    const rx = py < 234 ? lerp(peakX, 842, (py - peakY) / (234 - peakY)) : 842;
    c.strokeStyle = '#07090F'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx, py); c.lineTo(rx, py); c.stroke();
    c.strokeStyle = 'rgba(186, 230, 253, 0.08)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(lx + 2, py + 1.4); c.lineTo(rx - 2, py + 1.4); c.stroke();
  }
  c.strokeStyle = '#07090F'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(682, 348); c.lineTo(682, 234); c.lineTo(peakX, peakY); c.lineTo(842, 234); c.lineTo(842, 348); c.stroke();

  if (winOn) {
    glow(c, 900, 283, 130, '#F59E0B', 0.34);
    c.fillStyle = '#F59E0B'; rr(c, 876, 260, 48, 46, 2); c.fill();
    const wg = c.createRadialGradient(900, 289, 4, 900, 283, 32);
    wg.addColorStop(0, '#FEF3C7'); wg.addColorStop(1, '#D97706');
    c.fillStyle = wg; c.fillRect(878, 262, 44, 42);
  } else {
    c.fillStyle = '#12161E'; c.fillRect(876, 260, 48, 46);
  }
  c.strokeStyle = '#07090F'; c.lineWidth = 2.6; c.strokeRect(876, 260, 48, 46);
  c.lineWidth = 2.0;
  for (const bx of [891, 909]) { c.beginPath(); c.moveTo(bx, 260); c.lineTo(bx, 306); c.stroke(); }
  c.fillStyle = '#2B1B12';
  c.beginPath(); c.moveTo(875, 260); c.lineTo(925, 260); c.lineTo(938, 244); c.lineTo(886, 244); c.closePath(); c.fill();
  c.strokeStyle = '#07090F'; c.lineWidth = 2.0; c.stroke();

  if (winOn) {
    c.save(); c.globalCompositeOperation = 'screen';
    const beamBotY = 505 - lift;
    const wBeam = c.createLinearGradient(900, 283, 825, beamBotY);
    wBeam.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
    wBeam.addColorStop(1, 'rgba(245, 158, 11, 0)');
    c.fillStyle = wBeam;
    c.beginPath(); c.moveTo(878, 306); c.lineTo(922, 306); c.lineTo(878, beamBotY); c.lineTo(790, beamBotY); c.closePath(); c.fill();
    c.restore();
  }

  c.fillStyle = '#1D130D'; c.fillRect(742, 262, 40, 42);
  c.strokeStyle = '#07090F'; c.lineWidth = 2.2; c.strokeRect(742, 262, 40, 42);
  c.beginPath(); c.moveTo(762, 262); c.lineTo(762, 304); c.stroke();

  if (o.lantern !== false) {
    glow(c, 704, 284, 72, '#F59E0B', 0.28);
    c.strokeStyle = '#07090F'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(704, 250); c.lineTo(704, 272); c.stroke();
    c.fillStyle = '#FEF3C7'; rr(c, 699, 274, 10, 14, 3); c.fill();
    c.strokeStyle = '#07090F'; c.lineWidth = 1.8; c.stroke();
  }

  c.fillStyle = '#382519'; rr(c, 672, 344, 318, 13, 3); c.fill();
  c.strokeStyle = '#07090F'; c.lineWidth = 2.2; c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.22)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(674, 345.5); c.lineTo(988, 345.5); c.stroke();

  c.strokeStyle = '#07090F'; c.lineWidth = 2.2; c.fillStyle = '#4A3222';
  c.fillRect(678, 318, 162, 5); c.strokeRect(678, 318, 162, 5);
  for (let px = 684; px <= 834; px += 18) { c.fillRect(px, 320, 4, 24); c.strokeRect(px, 320, 4, 24); }

  c.fillStyle = '#1E2530';
  c.beginPath(); c.moveTo(peakX, peakY - 4); c.lineTo(975, peakY + 6); c.lineTo(1018, 246); c.lineTo(848, 242); c.closePath(); c.fill();
  for (let k = 0.08; k < 1; k += 0.08) {
    const rx1 = lerp(peakX, 975, k), ry1 = lerp(peakY - 4, peakY + 6, k);
    const rx2 = lerp(848, 1018, k), ry2 = lerp(242, 246, k);
    c.strokeStyle = 'rgba(7, 9, 15, 0.52)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(rx1, ry1); c.lineTo(rx2, ry2); c.stroke();
    c.strokeStyle = 'rgba(186, 230, 253, 0.14)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(rx1 + 1.5, ry1); c.lineTo(rx2 + 1.5, ry2); c.stroke();
  }
  c.strokeStyle = '#07090F'; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(peakX, peakY - 4); c.lineTo(975, peakY + 6); c.lineTo(1018, 246); c.lineTo(848, 242); c.closePath(); c.stroke();

  c.strokeStyle = '#07090F'; c.lineWidth = 8.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(656, 246); c.lineTo(peakX, peakY - 4); c.lineTo(852, 246); c.stroke();
  c.strokeStyle = '#4B3324'; c.lineWidth = 4.5;
  c.beginPath(); c.moveTo(656, 246); c.lineTo(peakX, peakY - 4); c.lineTo(852, 246); c.stroke();
  c.strokeStyle = 'rgba(186, 230, 253, 0.38)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(656, 242); c.lineTo(peakX, peakY - 7); c.lineTo(976, peakY + 3); c.stroke();
  c.restore();
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

// Low drifting ground mist & ambient fireflies/dust motes (lightweight, high depth separation)
function drawGroundMist(c, t = 0, o = {}) {
  const y0 = o.y !== undefined ? o.y : 430;
  const col = o.col || '#94A3B8';
  const alpha = o.alpha !== undefined ? o.alpha : 0.18;
  const count = o.count || 5;
  c.save();
  for (let i = 0; i < count; i++) {
    const k = i / Math.max(1, count - 1);
    const bandY = lerp(y0, H - 55, k);
    const bandH = lerp(42, 76, k);
    const drift = Math.sin(t * (0.38 + i * 0.09) + i * 1.9) * (48 + i * 12);
    const g = c.createLinearGradient(0, bandY - bandH * 0.5, 0, bandY + bandH * 0.5);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(0.5, rgba(col, alpha * (0.55 + 0.45 * Math.sin(t * 0.7 + i))));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.fillRect(Math.max(-60, drift - 60), bandY - bandH * 0.5, W + 120, bandH);
  }
  c.restore();
}

function drawDustMotes(c, t = 0, o = {}) {
  const count = o.count || 20;
  const col = o.col || '#FEF08A';
  const alpha = o.alpha !== undefined ? o.alpha : 0.48;
  const xMin = o.xMin !== undefined ? o.xMin : 60, xMax = o.xMax !== undefined ? o.xMax : W - 60;
  const yMin = o.yMin !== undefined ? o.yMin : 120, yMax = o.yMax !== undefined ? o.yMax : H - 100;
  c.save();
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < count; i++) {
    const px = lerp(xMin, xMax, hash(i * 17.3 + 1)) + Math.sin(t * (0.9 + hash(i) * 0.7) + i * 2.1) * 26;
    const py = lerp(yMin, yMax, hash(i * 31.7 + 3)) + Math.cos(t * (0.8 + hash(i + 4) * 0.6) + i * 1.4) * 18;
    const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t * (1.8 + hash(i + 9) * 1.5) + i));
    const r = (1.6 + hash(i * 7.1) * 2.2) * (0.85 + 0.3 * pulse);
    glow(c, px, py, r * 4.5, col, alpha * 0.42 * pulse);
    c.fillStyle = rgba(col, alpha * pulse);
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
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
  const gw = isShortsMode() ? SHORTS_W : W, gh = isShortsMode() ? SHORTS_H : H;
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay';
  const ox = Math.floor(hash(Math.floor(T * 30)) * 256), oy = Math.floor(hash(Math.floor(T * 30) + 5) * 256);
  c.translate(-ox, -oy); c.fillStyle = c.createPattern(grainCv, 'repeat'); c.fillRect(0, 0, gw + 256, gh + 256); c.restore();
}

// --------------------------------------------------------- HUD CARDS, TELEMETRY & SUBTITLES
const CREAM = '#F5EFE6', INK = '#1C1917', RED = '#B91C1C';
const CARD = { bg: CREAM, ink: INK, red: RED, muted: '#57534E' };

function getHudMode(s) {
  const sceneMode = s && s.hudMode ? String(s.hudMode).toLowerCase() : '';
  if (sceneMode === 'documentary' || sceneMode === 'survival') return sceneMode;
  if (typeof window !== 'undefined') {
    const winMode = window.HUD_MODE ? String(window.HUD_MODE).toLowerCase() : '';
    if (winMode === 'documentary' || winMode === 'survival') return winMode;
    const tlMode = window.TIMELINE && window.TIMELINE.hudMode ? String(window.TIMELINE.hudMode).toLowerCase() : '';
    if (tlMode === 'documentary' || tlMode === 'survival') return tlMode;
  }
  return 'survival';
}

function setHudMode(mode) {
  if (typeof window !== 'undefined') {
    window.HUD_MODE = String(mode || 'survival').toLowerCase() === 'documentary' ? 'documentary' : 'survival';
  }
}

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
  if (shorts) {
    const safeW = SHORTS_W - 140 - 56;
    const sx = clamp(Math.round(56 + (safeW - w) / 2), 48, Math.max(48, SHORTS_W - w - 140));
    const sy = pos === 'tl' || pos === 'left' ? 490 : 510;
    return [sx, clamp(sy, 340, SHORTS_H - h - 420)];
  }
  const maxX = W - w - 46;
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
  // Disabled by default for clean cinematic storytelling (opt-in only if __ENABLE_STORY_HUD === true)
  // Always disabled when hudMode === 'documentary' (Clean Cinema Mode: zero HUD boxes on screen)
  if (typeof window === 'undefined' || !window.__ENABLE_STORY_HUD || window.__HIDE_HUD) return;
  if (getHudMode() === 'documentary') return;
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
  if (typeof window === 'undefined' || !window.__ENABLE_STORY_HUD || window.__HIDE_HUD) return;
  if (getHudMode() === 'documentary') return;
  const shorts = isShortsMode();
  const cx = shorts ? 485 : 480, top = shorts ? 500 : 110;
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

// Theme-Agnostic Telemetry Renderer (disabled by default; strictly disabled in hudMode: "documentary")
function drawTele(c, s, lt) {
  if (typeof window === 'undefined' || !window.__ENABLE_STORY_TELE || window.__HIDE_HUD) return;
  if (getHudMode(s) === 'documentary') return;
  const tl = s.tele || s.telemetry; if (!tl) return;
  const shorts = isShortsMode();
  if (shorts && typeof window !== 'undefined' && window.__HIDE_SHORTS_TELE) return;
  const x = shorts ? (SHORTS_W - 150) : (W - 46), y = shorts ? 425 : 40, w = 344;
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
  const timeSz = timeStr ? fitTextSize(c, timeStr, 128, 28, 15, 700) : 28;
  const timeW = timeStr ? measure(c, timeStr, timeSz, 700) : 0;
  const leftMaxW = Math.max(120, w - 38 - (timeStr ? timeW + 10 : 0));
  txt(c, dayStr, x - w + 16, y + 26, fitTextSize(c, dayStr, leftMaxW, 15, 11, 600), '#F5EFE6', 600);
  if (timeStr) txt(c, timeStr, x - 16, y + 42, timeSz, '#fff', 700, 'right');

  let statusTxt = tl.statusText || '';
  let statusCol = '#D6D3D1';
  if (tl.lights === false) { statusTxt = statusTxt || '◼ ไฟดับ'; statusCol = '#F87171'; }
  else if (tl.status === 'CRITICAL') { statusTxt = statusTxt || '◼ ภัยคุกคามวิกฤต'; statusCol = '#F87171'; }
  else if (tl.status === 'DANGER') { statusTxt = statusTxt || '◼ สัญญาณอันตราย'; statusCol = '#F87171'; }
  else if (tl.status === 'SAFE') { statusTxt = statusTxt || '◻ ปลอดภัย'; statusCol = '#9AE6B4'; }
  else if (tl.status === 'WARN') { statusTxt = statusTxt || '◻ ผิดปกติ · เฝ้าระวัง'; statusCol = '#FBBF24'; }
  else if (tl.lights === true) { statusTxt = statusTxt || '◻ ไฟเปิด'; statusCol = '#D6D3D1'; }
  if (statusTxt) txt(c, statusTxt, x - w + 16, y + 50, fitTextSize(c, statusTxt, leftMaxW, 14, 11, 600), statusCol, 600);

  let yy = y + 62;
  if (bar) {
    const r = clamp(bar.ratio !== undefined ? bar.ratio : (bar.value / (bar.max || 100)));
    const lblText = bar.label || 'สถานะ';
    const valText = bar.text || `${bar.value}${bar.unit || ''}`;
    const lblSz = fitTextSize(c, lblText, 112, 13, 10, 600);
    const valSz = fitTextSize(c, valText, 64, 13, 10, 600);
    txt(c, lblText, x - w + 16, yy + 18, lblSz, '#A8A29E', 600);
    const barX = x - w + 132, barW = 126;
    c.fillStyle = 'rgba(255,255,255,0.12)'; rr(c, barX, yy + 8, barW, 10, 5); c.fill();
    c.fillStyle = bar.color || '#FACC15'; rr(c, barX, yy + 8, Math.max(6, barW * r), 10, 5); c.fill();
    txt(c, valText, x - 16, yy + 19, valSz, bar.warn ? '#FCA5A5' : '#E7E5E4', 600, 'right');
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
    const distTag = `● ${tl.distLabel || 'ระยะห่าง'}`;
    const tagW = measure(c, distTag, 13, 700) + 22;
    const valSz = fitTextSize(c, distVal, 112, 22, 14, 700);
    const valW = measure(c, distVal, valSz, 700);
    const pillW = Math.max(246, Math.ceil(tagW + valW + 34));
    c.fillStyle = CREAM; rr(c, x - pillW, dy, pillW, 44, 10); c.fill();
    badge(c, x - pillW + 8, dy + 9, distTag, true);
    txt(c, distVal, x - 14, dy + 31, valSz, RED, 700, 'right');
  }
  c.restore();
}

function drawChapter(c, chap, lt) {
  // Permanently disabled: red chapter pill banners removed for clean cinematic video
  return;
}

// --------------------------------------------------------- SUBTITLES (FRAMELESS — Pop-In + Keyword Highlight + 9:16 Safe Zone Aware)
function drawSub(c, s, lt) {
  if (typeof window !== 'undefined' && window.__HIDE_HUD) return;
  if (!s.subs) return;
  const cue = s.subs.find(q => {
    const t0 = q.t0 !== undefined ? q.t0 : q.start;
    const t1 = q.t1 !== undefined ? q.t1 : q.end;
    return lt >= t0 && lt < t1;
  });
  if (!cue) return;
  const t0 = cue.t0 !== undefined ? cue.t0 : cue.start;
  const isShorts = typeof window !== 'undefined' && window.SHORTS_MODE;
  const ctaActive = isShorts && typeof window.__SHORTS_REM_SEC === 'number' && window.__SHORTS_REM_SEC <= 2.25 && window.__SHORTS_REM_SEC >= 0.04;
  const subY = isShorts ? (ctaActive ? 1482 : Math.min(SHORTS_H - 42, 1500)) : (H - 42);
  const maxSubW = isShorts ? (SHORTS_W - 220) : (W - 120);
  const subSz = fitTextSize(c, cue.text, maxSubW, isShorts ? 42 : 29, isShorts ? 26 : 20, 700);
  const subX = isShorts ? 495 : (W / 2);
  const pop = easeBack(prog(lt, t0, t0 + 0.09));
  const sc = 0.88 + 0.12 * pop;
  const kwPattern = '(?<![\\u0E40-\\u0E44])(?:\\d+(?:[.,:]\\d+)?%?|กฎข้อ\\s*\\d+|ห้าม|ตาย|อันตราย|วิกฤต|คำพิพากษา|โรคระบาด|แพะรับบาป|ผีปอบ|อีปอบ|อำนาจมืด|อคติ|กรรมพันธุ์|หมอธรรม|ทายาทอสูร|อหิวาตกโรค|ไข้ป่า|ท้องป่อง|ตีหนึ่ง|ตีสอง|ตีสาม|ตีสี่|ตีห้า|วินาที|นาที|ชั่วโมง|เมตร|องศา|บาท)(?![\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E])';
  const kwSplitRe = new RegExp(`(${kwPattern})`, 'g');
  const kwExactRe = new RegExp(`^${kwPattern}$`);
  const dangerRe = /^(?:ห้าม|ตาย|อันตราย|วิกฤต|คำพิพากษา|ผีปอบ|อีปอบ|แพะรับบาป|โรคระบาด|อำนาจมืด)$/;
  const parts = String(cue.text || '').split(kwSplitRe).filter(Boolean);

  c.save();
  c.font = `700 ${subSz}px ${FONT}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round';
  const widths = parts.map(p => c.measureText(p).width);
  const totalW = widths.reduce((a, b) => a + b, 0);
  c.translate(subX, subY);
  c.scale(sc, sc);

  c.lineWidth = 7;
  c.strokeStyle = 'rgba(9,9,11,0.92)';
  let px = -totalW / 2;
  for (let i = 0; i < parts.length; i++) {
    c.strokeText(parts[i], px, 0);
    px += widths[i];
  }

  c.shadowColor = 'rgba(0,0,0,0.6)';
  c.shadowBlur = 10;
  px = -totalW / 2;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const isDanger = dangerRe.test(p);
    const isKw = !isDanger && kwExactRe.test(p);
    c.fillStyle = isDanger ? '#F87171' : (isKw ? '#FACC15' : '#FFFFFF');
    c.fillText(p, px, 0);
    px += widths[i];
  }
  c.restore();
}

// Non-intrusive silent Visual CTA / Related Video Bridge pointer inside 9:16 Safe Active Zone
function drawShortsEndingCTA(c, s, lt, t = 0, totalDur = 0) {
  if (typeof window === 'undefined' || !window.SHORTS_MODE || window.__HIDE_HUD) return;
  // Yield cleanly when render_all_shorts.js composites dedicated high-res overlay_<tag>_cta.png
  if (window.__SHORTS_CTA_OVERLAY_ACTIVE) return;
  let remSec = null;
  if (typeof window.__SHORTS_REM_SEC === 'number') {
    remSec = window.__SHORTS_REM_SEC;
  } else if (s && s.visualCta) {
    remSec = Math.max(0, Number(s.dur || 0) - lt);
  } else if (totalDur > 0) {
    remSec = Math.max(0, totalDur - t);
  }
  const ctaWindow = window.__SHORTS_IN_BRIDGE ? 3.8 : 2.25;
  if (remSec === null || remSec > ctaWindow || remSec < 0.04) return;

  const elapsed = ctaWindow - remSec;
  const a = clamp(prog(elapsed, 0, 0.25)) * clamp(remSec / 0.12);
  if (a <= 0.02) return;

  const isFollow = window.__SHORTS_IS_FINAL === false && !window.__SHORTS_IN_BRIDGE;
  const badgeTxt = isFollow ? '+ ติดตาม' : '▶ คลิปเต็ม';
  const label = (s && s.visualCta) || window.__SHORTS_CTA_TEXT || (isFollow
    ? 'กดติดตามรอตอนจบ · คลิปเต็มหน้าช่อง'
    : 'ดูเฉลยเต็มที่ลิงก์ด้านล่าง');

  const x = 56;
  const y = 1528;
  const h = 52;
  const arrowBounce = Math.sin(elapsed * 11) * 5;
  const badgeW = Math.ceil(measure(c, badgeTxt, 18, 800)) + 24;
  const arrowZone = 32;
  const lblSz = fitTextSize(c, label, 820 - badgeW - arrowZone - 32, 22, 14, 800);
  const lblW = Math.ceil(measure(c, label, lblSz, 800));
  const boxW = Math.min(846, badgeW + lblW + arrowZone + 32);

  c.save();
  c.globalAlpha = a;
  c.shadowColor = 'rgba(0,0,0,0.65)';
  c.shadowBlur = 18;
  c.fillStyle = 'rgba(8, 15, 13, 0.92)';
  rr(c, x, y, boxW, h, 10);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = 'rgba(250, 204, 21, 0.72)';
  c.lineWidth = 2.0;
  rr(c, x, y, boxW, h, 10);
  c.stroke();

  c.fillStyle = '#DC2626';
  rr(c, x + 6, y + 6, badgeW, h - 12, 7);
  c.fill();
  txt(c, badgeTxt, x + 6 + badgeW / 2, y + 32, 18, '#FFFFFF', 800, 'center');

  txt(c, label, x + badgeW + 18, y + 33, lblSz, '#FACC15', 800, 'left');
  // Downward arrow pointing toward YouTube Shorts Related Video link at bottom-left
  txt(c, '▼', x + 46, y + h + 22 + arrowBounce, 24, '#FACC15', 900, 'center');
  c.restore();
}
