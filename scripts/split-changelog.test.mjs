import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseChangelog, decodeContent, validateCapabilities } from "./split-changelog.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(resolve(__dir, "../tests/fixtures/CHANGELOG-sample.md"), "utf8");

describe("parseChangelog", () => {
  it("解析版本、日期、分区与条目", () => {
    const out = parseChangelog(md);
    expect(out).toHaveLength(1);
    expect(out[0].version).toBe("0.5.5");
    expect(out[0].date).toBe("2026-10-10");
    expect(out[0].sections.Added).toEqual(["子 Agent 运行 chip 与观察台", "远程审批支持排队"]);
    expect(out[0].sections.Fixed).toEqual(["完成识别修复：teammate 完成后 chip 永挂"]);
  });
  it("非版本行不产生新条目", () => {
    expect(parseChangelog("# Changelog\n随便写写\n")).toEqual([]);
  });
});

describe("decodeContent", () => {
  it("contents 带换行 base64 正确解码", () => {
    const payload = { content: Buffer.from("## [x] – 2026-01-01\n- a\n").toString("base64") + "\n" };
    expect(decodeContent(payload)).toBe("## [x] – 2026-01-01\n- a\n");
  });
});

describe("validateCapabilities", () => {
  const TOOLS8 = ["claude", "codex", "opencode", "kimi", "workbuddy", "zcode", "dsh", "openclaw"];
  const fullSupport = () => Object.fromEntries(TOOLS8.map((t) => [t, "yes"]));
  const valid = {
    updated: "2026-10-11",
    legend: { yes: "✅" },
    tools: TOOLS8,
    groups: [{ key: "g1", name: "组", rows: [{ name: "行", key: "r1", support: fullSupport() }] }],
  };
  it("合法最小结构通过；tools 缺失 / rows 非数组 / null 拒绝", () => {
    expect(validateCapabilities(valid)).toBe(valid);
    expect(validateCapabilities({ ...valid, tools: undefined })).toBeNull();
    expect(validateCapabilities({ ...valid, groups: [{ key: "g1", name: "组", rows: "x" }] })).toBeNull();
    expect(validateCapabilities(null)).toBeNull();
  });
  it("I2：tools=7（合法键全覆盖）通过、第 9 个未知键拒绝——数量不再硬锁 8，键名必须对上 TOOLS", () => {
    const seven = { ...valid, tools: TOOLS8.slice(0, 7) };
    expect(validateCapabilities(seven)).toBeTruthy();
    const nine = {
      ...valid,
      tools: [...TOOLS8, "newtool"],
      groups: [{ key: "g1", name: "组", rows: [{ name: "行", key: "r1", support: { ...fullSupport(), newtool: "yes" } }] }],
    };
    expect(validateCapabilities(nine)).toBeNull();
  });
  it("I2：未知 support 取值拒绝", () => {
    const bad = structuredClone(valid);
    bad.groups[0].rows[0].support.claude = "broken";
    expect(validateCapabilities(bad)).toBeNull();
  });
  it("I2：support 缺工具覆盖拒绝", () => {
    const bad = structuredClone(valid);
    delete bad.groups[0].rows[0].support.openclaw;
    expect(validateCapabilities(bad)).toBeNull();
  });
});
