import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserRouter, RouterProvider } from "react-router";
import { BASE, routes } from "@/router";
import { REDIRECT_KEY, restoreBootLocation } from "@/utils/bootPath";
import { LANG_PREF_KEY } from "@/utils/langRedirect";
import { denySessionStorage, stubIntersectionObserver, stubNavigatorLanguages } from "@/test/domStubs";

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

describe("boot 深链恢复（404.html 兜底，GH Pages / CF Pages 同机制，restoreBootLocation + router.navigate）", () => {
  beforeEach(() => {
    // 前一用例的 replace navigate 会改写 jsdom URL，复位到根、清空存储，保证用例独立
    window.history.replaceState(null, "", "/");
    sessionStorage.clear();
    // 根入口（LangEntry）会读手动语言偏好，一并清空防跨用例污染
    localStorage.clear();
    // jsdom 不实现 scrollTo，Silent 掉 ScrollManager 回顶的 "Not implemented" 提示（非被测行为）
    window.scrollTo = () => {};
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("主用例：/en/changelog 深链经 navigate 恢复落位，页面挂载 Changelog 内容而非首页/重定向，redirect 键清除防死循环", async () => {
    const router = bootWith(`${ORIGIN}/en/changelog`);

    // RR 7.18 的 state.location 含 basename（navigate 目标 prependBasename，匹配层再剥）。
    // 此断言同时锁死「navigate 真实发生」——旧 bug（history.replaceState 后 router 不感知）下恒为初始 "/"
    expect(router.state.location.pathname).toBe(`${BASE}/en/changelog`);
    // 地址栏真实落位（静态托管深链的用户可见最终事实）
    expect(window.location.pathname).toBe("/en/changelog");
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
    const router = bootWith(`https://tuvis.app/en/changelog`);

    // 不 render：渲染会触发 "/" → /zh 兜底重定向（非本用例关注点），落位以 router/地址栏状态为准
    // 防线拒绝 → 解析为 "/" → RR 7.18 里 navigate("/") 落在 basename 根（state.location 含 basename）
    expect(router.state.location.pathname).toBe(BASE || "/");
    expect(window.location.pathname).toBe("/");
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("根路径用例：base 自身（带尾斜杠形态）→ 根路径，交由 router 兜底重定向", () => {
    const router = bootWith(`${ORIGIN}/`);

    // 同上不 render：根路径的语言分流兜底是 router 既有行为，此处只锁 restore 落位与清键
    expect(router.state.location.pathname).toBe(BASE || "/");
    expect(window.location.pathname).toBe("/");
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("存储不可用用例：sessionStorage getter 抛 SecurityError（屏蔽 Cookie 环境）——restore 不抛不 navigate，render 照常经 / 兜底落到 /zh 首页", async () => {
    // 复刻生产形态：404.html 已跳回站点根、地址栏停在 base 根（屏蔽 Cookie 下读不到键，无法恢复深链）
    window.history.replaceState(null, "", `${BASE}/`);
    // /zh 首页 Reveal（whileInView）在 jsdom 无 IO 时会崩进 ErrorBoundary（非被测行为），afterEach 统一 unstub
    stubIntersectionObserver();
    const restoreStorage = denySessionStorage();
    // 分流入口决定落到哪个语言首页：检测桩钉 zh，保持本用例 /zh 的断言语义（jsdom 默认 navigator 语言为 en-US）
    const restoreLangs = stubNavigatorLanguages(["zh-CN"]);
    try {
      const router = createBrowserRouter(routes, { basename: BASE });
      const navigateSpy = vi.spyOn(router, "navigate");

      // 复刻 main.tsx 序列：render 前的模块顶层同步调用——旧代码裸访问抛错访问器，此处即
      // SecurityError，后续 createRoot().render 永不执行（整站白屏，首页/深链无一幸免）
      expect(() =>
        restoreBootLocation(router, { base: BASE, origin: window.location.origin }),
      ).not.toThrow();
      // 存储不可用：放弃恢复、不 navigate，交由 router 兜底（Navigate to /zh）
      expect(navigateSpy).not.toHaveBeenCalled();

      // 后续 render 不受影响：basename 根匹配 "/" → /zh 兜底重定向，首页正常挂载（h1 出现）
      render(<RouterProvider router={router} />);
      const main = await screen.findByRole("main");
      expect(within(main).getByRole("heading", { level: 1 })).toBeInTheDocument();
      await waitFor(() => expect(window.location.pathname).toBe(`${BASE}/zh`));
    } finally {
      // 还原访问器：防污染本文件其他用例（beforeEach 有 sessionStorage.clear()）
      restoreLangs();
      restoreStorage();
    }
  });
});

describe("W1/W2 首访语言分流（/ 与 * 入口 LangEntry；合法深链由路由结构豁免，不经此路径）", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    sessionStorage.clear();
    localStorage.clear();
    window.scrollTo = () => {};
    stubIntersectionObserver();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const renderAt = (path: string) => {
    window.history.replaceState(null, "", path);
    render(<RouterProvider router={createBrowserRouter(routes, { basename: BASE })} />);
    return screen.findByRole("main");
  };

  it.each([
    ["zh-CN", "/zh"],
    ["zh-TW", "/zh"],
    ["zh-HK", "/zh"],
    ["en-US", "/en"],
    ["ja", "/en"],
    ["de", "/en"],
  ])("W1 首访无偏好：浏览器语言 %s → %s", async (tag, target) => {
    const restore = stubNavigatorLanguages([tag]);
    try {
      await renderAt("/");
      expect(window.location.pathname).toBe(target);
      expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it("W1 自动检测结果不落盘：分流后 localStorage 无偏好残留", async () => {
    const restore = stubNavigatorLanguages(["en-US"]);
    try {
      await renderAt("/");
      expect(window.location.pathname).toBe("/en");
      expect(localStorage.getItem(LANG_PREF_KEY)).toBeNull();
    } finally {
      restore();
    }
  });

  it("W2 手动偏好优先于浏览器语言：en 偏好 + zh 浏览器 → /en；zh 偏好 + en 浏览器 → /zh", async () => {
    localStorage.setItem(LANG_PREF_KEY, "en");
    let restore = stubNavigatorLanguages(["zh-CN"]);
    try {
      await renderAt("/");
      expect(window.location.pathname).toBe("/en");
    } finally {
      restore();
    }
    cleanup();

    localStorage.setItem(LANG_PREF_KEY, "zh");
    restore = stubNavigatorLanguages(["en-US"]);
    try {
      await renderAt("/");
      expect(window.location.pathname).toBe("/zh");
    } finally {
      restore();
    }
  });

  it("W3 深链直达不改跳：/en/changelog 直访（无 redirect 记录）保持原路径与英文内容", async () => {
    const restore = stubNavigatorLanguages(["zh-CN"]); // 即便浏览器语言是中文
    try {
      await renderAt("/en/changelog");
      expect(window.location.pathname).toBe("/en/changelog");
      const main = await screen.findByRole("main");
      expect(within(main).getByRole("heading", { level: 1 })).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it("非法 lang 段守卫归流：/nonexistent（单段未知，命中 LangLayout 守卫）按检测语言落地", async () => {
    const restore = stubNavigatorLanguages(["en-US"]);
    try {
      await renderAt("/nonexistent");
      expect(window.location.pathname).toBe("/en");
    } finally {
      restore();
    }
  });

  it("catch-all（*）真覆盖：两段以上未知路径同样按检测语言归流", async () => {
    const restore = stubNavigatorLanguages(["zh-CN"]);
    try {
      await renderAt("/xx/yy");
      expect(window.location.pathname).toBe("/zh");
    } finally {
      restore();
    }
  });
});
