import { i18n } from "@/i18n";
import type { Overlay, WorldBundle } from "../types";
import type { QuestEvent, QuestState } from "../quest/quest";
import { canAssemble, hasAllModules } from "../quest/quest";
import type { ActionAnim } from "./petFrames";

export type InteractionResult = {
  overlay: Overlay;
  questEvent?: QuestEvent;
  pose?: "sit" | "coffee" | "display";
  action?: ActionAnim;
  message?: string;
};

export type InteractionOptions = {
  /** Arrived from clicking the floating part: collect it on arrival. */
  pickup?: boolean;
};

/**
 * Resolve an arrived hotspot from scene data only (kind / contentId /
 * moduleId). Chinese labels are never used for branching. Module hotspots no
 * longer auto-collect: a normal arrival opens the plain content panel, and a
 * pickup arrival (the floating part was clicked) collects the module and
 * opens the pickup description panel.
 */
export function resolveHotspot(
  id: string,
  bundle: WorldBundle,
  quest: QuestState,
  options: InteractionOptions = {},
): InteractionResult {
  const { scene, content } = bundle;
  const hotspot = scene.hotspots.find((entry) => entry.id === id);
  if (!hotspot) return { overlay: null };

  switch (hotspot.kind) {
    case "equipment": {
      const pending = hotspot.moduleId && !quest.collected.includes(hotspot.moduleId);
      if (pending && options.pickup && hotspot.moduleId) {
        return {
          overlay: { kind: "pickup", moduleId: hotspot.moduleId },
          questEvent: { type: "COLLECT", moduleId: hotspot.moduleId },
          action: "pickup",
        };
      }
      return { overlay: { kind: "equipment" } };
    }
    case "world": {
      const pending = hotspot.moduleId && !quest.collected.includes(hotspot.moduleId);
      if (pending && options.pickup && hotspot.moduleId) {
        return {
          overlay: { kind: "pickup", moduleId: hotspot.moduleId },
          questEvent: { type: "COLLECT", moduleId: hotspot.moduleId },
          action: "pickup",
        };
      }
      return { overlay: { kind: "world", id: hotspot.contentId } };
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
            message: `${content.quest.title}：${hasAllModules(quest.collected) ? content.ui.repairNeeded : i18n.t("world.rackNeedModules")}`,
          };
        }
        return { overlay: null, message: i18n.t("world.rackNeedAssembly") };
      }
      return {
        overlay: null,
        pose: "display",
        questEvent: quest.displayedOnRack ? undefined : { type: "PLACE_ON_RACK" },
        message: i18n.t("world.rackPlaced"),
      };
    }
    default:
      return { overlay: null };
  }
}
