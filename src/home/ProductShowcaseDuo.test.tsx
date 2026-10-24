import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { applyLang } from "@/i18n";
import { stubIntersectionObserver } from "@/test/domStubs";
import { ProductShowcase } from "./ProductShowcase";

/** ProductShowcase 下方「现已适配 iPhone Duo.」嵌入块（iframe 嵌 /duo/）：
 *  iframe src 的 lang 段读路由语言（useLang，URL 权威），标题/注记读 i18n 键
 *  （useTranslation）——两条语言通道必须分别驱动，故用例内 applyLang 与挂载路由
 *  语言保持一致。路由包装沿用 Hero.test 的 mountAt（组件内 Link/navigate 需 Router）。 */
function mountAt(entry: string, el: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/:lang" element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProductShowcase：iPhone Duo 嵌入块", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("/zh：标题按 duoHeading 渲染，iframe src/lang 段、title、lazy 与注记齐备，且全树恰一个 iframe", () => {
    stubIntersectionObserver(); // Reveal（whileInView）需要（jsdom 无 IO）
    applyLang("zh");
    const { container } = mountAt("/zh", <ProductShowcase />);

    expect(screen.getByRole("heading", { level: 3, name: "现已适配 iPhone Duo." })).toBeInTheDocument();

    const frame = screen.getByTitle("iPhone Duo 开合演示——可拖动进度条或点击播放");
    expect(frame).toHaveAttribute("src", "/duo/index.html?embed=1&lang=zh");
    expect(frame).toHaveAttribute("loading", "lazy");
    // 响应式高度与限宽（背景规格锚定，防样式回退）
    expect(frame).toHaveClass("max-w-5xl", "h-[620px]", "sm:h-[700px]", "md:h-[875px]", "lg:h-[880px]");

    expect(screen.getByText(/Apple Inc\. 商标/)).toBeInTheDocument();
    // 防重复渲染：嵌入块 iframe 全树仅此一个
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("/en：iframe src 的 lang 段与标题/注记文案随 en 切换", () => {
    stubIntersectionObserver();
    applyLang("en");
    mountAt("/en", <ProductShowcase />);

    expect(screen.getByRole("heading", { level: 3, name: "Now adapted for iPhone Duo." })).toBeInTheDocument();

    const frame = screen.getByTitle("iPhone Duo unfold demo — drag the slider or press play");
    expect(frame).toHaveAttribute("src", "/duo/index.html?embed=1&lang=en");
    expect(screen.getByText(/trademark of Apple Inc\./)).toBeInTheDocument();
  });
});
