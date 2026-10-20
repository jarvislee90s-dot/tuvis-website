import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@/i18n";
import { bundle } from "../testFixtures";
import { INITIAL_QUEST, MODULE_IDS, questReducer, type QuestEvent, type QuestState } from "./quest";
import { AssemblyPanel } from "./AssemblyPanel";

class LoadingImage {
  onload: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

let failPreload = false;
class FlakyImage {
  onload: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => {
      if (failPreload) this.onerror?.(new Event("error"));
      else this.onload?.();
    });
  }
}

/** scene.json assembly grid: [row, col] per module, body in the centre. */
const CELL_OF: Record<"body" | (typeof MODULE_IDS)[number], string> = {
  sight: "0-1",
  emitter: "1-0",
  body: "1-1",
  cell: "2-2",
};
const LABEL_OF: Record<(typeof MODULE_IDS)[number], string> = {
  sight: "瞄准模块",
  cell: "能源匣",
  emitter: "脉冲发射头",
};

function repaired(): QuestState {
  let state = INITIAL_QUEST;
  for (const moduleId of MODULE_IDS) state = questReducer(state, { type: "COLLECT", moduleId });
  return questReducer(state, { type: "REPAIR_CELL" });
}

function installedAll(): QuestState {
  return MODULE_IDS.reduce(
    (state, moduleId) => questReducer(state, { type: "INSTALL", moduleId }),
    repaired(),
  );
}

type PanelExtras = { onClose?: () => void };

/**
 * Mirrors the real wiring: INSTALL events flow back into the quest prop, so
 * cells turn green and the success sequence can start inside one test.
 */
function renderPanel(initial: QuestState = repaired(), extras: PanelExtras = {}) {
  const onEvent = vi.fn();
  function Harness() {
    const [quest, setQuest] = useState(initial);
    const handleEvent = (event: QuestEvent) => {
      onEvent(event);
      setQuest((state) => questReducer(state, event));
    };
    return (
      <AssemblyPanel
        bundle={bundle}
        quest={quest}
        onEvent={handleEvent}
        onClose={extras.onClose ?? (() => undefined)}
      />
    );
  }
  render(<Harness />);
  return { onEvent };
}

async function openPanel(initial: QuestState = repaired(), extras: PanelExtras = {}) {
  const result = renderPanel(initial, extras);
  await screen.findByRole("button", { name: "零件：瞄准模块" });
  return result;
}

/** Selection is pointerdown-driven; pointerup over the empty grid installs nothing. */
function selectPiece(label: string) {
  const piece = screen.getByRole("button", { name: `零件：${label}` });
  fireEvent.pointerDown(piece, { clientX: 0, clientY: 0, pointerId: 1, button: 0 });
  fireEvent.pointerUp(piece, { clientX: 0, clientY: 0, pointerId: 1 });
  return piece;
}

function setGridRect(left: number, top: number, width: number, height: number) {
  const grid = document.querySelector("[data-assembly-grid]") as HTMLElement;
  expect(grid).not.toBeNull();
  grid.getBoundingClientRect = () =>
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
  return grid;
}

function drag(
  piece: HTMLElement,
  from: [number, number],
  to: [number, number],
) {
  fireEvent.pointerDown(piece, { clientX: from[0], clientY: from[1], pointerId: 1, button: 0 });
  fireEvent.pointerMove(piece, { clientX: to[0], clientY: to[1], pointerId: 1 });
  fireEvent.pointerUp(piece, { clientX: to[0], clientY: to[1], pointerId: 1 });
}

/** Centre of a grid cell in client coordinates for the mocked grid rect. */
function cellCenter(
  rect: readonly [number, number, number, number],
  key: string,
): [number, number] {
  const [left, top, width, height] = rect;
  const [row, col] = key.split("-").map(Number) as [number, number];
  return [left + ((col + 0.5) / 3) * width, top + ((row + 0.5) / 3) * height];
}

