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
  it("claims the sight module at the toolbox and opens the codex", () => {
    const result = resolveHotspot("toolbox", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "equipment" });
    expect(result.questEvent).toEqual({ type: "COLLECT", moduleId: "sight" });
  });

  it("claims the cell at the posters with resident content", () => {
    const result = resolveHotspot("posters", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "world", id: "residents" });
    expect(result.questEvent).toEqual({ type: "COLLECT", moduleId: "cell" });
  });

  it("claims the emitter at the window with city content", () => {
    const result = resolveHotspot("window", bundle, INITIAL_QUEST);
    expect(result.overlay).toEqual({ kind: "world", id: "city" });
    expect(result.questEvent).toEqual({ type: "COLLECT", moduleId: "emitter" });
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
    expect(screen.getByText("在工具箱寻找")).toBeInTheDocument();
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
