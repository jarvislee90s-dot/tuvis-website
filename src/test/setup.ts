import "@testing-library/jest-dom/vitest";

// Node 26+ 在 globalThis 上自带实验性 localStorage 访问器（未提供 --localstorage-file
// 时返回 undefined）。vitest 的 getWindowKeys 对全局已存在的 key 不做 jsdom 回填，
// 导致 jsdom 环境下 localStorage 缺失。这里从 vitest 安装的 jsdom 实例显式回填。
if (typeof globalThis.localStorage === "undefined") {
  const dom = (globalThis as { jsdom?: { window: Window } }).jsdom;
  const storage = dom?.window.localStorage;
  if (storage) {
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });
  }
}
