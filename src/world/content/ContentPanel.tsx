import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ContentOverlay, WorldContentBundle } from "../types";
import { assetUrl } from "../assets/loadWorldData";

type ContentPanelProps = {
  overlay: ContentOverlay | null;
  bundle: WorldContentBundle;
  onClose(): void;
};

/**
 * Read-only content dialog shared by the landing page and the workshop.
 * It never imports quest/assembly modules.
 */
export function ContentPanel({ overlay, bundle, onClose }: ContentPanelProps) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!overlay) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previousFocus.current?.focus();
  }, [overlay]);

  useEffect(() => {
    if (!overlay) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay, onClose]);

  if (!overlay) return null;

  const { content } = bundle;
  const equipment = "id" in overlay && overlay.kind === "equipment"
    ? content.equipment.find((item) => item.id === overlay.id)
    : undefined;
  const worldEntry = overlay.kind === "world"
    ? content.world.find((item) => item.id === overlay.id)
    : undefined;
  const story = overlay.kind === "stories"
    ? content.stories.find((item) => item.id === overlay.id)
    : undefined;

  let title = "";
  let body: ReactNode = null;

  if (overlay.kind === "equipment") {
    title = equipment ? `${equipment.name} · ${equipment.english}` : "装备图鉴";
    body = equipment ? (
      <div className="world-panel-stack">
        <span className="world-swatch" style={{ background: equipment.color }} />
        <p>{equipment.description}</p>
        <p className="world-panel-note">{equipment.analogy}</p>
      </div>
    ) : (
      <ul className="world-panel-list">
        {content.equipment.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
    );
  } else if (overlay.kind === "world") {
    title = worldEntry?.title ?? content.world[0]?.title ?? "";
    body = worldEntry ? (
      <div className="world-panel-stack">
        {bundle.manifest.assets[worldEntry.asset] ? (
          <img
            className="world-panel-image"
            src={assetUrl(bundle.manifest.assets[worldEntry.asset].path)}
            alt={worldEntry.title}
          />
        ) : null}
        <p>{worldEntry.text}</p>
      </div>
    ) : (
      <ul className="world-panel-list">
        {content.world.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.title}</strong>
            <span>{entry.text}</span>
          </li>
        ))}
      </ul>
    );
  } else if (overlay.kind === "stories") {
    title = story?.title ?? "故事档案";
    body = story ? (
      <div className="world-panel-stack">
        <span className="world-status-chip">{story.status}</span>
        <p>{story.summary}</p>
      </div>
    ) : (
      <ul className="world-panel-list">
        {content.stories.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.summary}</span>
          </li>
        ))}
      </ul>
    );
  } else if (overlay.kind === "door") {
    const door = content.doors.find((item) => item.id === overlay.id);
    title = door?.title ?? "门后";
    body = door ? <p>{door.text}</p> : (
      <ul className="world-panel-list">
        {content.doors.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    );
  } else {
    title = content.ui.help;
    body = (
      <ul className="world-panel-list">
        {content.ui.helpLines.map((line) => <li key={line}>{line}</li>)}
      </ul>
    );
  }

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
        aria-labelledby="world-panel-title"
        className="world-modal-card"
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
        <h2 id="world-panel-title" className="world-modal-title">{title}</h2>
        <div className="world-modal-body">{body}</div>
      </div>
    </div>
  );
}
