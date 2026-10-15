import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseChangelog, decodeContent, validateCapabilities } from "./split-changelog.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(resolve(__dir, "../tests/fixtures/CHANGELOG-sample.md"), "utf8");

describe("parseChangelog", () => {
  afterEach(() => {
    vi.restoreAllMocks(); // 近失用例 spyOn(console, "warn")——断言失败也要还原，不污染其它用例的 console
  });
  it("解析版本、日期、分区（out 序 = 文件中出现序，0.5.5 为最后一个版本）", () => {
    const out = parseChangelog(md);
    expect(out).toHaveLength(3);
    expect(out.map((v) => v.version)).toEqual(["0.6.0", "0.5.9", "0.5.5"]);
    expect(out.map((v) => v.date)).toEqual(["2026-10-15", "2026-10-12", "2026-10-10"]);
    expect(Object.keys(out[0].sections)).toEqual(["Added", "Fixed"]);
    expect(Object.keys(out[2].sections)).toEqual(["Added", "Fixed"]);
  });
  it("非版本行不产生新条目", () => {
    expect(parseChangelog("# Changelog\n随便写写\n")).toEqual([]);
  });
  it("双语条目：zh/en 精确解析；中文续行并入 zh、EN 续行并入 en（空格连接）", () => {
    const [v060] = parseChangelog(md);
    const added = v060.sections.Added;
    expect(added).toEqual([
      { zh: "子 Agent chip 支持按名称筛选", en: "Sub-agent chips can now be filtered by name" },
      {
        zh: "远程审批新增批量模式 一次勾选多条待审请求，统一放行或驳回 批量操作会记录单条审计日志",
        en: "Remote approvals gain a batch mode",
      },
      {
        zh: "观察台支持时间轴回放",
        en: "The observatory supports timeline replay, reopening any sub-agent run from its chip",
      },
    ]);
    expect(added.every((e) => "en" in e)).toBe(true);
    const fixed = v060.sections.Fixed;
    expect(fixed).toEqual([
      { zh: "修复远程审批超时后状态不同步", en: "Fixed approval status drifting out of sync after a timeout" },
      { zh: "修复观察台在深色模式下时间轴错位", en: "Fixed the timeline misaligning in dark mode" },
    ]);
    expect(fixed.every((e) => "en" in e)).toBe(true);
  });
  it("同一条目第二行 EN: 空格并入已有英文（不覆盖）", () => {
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- 中文\n  EN: one\n  EN: two\n");
    expect(out[0].sections.Added).toEqual([{ zh: "中文", en: "one two" }]);
  });
  it("纯中文条目（旧格式回归）：en 键缺省而非空串", () => {
    const [, , v055] = parseChangelog(md);
    expect(v055.sections.Added).toEqual([{ zh: "子 Agent 运行 chip 与观察台" }, { zh: "远程审批支持排队" }]);
    expect(v055.sections.Fixed).toEqual([{ zh: "完成识别修复：teammate 完成后 chip 永挂" }]);
    for (const e of [...v055.sections.Added, ...v055.sections.Fixed]) {
      expect("en" in e).toBe(false);
    }
  });
  it("混合版本节：同一分区内纯中文与双语条目混排", () => {
    const [, v059] = parseChangelog(md);
    const added = v059.sections.Added;
    expect(added).toEqual([
      { zh: "审批队列支持按提交人分组" },
      { zh: "子 Agent chip 支持固定到侧栏", en: "Sub-agent chips can now be pinned to the sidebar" },
      { zh: "观察台新增运行时长统计" },
    ]);
    expect("en" in added[0]).toBe(false);
    expect("en" in added[1]).toBe(true);
    expect("en" in added[2]).toBe(false);
  });
  it("边界：分区开头的孤儿 EN: 行（无在先条目）被丢弃", () => {
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n  EN: orphan\n- 条目\n");
    expect(out[0].sections.Added).toEqual([{ zh: "条目" }]);
    expect("en" in out[0].sections.Added[0]).toBe(false);
  });
  it("边界：EN: 后无内容则整行忽略（续行归属不切换，仍并入中文）", () => {
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- 条目\n  EN:\n  续行仍并入中文\n");
    expect(out[0].sections.Added).toEqual([{ zh: "条目 续行仍并入中文" }]);
    expect("en" in out[0].sections.Added[0]).toBe(false);
  });
  it("边界：- EN: … 写成列表项不识别为英文，按中文条目原文解析", () => {
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- EN: written as a bullet\n");
    expect(out[0].sections.Added).toEqual([{ zh: "EN: written as a bullet" }]);
  });
  it("近失「EN：」全角冒号：按中文续行并入 zh、无 en 键，且构建日志告警", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- 条目\n  EN：全角\n续行\n");
    expect(out[0].sections.Added).toEqual([{ zh: "条目 EN：全角 续行" }]);
    expect("en" in out[0].sections.Added[0]).toBe(false);
    const msgs = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(msgs.some((m) => m.includes("近失") && m.includes("EN：全角"))).toBe(true);
  });
  it("近失「EN :」冒号前有空格：按中文续行并入 zh 并告警", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- 条目\n  EN : 空格\n");
    expect(out[0].sections.Added).toEqual([{ zh: "条目 EN : 空格" }]);
    expect("en" in out[0].sections.Added[0]).toBe(false);
    const msgs = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(msgs.some((m) => m.includes("近失") && m.includes("EN : 空格"))).toBe(true);
  });
  it("近失「En:」/「en:」大小写不符契约：按中文续行并入 zh 并告警", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- 条目\n  En: 首字母小写\n- 另一条\n  en: 全小写\n");
    expect(out[0].sections.Added).toEqual([{ zh: "条目 En: 首字母小写" }, { zh: "另一条 en: 全小写" }]);
    for (const e of out[0].sections.Added) expect("en" in e).toBe(false);
    const msgs = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(msgs.some((m) => m.includes("En: 首字母小写"))).toBe(true);
    expect(msgs.some((m) => m.includes("en: 全小写"))).toBe(true);
  });
  it("合法「EN:」不触发近失告警（加宽正则的误伤守卫）", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- 条目\n  EN: exact\n");
    expect(out[0].sections.Added).toEqual([{ zh: "条目", en: "exact" }]);
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes("近失"))).toBe(false);
  });
  it("CRLF 行尾输入解析正确（\\r 不残留于版本号与 zh/en）", () => {
    const out = parseChangelog("## [x] - 2026-01-01\r\n### Added\r\n- 条目\r\n  EN: entry\r\n");
    expect(out).toEqual([{ version: "x", date: "2026-01-01", sections: { Added: [{ zh: "条目", en: "entry" }] } }]);
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
