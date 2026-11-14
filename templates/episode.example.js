// =============================================================================
//  episode.js — Story & Scene Specification (Single Source of Truth)
//  Part of skill: reallens-horror-animator
//  Copy to your project root as `episode.js` and replace with your story.
//
//  Scene Fields:
//    id            : unique string/number (used for audio cache & HyperFrames clips)
//    view          : key in VIEWS[...] inside views.js
//    act           : optional narrative act 1..N (shorts_planner.js keeps every EP <= 58s, auto-splitting into EP 6, 7, 8+)
//    vo            : Thai voiceover narration ("" for silent cliffhanger beat)
//    pad           : trailing silence in seconds after VO finishes
//    bed           : ambience bed key ('hum'|'dark'|'parking'|'wind'|'freeze'|'water'|'none')
//    sfx           : [{ at: secFromSceneStart, type: 'ui_pop'|... }] (also supports {t, k})
//    chapter       : optional [label, title] or { label, title }
//    telemetry     : optional { day, time, status, label, kcal/kmax|tide|temp|oxygen|db|bar, distance, distLabel }
//    hud / card    : optional rule | info | inventory | math/calc | dilemma/flow | anomaly/clue
//    isClimax      : optional true — marks a peak key scene for Shorts covers & Showdown thumbnail
//    coverAt       : optional seconds from scene start — exact timestamp for cover extraction
//    coverScore    : optional priority number for key-scene ranking
//    coverHeadline : optional [topLine, redWord] — custom 2-line Shorts cover hook
//    focusX        : optional 0..1280 X center for 5-panel vertical column crops
// =============================================================================

const TITLE = 'ตัวอย่าง: กฎกะดึกสถานีรถไฟใต้ดินสายสุดท้าย';
const SUBTITLE = 'THE LAST SUBWAY SHIFT · ANALYTICAL SURVIVAL HORROR';

const SCENES = [
  {
    id: '01_cold_open_platform',
    act: 1,
    view: 'platform_corridor',
    vo: 'ถ้าคุณได้ยินเสียงประกาศขบวนรถไฟมาถึงหลังเที่ยงคืนครึ่ง ห้ามเงยหน้ามองกระจกประตูเด็ดขาด',
    pad: 0.6,
    bed: 'hum',
    sfx: [{ at: 0.2, type: 'flicker' }, { at: 1.5, type: 'ui_pop' }],
    chapter: ['องก์ที่ 1 · ACT I', 'กะดึกชานชาลา 00:30'],
    telemetry: { day: 'กะดึก · สถานี B3', time: '00:30', status: 'WARN', db: 42, label: 'ขบวนสุดท้ายออกแล้ว' },
    hud: {
      type: 'rule', at: 1.5, pos: 'tl',
      ruleNo: 'กฎข้อ 1',
      title: 'หลัง 00:30 น. ห้ามมองเงาสะท้อนบนกระจกประตู',
      sub: 'เพราะสิ่งที่ยืนอยู่นอกขบวน... ไม่ได้อยู่ในชานชาลาเดียวกัน',
      eng: 'RULE 1 · NEVER LOOK AT GLASS REFLECTIONS AFTER 00:30'
    }
  },
  {
    id: '02_ots_approaching_entity',
    act: 2,
    view: 'ots_entity_approach',
    vo: 'เสียงล้อรถเข็นโลหะค่อยๆ ขยับเข้ามาใกล้จากปลายอุโมงค์ ระยะห่างลดลงเหลือไม่ถึงสิบเมตร',
    pad: 0.5,
    bed: 'dark',
    sfx: [{ at: 0.4, type: 'squeak' }, { at: 2.2, type: 'heartbeat' }],
    telemetry: {
      day: 'กะดึก · สถานี B3', time: '01:12', status: 'CRITICAL',
      db: 68, distance: '10 ม. ➔ 4 ม.', distLabel: 'ระยะห่าง'
    }
  },
  {
    id: '03_macro_notebook_calc',
    act: 3,
    view: 'macro_notebook_calc',
    vo: 'ผมก้มลงจดเวลาครบรอบลงในสมุดบันทึก ถ้าขบวนรถวนทุกสิบเจ็ดนาที ช่องทางหนีจะเปิดแค่สามสิบวินาทีเท่านั้น',
    pad: 0.6,
    bed: 'interior_hush',
    sfx: [{ at: 0.5, type: 'marker' }, { at: 2.0, type: 'ui_pop' }],
    telemetry: { day: 'ห้องควบคุม', time: '01:45', status: 'WARN', db: 35, label: 'ประตูนิรภัย: ล็อก' },
    hud: {
      type: 'math', at: 1.8, pos: 'r',
      badge: '● คำนวณรอบเวลา · EXIT WINDOW',
      rows: [
        ['รอบขบวนหลอนวนซ้ำ', 'ทุก 17 นาที'],
        ['ช่วงเวลาไฟห้องควบคุมติด', '30 วินาที']
      ],
      total: ['หน้าต่างหลบหนีถัดไป', '02:02:00 น.'],
      note: ['หากพลาดรอบนี้ ออกซิเจนจะหมดก่อน 03:00 น.']
    }
  },
  {
    id: '04_dilemma_choice',
    act: 4,
    view: 'dilemma_booth',
    vo: 'ไฟฉุกเฉินดับลงก่อนเวลาสองนาที ผมเหลือทางเลือกเดียวว่าจะรอในตู้หรือเดินฝ่าความมืดไปที่ประตูหนีไฟ',
    pad: 0.8,
    bed: 'tense_pulse',
    sfx: [{ at: 0.3, type: 'blackout' }, { at: 1.4, type: 'ui_pop' }],
    telemetry: { day: 'โถงทางเดิน', time: '02:00', lights: false, db: 74, distance: '3 ม.' },
    hud: {
      type: 'dilemma', at: 1.4,
      head: '02:00 น. · ไฟดับก่อนเวลา 2 นาที',
      optA: { title: 'รอไฟติดในตู้', icon: '⏳', res: 'ขาดอากาศตาย', en: 'FATAL · OXYGEN DEPLETED' },
      optB: { title: 'เดินฝ่าความมืดตามกฎ', icon: '🔦', res: 'ถึงทางออกทันเวลา', en: 'SAFE · REACH EXIT GATE' }
    }
  }
];

module.exports = { TITLE, SUBTITLE, SCENES };
