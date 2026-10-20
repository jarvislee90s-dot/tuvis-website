import { INITIAL_QUEST, MODULE_IDS, isModuleId, type QuestState } from "./quest";

export const QUEST_STORAGE_KEY = "tuvis-world-v1";
export const QUEST_SCHEMA_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueModuleIds(value: unknown): QuestState["collected"] {
  if (!Array.isArray(value)) return [];
  const result: QuestState["collected"] = [];
  for (const entry of value) {
    if (isModuleId(entry) && !result.includes(entry)) result.push(entry);
  }
  return result;
}

/**
 * Drop impossible combinations (installed/displayed without the prerequisites)
 * while keeping every legitimate partial state.
 */
export function sanitizeQuest(value: unknown): QuestState {
  if (!isRecord(value)) return INITIAL_QUEST;
  const collected = uniqueModuleIds(value.collected);
  // The repair gate is gone: collected modules may be installed directly.
  const canHaveInstalled = MODULE_IDS.every((id) => collected.includes(id));
  const installed = canHaveInstalled ? uniqueModuleIds(value.installed) : [];
  const displayedOnRack =
    value.displayedOnRack === true && MODULE_IDS.every((id) => installed.includes(id));
  return {
    collected,
    cellRepaired: value.cellRepaired === true && collected.includes("cell"),
    installed,
    displayedOnRack,
    helpSeen: value.helpSeen === true,
    weaponTried: value.weaponTried === true,
  };
}

export function decodeQuest(raw: string | null): QuestState {
  if (raw === null) return INITIAL_QUEST;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return INITIAL_QUEST;
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== QUEST_SCHEMA_VERSION) {
    return INITIAL_QUEST;
  }
  return sanitizeQuest(parsed.quest);
}

export function readQuest(storage: Pick<Storage, "getItem">): QuestState {
  try {
    return decodeQuest(storage.getItem(QUEST_STORAGE_KEY));
  } catch {
    return INITIAL_QUEST;
  }
}

/** Returns false when storage is unavailable; gameplay continues in memory. */
export function writeQuest(storage: Pick<Storage, "setItem">, state: QuestState): boolean {
  try {
    storage.setItem(
      QUEST_STORAGE_KEY,
      JSON.stringify({ schemaVersion: QUEST_SCHEMA_VERSION, quest: sanitizeQuest(state) }),
    );
    return true;
  } catch {
    return false;
  }
}
