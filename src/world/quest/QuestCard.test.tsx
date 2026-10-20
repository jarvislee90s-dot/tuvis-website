import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@/i18n";
import { bundle } from "../testFixtures";
import type { ModuleId } from "../types";
import { INITIAL_QUEST, type QuestState, questReducer } from "./quest";
import { sanitizeQuest } from "./persistence";
import { QuestCard } from "./QuestCard";

/** Build a quest state through the reducer so every step stays reachable. */
function questWith(
  collected: readonly ModuleId[] = [],
  installed: readonly ModuleId[] = [],
  displayedOnRack = false,
  tried = false,
): QuestState {
  let state = INITIAL_QUEST;
  for (const moduleId of collected) state = questReducer(state, { type: "COLLECT", moduleId });
  for (const moduleId of installed) state = questReducer(state, { type: "INSTALL", moduleId });
  if (displayedOnRack) state = questReducer(state, { type: "PLACE_ON_RACK" });
  if (tried) state = questReducer(state, { type: "TRY_WEAPON" });
  return state;
}

describe("QuestCard", () => {
  it("tracks the four module slots with pending status and the help lines", () => {
    render(<QuestCard bundle={bundle} quest={INITIAL_QUEST} />);
    const card = screen.getByRole("status", { name: "任务进度" });
    expect(card).toHaveClass("world-quest-card");
    for (const label of ["Bug Buster 机身", "瞄准模块", "能源匣", "脉冲发射头"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByText("未领取")).toHaveLength(4);
    // How-to-play lines come from content.ui.helpLines.
    expect(screen.getByText("点击地面移动")).toBeInTheDocument();
    expect(screen.getByText("点击物件，兔维斯会走近并互动")).toBeInTheDocument();
    expect(screen.getByText("点击兔维斯，可以让它做动作")).toBeInTheDocument();
  });

  // The "still missing: …" hint line was removed: while gathering, the four
  // slots tell the story and no objective or done line is rendered at all.
  it("keeps the gathering card to the slot list without an objective line", () => {
    render(<QuestCard bundle={bundle} quest={INITIAL_QUEST} />);
    expect(screen.getAllByText("未领取")).toHaveLength(4);
    expect(document.querySelector(".world-quest-card-action")).toBeNull();
    expect(document.querySelector(".world-quest-card-done")).toBeNull();
    expect(screen.queryByText(/还需寻找/)).not.toBeInTheDocument();
  });

  it("marks the seated body as collected and the installed modules in their slots", () => {
    render(
      <QuestCard
        bundle={bundle}
        quest={questWith(["body", "sight", "cell", "emitter"], ["body", "sight"])}
      />,
    );
    // The seated body reads as collected even though the reducer keeps it in
    // installed; sight is the only truly installed slot so far.
    expect(screen.getAllByText("已安装")).toHaveLength(1);
    expect(screen.getAllByText("已领取")).toHaveLength(3);
    const bodySlot = screen.getByText("Bug Buster 机身").closest("li");
    expect(bodySlot).toHaveClass("is-collected");
    expect(bodySlot).toHaveClass("is-installed");
  });

  it("sends the player to the workbench once every module is collected", () => {
    // A live run always carries the seated body (installed length 1); the
    // return phrasing needs a second installed piece, so the fresh full set
    // still says "go", not "return".
    render(<QuestCard bundle={bundle} quest={questWith(["body", "sight", "cell", "emitter"])} />);
    expect(screen.getByText("到工作台进入组装")).toBeInTheDocument();
    expect(screen.queryByText(/还需寻找/)).not.toBeInTheDocument();
  });

  it("shows the plain go-assemble line for a save restored with an empty install list", () => {
    // Only a restored save can hold every module collected with nothing
    // installed — the body pickup auto-installs in a live run.
    const restored = sanitizeQuest({ collected: ["body", "sight", "cell", "emitter"] });
    expect(restored.installed).toEqual([]);
    render(<QuestCard bundle={bundle} quest={restored} />);
    expect(screen.getByText("到工作台进入组装")).toBeInTheDocument();
  });

  it("calls back to the workbench while the assembly is partial", () => {
    render(
      <QuestCard
        bundle={bundle}
        quest={questWith(["body", "sight", "cell", "emitter"], ["body", "sight", "emitter"])}
      />,
    );
    expect(screen.getByText("返回工作台继续组装")).toBeInTheDocument();
  });

  it("prompts the test fire above the slots once every module is installed", () => {
    render(
      <QuestCard
        bundle={bundle}
        quest={questWith(["body", "sight", "cell", "emitter"], ["body", "sight", "cell", "emitter"])}
      />,
    );
    // The green try line above the slots and the objective line below both
    // ask for the test fire; the old rack objective is gone.
    expect(screen.getAllByText("试试武器")).toHaveLength(2);
    expect(document.querySelector(".world-quest-card-done")).toHaveTextContent("试试武器");
    expect(screen.queryByText("到装备架陈列 Bug Buster")).not.toBeInTheDocument();
  });

  // Completion is keyed on weaponTried, no longer on isComplete: a racked but
  // unfired gun still shows the slots and the try prompt.
  it("keeps asking for the test fire after the rack display until the weapon fires", () => {
    render(
      <QuestCard
        bundle={bundle}
        quest={questWith(["body", "sight", "cell", "emitter"], ["body", "sight", "cell", "emitter"], true)}
      />,
    );
    expect(screen.queryByText("主线任务已完成，请继续探索兔维斯世界。")).not.toBeInTheDocument();
    expect(screen.getAllByText("试试武器")).toHaveLength(2);
    expect(screen.getAllByText("已安装")).toHaveLength(3);
  });

  it("shows the completion line once the weapon was test-fired", () => {
    render(
      <QuestCard
        bundle={bundle}
        quest={questWith(
          ["body", "sight", "cell", "emitter"],
          ["body", "sight", "cell", "emitter"],
          true,
          true,
        )}
      />,
    );
    expect(screen.getByText("主线任务已完成，请继续探索兔维斯世界。")).toBeInTheDocument();
    // The slot list, try prompts and objectives make way for the completion line.
    expect(screen.queryByText("试试武器")).not.toBeInTheDocument();
    expect(screen.queryAllByText("已安装")).toHaveLength(0);
    expect(screen.queryAllByText("已领取")).toHaveLength(0);
  });

  it("collapses to a toggle and expands again", () => {
    render(<QuestCard bundle={bundle} quest={INITIAL_QUEST} />);
    fireEvent.click(screen.getByRole("button", { name: "任务" }));

    const collapsed = document.querySelector(".world-quest-card");
    expect(collapsed).not.toBeNull();
    expect(collapsed).toHaveClass("is-collapsed");
    expect(screen.queryByRole("status", { name: "任务进度" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "任务" }));
    expect(screen.getByRole("status", { name: "任务进度" })).toBeInTheDocument();
  });
});
