// =============================================================================
//  shorts_planner.js — Duration-Capped (<= 58s / < 60s) Shorts Episode Planner
//  & Key-Scene Climax Frame Selector
//  Part of skill: reallens-horror-animator
//
//  Used by:
//    - render_all_shorts.js
//    - generate_shorts_overlays.js
//    - generate_scene_covers.js
//    - generate_thumbnail.js
// =============================================================================
const fs = require('fs');
const path = require('path');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const HIGH_IMPACT_SFX = /stinger|sting|shriek|scream|crack|crash|slam|blackout|boom|heartbeat|alert|squeak|rumble|attack|roar|growl|hiss|snap|thunder/i;
const HIGH_IMPACT_VIEW = /twist|climax|entity|monster|creature|chase|hide|attack|reveal|crack|escape|showdown|blood|danger|trap|swarm|dead|panic|freeze|collapse|confront/i;

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
  }

  const card = scene.card || scene.hud;
  if (card) {
    if (card.type === 'dilemma' || card.type === 'flow') score += 22;
    else if (card.type === 'anomaly' || card.type === 'clue') score += 22;
    else if (card.type === 'rule') score += 20;
    else if (card.type === 'math' || card.type === 'calc') score += 12;
    else if (card.type === 'info') score += 8;
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

  // Prefer cliffhanger climax scenes near the end of an episode over generic openers
  if (totalInEp > 1 && posInEp >= totalInEp - 2) score += 10;
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

  // Prefer right after the highest-impact SFX cue within the visible window
  const sfxList = scene.sfx || [];
  for (const cue of sfxList) {
    const key = cue.type || cue.k || '';
    const at = cue.at !== undefined ? Number(cue.at) : Number(cue.t || 0);
    if (HIGH_IMPACT_SFX.test(key) && sStart + at + 0.35 >= lo && sStart + at + 0.35 <= hi) {
      return safeClamp(sStart + at + 0.35);
    }
  }

  // Otherwise capture right after an iconic HUD card settles on screen
  const card = scene.card || scene.hud;
  if (card) {
    const at = card.at !== undefined ? Number(card.at) : 0.4;
    const candidate = sStart + at + 1.15;
    if (candidate >= lo && candidate <= hi) return safeClamp(candidate);
  }

  // Default: 58% into the scene window (well clear of 0.14s edge fades)
  return safeClamp(lo + (hi - lo) * 0.58);
}

function splitLongSingleScene(scene, maxSec) {
  const parts = [];
  const total = Number(scene.dur || 0);
  const subs = Array.isArray(scene.subs) ? scene.subs : [];
  let cursor = 0;

  while (cursor < total - 0.2) {
    const remaining = total - cursor;
    if (remaining <= maxSec) {
      parts.push({
        start: Number((scene.start + cursor).toFixed(3)),
        dur: Number(remaining.toFixed(3)),
        scenes: [scene]
      });
      break;
    }

    // Find latest subtitle end that fits cleanly within maxSec
    let splitAt = cursor + maxSec;
    const candidates = subs.filter(q => {
      const t1 = q.t1 !== undefined ? q.t1 : q.end;
      return t1 > cursor + 15 && t1 <= cursor + maxSec;
    });
    if (candidates.length > 0) {
      const last = candidates[candidates.length - 1];
      splitAt = last.t1 !== undefined ? last.t1 : last.end;
    }

    parts.push({
      start: Number((scene.start + cursor).toFixed(3)),
      dur: Number((splitAt - cursor).toFixed(3)),
      scenes: [scene]
    });
    cursor = splitAt;
  }
  return parts;
}

