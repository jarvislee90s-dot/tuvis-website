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

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [items.slice()];
  const result: T[][] = [];
  items.forEach((item, index) => {
    const rest = items.filter((_, i) => i !== index);
    for (const tail of permutations(rest)) result.push([item, ...tail]);
  });
  return result;
}

/** Every collection order of the four modules (the body included): the play
 * loop must finish the quest no matter which piece was found first. */
const ORDERS = permutations(MODULE_IDS);

/** The play loop mirrors the live flow: collect, assemble, display. The
 * repair step was removed, so no REPAIR_CELL is dispatched on the way; the
 * body seats itself on the workbench the moment it is collected. */
function play(order: readonly QuestState["collected"][number][]): QuestState {
  let state = INITIAL_QUEST;
  for (const moduleId of order) state = questReducer(state, { type: "COLLECT", moduleId });
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
  it("completes the quest for all collection orders", () => {
    expect(ORDERS).toHaveLength(24);
    for (const order of ORDERS) {
      expect(isComplete(play(order)), order.join(",")).toBe(true);
    }
  });

  it("does not duplicate a module", () => {
    const once = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "sight" });
    const twice = questReducer(once, { type: "COLLECT", moduleId: "sight" });
    expect(twice.collected).toEqual(["sight"]);
  });

  // The body is the workbench piece: picking it up seats it on the desk
  // straight away, so it never needs (or offers) a separate install step.
  it("seats the body on the workbench the moment it is picked up", () => {
    const seated = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "body" });
    expect(seated.collected).toEqual(["body"]);
    expect(seated.installed).toEqual(["body"]);
    expect(questReducer(seated, { type: "COLLECT", moduleId: "body" })).toEqual(seated);
    expect(canAssemble(seated)).toBe(false); // the three grid modules are still out
    expect(isComplete(seated)).toBe(false);
  });

  it("does not consume the same module twice", () => {
    let state = INITIAL_QUEST;
    for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "COLLECT", moduleId });
    state = questReducer(state, { type: "REPAIR_CELL" });
    state = questReducer(state, { type: "INSTALL", moduleId: "sight" });
    const afterFirst = state;
    state = questReducer(state, { type: "INSTALL", moduleId: "sight" });
    expect(state).toEqual(afterFirst);
    expect(state.installed).toEqual(["body", "sight"]); // body seated by its pickup
  });

  it("ignores repair before the cell is collected", () => {
    let state = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "sight" });
    state = questReducer(state, { type: "COLLECT", moduleId: "emitter" });
    expect(questReducer(state, { type: "REPAIR_CELL" })).toEqual(state);
  });

  it("ignores install until every module including the body is collected", () => {
    expect(questReducer(INITIAL_QUEST, { type: "INSTALL", moduleId: "cell" })).toEqual(INITIAL_QUEST);
    let state = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "sight" });
    state = questReducer(state, { type: "COLLECT", moduleId: "emitter" });
    state = questReducer(state, { type: "COLLECT", moduleId: "cell" });
    expect(canAssemble(state)).toBe(false); // the body is still on the window shelf
    expect(questReducer(state, { type: "INSTALL", moduleId: "sight" })).toEqual(state);
    state = questReducer(state, { type: "COLLECT", moduleId: "body" });
    expect(canAssemble(state)).toBe(true);
  });

  it("installs once all modules are collected, without repairing the cell", () => {
    let state = INITIAL_QUEST;
    for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "COLLECT", moduleId });
    expect(canAssemble(state)).toBe(true);
    expect(state.cellRepaired).toBe(false);
    const installed = questReducer(state, { type: "INSTALL", moduleId: "cell" });
    expect(installed.cellRepaired).toBe(false);
    expect(installed.installed).toEqual(["body", "cell"]);
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
    expect(INITIAL_QUEST.weaponTried).toBe(false);
  });

  // The completion line is keyed on the test fire, not on isComplete.
  it("ignores the test fire until the weapon is fully installed", () => {
    expect(questReducer(INITIAL_QUEST, { type: "TRY_WEAPON" })).toEqual(INITIAL_QUEST);
    let gathering = INITIAL_QUEST;
    for (const moduleId of MODULE_IDS) {
      gathering = questReducer(gathering, { type: "COLLECT", moduleId });
    }
    // Every module is in hand but only the body is seated on the bench.
    expect(questReducer(gathering, { type: "TRY_WEAPON" })).toEqual(gathering);
    expect(gathering.weaponTried).toBe(false);
  });

  it("records the first test fire and only once", () => {
    let state = INITIAL_QUEST;
    for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "COLLECT", moduleId });
    for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "INSTALL", moduleId });
    const fired = questReducer(state, { type: "TRY_WEAPON" });
    expect(fired.weaponTried).toBe(true);
    expect(questReducer(fired, { type: "TRY_WEAPON" })).toEqual(fired);
  });

  it("resets to a new run", () => {
    const fired = questReducer(play(ORDERS[0]), { type: "TRY_WEAPON" });
    expect(fired.weaponTried).toBe(true);
    const reset = questReducer(fired, { type: "RESET" });
    expect(reset).toEqual(INITIAL_QUEST);
    expect(reset.weaponTried).toBe(false);
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
      weaponTried: false,
    });
  });

  // The repair gate is gone from sanitizing too: a save that finished the
  // quest without ever dispatching REPAIR_CELL must restore as complete.
  it("keeps installed modules in a save that never repaired the cell", () => {
    const finished = {
      collected: ["sight", "cell", "emitter", "body"],
      cellRepaired: false,
      installed: ["sight", "cell", "emitter", "body"],
      displayedOnRack: true,
      helpSeen: false,
      weaponTried: false,
    };
    expect(decodeQuest(JSON.stringify({ schemaVersion: 1, quest: finished }))).toEqual(finished);
  });

  it("keeps partially installed saves once every module is collected", () => {
    expect(
      sanitizeQuest({ collected: ["emitter", "sight", "cell", "body"], installed: ["body", "cell"] }),
    ).toEqual({
      collected: ["emitter", "sight", "cell", "body"],
      cellRepaired: false,
      installed: ["body", "cell"],
      displayedOnRack: false,
      helpSeen: false,
      weaponTried: false,
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
      weaponTried: false,
    });
  });

  // The tried flag is a plain passthrough: the reducer owns its gating, so a
  // save that fired keeps the flag without re-deriving it from installed.
  it("passes the tried flag straight through while sanitizing", () => {
    expect(sanitizeQuest({ weaponTried: true }).weaponTried).toBe(true);
    expect(sanitizeQuest({ weaponTried: "yes" }).weaponTried).toBe(false);
    expect(sanitizeQuest({}).weaponTried).toBe(false);
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
      { type: "TRY_WEAPON" },
      { type: "RESET" },
    ];
    expect(events).toHaveLength(7);
  });
});
