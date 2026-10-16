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
