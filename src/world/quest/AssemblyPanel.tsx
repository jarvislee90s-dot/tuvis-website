import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleId, Point, Rect, WorldBundle } from "../types";
import { assetUrl, preloadAssets } from "../assets/loadWorldData";
import type { QuestEvent, QuestState } from "./quest";
import { MODULE_IDS } from "./quest";

type AssemblyPanelProps = {
  bundle: WorldBundle;
  quest: QuestState;
  onEvent(event: QuestEvent): void;
  onClose(): void;
};

type DragState = {
  moduleId: ModuleId;
  center: Point;
  offset: Point;
};

const ASSEMBLY_FRAMES = ["gunBody", "gunEmitter", "gunSight", "gunCell", "gunComplete"];

type CropFrameProps = {
  bundle: WorldBundle;
  frameId: string;
  rect: Rect;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

/** Crop one frame into a scene-coordinate rectangle, expressed as percentages. */
function CropFrame({ bundle, frameId, rect, alt = "", className, style }: CropFrameProps) {
  const frame = bundle.manifest.frames[frameId];
  const asset = frame ? bundle.manifest.assets[frame.asset] : undefined;
  if (!frame || !asset) return null;
  const [x, y, width, height] = rect;
  const [sizeW, sizeH] = bundle.scene.size;
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: `${(x / sizeW) * 100}%`,
        top: `${(y / sizeH) * 100}%`,
        width: `${(width / sizeW) * 100}%`,
        height: `${(height / sizeH) * 100}%`,
        ...style,
      }}
    >
      <img
        src={assetUrl(asset.path)}
        alt={alt}
        draggable={false}
        style={{
          position: "absolute",
          width: `${(asset.width / frame.sourceRect[2]) * 100}%`,
          height: `${(asset.height / frame.sourceRect[3]) * 100}%`,
          left: `${(-frame.sourceRect[0] / frame.sourceRect[2]) * 100}%`,
          top: `${(-frame.sourceRect[1] / frame.sourceRect[3]) * 100}%`,
          maxWidth: "none",
        }}
      />
    </div>
  );
}

/**
 * Fixed three-quarter assembly close-up. Drag-and-drop and click-piece-then-
 * socket share one install check; wrong sockets and cancelled drags never
 * emit an event, so modules are never consumed by mistake.
 */
