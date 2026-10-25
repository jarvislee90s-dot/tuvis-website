export const FRAME_W = 192;
export const FRAME_H = 208;
export const SHEET_COLS = 8;

export type PetAnim = "idle" | "run-right" | "run-left" | "waving" | "jumping" | "failed" | "waiting";
export const ANIM: Record<PetAnim, { row: number; d: number[] }> = {
  idle: { row: 0, d: [280, 110, 110, 140, 140, 320] },
  "run-right": { row: 1, d: [120, 120, 120, 120, 120, 120, 120, 220] },
  "run-left": { row: 2, d: [120, 120, 120, 120, 120, 120, 120, 220] },
  waving: { row: 3, d: [140, 140, 140, 280] },
  jumping: { row: 4, d: [140, 140, 140, 140, 280] },
  failed: { row: 5, d: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, d: [150, 150, 150, 150, 150, 260] },
};

export type PetId = "bell" | "starry" | "tuvis";
/** 各宠物差异：精灵表行数、语音；行映射默认 r0–r8 一致，个别表用 ANIM_OVERRIDE 改行位。 */
export const PETS: Record<PetId, { src: string; rows: number; voice: boolean; labelKey: string }> = {
  bell:   { src: "pet/spritesheet.webp", rows: 11, voice: true,  labelKey: "pet.bell" },
  starry: { src: "pet/starry-dew.webp",  rows: 9,  voice: false, labelKey: "pet.starry" },
  tuvis:  { src: "pet/tuvis-3d/spritesheet.webp", rows: 11, voice: true, labelKey: "pet.tuvis" },
};

/** tuvis-3d 表的 r5 是攻击、r6 是修理，等待/失败语义实际在 r9/r10（各 8 帧）；r0–r4 与默认一致。 */
const ANIM_OVERRIDE: Partial<Record<PetId, Partial<Record<PetAnim, { row: number; d: number[] }>>>> = {
  tuvis: {
    waiting: { row: 9, d: [150, 150, 150, 150, 150, 150, 150, 260] },
    failed: { row: 10, d: [140, 140, 140, 140, 140, 140, 140, 240] },
  },
};

export function animDef(anim: PetAnim, pet: PetId = "bell") {
  return ANIM_OVERRIDE[pet]?.[anim] ?? ANIM[anim];
}

/** 兔维斯配音（pet/tuvis-3d/voice/，按场景分组随机挑选；路径相对 BASE_URL）。 */
export const TUVIS_VOICE: Record<"approval" | "done", string[]> = {
  approval: [
    "pet/tuvis-3d/voice/approval/滴滴，这一步需要你来确认。.m4a",
    "pet/tuvis-3d/voice/approval/我在这里等你，先看看这次的操作吧。.m4a",
    "pet/tuvis-3d/voice/approval/耳朵竖好了，就等你的决定啦。.m4a",
    "pet/tuvis-3d/voice/approval/前方确认点！接下来听你指挥。.m4a",
  ],
  done: [
    "pet/tuvis-3d/voice/done/这轮任务完成，来看看成果吧！.m4a",
    "pet/tuvis-3d/voice/done/搞定啦！这只兔子值得一根胡萝卜。.m4a",
    "pet/tuvis-3d/voice/done/叮！成果已送达，请查收。.m4a",
    "pet/tuvis-3d/voice/done/呼，忙完这一轮！一起伸个懒腰吧。.m4a",
  ],
};

export function frameStyle(anim: PetAnim, frame: number, scale: number, pet: PetId = "bell") {
  const def = animDef(anim, pet);
  const f = ((frame % def.d.length) + def.d.length) % def.d.length;
  const w = FRAME_W * scale;
  const h = FRAME_H * scale;
  const meta = PETS[pet];
  return {
    backgroundImage: `url(${import.meta.env.BASE_URL}${meta.src})`,
    backgroundSize: `${w * SHEET_COLS}px ${h * meta.rows}px`,
    backgroundPosition: `${-f * w}px ${-def.row * h}px`,
    width: w,
    height: h,
  };
}
