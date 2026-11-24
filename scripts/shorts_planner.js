// =============================================================================
//  shorts_planner.js — Cliffhanger Bridge (40-50s, 3-Angle), Event-Cut & Legacy Shorts Planner
//  Part of skill: reallens-horror-animator
//
//  Rules:
//    - Format "cliffhanger" (default on >60s videos) : Generates 3 distinct 40-50s
//      Cliffhanger Bridge Shorts per long-form episode:
//        1. Ritual / Creepy Belief angle   (cliff_01_ritual)
//        2. High-Tension Incident angle    (cliff_02_tension)
//        3. Paradox / Twist Tease angle    (cliff_03_twist)
//      STRICT Anti-Spoiler: NEVER includes science/history decode or reveal scenes.
//      STRICT Sentence-Boundary Snapping: Never cuts mid-word or mid-sentence.
//      Appends a 3.5s Related Video Bridge CTA ("ดูเฉลยเต็มที่ลิงก์ด้านล่าง").
//    - Format "events"   : Extracts standalone 45-58s event clips.
//    - Format "single"   : Condenses the full arc into 1 clip (45-58s).
//    - Format "two_part" : Max 2 parts (<= 58s each), with a 3s recap at start of Part 2.
//    - Format "both"/"all": Generates multiple packaging cuts cleanly.
//
//  CLI Usage:
//    node scripts/shorts_planner.js [--dir <projectDir>] [--format cliffhanger|events|single|two_part|all] [--min-sec 40] [--max-sec 50]
// =============================================================================
const fs = require('fs');
const path = require('path');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const HIGH_IMPACT_SFX = /stinger|sting|shriek|scream|crack|crash|slam|blackout|boom|heartbeat|alert|squeak|rumble|attack|roar|growl|hiss|snap|thunder|phin_sting|torch_whoosh|ritual_drum|rimshot|ba_dum_tss|record_scratch|vine_boom|cash_register|sad_trombone|line_ping|slurp/i;
const HIGH_IMPACT_VIEW = /twist|climax|entity|monster|creature|chase|hide|attack|reveal|crack|escape|showdown|blood|danger|trap|swarm|dead|panic|freeze|collapse|confront|punchline|versus|price_tag|shock|wallet|bill|boss|chat|banish|ecu|rattan|delirium/i;

const REVEAL_PHASE_SET = new Set(['decode', 'reveal', 'science', 'medical', 'history_decode', 'conclusion', 'outro', 'epilogue']);
const REVEAL_TEXT_RE = /(เฉลย|สาเหตุที่แท้จริง|ความจริงทางวิทยาศาสตร์|หลักฐานทางการแพทย์|ทางการแพทย์อธิบาย|วินิจฉัยว่า|งานวิจัยพบว่า|แท้จริงแล้วคือ|แท้จริงแล้วเป็น|สรุปแล้ว|ข้อคิดจากตำนาน|คอมเมนต์|กดติดตาม)/i;
const REVEAL_VIEW_ID_RE = /(?:decode|reveal|science|medical|anthropology|conclusion|outro|epilogue|summary|explain)/i;

const INCOMPLETE_TAIL_RE = /(?:แต่|และ|หรือ|ที่|ซึ่ง|ว่า|เพราะ|จน|คือ|กับ|ใน|ของ|เมื่อ|ถ้า|หาก|โดย|จาก|เพื่อ|ให้|เป็น|อย่าง|กำลัง|จะ|แล้วก็|ส่วน|รวมถึง|ทั้งที่|แม้ว่า)$/u;

const ANGLE_DEFINITIONS = [
  {
    key: 'ritual',
    tag: 'cliff_01_ritual',
    label: 'มุมพิธีกรรมและความเชื่อหลอน',
    subHook: 'พิธีกันผีนี้... ซ่อนอะไรไว้?!',
    re: /(พิธี|ความเชื่อ|ข้อห้าม|อาคม|ยันต์|ทาเล็บ|หนามพุทรา|ใบหนาด|หมอธรรม|ตำนาน|ศาล|เครื่องเซ่น|หุ่นไล่กา|ไล่ผี|แก้เคล็ด|คาถา|ปลุกเสก|สายสิญจน์|เซ่นไหว้|ritual|taboo|belief|charm|folklore|shrine)/i
  },
  {
    key: 'tension',
    tag: 'cliff_02_tension',
    label: 'มุมเหตุการณ์และคำบอกเล่าสุดตึงเครียด',
    subHook: 'คืนนั้น... เกิดอะไรขึ้นกันแน่?!',
    re: /(กลางดึก|เงา|เสียงเคาะ|กรีดร้อง|วิ่งหนี|ไหลตาย|ศพ|ตื่นมา|หายใจไม่ออก|พยาน|คืนนั้น|บันทึกข่าว|หวาดผวา|ตายไม่ทราบสาเหตุ|หลับไม่ตื่น|เงียบสงัด|incident|witness|panic|encounter|climax|approach|attack|chase)/i
  },
  {
    key: 'twist',
    tag: 'cliff_03_twist',
    label: 'มุมปมหักมุมชวนสงสัยก่อนเฉลย',
    subHook: 'ทำไมถึงเกิดซ้ำเฉพาะจุดนี้?!',
    re: /(ทำไม|แปลก|ขัดแย้ง|ปริศนา|ไม่มีใครอธิบาย|บังเอิญ|หลักฐาน|ซ้ำรอย|เฉพาะผู้ชาย|ไร้บาดแผล|แต่แล้ว|กลับพบว่า|น่าสงสัย|คำถาม|ผิดปกติ|anomaly|paradox|clue|mystery|twist|question)/i
  }
];

function getSceneText(sc) {
  if (!sc || typeof sc !== 'object') return '';
  if (typeof sc.narration === 'string' && sc.narration.trim()) return sc.narration;
  if (typeof sc.vo === 'string' && sc.vo.trim()) return sc.vo;
  if (Array.isArray(sc.voSegments)) return sc.voSegments.map(x => x?.text || '').join(' ').trim();
  return '';
}

function isRevealOrDecodeScene(sc, idx = 0, total = 1) {
  if (!sc) return false;
  if (sc.isReveal === true || sc.isDecode === true || sc.isSpoiler === true || sc.excludeFromShorts === true || sc.isFinalScene === true) {
    return true;
  }
  const phase = String(sc.phase || '').toLowerCase().trim();
  if (REVEAL_PHASE_SET.has(phase)) return true;
  if (total >= 3 && idx >= Math.floor(total * 0.52)) {
    const idView = `${sc.id || ''} ${sc.view || ''}`;
    const txt = getSceneText(sc);
    if (REVEAL_VIEW_ID_RE.test(idView) || REVEAL_TEXT_RE.test(txt)) return true;
  }
  return false;
}

// Snap a scene cut window strictly to a complete sentence / subtitle boundary (never mid-word/mid-sentence)
function snapSceneWindowToSentence(sc, maxDur) {
  const fullDur = Number(sc.dur || 0);
  if (fullDur <= maxDur || !Array.isArray(sc.subs) || sc.subs.length === 0) {
    const lastCue = Array.isArray(sc.subs) && sc.subs.length ? sc.subs[sc.subs.length - 1].text : '';
    return {
      start: Number(sc.start || 0),
      dur: fullDur,
      snapped: true,
      trimmed: false,
      endCueText: lastCue || ''
    };
  }

  let bestCue = null;
  let fallbackCue = null;
  for (const cue of sc.subs) {
    const t1 = Number(cue.t1 !== undefined ? cue.t1 : (cue.end || 0));
    const endWithPad = Math.min(fullDur, t1 + 0.22);
    if (endWithPad > maxDur) break;
    fallbackCue = { t1: endWithPad, text: String(cue.text || '').trim() };
    const cleanTxt = fallbackCue.text.replace(/[….,]+$/, '').trim();
    const isComplete = !INCOMPLETE_TAIL_RE.test(cleanTxt) && (/[!?؟]$/.test(cleanTxt) || cleanTxt.length >= 8);
    if (isComplete) bestCue = fallbackCue;
  }
  const chosen = bestCue || fallbackCue;
  if (!chosen || chosen.t1 < 1.5) {
    return {
      start: Number(sc.start || 0),
      dur: fullDur,
      snapped: true,
      trimmed: false,
      endCueText: sc.subs[sc.subs.length - 1]?.text || ''
    };
  }
  return {
    start: Number(sc.start || 0),
    dur: Number(chosen.t1.toFixed(3)),
    snapped: true,
    trimmed: true,
    endCueText: chosen.text
  };
}

