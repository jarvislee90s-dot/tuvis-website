import { useEffect, useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import type { ContentOverlay, Point, SceneDefinition, WorldBundle, WorldManifest } from "../types";
import { assetUrl } from "../assets/loadWorldData";
import { ContentPanel } from "../content/ContentPanel";
import { AssemblyPanel } from "../quest/AssemblyPanel";
import { QuestBar } from "../quest/QuestBar";
import { WorkbenchPanel } from "../quest/WorkbenchPanel";
import { toScenePoint } from "./geometry";
import { resolveHotspot } from "./interaction";
import { Sprite } from "./Sprite";
import { useRuntimeStore, type Pose } from "./runtimeStore";
import { useSceneLoop } from "./useSceneLoop";

type SceneViewProps = {
  bundle: WorldBundle;
};

type PoseFrame = {
  frameId: string;
  position: Point;
  height: number;
  depth: number;
  anchor?: Point;
};

/** Convert seatAnchorSource (atlas pixels) to a normalized crop anchor. */
function normalizedSeatAnchor(
  manifest: WorldManifest,
  frameId: string,
  source?: Point,
): Point | undefined {
  const frame = manifest.frames[frameId];
  if (!source || !frame) return undefined;
  const [x, y, width, height] = frame.sourceRect;
  return [(source[0] - x) / width, (source[1] - y) / height];
}

function characterFrame(
  scene: SceneDefinition,
  manifest: WorldManifest,
  pose: Pose,
  position: Point,
): PoseFrame {
  if (pose === "sit" || pose === "coffee" || pose === "display") {
    const action = scene.actions[pose];
    if (action) {
      if (pose === "sit" && action.seatPosition) {
        return {
          frameId: action.frame,
          position: action.seatPosition,
          height: action.height,
          depth: action.depth ?? action.seatPosition[1],
          anchor: normalizedSeatAnchor(manifest, action.frame, action.seatAnchorSource),
        };
      }
      return {
        frameId: action.frame,
        position,
        height: action.height,
        depth: position[1],
      };
    }
  }
  return {
    frameId: pose,
    position,
    height: scene.actorHeight,
    depth: position[1],
  };
}

export function SceneView({ bundle }: SceneViewProps) {
  const { scene, manifest } = bundle;
  const { t } = useTranslation();
  const store = useRuntimeStore();
  useSceneLoop(store, scene);

  const motion = useStore(store, (state) => state.motion);
  const pose = useStore(store, (state) => state.pose);
  const notice = useStore(store, (state) => state.notice);
  const quest = useStore(store, (state) => state.quest);
  const overlay = useStore(store, (state) => state.overlay);
  const pendingArrival = useStore(store, (state) => state.pendingArrival);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendingArrival) return;
    const current = store.getState();
    if (pendingArrival.hotspotId) {
      const result = resolveHotspot(pendingArrival.hotspotId, bundle, current.quest);
      if (result.questEvent) current.dispatchQuest(result.questEvent);
      if (result.pose) current.setPose(result.pose);
      if (result.message) current.setNotice(result.message);
      if (result.overlay) current.setOverlay(result.overlay);
    }
    current.clearArrival();
  }, [pendingArrival, bundle, store]);

  const character = characterFrame(scene, manifest, pose, motion.position);
  const moving = motion.target !== null;
  const rackFrame = manifest.frames[scene.rackDisplay.frame];
  const rackAsset = rackFrame ? manifest.assets[rackFrame.asset] : undefined;
  const [rackX, rackY, rackW, rackH] = scene.rackDisplay.rect;
  const contentOverlay: ContentOverlay | null =
    overlay &&
    (overlay.kind === "equipment" ||
      overlay.kind === "world" ||
      overlay.kind === "stories" ||
      overlay.kind === "door" ||
      overlay.kind === "help")
      ? overlay
      : null;
  const closeOverlay = () => store.getState().setOverlay(null);

  const onStageClick = (event: MouseEvent<HTMLDivElement>) => {
    const element = stageRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const point = toScenePoint(
      [event.clientX, event.clientY],
      [rect.left, rect.top, rect.width, rect.height],
      scene.size,
    );
    if (!point) {
      store.getState().setNotice("unreachable");
      return;
    }
    store.getState().requestMove(point);
  };

  return (
    <>
      <QuestBar bundle={bundle} quest={quest} />
      <section className="world-scene-wrap" aria-label="工坊场景">
      <div
        ref={stageRef}
        className="world-stage"
        style={{ aspectRatio: `${scene.size[0]} / ${scene.size[1]}` }}
        onClick={onStageClick}
      >
        <img
          className="world-stage-bg"
          src={assetUrl(manifest.assets[scene.background].path)}
          alt=""
          draggable={false}
        />

        {scene.props.map((prop) => (
          <Sprite
            key={prop.id}
            manifest={manifest}
            frameId={prop.frame}
            position={prop.position}
            width={prop.width}
            zIndex={prop.depth}
            stage={scene.size}
          />
        ))}

        {quest.displayedOnRack && rackFrame && rackAsset ? (
          <div
            className="world-rack-display"
            style={{
              left: `${(rackX / scene.size[0]) * 100}%`,
              top: `${(rackY / scene.size[1]) * 100}%`,
              width: `${(rackW / scene.size[0]) * 100}%`,
              height: `${(rackH / scene.size[1]) * 100}%`,
            }}
          >
            <img
              src={assetUrl(rackAsset.path)}
              alt="Bug Buster"
              style={{
                position: "absolute",
                width: `${(rackAsset.width / rackFrame.sourceRect[2]) * 100}%`,
                height: `${(rackAsset.height / rackFrame.sourceRect[3]) * 100}%`,
                left: `${(-rackFrame.sourceRect[0] / rackFrame.sourceRect[2]) * 100}%`,
                top: `${(-rackFrame.sourceRect[1] / rackFrame.sourceRect[3]) * 100}%`,
                maxWidth: "none",
              }}
            />
          </div>
        ) : null}

        <span
          className="world-actor-shadow"
          aria-hidden="true"
          style={{
            left: `${(character.position[0] / scene.size[0]) * 100}%`,
            top: `${(character.position[1] / scene.size[1]) * 100}%`,
            width: `${(64 / scene.size[0]) * 100}%`,
            height: `${(18 / scene.size[1]) * 100}%`,
            zIndex: Math.round(character.depth) - 1,
          }}
        />

        <div
          className={`world-actor${moving ? " is-moving" : ""}`}
          style={{ zIndex: Math.round(character.depth) }}
          aria-hidden="true"
        >
          <Sprite
            key={character.frameId}
            manifest={manifest}
            frameId={character.frameId}
            position={character.position}
            height={character.height}
            anchor={character.anchor}
            zIndex={0}
            stage={scene.size}
          />
        </div>

        {scene.hotspots.map((hotspot) => {
          const [x, y, width, height] = hotspot.rect;
          return (
            <button
              key={hotspot.id}
              type="button"
              data-hotspot={hotspot.id}
              className="world-hotspot"
              aria-label={hotspot.label}
              style={{
                left: `${(x / scene.size[0]) * 100}%`,
                top: `${(y / scene.size[1]) * 100}%`,
                width: `${(width / scene.size[0]) * 100}%`,
                height: `${(height / scene.size[1]) * 100}%`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                store.getState().requestMove(hotspot.approach, hotspot.id);
              }}
            >
              <span className="world-hotspot-label">{hotspot.label}</span>
            </button>
          );
        })}
      </div>
      {notice ? (
        <p className="world-scene-notice" role="status">
          {notice === "unreachable" ? t("world.unreachable") : notice}
        </p>
      ) : null}
      </section>

      {contentOverlay ? (
        <ContentPanel overlay={contentOverlay} bundle={bundle} onClose={closeOverlay} />
      ) : null}

      {overlay && (overlay.kind === "task" || overlay.kind === "repair") ? (
        <WorkbenchPanel
          bundle={bundle}
          quest={quest}
          mode={overlay.kind}
          onEvent={(event) => store.getState().dispatchQuest(event)}
          onOpenAssembly={() => store.getState().setOverlay({ kind: "assembly" })}
          onClose={closeOverlay}
        />
      ) : null}

      {overlay?.kind === "assembly" ? (
        <AssemblyPanel
          bundle={bundle}
          quest={quest}
          onEvent={(event) => store.getState().dispatchQuest(event)}
          onClose={closeOverlay}
        />
      ) : null}
    </>
  );
}
