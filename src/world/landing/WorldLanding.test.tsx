import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@/i18n";
import { bundle } from "../testFixtures";
import { WorldLanding } from "./WorldLanding";

function renderLanding() {
  return render(
    <MemoryRouter>
      <WorldLanding bundle={bundle} />
    </MemoryRouter>,
  );
}

describe("WorldLanding", () => {
  beforeEach(() => {
    renderLanding();
  });

  it("renders W-01 through W-06 with real content", () => {
    expect(screen.getByRole("heading", { level: 1, name: /Tuvis World｜\s*兔维斯世界/ })).toBeInTheDocument();
    for (const name of ["差异探测雷达", "Bug 清除脉冲炮", "代码编织终端", "代码融合棱镜"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    for (const title of ["完美的一天，差一点", "谁动了我的零件？", "最厉害的武器"]) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("heading", { name: "兔维斯的四件装备" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "回路城与发明工坊" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "让 Bug Buster 重新上线" })).toBeInTheDocument();
    expect(document.querySelectorAll("section")).toHaveLength(6);
  });

  it("points both workshop entries at the same route", () => {
    const links = screen.getAllByRole("link", { name: "进入兔维斯工坊" });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/zh/world/workshop");
  });

  it("expands a story teaser in a dialog and restores focus on close", () => {
    // The story buttons went from "查看简介" to the teaser wording.
    const triggers = screen.getAllByRole("button", { name: "故事预告" });
    expect(triggers).toHaveLength(bundle.content.stories.length);
    const trigger = triggers[0];
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(bundle.content.stories[0].summary)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes the dialog with Escape", () => {
    fireEvent.click(screen.getAllByRole("button", { name: "故事预告" })[1]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("switches the unified equipment detail when a card is selected", () => {
    fireEvent.click(screen.getByRole("button", { name: /代码融合棱镜/ }));
    expect(screen.getByText(bundle.content.equipment[3].analogy)).toBeInTheDocument();
  });
});