function isCliffhangerScene(sc) {
  if (!sc) return false;
  if (sc.isClimax || sc.isCliffhanger) return true;
  const card = sc.card || sc.hud;
  if (card && /^(dilemma|flow|anomaly|clue|punchline|versus)$/.test(card.type || '')) return true;
  const tl = sc.telemetry || sc.tele;
  if (tl && (tl.status === 'CRITICAL' || tl.status === 'DANGER')) return true;
  const vo = getSceneText(sc).trim();
  return /[?؟!]$/.test(vo);
}

function scoreSceneDramaticImpact(scene, posInEp = 0, totalInEp = 1) {
  if (!scene) return 0;
  if (typeof scene.coverScore === 'number') return scene.coverScore;

  let score = 0;
  if (scene.isClimax) score += 60;
  if (scene.coverAt !== undefined) score += 40;

  const tl = scene.telemetry || scene.tele;
  if (tl) {
    if (tl.status === 'CRITICAL') score += 32;
    else if (tl.status === 'DANGER') score += 26;
    else if (tl.status === 'WARN') score += 8;
    if (tl.lights === false) score += 20;
    if (tl.distance || tl.dist) score += 24;
    if (tl.wallet != null && tl.wallet < 100) score += 20;
    if (tl.battery != null && tl.battery <= 15) score += 16;
  }

  const card = scene.card || scene.hud;
  if (card) {
    if (card.type === 'dilemma' || card.type === 'flow' || card.type === 'versus') score += 22;
    else if (card.type === 'anomaly' || card.type === 'clue' || card.type === 'punchline') score += 22;
    else if (card.type === 'rule' || card.type === 'social') score += 20;
    else if (card.type === 'math' || card.type === 'calc' || card.type === 'price_tag') score += 14;
    else if (card.type === 'info' || card.type === 'speech' || card.type === 'thought') score += 8;
    else if (card.type === 'inventory') score += 4;
  }

  const sfxList = scene.sfx || [];
  let sfxHits = 0;
  for (const cue of sfxList) {
    const key = cue.type || cue.k || '';
    if (HIGH_IMPACT_SFX.test(key)) sfxHits++;
  }
  score += Math.min(24, sfxHits * 10);

  const viewAndId = `${scene.view || ''} ${scene.id || ''}`;
  if (HIGH_IMPACT_VIEW.test(viewAndId)) score += 16;

  if (posInEp === 0 || (totalInEp > 1 && posInEp >= totalInEp - 2)) score += 10;
  if (scene.dur >= 4.0) score += 4;

  return score;
}

function pickKeyTimestampInScene(scene, winStart = null, winEnd = null) {
  const sStart = Number(scene.start || 0);
  const sDur = Number(scene.dur || 4);
  const lo = winStart !== null ? Math.max(sStart + 0.32, winStart + 0.32) : sStart + 0.32;
  const hi = winEnd !== null ? Math.min(sStart + sDur - 0.32, winEnd - 0.32) : sStart + sDur - 0.32;
  const safeClamp = (absT) => Number(clamp(absT, Math.min(lo, hi), Math.max(lo, hi)).toFixed(2));

  if (scene.coverAt !== undefined) {
    return safeClamp(sStart + Number(scene.coverAt));
  }

  const sfxList = scene.sfx || [];
  for (const cue of sfxList) {
    const key = cue.type || cue.k || '';
    const at = cue.at !== undefined ? Number(cue.at) : Number(cue.t || 0);
    if (HIGH_IMPACT_SFX.test(key) && sStart + at + 0.35 >= lo && sStart + at + 0.35 <= hi) {
      return safeClamp(sStart + at + 0.35);
    }
  }

  const card = scene.card || scene.hud;
  if (card) {
    const at = card.at !== undefined ? Number(card.at) : 0.4;
    const candidate = sStart + at + 1.15;
    if (candidate >= lo && candidate <= hi) return safeClamp(candidate);
  }

  return safeClamp(lo + (hi - lo) * 0.58);
}

function segmentThaiWords(text) {
  if (typeof Intl === 'undefined' || !Intl.Segmenter) return null;
  return Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(text), p => p.segment);
}

function trimHeadlinePhrase(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= maxChars) return s;
  const segs = segmentThaiWords(s);
  if (segs) {
    let acc = '';
    for (const seg of segs) {
      if ((acc + seg).trim().length > maxChars) break;
      acc += seg;
    }
    const clean = acc.trim().replace(/[.,…:;\-]+$/, '');
    if (clean.length >= Math.floor(maxChars * 0.45)) return clean;
  }
  const cut = s.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace >= Math.floor(maxChars * 0.55) ? cut.slice(0, lastSpace) : cut).replace(/[.,…:;\-]+$/, '');
}

function trimPunchTail(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= maxChars) return s;
  if (/[\d!?؟]/.test(s.slice(-12))) {
    const segs = segmentThaiWords(s);
    if (segs) {
      let acc = '';
      let bestAcc = '';
      for (let i = segs.length - 1; i >= 0; i--) {
        if ((segs[i] + acc).trim().length > maxChars) break;
        acc = segs[i] + acc;
        const cleanStart = /^[\u0E01-\u0E2E\u0E40-\u0E44A-Za-z0-9]/.test(segs[i])
          && (i === 0 || !/[\u0E40-\u0E44]$/.test(segs[i - 1]));
        if (cleanStart) bestAcc = acc.trim();
      }
      if (bestAcc.length >= Math.floor(maxChars * 0.45)) return bestAcc;
    }
    return s.slice(-maxChars).trim();
  }
  return trimHeadlinePhrase(s, maxChars);
}

function extractCuriosityHookFromVo(rawText) {
  const clean = String(rawText || '').split('|')[0].replace(/…/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 8) return null;

  const twistSplit = clean.match(/^(.{6,34}?)(?:\s*[,.;]\s*|\s+(?:แต่|กลับ|จน|พบว่า|กลายเป็น|แถม|สรุป|แล้ว)\s*)(.{4,})$/);
  let top = '';
  let punch = '';
  if (twistSplit) {
    top = trimHeadlinePhrase(twistSplit[1], 34);
    punch = trimPunchTail(twistSplit[2], 26);
  } else {
    const spaceParts = clean.split(/\s+/).filter(Boolean);
    if (spaceParts.length >= 2) {
      const mid = Math.max(1, Math.min(spaceParts.length - 1, Math.ceil(spaceParts.length * 0.55)));
      top = trimHeadlinePhrase(spaceParts.slice(0, mid).join(' '), 34);
      punch = trimPunchTail(spaceParts.slice(mid).join(' '), 26);
    } else {
      const segs = segmentThaiWords(clean);
      if (segs) {
        const target = Math.floor(clean.length * 0.55);
        let acc = '';
        let splitIdx = 0;
        for (let i = 0; i < segs.length; i++) {
          if (acc.length >= target && acc.length >= 8) break;
          acc += segs[i];
          splitIdx = i + 1;
        }
        const rest = segs.slice(splitIdx).join('').trim();
        if (acc.trim().length >= 6 && rest.length >= 4) {
          top = trimHeadlinePhrase(acc.trim(), 34);
          punch = trimPunchTail(rest, 26);
        }
      }
    }
  }
  if (!top || !punch) return null;
  if (!/[!?؟]$/.test(punch)) {
    const isQ = /ทำไม|ใคร|อะไร|ที่ไหน|เมื่อไหร่|ยังไง|ทำไง|จริงหรือ/.test(`${top} ${punch}`);
    punch = trimHeadlinePhrase(punch, 26) + (isQ ? '?!' : '!');
  }
  return { topLine: top, redWord: punch };
}

