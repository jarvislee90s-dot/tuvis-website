import type { QuestState } from "./quest";
import { canAssemble, hasAllModules, isComplete } from "./quest";
import type { WorldBundle } from "../types";

type QuestBarProps = {
  bundle: WorldBundle;
  quest: QuestState;
};

function currentAction(quest: QuestState, bundle: WorldBundle): string {
  const { content } = bundle;
  if (isComplete(quest)) return "主线完成 · Bug Buster 已陈列";
  if (hasAllModules(quest.installed)) return "到装备架陈列 Bug Buster";
  if (canAssemble(quest)) {
    return quest.installed.length > 0 ? "返回工作台继续组装" : "到工作台进入组装";
  }
  if (hasAllModules(quest.collected)) return content.ui.repairNeeded;
  const missing = content.quest.modules.filter((module) => !quest.collected.includes(module.id));
  return `还需寻找：${missing.map((module) => `${module.label}（${module.source}）`).join("、")}`;
}

/** Three module slots plus the single next action. */
export function QuestBar({ bundle, quest }: QuestBarProps) {
  return (
    <div className="world-questbar" role="status" aria-label="任务进度">
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
              <small>{installed ? "已安装" : collected ? "已领取" : "未领取"}</small>
            </li>
          );
        })}
      </ul>
      <p className="world-questbar-action">{currentAction(quest, bundle)}</p>
    </div>
  );
}
