// =============================================================================
//  episode.js — Story & Scene Specification (Single Source of Truth)
//  Part of skill: reallens-horror-animator
//  Supports Dual Modes:
//    - NARRATIVE_MODE: 'documentary' (Thai/Isan Folklore Science & History Decode, 8-12 min)
//                      | 'survival'  (Classic Real Lens 2.5D Survival Horror)
//    - HUD_MODE      : 'documentary' (Clean Cinema Mode — 100% pure animated visuals + subtitles ONLY;
//                                     hides ALL survival bars, rule cards, and popup text boxes!)
//                      | 'survival'  (Classic survival mode; legacy telemetry/rule cards opt-in only)
//
//  IRON SCRIPTING RULES:
//    1. STRICT FIELD SEPARATION:
//       - `narration` (legacy alias: `vo`): ONLY spoken Thai script sent to TTS & subtitles.
//         NEVER write camera or storyboard commands ("มุมเสย", "แพนกล้อง", "ซูมเข้า", "มองกล้อง")
//         inside `narration`!
//       - `visual_prompt`: What appears visually on screen (setting, lighting, props, action).
//       - `camera_note` & `cameraSpec`: Camera angle, pitch, horizonY, framing, movement.
//    2. ANTI-SPOILER RETENTION ARC (Documentary 8-12 min target):
//       - 0:00-0:45  (`phase: 'hook'`)     : Horror incident + mystery question. NO science/history reveal!
//       - 0-50%      (`phase: 'folklore'`) : Myths, rituals, taboos, social tension & dread build-up.
//       - 50-90%     (`phase: 'decode'`, `isReveal: true`): Gradual medical/anthropology/history decode.
//       - 90-100%    (`phase: 'outro'`, `isFinalScene: true`): Synthesis + comment/subscribe CTA ONLY here!
//    3. ANTI-REPETITION RULE:
//       - NEVER recycle the same fictional "พ่อใหญ่/แม่เฒ่าวัย 60-70 ปี นั่งแคร่หน้าบ้าน" framing every episode.
//       - Alternate framing across real archival newspapers, medical/clinical case studies, real B.E. years,
//         field ethnography, and historical/economic archives.
//    4. LONG-FORM SEO TITLE FORMULA:
//       - Primary keyword (legend/ghost name) inside the FIRST 50-60 characters.
//       - NEVER append channel name suffix (e.g. NO "| เว้าเรื่องหลอน").
//       - NEVER spoil the scientific/historical cause in the title.
// =============================================================================

const NARRATIVE_MODE = 'documentary'; // 'documentary' | 'survival'
const HUD_MODE = 'documentary';       // 'documentary' | 'survival'

// Long-Form SEO Title: Primary keyword in first 50-60 chars, zero channel suffix, zero spoiler
const TITLE = 'ตำนานผีแม่ม่ายอีสาน ทำไมชายหนุ่มยุค 80 ต้องทาเล็บแดงนอน?!';
const SUBTITLE = 'THAI FOLKLORE DECODED · SCIENCE & HISTORY DOCUMENTARY';

// Per-episode pronunciation overrides merged on top of `pronunciation_map.js`
// (Converts English, medical terms, proper nouns & tricky Thai/Isan words for TTS ONLY — subtitles stay original)
const PRONUNCIATION_MAP = {
  // เพิ่มหรือแก้คำเฉพาะของตอนนี้ได้ที่นี่ (คำพื้นฐานกว่า 150 คำถูกโหลดจาก pronunciation_map.js แล้วอัตโนมัติ)
  SUNDS: 'ซันด์ส',
  Brugada: 'บรูกาด้า',
  'นักมานุษยวิทยา': 'นัก-มะ-นุด-สะ-ยะ-วิด-ทะ-ยา'
};

// Optional 3-4s spoken CTA played over the Related Video Bridge End-Card on Cliffhanger Shorts
const SHORTS_BRIDGE_CTA_VO = 'ความจริงเบื้องหลังตำนานนี้คืออะไร กดดูเฉลยเต็มที่ลิงก์ด้านล่างได้เลยครับ';
const SHORTS_BRIDGE_CTA_TEXT = 'ดูเฉลยเต็มที่ลิงก์ด้านล่าง';