function deriveHeadlineFromScene(scene, epNum, totalEps, fallbackTitle) {
  if (Array.isArray(scene?.coverHeadline) && scene.coverHeadline.length >= 2) {
    return { topLine: scene.coverHeadline[0], redWord: scene.coverHeadline[1] };
  }
  const tl = scene?.telemetry || scene?.tele;
  const card = scene?.card || scene?.hud;
  const voHook = extractCuriosityHookFromVo(getSceneText(scene));
  if (card) {
    const titles = Array.isArray(card.title) ? card.title : [card.title, card.sub].filter(Boolean);
    const shortRule = card.ruleNo ? `${card.ruleNo} ห้ามพลาด!` : null;
    if (titles.length >= 2) {
      const punch = titles[1].length <= 26 ? titles[1] : (shortRule || voHook?.redWord || (tl?.label && tl.label.length <= 26 ? tl.label : null) || trimHeadlinePhrase(titles[1], 26));
      return { topLine: trimHeadlinePhrase(titles[0], 34), redWord: punch };
    }
    if (titles.length === 1) {
      return {
        topLine: trimHeadlinePhrase(titles[0], 34),
        redWord: voHook?.redWord || shortRule || (tl?.label && trimHeadlinePhrase(tl.label, 24)) || (epNum === totalEps && totalEps > 1 ? 'จุดจบจริง?!' : 'พลาดไม่ได้!')
      };
    }
  }
  if (voHook) return voHook;
  const chapTitle = scene?.chapter
    ? (Array.isArray(scene.chapter) ? scene.chapter[1] : scene.chapter.title)
    : null;
  if (chapTitle && tl?.label) return { topLine: trimHeadlinePhrase(chapTitle, 34), redWord: trimHeadlinePhrase(tl.label, 24) };
  if (chapTitle) return { topLine: trimHeadlinePhrase(chapTitle, 34), redWord: epNum === totalEps ? 'ความจริงทั้งหมด?!' : 'นาทีวิกฤต!' };
  if (tl?.day && tl?.label) return { topLine: trimHeadlinePhrase(String(tl.day), 34), redWord: trimHeadlinePhrase(String(tl.label), 24) };
  const fbHook = extractCuriosityHookFromVo(fallbackTitle);
  if (fbHook) return fbHook;
  const cleanFallback = String(fallbackTitle || '').split('|')[0].trim();
  return { topLine: trimHeadlinePhrase(cleanFallback || `เหตุการณ์ที่ ${epNum}`, 34), redWord: epNum === totalEps ? 'บทสรุปจริง?!' : 'จุดเปลี่ยนสำคัญ!' };
}

