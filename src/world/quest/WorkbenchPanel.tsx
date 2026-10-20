import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { WorldBundle } from "../types";

type WorkbenchPanelProps = {
  bundle: WorldBundle;
  onClose(): void;
};

/**
 * Workbench task board: lists the four components and where to find them
 * while the quest is still being gathered. Assembly lives in AssemblyPanel.
 */
export function WorkbenchPanel({ bundle, onClose }: WorkbenchPanelProps) {
  const { t } = useTranslation();
  const { content } = bundle;
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
        <h2 id="world-workbench-title" className="world-modal-title">{content.quest.title}</h2>

        <div className="world-modal-body">
          <p>{t("world.taskIntro")}</p>
          <ul className="world-module-list">
            {content.quest.modules.map((module) => (
              <li key={module.id}>
                <strong>{module.label}</strong>
                <span>{t("world.taskFindAt", { source: module.source })}</span>
              </li>
            ))}
          </ul>
          <ol className="world-quest-steps">
            {content.quest.instructions.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}
