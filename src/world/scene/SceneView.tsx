import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import type { ContentOverlay, Hotspot, Point, SceneDefinition, WorldBundle, WorldManifest } from "../types";
import { assetUrl } from "../assets/loadWorldData";
import { ContentPanel } from "../content/ContentPanel";
import { AssemblyPanel } from "../quest/AssemblyPanel";
import { FrameArt } from "../quest/FrameArt";
import { PickupPanel } from "../quest/PickupPanel";
import { QuestCard } from "../quest/QuestCard";
import { WorkbenchGunPanel } from "../quest/WorkbenchGunPanel";
import { WorkbenchPanel } from "../quest/WorkbenchPanel";
import { MODULE_IDS } from "../quest/quest";
import { toScenePoint } from "./geometry";
import { resolveHotspot } from "./interaction";
import { ACTION_DURATIONS, actionAnim, idleAnim, walkAnim, type ActionAnim } from "./petFrames";
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

/** Hotspots whose floating part is still waiting to be collected. Concealed
 * modules (pickupHidden) have no floating part — the arrival opens them. */
function pendingPickups(bundle: WorldBundle, collected: readonly string[]): Hotspot[] {
  return bundle.scene.hotspots.filter(
    (hotspot) =>
      hotspot.moduleId !== undefined &&
      !hotspot.pickupHidden &&
      !collected.includes(hotspot.moduleId) &&
      (hotspot.kind === "equipment" ||
        hotspot.kind === "world" ||
        hotspot.kind === "stories" ||
        hotspot.kind === "rack"),
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
    // "Try the Bug Buster" arrivals only play the fire animation.
    if (pendingArrival.tryFire) {
      current.clearArrival();
      current.triggerAction("fire");
      current.dispatchQuest({ type: "TRY_WEAPON" });
      return;
    }
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
    if (state.overlay?.kind === "assembly") {
      const done = ["sight", "cell", "emitter"].every((id) =>
        state.quest.installed.includes(id as "sight"),
      );
      if (done) {
        // Celebrating behind the fullscreen modal is invisible; celebrate when
        // the finished assembly panel closes. The quest card now prompts the
        // test fire; the completion line appears after the first shot.
        state.triggerAction("celebrate");
      }
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

  // Clicking the character opens a small emote menu instead of walking.
  const [emoteMenu, setEmoteMenu] = useState(false);
  const onActorActivate = (event: { stopPropagation(): void }) => {
    event.stopPropagation();
    const state = store.getState();
    if (state.action || state.overlay !== null) return;
    state.setPose(state.motion.direction);
    state.cancelMovement();
    setEmoteMenu(true);
  };

  const playEmote = (kind: ActionAnim) => {
    setEmoteMenu(false);
    const state = store.getState();
    state.triggerAction(kind);
    if (kind === "fire") state.dispatchQuest({ type: "TRY_WEAPON" });
  };
  const assembled = quest.installed.length === MODULE_IDS.length;
  const emoteOptions: Array<{ kind: ActionAnim; label: string }> = [
    { kind: "jump", label: t("world.emoteJump") },
    { kind: "celebrate", label: t("world.emoteCelebrate") },
  ];
  if (assembled) emoteOptions.push({ kind: "fire", label: t("world.emoteFire") });

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

  // Any walk dismisses the emote menu.
  useEffect(() => {
    if (moving) setEmoteMenu(false);
  }, [moving]);

  const pickups = pendingPickups(bundle, quest.collected);

  return (
    <>
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

        {quest.installed.length === MODULE_IDS.length && action?.kind !== "fire"
          ? (() => {
              const wbFrame = manifest.frames[scene.workbenchDisplay.frame];
              const wbAsset = wbFrame ? manifest.assets[wbFrame.asset] : undefined;
              if (!wbFrame || !wbAsset) return null;
              const [bx, by, bw, bh] = scene.workbenchDisplay.rect;
              return (
                <div
                  className="world-rack-display"
                  data-workbench-display
                  style={{
                    left: `${(bx / scene.size[0]) * 100}%`,
                    top: `${(by / scene.size[1]) * 100}%`,
                    width: `${(bw / scene.size[0]) * 100}%`,
                    height: `${(bh / scene.size[1]) * 100}%`,
                  }}
                >
                  <img
                    src={assetUrl(wbAsset.path)}
                    alt="Bug Buster"
                    style={{
                      position: "absolute",
                      width: `${(wbAsset.width / wbFrame.sourceRect[2]) * 100}%`,
                      height: `${(wbAsset.height / wbFrame.sourceRect[3]) * 100}%`,
                      left: `${(-wbFrame.sourceRect[0] / wbFrame.sourceRect[2]) * 100}%`,
                      top: `${(-wbFrame.sourceRect[1] / wbFrame.sourceRect[3]) * 100}%`,
                      maxWidth: "none",
                    }}
                  />
                </div>
              );
            })()
          : null}

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
            />
          )}
        </div>

        <div
          data-actor-hit
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${(character.position[0] / scene.size[0]) * 100}%`,
            top: `${(character.position[1] / scene.size[1]) * 100}%`,
            width: `${(70 / scene.size[0]) * 100}%`,
            height: `${(170 / scene.size[1]) * 100}%`,
            translate: "-50% -97%",
            zIndex: 1100,
            cursor: "pointer",
          }}
          onClick={onActorActivate}
        />

        {emoteMenu && !action ? (
          <div
            className="world-emote-menu"
            style={{
              left: `${(character.position[0] / scene.size[0]) * 100}%`,
              top: `${((character.position[1] - animDef.displayHeight - 6) / scene.size[1]) * 100}%`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {emoteOptions.map((option) => (
              <button key={option.kind} type="button" onClick={() => playEmote(option.kind)}>
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {pickups.map((hotspot) => {
          const [x, y, width, height] = hotspot.rect;
          // The body is the pre-seated grid piece, not an assembly module —
          // its artwork lives on scene.assembly.body.
          const moduleFrameId =
            hotspot.moduleId === "body"
              ? scene.assembly.body.frame
              : scene.assembly.modules.find((module) => module.id === hotspot.moduleId)?.frame;
          if (!moduleFrameId || !hotspot.moduleId) return null;
          const boxW = 77;
          const boxH = 53;
          // Explicit pickupAnchor wins; otherwise sit the part just above the
          // hotspot's bottom edge (where the object body actually is).
          const centerX = hotspot.pickupAnchor ? hotspot.pickupAnchor[0] : x + width / 2;
          const centerY = hotspot.pickupAnchor
            ? hotspot.pickupAnchor[1]
            : y + height - 24 - boxH / 2;
          return (
            <button
              key={`pickup-${hotspot.id}`}
              type="button"
              className="world-pickup-part"
              data-pickup-part={hotspot.moduleId}
              aria-label={t("world.pickupHint", { label: labelFor(hotspot.moduleId) })}
              style={{
                left: `${((centerX - boxW / 2) / scene.size[0]) * 100}%`,
                top: `${((centerY - boxH / 2) / scene.size[1]) * 100}%`,
                width: `${(boxW / scene.size[0]) * 100}%`,
                height: `${(boxH / scene.size[1]) * 100}%`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                store.getState().requestMove(hotspot.approach, hotspot.id, true);
              }}
            >
              <FrameArt bundle={bundle} frameId={moduleFrameId} alt="" fit={88} />
            </button>
          );
        })}

        {(() => {
          const workbench = scene.hotspots.find((h) => h.kind === "workbench");
          if (!workbench || quest.installed.length !== MODULE_IDS.length) return null;
          const [wx, wy, ww] = workbench.rect;
          return (
            <button
              type="button"
              className="world-try-button"
              data-try-buster
              style={{
                left: `${((wx + ww / 2 - 70) / scene.size[0]) * 100}%`,
                top: `${((wy - 26) / scene.size[1]) * 100}%`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                store.getState().requestMove(scene.trySpot, workbench.id, false, true);
              }}
            >
              {t("world.tryBugBuster")}
            </button>
          );
        })()}

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

        <QuestCard bundle={bundle} quest={quest} />
      </div>
      {notice ? (
        <p className={`world-scene-notice${notice === "questDone" ? " is-success" : ""}`} role="status">
          {notice === "unreachable"
            ? t("world.unreachable")
            : notice === "questDone"
              ? t("world.questDone")
              : notice}
        </p>
      ) : null}
      </section>

      {contentOverlay ? (
        <ContentPanel overlay={contentOverlay} bundle={bundle} onClose={closeOverlay} />
      ) : null}

      {overlay?.kind === "pickup" ? (
        <PickupPanel bundle={bundle} moduleId={overlay.moduleId} onClose={closeOverlay} />
      ) : null}

      {overlay?.kind === "workbenchGun" ? (
        <WorkbenchGunPanel
          bundle={bundle}
          onTry={() => {
            const s = store.getState();
            s.setOverlay(null);
            s.triggerAction("fire");
            s.dispatchQuest({ type: "TRY_WEAPON" });
          }}
          onClose={closeOverlay}
        />
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