function splitSceneListUnderMax(sceneList, maxSec = 58.0, minSec = 22.0, preferActBreaks = false) {
  if (!sceneList || sceneList.length === 0) return [];

  const buckets = [];
  let current = [];
  let currentDur = 0;

  for (let idx = 0; idx < sceneList.length; idx++) {
    const sc = sceneList[idx];
    const d = Number(sc.dur || 0);
    if (d > maxSec) {
      if (current.length > 0) {
        buckets.push({
          start: current[0].start,
          dur: Number(currentDur.toFixed(3)),
          scenes: current
        });
        current = [];
        currentDur = 0;
      }
      buckets.push(...splitLongSingleScene(sc, maxSec));
      continue;
    }

    const prevAct = current.length > 0 ? current[current.length - 1].act : null;
    const isActBoundary = preferActBreaks && prevAct != null && sc.act != null && sc.act !== prevAct;
    const actMinCut = Math.max(minSec, Math.min(38, maxSec * 0.65));

    if (current.length > 0 && (currentDur + d > maxSec || (isActBoundary && currentDur >= actMinCut))) {
      buckets.push({
        start: current[0].start,
        dur: Number(currentDur.toFixed(3)),
        scenes: current
      });
      current = [sc];
      currentDur = d;
    } else {
      current.push(sc);
      currentDur += d;
    }
  }

  if (current.length > 0) {
    buckets.push({
      start: current[0].start,
      dur: Number(currentDur.toFixed(3)),
      scenes: current
    });
  }

  // Merge adjacent undersized buckets when their sum still fits safely inside maxSec
  for (let i = 0; i < buckets.length - 1; ) {
    const a = buckets[i];
    const b = buckets[i + 1];
    if ((a.dur < minSec || b.dur < minSec) && (a.dur + b.dur <= maxSec)) {
      buckets.splice(i, 2, {
        start: a.start,
        dur: Number((a.dur + b.dur).toFixed(3)),
        scenes: [...a.scenes, ...b.scenes]
      });
    } else {
      i++;
    }
  }

  // Rebalance last two buckets so the finale EP isn't dramatically shorter than the penultimate EP
  if (buckets.length >= 2) {
    const last = buckets[buckets.length - 1];
    const prev = buckets[buckets.length - 2];
    while (last.dur < prev.dur - 12 && prev.scenes.length > 1 && last.scenes.length > 0) {
      const moved = prev.scenes[prev.scenes.length - 1];
      if (last.dur + moved.dur > maxSec || prev.dur - moved.dur < minSec) break;
      prev.scenes.pop();
      prev.dur = Number((prev.dur - moved.dur).toFixed(3));
      last.scenes.unshift(moved);
      last.start = moved.start;
      last.dur = Number((last.dur + moved.dur).toFixed(3));
    }
  }

  return buckets;
}

function trimHeadlinePhrase(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= maxChars) return s;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('th', { granularity: 'word' });
    let acc = '';
    for (const part of seg.segment(s)) {
      if ((acc + part.segment).trim().length > maxChars) break;
      acc += part.segment;
    }
    const clean = acc.trim().replace(/[.,…:;\-]+$/, '');
    if (clean.length >= Math.floor(maxChars * 0.45)) return clean;
  }
  const cut = s.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace >= Math.floor(maxChars * 0.55) ? cut.slice(0, lastSpace) : cut).replace(/[.,…:;\-]+$/, '');
}

