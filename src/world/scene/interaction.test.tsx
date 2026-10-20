import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@/i18n";
import { bundle, scene } from "../testFixtures";
import type { QuestState } from "../quest/quest";
import { INITIAL_QUEST, MODULE_IDS, questReducer } from "../quest/quest";
import { QuestBar } from "../quest/QuestBar";
import { WorkbenchPanel } from "../quest/WorkbenchPanel";
import { createRuntimeStore } from "./runtimeStore";
import { resolveHotspot } from "./interaction";

function allCollected(): QuestState {
  return MODULE_IDS.reduce(
    (state, moduleId) => questReducer(state, { type: "COLLECT", moduleId }),
    INITIAL_QUEST,
  );
}

function repaired(): QuestState {
  return questReducer(allCollected(), { type: "REPAIR_CELL" });
}

function installedAll(): QuestState {
  return MODULE_IDS.reduce(
    (state, moduleId) => questReducer(state, { type: "INSTALL", moduleId }),
    repaired(),
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

  // The window and posters lost their moduleIds in the redistribution: even a
  // pickup-flagged arrival can only open their content.
  it("keeps the window and posters as pure content hotspots with no module", () => {
    expect(scene.hotspots.find((h) => h.id === "window")?.moduleId).toBeUndefined();
    expect(scene.hotspots.find((h) => h.id === "posters")?.moduleId).toBeUndefined();
    expect(resolveHotspot("window", bundle, INITIAL_QUEST, { pickup: true })).toEqual({
      overlay: { kind: "world", id: "city" },
    });
    expect(resolveHotspot("posters", bundle, INITIAL_QUEST, { pickup: true })).toEqual({
      overlay: { kind: "world", id: "residents" },
    });
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

  it("opens the stories shelf on a normal arrival without collecting the emitter", () => {
    const result = resolveHotspot("books", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "stories" });
    expect(result.questEvent).toBeUndefined();
    expect(result.action).toBeUndefined();
  });

  it("collects the emitter module only on a pickup arrival at the bookshelf", () => {
    const result = resolveHotspot("books", bundle, INITIAL_QUEST, { pickup: true });
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
    expect(resolveHotspot("books", bundle, withEmitter, { pickup: true }).overlay).toEqual({
      kind: "stories",
    });
    expect(resolveHotspot("books", bundle, withEmitter, { pickup: true }).questEvent).toBeUndefined();
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

  it("switches the workbench from task to repair to assembly", () => {
    expect(resolveHotspot("workbench", bundle, INITIAL_QUEST).overlay).toEqual({ kind: "task" });
    const collected = allCollected();
    expect(resolveHotspot("workbench", bundle, collected).overlay).toEqual({ kind: "repair" });
    expect(resolveHotspot("workbench", bundle, repaired()).overlay).toEqual({ kind: "assembly" });
  });

  it("places the finished weapon on the rack only after all installs", () => {
    const early = resolveHotspot("rack", bundle, repaired());
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

describe("QuestBar", () => {
  it("shows three slots and the current action", () => {
    const { rerender } = render(<QuestBar bundle={bundle} quest={INITIAL_QUEST} />);
    expect(screen.getByText("瞄准模块")).toBeInTheDocument();
    expect(screen.getByText("能源匣")).toBeInTheDocument();
    expect(screen.getByText("脉冲发射头")).toBeInTheDocument();
    expect(screen.getByText(/还需寻找/)).toBeInTheDocument();
    rerender(<QuestBar bundle={bundle} quest={installedAll()} />);
    expect(screen.getByText(/到装备架陈列/)).toBeInTheDocument();
  });
});

describe("WorkbenchPanel", () => {
  it("lists missing modules in task mode", () => {
    render(
      <WorkbenchPanel
        bundle={bundle}
        quest={INITIAL_QUEST}
        mode="task"
        onEvent={() => undefined}
        onOpenAssembly={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText("在工具箱里寻找")).toBeInTheDocument();
    expect(screen.getByText("在沙发上寻找")).toBeInTheDocument();
    expect(screen.getByText("在书架上寻找")).toBeInTheDocument();
  });

  it("repairs after selecting the loose interface", () => {
    const onEvent = vi.fn();
    render(
      <WorkbenchPanel
        bundle={bundle}
        quest={allCollected()}
        mode="repair"
        onEvent={onEvent}
        onOpenAssembly={() => undefined}
        onClose={() => undefined}
      />,
    );
    const check = screen.getByRole("button", { name: "执行检查" });
    expect(check).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "松动接口" }));
    fireEvent.click(check);
    expect(onEvent).toHaveBeenCalledWith({ type: "REPAIR_CELL" });
  });

  it("opens assembly once the cell is repaired", () => {
    const onOpenAssembly = vi.fn();
    render(
      <WorkbenchPanel
        bundle={bundle}
        quest={repaired()}
        mode="repair"
        onEvent={() => undefined}
        onOpenAssembly={onOpenAssembly}
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText("接口已复位，供能检查通过。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "进入组装" }));
    expect(onOpenAssembly).toHaveBeenCalled();
  });
});
