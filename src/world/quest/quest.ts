import type { ModuleId } from "../types";

export const MODULE_IDS: readonly ModuleId[] = ["sight", "cell", "emitter", "body"];

export type QuestState = {
  collected: ModuleId[];
  cellRepaired: boolean;
  installed: ModuleId[];
  displayedOnRack: boolean;
  helpSeen: boolean;
  /** The player test-fired the assembled Bug Buster at least once. */
  weaponTried: boolean;
};

export type QuestEvent =
  | { type: "COLLECT" | "INSTALL"; moduleId: ModuleId }
  | { type: "REPAIR_CELL" | "PLACE_ON_RACK" | "HELP_SEEN" | "TRY_WEAPON" | "RESET" };

export const INITIAL_QUEST: QuestState = {
  collected: [],
  cellRepaired: false,
  installed: [],
  displayedOnRack: false,
  helpSeen: false,
  weaponTried: false,
};

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && MODULE_IDS.includes(value as ModuleId);
}

export function hasAllModules(collected: readonly ModuleId[]): boolean {
  return MODULE_IDS.every((id) => collected.includes(id));
}

/** The workbench may open the assembly close-up once every module is found.
 * The old repair gate was removed: collected modules are usable as-is. */
export function canAssemble(state: QuestState): boolean {
  return hasAllModules(state.collected);
}

export function isComplete(state: QuestState): boolean {
  return hasAllModules(state.installed) && state.displayedOnRack;
}

function addOnce(list: ModuleId[], id: ModuleId): ModuleId[] {
  return list.includes(id) ? list : [...list, id];
}

export function questReducer(state: QuestState, event: QuestEvent): QuestState {
  switch (event.type) {
    case "COLLECT": {
      if (!isModuleId(event.moduleId)) return state;
      const collected = addOnce(state.collected, event.moduleId);
      // The body is the workbench piece: picking it up seats it on the desk.
      if (event.moduleId === "body") {
        return { ...state, collected, installed: addOnce(state.installed, "body") };
      }
      return { ...state, collected };
    }
    case "REPAIR_CELL": {
      if (!state.collected.includes("cell") || state.cellRepaired) return state;
      return { ...state, cellRepaired: true };
    }
    case "INSTALL": {
      if (!isModuleId(event.moduleId) || !canAssemble(state)) return state;
      if (state.installed.includes(event.moduleId)) return state;
      return { ...state, installed: [...state.installed, event.moduleId] };
    }
    case "PLACE_ON_RACK": {
      if (!hasAllModules(state.installed) || state.displayedOnRack) return state;
      return { ...state, displayedOnRack: true };
    }
    case "HELP_SEEN": {
      return state.helpSeen ? state : { ...state, helpSeen: true };
    }
    case "TRY_WEAPON": {
      // The completion line flips only after the assembled gun was fired.
      if (!hasAllModules(state.installed) || state.weaponTried) return state;
      return { ...state, weaponTried: true };
    }
    case "RESET": {
      return INITIAL_QUEST;
    }
    default:
      return state;
  }
}
