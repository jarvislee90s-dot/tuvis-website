import { useEffect, useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import type { ContentOverlay, Hotspot, Point, SceneDefinition, WorldBundle, WorldManifest } from "../types";
import { assetUrl } from "../assets/loadWorldData";
import { ContentPanel } from "../content/ContentPanel";
import { AssemblyPanel } from "../quest/AssemblyPanel";
import { FrameArt } from "../quest/FrameArt";
import { PickupPanel } from "../quest/PickupPanel";
import { QuestBar } from "../quest/QuestBar";
import { WorkbenchPanel } from "../quest/WorkbenchPanel";
import { toScenePoint } from "./geometry";
import { resolveHotspot } from "./interaction";
import { ACTION_DURATIONS, actionAnim, idleAnim, walkAnim } from "./petFrames";
import { Sprite } from "./Sprite";
import { useRuntimeStore, type Pose } from "./runtimeStore";
import { useSceneLoop } from "./useSceneLoop";
import { TuvisSprite } from "./TuvisSprite";

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

/** Hotspots whose floating part is still waiting to be collected. */
function pendingPickups(bundle: WorldBundle, collected: readonly string[]): Hotspot[] {
  return bundle.scene.hotspots.filter(
    (hotspot) =>
      hotspot.moduleId !== undefined &&
      !collected.includes(hotspot.moduleId) &&
      (hotspot.kind === "equipment" || hotspot.kind === "world"),
  );
}

export function SceneView({ bundle }: SceneViewProps) {
  const { scene, manifest, content } = bundle;
  const { t } = useTranslation();
  const store = useRuntimeStore();
  useSceneLoop(store, scene);

  const motion = useStore(store, (state) => state.motion);
  const pose = useStore(store, (state) => state.pose);
  const action = useStore(store, (state) => state.action);
  const notice = useStore(store, (state) => state.notice);
  const quest = useStore(store, (state) => state.quest);
  const overlay = useStore(store, (state) => state.overlay);
  const pendingArrival = useStore(store, (state) => state.pendingArrival);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendingArrival) return;
    const current = store.getState();
    if (pendingArrival.hotspotId) {
      const result = resolveHotspot(pendingArrival.hotspotId, bundle, current.quest, {
        pickup: pendingArrival.pickup,
      });
      if (result.questEvent) current.dispatchQuest(result.questEvent);
      if (result.action) current.triggerAction(result.action);
      if (result.pose) current.setPose(result.pose);
      if (result.message) current.setNotice(result.message);
      if (result.overlay) current.setOverlay(result.overlay);
    }
    current.clearArrival();
  }, [pendingArrival, bundle, store]);

  // One-shot action animations return to idle/walk on their own schedule.
  useEffect(() => {
    if (!action) return;
    const timer = window.setTimeout(
      () => store.getState().clearAction(),
      ACTION_DURATIONS[action.kind],
    );
    return () => window.clearTimeout(timer);
  }, [action, store]);

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
  const closeOverlay = () => {
    const state = store.getState();
    // Celebrating behind the fullscreen modal is invisible; fire it when the
    // finished assembly panel closes instead.
    if (
      state.overlay?.kind === "assembly" &&
      ["sight", "cell", "emitter"].every((id) => state.quest.installed.includes(id as "sight"))
    ) {
      state.triggerAction("celebrate");
    }
    state.setOverlay(null);
  };

  const labelFor = (id: string) =>
    content.quest.modules.find((module) => module.id === id)?.label ?? id;

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

  // Clicking the character itself plays a jump instead of walking.
  const onActorActivate = (event: { stopPropagation(): void }) => {
    event.stopPropagation();
    const state = store.getState();
    if (state.action || state.overlay !== null) return;
    state.setPose(state.motion.direction);
    state.triggerAction("jump");
  };

  // Walk/idle strips per direction; actions are SE-only (SW mirrors).
  const oldPose = pose === "sit" || pose === "coffee" || pose === "display";
  const showOldPose = oldPose && !action;
  const actionDef = action ? actionAnim(action.kind) : null;
  const animDef = actionDef
    ? motion.direction === "sw"
      ? { ...actionDef, flip: true }
      : actionDef
    : moving
      ? walkAnim(motion.direction)
      : idleAnim(motion.direction);
  const animKey = action
    ? `${action.kind}-${action.id}`
    : `${moving ? "walk" : "idle"}-${motion.direction}`;

  const pickups = pendingPickups(bundle, quest.collected);

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
          {showOldPose ? (
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
          ) : (
            <TuvisSprite
              key={animKey}
              def={animDef}
              position={character.position}
              depth={0}
              stage={scene.size}
              onClick={onActorActivate}
            />
          )}
        </div>

        {pickups.map((hotspot) => {
          const [x, y, width] = hotspot.rect;
          const centerX = x + width / 2;
          const boxW = 220;
          const boxH = 150;
          const moduleDef = scene.assembly.modules.find((module) => module.id === hotspot.moduleId);
          if (!moduleDef || !hotspot.moduleId) return null;
          return (
            <button
              key={`pickup-${hotspot.id}`}
              type="button"
              className="world-pickup-part"
              data-pickup-part={hotspot.moduleId}
              aria-label={t("world.pickupHint", { label: labelFor(hotspot.moduleId) })}
              style={{
                left: `${((centerX - boxW / 2) / scene.size[0]) * 100}%`,
                // Hotspots near the stage top (posters) would push the box
                // outside the stage where it gets clipped and unclickable.
                top: `${(Math.max(y - boxH - 16, 8) / scene.size[1]) * 100}%`,
                width: `${(boxW / scene.size[0]) * 100}%`,
                height: `${(boxH / scene.size[1]) * 100}%`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                store.getState().requestMove(hotspot.approach, hotspot.id, true);
              }}
            >
              <FrameArt bundle={bundle} frameId={moduleDef.frame} alt="" fit={88} />
            </button>
          );
        })}

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

      {overlay?.kind === "pickup" ? (
        <PickupPanel bundle={bundle} moduleId={overlay.moduleId} onClose={closeOverlay} />
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