// Optional Shorts Thumbnail / Cover copy (<= 4 words, NEVER duplicates TITLE)
const SHORTS_TITLE = ['ทาเล็บแดงนอน', 'กันผีแม่ม่าย?!'];
const SHORTS_SUB_HOOK = 'ความจริงเศร้ากว่าผีหลายเท่า!';
const TITLE_RED_LINE = 2;

// Optional explicit 3-Angle Cliffhanger Shorts definitions (or let shorts_planner.js auto-select 3 angles)
// NOTE: NEVER include `phase: 'decode'` / `isReveal: true` scenes inside Cliffhanger Shorts!
const SHORTS_ANGLES = [
  {
    angle: 'ritual',
    tag: 'cliff_01_ritual',
    titleTop: 'แขวนใบหนาดหนามพุทรา',
    titleBot: 'กันผีแม่ม่าย?!',
    sceneIds: ['01_cold_open_archive_hook', '02_folklore_ritual_dread']
  }
];

const SCENES = [
  // ---------------------------------------------------------------------------
  // PHASE 1: 0:00–0:45 COLD OPEN HOOK (Anti-Spoiler — ZERO science/history reveal!)
  // ---------------------------------------------------------------------------
  {
    id: '01_cold_open_archive_hook',
    phase: 'hook',
    shortsAngle: 'tension',
    isClimax: true,
    view: 'ots_entity_approach',
    coverAt: 1.4,
    focusX: 660,
    // Strictly spoken TTS text — ZERO camera/storyboard instructions!
    narration: 'ปีพุทธศักราช 2533 ชายหนุ่มวัยทำงานชาวอีสานจำนวนมากเข้านอนตามปกติในคืนที่อากาศเงียบสงัด แต่กลับไม่มีใครตื่นขึ้นมาอีกเลย จนหลายหมู่บ้านต้องเร่งหาทางป้องกันด้วยความหวาดผวา',
    visual_prompt: 'คืนเดือนหงายหมอกลงจัดริมชานหมู่บ้านชนบท แสงไฟฉายสาดผ่านความมืดเห็นเงาร่างปริศนาไกลๆ ตัดกับเงาบ้านไม้ใต้ถุนสูง',
    camera_note: 'มุมกว้างระดับต่ำ (Low-angle OTS) ข้ามไหล่พยาน ส่องไฟฉายเข้าหาเงาในหมอก ดันกล้องเข้าช้าๆ',
    cameraSpec: { pitch: 'low', horizonY: 420, framing: 'OTS-wide', move: 'slow-push' },
    pad: 0.45,
    bed: 'dark',
    sfx: [{ at: 0.08, type: 'rumble' }, { at: 2.2, type: 'heartbeat' }]
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: 0–50% FOLKLORE, RITUALS & TENSION (Build dread before any decode)
  // ---------------------------------------------------------------------------
  {
    id: '02_folklore_ritual_dread',
    phase: 'folklore',
    shortsAngle: 'ritual',
    view: 'platform_corridor',
    focusX: 620,
    narration: 'เมื่อความตายเกิดขึ้นซ้ำๆ โดยไร้ร่องรอยบาดแผล ชาวบ้านจึงแขวนหนามพุทราและใบหนาดไว้หน้าประตูเรือน พร้อมทาเล็บสีแดงให้ผู้ชายในบ้าน เพื่อลวงสิ่งที่เชื่อกันว่าเป็นผีแม่ม่าย',
    visual_prompt: 'หน้าเรือนไม้ยามค่ำคืน มีกิ่งหนามพุทราและใบหนาดแขวนเหนือประตู ตัดสลับแสงตะเกียงวูบไหวในห้องแคบ',
    camera_note: 'มุมห้องสองจุด (2-point interior) เล่นแสงสีแดงกะพริบจากด้านข้าง แพนกล้องช้าๆ ผ่านบานประตู',
    cameraSpec: { pitch: 'eye', horizonY: 360, framing: 'medium-interior', move: 'pan-right' },
    pad: 0.45,
    bed: 'interior_hush',
    sfx: [{ at: 0.3, type: 'flicker' }, { at: 2.0, type: 'creak' }]
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: 50–90% SCIENTIFIC / MEDICAL / HISTORICAL DECODE (Excluded from Shorts!)
  // ---------------------------------------------------------------------------
  {
    id: '03_medical_decode_sunds',
    phase: 'decode',
    isReveal: true, // Strictly excluded by Cliffhanger Shorts planner to prevent spoilers!
    view: 'macro_bloodstained_ticket',
    focusX: 640,
    narration: 'แต่เมื่อทีมแพทย์และนักมานุษยวิทยาลงพื้นที่ตรวจสอบแฟ้มเวชระเบียนย้อนหลัง กลับพบความเชื่อมโยงกับภาวะหัวใจเต้นผิดจังหวะเฉียบพลัน หรือกลุ่มอาการ SUNDS และ Brugada ที่มักเกิดขณะหลับลึก',
    visual_prompt: 'มุมมองบุคคลที่หนึ่ง ไฟฉายสาดลงบนแฟ้มบันทึกทางการแพทย์และกราฟคลื่นหัวใจเก่าบนโต๊ะเหล็ก',
    camera_note: 'โคลสอัพมือถือไฟฉายกวาดแสงจากซ้ายไปขวาเหนือเอกสารบันทึกจริง',
    cameraSpec: { pitch: 'high-top', horizonY: 180, framing: 'macro-POV', move: 'light-sweep' },
    pad: 0.48,
    bed: 'hum',
    sfx: [{ at: 0.5, type: 'marker' }, { at: 2.6, type: 'sting' }]
  },

  // ---------------------------------------------------------------------------
  // PHASE 4: 90–100% SYNTHESIS & FINAL CTA (CTA allowed ONLY on final scene!)
  // ---------------------------------------------------------------------------
  {
    id: '04_outro_synthesis_cta',
    phase: 'outro',
    isReveal: true,
    isFinalScene: true,
    view: 'dilemma_booth',
    focusX: 640,
    narration: 'พิธีกรรมความเชื่อในวันนั้นจึงไม่ใช่เพียงความงมงาย แต่คือกลไกทางจิตวิทยาที่ช่วยประคองใจผู้คนในวันที่การแพทย์ยังไปไม่ถึง หากคุณเคยได้ยินเรื่องเล่าทำนองนี้ในบ้านเกิด ลองคอมเมนต์แลกเปลี่ยนกันไว้ใต้คลิป และกดติดตามเพื่อรอถอดรหัสตำนานตอนต่อไปครับ',
    visual_prompt: 'มุมสูงเหนือพื้นที่ปิด แสงสัญญาณเตือนค่อยๆ สงบลง เผยความเงียบสงัดหลังคลี่คลายปริศนา',
    camera_note: 'มุมสูงก้มลง (Top-down) ถอยกล้องออกช้าๆ พร้อมแสงเงาเย็นสงบ',
    cameraSpec: { pitch: 'top-down', horizonY: 160, framing: 'high-wide', move: 'pull-out' },
    pad: 0.50,
    bed: 'tense_pulse',
    sfx: [{ at: 0.4, type: 'rumble' }]
  }
];

/* Backward-Compatible Survival Mode Example:
   const NARRATIVE_MODE = 'survival';
   const HUD_MODE = 'survival';
   // Legacy `vo` field continues to work identically alongside `narration`!
*/

module.exports = {
  NARRATIVE_MODE,
  HUD_MODE,
  TITLE,
  SUBTITLE,
  PRONUNCIATION_MAP,
  SHORTS_BRIDGE_CTA_VO,
  SHORTS_BRIDGE_CTA_TEXT,
  SHORTS_TITLE,
  SHORTS_SUB_HOOK,
  TITLE_RED_LINE,
  SHORTS_ANGLES,
  SCENES
};