function deriveHeadlineFromScene(scene, epNum, totalEps, fallbackTitle) {
  if (Array.isArray(scene?.coverHeadline) && scene.coverHeadline.length >= 2) {
    return { topLine: scene.coverHeadline[0], redWord: scene.coverHeadline[1] };
  }
  const tl = scene?.telemetry || scene?.tele;
  const card = scene?.card || scene?.hud;
  if (card) {
    const titles = Array.isArray(card.title) ? card.title : [card.title, card.sub].filter(Boolean);
    const shortRule = card.ruleNo ? `${card.ruleNo} ห้ามพลาด!` : null;
    if (titles.length >= 2) {
      const punch = titles[1].length <= 26 ? titles[1] : (shortRule || (tl?.label && tl.label.length <= 26 ? tl.label : null) || trimHeadlinePhrase(titles[1], 26));
      return { topLine: trimHeadlinePhrase(titles[0], 46), redWord: punch };
    }
    if (titles.length === 1) {
      return { topLine: trimHeadlinePhrase(titles[0], 46), redWord: epNum === totalEps ? 'จุดจบจริง!' : (shortRule || 'ระวังเอาไว้!') };
    }
  }
  const chapTitle = scene?.chapter
    ? (Array.isArray(scene.chapter) ? scene.chapter[1] : scene.chapter.title)
    : null;
  if (chapTitle && tl?.label) return { topLine: trimHeadlinePhrase(chapTitle, 42), redWord: trimHeadlinePhrase(tl.label, 26) };
  if (chapTitle) return { topLine: trimHeadlinePhrase(chapTitle, 42), redWord: epNum === totalEps ? 'ความจริงทั้งหมด!' : 'นาทีวิกฤต!' };
  if (tl?.day && tl?.label) return { topLine: trimHeadlinePhrase(String(tl.day), 42), redWord: trimHeadlinePhrase(String(tl.label), 26) };
  return { topLine: trimHeadlinePhrase(fallbackTitle || `เหตุการณ์ที่ ${epNum}`, 42), redWord: epNum === totalEps ? 'บทสรุปสยอง!' : 'จุดเปลี่ยนสำคัญ!' };
}

function deriveBadgeFromScene(scene, epNum, totalEps, fallbackTitle) {
  const chapTitle = scene?.chapter
    ? (Array.isArray(scene.chapter) ? scene.chapter[1] : scene.chapter.title)
    : null;
  const card = scene?.card || scene?.hud;
  const cardTitle = card ? (Array.isArray(card.title) ? card.title[0] : card.title) : null;
  const tl = scene?.telemetry || scene?.tele;
  const label = chapTitle || cardTitle || tl?.label || fallbackTitle || `จุดสำคัญตอนที่ ${epNum}`;
  const suffix = epNum === totalEps ? ' (จบ)' : '';
  return `EP ${epNum}${suffix}: ${label}`;
}

