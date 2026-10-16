import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "i18next";
import "@/i18n"; // 侧效应导入：初始化全局 i18next 资源（组件树外的 useTranslation 依赖它）
import { stubIntersectionObserver } from "@/test/domStubs";
import { CompatMatrix } from "./CompatMatrix";

/** A5 noteEn 通道 + A3 表头 i18n 组件级测试。
 *  数据 mock 为最小合法结构（1 组 3 行）：行甲 note+noteEn 双有 → title/aria 走 noteEn；
 *  行乙仅 note → 回退 note；行丙 noteEn 空串 → 视同缺失回退 note（防 title 空串/aria 分叉）。
 *  vi.mock 工厂不可引用外部变量，数据经 vi.hoisted 提升。 */
const mockCap = vi.hoisted(() => ({
  updated: "2026-01-01",
  legend: {},
  tools: ["claude"],
  groups: [
    {
      key: "g1",
      name: "组一",
      rows: [
        { name: "行甲", key: "a", support: { claude: "yes" }, note: "中文备注甲", noteEn: "English note A" },
        { name: "行乙", key: "b", support: { claude: "yes" }, note: "中文备注乙" },
        { name: "行丙", key: "c", support: { claude: "yes" }, note: "中文备注丙", noteEn: "" },
      ],
    },
  ],
}));
vi.mock("@/content/capabilities.json", () => ({ default: mockCap }));

/** 行名定位所在 <tr>，取第 2 个单元格（首工具列）上的悬浮备注。 */
function noteCellOf(rowName: string): HTMLElement {
  const tr = screen.getByText(rowName).closest("tr");
  if (!tr) throw new Error(`row ${rowName} not found`);
  return within(tr).getAllByRole("cell")[1];
}

describe("CompatMatrix：noteEn 通道与矩阵表头", () => {
  beforeEach(async () => {
    stubIntersectionObserver(); // Reveal（whileInView）需要（jsdom 无 IO）
    await i18n.changeLanguage("zh");
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("行有 noteEn 时单元格 title/aria-label 取 noteEn", () => {
    render(<CompatMatrix />);
    const cell = noteCellOf("行甲");
    expect(cell).toHaveAttribute("title", "English note A");
    expect(cell).toHaveAttribute("aria-label", expect.stringContaining("English note A"));
  });

  it("行仅 note（无 noteEn）时回退 note", () => {
    render(<CompatMatrix />);
    const cell = noteCellOf("行乙");
    expect(cell).toHaveAttribute("title", "中文备注乙");
    expect(cell).toHaveAttribute("aria-label", expect.stringContaining("中文备注乙"));
  });

  it("noteEn 为空串时视同缺失回退 note（防空串 title 与 aria 分叉）", () => {
    render(<CompatMatrix />);
    const cell = noteCellOf("行丙");
    expect(cell).toHaveAttribute("title", "中文备注丙");
    expect(cell).toHaveAttribute("aria-label", expect.stringContaining("中文备注丙"));
  });

  it("en 语言下表头渲染 matrix.colCap（Capability），不再硬编码中文", async () => {
    await i18n.changeLanguage("en");
    render(<CompatMatrix />);
    expect(screen.getByRole("columnheader", { name: "Capability" })).toBeInTheDocument();
  });
});
