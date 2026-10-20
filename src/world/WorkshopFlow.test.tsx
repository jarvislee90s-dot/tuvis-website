import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { StoreApi } from "zustand";
import "@/i18n";
import { bundle } from "./testFixtures";
import { INITIAL_QUEST, isComplete, MODULE_IDS } from "./quest/quest";
import { QUEST_STORAGE_KEY, readQuest } from "./quest/persistence";
import type { RuntimeState } from "./scene/runtimeStore";

const loadMocks = vi.hoisted(() => ({
  loadWorldData: vi.fn(),
  preloadCoreAssets: vi.fn(),
}));

vi.mock("@/world/assets/loadWorldData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/world/assets/loadWorldData")>();
  return {
    ...actual,
    loadWorldData: loadMocks.loadWorldData,
    preloadCoreAssets: loadMocks.preloadCoreAssets,
  };
});

import WorkshopPage, { WorkshopRuntime } from "@/pages/WorkshopPage";

class LoadingImage {
  onload: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
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

type StoreRef = { current: StoreApi<RuntimeState> | null };

function renderRuntime(storage: ReturnType<typeof memoryStorage>, storeRef: StoreRef) {
  return render(
    <MemoryRouter>
      <WorkshopRuntime bundle={bundle} lang="zh" storage={storage} storeRef={storeRef} />
    </MemoryRouter>,
  );
}

async function waitForStore(ref: StoreRef) {
  await waitFor(() => expect(ref.current).not.toBeNull());
  return ref.current! as StoreApi<RuntimeState>;
}

function setStageRect(element: HTMLElement, left: number, top: number, width: number, height: number) {
  element.getBoundingClientRect = () =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

async function visit(store: StoreApi<RuntimeState>, id: string, pickup = false) {
  const hotspot = bundle.scene.hotspots.find((entry) => entry.id === id);
  expect(hotspot).toBeDefined();
  act(() => store.getState().requestMove(hotspot!.approach, id, pickup));
  const token = store.getState().motion.target?.token;
  expect(token).toBeDefined();
  act(() => store.getState().arrive(token!, id, pickup));
  await waitFor(() => expect(store.getState().pendingArrival).toBeNull());
}

/** Close a pickup dialog via its own 知道了 button (the help banner has one too). */
async function closePickup(label: string) {
  const dialog = await screen.findByRole("dialog", { name: label });
  fireEvent.click(within(dialog).getByRole("button", { name: "知道了" }));
}

beforeEach(() => {
  // jsdom has no PointerEvent constructor, which would strip button/pointerId
  // from fireEvent.pointerDown; real browsers always provide them.
  if (typeof globalThis.PointerEvent === "undefined") {
    vi.stubGlobal("PointerEvent", MouseEvent);
  }
  vi.stubGlobal("Image", LoadingImage);
  loadMocks.loadWorldData.mockResolvedValue(bundle);
  loadMocks.preloadCoreAssets.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("workshop flow", () => {
  it("collects four modules, assembles, displays, restores and replays", async () => {
    const storage = memoryStorage();
    const storeRef: StoreRef = { current: null };
    const { unmount } = renderRuntime(storage, storeRef);
    const store = await waitForStore(storeRef);

    // Only the visible parts float: the concealed toolbox module has none.
    expect(document.querySelectorAll("[data-pickup-part]")).toHaveLength(3);
    expect(document.querySelector('[data-pickup-part="sight"]')).toBeNull();

    // Pickup 1: walking up to the toolbox opens the box and grants the module.
    await visit(store, "toolbox");
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "pickup", moduleId: "sight" }));
    expect(store.getState().quest.collected).toEqual(["sight"]);
    expect(store.getState().action?.kind).toBe("pickup");
    await closePickup("瞄准模块");
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    // The concealed module never had a floating part; the visible three remain.
    expect(document.querySelectorAll("[data-pickup-part]")).toHaveLength(3);

    // Pickup 2: the floating part on the lounge sofa collects on arrival.
    await visit(store, "lounge", true);
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "pickup", moduleId: "cell" }));
    await closePickup("能源匣");
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    expect(document.querySelectorAll("[data-pickup-part]")).toHaveLength(2);

    // Pickup 3: the floating part on the equipment rack's top shelf collects too.
    await visit(store, "rack", true);
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "pickup", moduleId: "emitter" }));
    await closePickup("脉冲发射头");
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    expect(document.querySelectorAll("[data-pickup-part]")).toHaveLength(1);

    // Pickup 4: the body on the shelf under the window seats itself on the
    // workbench the moment it is picked up.
    await visit(store, "window", true);
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "pickup", moduleId: "body" }));
    await closePickup("Bug Buster 机身");
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    expect(store.getState().quest.collected).toHaveLength(4);
    expect(store.getState().quest.installed).toEqual(["body"]);
    expect(document.querySelectorAll("[data-pickup-part]")).toHaveLength(0);

    // The repair step is gone: with the full set in hand the workbench goes
    // straight to the assembly close-up.
    await visit(store, "workbench");
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "assembly" }));

    // Select a tray piece (pointerdown), then lock it into its own socket.
    for (const [id, label] of [["sight", "瞄准模块"], ["cell", "能源匣"], ["emitter", "脉冲发射头"]] as const) {
      const piece = screen.getByRole("button", { name: `零件：${label}` });
      fireEvent.pointerDown(piece, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
      fireEvent.pointerUp(piece, { pointerId: 1, clientX: 0, clientY: 0 });
      fireEvent.click(screen.getByRole("button", { name: `插槽：${label}` }));
      await waitFor(() => expect(store.getState().quest.installed).toContain(id));
    }

    // Success sequence: converge + flash play first, then the reveal takes over.
    expect(await screen.findByRole("heading", { name: "Bug Buster 组装完成" })).toBeInTheDocument();
    await waitFor(
      () => expect(document.querySelector("[data-assembly-reveal]")).not.toBeNull(),
      { timeout: 4000 },
    );
    expect(document.querySelector("[data-assembly-grid]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "返回工坊" }));
    await waitFor(() => expect(store.getState().overlay).toBeNull());

    // Closing the finished assembly celebrates without the old banner: the
    // quest card asks for a test fire and the completion line waits for it.
    expect(store.getState().notice).toBeNull();
    expect(screen.queryByText("主线任务已完成，请继续探索兔维斯世界。")).not.toBeInTheDocument();
    await waitFor(() => expect(store.getState().action?.kind).toBe("celebrate"));

    // The assembled gun now sits on the workbench desk with a try-it button.
    expect(document.querySelector("[data-workbench-display]")).not.toBeNull();
    expect(document.querySelector("[data-try-buster]")).not.toBeNull();
    // The card prompts the test fire above and below the slot list.
    expect(screen.getAllByText("试试武器")).toHaveLength(2);

    // Test-firing walks to the try spot and plays only the fire animation.
    fireEvent.click(screen.getByRole("button", { name: "试用 Bug Buster" }));
    await waitFor(() => expect(store.getState().motion.target?.tryFire).toBe(true));
    act(() =>
      store.getState().arrive(store.getState().motion.target!.token, "workbench", false, true),
    );
    await waitFor(() => expect(store.getState().action?.kind).toBe("fire"));
    await waitFor(() => expect(store.getState().pendingArrival).toBeNull());
    expect(store.getState().overlay).toBeNull();
    // The shot marks the weapon as tried, which completes the card...
    expect(store.getState().quest.weaponTried).toBe(true);
    expect(screen.getByText("主线任务已完成，请继续探索兔维斯世界。")).toBeInTheDocument();
    expect(screen.queryByText("试试武器")).not.toBeInTheDocument();
    // ...and hides the desk copy while the fire animation plays.
    expect(document.querySelector("[data-workbench-display]")).toBeNull();

    await visit(store, "rack");
    await waitFor(() => expect(isComplete(store.getState().quest)).toBe(true));
    expect(store.getState().pose).toBe("display");
    // The finished gun is rendered twice once it is racked: the desk copy
    // (workbench display) and the rack showcase. The 2 s fire window (real
    // timers here) keeps the desk copy hidden until it ends.
    await waitFor(() => expect(screen.getAllByAltText("Bug Buster")).toHaveLength(2), {
      timeout: 3000,
    });

    const saved = JSON.parse(storage.map.get(QUEST_STORAGE_KEY)!);
    expect(saved.schemaVersion).toBe(1);
    expect(saved.quest.displayedOnRack).toBe(true);
    // The run never repaired the cell, and the save must keep it that way.
    expect(saved.quest.cellRepaired).toBe(false);
    // The test fire was recorded in the save too.
    expect(saved.quest.weaponTried).toBe(true);
    // All four pieces are in the save: the seated body plus the three installs.
    expect(saved.quest.installed).toHaveLength(4);

    unmount();
    const restoredRef: StoreRef = { current: null };
    renderRuntime(storage, restoredRef);
    const restored = await waitForStore(restoredRef);
    expect(isComplete(restored.getState().quest)).toBe(true);
    expect(restored.getState().quest.installed).toHaveLength(4);

    const resetButton = screen.getByRole("button", { name: "重玩主线" });
    resetButton.focus();
    fireEvent.click(resetButton);
    expect(screen.getByRole("dialog", { name: "重玩主线" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(resetButton).toHaveFocus();

    fireEvent.click(resetButton);
    fireEvent.click(screen.getByRole("button", { name: "确认重玩" }));
    await waitFor(() => expect(restored.getState().quest).toEqual(INITIAL_QUEST));
    expect(readQuest(storage)).toEqual(INITIAL_QUEST);
  });

  it("completes even when storage.setItem throws", async () => {
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    const storeRef: StoreRef = { current: null };
    render(
      <MemoryRouter>
        <WorkshopRuntime bundle={bundle} lang="zh" storage={throwing} storeRef={storeRef} />
      </MemoryRouter>,
    );
    const store = await waitForStore(storeRef);
    act(() => {
      const events = [
        { type: "COLLECT", moduleId: "sight" },
        { type: "COLLECT", moduleId: "cell" },
        { type: "COLLECT", moduleId: "emitter" },
        { type: "COLLECT", moduleId: "body" },
        { type: "REPAIR_CELL" },
        { type: "INSTALL", moduleId: "sight" },
        { type: "INSTALL", moduleId: "cell" },
        { type: "INSTALL", moduleId: "emitter" },
        { type: "PLACE_ON_RACK" },
      ] as const;
      for (const event of events) store.getState().dispatchQuest(event);
    });
    expect(isComplete(store.getState().quest)).toBe(true);
  });

  // Kills a cancel that clears the target but still lets the old token arrive.
  it("does not deliver an interaction when blur cancels a pending hotspot arrival", async () => {
    const storeRef: StoreRef = { current: null };
    renderRuntime(memoryStorage(), storeRef);
    const store = await waitForStore(storeRef);
    const toolbox = bundle.scene.hotspots.find((entry) => entry.id === "toolbox")!;

    act(() => store.getState().requestMove(toolbox.approach, "toolbox"));
    const token = store.getState().motion.target!.token;
    fireEvent.blur(window);
    expect(store.getState().motion.target).toBeNull();

    // A stale arrival after cancel must not open the panel or grant the module.
    act(() => store.getState().arrive(token, "toolbox"));
    await act(async () => undefined);
    expect(store.getState().pendingArrival).toBeNull();
    expect(store.getState().overlay).toBeNull();
    expect(store.getState().quest.collected).toEqual([]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // The concealed toolbox module is collected by the arrival itself; visible
  // floating parts (lounge, bookshelf) only collect when the walk was started
  // from the floating part button.
  it("opens the toolbox on arrival, but collects the lounge part only from its floating part", async () => {
    const storeRef: StoreRef = { current: null };
    renderRuntime(memoryStorage(), storeRef);
    const store = await waitForStore(storeRef);

    // Plain arrival at the toolbox opens the box and collects the module.
    await visit(store, "toolbox");
    await waitFor(() =>
      expect(store.getState().overlay).toEqual({ kind: "pickup", moduleId: "sight" }),
    );
    expect(store.getState().quest.collected).toEqual(["sight"]);
    expect(await screen.findByRole("dialog", { name: "瞄准模块" })).toBeInTheDocument();
    await closePickup("瞄准模块");
    await waitFor(() => expect(store.getState().overlay).toBeNull());

    // Once collected, even a plain arrival falls back to the equipment codex.
    await visit(store, "toolbox");
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "equipment" }));
    expect(store.getState().quest.collected).toEqual(["sight"]);
    expect(screen.queryByRole("dialog", { name: "瞄准模块" })).not.toBeInTheDocument();
    act(() => store.getState().setOverlay(null));

    // A plain arrival at the lounge only reads its content.
    await visit(store, "lounge");
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "world", id: "home" }));
    expect(store.getState().quest.collected).toEqual(["sight"]);
    act(() => store.getState().setOverlay(null));

    // The floating part routes a pickup walk that collects on arrival.
    expect(document.querySelector('[data-pickup-part="cell"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "能源匣（点击拾取）" }));
    await waitFor(() => expect(store.getState().motion.target?.pickup).toBe(true));
    expect(store.getState().motion.target?.hotspotId).toBe("lounge");

    act(() => store.getState().arrive(store.getState().motion.target!.token, "lounge", true));
    await waitFor(() =>
      expect(store.getState().overlay).toEqual({ kind: "pickup", moduleId: "cell" }),
    );
    expect(store.getState().quest.collected).toEqual(["sight", "cell"]);
    expect(store.getState().action?.kind).toBe("pickup");
    expect(await screen.findByRole("dialog", { name: "能源匣" })).toBeInTheDocument();
    await closePickup("能源匣");
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    // The collected part stops floating.
    expect(document.querySelector('[data-pickup-part="cell"]')).toBeNull();
  });

  // The pickupHidden toolbox module never floats; the world-kind window and
  // lounge plus the rack-kind shelf-top parts do.
  it("renders floating parts only for visible pending modules", async () => {
    const storeRef: StoreRef = { current: null };
    renderRuntime(memoryStorage(), storeRef);
    await waitForStore(storeRef);

    expect(document.querySelector('[data-pickup-part="sight"]')).toBeNull();
    expect(document.querySelector('[data-pickup-part="cell"]')).not.toBeNull();
    expect(document.querySelector('[data-pickup-part="emitter"]')).not.toBeNull();
    expect(document.querySelector('[data-pickup-part="body"]')).not.toBeNull();

    // The floating box shrank to 77x53 scene pixels.
    const part = document.querySelector('[data-pickup-part="cell"]') as HTMLElement;
    expect(part.style.width).toBe(`${(77 / bundle.scene.size[0]) * 100}%`);
    expect(part.style.height).toBe(`${(53 / bundle.scene.size[1]) * 100}%`);
  });

  // The finished gun on the desk: the floating try button walks over and
  // fires without opening any panel; a plain arrival opens the showcase.
  it("fires the assembled buster from the try button and shows it off on plain arrivals", async () => {
    const storeRef: StoreRef = { current: null };
    renderRuntime(memoryStorage(), storeRef);
    const store = await waitForStore(storeRef);

    // Nothing sits on the desk and no try button exists before assembly.
    expect(document.querySelector("[data-workbench-display]")).toBeNull();
    expect(document.querySelector("[data-try-buster]")).toBeNull();

    act(() => {
      for (const moduleId of MODULE_IDS) {
        store.getState().dispatchQuest({ type: "COLLECT", moduleId });
      }
      for (const moduleId of MODULE_IDS) {
        store.getState().dispatchQuest({ type: "INSTALL", moduleId });
      }
    });

    // Once installed, the desk shows the finished gun plus a try-it button.
    await waitFor(() => expect(document.querySelector("[data-workbench-display]")).not.toBeNull());
    expect(document.querySelector("[data-try-buster]")).not.toBeNull();

    // Trying it walks to the try spot (not the bench approach) carrying the
    // fire flag...
    fireEvent.click(screen.getByRole("button", { name: "试用 Bug Buster" }));
    await waitFor(() => expect(store.getState().motion.target?.tryFire).toBe(true));
    const tryWalk = store.getState().motion.target!;
    expect(tryWalk.hotspotId).toBe("workbench");
    expect(tryWalk.path[tryWalk.path.length - 1]).toEqual(bundle.scene.trySpot);

    // ...and the arrival short-circuits to the fire animation: no panel opens.
    act(() =>
      store.getState().arrive(store.getState().motion.target!.token, "workbench", false, true),
    );
    await waitFor(() => expect(store.getState().action?.kind).toBe("fire"));
    await waitFor(() => expect(store.getState().pendingArrival).toBeNull());
    expect(store.getState().overlay).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // A plain arrival at the bench instead opens the finished-gun showcase.
    await visit(store, "workbench");
    await waitFor(() => expect(store.getState().overlay).toEqual({ kind: "workbenchGun" }));
    const dialog = await screen.findByRole("dialog", { name: "Bug 清除脉冲炮" });
    expect(within(dialog).getByText("桌面上的成品")).toBeInTheDocument();

    // Its try button closes the panel and replays the fire animation.
    const fireId = store.getState().action?.id ?? 0;
    fireEvent.click(within(dialog).getByRole("button", { name: "试用 Bug Buster" }));
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    await waitFor(() => expect(store.getState().action?.kind).toBe("fire"));
    expect(store.getState().action?.id ?? 0).toBeGreaterThan(fireId);
  });

  // Kills panels that focus their close button but never restore the trigger.
  it("returns focus to the hotspot after workbench and assembly panels close", async () => {
    const storeRef: StoreRef = { current: null };
    renderRuntime(memoryStorage(), storeRef);
    const store = await waitForStore(storeRef);
    const hotspot = screen.getByRole("button", { name: "工作台" });
    hotspot.focus();
    expect(hotspot).toHaveFocus();

    act(() => store.getState().setOverlay({ kind: "task" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    expect(hotspot).toHaveFocus();

    // The tray only lists collected modules, so hand them over first.
    act(() => {
      for (const moduleId of MODULE_IDS) {
        store.getState().dispatchQuest({ type: "COLLECT", moduleId });
      }
    });
    act(() => store.getState().setOverlay({ kind: "assembly" }));
    expect(await screen.findByRole("button", { name: "零件：瞄准模块" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    expect(hotspot).toHaveFocus();
  });

  // Kills a scene wired to a fixed/global rect instead of the rendered stage.
  it("maps clicks through the rendered stage rect at two display sizes", async () => {
    const storeRef: StoreRef = { current: null };
    renderRuntime(memoryStorage(), storeRef);
    const store = await waitForStore(storeRef);
    const stage = document.querySelector(".world-stage") as HTMLElement;

    const clickAndReadTarget = (rect: [number, number, number, number], client: [number, number]) => {
      setStageRect(stage, ...rect);
      fireEvent.click(stage, { clientX: client[0], clientY: client[1] });
      const target = store.getState().motion.target;
      expect(target).not.toBeNull();
      return target!.path[target!.path.length - 1];
    };

    // Both client points map to scene point [800, 680] under their own rect.
    expect(clickAndReadTarget([100, 50, 768, 512], [500, 390])).toEqual([800, 680]);
    expect(clickAndReadTarget([100, 50, 1536, 1024], [900, 730])).toEqual([800, 680]);
  });

  it("pauses movement for panels, stops on blur, and Esc restores focus", async () => {
    const storeRef: StoreRef = { current: null };
    renderRuntime(memoryStorage(), storeRef);
    const store = await waitForStore(storeRef);

    expect(document.querySelector(".world-actor-shadow")).not.toBeNull();
    act(() => store.getState().requestMove(bundle.scene.nav.nodes.center));
    expect(store.getState().motion.target).not.toBeNull();
    await waitFor(() => expect(document.querySelector(".world-actor.is-moving")).not.toBeNull());
    act(() => store.getState().setOverlay({ kind: "help" }));
    expect(store.getState().motion.target).toBeNull();
    expect(document.querySelector(".world-actor.is-moving")).toBeNull();
    await screen.findByRole("dialog");

    // The top-bar help button is gone (how-to lines live in the quest card);
    // the music button now hosts the focus-restore contract.
    const helpButton = screen.getByRole("button", { name: "音乐：开" });
    helpButton.focus();
    act(() => store.getState().setOverlay(null));
    act(() => store.getState().setOverlay({ kind: "help" }));
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(store.getState().overlay).toBeNull());
    expect(helpButton).toHaveFocus();

    act(() => store.getState().requestMove(bundle.scene.nav.nodes.rack, "rack"));
    expect(store.getState().motion.target).not.toBeNull();
    fireEvent.blur(window);
    expect(store.getState().motion.target).toBeNull();
  });
});

describe("workshop loading", () => {
  it("does not mount a playable scene until core images resolve", async () => {
    let resolvePreload: (() => void) | undefined;
    loadMocks.preloadCoreAssets.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePreload = resolve;
      }),
    );

    render(
      <MemoryRouter initialEntries={["/zh/world/workshop"]}>
        <Routes>
          <Route path="/:lang/world/workshop" element={<WorkshopPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("正在准备工作坊…")).toBeInTheDocument();
    await waitFor(() => expect(loadMocks.preloadCoreAssets).toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: "工坊场景" })).toBeNull();
    await act(async () => resolvePreload?.());
    expect(await screen.findByRole("region", { name: "工坊场景" })).toBeInTheDocument();
  });

  it("retries after a core image failure and ignores the stale request", async () => {
    loadMocks.preloadCoreAssets
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/zh/world/workshop"]}>
        <Routes>
          <Route path="/:lang/world/workshop" element={<WorkshopPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "内容加载失败。" })).toBeInTheDocument();
    expect(screen.getByText("offline")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(await screen.findByRole("region", { name: "工坊场景" })).toBeInTheDocument();
    expect(loadMocks.loadWorldData).toHaveBeenCalledTimes(2);
    expect(loadMocks.preloadCoreAssets).toHaveBeenCalledTimes(2);
  });
});
