import { vi } from "vitest";

/** jsdom 未实现 IntersectionObserver：framer-motion whileInView（Reveal 等）依赖它的树会直接崩
 *  （在整页测试里会崩进 RR 默认 ErrorBoundary 并冻结后续断言）。桩成空实现即可——不触发进入视口，
 *  仅为让树挂载，非被测行为。调用方在 afterEach 配 vi.unstubAllGlobals() 清理。 */
export function stubIntersectionObserver(): void {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
}

/** Chrome/Edge「屏蔽所有 Cookie」等环境下 sessionStorage 访问器本身抛 SecurityError——
 *  连读 null 都不可得（区别于「存储为空」）。bootPath 若裸访问会在 main.tsx 模块顶层
 *  炸掉后续 render（整站白屏），桩成这种抛错形态回归该场景。
 *  vitest 的 jsdom realm 里裸 sessionStorage 经 globalThis 解析（可能是转发到 window 的
 *  访问器），故 globalThis/window 两个目标都换成抛错 getter（同一对象时天然去重）。
 *  返回还原函数，调用方在用例 finally 里执行，防污染同文件其他用例（beforeEach 有 sessionStorage.clear()）。 */
export function denySessionStorage(): () => void {
  const targets = globalThis === window ? [globalThis] : [globalThis, window];
  const saved = targets.map((target) => ({
    target,
    desc: Object.getOwnPropertyDescriptor(target, "sessionStorage"),
  }));
  const deny = {
    configurable: true,
    get(): never {
      throw new DOMException("Access is denied for this document", "SecurityError");
    },
  };
  for (const { target } of saved) Object.defineProperty(target, "sessionStorage", deny);
  return () => {
    for (const { target, desc } of saved) {
      if (desc) Object.defineProperty(target, "sessionStorage", desc);
      else delete (target as { sessionStorage?: Storage }).sessionStorage;
    }
  };
}

/** denySessionStorage 的 localStorage 版：属性读取本身抛 SecurityError 的形态
 *  （langRedirect 的存储容错必须在这种形态下验证——默认参数在 try 外求值会绕过 try/catch）。
 *  返回还原函数，调用方在用例结束执行。 */
export function denyLocalStorage(): () => void {
  const targets = globalThis === window ? [globalThis] : [globalThis, window];
  const saved = targets.map((target) => ({
    target,
    desc: Object.getOwnPropertyDescriptor(target, "localStorage"),
  }));
  const deny = {
    configurable: true,
    get(): never {
      throw new DOMException("Access is denied for this document", "SecurityError");
    },
  };
  for (const { target } of saved) Object.defineProperty(target, "localStorage", deny);
  return () => {
    for (const { target, desc } of saved) {
      if (desc) Object.defineProperty(target, "localStorage", desc);
      else delete (target as { localStorage?: Storage }).localStorage;
    }
  };
}

/** jsdom 不保证实现 navigator.languages（语言分流检测的首选输入）：桩成固定列表。
 *  实例 own 属性遮蔽原型 getter 即可（与 denySessionStorage 同款 defineProperty 手法）。
 *  返回还原函数，调用方在用例结束（finally/afterEach）执行，防污染同文件其他用例。 */
export function stubNavigatorLanguages(langs: readonly string[]): () => void {
  const saved = Object.getOwnPropertyDescriptor(window.navigator, "languages");
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    get: () => [...langs],
  });
  return () => {
    if (saved) Object.defineProperty(window.navigator, "languages", saved);
    else delete (window.navigator as { languages?: readonly string[] }).languages;
  };
}
