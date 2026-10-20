import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleId, WorldBundle } from "../types";
import { preloadAssets } from "../assets/loadWorldData";
import { FrameArt } from "./FrameArt";
import type { QuestEvent, QuestState } from "./quest";
import { MODULE_IDS } from "./quest";

type AssemblyPanelProps = {
  bundle: WorldBundle;
  quest: QuestState;
  onEvent(event: QuestEvent): void;
  onClose(): void;
};

type GhostState = {
  moduleId: ModuleId;
  x: number;
  y: number;
};

const ASSEMBLY_FRAMES = ["gunBody", "gunEmitter", "gunSight", "gunCell", "gunComplete"];
const CONVERGE_MS = 650;
const FLASH_MS = 480;

type Phase = "build" | "converge" | "flash" | "reveal";

/**
 * Nine-grid assembly close-up: left 3x3 grid with fixed cells for the body
 * and the three modules, right tray of collected parts. Drag-and-drop and
 * click-part-then-cell share one rule — a part only locks into its own cell,
 * which turns green; wrong targets never consume the part and stay silent.
 * When all four cells are filled the success sequence plays: parts converge
 * to the center, a flash, then the finished Bug Buster with its description
 * and a back-to-workshop button.
 */
export function AssemblyPanel({ bundle, quest, onEvent, onClose }: AssemblyPanelProps) {
  const { t } = useTranslation();
  const { scene, content } = bundle;
  const grid = scene.assembly.grid;
  const [selected, setSelected] = useState<ModuleId | null>(null);
  const [ghost, setGhost] = useState<GhostState | null>(null);
  const [phase, setPhase] = useState<Phase>("build");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sawPointerDownRef = useRef(false);
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
    setGhost(null);
    setSelected(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onBlur = () => setGhost(null);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
    };
  }, [close]);

  // Success sequence: converge -> flash -> reveal. Each step schedules the
  // next from its own effect so a phase change can never clear the pending
  // transition of a later step.
  useEffect(() => {
    if (phase !== "build" || !complete || loadState !== "ready") return;
    const timer = window.setTimeout(() => setPhase("converge"), 60);
    return () => window.clearTimeout(timer);
  }, [phase, complete, loadState]);
  useEffect(() => {
    if (phase !== "converge") return;
    const timer = window.setTimeout(() => setPhase("flash"), CONVERGE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== "flash") return;
    const timer = window.setTimeout(() => setPhase("reveal"), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const labelFor = (id: ModuleId) =>
    content.quest.modules.find((module) => module.id === id)?.label ?? id;

  const cellKeyOf = (id: "body" | ModuleId) => {
    const cell = grid.cells[id];
    return cell ? `${cell[0]}-${cell[1]}` : null;
  };

  const cellAt = (clientX: number, clientY: number): string | null => {
    const element = gridRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * grid.cols);
    const row = Math.floor(((clientY - rect.top) / rect.height) * grid.rows);
    if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return null;
    return `${row}-${col}`;
  };

  const tryInstall = (moduleId: ModuleId, key: string | null) => {
    if (!key || key !== cellKeyOf(moduleId)) return false;
    if (installed.includes(moduleId)) return false;
    onEvent({ type: "INSTALL", moduleId });
    setSelected(null);
    return true;
  };

  const trayIds = MODULE_IDS.filter((id) => quest.collected.includes(id) && !installed.includes(id));

  const onPiecePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: ModuleId) => {
    if (event.button !== 0 || phase !== "build") return;
    const layout = layoutRef.current;
    if (!layout) return;
    const rect = layout.getBoundingClientRect();
    sawPointerDownRef.current = true;
    setSelected(id);
    setGhost({ moduleId: id, x: event.clientX - rect.left, y: event.clientY - rect.top });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPiecePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!ghost) return;
    const layout = layoutRef.current;
    if (!layout) return;
    const rect = layout.getBoundingClientRect();
    setGhost({ ...ghost, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const onPiecePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!ghost) return;
    const moduleId = ghost.moduleId;
    setGhost(null);
    sawPointerDownRef.current = false;
    tryInstall(moduleId, cellAt(event.clientX, event.clientY));
  };

  // Keyboard activation (Enter/Space) fires only click, never pointer events,
  // so it must be able to select a piece on its own.
  const onPieceClick = (id: ModuleId) => {
    if (phase !== "build") return;
    if (sawPointerDownRef.current) {
      sawPointerDownRef.current = false;
      return;
    }
    setSelected(id);
  };

  const gun = content.equipment.find((entry) => entry.id === "bug-buster");

  const cellClass = (key: string | null) => {
    if (!key) return "world-assembly-cell is-plain";
    if (key === cellKeyOf("body")) return "world-assembly-cell is-installed is-body";
    const owner = MODULE_IDS.find((id) => cellKeyOf(id) === key);
    if (!owner) return "world-assembly-cell is-plain";
    return installed.includes(owner)
      ? "world-assembly-cell is-installed"
      : "world-assembly-cell is-target";
  };

  const renderCellContent = (key: string) => {
    if (key === cellKeyOf("body")) {
      return <FrameArt bundle={bundle} frameId={scene.assembly.body.frame} alt={t("world.assemblyBody")} />;
    }
    const owner = MODULE_IDS.find((id) => cellKeyOf(id) === key);
    if (!owner) return null;
    if (installed.includes(owner)) {
      const definition = scene.assembly.modules.find((module) => module.id === owner);
      if (!definition) return null;
      return <FrameArt bundle={bundle} frameId={definition.frame} alt={`${labelFor(owner)}（已安装）`} />;
    }
    return <span className="world-assembly-cell-label">{labelFor(owner)}</span>;
  };

  const cells: Array<{ key: string; row: number; col: number }> = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      cells.push({ key: `${row}-${col}`, row, col });
    }
  }

  const convergeOffset = (id: "body" | ModuleId): CSSProperties => {
    const cell = grid.cells[id];
    if (!cell) return {};
    const [row, col] = cell;
    const x = ((col + 0.5) / grid.cols) * 100;
    const y = ((row + 0.5) / grid.rows) * 100;
    return { ["--cx" as string]: `${(50 - x) * grid.cols}%`, ["--cy" as string]: `${(50 - y) * grid.rows}%` };
  };

  return (
    <div className="world-modal" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <div
        ref={cardRef}
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

        {loadState === "ready" && phase !== "reveal" ? (
          <div ref={layoutRef} className="world-assembly-layout" data-assembly-stage>
            <div
              ref={gridRef}
              className={`world-assembly-grid${phase === "converge" || phase === "flash" ? " is-converging" : ""}`}
              style={{ aspectRatio: "1" }}
              data-assembly-grid
            >
              {cells.map(({ key }) => {
                const bodyKey = cellKeyOf("body");
                const owner = MODULE_IDS.find((id) => cellKeyOf(id) === key);
                const converging = phase === "converge" || phase === "flash";
                const style =
                  converging && key === bodyKey
                    ? convergeOffset("body")
                    : converging && owner
                      ? convergeOffset(owner)
                      : undefined;
                return (
                  <div key={key} className={cellClass(key)} data-assembly-cell={key} style={style}>
                    {renderCellContent(key)}
                    {owner && !installed.includes(owner) ? (
                      <button
                        type="button"
                        className="world-assembly-cell-hit"
                        aria-label={`${t("world.assemblySocket")}：${labelFor(owner)}`}
                        data-assembly-socket={owner}
                        disabled={!selected || selected !== owner || phase !== "build"}
                        onClick={() => tryInstall(owner, key)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="world-assembly-tray" data-assembly-tray>
              <p className="world-assembly-tray-title">{t("world.assemblyTray")}</p>
              {trayIds.length === 0 ? (
                <p className="world-assembly-tray-empty">{t("world.assemblyTrayEmpty")}</p>
              ) : (
                trayIds.map((id) => {
                  const definition = scene.assembly.modules.find((module) => module.id === id);
                  if (!definition) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`world-assembly-piece is-tray${selected === id ? " is-selected" : ""}${ghost?.moduleId === id ? " is-dragging" : ""}`}
                      aria-label={`${t("world.assemblyPiece")}：${labelFor(id)}`}
                      aria-pressed={selected === id}
                      data-assembly-piece={id}
                      onPointerDown={(event) => onPiecePointerDown(event, id)}
                      onPointerMove={onPiecePointerMove}
                      onPointerUp={onPiecePointerUp}
                      onPointerCancel={() => {
                        setGhost(null);
                        sawPointerDownRef.current = false;
                      }}
                      onClick={() => onPieceClick(id)}
                    >
                      <FrameArt bundle={bundle} frameId={definition.frame} alt="" />
                      <span className="world-assembly-piece-label">{labelFor(id)}</span>
                    </button>
                  );
                })
              )}
            </div>

            {ghost ? (
              <div className="world-assembly-ghost" style={{ left: ghost.x, top: ghost.y }}>
                <FrameArt bundle={bundle} frameId={scene.assembly.modules.find((m) => m.id === ghost.moduleId)?.frame ?? ""} alt="" fit={100} />
              </div>
            ) : null}

            {phase === "flash" ? <div className="world-assembly-flash" /> : null}
          </div>
        ) : null}

        {loadState === "ready" && phase === "reveal" ? (
          <div className="world-assembly-reveal" data-assembly-reveal>
            <div className="world-assembly-reveal-art">
              <FrameArt
                bundle={bundle}
                frameId={scene.assembly.complete.frame}
                alt={gun?.name ?? content.quest.title}
                fit={100}
              />
            </div>
            <div className="world-assembly-reveal-info">
              <p className="world-pickup-kicker" style={gun?.color ? { color: gun.color } : undefined}>
                {t("world.assemblyComplete")}
              </p>
              <h3 className="world-assembly-reveal-name">
                {gun?.name ?? content.quest.title}
                {gun?.english ? <span> {gun.english}</span> : null}
              </h3>
              {gun?.description ? <p className="world-pickup-desc">{gun.description}</p> : null}
              {gun?.analogy ? <p className="world-pickup-analogy">{gun.analogy}</p> : null}
              <button type="button" className="world-btn world-btn-primary" onClick={close}>
                {t("world.assemblyClose")}
              </button>
            </div>
          </div>
        ) : null}

        {loadState === "ready" && phase !== "reveal" ? (
          <div className="world-assembly-actions">
            <button type="button" className="world-btn world-btn-primary" onClick={close}>
              {t("world.assemblyClose")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
