import type { Point, WorldManifest } from "../types";
import { assetUrl } from "../assets/loadWorldData";

export type SpriteProps = {
  manifest: WorldManifest;
  frameId: string;
  position: Point;
  width?: number;
  height?: number;
  anchor?: Point;
  zIndex: number;
  /** World size used to place the sprite with percentages that scale with the stage. */
  stage?: Point;
};

/**
 * Draw one atlas frame through SVG viewBox cropping. The sprite's CSS origin
 * is the anchor (feet for characters), so switching poses with a different
 * frame anchor keeps the world position fixed.
 */
export function Sprite({
  manifest,
  frameId,
  position,
  width,
  height,
  anchor,
  zIndex,
  stage,
}: SpriteProps) {
  const frame = manifest.frames[frameId];
  if (!frame) return null;
  const asset = manifest.assets[frame.asset];
  if (!asset) return null;

  const [cropX, cropY, cropW, cropH] = frame.sourceRect;
  const aspect = cropW / cropH;
  const drawWidth = width ?? (height !== undefined ? height * aspect : cropW);
  const drawHeight = height ?? drawWidth / aspect;
  const [anchorX, anchorY] = anchor ?? frame.anchor;
  const left = stage ? `${(position[0] / stage[0]) * 100}%` : `${position[0]}px`;
  const top = stage ? `${(position[1] / stage[1]) * 100}%` : `${position[1]}px`;
  const spriteWidth = stage ? `${(drawWidth / stage[0]) * 100}%` : `${drawWidth}px`;
  const spriteHeight = stage ? `${(drawHeight / stage[1]) * 100}%` : `${drawHeight}px`;

  return (
    <svg
      data-frame={frameId}
      viewBox={`${cropX} ${cropY} ${cropW} ${cropH}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{
        position: "absolute",
        left,
        top,
        width: spriteWidth,
        height: spriteHeight,
        transform: `translate(${-anchorX * 100}%, ${-anchorY * 100}%)`,
        transformOrigin: "0 0",
        zIndex: Math.round(zIndex),
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <image href={assetUrl(asset.path)} x={0} y={0} width={asset.width} height={asset.height} />
    </svg>
  );
}
