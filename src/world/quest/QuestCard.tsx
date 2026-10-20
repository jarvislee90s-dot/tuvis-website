import { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { QuestState } from "./quest";
import { hasAllModules } from "./quest";
import type { WorldBundle } from "../types";

type QuestCardProps = {
  bundle: WorldBundle;
  quest: QuestState;
};

function currentAction(quest: QuestState, t: TFunction): string {
  if (quest.weaponTried) return t("world.questDone");
  if (hasAllModules(quest.installed)) return t("world.tryWeapon");
  if (hasAllModules(quest.collected)) {
    return quest.installed.length > 1 ? t("world.questReturnWorkbench") : t("world.questGoWorkbench");
  }
  // Still gathering: the four slots tell the story, no extra hint line.
  return "";
}

/**
 * In-canvas quest objective card (top-right, translucent, collapsible):
 * the how-to-play lines, the three module slots and the current objective.
 * Once the quest is done it shows the completion line instead.
 */
export function QuestCard({ bundle, quest }: QuestCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const done = quest.weaponTried;

  if (!open) {
    return (
      <button
        type="button"
        className="world-quest-card is-collapsed"
        onClick={() => setOpen(true)}
      >
        {t("world.questCardToggle")}
      </button>
    );
  }

  return (
    <aside className="world-quest-card" role="status" aria-label={t("world.questProgress")}>
      <div className="world-quest-card-head">
        <span>{bundle.content.quest.title}</span>
        <button
          type="button"
          className="world-quest-card-collapse"
          aria-label={t("world.questCardToggle")}
          onClick={() => setOpen(false)}
        >
          –
        </button>
      </div>
      {done ? (
        <p className="world-quest-card-done">{t("world.questDone")}</p>
      ) : (
        <>
          {hasAllModules(quest.installed) ? (
            <p className="world-quest-card-done">{t("world.tryWeapon")}</p>
          ) : null}
          <ul className="world-quest-card-slots">
            {bundle.content.quest.modules.map((module) => {
              const collected = quest.collected.includes(module.id);
              const installed = quest.installed.includes(module.id);
              return (
                <li
                  key={module.id}
                  className={`${collected ? "is-collected" : ""} ${installed ? "is-installed" : ""}`}
                >
                  <span className="world-slot-dot" aria-hidden="true" />
                  <span>{module.label}</span>
                  <small>
                    {collected
                      ? module.id === "body"
                        ? t("world.statusCollected")
                        : installed
                          ? t("world.statusInstalled")
                          : t("world.statusCollected")
                      : t("world.statusPending")}
                  </small>
                </li>
              );
            })}
          </ul>
          {currentAction(quest, t) ? (
            <p className="world-quest-card-action">{currentAction(quest, t)}</p>
          ) : null}
        </>
      )}
      <ul className="world-quest-card-help">
        {bundle.content.ui.helpLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
