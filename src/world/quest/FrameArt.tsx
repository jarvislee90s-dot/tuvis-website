import type { WorldContentBundle } from "../types";
import { assetUrl } from "../assets/loadWorldData";

type FrameArtProps = {
  bundle: WorldContentBundle;
  frameId: string;
  alt: string;
  /** Width of the fitted artwork inside its box, as a percentage. */
  fit?: number;
};

/** Crop one atlas frame into an aspect-correct fitted box. */
export function FrameArt({ bundle, frameId, alt, fit = 86 }: FrameArtProps) {
  const frame = bundle.manifest.frames[frameId];
  const asset = frame ? bundle.manifest.assets[frame.asset] : undefined;
  if (!frame || !asset) return null;
  const cropW = frame.sourceRect[2];
  const cropH = frame.sourceRect[3];
  return (
    <span
      style={{
        display: "block",
        position: "relative",
        width: `${fit}%`,
        aspectRatio: `${cropW} / ${cropH}`,
      }}
    >
      <img
        src={assetUrl(asset.path)}
        alt={alt}
        draggable={false}
        style={{
          position: "absolute",
          width: `${(asset.width / cropW) * 100}%`,
          height: `${(asset.height / cropH) * 100}%`,
          left: `${(-frame.sourceRect[0] / cropW) * 100}%`,
          top: `${(-frame.sourceRect[1] / cropH) * 100}%`,
          maxWidth: "none",
        }}
      />
    </span>
  );
}
