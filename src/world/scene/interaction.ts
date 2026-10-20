import type { Overlay, WorldBundle } from "../types";
import type { QuestEvent, QuestState } from "../quest/quest";
import { canAssemble, hasAllModules } from "../quest/quest";

export type InteractionResult = {
  overlay: Overlay;
  questEvent?: QuestEvent;
  pose?: "sit" | "coffee" | "display";
  message?: string;
};

/**
 * Resolve an arrived hotspot from scene data only (kind / contentId /
 * moduleId). Chinese labels are never used for branching.
 */
export function resolveHotspot(
  id: string,
  bundle: WorldBundle,
  quest: QuestState,
): InteractionResult {
  const { scene, content } = bundle;
  const hotspot = scene.hotspots.find((entry) => entry.id === id);
  if (!hotspot) return { overlay: null };

  switch (hotspot.kind) {
    case "equipment": {
      return {
        overlay: { kind: "equipment" },
        questEvent: hotspot.moduleId
          ? { type: "COLLECT", moduleId: hotspot.moduleId }
          : undefined,
      };
    }
    case "world": {
      return {
        overlay: { kind: "world", id: hotspot.contentId },
        questEvent: hotspot.moduleId
          ? { type: "COLLECT", moduleId: hotspot.moduleId }
          : undefined,
      };
    }
    case "stories": {
      return { overlay: { kind: "stories" } };
    }
    case "door": {
      return { overlay: { kind: "door", id: hotspot.contentId } };
    }
    case "sit": {
      return { overlay: null, pose: "sit" };
    }
    case "coffee": {
      return { overlay: null, pose: "coffee" };
    }
    case "workbench": {
      if (!hasAllModules(quest.collected)) return { overlay: { kind: "task" } };
      if (!quest.cellRepaired) return { overlay: { kind: "repair" } };
      return { overlay: { kind: "assembly" } };
    }
    case "rack": {
      if (!hasAllModules(quest.installed)) {
        if (!canAssemble(quest)) {
          return {
            overlay: null,
            message: `${content.quest.title}：${hasAllModules(quest.collected) ? content.ui.repairNeeded : "先找齐三个模块。"}`,
          };
        }
        return { overlay: null, message: "先在工作台完成组装。" };
      }
      return {
        overlay: null,
        pose: "display",
        questEvent: quest.displayedOnRack ? undefined : { type: "PLACE_ON_RACK" },
        message: "Bug Buster 已陈列在装备架上。",
      };
    }
    default:
      return { overlay: null };
  }
}
