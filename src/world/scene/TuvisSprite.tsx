import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "../types";
import type { SpriteAnimDef } from "./petFrames";

export type TuvisSpriteProps = {
  def: SpriteAnimDef;
  /** Scene-coordinate feet position. */
  position: Point;
  /** Depth used as z-index (feet y). */
  depth: number;
  stage: Point;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

/**
 * Frame-animation sprite: one horizontal strip drawn through
 * background-position with CSS steps(), percentage-based so it scales with
 * the stage like the SVG sprites. Remount (key change) restarts the loop.
 */
export function TuvisSprite({ def, position, depth, stage, onPointerDown, onClick }: TuvisSpriteProps) {
  const aspect = def.frameWidth / def.frameHeight;
  const height = def.displayHeight;
  const width = height * aspect;
  const animate = def.staticFrame === undefined && def.frames > 1;
  const interactive = Boolean(onPointerDown || onClick);
  const [anchorX, anchorY] = def.anchor;
  const style: CSSProperties = {
    position: "absolute",
    left: `${(position[0] / stage[0]) * 100}%`,
    top: `${(position[1] / stage[1]) * 100}%`,
    width: `${(width / stage[0]) * 100}%`,
    height: `${(height / stage[1]) * 100}%`,
    zIndex: Math.round(depth),
    backgroundImage: `url(${def.src})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${def.frames * 100}% 100%`,
    backgroundPositionX:
      def.staticFrame === undefined ? "0%" : `${(def.staticFrame / (def.frames - 1)) * 100}%`,
    // Mirror must apply AFTER the anchor translate in matrix order
    // (leftmost op runs last): "scaleX(-1) translate(...)" mirrors in place,
    // while "translate(...) scaleX(-1)" would shift the box by a full width.
    transform: `${def.flip ? "scaleX(-1) " : ""}translate(${-anchorX * 100}%, ${-anchorY * 100}%)`,
    transformOrigin: "0 0",
    pointerEvents: interactive ? "auto" : "none",
    cursor: interactive ? "pointer" : undefined,
  };
  if (animate) {
    style.animation = `world-sprite-frames ${(def.frames / def.fps).toFixed(3)}s steps(${def.frames - 1}, end)${def.loop ? " infinite" : " 1 forwards"}`;
  }
  return (
    <div
      data-sprite-anim={def.src.split("/").pop()?.replace(/\.png$/, "")}
      aria-hidden="true"
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
    />
  );
}
