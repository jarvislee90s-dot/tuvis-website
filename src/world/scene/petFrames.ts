import { assetUrl } from "../assets/loadWorldData";
import type { Direction } from "../types";

export type ActionAnim = "jump" | "pickup" | "celebrate" | "fire";

export type SpriteAnimDef = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  /** Displayed cell height in scene coordinate units. */
  displayHeight: number;
  /** Normalized feet/ground point inside one cell. */
  anchor: readonly [number, number];
  fps: number;
  loop: boolean;
  /** Mirror the strip horizontally (SE source shown facing the other side). */
  flip?: boolean;
  /** Show one fixed frame without any animation (idle fallback). */
  staticFrame?: number;
};

const STRIP = "assets/characters/2.5d";
/**
 * The regenerated strips do not share a character scale: per-strip alpha
 * bounding boxes were measured (see docs/qa/tuvis-world-desktop.md §9.4) and
 * each displayHeight normalizes the character to ~184 scene px, matching the
 * idle strip the acceptance reference uses. anchor is the measured ground
 * point, not the cell corner.
 */
const TARGET_CHAR_PX = 184;

type StripMetrics = {
  /** Measured union character height / cell height. */
  charH: number;
  /** Measured union ground line / cell height. */
  feetY: number;
  /** Measured union horizontal center / cell width. */
  centerX: number;
};

function tall(file: string, m: StripMetrics, frames: number, extra: Partial<SpriteAnimDef> = {}): SpriteAnimDef {
  return {
    src: assetUrl(`${STRIP}/${file}`),
    frameWidth: 362,
    frameHeight: 724,
    frames,
    displayHeight: Math.round(TARGET_CHAR_PX / m.charH),
    anchor: [m.centerX, m.feetY],
    fps: 6,
    loop: true,
    ...extra,
  };
}

function compact(file: string, m: StripMetrics, extra: Partial<SpriteAnimDef> = {}): SpriteAnimDef {
  return {
    src: assetUrl(`${STRIP}/${file}`),
    frameWidth: 256,
    frameHeight: 320,
    frames: 4,
    displayHeight: Math.round(TARGET_CHAR_PX / m.charH),
    anchor: [m.centerX, m.feetY],
    fps: 7,
    loop: false,
    ...extra,
  };
}

const IDLE_SW = tall("tuvis2d-idle-sw.png", { charH: 0.898, feetY: 0.942, centerX: 0.478 }, 6, { fps: 4 });
/**
 * Only one large front-facing walk render exists (the SE strip). The strip
 * shipped as "walk SW" is a smaller second SE render, so SW mirrors the big
 * SE strip; NW/NE are genuine back-view renders (NE generated as NW mirror).
 */
const WALK_SE = tall("tuvis2d-walk-se.png", { charH: 0.902, feetY: 0.956, centerX: 0.526 }, 6, { fps: 10 });

/** Manifest asset ids of the frame strips (see manifest.json / coreAssets). */
export const SPRITE_ASSET_IDS = [
  "tuvis2dIdleSw",
  "tuvis2dWalkSe",
  "tuvis2dWalkNw",
  "tuvis2dWalkNe",
  "tuvis2dJumpSe",
  "tuvis2dPickupSe",
  "tuvis2dCelebrateSe",
  "tuvis2dFireSe",
] as const;

export function idleAnim(direction: Direction): SpriteAnimDef {
  switch (direction) {
    case "sw":
      return IDLE_SW;
    case "se":
      return { ...IDLE_SW, flip: true };
    // The two regenerated back-view strips shipped with swapped facing (the
    // "NE" file faced back-left and vice versa); the files were swapped in
    // the pack, so each direction reads its corrected metrics below.
    case "nw":
      return tall("tuvis2d-walk-nw.png", { charH: 0.537, feetY: 0.796, centerX: 0.532 }, 6, { staticFrame: 0 });
    case "ne":
      return tall("tuvis2d-walk-ne.png", { charH: 0.562, feetY: 0.844, centerX: 0.51 }, 6, { staticFrame: 0 });
  }
}

export function walkAnim(direction: Direction): SpriteAnimDef {
  switch (direction) {
    case "se":
      return WALK_SE;
    case "sw":
      return { ...WALK_SE, flip: true };
    case "nw":
      return tall("tuvis2d-walk-nw.png", { charH: 0.537, feetY: 0.796, centerX: 0.532 }, 6, { fps: 10 });
    case "ne":
      return tall("tuvis2d-walk-ne.png", { charH: 0.562, feetY: 0.844, centerX: 0.51 }, 6, { fps: 10 });
  }
}

export function actionAnim(kind: ActionAnim): SpriteAnimDef {
  switch (kind) {
    case "jump":
      return compact("tuvis2d-jump-se.png", { charH: 0.878, feetY: 0.925, centerX: 0.498 }, { fps: 8 });
    case "pickup":
      return compact("tuvis2d-pickup-se.png", { charH: 0.753, feetY: 0.931, centerX: 0.496 }, { fps: 7 });
    case "celebrate":
      return compact("tuvis2d-celebrate-se.png", { charH: 0.803, feetY: 0.925, centerX: 0.496 }, { fps: 6 });
    case "fire":
      // The fire strip uses the large 543x724 cell with the character nearly
      // filling it (measured charH 0.939, ground 0.960).
      return {
        src: assetUrl(`${STRIP}/tuvis2d-fire-se.png`),
        frameWidth: 543,
        frameHeight: 724,
        frames: 4,
        displayHeight: Math.round(TARGET_CHAR_PX / 0.939),
        anchor: [0.499, 0.96],
        fps: 8,
        loop: true, // the test fire keeps firing for the whole 2s window
      };
  }
}

/** How long a one-shot action animation runs before returning to idle. */
export const ACTION_DURATIONS: Record<ActionAnim, number> = {
  jump: 4 * 1000 / 8,
  pickup: 4 * 1000 / 7,
  celebrate: 4 * 1000 / 6,
  fire: 2000,
};
