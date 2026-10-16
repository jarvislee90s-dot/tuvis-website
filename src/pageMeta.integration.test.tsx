import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { BASE, routes } from "@/router";
import { stubIntersectionObserver } from "@/test/domStubs";

/** 页签快验：真实路由表 + 真实页面组件，锁四页面 × 双语言的 document.title。
 *  meta description 由 usePageMeta 单测覆盖，这里不再重复断言。 */
function mountAt(path: string) {
  const router = createMemoryRouter(routes, {
    basename: BASE,
    initialEntries: [`${BASE}${path}`],
  });
  render(<RouterProvider router={router} />);
}

describe("页面接线：四页面真实路由渲染后页签标题正确", () => {
  beforeEach(() => {
    // jsdom 不实现 scrollTo，Silent 掉 ScrollManager 回顶提示（非被测行为）
    window.scrollTo = () => {};
    // 首页 Reveal（whileInView）缺 IO 时树会崩进 RR 默认 ErrorBoundary（标题自此冻结）
    stubIntersectionObserver();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    ["/zh", "兔维斯 Tuvis —— 你的桌面多 Agent 指挥台"],
    ["/en", "Tuvis — Your Desktop Multi-Agent Command Deck"],
  ])("首页 %s → title %j", async (path, expected) => {
    mountAt(path);
    await waitFor(() => expect(document.title).toBe(expected), { timeout: 3000 });
  });

  it.each([
    ["/zh/demo", "交互演示 —— 兔维斯 Tuvis"],
    ["/en/demo", "Interactive Demo — Tuvis"],
  ])("演示页 %s → title %j", async (path, expected) => {
    mountAt(path);
    await waitFor(() => expect(document.title).toBe(expected), { timeout: 3000 });
  });

  it.each([
    ["/zh/changelog", "更新日志 —— 兔维斯 Tuvis"],
    ["/en/changelog", "Changelog — Tuvis"],
  ])("更新日志页 %s → title %j", async (path, expected) => {
    mountAt(path);
    await waitFor(() => expect(document.title).toBe(expected), { timeout: 3000 });
  });

  it("手册页标题取自 manual.ts 元数据且随 URL 语言切换（不走 i18n，页签统一带品牌后缀）", async () => {
    mountAt("/zh/docs/01-overview");
    await waitFor(() => expect(document.title).toBe("兔维斯是什么 — Tuvis"), { timeout: 3000 });
    cleanup();

    mountAt("/en/docs/01-overview");
    await waitFor(() => expect(document.title).toBe("What is Tuvis — Tuvis"), { timeout: 3000 });
  });
});
