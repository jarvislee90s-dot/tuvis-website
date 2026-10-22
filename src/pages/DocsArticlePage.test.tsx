import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserRouter, RouterProvider } from "react-router";
import { BASE, routes } from "@/router";

// 真值 MD 形态样例：覆盖需要补语言段/原样放行/章节互链/外链的各类链接
const MD_EN = [
  "# Overview",
  "",
  "Open the [interactive demo](/demo).",
  "Scoped links like [zh demo](/zh/demo) stay untouched.",
  "Next [chapter link](02-installation.md).",
  "External [GitHub repo](https://github.com/jarvislee90s-dot/tuvis).",
].join("\n");

const MD_ZH = "# 总览\n\n想先亲手体验一下交互？打开[交互演示](/demo)，无需安装。\n";

function renderAt(path: string) {
  window.history.replaceState(null, "", path);
  render(<RouterProvider router={createBrowserRouter(routes, { basename: BASE })} />);
}

describe("手册站内链接渲染（真值 MD → 站内路由）", () => {
  beforeEach(() => {
    // DocsArticlePage 经 fetch 拉手册 MD：按语言桩成固定样例（绕开真实网络）
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: unknown) => {
        const en = String(input).includes("/manual/en/");
        return { ok: true, text: async () => (en ? MD_EN : MD_ZH) };
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("review P2 修复：根绝对链接 /demo 在 en 页补语言段 → /en/demo", async () => {
    renderAt("/en/docs/01-overview");
    const link = await screen.findByRole("link", { name: "interactive demo" });
    expect(link.getAttribute("href")).toBe("/en/demo");
  });

  it("zh 页同款链接（中文手册同坏）→ /zh/demo", async () => {
    renderAt("/zh/docs/01-overview");
    const link = await screen.findByRole("link", { name: "交互演示" });
    expect(link.getAttribute("href")).toBe("/zh/demo");
  });

  it("已带语言段的链接（/zh/…）原样放行，不二次拼接", async () => {
    renderAt("/en/docs/01-overview");
    const link = await screen.findByRole("link", { name: "zh demo" });
    expect(link.getAttribute("href")).toBe("/zh/demo");
  });

  it("章节 .md 互链既有行为不回归：→ /en/docs/<slug> 站内路由", async () => {
    renderAt("/en/docs/01-overview");
    const link = await screen.findByRole("link", { name: "chapter link" });
    expect(link.getAttribute("href")).toBe("/en/docs/02-installation");
  });

  it("外部 http(s) 链接原样并开新窗", async () => {
    renderAt("/en/docs/01-overview");
    const link = await screen.findByRole("link", { name: "GitHub repo" });
    expect(link.getAttribute("href")).toBe("https://github.com/jarvislee90s-dot/tuvis");
    expect(link.getAttribute("target")).toBe("_blank");
  });
});