function stripEpPrefix(text) {
  return String(text || '')
    .replace(/^(?:EP\.?\s*\d+(?:\s*\([^)]*\))?|ตอนที่\s*\d+|เหตุการณ์\s*(?:ที่|#)?\s*\d+|ตอนจบ|ตอนเดียวจบ|จบใน\s*\d*\s*คลิป(?:\s*เดียว)?)\s*[:·\-–—]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitShortTwoLines(rawText, maxLineChars = 22) {
  const s = stripEpPrefix(String(rawText || '').split('|')[0]).replace(/[“”"]/g, '').trim();
  if (!s) return ['เรื่องเล่า', 'ห้ามพลาด!'];
  if (s.length <= 10) return [s, 'ห้ามพลาด!'];

  const compact = s.length > maxLineChars * 2 ? trimHeadlinePhrase(s, maxLineChars * 2) : s;
  const words = compact.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    let bestSplit = -1;
    let bestScore = Infinity;
    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(' ');
      const l2 = words.slice(i).join(' ');
      if (l1.length < 4 || l2.length < 3) continue;
      if (l1.length <= maxLineChars && l2.length <= maxLineChars) {
        const diff = Math.abs(l1.length - l2.length);
        if (diff < bestScore) { bestScore = diff; bestSplit = i; }
      }
    }
    if (bestSplit !== -1) {
      const a = trimHeadlinePhrase(words.slice(0, bestSplit).join(' '), maxLineChars);
      const b = trimHeadlinePhrase(words.slice(bestSplit).join(' '), maxLineChars);
      if (a && b && !/^[!?.,…]+$/.test(b)) return [a, b];
    }
  }

  const segs = segmentThaiWords(compact);
  if (segs && segs.length >= 2) {
    const target = Math.floor(compact.length * 0.52);
    let acc = '';
    let bestIdx = -1;
    let bestDist = Infinity;
    let fallbackIdx = -1;
    let fallbackDist = Infinity;
    for (let i = 0; i < segs.length - 1; i++) {
      acc += segs[i];
      const nextSeg = segs[i + 1] || '';
      const validBreak = !/^[!?.,…\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+$/.test(nextSeg)
        && !/^\d+$/.test(segs[i].trim());
      const l1Len = acc.trim().length;
      const l2Len = compact.slice(acc.length).trim().length;
      if (validBreak && l1Len >= 4 && l2Len >= 3) {
        const dist = Math.abs(l1Len - target);
        if (l1Len <= maxLineChars && l2Len <= maxLineChars) {
          if (dist < bestDist) { bestDist = dist; bestIdx = i + 1; }
        } else if (dist < fallbackDist) {
          fallbackDist = dist; fallbackIdx = i + 1;
        }
      }
    }
    const chosenIdx = bestIdx !== -1 ? bestIdx : fallbackIdx;
    if (chosenIdx !== -1) {
      const l1 = trimHeadlinePhrase(segs.slice(0, chosenIdx).join('').trim(), maxLineChars);
      const l2 = trimHeadlinePhrase(segs.slice(chosenIdx).join('').trim(), maxLineChars);
      if (l1 && l2 && !/^[!?.,…]+$/.test(l2)) return [l1, l2];
    }
  }

  const mid = Math.ceil(compact.length / 2);
  return [trimHeadlinePhrase(compact.slice(0, mid), maxLineChars), trimHeadlinePhrase(compact.slice(mid), maxLineChars) || '!'];
}

function deriveShortsHeaderFields({ bestScene, seriesTitle, headline, epNum, totalEps, isEvent = false, isFinal = false, spec = {}, ovCfg = null, covCfg = null, cfg = {} }) {
  const topCfgTitle = spec.shortsTitle || bestScene?.shortsTitle || (!isEvent && cfg.shortsTitle) || (!isEvent && cfg.SHORTS_TITLE);
  const customArr = Array.isArray(topCfgTitle) && topCfgTitle.length >= 2 ? topCfgTitle : null;
  const customStr = typeof topCfgTitle === 'string' && topCfgTitle.trim() ? topCfgTitle.trim() : null;

  let titleTop, titleBot;
  if (ovCfg?.titleTop && ovCfg?.titleBot) {
    titleTop = stripEpPrefix(ovCfg.titleTop);
    titleBot = stripEpPrefix(ovCfg.titleBot);
  } else if (spec.topLine && spec.redWord) {
    titleTop = trimHeadlinePhrase(stripEpPrefix(spec.topLine), 24);
    titleBot = trimHeadlinePhrase(stripEpPrefix(spec.redWord), 24);
  } else if (customArr) {
    titleTop = trimHeadlinePhrase(stripEpPrefix(customArr[0]), 24);
    titleBot = trimHeadlinePhrase(stripEpPrefix(customArr[1]), 24);
  } else if (customStr) {
    [titleTop, titleBot] = splitShortTwoLines(customStr, 22);
  } else if (isEvent) {
    const evArr = Array.isArray(spec.coverHeadline) && spec.coverHeadline.length >= 2
      ? spec.coverHeadline
      : (Array.isArray(bestScene?.coverHeadline) && bestScene.coverHeadline.length >= 2 ? bestScene.coverHeadline : null);
    if (evArr) {
      titleTop = trimHeadlinePhrase(stripEpPrefix(evArr[0]), 24);
      titleBot = trimHeadlinePhrase(stripEpPrefix(evArr[1]), 24);
    } else if (spec.title) {
      [titleTop, titleBot] = splitShortTwoLines(spec.title, 22);
    } else {
      const chap = bestScene?.chapter ? (Array.isArray(bestScene.chapter) ? bestScene.chapter[1] : bestScene.chapter.title) : null;
      const evRaw = ovCfg?.title || spec.eventTitle || bestScene?.eventTitle || headline?.topLine || chap;
      if (evRaw && headline?.redWord && String(evRaw).length <= 22 && String(headline.redWord).length <= 22) {
        titleTop = stripEpPrefix(evRaw);
        titleBot = stripEpPrefix(headline.redWord);
      } else {
        const base = stripEpPrefix(evRaw || (String(seriesTitle).includes('|') ? String(seriesTitle).split('|')[0] : seriesTitle));
        [titleTop, titleBot] = splitShortTwoLines(base, 22);
      }
    }
  } else {
    const rawClipTitle = ovCfg?.title || spec.title || (String(seriesTitle).includes('|') ? String(seriesTitle).split('|')[0] : seriesTitle);
    const shortTitleBase = epNum > 1 && totalEps > 1 && headline?.topLine && headline.topLine.length <= 28
      ? headline.topLine
      : stripEpPrefix(rawClipTitle);
    const coverOk = Array.isArray(bestScene?.coverHeadline) && bestScene.coverHeadline.length >= 2
      && String(bestScene.coverHeadline[0]).length <= 22 && String(bestScene.coverHeadline[1]).length <= 22;
    if (coverOk && epNum > 1) {
      titleTop = stripEpPrefix(bestScene.coverHeadline[0]);
      titleBot = stripEpPrefix(bestScene.coverHeadline[1]);
    } else {
      [titleTop, titleBot] = splitShortTwoLines(shortTitleBase, 22);
    }
  }

  const fullHeaderClean = `${titleTop}${titleBot}`.replace(/\s+/g, '');
  const subCandidates = [
    covCfg?.subHook,
    ovCfg?.subHook,
    spec.subHook,
    spec.shortsSubHook,
    bestScene?.shortsSubHook,
    bestScene?.subHook,
    (!isEvent ? (cfg.shortsSubHook || cfg.SHORTS_SUB_HOOK) : ''),
    headline?.redWord,
    isFinal && totalEps > 1 ? 'ความจริงทั้งหมด... ที่ซ่อนไว้!?' : 'คำตอบหลอนกว่าที่คุณคิดเยอะ!'
  ];
  let subHook = '';
  for (const cand of subCandidates) {
    const cleaned = stripEpPrefix(cand || '').split('|')[0].trim();
    if (!cleaned || cleaned.length < 4) continue;
    if (fullHeaderClean.includes(cleaned.replace(/\s+/g, '')) && subCandidates.indexOf(cand) >= 7) continue;
    subHook = trimHeadlinePhrase(cleaned, 28);
    break;
  }
  if (!subHook) subHook = isFinal && totalEps > 1 ? 'บทสรุปที่คาดไม่ถึง!?' : 'จับตาดู... นาทีหักมุม!?';

  const titleRedLine = Number(covCfg?.titleRedLine || ovCfg?.titleRedLine || spec.titleRedLine || bestScene?.titleRedLine || (!isEvent && (cfg.titleRedLine || cfg.TITLE_RED_LINE)) || (epNum % 2 === 1 ? 1 : 2));
  return { titleTop, titleBot, titleRedLine, subHook };
}

function formatFeedTitle(hookText, seriesTitle, epNum = null, totalEps = null, isSingle = false, isEvent = false) {
  const seriesStr = String(seriesTitle || '').trim();
  const hasPipeInSeries = seriesStr.includes('|');
  const seriesName = hasPipeInSeries ? seriesStr.split('|').pop().trim() : seriesStr;
  const fallbackHook = hasPipeInSeries ? seriesStr.split('|')[0].trim() : seriesName;
  const rawHook = stripEpPrefix(String(hookText || '').split('|')[0]);
  const isPart2 = !isSingle && !isEvent && totalEps === 2 && epNum === 2;
  const maxHookChars = isPart2 ? 32 : 38;
  const trimmedHook = trimHeadlinePhrase(rawHook || fallbackHook || 'จุดหักมุมที่คุณห้ามพลาด!', maxHookChars);
  const front = isPart2 && !/ตอนจบ/.test(trimmedHook) ? `${trimmedHook} (ตอนจบ)` : trimmedHook;
  return seriesName && !front.includes(seriesName) ? `${front} | ${seriesName}` : front;
}

function resolveSceneList(allScenes, refs = []) {
  const out = [];
  for (const r of refs) {
    if (typeof r === 'number' && allScenes[r]) out.push(allScenes[r]);
    else if (typeof r === 'string') {
      const found = allScenes.find(s => s.id === r);
      if (found) out.push(found);
    } else if (r && typeof r === 'object' && r.id) {
      const found = allScenes.find(s => s.id === r.id);
      if (found) out.push({ ...found, ...r });
    }
  }
  return out;
}

// Auto-pick a cohesive narrative arc within [minDur..maxSec] when no manual shorts_config.json exists
function autoPickArcScenes(scenes, maxSec = 58.0, minDur = 45.0, mode = 'single', hasRecap = false) {
  if (!scenes.length) return [];
  const budget = hasRecap ? Math.max(25, maxSec - 3.0) : maxSec;

  if (mode === 'single') {
    const n = scenes.length;
    const bands = [
      [0, Math.max(1, Math.floor(n * 0.2))],
      [Math.floor(n * 0.2), Math.floor(n * 0.5)],
      [Math.floor(n * 0.5), Math.floor(n * 0.8)],
      [Math.floor(n * 0.8), n]
    ];
    const chosen = new Set();
    let total = 0;
    // Always include Scene 0 Cold Open
    chosen.add(0);
    total += Number(scenes[0].dur || 0);

    // Pick top-scoring climax/reveal from late band first so ending resolution is guaranteed
    for (let b = bands.length - 1; b >= 1; b--) {
      const [lo, hi] = bands[b];
      let bestIdx = -1, bestSc = -1;
      for (let i = lo; i < hi; i++) {
        if (chosen.has(i)) continue;
        const d = Number(scenes[i].dur || 0);
        if (total + d > budget) continue;
        const sc = scoreSceneDramaticImpact(scenes[i], i, n);
        if (sc > bestSc) { bestSc = sc; bestIdx = i; }
      }
      if (bestIdx !== -1) {
        chosen.add(bestIdx);
        total += Number(scenes[bestIdx].dur || 0);
      }
    }
    // Fill up to >= minDur (staying <= budget) with highest-impact remaining beats
    const ranked = scenes.map((s, i) => ({ i, sc: scoreSceneDramaticImpact(s, i, n), d: Number(s.dur || 0) }))
      .filter(x => !chosen.has(x.i))
      .sort((a, b) => b.sc - a.sc);
    for (const item of ranked) {
      if (total >= Math.min(minDur + 5, budget - 4)) break;
      if (total + item.d <= budget) {
        chosen.add(item.i);
        total += item.d;
      }
    }
    return Array.from(chosen).sort((a, b) => a - b).map(i => scenes[i]);
  }

  // Two-part split: Part 1 from first 55% of scenes, Part 2 from final 45% (leaving 3s for recap)
  const mid = Math.max(2, Math.floor(scenes.length * 0.55));
  const pool = mode === 'part1' ? scenes.slice(0, mid) : scenes.slice(mid);
  const chosen = new Set();
  let total = 0;
  if (mode === 'part1' && pool.length > 0) {
    chosen.add(0);
    total += Number(pool[0].dur || 0);
  } else if (mode === 'part2' && pool.length > 0) {
    // Always preserve closing revelation / climax near end
    const lastIdx = pool.length - 1;
    const penIdx = Math.max(0, pool.length - 2);
    const anchor = scoreSceneDramaticImpact(pool[penIdx]) >= scoreSceneDramaticImpact(pool[lastIdx]) ? penIdx : lastIdx;
    chosen.add(anchor);
    total += Number(pool[anchor].dur || 0);
  }
  const ranked = pool.map((s, i) => ({ i, sc: scoreSceneDramaticImpact(s, i, pool.length), d: Number(s.dur || 0) }))
    .filter(x => !chosen.has(x.i))
    .sort((a, b) => b.sc - a.sc);
  for (const item of ranked) {
    if (total >= budget - 2) break;
    if (total + item.d <= budget) {
      chosen.add(item.i);
      total += item.d;
    }
  }
  return Array.from(chosen).sort((a, b) => a - b).map(i => pool[i]);
}

// Auto-slice a longer multi-event video into standalone 45-60s interesting event clips
function autoPickEventArcs(scenes, maxSec = 58.0, minDur = 45.0, seriesTitle = '') {
  if (!Array.isArray(scenes) || scenes.length === 0) return [];
  const totalFull = scenes.reduce((s, sc) => s + Number(sc.dur || 0), 0);
  if (totalFull <= maxSec) {
    return [{ isSingle: true, isEvent: false, scenes: [...scenes] }];
  }

  // 1. Respect explicit per-scene event grouping (`s.eventId` / `s.event` / `s.eventGroup`) if authored in script
  const hasExplicitEvents = scenes.some(s => s.eventId != null || s.event != null || s.eventGroup != null);
  if (hasExplicitEvents) {
    const groups = [];
    let curKey = null;
    let curScenes = [];
    for (const sc of scenes) {
      const k = sc.eventId ?? sc.event ?? sc.eventGroup ?? curKey ?? 'ev_1';
      if (curKey !== null && k !== curKey && curScenes.length > 0) {
        groups.push({ key: curKey, scenes: curScenes });
        curScenes = [];
      }
      curKey = k;
      curScenes.push(sc);
    }
    if (curScenes.length > 0) groups.push({ key: curKey, scenes: curScenes });

    const outSpecs = [];
    for (const grp of groups) {
      let evSc = [...grp.scenes];
      let d = evSc.reduce((s, x) => s + Number(x.dur || 0), 0);
      if (d > maxSec) {
        evSc = autoPickArcScenes(evSc, maxSec, Math.min(minDur, maxSec - 4), 'single', false);
        d = evSc.reduce((s, x) => s + Number(x.dur || 0), 0);
      } else if (d < minDur) {
        // Pad with adjacent reaction/setup scenes around the event while keeping <= maxSec
        let firstIdx = scenes.indexOf(evSc[0]);
        let lastIdx = scenes.indexOf(evSc[evSc.length - 1]);
        while (d < minDur && lastIdx + 1 < scenes.length && d + Number(scenes[lastIdx + 1].dur || 0) <= maxSec) {
          lastIdx++;
          evSc.push(scenes[lastIdx]);
          d += Number(scenes[lastIdx].dur || 0);
        }
        while (d < minDur && firstIdx - 1 >= 0 && d + Number(scenes[firstIdx - 1].dur || 0) <= maxSec) {
          firstIdx--;
          evSc.unshift(scenes[firstIdx]);
          d += Number(scenes[firstIdx].dur || 0);
        }
      }
      const evHost = evSc.find(s => s.eventTitle || s.shortsTitle || s.isClimax) || evSc[0];
      outSpecs.push({
        isSingle: false,
        isEvent: true,
        title: evHost?.eventTitle || (typeof evHost?.chapter === 'object' ? (Array.isArray(evHost.chapter) ? evHost.chapter[1] : evHost.chapter.title) : undefined),
        shortsTitle: evHost?.shortsTitle,
        scenes: evSc
      });
    }
    if (outSpecs.length > 0) return outSpecs;
  }

  // 2. Auto-discover distinct high-impact event windows (45-58s each) across the story timeline
  const targetCount = clamp(Math.round(totalFull / 54), 2, Math.min(5, Math.max(2, Math.floor(scenes.length / 2))));
  const outSpecs = [];
  const usedPeaks = new Set();
  const usedTitles = new Set();
  let prevHiIdx = -1;

  for (let b = 0; b < targetCount; b++) {
    const loBound = Math.min(scenes.length - 1, Math.floor((b * scenes.length) / targetCount));
    const hiBound = Math.max(loBound + 1, Math.floor(((b + 1) * scenes.length) / targetCount));

    let peakIdx = loBound;
    let bestScore = -1;
    for (let i = loBound; i < hiBound && i < scenes.length; i++) {
      if (usedPeaks.has(i)) continue;
      const scScore = scoreSceneDramaticImpact(scenes[i], i, scenes.length) + (isCliffhangerScene(scenes[i]) ? 8 : 0);
      if (scScore > bestScore) { bestScore = scScore; peakIdx = i; }
    }
    usedPeaks.add(peakIdx);

    // Handle single ultra-long scene > maxSec gracefully
    if (Number(scenes[peakIdx].dur || 0) > maxSec) {
      outSpecs.push({ isSingle: false, isEvent: true, scenes: [scenes[peakIdx]] });
      prevHiIdx = Math.max(prevHiIdx, peakIdx);
      continue;
    }

    let lo = peakIdx;
    let hi = peakIdx;
    let dur = Number(scenes[peakIdx].dur || 0);
    const maxForwardBeforeBack = maxSec * 0.42;
    let fwdAdded = 0;

    // Include 1-2 immediate payoff/reaction beats after peak
    while (hi + 1 < scenes.length && hi + 1 < hiBound + 1 && dur + Number(scenes[hi + 1].dur || 0) <= maxSec && fwdAdded < maxForwardBeforeBack) {
      const nd = Number(scenes[hi + 1].dur || 0);
      hi++;
      dur += nd;
      fwdAdded += nd;
    }
    // Expand backward for setup without overlapping the previous event when avoidable
    const softFloor = Math.max(0, prevHiIdx + 1);
    while (lo - 1 >= softFloor && dur < maxSec && dur + Number(scenes[lo - 1].dur || 0) <= maxSec) {
      lo--;
      dur += Number(scenes[lo].dur || 0);
      if (dur >= minDur && isCliffhangerScene(scenes[hi])) break;
    }
    // Fill forward across band end if still below minDur
    while (dur < minDur && hi + 1 < scenes.length && dur + Number(scenes[hi + 1].dur || 0) <= maxSec) {
      hi++;
      dur += Number(scenes[hi].dur || 0);
    }
    // Last-resort minor bridge backward before softFloor only to reach 45s target
    while (dur < minDur && lo - 1 >= 0 && dur + Number(scenes[lo - 1].dur || 0) <= maxSec) {
      lo--;
      dur += Number(scenes[lo].dur || 0);
    }

    const evScenes = scenes.slice(lo, hi + 1);
    if (outSpecs.length > 0) {
      const prevSet = new Set(outSpecs[outSpecs.length - 1].scenes);
      const uniqueCount = evScenes.filter(s => !prevSet.has(s)).length;
      if (uniqueCount === 0) continue;
    }

    prevHiIdx = hi;
    const peakSc = scenes[peakIdx];
    const peakCoverStr = Array.isArray(peakSc?.coverHeadline) ? peakSc.coverHeadline.join(' ').trim() : '';
    const peakChap = peakSc?.chapter ? (Array.isArray(peakSc.chapter) ? peakSc.chapter[1] : peakSc.chapter.title) : '';
    const peakCard = peakSc?.card || peakSc?.hud;
    const peakCardTitle = peakCard ? (Array.isArray(peakCard.title) ? peakCard.title[0] : peakCard.title) : '';
    const voHook = extractCuriosityHookFromVo(getSceneText(peakSc));
    const voTitle = voHook ? `${voHook.topLine} ${voHook.redWord}`.trim() : '';

    let pickedTitle = peakSc?.eventTitle || peakCoverStr || peakCardTitle || peakChap || voTitle || trimHeadlinePhrase(getSceneText(peakSc), 28) || seriesTitle.split('|')[0].trim();
    if (usedTitles.has(pickedTitle) && voTitle && !usedTitles.has(voTitle)) {
      pickedTitle = voTitle;
    }
    usedTitles.add(pickedTitle);

    outSpecs.push({
      isSingle: false,
      isEvent: true,
      keySceneId: peakSc?.id,
      title: pickedTitle,
      scenes: evScenes
    });
  }

  return outSpecs;
}

// ----------------------------------------------------------------- CLIFFHANGER BRIDGE (3-ANGLE, 40-50s, ANTI-SPOILER)
function scoreSceneForAngle(sc, idx, poolLen, angleDef) {
  const txt = `${getSceneText(sc)} ${sc.visual_prompt || ''} ${sc.id || ''} ${sc.view || ''}`;
  let score = scoreSceneDramaticImpact(sc, idx, poolLen);
  if (String(sc.shortsAngle || '').toLowerCase() === angleDef.key) score += 80;
  if (angleDef.re.test(txt)) score += 35;
  if (angleDef.key === 'ritual' && String(sc.phase || '').toLowerCase() === 'folklore') score += 24;
  if (angleDef.key === 'tension' && (sc.isClimax || String(sc.phase || '').toLowerCase() === 'hook')) score += 24;
  if (angleDef.key === 'twist' && (/[?؟!]$/.test(getSceneText(sc).trim()) || idx >= Math.floor(poolLen * 0.5))) score += 28;
  return score;
}

function autoPickCliffhangerAngles(scenes, options = {}) {
  if (!Array.isArray(scenes) || scenes.length === 0) return [];
  const maxSec = Number(options.maxSec || 50.0);
  const minSec = Number(options.minSec || 40.0);
  const bridgeDur = clamp(Number(options.bridgeDur || 3.5), 3.0, 4.0);
  const storyMax = Math.max(15, maxSec - bridgeDur);
  const storyMin = Math.max(12, Math.min(minSec - bridgeDur, storyMax - 3));
  const seriesTitle = options.seriesTitle || '';
  const cfg = options.cfg || {};

  // Strictly filter out scientific/historical decode & reveal scenes (Anti-Spoiler)
  let safePool = scenes.filter((sc, idx) => !isRevealOrDecodeScene(sc, idx, scenes.length));
  if (safePool.length === 0) {
    safePool = scenes.slice(0, Math.max(1, Math.ceil(scenes.length * 0.5)));
  }

  // Respect explicit SHORTS_ANGLES / cfg.cliffhangerAngles if provided
  const manualAngles = Array.isArray(cfg.cliffhangerAngles) && cfg.cliffhangerAngles.length > 0
    ? cfg.cliffhangerAngles
    : (Array.isArray(cfg.SHORTS_ANGLES) && cfg.SHORTS_ANGLES.length > 0 ? cfg.SHORTS_ANGLES : null);

  if (manualAngles) {
    return manualAngles.slice(0, 3).map((spec, idx) => {
      const def = ANGLE_DEFINITIONS.find(a => a.key === spec.angle) || ANGLE_DEFINITIONS[idx % ANGLE_DEFINITIONS.length];
      let chosen = spec.sceneIds ? resolveSceneList(scenes, spec.sceneIds) : (spec.scenes || []);
      if (!spec.allowReveal) {
        chosen = chosen.filter((sc) => {
          const origIdx = scenes.indexOf(sc);
          return !isRevealOrDecodeScene(sc, origIdx >= 0 ? origIdx : 0, scenes.length);
        });
      }
      if (chosen.length === 0) chosen = safePool.slice(0, Math.min(3, safePool.length));
      return {
        ...spec,
        isSingle: false,
        isEvent: false,
        isCliffhanger: true,
        angle: def.key,
        angleLabel: spec.angleLabel || def.label,
        tag: spec.tag || def.tag,
        subHook: spec.subHook || def.subHook,
        scenes: chosen,
        maxStorySec: storyMax,
        bridgeCta: {
          enabled: true,
          dur: bridgeDur,
          headline: spec.bridgeCta?.headline || cfg.bridgeCtaText || cfg.SHORTS_BRIDGE_CTA_TEXT || 'ดูเฉลยเต็มที่ลิงก์ด้านล่าง',
          subText: spec.bridgeCta?.subText || cfg.bridgeCtaSubText || 'กดที่ลิงก์ด้านล่างเพื่อฟังเฉลยเต็มแบบไม่ตัด',
          ctaVo: spec.bridgeCta?.ctaVo || cfg.bridgeCtaVo || cfg.SHORTS_BRIDGE_CTA_VO || '',
          audioFile: spec.bridgeCta?.audioFile || cfg.bridgeCtaAudio || options.defaultCtaAudio || null
        }
      };
    });
  }

  const outSpecs = [];
  const usedAnchors = new Set();
  const usedSignatures = new Set();

  for (let ai = 0; ai < ANGLE_DEFINITIONS.length; ai++) {
    const def = ANGLE_DEFINITIONS[ai];
    const scored = safePool.map((sc, idx) => ({
      sc,
      idx,
      score: scoreSceneForAngle(sc, idx, safePool.length, def) - (usedAnchors.has(idx) ? 28 : 0)
    })).sort((a, b) => b.score - a.score);

    const anchor = scored[0];
    if (!anchor) continue;
    usedAnchors.add(anchor.idx);

    // Build chronological Hook -> Build-up -> Twist Tease arc within [storyMin..storyMax] strictly on complete scene/sentence boundaries
    let lo = anchor.idx;
    let hi = anchor.idx;
    let dur = Number(safePool[anchor.idx].dur || 0);

    // Pull forward 1-2 twist-tease beats after anchor while keeping inside safePool & storyMax
    while (hi + 1 < safePool.length && dur + Number(safePool[hi + 1].dur || 0) <= storyMax) {
      const nextSc = safePool[hi + 1];
      if (dur >= storyMin && isCliffhangerScene(safePool[hi])) break;
      hi++;
      dur += Number(nextSc.dur || 0);
      if (isCliffhangerScene(nextSc) && dur >= storyMin) break;
    }

    // Expand backward for dread build-up / hook
    while (lo - 1 >= 0 && dur < storyMin && dur + Number(safePool[lo - 1].dur || 0) <= storyMax) {
      lo--;
      dur += Number(safePool[lo].dur || 0);
    }

    // If still below storyMin, pull any remaining non-reveal scenes forward up to storyMax
    while (hi + 1 < safePool.length && dur < storyMin && dur + Number(safePool[hi + 1].dur || 0) <= storyMax) {
      hi++;
      dur += Number(safePool[hi].dur || 0);
    }

    const angleScenes = safePool.slice(lo, hi + 1);
    const sig = angleScenes.map(s => s.id).join(',');
    // On very short test episodes (e.g. 2-3 non-reveal scenes), still output distinct angle packaging if fewer than 3 unique windows exist
    usedSignatures.add(sig);

    const peakSc = safePool[anchor.idx];
    const voHook = extractCuriosityHookFromVo(getSceneText(peakSc));
    const voTitle = voHook ? `${voHook.topLine} ${voHook.redWord}`.trim() : '';
    const pickedTitle = peakSc?.eventTitle
      || (Array.isArray(peakSc?.coverHeadline) ? peakSc.coverHeadline.join(' ') : '')
      || voTitle
      || trimHeadlinePhrase(getSceneText(peakSc), 28)
      || seriesTitle.split('|')[0].trim();

    outSpecs.push({
      isSingle: false,
      isEvent: false,
      isCliffhanger: true,
      angle: def.key,
      angleLabel: def.label,
      tag: def.tag,
      keySceneId: peakSc?.id,
      title: pickedTitle,
      subHook: def.subHook,
      scenes: angleScenes,
      maxStorySec: storyMax,
      bridgeCta: {
        enabled: true,
        dur: bridgeDur,
        headline: cfg.bridgeCtaText || cfg.SHORTS_BRIDGE_CTA_TEXT || 'ดูเฉลยเต็มที่ลิงก์ด้านล่าง',
        subText: cfg.bridgeCtaSubText || 'กดที่ลิงก์ด้านล่างเพื่อฟังเฉลยเต็มแบบไม่ตัด',
        ctaVo: cfg.bridgeCtaVo || cfg.SHORTS_BRIDGE_CTA_VO || '',
        audioFile: cfg.bridgeCtaAudio || options.defaultCtaAudio || null
      }
    });
  }

  return outSpecs;
}

function buildEpisodeEntry(spec, scenes, epNum, totalEps, seriesTitle, cfg) {
  const epScenes = spec.sceneIds
    ? resolveSceneList(scenes, spec.sceneIds)
    : (spec.scenes || []);
  const isSingle = Boolean(spec.isSingle);
  const isEvent = Boolean(spec.isEvent);
  const isCliffhanger = Boolean(spec.isCliffhanger);
  const isFinal = !isSingle && !isEvent && !isCliffhanger && totalEps === 2 && epNum === 2;
  const tag = spec.tag || (isCliffhanger
    ? `cliff_${String(epNum).padStart(2, '0')}_${spec.angle || 'hook'}`
    : (isEvent ? `event_${String(epNum).padStart(2, '0')}` : (isSingle ? 'single' : `ep${epNum}`)));
  const recap = spec.recap ? { ...spec.recap, dur: Number(spec.recap.dur || 3.0) } : null;

  const segments = [];
  if (recap) {
    segments.push({
      isRecap: true,
      start: 0,
      dur: recap.dur,
      recap
    });
  }

  let accStoryDur = 0;
  const maxStorySec = spec.maxStorySec != null ? Number(spec.maxStorySec) : null;
  for (let si = 0; si < epScenes.length; si++) {
    const sc = epScenes[si];
    const fullDur = Number(sc.dur || 0);
    let win = { start: Number(sc.start || 0), dur: fullDur, snapped: true, trimmed: false, endCueText: '' };
    if (maxStorySec != null) {
      const rem = maxStorySec - accStoryDur;
      if (rem <= 1.2 && segments.some(g => !g.isRecap)) break;
      if (fullDur > rem) {
        win = snapSceneWindowToSentence(sc, Math.max(1.5, rem));
      } else {
        win = snapSceneWindowToSentence(sc, fullDur);
      }
    } else {
      win = snapSceneWindowToSentence(sc, fullDur);
    }
    segments.push({
      isRecap: false,
      isBridgeCta: false,
      sceneId: sc.id,
      view: sc.view,
      start: win.start,
      dur: win.dur,
      focusX: sc.focusX || 640,
      sentenceBoundarySnapped: win.snapped,
      trimmedToSentence: win.trimmed,
      endCueText: win.endCueText
    });
    accStoryDur += win.dur;
  }

  let bridgeCta = null;
  if (spec.bridgeCta && spec.bridgeCta.enabled !== false) {
    const lastStorySeg = [...segments].reverse().find(g => !g.isRecap && !g.isBridgeCta);
    const lastSceneObj = epScenes[epScenes.length - 1] || scenes[0];
    const bridgeDur = clamp(Number(spec.bridgeCta.dur || 3.5), 3.0, 4.0);
    const holdAt = lastStorySeg
      ? Number(Math.max(lastStorySeg.start, lastStorySeg.start + lastStorySeg.dur - 0.15).toFixed(3))
      : 0;
    bridgeCta = {
      enabled: true,
      dur: bridgeDur,
      headline: spec.bridgeCta.headline || 'ดูเฉลยเต็มที่ลิงก์ด้านล่าง',
      subText: spec.bridgeCta.subText || 'กดที่ลิงก์ด้านล่างเพื่อฟังเฉลยเต็มแบบไม่ตัด',
      ctaVo: spec.bridgeCta.ctaVo || '',
      audioFile: spec.bridgeCta.audioFile || null,
      holdSceneId: lastSceneObj?.id || null,
      holdView: lastSceneObj?.view || null,
      holdAt,
      focusX: lastSceneObj?.focusX || 640
    };
    segments.push({
      isRecap: false,
      isBridgeCta: true,
      start: holdAt,
      dur: bridgeDur,
      focusX: bridgeCta.focusX,
      bridge: bridgeCta
    });
  }

  const totalDur = Number(segments.reduce((sum, g) => sum + Number(g.dur || 0), 0).toFixed(3));
  let bestScene = epScenes[0] || scenes[0];
  let bestScore = -1;
  if (spec.keySceneId) {
    const manualKey = epScenes.find(s => s.id === spec.keySceneId) || scenes.find(s => s.id === spec.keySceneId);
    if (manualKey) {
      bestScene = manualKey;
      bestScore = scoreSceneDramaticImpact(manualKey, 0, epScenes.length);
    }
  } else {
    epScenes.forEach((sc, i) => {
      const scScore = scoreSceneDramaticImpact(sc, i, epScenes.length);
      if (scScore > bestScore) { bestScore = scScore; bestScene = sc; }
    });
  }

  const isMultiCut = isEvent || isCliffhanger;
  const ovCfg = Array.isArray(cfg.overlays) ? cfg.overlays.find(o => o.tag === tag || (o.ep === epNum && (!isMultiCut || o.isEvent || o.isCliffhanger))) : null;
  const covCfg = Array.isArray(cfg.covers) ? cfg.covers.find(c => c.tag === tag || (c.ep === epNum && (!isMultiCut || c.isEvent || c.isCliffhanger))) : null;
  const seriesName = cfg.seriesName || (String(seriesTitle).includes('|') ? String(seriesTitle).split('|').pop().trim() : '');
  const headline = deriveHeadlineFromScene(bestScene, epNum, totalEps, seriesTitle);
  const { titleTop, titleBot, titleRedLine, subHook } = deriveShortsHeaderFields({
    bestScene, seriesTitle, headline, epNum, totalEps, isEvent: isMultiCut, isFinal, spec, ovCfg, covCfg, cfg
  });
  const topLine = covCfg?.topLine || spec.topLine || titleTop;
  const redWord = covCfg?.redWord || spec.redWord || titleBot;
  const shortClipName = `${titleTop} ${titleBot}`.trim();
  const badge = ovCfg?.badge || spec.badge || subHook || shortClipName;
  const feedTitle = ovCfg?.feedTitle || spec.feedTitle || formatFeedTitle(
    spec.hook || shortClipName || seriesTitle,
    seriesName,
    epNum,
    totalEps,
    isSingle,
    isMultiCut
  );
  const defaultOutName = isSingle
    ? 'master_hf_single_short.mp4'
    : (isMultiCut ? `master_hf_${tag}.mp4` : `master_hf_ep${epNum}_shorts.mp4`);

  return {
    ep: epNum,
    totalEps,
    isSingle,
    isEvent,
    isCliffhanger,
    angle: spec.angle || null,
    angleLabel: spec.angleLabel || null,
    antiSpoilerVerified: isCliffhanger ? true : undefined,
    sentenceBoundarySnapped: true,
    isFinal,
    tag,
    start: Number((epScenes[0]?.start || 0).toFixed(3)),
    dur: totalDur,
    end: Number(((epScenes[epScenes.length - 1]?.start || 0) + (epScenes[epScenes.length - 1]?.dur || 0)).toFixed(3)),
    segments,
    recap,
    bridgeCta,
    sceneIds: epScenes.map(s => s.id),
    keySceneId: bestScene.id,
    keyView: bestScene.view,
    keyScore: bestScore,
    focusX: spec.focusX != null ? spec.focusX : (bestScene.focusX || 640),
    extractAt: String(covCfg?.extractAt != null ? covCfg.extractAt : pickKeyTimestampInScene(bestScene)),
    title: ovCfg?.title || spec.title || shortClipName,
    titleTop,
    titleBot,
    titleRedLine: covCfg?.titleRedLine || titleRedLine,
    subHook: covCfg?.subHook || subHook,
    feedTitle,
    badge,
    topLine,
    redWord,
    stampLeft: '',
    stampRight: '',
    outFileName: spec.outFileName || defaultOutName,
    overlayFile: ovCfg?.file || spec.overlayFile || (isSingle ? 'overlay_single.png' : (isMultiCut ? `overlay_${tag}.png` : `overlay_ep${epNum}.png`)),
    ctaOverlayFile: bridgeCta ? (ovCfg?.ctaFile || spec.ctaOverlayFile || `overlay_${tag}_cta.png`) : null,
    coverFile: covCfg?.file || spec.coverFile || (isSingle ? 'cover_shorts_single.png' : (isMultiCut ? `cover_${tag}.png` : `cover_shorts_ep${epNum}.png`))
  };
}

function planShortsEpisodes(timeline, cfg = {}, options = {}) {
  const scenes = timeline.scenes || [];
  const totalFull = Number(timeline.total || scenes.reduce((a, s) => a + Number(s.dur || 0), 0));
  const seriesTitle = cfg.shortTitle || cfg.title || cfg.TITLE || timeline.title || 'Real Lens Horror';

  const format = (
    options.format ||
    cfg.shortsFormat ||
    (Array.isArray(cfg.cliffhangerAngles) && cfg.cliffhangerAngles.length > 0
      ? 'cliffhanger'
      : (Array.isArray(cfg.events) && cfg.events.length > 0
        ? 'events'
        : ((options.maxEp === 1 || totalFull <= 58) ? 'single' : 'cliffhanger')))
  ).toLowerCase();

  const isCliffMode = format === 'cliffhanger';
  let maxSec = Number(options.maxSec || cfg.maxSec || cfg.maxDurationSec || (isCliffMode ? 50.0 : 58.0));
  if (!options.allowOver60) maxSec = Math.min(maxSec, 59.5);
  const minSec = Number(options.minSec || cfg.minSec || (isCliffMode ? 40.0 : 45.0));
  const bridgeDur = Number(options.bridgeDur || cfg.bridgeDur || 3.5);
  const defaultCtaAudio = timeline.shortsBridgeCtaAudio || cfg.bridgeCtaAudio || null;

  // If entire video already fits in <= maxSec and format isn't explicit cliffhanger/multi-format, emit 1 standalone clip
  if (totalFull <= maxSec && format !== 'cliffhanger' && format !== 'both' && format !== 'all' && !(Array.isArray(cfg.events) && cfg.events.length > 0)) {
    const entry = buildEpisodeEntry(
      { ...(cfg.single || {}), isSingle: true, sceneIds: scenes.map(s => s.id) },
      scenes, 1, 1, seriesTitle, cfg
    );
    return [entry];
  }

  const results = [];

  if (format === 'cliffhanger' || format === 'all') {
    const cliffSpecs = autoPickCliffhangerAngles(scenes, {
      maxSec: format === 'all' ? Math.min(maxSec, 50.0) : maxSec,
      minSec: format === 'all' ? Math.min(minSec, 40.0) : minSec,
      bridgeDur,
      seriesTitle,
      cfg,
      defaultCtaAudio
    });
    cliffSpecs.forEach((cSpec, idx) => {
      results.push(buildEpisodeEntry(cSpec, scenes, idx + 1, cliffSpecs.length, seriesTitle, cfg));
    });
  }

  if (format === 'single' || format === 'both' || format === 'all') {
    const singleSpec = cfg.single
      ? { ...cfg.single, isSingle: true }
      : { isSingle: true, scenes: autoPickArcScenes(scenes, maxSec, minSec, 'single', false) };
    results.push(buildEpisodeEntry(singleSpec, scenes, 1, 1, seriesTitle, cfg));
  }

  if (format === 'two_part' || format === 'both' || format === 'all') {
    let part1Spec, part2Spec;
    if (Array.isArray(cfg.twoPart) && cfg.twoPart.length >= 2) {
      part1Spec = { ...cfg.twoPart[0], isSingle: false };
      part2Spec = { ...cfg.twoPart[1], isSingle: false };
    } else if (Array.isArray(cfg.episodes) && cfg.episodes.length > 0 && cfg.episodes.length <= 2) {
      part1Spec = { ...cfg.episodes[0], isSingle: false };
      part2Spec = cfg.episodes[1] ? { ...cfg.episodes[1], isSingle: false } : null;
    } else {
      part1Spec = { isSingle: false, scenes: autoPickArcScenes(scenes, maxSec, minSec, 'part1', false) };
      part2Spec = {
        isSingle: false,
        recap: {
          dur: 3.0,
          label: '⏪ สรุปความเดิม 3 วินาที · ตอนที่ 1',
          subText: `ตอนที่แล้ว: ${trimHeadlinePhrase(seriesTitle.split('|')[0], 34)}`
        },
        scenes: autoPickArcScenes(scenes, maxSec, minSec, 'part2', true)
      };
    }

    const epBase = results.length;
    const twoPartTotal = part2Spec ? 2 : 1;
    results.push(buildEpisodeEntry(part1Spec, scenes, 1, twoPartTotal, seriesTitle, cfg));
    if (part2Spec) {
      const e2 = buildEpisodeEntry(part2Spec, scenes, 2, twoPartTotal, seriesTitle, cfg);
      if (epBase > 0) e2.ep = 2;
      results.push(e2);
    }
  }

  if (format === 'events' || format === 'all') {
    const eventSpecs = (Array.isArray(cfg.events) && cfg.events.length > 0)
      ? cfg.events.map(evSpec => ({ ...evSpec, isSingle: false, isEvent: evSpec.isSingle ? false : true }))
      : autoPickEventArcs(scenes, maxSec, minSec, seriesTitle);
    const evTotal = eventSpecs.length;
    eventSpecs.forEach((evSpec, idx) => {
      results.push(buildEpisodeEntry(evSpec, scenes, idx + 1, evTotal, seriesTitle, cfg));
    });
  }

  return results;
}

function pickTopLongFormHighlights(scenes, count = 5) {
  if (!scenes || scenes.length === 0) return { showdownScene: null, panels: [] };

  const startSearch = Math.min(scenes.length - 1, Math.floor(scenes.length * 0.35));
  const candidateIndices = scenes[0]?.isClimax && startSearch > 0 ? [0] : [];
  for (let i = startSearch; i < scenes.length; i++) candidateIndices.push(i);
  let showdownScene = scenes[scenes.length - 1];
  let bestShowdownScore = -1;
  for (const i of candidateIndices) {
    const s = scenes[i];
    const score = scoreSceneDramaticImpact(s, i, scenes.length) + ((s.telemetry?.distance || s.tele?.distance) ? 15 : 0);
    if (score > bestShowdownScore) {
      bestShowdownScore = score;
      showdownScene = s;
    }
  }

  const usedViews = new Set();
  const panels = [];
  for (let b = 0; b < count; b++) {
    const lo = Math.floor((b * scenes.length) / count);
    const hi = Math.max(lo + 1, Math.floor(((b + 1) * scenes.length) / count));
    let best = scenes[lo];
    let bestScore = -999;
    for (let i = lo; i < hi && i < scenes.length; i++) {
      const sc = scenes[i];
      const dupPenalty = usedViews.has(sc.view) ? -30 : 0;
      const scScore = scoreSceneDramaticImpact(sc, i - lo, hi - lo) + dupPenalty;
      if (scScore > bestScore) {
        bestScore = scScore;
        best = sc;
      }
    }
    usedViews.add(best.view);
    const absAt = pickKeyTimestampInScene(best);
    const evLbl = best.shortLabel || best.eventTitle || (Array.isArray(best.coverHeadline) ? best.coverHeadline.join(' ') : null);
    const voHook = getSceneText(best) ? trimHeadlinePhrase(getSceneText(best), 20) : null;
    const chap = best.chapter ? (Array.isArray(best.chapter) ? best.chapter[1] : best.chapter.title) : null;
    const card = best.card || best.hud;
    const cardTxt = card ? (Array.isArray(card.title) ? card.title[0] : card.title) : null;
    panels.push({
      num: String(b + 1),
      label: evLbl || chap || cardTxt || voHook || best.view,
      view: best.view,
      lt: Number(Math.max(0.5, absAt - (best.start || 0)).toFixed(2)),
      focusX: best.focusX || 640
    });
  }

  return { showdownScene, panels };
}

function saveShortsPlan(projectDir, plan) {
  const shortsDir = path.join(projectDir, 'shorts');
  fs.mkdirSync(shortsDir, { recursive: true });
  const planPath = path.join(shortsDir, 'shorts_plan.json');
  const isCliff = plan.some(p => p.isCliffhanger);
  fs.writeFileSync(planPath, JSON.stringify({
    mode: isCliff ? 'cliffhanger_bridge' : 'standard',
    maxDurationSec: isCliff ? 50 : 58,
    maxEpisodesAllowed: 2,
    antiSpoiler: isCliff,
    sentenceBoundarySnapped: true,
    count: plan.length,
    episodes: plan
  }, null, 2));
  return planPath;
}

if (require.main === module) {
  const getCliArg = (...flags) => {
    for (const f of flags) {
      const i = process.argv.indexOf(f);
      if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
    }
    return null;
  };
  const projectDir = path.resolve(getCliArg('--dir') || process.cwd());
  const format = getCliArg('--format') || (process.argv.includes('--cliffhanger') ? 'cliffhanger' : undefined);
  const maxSec = getCliArg('--max-sec') ? Number(getCliArg('--max-sec')) : undefined;
  const minSec = getCliArg('--min-sec') ? Number(getCliArg('--min-sec')) : undefined;
  const bridgeDur = getCliArg('--bridge-dur') ? Number(getCliArg('--bridge-dur')) : undefined;
  const allowOver60 = process.argv.includes('--allow-over-60');

  const tlPath = path.join(projectDir, 'timeline.json');
  const epPath = path.join(projectDir, 'episode.js');
  const cfgPath = path.join(projectDir, 'shorts_config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
  let epMod = null;
  if (fs.existsSync(epPath)) {
    try {
      epMod = require(epPath);
      if (!cfg.SHORTS_ANGLES && Array.isArray(epMod.SHORTS_ANGLES)) cfg.SHORTS_ANGLES = epMod.SHORTS_ANGLES;
      if (!cfg.SHORTS_BRIDGE_CTA_TEXT && epMod.SHORTS_BRIDGE_CTA_TEXT) cfg.SHORTS_BRIDGE_CTA_TEXT = epMod.SHORTS_BRIDGE_CTA_TEXT;
      if (!cfg.SHORTS_BRIDGE_CTA_VO && epMod.SHORTS_BRIDGE_CTA_VO) cfg.SHORTS_BRIDGE_CTA_VO = epMod.SHORTS_BRIDGE_CTA_VO;
      if (!cfg.SHORTS_TITLE && epMod.SHORTS_TITLE) cfg.SHORTS_TITLE = epMod.SHORTS_TITLE;
    } catch (_) {}
  }

  let tl;
  if (fs.existsSync(tlPath)) {
    tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  } else if (epMod && Array.isArray(epMod.SCENES)) {
    // Dry-run estimate from episode.js when timeline.json hasn't been synthesized yet
    let acc = 0;
    const estScenes = epMod.SCENES.map(s => {
      const txt = getSceneText(s);
      const estDur = Math.max(3.5, +(txt.length / 13.5 + (s.pad || 0.45)).toFixed(2));
      const row = { ...s, start: +acc.toFixed(2), dur: estDur };
      acc += estDur;
      return row;
    });
    tl = { title: epMod.TITLE || 'Episode', total: +acc.toFixed(2), scenes: estScenes };
    console.warn('⚠️ timeline.json not found — planning dry-run from episode.js estimated durations.');
  } else {
    console.error('Missing timeline.json and episode.js in:', projectDir);
    process.exit(1);
  }

  const planned = planShortsEpisodes(tl, cfg, { format, maxSec, minSec, bridgeDur, allowOver60 });
  const saved = saveShortsPlan(projectDir, planned);
  console.log(`=== Shorts Planner (${planned.length} clip(s)) -> ${path.relative(projectDir, saved)} ===`);
  for (const item of planned) {
    const kind = item.isCliffhanger ? `Cliffhanger [${item.angle}]` : (item.isEvent ? `Event #${item.ep}` : (item.isSingle ? 'Single' : `EP ${item.ep}`));
    const ctaNote = item.bridgeCta ? ` + ${item.bridgeCta.dur}s Bridge CTA ("${item.bridgeCta.headline}")` : '';
    console.log(`  · ${item.tag} | ${kind} | ${item.dur.toFixed(1)}s | scenes=[${item.sceneIds.join(', ')}]${ctaNote}`);
  }
}

module.exports = {
  ANGLE_DEFINITIONS,
  getSceneText,
  isRevealOrDecodeScene,
  snapSceneWindowToSentence,
  scoreSceneDramaticImpact,
  pickKeyTimestampInScene,
  autoPickCliffhangerAngles,
  autoPickEventArcs,
  planShortsEpisodes,
  pickTopLongFormHighlights,
  formatFeedTitle,
  splitShortTwoLines,
  stripEpPrefix,
  saveShortsPlan
};
