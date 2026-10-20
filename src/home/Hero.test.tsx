import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { applyLang } from "@/i18n";
import { stubIntersectionObserver } from "@/test/domStubs";
import { Hero } from "./Hero";

/** I1 回归锚点：H1 尾巴按语言条件渲染——/en 恰为「Tuvis」（hero.title 已含品牌，再补尾巴曾成「Tuvis Tuvis」）、
 *  /zh 保持改前形态「兔维斯 Tuvis」。H1 正文读 i18n 键（用例内 applyLang 对齐），尾巴读路由语言（useLang）。 */
function mountAt(entry: string, el: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/:lang" element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Hero H1 品牌尾巴（I1）", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("/zh：H1 恰为「兔维斯 Tuvis」，Tuvis 走次级色 span（改前形态逐字不变）", () => {
    stubIntersectionObserver();
    applyLang("zh");
    mountAt("/zh", <Hero />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("兔维斯 Tuvis");
    expect(screen.getByText("Tuvis")).toHaveClass("text-inkdim");
  });

  it("/en：H1 恰为「Tuvis」，不再重复成「Tuvis Tuvis」", () => {
    stubIntersectionObserver();
    applyLang("en");
    mountAt("/en", <Hero />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Tuvis");
    // 尾巴 span 不渲染（而非仅文本恰巧相等）：/en 补尾巴即 I1 回归
    expect(h1.querySelector("span.text-inkdim")).toBeNull();
  });
});
