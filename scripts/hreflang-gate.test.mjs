import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// W4 门禁：hreflang 三条齐全（zh / en / x-default → /en/）。读 index.html 源头（vite 构建原样搬运）。
// 放 scripts/ 下以 .mjs 运行：src 的 ts 测试类型环境不含 node 模块（与 release-workflow.test.mjs 同理由）。

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("W4 hreflang 门禁", () => {
  it("index.html 声明 zh / en / x-default 三条 alternate", () => {
    const html = readFileSync(resolve(root, "index.html"), "utf8");
    expect(html).toContain('<link rel="alternate" hreflang="zh" href="https://tuvis.app/zh/" />');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://tuvis.app/en/" />');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://tuvis.app/en/" />');
  });
});
