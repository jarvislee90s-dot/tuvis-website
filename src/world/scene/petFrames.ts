import { assetUrl } from "../assets/loadWorldData";
import type { Direction } from "../types";

export type ActionAnim = "jump" | "pickup" | "celebrate";

export type SpriteAnimDef = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  /** Displayed cell height in scene coordinate units. */
  displayHeight: number;
  /** Normalized feet point inside one cell. */
  anchor: readonly [number, number];
  fps: number;
  loop: boolean;
  /** Mirror the strip horizontally (SE source shown facing the other side). */
  flip?: boolean;
  /** Show one fixed frame without any animation (idle fallback). */
  staticFrame?: number;
};

const STRIP = "assets/characters/2.5d";
/** New-generation strips: 362x724 cells, character fills most of the cell. */
const TALL = {
  frameWidth: 362,
  frameHeight: 724,
  displayHeight: 205,
  anchor: [0.5, 0.97] as const,
};
/** v0.1 strips: 256x320 cells, character occupies roughly the lower 78%. */
const COMPACT = {
  frameWidth: 256,
  frameHeight: 320,
  displayHeight: 245,
  anchor: [0.5, 0.94] as const,
};

function strip(file: string, frames: number, extra: Partial<SpriteAnimDef> = {}): SpriteAnimDef {
  return {
    src: assetUrl(`${STRIP}/${file}`),
    frameWidth: TALL.frameWidth,
    frameHeight: TALL.frameHeight,
    frames,
    displayHeight: TALL.displayHeight,
    anchor: TALL.anchor,
    fps: 6,
    loop: true,
    ...extra,
  };
}

function legacyStrip(file: string, extra: Partial<SpriteAnimDef> = {}): SpriteAnimDef {
  return {
    src: assetUrl(`${STRIP}/${file}`),
    frameWidth: COMPACT.frameWidth,
    frameHeight: COMPACT.frameHeight,
    frames: 4,
    displayHeight: COMPACT.displayHeight,
    anchor: COMPACT.anchor,
    fps: 7,
    loop: false,
    ...extra,
  };
}

const IDLE_SW = strip("tuvis2d-idle-sw.png", 6, { fps: 4 });
const WALK_FILES: Record<Direction, string> = {
  se: "tuvis2d-walk-se.png",
  sw: "tuvis2d-walk-sw.png",
  nw: "tuvis2d-walk-nw.png",
  ne: "tuvis2d-walk-ne.png",
};

/** Manifest asset ids of the frame strips (see manifest.json / coreAssets). */
export const SPRITE_ASSET_IDS = [
  "tuvis2dIdleSw",
  "tuvis2dWalkSe",
  "tuvis2dWalkSw",
  "tuvis2dWalkNw",
  "tuvis2dWalkNe",
  "tuvis2dJumpSe",
  "tuvis2dPickupSe",
  "tuvis2dCelebrateSe",
] as const;

/**
 * 2.5D frame strips. Only idle SW / walk in four directions exist as real
 * renders; idle SE mirrors idle SW, and back-view idles hold the first walk
 * frame until dedicated strips are drawn. One-shot action strips are SE only.
 */
export function idleAnim(direction: Direction): SpriteAnimDef {
  switch (direction) {
    case "sw":
      return IDLE_SW;
    case "se":
      return { ...IDLE_SW, flip: true };
    case "nw":
      return strip(WALK_FILES.nw, 6, { staticFrame: 0 });
    case "ne":
      return strip(WALK_FILES.ne, 6, { staticFrame: 0 });
  }
}

export function walkAnim(direction: Direction): SpriteAnimDef {
  return strip(WALK_FILES[direction], 6, { fps: 10 });
}

export function actionAnim(kind: ActionAnim): SpriteAnimDef {
  switch (kind) {
    case "jump":
      return legacyStrip("tuvis2d-jump-se.png", { fps: 8 });
    case "pickup":
      return legacyStrip("tuvis2d-pickup-se.png", { fps: 7 });
    case "celebrate":
      return legacyStrip("tuvis2d-celebrate-se.png", { fps: 6 });
  }
}

/** How long a one-shot action animation runs before returning to idle. */
export const ACTION_DURATIONS: Record<ActionAnim, number> = {
  jump: 4 * 1000 / 8,
  pickup: 4 * 1000 / 7,
  celebrate: 4 * 1000 / 6,
};
