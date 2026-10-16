import type { ReactNode } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import "@/i18n"; // 侧效应导入：TopBar 的 useTranslation 需要全局 i18next 资源
import { ClaudeTui } from "@/demo/ClaudeTui";
import { CodexAppWindow } from "@/demo/CodexAppWindow";
import { RemoteBoard } from "@/demo/remote/RemoteBoard";
import { Brand, brandName, brandWord } from "./Brand";
import { TopBar } from "./layout/TopBar";

/** D1 品牌词裁决：/zh 页「兔维斯 Tuvis」、/en 页仅「Tuvis」（/en 零 CJK 红线的一部分）。
 *  品牌词是单值按语言切换的数据，不走 i18n 键——由 brandName 纯函数 + Brand 组件承载。
 *  Brand 读 useLang（useParams 归一，@/i18n 共享入口——原 demo 侧钩子已迁此），须挂在 /:lang 路由下。 */
function mountAt(entry: string, el: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/:lang" element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("brandName：品牌词纯函数（D1）", () => {
  it("zh → 「兔维斯 Tuvis」", () => {
    expect(brandName("zh")).toBe("兔维斯 Tuvis");
  });

  it("en → 「Tuvis」", () => {
    expect(brandName("en")).toBe("Tuvis");
  });
});

describe("brandWord：品牌裸词", () => {
  it("zh → 「兔维斯」、en → 「Tuvis」", () => {
    expect(brandWord("zh")).toBe("兔维斯");
    expect(brandWord("en")).toBe("Tuvis");
  });
});

describe("Brand：按路由语言渲染品牌名", () => {
  afterEach(cleanup);

  it("/zh：文本为「兔维斯 Tuvis」，Tuvis 走次级色 span", () => {
    mountAt("/zh", <div data-testid="host"><Brand /></div>);
    const host = screen.getByTestId("host");
    expect(host.textContent).toBe("兔维斯 Tuvis");
    expect(screen.getByText("Tuvis")).toHaveClass("text-inkdim");
  });

  it("/en：文本恰为「Tuvis」，零「兔维斯」", () => {
    mountAt("/en", <div data-testid="host"><Brand /></div>);
    const host = screen.getByTestId("host");
    expect(host.textContent).toBe("Tuvis");
    expect(host.textContent).not.toContain("兔维斯");
  });

  it("非法 lang（/fr）：归一后回退 zh 品牌名", () => {
    mountAt("/fr", <div data-testid="host"><Brand /></div>);
    expect(screen.getByTestId("host").textContent).toBe("兔维斯 Tuvis");
  });
});

describe("TopBar 品牌位：Link 内嵌 Brand", () => {
  afterEach(cleanup);

  it("/zh：导航品牌位文本仍为「兔维斯 Tuvis」", () => {
    mountAt("/zh", <TopBar />);
    const brandLink = within(screen.getByRole("navigation")).getByText(/兔维斯/);
    expect(brandLink.textContent).toBe("兔维斯 Tuvis");
  });

  it("/en：导航品牌位零「兔维斯」", () => {
    mountAt("/en", <TopBar />);
    const nav = within(screen.getByRole("navigation"));
    // M2 正向断言：/en 品牌位必须实际渲染 Tuvis（防品牌位被删/渲染空转时红线断言假绿）
    expect(nav.getByText("Tuvis")).toBeInTheDocument();
    expect(nav.queryByText(/兔维斯/)).toBeNull();
  });
});

/** Minor-2 红线锁：品牌触点 /en 渲染零「兔维斯」（AboutWindow 不加——求 Star 横幅整句中文按
 *  批次 3 COPY 任务处理，笼统断言必挂；其品牌位走 brandName 已由纯函数单测覆盖）。 */
describe("品牌触点 /en 零「兔维斯」", () => {
  afterEach(cleanup);

  it("RemoteBoard 品牌行取裸词后无「兔维斯」", () => {
    const { container } = mountAt("/en", <RemoteBoard />);
    expect(container.textContent).toContain("Tuvis");
    expect(container.textContent).not.toContain("兔维斯");
  });

  it("ClaudeTui 默认回复句内品牌词取裸词后无「兔维斯」", () => {
    const { container } = mountAt("/en", <ClaudeTui />);
    // B3-T5 重锚：默认回复整句 COPY 化后 en 为英文——锚 = 品牌 token + 英文尾词（原「Tuvis桌面端」已废）
    expect(container.textContent).toContain("(Tuvis desktop app)");
    expect(container.textContent).not.toContain("兔维斯");
  });

  it("CodexAppWindow 说明区品牌词取裸词后无「兔维斯」", () => {
    const { container } = mountAt("/en", <CodexAppWindow />);
    // TODO(B3 COPY)：锚点 = 品牌 token + 待 COPY 尾词（整句 COPY 化后须重锚）
    expect(container.textContent).toContain("Tuvis官网");
    expect(container.textContent).not.toContain("兔维斯");
  });
});

/** B3-T5 重锚：COPY 化后 /zh 文案逐字保留——品牌 token 仍须以中文形态出现（防翻译顺手改稿） */
describe("COPY 化窗·/zh 品牌 token 锚点（B3-T5）", () => {
  afterEach(cleanup);

  it("ClaudeTui 默认回复（zh）显「兔维斯桌面端」", () => {
    const { container } = mountAt("/zh", <ClaudeTui />);
    expect(container.textContent).toContain("（兔维斯桌面端）");
  });
});
