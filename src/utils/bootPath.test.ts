import { describe, expect, it } from "vitest";
import { resolveBootPath } from "./bootPath";

const GH = { base: "/tuvis-website", origin: "https://jarvislee90s-dot.github.io" };

describe("resolveBootPath", () => {
  it("剥掉 base 前缀，返回 router 相对路径", () => {
    expect(
      resolveBootPath("https://jarvislee90s-dot.github.io/tuvis-website/en/changelog", GH),
    ).toBe("/en/changelog");
    expect(
      resolveBootPath("https://jarvislee90s-dot.github.io/tuvis-website/zh/changelog", GH),
    ).toBe("/zh/changelog");
    expect(resolveBootPath("https://jarvislee90s-dot.github.io/tuvis-website/en", GH)).toBe("/en");
  });

  it("search/hash 原样保留拼在结果后", () => {
    expect(
      resolveBootPath(
        "https://jarvislee90s-dot.github.io/tuvis-website/en/docs/01-overview?x=1#h",
        GH,
      ),
    ).toBe("/en/docs/01-overview?x=1#h");
  });

  it("pathname 即 base（含尾斜杠形态）→ 根路径", () => {
    expect(resolveBootPath("https://jarvislee90s-dot.github.io/tuvis-website", GH)).toBe("/");
    expect(resolveBootPath("https://jarvislee90s-dot.github.io/tuvis-website/", GH)).toBe("/");
  });

  it("origin 与传入不符 → 根路径（防纵深）", () => {
    expect(
      resolveBootPath("https://example.com/tuvis-website/en/changelog", GH),
    ).toBe("/");
  });

  it("localhost 同源形态同样可解析（集成测试复用）", () => {
    expect(
      resolveBootPath("http://localhost/tuvis-website/en/changelog", {
        base: "/tuvis-website",
        origin: "http://localhost",
      }),
    ).toBe("/en/changelog");
  });

  it("非法 URL → 根路径", () => {
    expect(resolveBootPath("not a url", GH)).toBe("/");
  });
});