beforeEach(() => {
  failPreload = false;
  if (typeof globalThis.PointerEvent === "undefined") {
    vi.stubGlobal("PointerEvent", MouseEvent);
  }
  vi.stubGlobal("Image", LoadingImage);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AssemblyPanel", () => {
  it("lays out the 3x3 grid with the body pre-installed and dashed target cells", async () => {
    await openPanel();
    expect(document.querySelector("[data-assembly-grid]")).not.toBeNull();
    expect(document.querySelector("[data-assembly-tray]")).not.toBeNull();
    expect(screen.getByText("工具箱托盘")).toBeInTheDocument();

    const body = document.querySelector('[data-assembly-cell="1-1"]') as HTMLElement;
    expect(body).toHaveClass("is-installed", "is-body");
    expect(screen.getByAltText("机身")).toBeInTheDocument();

    for (const id of MODULE_IDS) {
      const cell = document.querySelector(`[data-assembly-cell="${CELL_OF[id]}"]`) as HTMLElement;
      expect(cell).toHaveClass("is-target");
      expect(cell).not.toHaveClass("is-installed");
      expect(cell.querySelector(".world-assembly-cell-label")).toHaveTextContent(LABEL_OF[id]);
      expect(cell.querySelector(`[data-assembly-socket="${id}"]`)).toBeDisabled();
    }

    // The old round-socket stage DOM is gone.
    expect(document.querySelector(".world-assembly-stage")).toBeNull();
    expect(document.querySelector(".world-assembly-socket")).toBeNull();
    expect(document.querySelector(".world-assembly-installed")).toBeNull();
  });

  it("selects a tray piece on pointerdown and locks it in with its own socket", async () => {
    const { onEvent } = await openPanel();
    const piece = selectPiece(LABEL_OF.cell);
    expect(piece).toHaveAttribute("aria-pressed", "true");

    const socket = screen.getByRole("button", { name: `插槽：${LABEL_OF.cell}` });
    expect(socket).toBeEnabled();
    fireEvent.click(socket);

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ type: "INSTALL", moduleId: "cell" });
    const cell = document.querySelector('[data-assembly-cell="2-2"]') as HTMLElement;
    expect(cell).toHaveClass("is-installed");
    expect(cell).not.toHaveClass("is-target");
    // The installed piece leaves the tray and its socket disappears.
    expect(screen.queryByRole("button", { name: `零件：${LABEL_OF.cell}` })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `插槽：${LABEL_OF.cell}` })).not.toBeInTheDocument();
  });

  it("keeps other modules' sockets disabled and never installs into them", async () => {
    const { onEvent } = await openPanel();
    selectPiece(LABEL_OF.sight);

    const wrong = screen.getByRole("button", { name: `插槽：${LABEL_OF.cell}` });
    expect(wrong).toBeDisabled();
    fireEvent.click(wrong);

    expect(onEvent).not.toHaveBeenCalled();
    expect(document.querySelector('[data-assembly-cell="2-2"]')).toHaveClass("is-target");
    // The piece stays selected in the tray and no mismatch hint appears.
    expect(screen.getByRole("button", { name: `零件：${LABEL_OF.sight}` })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText(/不匹配/)).not.toBeInTheDocument();
    expect(screen.queryByText(/回到托盘/)).not.toBeInTheDocument();
  });

  it("selects a tray piece from click alone (keyboard activation)", async () => {
    await openPanel();
    fireEvent.click(screen.getByRole("button", { name: `零件：${LABEL_OF.sight}` }));
    expect(screen.getByRole("button", { name: `零件：${LABEL_OF.sight}` })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      document.querySelector(`[data-assembly-socket="${MODULE_IDS[0]}"]`),
    ).toBeEnabled();
  });

  it("drags a tray piece into its own cell", async () => {
    const { onEvent } = await openPanel();
    const rect: readonly [number, number, number, number] = [100, 50, 300, 300];
    setGridRect(...rect);
    const piece = screen.getByRole("button", { name: `零件：${LABEL_OF.emitter}` });
    const target = cellCenter(rect, CELL_OF.emitter);
    drag(piece, [120, 70], target);
    expect(onEvent).toHaveBeenCalledWith({ type: "INSTALL", moduleId: "emitter" });
    expect(document.querySelector(`[data-assembly-cell="${CELL_OF.emitter}"]`)).toHaveClass(
      "is-installed",
    );
  });

  it("succeeds at the same cell under different display sizes", async () => {
    const SIZES: readonly (readonly [number, number, number, number])[] = [
      [0, 0, 300, 300],
      [40, 20, 900, 900],
      [15, 60, 450, 600],
    ];
    for (const rect of SIZES) {
      const onClose = vi.fn();
      const { onEvent } = await openPanel(repaired(), { onClose });
      setGridRect(...rect);
      const piece = screen.getByRole("button", { name: `零件：${LABEL_OF.cell}` });
      const center = cellCenter(rect, CELL_OF.cell);
      drag(piece, [center[0] - 30, center[1] - 30], center);
      expect(onEvent).toHaveBeenCalledWith({ type: "INSTALL", moduleId: "cell" });
      expect(onClose).not.toHaveBeenCalled();
      cleanup();
    }
  });

  it("does not consume a piece dropped on another module's cell", async () => {
    const { onEvent } = await openPanel();
    const rect = [100, 50, 300, 300] as const;
    setGridRect(...rect);
    const piece = screen.getByRole("button", { name: `零件：${LABEL_OF.sight}` });
    drag(piece, [120, 70], cellCenter(rect, CELL_OF.cell));
    expect(onEvent).not.toHaveBeenCalled();
    expect(document.querySelector(`[data-assembly-cell="${CELL_OF.cell}"]`)).toHaveClass(
      "is-target",
    );
    expect(screen.getByRole("button", { name: `零件：${LABEL_OF.sight}` })).toBeInTheDocument();
    expect(screen.queryByText(/不匹配/)).not.toBeInTheDocument();
  });

  it("does not consume a piece dropped on a plain cell", async () => {
    const { onEvent } = await openPanel();
    const rect = [100, 50, 300, 300] as const;
    setGridRect(...rect);
    const piece = screen.getByRole("button", { name: `零件：${LABEL_OF.cell}` });
    drag(piece, [120, 70], cellCenter(rect, "0-0"));
    expect(onEvent).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: `零件：${LABEL_OF.cell}` })).toBeInTheDocument();
    expect(screen.queryByText(/回到托盘/)).not.toBeInTheDocument();
  });

  it("cancels a drag on pointercancel and on window blur", async () => {
    const { onEvent } = await openPanel();
    setGridRect(0, 0, 300, 300);
    const piece = screen.getByRole("button", { name: `零件：${LABEL_OF.sight}` });
    fireEvent.pointerDown(piece, { clientX: 150, clientY: 80, pointerId: 1, button: 0 });
    fireEvent.pointerMove(piece, { clientX: 150, clientY: 100, pointerId: 1 });
    fireEvent.pointerCancel(piece, { pointerId: 1 });
    fireEvent.pointerUp(piece, { clientX: 150, clientY: 100, pointerId: 1 });
    expect(onEvent).not.toHaveBeenCalled();

    fireEvent.pointerDown(piece, { clientX: 150, clientY: 80, pointerId: 2, button: 0 });
    fireEvent.pointerMove(piece, { clientX: 150, clientY: 100, pointerId: 2 });
    fireEvent.blur(window);
    fireEvent.pointerUp(piece, { clientX: 150, clientY: 100, pointerId: 2 });
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("plays converge, flash and reveal after the final install", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const onClose = vi.fn();
    const { onEvent } = renderPanel(repaired(), { onClose });
    await act(async () => undefined); // let preloadAssets settle

    for (const id of MODULE_IDS) {
      selectPiece(LABEL_OF[id]);
      fireEvent.click(screen.getByRole("button", { name: `插槽：${LABEL_OF[id]}` }));
    }
    expect(onEvent).toHaveBeenCalledTimes(3);

    // The heading flips as soon as the last cell locks, before the sequence ends.
    expect(screen.getByRole("heading", { name: "Bug Buster 组装完成" })).toBeInTheDocument();
    const grid = document.querySelector("[data-assembly-grid]") as HTMLElement;

    act(() => vi.advanceTimersByTime(60)); // converge
    expect(grid).toHaveClass("is-converging");
    act(() => vi.advanceTimersByTime(650)); // flash
    expect(document.querySelector(".world-assembly-flash")).not.toBeNull();
    expect(document.querySelector("[data-assembly-reveal]")).toBeNull();
    act(() => vi.advanceTimersByTime(480)); // reveal

    const reveal = document.querySelector("[data-assembly-reveal]");
    expect(reveal).not.toBeNull();
    expect(document.querySelector("[data-assembly-grid]")).toBeNull();
    expect(screen.getByText("Bug 清除脉冲炮")).toBeInTheDocument();
    expect(screen.getByText("Bug Buster")).toBeInTheDocument();
    expect(screen.getByAltText("Bug 清除脉冲炮")).toBeInTheDocument();

    const back = screen.getByRole("button", { name: "返回工坊" });
    expect(back).toBeEnabled();
    fireEvent.click(back);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("never emits PLACE_ON_RACK when closed", async () => {
    const onEvent = vi.fn();
    const onClose = vi.fn();
    render(
      <AssemblyPanel
        bundle={bundle}
        quest={installedAll()}
        onEvent={onEvent}
        onClose={onClose}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Bug Buster 组装完成" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalled();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("retries preload failures and keeps the quest", async () => {
    vi.stubGlobal("Image", FlakyImage);
    failPreload = true;
    const onEvent = vi.fn();
    render(
      <AssemblyPanel
        bundle={bundle}
        quest={repaired()}
        onEvent={onEvent}
        onClose={() => undefined}
      />,
    );
    expect(await screen.findByText("组装素材加载失败。")).toBeInTheDocument();
    expect(onEvent).not.toHaveBeenCalled();
    failPreload = false;
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(await screen.findByRole("button", { name: `零件：${LABEL_OF.emitter}` })).toBeInTheDocument();
    expect(onEvent).not.toHaveBeenCalled();
  });
});
