import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBrowserRouter, RouterProvider } from "react-router";
import { BASE, routes } from "@/router";
import { REDIRECT_KEY, restoreBootLocation } from "@/utils/bootPath";

// ---- 测试环境 realm 桥接（仅本文件）----
// RR 真实导航时 new AbortController()（= jsdom 版）并把 signal 交给 new Request(url, { signal })；
// jsdom 不带 fetch/Request，new Request 落到 Node undici——其品牌校验（signal instanceof undici AbortSignal）
// 不认 jsdom 信号，navigate 直接 TypeError（真浏览器同 realm 无此问题）。
// 治不了信号侧（undici 不可 import、默认 signal 也走全局 AbortController，环境里不存在 undici 品牌实例），
// 只能治请求侧：包一层 Request，真实构造时剥掉 signal 绕开品牌校验，再把调用方 signal 注回实例属性——
// RR 的中断簿记（signal.aborted / addEventListener）在 jsdom signal 上原生可用，测试内也从不触发 abort。
const UndiciRequest = globalThis.Request;
class CompatRequest {
  constructor(input: string | URL, init?: RequestInit) {
    const { signal, ...rest } = init ?? {};
    const req = new UndiciRequest(input, rest);
    if (signal) {
      Object.defineProperty(req, "signal", { value: signal });
    }
    return req;
  }
}
globalThis.Request = CompatRequest as unknown as typeof Request;

// 404.html 注入脚本的存储键（scripts/make-404.mjs 侧是字面量，这里引同一常量）
const KEY = REDIRECT_KEY;
// vitest jsdom 默认 URL 带端口（http://localhost:3000），预置 URL 必须与其实同源——
// 写死 http://localhost 会被 resolveBootPath 的 origin 防线降级为 "/"
const ORIGIN = window.location.origin;

/** 复刻真实 boot 序列：404.html 存原始 URL → 建路由 → render 前 restoreBootLocation 恢复深链 */
function bootWith(rawRedirect: string) {
  sessionStorage.setItem(KEY, rawRedirect);
  const router = createBrowserRouter(routes, { basename: BASE });
  // 有意传 BASE（无尾斜杠）；生产 main.tsx 传 BASE_URL（带尾斜杠）——尾斜杠归一化分支由 bootPath.test.ts 覆盖
  restoreBootLocation(router, { base: BASE, origin: window.location.origin });
  return router;
}

describe("boot 深链恢复（GH Pages 404 兜底，restoreBootLocation + router.navigate）", () => {
  beforeEach(() => {
    // 前一用例的 replace navigate 会改写 jsdom URL，复位到根、清空存储，保证用例独立
    window.history.replaceState(null, "", "/");
    sessionStorage.clear();
    // jsdom 不实现 scrollTo，Silent 掉 ScrollManager 回顶的 "Not implemented" 提示（非被测行为）
    window.scrollTo = () => {};
  });
  afterEach(cleanup);

  it("主用例：/en/changelog 深链经 navigate 恢复落位，页面挂载 Changelog 内容而非首页/重定向，redirect 键清除防死循环", async () => {
    const router = bootWith(`${ORIGIN}/tuvis-website/en/changelog`);

    // RR 7.18 的 state.location 含 basename（navigate 目标 prependBasename，匹配层再剥）。
    // 此断言同时锁死「navigate 真实发生」——旧 bug（history.replaceState 后 router 不感知）下恒为初始 "/"
    expect(router.state.location.pathname).toBe(`${BASE}/en/changelog`);
    // 地址栏真实落位（GH Pages 深链的用户可见最终事实）
    expect(window.location.pathname).toBe("/tuvis-website/en/changelog");
    // 消费即清除，防 404→根→404 死循环
    expect(sessionStorage.getItem(KEY)).toBeNull();

    render(<RouterProvider router={router} />);
    const main = await screen.findByRole("main");
    // 语言无关的结构断言：版本号 h2（v{semver}）是 ChangelogPage 特有内容，首页/重定向目标页均没有
    const h2s = within(main).getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThan(0);
    expect(h2s.some((h) => /^v\d/.test(h.textContent ?? ""))).toBe(true);
    expect(within(main).getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("反向用例：跨 origin 的预置 URL 被 origin 防线拒绝——落回 basename 根，键同样清除", () => {
    const router = bootWith(`https://jarvislee90s-dot.github.io/tuvis-website/en/changelog`);

    // 不 render：渲染会触发 "/" → /zh 兜底重定向（非本用例关注点），落位以 router/地址栏状态为准
    // 防线拒绝 → 解析为 "/" → RR 7.18 里 navigate("/") 落在 basename 根（state.location 含 basename）
    expect(router.state.location.pathname).toBe(BASE);
    expect(window.location.pathname).toBe("/tuvis-website");
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("根路径用例：base 自身（带尾斜杠形态）→ 根路径，交由 router 兜底重定向", () => {
    const router = bootWith(`${ORIGIN}/tuvis-website/`);

    // 同上不 render：根路径的兜底重定向（→ /zh）是 router 既有行为，此处只锁 restore 落位与清键
    expect(router.state.location.pathname).toBe(BASE);
    expect(window.location.pathname).toBe("/tuvis-website");
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });
});
