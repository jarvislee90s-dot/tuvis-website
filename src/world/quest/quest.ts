import type { ModuleId } from "../types";

export const MODULE_IDS: readonly ModuleId[] = ["sight", "cell", "emitter"];

export type QuestState = {
  collected: ModuleId[];
  cellRepaired: boolean;
  installed: ModuleId[];
  displayedOnRack: boolean;
  helpSeen: boolean;
};

export type QuestEvent =
  | { type: "COLLECT" | "INSTALL"; moduleId: ModuleId }
  | { type: "REPAIR_CELL" | "PLACE_ON_RACK" | "HELP_SEEN" | "RESET" };

export const INITIAL_QUEST: QuestState = {
  collected: [],
  cellRepaired: false,
  installed: [],
  displayedOnRack: false,
  helpSeen: false,
};

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && MODULE_IDS.includes(value as ModuleId);
}

export function hasAllModules(collected: readonly ModuleId[]): boolean {
  return MODULE_IDS.every((id) => collected.includes(id));
}

/** The workbench may open the assembly close-up only after repair. */
export function canAssemble(state: QuestState): boolean {
  return hasAllModules(state.collected) && state.cellRepaired;
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
      return { ...state, collected: addOnce(state.collected, event.moduleId) };
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
    case "RESET": {
      return INITIAL_QUEST;
    }
    default:
      return state;
  }
}
