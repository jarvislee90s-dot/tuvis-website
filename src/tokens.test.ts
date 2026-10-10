import { describe, expect, it } from "vitest";
// @ts-expect-error —— @types/node 未安装（红线：不新增依赖）；vitest 运行于 node，node:fs 运行时可用
import { readFileSync } from "node:fs";

const css = readFileSync("./src/index.css", "utf8").toLowerCase();

const LIGHT = [
  "--surface: #f8f3e9", "--card: #fffdf8", "--line: #eae2cf", "--ink: #2b2417",
  "--ink-dim: #6b6557",   // a11y 修正：原 remote-ui mut #97907e 在 lpaper 上 2.87:1，加深达 4.5:1（暖橄榄灰同族）
  "--bub: #efe8d8", "--btnp: #1a1915", "--btnpt: #ffffff",
];

describe("design tokens vs remote-ui final prototypes", () => {
  it("亮色令牌与定稿一致，暗色令牌与 .dark 块已移除", () => {
    for (const s of LIGHT) expect(css).toContain(s);
    expect(css).not.toContain("--surface: #271d0f");
    expect(css).not.toContain(".dark {");
  });
  it("旧草稿冷海军蓝已退役，青蓝点缀保留", () => {
    for (const old of ["#0b1220", "#131e30", "#22304a", "#e7eef7", "#94a6bd", "#f7f6f4"])
      expect(css).not.toContain(old);
    expect(css).toContain("--hud: #1787a8");
  });
  it("徽标软色对与双层字体栈存在", () => {
    for (const s of ["--color-bdg-r: #fee9e5", "--color-bdg-y-t: #7a5e00",   // a11y 修正：台账 #8a6d00 在淡黄底 4.43:1，加深达 4.5:1
      "--color-bdg-g: #e3f2e7",
      "--font-ui:", "--font-mono:", "sf mono", "consolas", "pingfang sc"])
      expect(css).toContain(s);
  });
  it("真应用白系令牌组（--app-*）存在，仅 demo 窗壳使用", () => {
    for (const s of [
      "--app-bg: #ffffff", "--app-card: #ffffff", "--app-line: #e5e5e5", "--app-ink: #252525",
      "--app-mut: #737373", "--app-btnp: #171717", "--app-accent: #f5f5f5", "--app-track: #e5e5e5",
      "--app-chart-a: #3b82f6", "--app-chart-b: #8b5cf6",
    ]) expect(css).toContain(s);
  });
});
