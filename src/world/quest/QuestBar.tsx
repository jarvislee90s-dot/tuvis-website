import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { QuestState } from "./quest";
import { canAssemble, hasAllModules, isComplete } from "./quest";
import type { WorldBundle } from "../types";

type QuestBarProps = {
  bundle: WorldBundle;
  quest: QuestState;
};

function currentAction(quest: QuestState, bundle: WorldBundle, t: TFunction): string {
  const { content } = bundle;
  if (isComplete(quest)) return t("world.questComplete");
  if (hasAllModules(quest.installed)) return t("world.questRack");
  if (canAssemble(quest)) {
    return quest.installed.length > 0 ? t("world.questReturnWorkbench") : t("world.questGoWorkbench");
  }
  if (hasAllModules(quest.collected)) return t("world.questRepairNeeded");
  const missing = content.quest.modules.filter((module) => !quest.collected.includes(module.id));
  const items = missing.map((module) => `${module.label}（${module.source}）`).join("、");
  return t("world.questFind", { items });
}

/** Three module slots plus the single next action. */
export function QuestBar({ bundle, quest }: QuestBarProps) {
  const { t } = useTranslation();
  return (
    <div className="world-questbar" role="status" aria-label={t("world.questProgress")}>
      <span className="world-questbar-title">{bundle.content.quest.title}</span>
      <ul className="world-questbar-slots">
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
                {installed
                  ? t("world.statusInstalled")
                  : collected
                    ? t("world.statusCollected")
                    : t("world.statusPending")}
              </small>
            </li>
          );
        })}
      </ul>
      <p className="world-questbar-action">{currentAction(quest, bundle, t)}</p>
    </div>
  );
}
