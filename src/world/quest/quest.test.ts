import { describe, expect, it } from "vitest";
import {
  INITIAL_QUEST,
  MODULE_IDS,
  canAssemble,
  isComplete,
  questReducer,
  type QuestEvent,
  type QuestState,
} from "./quest";
import {
  QUEST_STORAGE_KEY,
  decodeQuest,
  readQuest,
  sanitizeQuest,
  writeQuest,
} from "./persistence";

const ORDERS = [
  ["sight", "cell", "emitter"],
  ["sight", "emitter", "cell"],
  ["cell", "sight", "emitter"],
  ["cell", "emitter", "sight"],
  ["emitter", "sight", "cell"],
  ["emitter", "cell", "sight"],
] as const;

function play(order: readonly QuestState["collected"][number][]): QuestState {
  let state = INITIAL_QUEST;
  for (const moduleId of order) state = questReducer(state, { type: "COLLECT", moduleId });
  state = questReducer(state, { type: "REPAIR_CELL" });
  for (const moduleId of order) state = questReducer(state, { type: "INSTALL", moduleId });
  return questReducer(state, { type: "PLACE_ON_RACK" });
}

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("questReducer", () => {
  it("completes the quest for all six collection orders", () => {
    for (const order of ORDERS) {
      expect(isComplete(play(order)), order.join(",")).toBe(true);
    }
  });

  it("does not duplicate a module", () => {
    const once = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "sight" });
    const twice = questReducer(once, { type: "COLLECT", moduleId: "sight" });
    expect(twice.collected).toEqual(["sight"]);
  });

  it("does not consume the same module twice", () => {
    let state = INITIAL_QUEST;
    for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "COLLECT", moduleId });
    state = questReducer(state, { type: "REPAIR_CELL" });
    state = questReducer(state, { type: "INSTALL", moduleId: "sight" });
    const afterFirst = state;
    state = questReducer(state, { type: "INSTALL", moduleId: "sight" });
    expect(state).toEqual(afterFirst);
    expect(state.installed).toEqual(["sight"]);
  });

  it("ignores repair before the cell is collected", () => {
    let state = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "sight" });
    state = questReducer(state, { type: "COLLECT", moduleId: "emitter" });
    expect(questReducer(state, { type: "REPAIR_CELL" })).toEqual(state);
  });

  it("ignores install until all modules are collected and the cell is repaired", () => {
    expect(questReducer(INITIAL_QUEST, { type: "INSTALL", moduleId: "cell" })).toEqual(INITIAL_QUEST);
    let state = INITIAL_QUEST;
    for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "COLLECT", moduleId });
    expect(canAssemble(state)).toBe(false);
    expect(questReducer(state, { type: "INSTALL", moduleId: "cell" })).toEqual(state);
  });

  it("only places the finished weapon on the rack", () => {
    let state = INITIAL_QUEST;
    for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "COLLECT", moduleId });
    state = questReducer(state, { type: "REPAIR_CELL" });
    state = questReducer(state, { type: "INSTALL", moduleId: "sight" });
    expect(questReducer(state, { type: "PLACE_ON_RACK" }).displayedOnRack).toBe(false);
    state = questReducer(state, { type: "INSTALL", moduleId: "cell" });
    state = questReducer(state, { type: "INSTALL", moduleId: "emitter" });
    expect(isComplete(state)).toBe(false);
    expect(isComplete(questReducer(state, { type: "PLACE_ON_RACK" }))).toBe(true);
  });

  it("expects a clean quest at the start", () => {
    expect(isComplete(INITIAL_QUEST)).toBe(false);
  });

  it("resets to a new run", () => {
    const played = play(ORDERS[0]);
    const reset = questReducer(played, { type: "RESET" });
    expect(reset).toEqual(INITIAL_QUEST);
    expect(isComplete(reset)).toBe(false);
  });

  it("records help as seen", () => {
    expect(questReducer(INITIAL_QUEST, { type: "HELP_SEEN" }).helpSeen).toBe(true);
  });
});

describe("persistence", () => {
  it("decodes broken JSON as a fresh quest", () => {
    expect(decodeQuest("{bad")).toEqual(INITIAL_QUEST);
  });

  it("resets incompatible schema versions", () => {
    expect(decodeQuest(JSON.stringify({ schemaVersion: 2, quest: play(ORDERS[0]) }))).toEqual(
      INITIAL_QUEST,
    );
  });

  it("falls back when storage throws", () => {
    expect(readQuest({ getItem() { throw Error("denied"); } })).toEqual(INITIAL_QUEST);
  });

  it("sanitizes a well-formed but impossible save", () => {
    const decoded = decodeQuest(JSON.stringify({
      schemaVersion: 1,
      quest: {
        collected: [],
        cellRepaired: true,
        installed: ["sight", "cell", "emitter"],
        displayedOnRack: true,
        helpSeen: true,
      },
    }));
    expect(decoded).toEqual({
      collected: [],
      cellRepaired: false,
      installed: [],
      displayedOnRack: false,
      helpSeen: true,
    });
  });

  it("round-trips a legitimate partial save", () => {
    const storage = memoryStorage();
    let state = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "cell" });
    state = questReducer(state, { type: "REPAIR_CELL" });
    state = questReducer(state, { type: "COLLECT", moduleId: "sight" });
    expect(writeQuest(storage, state)).toBe(true);
    expect(readQuest(storage)).toEqual(state);
    expect(storage.map.has(QUEST_STORAGE_KEY)).toBe(true);
  });

  it("returns false instead of blocking gameplay when setItem throws", () => {
    expect(writeQuest({ setItem() { throw Error("quota"); } }, INITIAL_QUEST)).toBe(false);
  });

  it("reset writes only this feature's key", () => {
    const storage = memoryStorage({ "other-app": "keep" });
    writeQuest(storage, questReducer(play(ORDERS[0]), { type: "RESET" }));
    expect(storage.map.get("other-app")).toBe("keep");
    expect(readQuest(storage)).toEqual(INITIAL_QUEST);
  });

  it("deduplicates and drops unknown modules while sanitizing", () => {
    expect(sanitizeQuest({ collected: ["sight", "sight", "bogus"], helpSeen: "yes" })).toEqual({
      collected: ["sight"],
      cellRepaired: false,
      installed: [],
      displayedOnRack: false,
      helpSeen: false,
    });
  });
});

describe("event contract", () => {
  it("accepts the documented event union", () => {
    const events: QuestEvent[] = [
      { type: "COLLECT", moduleId: "sight" },
      { type: "INSTALL", moduleId: "cell" },
      { type: "REPAIR_CELL" },
      { type: "PLACE_ON_RACK" },
      { type: "HELP_SEEN" },
      { type: "RESET" },
    ];
    expect(events).toHaveLength(6);
  });
});
