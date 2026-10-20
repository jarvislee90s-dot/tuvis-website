import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@/i18n";
import { bundle, scene } from "../testFixtures";
import type { QuestState } from "../quest/quest";
import { INITIAL_QUEST, MODULE_IDS, questReducer } from "../quest/quest";
import { WorkbenchPanel } from "../quest/WorkbenchPanel";
import { createRuntimeStore } from "./runtimeStore";
import { resolveHotspot } from "./interaction";

function allCollected(): QuestState {
  return MODULE_IDS.reduce(
    (state, moduleId) => questReducer(state, { type: "COLLECT", moduleId }),
    INITIAL_QUEST,
  );
}

// Installing no longer waits for a repair: the tray opens once every module
// is in hand. `allCollected()` stays for the retained repair-mode panel tests.
function installedAll(): QuestState {
  return MODULE_IDS.reduce(
    (state, moduleId) => questReducer(state, { type: "INSTALL", moduleId }),
    allCollected(),
  );
}

describe("resolveHotspot", () => {
  // The toolbox module is concealed (pickupHidden): the plain arrival opens
  // the box, plays the pickup action and collects — no floating part exists.
  it("collects the concealed sight module on a plain arrival at the toolbox", () => {
    const result = resolveHotspot("toolbox", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "pickup", moduleId: "sight" });
    expect(result.questEvent).toEqual({ type: "COLLECT", moduleId: "sight" });
    expect(result.action).toBe("pickup");
  });

  it("opens resident content on a normal arrival at the posters without collecting", () => {
    const result = resolveHotspot("posters", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "world", id: "residents" });
    expect(result.questEvent).toBeUndefined();
    expect(result.action).toBeUndefined();
  });

  it("opens city content on a normal arrival at the window without collecting", () => {
    const result = resolveHotspot("window", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "world", id: "city" });
    expect(result.questEvent).toBeUndefined();
    expect(result.action).toBeUndefined();
  });

  // The window carries the body in the fifth redistribution: a plain arrival
  // still just opens the city content; only the floating-part pickup collects.
  it("collects the body only on a pickup arrival at the window", () => {
    const windowHotspot = scene.hotspots.find((h) => h.id === "window");
    expect(windowHotspot?.moduleId).toBe("body");
    expect(windowHotspot?.pickupAnchor).toEqual([600, 335]); // the shelf under the window
    expect(resolveHotspot("window", bundle, INITIAL_QUEST)).toEqual({
      overlay: { kind: "world", id: "city" },
    });
    expect(resolveHotspot("window", bundle, INITIAL_QUEST, { pickup: true })).toEqual({
      overlay: { kind: "pickup", moduleId: "body" },
      questEvent: { type: "COLLECT", moduleId: "body" },
      action: "pickup",
    });
  });

  it("keeps the posters a pure content hotspot with no module", () => {
    expect(scene.hotspots.find((h) => h.id === "posters")?.moduleId).toBeUndefined();
    expect(resolveHotspot("posters", bundle, INITIAL_QUEST, { pickup: true })).toEqual({
      overlay: { kind: "world", id: "residents" },
    });
  });

  // The visible parts moved with their furniture: rack green frame, lounge
  // sofa corner, window shelf (asserted above).
  it("anchors the floating parts at their remapped pickup anchors", () => {
    expect(scene.hotspots.find((h) => h.id === "rack")?.pickupAnchor).toEqual([1226, 375]);
    expect(scene.hotspots.find((h) => h.id === "lounge")?.pickupAnchor).toEqual([1075, 650]);
  });

  it("collects the sight module only on a pickup arrival at the toolbox", () => {
    const result = resolveHotspot("toolbox", bundle, INITIAL_QUEST, { pickup: true });
    expect(result.overlay).toEqual({ kind: "pickup", moduleId: "sight" });
    expect(result.questEvent).toEqual({ type: "COLLECT", moduleId: "sight" });
    expect(result.action).toBe("pickup");
  });

  it("opens lounge content on a normal arrival without collecting the cell", () => {
    const result = resolveHotspot("lounge", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "world", id: "home" });
    expect(result.questEvent).toBeUndefined();
    expect(result.action).toBeUndefined();
  });

  it("collects the cell module only on a pickup arrival at the lounge", () => {
    const result = resolveHotspot("lounge", bundle, INITIAL_QUEST, { pickup: true });
    expect(result.overlay).toEqual({ kind: "pickup", moduleId: "cell" });
    expect(result.questEvent).toEqual({ type: "COLLECT", moduleId: "cell" });
    expect(result.action).toBe("pickup");
  });

  it("opens the stories shelf on a plain arrival", () => {
    const result = resolveHotspot("books", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "stories" });
    expect(result.questEvent).toBeUndefined();
    expect(result.action).toBeUndefined();
  });

  // The stories shelf went back to pure content in the v3 redistribution:
  // the emitter now floats on the equipment rack's top shelf.
  it("keeps the stories shelf a pure content hotspot with no module", () => {
    expect(scene.hotspots.find((h) => h.id === "books")?.moduleId).toBeUndefined();
    expect(resolveHotspot("books", bundle, INITIAL_QUEST, { pickup: true })).toEqual({
      overlay: { kind: "stories" },
    });
  });

  it("hints at the missing modules on a plain arrival at the rack", () => {
    const result = resolveHotspot("rack", bundle, INITIAL_QUEST);
    expect(result.overlay).toBeNull();
    expect(result.questEvent).toBeUndefined();
    expect(result.action).toBeUndefined();
    // The hint text now counts the body as a component to find.
    expect(result.message).toBe("让 Bug Buster 重新上线：先找齐四个组件。");
  });

  it("collects the emitter module only on a pickup arrival at the rack", () => {
    const result = resolveHotspot("rack", bundle, INITIAL_QUEST, { pickup: true });
    expect(result.overlay).toEqual({ kind: "pickup", moduleId: "emitter" });
    expect(result.questEvent).toEqual({ type: "COLLECT", moduleId: "emitter" });
    expect(result.action).toBe("pickup");
  });

  it("falls back to the plain content panel once a module is already collected", () => {
    const withSight = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "sight" });
    expect(resolveHotspot("toolbox", bundle, withSight).overlay).toEqual({ kind: "equipment" });
    const pickupAgain = resolveHotspot("toolbox", bundle, withSight, { pickup: true });
    expect(pickupAgain.overlay).toEqual({ kind: "equipment" });
    expect(pickupAgain.questEvent).toBeUndefined();
    expect(pickupAgain.action).toBeUndefined();

    const withCell = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "cell" });
    expect(resolveHotspot("lounge", bundle, withCell, { pickup: true }).overlay).toEqual({
      kind: "world",
      id: "home",
    });
    expect(resolveHotspot("lounge", bundle, withCell, { pickup: true }).questEvent).toBeUndefined();

    const withEmitter = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "emitter" });
    const rackAgain = resolveHotspot("rack", bundle, withEmitter, { pickup: true });
    expect(rackAgain.overlay).toBeNull();
    expect(rackAgain.questEvent).toBeUndefined();

    const withBody = questReducer(INITIAL_QUEST, { type: "COLLECT", moduleId: "body" });
    expect(resolveHotspot("window", bundle, withBody, { pickup: true }).overlay).toEqual({
      kind: "world",
      id: "city",
    });
    expect(resolveHotspot("window", bundle, withBody, { pickup: true }).questEvent).toBeUndefined();
  });

  it("shows door destinations without starting another scene", () => {
    const hall = resolveHotspot("door-hall", bundle, INITIAL_QUEST);
    const side = resolveHotspot("door-side", bundle, INITIAL_QUEST);
    expect(hall.overlay).toEqual({ kind: "door", id: "hall" });
    expect(side.overlay).toEqual({ kind: "door", id: "rooms" });
    expect(hall.questEvent).toBeUndefined();
    expect(side.questEvent).toBeUndefined();
    expect(scene.hotspots.find((h) => h.id === "door-hall")?.nextSceneId).toBe("home-hall");
  });

  it("uses the same stories data as the landing page", () => {
    const result = resolveHotspot("books", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "stories" });
    expect(bundle.content.stories).toHaveLength(3);
  });

  it("selects sitting and coffee poses", () => {
    expect(resolveHotspot("chair", bundle, INITIAL_QUEST).pose).toBe("sit");
    expect(resolveHotspot("coffee", bundle, INITIAL_QUEST).pose).toBe("coffee");
    expect(resolveHotspot("table", bundle, INITIAL_QUEST).pose).toBe("coffee");
  });

  // The repair stop was removed: task board until the set is complete, then
  // the assembly close-up, then the finished-gun showcase on the desk.
  it("switches the workbench from task to assembly to the finished-gun showcase", () => {
    expect(resolveHotspot("workbench", bundle, INITIAL_QUEST).overlay).toEqual({ kind: "task" });
    const collected = allCollected();
    expect(resolveHotspot("workbench", bundle, collected).overlay).toEqual({ kind: "assembly" });
    const oneInstalled = questReducer(collected, { type: "INSTALL", moduleId: "sight" });
    expect(resolveHotspot("workbench", bundle, oneInstalled).overlay).toEqual({ kind: "assembly" });
    expect(resolveHotspot("workbench", bundle, installedAll()).overlay).toEqual({
      kind: "workbenchGun",
    });
  });

  it("places the finished weapon on the rack only after all installs", () => {
    const early = resolveHotspot("rack", bundle, allCollected());
    expect(early.questEvent).toBeUndefined();
    expect(early.message).toBeTruthy();

    const finished = resolveHotspot("rack", bundle, installedAll());
    expect(finished.questEvent).toEqual({ type: "PLACE_ON_RACK" });
    expect(finished.pose).toBe("display");

    const displayed = questReducer(installedAll(), { type: "PLACE_ON_RACK" });
    const shown = resolveHotspot("rack", bundle, displayed);
    expect(shown.questEvent).toBeUndefined();
    expect(shown.pose).toBe("display");
  });
});

describe("daily poses", () => {
  it("cancels a daily pose when a new destination is requested", () => {
    const store = createRuntimeStore(scene);
    store.getState().setPose("sit");
    store.getState().requestMove(scene.nav.nodes.center);
    expect(store.getState().pose).not.toBe("sit");
  });
});


describe("WorkbenchPanel", () => {
  it("lists missing modules in task mode", () => {
    render(
      <WorkbenchPanel bundle={bundle} onClose={() => undefined} />,
    );
    expect(screen.getByText("在工具箱里寻找")).toBeInTheDocument();
    expect(screen.getByText("在沙发上寻找")).toBeInTheDocument();
    // The emitter's hint follows the pack data: it now sits on the rack's
    // top shelf, no longer on the stories bookshelf.
    expect(screen.getByText("在货架顶上寻找")).toBeInTheDocument();
  });
});