export function AssemblyPanel({ bundle, quest, onEvent, onClose }: AssemblyPanelProps) {
  const { t } = useTranslation();
  const { scene, content } = bundle;
  const [selected, setSelected] = useState<ModuleId | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const sawMoveRef = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const installed = quest.installed;
  const complete = MODULE_IDS.every((id) => installed.includes(id));

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previousFocus.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    preloadAssets(bundle, ASSEMBLY_FRAMES)
      .then(() => {
        if (!cancelled) setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [bundle, attempt]);

  const close = useCallback(() => {
    setDrag(null);
    setSelected(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onBlur = () => setDrag(null);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
    };
  }, [close]);

  const labelFor = (id: ModuleId) =>
    content.quest.modules.find((module) => module.id === id)?.label ?? id;

  const tryInstall = (moduleId: ModuleId, center: Point) => {
    const definition = scene.assembly.modules.find((module) => module.id === moduleId);
    if (!definition) return false;
    const distance = Math.hypot(
      center[0] - definition.socket[0],
      center[1] - definition.socket[1],
    );
    if (distance > definition.snapRadius) return false;
    onEvent({ type: "INSTALL", moduleId });
    setSelected(null);
    setNotice(null);
    return true;
  };

  const toScene = (clientX: number, clientY: number): Point | null => {
    const element = stageRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return [
      ((clientX - rect.left) / rect.width) * scene.assembly.size[0],
      ((clientY - rect.top) / rect.height) * scene.assembly.size[1],
    ];
  };

  const pieceRect = (id: ModuleId): Rect => {
    const definition = scene.assembly.modules.find((module) => module.id === id);
    return definition?.rect ?? [0, 0, 1, 1];
  };

  const defaultCenter = (id: ModuleId): Point => {
    const [x, y, width, height] = pieceRect(id);
    return [x + width / 2, y + height / 2];
  };

  const onPiecePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: ModuleId) => {
    if (event.button !== 0 || installed.includes(id)) return;
    const point = toScene(event.clientX, event.clientY);
    const center = defaultCenter(id);
    const origin = point ?? center;
    sawMoveRef.current = false;
    setSelected(id);
    setDrag({
      moduleId: id,
      center: origin,
      offset: [center[0] - origin[0], center[1] - origin[1]],
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPiecePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    sawMoveRef.current = true;
    const point = toScene(event.clientX, event.clientY);
    if (!point) return;
    setDrag({
      ...drag,
      center: [point[0] + drag.offset[0], point[1] + drag.offset[1]],
    });
  };

  const onPiecePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    if (!sawMoveRef.current) {
      // A plain click selects the piece; installation waits for a socket click.
      setDrag(null);
      return;
    }
    const point = toScene(event.clientX, event.clientY);
    const center: Point = point
      ? [point[0] + drag.offset[0], point[1] + drag.offset[1]]
      : drag.center;
    const installedNow = tryInstall(drag.moduleId, center);
    setDrag(null);
    if (!installedNow) setNotice(t("world.assemblyWrongSocket"));
  };

  const onSocketClick = (id: ModuleId) => {
    if (installed.includes(id) || selected !== id) {
      if (selected !== id) setNotice(t("world.assemblyMismatch"));
      return;
    }
    const definition = scene.assembly.modules.find((module) => module.id === id);
    if (definition) tryInstall(id, definition.socket);
  };

  const [stageW, stageH] = scene.assembly.size;

  return (
    <div className="world-modal" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-assembly-title"
        className="world-modal-card world-assembly-card"
      >
        <button
          ref={closeRef}
          type="button"
          className="world-modal-close"
          aria-label={t("world.close")}
          onClick={close}
        >
          ×
        </button>
        <h2 id="world-assembly-title" className="world-modal-title">
          {complete ? t("world.assemblyComplete") : t("world.assemblyTitle")}
        </h2>
        <p className="world-modal-body world-assembly-help">
          {complete ? t("world.assemblyCompleteHint") : t("world.assemblyHelp")}
        </p>

        {loadState === "loading" ? <p aria-busy="true">{t("world.assemblyLoading")}</p> : null}
        {loadState === "error" ? (
          <div role="alert" className="world-assembly-error">
            <p>{t("world.assemblyError")}</p>
            <button type="button" className="world-btn world-btn-primary" onClick={() => setAttempt((n) => n + 1)}>
              {t("world.retry")}
            </button>
          </div>
        ) : null}

        {loadState === "ready" ? (
          <>
            <div
              ref={stageRef}
              className={`world-assembly-stage${selected !== null ? " has-selection" : ""}`}
              style={{ aspectRatio: `${stageW} / ${stageH}` }}
              data-assembly-stage
            >
              {complete ? (
                <CropFrame
                  bundle={bundle}
                  frameId={scene.assembly.complete.frame}
                  rect={scene.assembly.complete.rect}
                  alt="Bug Buster 成品"
                />
              ) : (
                <>
                  <CropFrame
                    bundle={bundle}
                    frameId={scene.assembly.body.frame}
                    rect={scene.assembly.body.rect}
                    alt="Bug Buster 主体"
                  />

                  {scene.assembly.modules.map((module) => {
                    const installedNow = installed.includes(module.id);
                    if (!installedNow) return null;
                    const [width, height] = [module.rect[2], module.rect[3]];
                    return (
                      <CropFrame
                        key={`installed-${module.id}`}
                        bundle={bundle}
                        frameId={module.frame}
                        rect={[
                          module.socket[0] - width / 2,
                          module.socket[1] - height / 2,
                          width,
                          height,
                        ]}
                        alt={`${labelFor(module.id)}（已安装）`}
                        className="world-assembly-installed"
                      />
                    );
                  })}

                  {scene.assembly.modules.map((module) => {
                    if (installed.includes(module.id)) return null;
                    const [x, y, width, height] = module.rect;
                    const center = drag?.moduleId === module.id ? drag.center : [x + width / 2, y + height / 2];
                    return (
                      <button
                        key={module.id}
                        type="button"
                        className={`world-assembly-piece ${selected === module.id ? "is-selected" : ""} ${drag?.moduleId === module.id ? "is-dragging" : ""}`}
                        aria-label={`${t("world.assemblyPiece")}：${labelFor(module.id)}`}
                        aria-pressed={selected === module.id}
                        style={{
                          left: `${((center[0] - width / 2) / stageW) * 100}%`,
                          top: `${((center[1] - height / 2) / stageH) * 100}%`,
                          width: `${(width / stageW) * 100}%`,
                          height: `${(height / stageH) * 100}%`,
                        }}
                        onPointerDown={(event) => onPiecePointerDown(event, module.id)}
                        onPointerMove={onPiecePointerMove}
                        onPointerUp={onPiecePointerUp}
                        onPointerCancel={() => setDrag(null)}
                        onClick={() => {
                          if (sawMoveRef.current) {
                            sawMoveRef.current = false;
                            return;
                          }
                          setSelected(module.id);
                        }}
                      >
                        <img
                          src={assetUrl(bundle.manifest.assets[bundle.manifest.frames[module.frame].asset].path)}
                          alt=""
                          draggable={false}
                          style={cropStyle(bundle, module.frame)}
                        />
                      </button>
                    );
                  })}

                  {scene.assembly.modules.map((module) => (
                    <button
                      key={`socket-${module.id}`}
                      type="button"
                      className="world-assembly-socket"
                      aria-label={`${t("world.assemblySocket")}：${labelFor(module.id)}`}
                      style={{
                        left: `${(module.socket[0] / stageW) * 100}%`,
                        top: `${(module.socket[1] / stageH) * 100}%`,
                      }}
                      onClick={() => onSocketClick(module.id)}
                    />
                  ))}
                </>
              )}
            </div>
            {notice ? <p className="world-scene-notice" role="status">{notice}</p> : null}
            <div className="world-assembly-actions">
              <button type="button" className="world-btn world-btn-primary" onClick={close}>
                {t("world.assemblyClose")}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function cropStyle(bundle: WorldBundle, frameId: string): CSSProperties {
  const frame = bundle.manifest.frames[frameId];
  const asset = bundle.manifest.assets[frame.asset];
  return {
    position: "absolute",
    width: `${(asset.width / frame.sourceRect[2]) * 100}%`,
    height: `${(asset.height / frame.sourceRect[3]) * 100}%`,
    left: `${(-frame.sourceRect[0] / frame.sourceRect[2]) * 100}%`,
    top: `${(-frame.sourceRect[1] / frame.sourceRect[3]) * 100}%`,
    maxWidth: "none",
  };
}
