import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { QuestEvent, QuestState } from "./quest";
import type { WorldBundle } from "../types";

type WorkbenchPanelProps = {
  bundle: WorldBundle;
  quest: QuestState;
  mode: "task" | "repair";
  onEvent(event: QuestEvent): void;
  onOpenAssembly(): void;
  onClose(): void;
};

/**
 * Workbench panel: task board before the modules are found, then the energy
 * cell repair schematic. Assembly lives in AssemblyPanel.
 */
export function WorkbenchPanel({
  bundle,
  quest,
  mode,
  onEvent,
  onOpenAssembly,
  onClose,
}: WorkbenchPanelProps) {
  const { t } = useTranslation();
  const { content } = bundle;
  const [selectedPort, setSelectedPort] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previousFocus.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const title =
    mode === "task"
      ? content.quest.title
      : quest.cellRepaired
        ? t("world.repairDone")
        : t("world.repairTitle");

  return (
    <div
      className="world-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-workbench-title"
        className="world-modal-card world-workbench-card"
      >
        <button
          ref={closeRef}
          type="button"
          className="world-modal-close"
          aria-label={t("world.close")}
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="world-workbench-title" className="world-modal-title">{title}</h2>

        {mode === "task" ? (
          <div className="world-modal-body">
            <p>{t("world.taskIntro")}</p>
            <ul className="world-module-list">
              {content.quest.modules.map((module) => (
                <li key={module.id} className={quest.collected.includes(module.id) ? "is-collected" : ""}>
                  <strong>{module.label}</strong>
                  <span>
                    {quest.collected.includes(module.id)
                      ? t("world.statusCollected")
                      : t("world.taskFindAt", { source: module.source })}
                  </span>
                </li>
              ))}
            </ul>
            <ol className="world-quest-steps">
              {content.quest.instructions.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
        ) : (
          <div className="world-modal-body">
            <div className="world-repair" aria-label={t("world.cellInterface")}>
              <svg viewBox="0 0 360 150" role="img" aria-label={t("world.cellInterface")}>
                <rect x="20" y="24" width="320" height="102" rx="16" fill="#202a2e" />
                <rect x="44" y="46" width="272" height="58" rx="10" fill="#2f3d42" stroke="#7c8d92" />
                <circle cx="88" cy="75" r="14" fill={quest.cellRepaired ? "#32c77b" : "#f08a1d"} />
                <rect x="124" y="62" width="72" height="26" rx="6" fill="#4a5a60" />
                <rect
                  x="214"
                  y="58"
                  width="42"
                  height="34"
                  rx="6"
                  fill={selectedPort || quest.cellRepaired ? "#f08a1d" : "#66777d"}
                  stroke={selectedPort ? "#fff" : "transparent"}
                  strokeWidth="3"
                  className="world-repair-port"
                  onClick={() => setSelectedPort(true)}
                  role="button"
                  aria-label={t("world.looseInterface")}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedPort(true);
                  }}
                />
                <path d="M256 75h34" stroke="#f08a1d" strokeWidth="5" strokeLinecap="round" />
                <path
                  d="M268 63l14 12-14 12"
                  stroke="#f08a1d"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {quest.cellRepaired ? (
              <>
                <p className="world-repair-status is-ok">{t("world.cellFixed")}</p>
                <button type="button" className="world-btn world-btn-primary" onClick={onOpenAssembly}>
                  {t("world.enterAssembly")}
                </button>
              </>
            ) : (
              <>
                <p>{t("world.repairHint")}</p>
                <button
                  type="button"
                  className="world-btn world-btn-primary"
                  disabled={!selectedPort}
                  onClick={() => onEvent({ type: "REPAIR_CELL" })}
                >
                  {t("world.repairCheck")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
