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

export type PetId = "bell" | "starry";
/** 两只宠物差异仅在精灵表行数与语音；行映射 r0–r8 完全一致。 */
export const PETS: Record<PetId, { src: string; rows: number; voice: boolean; labelKey: string }> = {
  bell:   { src: "pet/spritesheet.webp", rows: 11, voice: true,  labelKey: "pet.bell" },
  starry: { src: "pet/starry-dew.webp",  rows: 9,  voice: false, labelKey: "pet.starry" },
};

export function frameStyle(anim: PetAnim, frame: number, scale: number, pet: PetId = "bell") {
  const def = ANIM[anim];
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
