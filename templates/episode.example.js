// =============================================================================
//  episode.js — Story & Scene Specification (Single Source of Truth)
//  Part of skill: reallens-horror-animator
//  Copy to your project root as `episode.js` and replace with your story.
//
//  Shorts / Vertical Packaging Structure:
//    - Event Cuts (45-60s/clip): Group scenes with `eventId` / `eventTitle` (or auto-sliced by shorts_planner.js)
//    - Standalone (45-60s): Short `act: 1` story stands alone
//    - 2-Part Max Cap: Never exceed 2 parts (`act: 1` + `act: 2`, with `isRecap: true` 3s recap on Part 2 opener)
//
//  Optional Top-Level & Scene Shorts Packaging Fields (NO leading "EP 1:", "เหตุการณ์ #1:", or pills/stamps):
//    shortsTitle   : optional string or [titleTop, titleBot] — short 2-line punchy title
//    shortsSubHook : optional string — concise teaser text inside the sharp red tag box directly below cover title
//    titleRedLine  : optional 1 | 2 — which title line uses Red (#EF4444) vs White (#FFFFFF)
//    eventId       : optional string/number — groups interesting scenes into standalone 45-60s event Shorts
//    eventTitle    : optional string — short understandable title for that event cut
//
//  Clean Cinematic Horror Rules:
//    - Pure story visuals + subtitles ONLY (ZERO infographic explainers / HUD boxes,
//      ZERO top-right telemetry meters, and ZERO red "บทนำ · COLD OPEN" pill banners).
//    - Never author `chapter`, `telemetry`, `hud`, or `card` inside story scenes.
//
//  Scene Fields:
//    id            : unique string/number (used for audio cache & HyperFrames clips)
//    view          : key in VIEWS[...] inside views.js
//    act           : optional narrative act (1 standalone 45-60s; max 2 acts total)
//    isRecap       : true on the first scene of act: 2 so Part 2 opens immediately with a 3s recap (0.06s lead)
//    vo            : Thai voiceover narration ("" for silent cliffhanger beat)
//    pad           : trailing silence in seconds after VO finishes
//    bed           : ambience bed key ('hum'|'dark'|'parking'|'wind'|'freeze'|'water'|'none')
//    sfx           : [{ at: secFromSceneStart, type: 'door'|... }] (also supports {t, k})
//    isClimax      : optional true — marks a peak key scene for Shorts covers & Showdown thumbnail
//    coverAt       : optional seconds from scene start — exact timestamp for cover extraction
//    coverScore    : optional priority number for key-scene ranking
//    coverHeadline : optional [titleTop, titleBot] — custom 2-line Shorts cover/overlay hook
//    focusX        : optional 0..1280 X center for 5-panel vertical column crops
// =============================================================================

const TITLE = 'เสียงเคาะกระจกตีหนึ่ง?! | กฎกะดึกสถานีสายสุดท้าย';
const SUBTITLE = 'THE LAST SUBWAY SHIFT · SURVIVAL HORROR';

const SHORTS_TITLE = ['เสียงเคาะกระจก', 'ตอนตีหนึ่ง!'];
const SHORTS_SUB_HOOK = 'คำตอบหลอนกว่าที่คุณคิดเยอะ!';
const TITLE_RED_LINE = 1;

const SCENES = [
  {
    id: '01_cold_open_anomaly_peak',
    act: 1,
    eventId: 'ev_window_knock',
    eventTitle: 'เสียงเคาะกระจกตอนตีหนึ่ง!',
    view: 'ots_entity_approach',
    isClimax: true,
    coverAt: 1.2,
    coverHeadline: ['เสียงเคาะกระจก', 'ตอนตีหนึ่ง!'],
    vo: 'ปัง ปัง ปัง เสียงเคาะกระจกดังขึ้นจากด้านนอกอุโมงค์ที่ไม่มีชานชาลา ทั้งที่รถไฟขบวนสุดท้ายเพิ่งออกไปเมื่อครึ่งชั่วโมงก่อน',
    pad: 0.4,
    bed: 'dark',
    sfx: [{ at: 0.05, type: 'door' }, { at: 0.45, type: 'door' }, { at: 1.8, type: 'heartbeat' }]
  },
  {
    id: '02_rewind_empty_platform',
    act: 1,
    view: 'platform_corridor',
    vo: 'ย้อนกลับไปตอนเที่ยงคืนครึ่ง ผมเพิ่งเดินลาดตระเวนกะดึกบนชานชาลาที่ว่างเปล่า และเห็นเงาใครบางคนยืนจ้องอยู่ที่อีกฝั่งของกระจก',
    pad: 0.5,
    bed: 'hum',
    sfx: [{ at: 0.2, type: 'flicker' }, { at: 2.1, type: 'steps' }]
  },
  {
    id: '03_macro_bloodstained_ticket',
    act: 1,
    view: 'macro_bloodstained_ticket',
    vo: 'ผมก้มลงหยิบตั๋วโดยสารเปื้อนคราบสีคล้ำที่ตกอยู่หน้าห้องควบคุม เวลาที่ประทับไว้บนตั๋วคือตีหนึ่งสิบสองนาที... ซึ่งเป็นเวลาในอีกห้านาทีข้างหน้า',
    pad: 0.5,
    bed: 'interior_hush',
    sfx: [{ at: 0.5, type: 'marker' }, { at: 2.4, type: 'stinger' }]
  },
  {
    id: '04_fire_door_twist',
    act: 1,
    view: 'dilemma_booth',
    vo: 'ไฟฉุกเฉินทั้งโถงดับวูบลง ผมรีบวิ่งฝ่าความมืดไปผลักประตูหนีไฟ แต่พอหันกลับมามอง... เสียงเคาะกระจกกลับดังขึ้นจากด้านหลังผมแทนครับ',
    pad: 0.8,
    bed: 'tense_pulse',
    sfx: [{ at: 0.3, type: 'blackout' }, { at: 5.2, type: 'sting' }]
  }
];

/* Optional 2-Part Template (ONLY if story cannot fit in 1 clip — MAX 2 EPs!):
  {
    id: '05_part2_recap_opener',
    act: 2,
    isRecap: true, // Forces COLD_OPEN_LEAD = 0.06s + subtitle at 0.00s
    view: 'platform_corridor',
    vo: 'ความเดิมจากตอนที่แล้ว หลังประตูหนีไฟปิดล็อกลง เงาปริศนาก็ก้าวเข้ามาชิดกระจกมากขึ้นเรื่อยๆ...',
    ...
  }
*/

module.exports = { TITLE, SUBTITLE, SHORTS_TITLE, SHORTS_SUB_HOOK, TITLE_RED_LINE, SCENES };
