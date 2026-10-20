import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { WorldBundle } from "../types";
import { FrameArt } from "./FrameArt";

type WorkbenchGunPanelProps = {
  bundle: WorldBundle;
  onTry(): void;
  onClose(): void;
};

/** Shown when clicking the desk after assembly: the finished Bug Buster on
 * the workbench, with the try-it action that plays the fire animation. */
export function WorkbenchGunPanel({ bundle, onTry, onClose }: WorkbenchGunPanelProps) {
  const { t } = useTranslation();
  const { content, scene } = bundle;
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const gun = content.equipment.find((entry) => entry.id === "bug-buster");

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
        aria-labelledby="world-workbench-gun-title"
        className="world-modal-card world-pickup-card"
        data-workbench-gun-panel
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
        <p className="world-pickup-kicker" style={gun?.color ? { color: gun.color } : undefined}>
          {t("world.workbenchGunTitle")}
        </p>
        <h2 id="world-workbench-gun-title" className="world-modal-title">
          {gun?.name ?? content.quest.title}
        </h2>
        <div className="world-pickup-art">
          <FrameArt bundle={bundle} frameId={scene.workbenchDisplay.frame} alt={gun?.name ?? ""} fit={92} />
        </div>
        <p className="world-pickup-desc">{t("world.workbenchGunHint")}</p>
        <div className="world-assembly-actions">
          <button
            type="button"
            className="world-btn world-btn-primary"
            data-try-buster-confirm
            onClick={onTry}
          >
            {t("world.tryBugBuster")}
          </button>
        </div>
      </div>
    </div>
  );
}
