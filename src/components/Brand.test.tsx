import type { ReactNode } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import "@/i18n"; // 侧效应导入：TopBar 的 useTranslation 需要全局 i18next 资源
import { ClaudeTui } from "@/demo/ClaudeTui";
import { CodexAppWindow } from "@/demo/CodexAppWindow";
import { RemoteBoard } from "@/demo/remote/RemoteBoard";
import { AboutWindow } from "@/home/AboutWindow";
import { Brand, brandName, brandWord } from "./Brand";
import { TopBar } from "./layout/TopBar";

/** D1 品牌词裁决：/zh 页「兔维斯 Tuvis」、/en 页仅「Tuvis」（/en 零 CJK 红线的一部分）。
 *  品牌词是单值按语言切换的数据，不走 i18n 键——由 brandName 纯函数 + Brand 组件承载。
 *  Brand 读 useLang（useParams 归一，@/i18n 共享入口——原 demo 侧钩子已迁此），须挂在 /:lang 路由下。
 *  约定：生产代码的 data-testid 仅限红线锚点（如 about-brand）——普通断言按角色/文本取元素，不新增测试专用 id。 */
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

/** Minor-2 红线锁：品牌触点 /en 渲染零「兔维斯」；AboutWindow 整窗 COPY 化（B3-T7）后已可纳入，
 *  见下方独立 describe（品牌位元素级双向断言 + 整窗零 CJK）。 */
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
    // B3-T5 重锚：说明区整句 COPY 化后 en 为英文——锚 = 品牌 token + 英文尾词（原「Tuvis官网」已废）
    expect(container.textContent).toContain("the Tuvis website");
    expect(container.textContent).not.toContain("兔维斯");
  });
});

/** B3-T7 M1（B3-T1 质量审查遗留）：AboutWindow 整窗 COPY 化后纳入品牌红线——
 *  品牌位加 data-testid="about-brand" 做元素级双向锁（/en 恰「Tuvis」、/zh 恰「兔维斯 Tuvis」），
 *  /en 再断言整窗零 CJK（innerHTML 连 aria-label/title 等属性一起扫，防「关闭提醒」类漏网）。 */
describe("AboutWindow 品牌红线（B3-T7 M1）", () => {
  afterEach(cleanup);

  it("/en：品牌位元素恰为「Tuvis」", () => {
    mountAt("/en", <AboutWindow />);
    expect(screen.getByTestId("about-brand").textContent).toBe("Tuvis");
  });

  it("/zh：品牌位元素恰为「兔维斯 Tuvis」，求 Star 横幅逐字不变", () => {
    const { container } = mountAt("/zh", <AboutWindow />);
    expect(screen.getByTestId("about-brand").textContent).toBe("兔维斯 Tuvis");
    expect(container.textContent).toContain("如果兔维斯帮到了你，请在 GitHub 点个 Star，这对我们意义重大");
  });

  it("/en：整窗零 CJK（含属性），且求 Star 横幅品牌词为裸词", () => {
    const { container } = mountAt("/en", <AboutWindow />);
    // B3-T8：字符类对齐 parity ②b（CJK 标点 + 全角区；不含曲引号 \u2018-\u201d，防误伤英文撇号）
    expect(container.innerHTML).not.toMatch(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/);
    // 尾随空格 DOM 锚点：newVersion en 以空格结尾，版本号 span 直连后仍分词（「detected: v0.5.x」）
    expect(container.textContent).toContain("detected: v");
    expect(container.textContent).toContain("If Tuvis has helped you");
  });
});

/** B3-T5 重锚：COPY 化后 /zh 文案逐字保留——品牌 token 仍须以中文形态出现（防翻译顺手改稿） */
describe("COPY 化窗·/zh 品牌 token 锚点（B3-T5）", () => {
  afterEach(cleanup);

  it("ClaudeTui 默认回复（zh）显「兔维斯桌面端」", () => {
    const { container } = mountAt("/zh", <ClaudeTui />);
    expect(container.textContent).toContain("（兔维斯桌面端）");
  });

  it("CodexAppWindow 说明区（zh）显「这个仓库是兔维斯官网」", () => {
    const { container } = mountAt("/zh", <CodexAppWindow />);
    expect(container.textContent).toContain("这个仓库是兔维斯官网");
  });
});
