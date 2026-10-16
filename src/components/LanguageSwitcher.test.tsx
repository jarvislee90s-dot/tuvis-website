import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** D8：/en 全站零 CJK——切换按钮在 /en 显示 ZH（原「中文」），aria 统一英文。
 *  组件读 useParams().lang，须挂在 /:lang 路由下。 */
function mountAt(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/:lang" element={<LanguageSwitcher />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LanguageSwitcher：ZH/EN 文案与英文 aria", () => {
  afterEach(cleanup);

  it("/en 场景：按钮显示 ZH，aria 为 switch language to Chinese (ZH)", () => {
    mountAt("/en");
    expect(screen.getByRole("button", { name: "switch language to Chinese (ZH)" })).toHaveTextContent("ZH");
  });

  it("/zh 场景：按钮显示 EN，aria 为 switch language to English (EN)", () => {
    mountAt("/zh");
    expect(screen.getByRole("button", { name: "switch language to English (EN)" })).toHaveTextContent("EN");
  });
});