function planShortsEpisodes(timeline, cfg = {}, options = {}) {
  const scenes = timeline.scenes || [];
  let maxSec = Number(options.maxSec || cfg.maxSec || cfg.maxDurationSec || 58.0);
  if (!options.allowOver60) maxSec = Math.min(maxSec, 59.5);
  const minSec = Number(options.minSec || cfg.minSec || 22.0);
  const seriesTitle = cfg.shortTitle || timeline.title || 'Real Lens Survival Horror';

  let rawBuckets = [];

  if (Array.isArray(cfg.episodes) && cfg.episodes.length > 0) {
    for (const item of cfg.episodes) {
      let itemScenes = [];
      let startSec = 0;
      let durSec = 0;
      if (item.sStart != null && item.sEnd != null) {
        itemScenes = scenes.slice(item.sStart, item.sEnd + 1);
        startSec = itemScenes[0].start;
        const last = itemScenes[itemScenes.length - 1];
        durSec = (last.start + last.dur) - startSec;
      } else if (item.start != null && item.dur != null) {
        startSec = Number(item.start);
        durSec = Number(item.dur);
        itemScenes = scenes.filter(s => (s.start + s.dur) > startSec && s.start < (startSec + durSec));
      }
      if (durSec > 60.0 && !options.allowOver60 && itemScenes.length > 0) {
        rawBuckets.push(...splitSceneListUnderMax(itemScenes, maxSec, minSec));
      } else if (durSec > 0) {
        rawBuckets.push({ start: startSec, dur: Number(durSec.toFixed(3)), scenes: itemScenes, explicit: item });
      }
    }
  } else {
    // Keep clean Act = EP alignment when every Act fits inside maxSec;
    // otherwise pack continuously up to maxSec (preferring Act boundaries >= ~38s) -> EP 6, 7, 8+
    const hasActs = scenes.some(s => s.act != null);
    let allActsFit = false;
    if (hasActs) {
      const actGroups = [];
      let curAct = scenes[0]?.act;
      let group = [];
      for (const sc of scenes) {
        if (sc.act != null && sc.act !== curAct && group.length > 0) {
          actGroups.push(group);
          group = [];
          curAct = sc.act;
        }
        group.push(sc);
      }
      if (group.length > 0) actGroups.push(group);

      allActsFit = actGroups.every(grp => grp.reduce((sum, s) => sum + Number(s.dur || 0), 0) <= maxSec);
      if (allActsFit) {
        for (const grp of actGroups) {
          rawBuckets.push({
            start: grp[0].start,
            dur: Number(grp.reduce((sum, s) => sum + Number(s.dur || 0), 0).toFixed(3)),
            scenes: grp
          });
        }
      }
    }
    if (!allActsFit) {
      rawBuckets = splitSceneListUnderMax(scenes, maxSec, minSec, hasActs);
    }
  }

  const totalEps = rawBuckets.length;
  return rawBuckets.map((b, idx) => {
    const ep = idx + 1;
    const epScenes = b.scenes.length > 0 ? b.scenes : scenes;
    const winStart = Number(b.start);
    const winEnd = Number((b.start + b.dur).toFixed(3));

    let bestScene = epScenes[0];
    let bestScore = -1;
    epScenes.forEach((sc, i) => {
      const scScore = scoreSceneDramaticImpact(sc, i, epScenes.length);
      if (scScore > bestScore) {
        bestScore = scScore;
        bestScene = sc;
      }
    });

    const ovCfg = Array.isArray(cfg.overlays) ? cfg.overlays.find(o => o.ep === ep) : null;
    const covCfg = Array.isArray(cfg.covers) ? cfg.covers.find(c => c.ep === ep) : null;
    const headline = deriveHeadlineFromScene(bestScene, ep, totalEps, seriesTitle);

    return {
      ep,
      start: Number(winStart.toFixed(3)),
      dur: Number(b.dur.toFixed(3)),
      end: winEnd,
      sceneIds: epScenes.map(s => s.id),
      keySceneId: bestScene.id,
      keyView: bestScene.view,
      keyScore: bestScore,
      extractAt: covCfg?.extractAt != null ? String(covCfg.extractAt) : String(pickKeyTimestampInScene(bestScene, winStart, winEnd)),
      title: ovCfg?.title || seriesTitle,
      badge: ovCfg?.badge || deriveBadgeFromScene(bestScene, ep, totalEps, seriesTitle),
      topLine: covCfg?.topLine || headline.topLine,
      redWord: covCfg?.redWord || headline.redWord,
      overlayFile: `overlay_ep${ep}.png`,
      coverFile: `cover_shorts_ep${ep}.png`
    };
  });
}

function pickTopLongFormHighlights(scenes, count = 5) {
  if (!scenes || scenes.length === 0) return { showdownScene: null, panels: [] };

  // Pick Showdown scene from the middle-to-climax portion (last 65% of story)
  const startSearch = Math.min(scenes.length - 1, Math.floor(scenes.length * 0.35));
  let showdownScene = scenes[scenes.length - 1];
  let bestShowdownScore = -1;
  for (let i = startSearch; i < scenes.length; i++) {
    const s = scenes[i];
    const score = scoreSceneDramaticImpact(s, i, scenes.length) + ((s.telemetry?.distance || s.tele?.distance) ? 15 : 0);
    if (score > bestShowdownScore) {
      bestShowdownScore = score;
      showdownScene = s;
    }
  }

  // Pick 5 visually distinct dramatic scenes across 5 story progression bands
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
    const chap = best.chapter ? (Array.isArray(best.chapter) ? best.chapter[1] : best.chapter.title) : null;
    const card = best.card || best.hud;
    const cardTxt = card ? (Array.isArray(card.title) ? card.title[0] : card.title) : null;
    panels.push({
      num: String(b + 1),
      label: chap || cardTxt || best.view,
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
  fs.writeFileSync(planPath, JSON.stringify({ maxDurationSec: 58, count: plan.length, episodes: plan }, null, 2));
  return planPath;
}

module.exports = {
  scoreSceneDramaticImpact,
  pickKeyTimestampInScene,
  planShortsEpisodes,
  pickTopLongFormHighlights,
  saveShortsPlan
};
