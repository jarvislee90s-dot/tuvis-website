import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@/i18n";
import { bundle } from "../testFixtures";
import { INITIAL_QUEST, MODULE_IDS, questReducer, type QuestState } from "./quest";
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

function setStageRect(width: number, height: number, left = 0, top = 0) {
  const stage = document.querySelector("[data-assembly-stage]") as HTMLElement;
  stage.getBoundingClientRect = () =>
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
  return stage;
}

async function openPanel(quest: QuestState = repaired(), waitForPiece = true) {
  const onEvent = vi.fn();
  const onClose = vi.fn();
  render(<AssemblyPanel bundle={bundle} quest={quest} onEvent={onEvent} onClose={onClose} />);
  if (waitForPiece) {
    await screen.findByRole("button", { name: "零件：瞄准模块" });
  } else {
    await screen.findByRole("heading", { name: "Bug Buster 组装完成" });
  }
  return { onEvent, onClose };
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

beforeEach(() => {
  failPreload = false;
  if (typeof globalThis.PointerEvent === "undefined") {
    vi.stubGlobal("PointerEvent", MouseEvent);
  }
  vi.stubGlobal("Image", LoadingImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AssemblyPanel", () => {
  it("installs a module by selecting the piece and then its socket", async () => {
    const { onEvent } = await openPanel();
    fireEvent.click(screen.getByRole("button", { name: "零件：能源匣" }));
    fireEvent.click(screen.getByRole("button", { name: "插槽：脉冲发射头" }));
    expect(onEvent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "插槽：能源匣" }));
    expect(onEvent).toHaveBeenCalledWith({ type: "INSTALL", moduleId: "cell" });
  });

  it("does not install the selected piece into another module's socket", async () => {
    const { onEvent } = await openPanel();
    fireEvent.click(screen.getByRole("button", { name: "零件：瞄准模块" }));
    fireEvent.click(screen.getByRole("button", { name: "插槽：能源匣" }));
    expect(onEvent).not.toHaveBeenCalled();
    expect(screen.getByText("这个插槽与当前零件不匹配。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "零件：瞄准模块" })).toBeInTheDocument();
  });

  // Proxy for the CSS class that raises sockets above overlapping tray pieces.
  it("marks the stage with has-selection while a piece is selected", async () => {
    await openPanel();
    const stage = document.querySelector("[data-assembly-stage]") as HTMLElement;
    expect(stage).not.toHaveClass("has-selection");
    fireEvent.click(screen.getByRole("button", { name: "零件：瞄准模块" }));
    expect(stage).toHaveClass("has-selection");
  });

  it("drags a piece into the matching socket", async () => {
    const { onEvent } = await openPanel();
    setStageRect(550, 360);
    const piece = screen.getByRole("button", { name: "零件：脉冲发射头" });
    drag(piece, [295 * 0.5, 335.5 * 0.5], [500 * 0.5, 345 * 0.5]);
    expect(onEvent).toHaveBeenCalledWith({ type: "INSTALL", moduleId: "emitter" });
  });

  it("succeeds at the same socket under different display sizes", async () => {
    for (const [width, height] of [[550, 360], [1100, 720], [733, 480]] as const) {
      const { onEvent, onClose } = await openPanel();
      const stage = setStageRect(width, height, 50, 20);
      expect(stage).toBeTruthy();
      const piece = screen.getByRole("button", { name: "零件：能源匣" });
      const sx = width / 1100;
      const sy = height / 720;
      const pieceCenter = [941, 497.5];
      const socket = [895, 500];
      drag(
        piece,
        [50 + pieceCenter[0] * sx, 20 + pieceCenter[1] * sy],
        [50 + socket[0] * sx, 20 + socket[1] * sy],
      );
      expect(onEvent).toHaveBeenCalledWith({ type: "INSTALL", moduleId: "cell" });
      expect(onClose).not.toHaveBeenCalled();
      cleanup();
    }
  });

  it("does not consume a module when dropped on the wrong socket", async () => {
    const { onEvent } = await openPanel();
    setStageRect(550, 360);
    const piece = screen.getByRole("button", { name: "零件：能源匣" });
    drag(piece, [941 * 0.5, 497.5 * 0.5], [730 * 0.5, 185 * 0.5]);
    expect(onEvent).not.toHaveBeenCalled();
    expect(screen.getByText("没有对准插槽，零件已回到托盘。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "零件：能源匣" })).toBeInTheDocument();
  });

  it("cancels a drag on pointercancel and on window blur", async () => {
    const { onEvent } = await openPanel();
    setStageRect(550, 360);
    const piece = screen.getByRole("button", { name: "零件：瞄准模块" });
    fireEvent.pointerDown(piece, { clientX: 380, clientY: 76, pointerId: 1, button: 0 });
    fireEvent.pointerMove(piece, { clientX: 365, clientY: 92, pointerId: 1 });
    fireEvent.pointerCancel(piece, { pointerId: 1 });
    fireEvent.pointerUp(piece, { clientX: 365, clientY: 92, pointerId: 1 });
    expect(onEvent).not.toHaveBeenCalled();

    fireEvent.pointerDown(piece, { clientX: 380, clientY: 76, pointerId: 2, button: 0 });
    fireEvent.pointerMove(piece, { clientX: 365, clientY: 92, pointerId: 2 });
    fireEvent.blur(window);
    fireEvent.pointerUp(piece, { clientX: 365, clientY: 92, pointerId: 2 });
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("shows the complete product after all three installs", async () => {
    await openPanel(installedAll(), false);
    expect(screen.getByRole("heading", { name: "Bug Buster 组装完成" })).toBeInTheDocument();
    expect(screen.getByAltText("Bug Buster 成品")).toBeInTheDocument();
  });

  it("never emits PLACE_ON_RACK when closed", async () => {
    const { onEvent, onClose } = await openPanel(installedAll(), false);
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
    expect(await screen.findByRole("button", { name: "零件：脉冲发射头" })).toBeInTheDocument();
    expect(onEvent).not.toHaveBeenCalled();
  });
});
