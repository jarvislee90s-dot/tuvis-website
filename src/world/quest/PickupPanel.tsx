import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleId, WorldBundle } from "../types";
import { FrameArt } from "./FrameArt";

type PickupPanelProps = {
  bundle: WorldBundle;
  moduleId: ModuleId;
  onClose(): void;
};

/**
 * Shown after the character picks up a floating part: big artwork, name,
 * English name, identity color, description and the code-editor analogy,
 * all sourced from content data.
 */
export function PickupPanel({ bundle, moduleId, onClose }: PickupPanelProps) {
  const { t } = useTranslation();
  const { content, scene } = bundle;
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const module = content.quest.modules.find((entry) => entry.id === moduleId);
  const assemblyModule = scene.assembly.modules.find((entry) => entry.id === moduleId);

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
        aria-labelledby="world-pickup-title"
        className="world-modal-card world-pickup-card"
        data-pickup-panel={moduleId}
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
        <p className="world-pickup-kicker" style={module?.color ? { color: module.color } : undefined}>
          {t("world.pickupTitle")}
        </p>
        <h2 id="world-pickup-title" className="world-modal-title">
          {module?.label ?? moduleId}
        </h2>
        {module?.english ? <p className="world-pickup-english">{module.english}</p> : null}

        {assemblyModule ? (
          <div className="world-pickup-art">
            <FrameArt bundle={bundle} frameId={assemblyModule.frame} alt={module?.label ?? moduleId} fit={82} />
          </div>
        ) : null}

        {module?.description ? <p className="world-pickup-desc">{module.description}</p> : null}
        {module?.analogy ? (
          <p className="world-pickup-analogy">
            {t("world.pickupAnalogyPrefix")}
            {module.analogy}
          </p>
        ) : null}

        <div className="world-assembly-actions">
          <button type="button" className="world-btn world-btn-primary" onClick={onClose}>
            {t("world.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
