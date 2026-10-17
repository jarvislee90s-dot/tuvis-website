import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SRC_FILE, parseChangelog, langViolations, decodeContent, validateCapabilities } from "./split-changelog.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(__dir, p), "utf8");
const mdZh = read("../tests/fixtures/CHANGELOG-sample.md");       // 模拟主仓 CHANGELOG.md（纯中文）
const mdEn = read("../tests/fixtures/CHANGELOG-sample.en.md");    // 模拟主仓 CHANGELOG.en.md（纯英文，zh 的子集）

// spyOn(console, "warn") 的用例集中在 parseChangelog / langViolations——断言失败也要还原，不污染其它用例的 console
afterEach(() => {
  vi.restoreAllMocks();
});

/** 产物 / 解析结果里所有条目的键集合（「条目键只有 zh / 只有 en」门禁用） */
const itemKeySets = (data) => data.flatMap((rel) => Object.values(rel.sections).flat().map((it) => Object.keys(it)));

describe("parseChangelog：中文文件（模拟 CHANGELOG.md，单语契约）", () => {
  it("解析版本、日期、分区（out 序 = 文件中出现序）；头注释/散记/非版本行不产生条目，干净文件零告警", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog(mdZh);
    expect(out).toHaveLength(3);
    expect(out.map((v) => v.version)).toEqual(["0.6.0", "0.5.9", "0.5.5"]);
    expect(out.map((v) => v.date)).toEqual(["2026-10-15", "2026-10-12", "2026-10-10"]);
    // 0.6.0 为多分区版本；0.5.9 单分区；0.5.5 两分区——分区名原样保留中文
    expect(Object.keys(out[0].sections)).toEqual(["新增", "修复", "工程"]);
    expect(Object.keys(out[1].sections)).toEqual(["新增"]);
    expect(Object.keys(out[2].sections)).toEqual(["新增", "修复"]);
    // 文件头 `<!-- -->` 注释块与版本标题下的散记都不是条目来源
    expect(warnSpy).not.toHaveBeenCalled();
  });
  it("条目键只有 zh；缩进续行以空格并入上一条目文本", () => {
    const [v060, , v055] = parseChangelog(mdZh);
    expect(v060.sections.新增).toEqual([
      { zh: "子 Agent chip 支持按名称筛选" },
      { zh: "远程审批新增批量模式 一次勾选多条待审请求，统一放行或驳回 批量操作会记录单条审计日志" },
      { zh: "观察台支持时间轴回放" },
    ]);
    expect(v060.sections.修复).toEqual([
      { zh: "修复远程审批超时后状态不同步" },
      { zh: "修复观察台在深色模式下时间轴错位" },
    ]);
    expect(v060.sections.工程).toEqual([{ zh: "同步脚本改为三源拉取（中文 / 英文 / capabilities）" }]);
    expect(v055.sections.修复).toEqual([{ zh: "完成识别修复：teammate 完成后 chip 永挂" }]);
    // 每条目键集合恰为 ["zh"]——旧双语契约的 en 键在新契约中文产物里不存在
    for (const keys of itemKeySets(parseChangelog(mdZh))) expect(keys).toEqual(["zh"]);
  });
  it("非版本行不产生新条目", () => {
    expect(parseChangelog("# Changelog\n随便写写\n")).toEqual([]);
  });
});

describe("parseChangelog：英文文件（模拟 CHANGELOG.en.md，单语契约）", () => {
  it("未译版本（0.5.9）与未译分区（0.5.5 的 Fixed）直接缺席；分区名原样是英文", () => {
    const out = parseChangelog(mdEn, "en");
    expect(out.map((v) => v.version)).toEqual(["0.6.0", "0.5.5"]);
    expect(Object.keys(out[0].sections)).toEqual(["Added", "Fixed", "Engineering"]);
    // 英文同名版本分区数可少于中文版（0.5.5 中文有 新增+修复 两分区，英文只译了 Added）
    expect(Object.keys(out[1].sections)).toEqual(["Added"]);
  });
  it("条目键是 en；英文续行同样以空格并入上一条目", () => {
    const [v060] = parseChangelog(mdEn, "en");
    expect(v060.sections.Added).toEqual([
      { en: "Sub-agent chips can now be filtered by name" },
      { en: "Remote approvals gain a batch mode Select multiple pending requests at once, then allow or deny them together Each batch action records one audit line per item" },
      { en: "The observatory supports timeline replay" },
    ]);
    expect(v060.sections.Engineering).toEqual([{ en: "The sync script now pulls three sources (zh / en / capabilities)" }]);
    for (const keys of itemKeySets(parseChangelog(mdEn, "en"))) expect(keys).toEqual(["en"]);
  });
  it("条目键随 lang 参数走：同一份 md，zh 解析出 zh 键、en 解析出 en 键", () => {
    const src = "## [x] - 2026-01-01\n### Added\n- entry\n";
    expect(parseChangelog(src, "zh")[0].sections.Added).toEqual([{ zh: "entry" }]);
    expect(parseChangelog(src, "en")[0].sections.Added).toEqual([{ en: "entry" }]);
  });
});

describe("parseChangelog：旧契约「EN: 行」违规告警（中英已分文件）", () => {
  it("`EN: x` 续行触发一次告警（点名 SRC_FILE.zh 与该行内容），且内容不丢——按中文续行并入上一条目", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### 新增\n- 条目\n  EN: leftover\n");
    expect(out[0].sections.新增).toEqual([{ zh: "条目 EN: leftover" }]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = String(warnSpy.mock.calls[0][0]);
    expect(msg).toContain(SRC_FILE.zh);
    expect(msg).toContain("EN: leftover");
  });
  it("`EN：x` 全角冒号同样告警一次，内容并入中文条目文本", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### 新增\n- 条目\n  EN：全角\n");
    expect(out[0].sections.新增).toEqual([{ zh: "条目 EN：全角" }]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("EN：全角");
  });
  it("`EN :x` 冒号前空格 + 深缩进同样告警一次，内容并入中文条目文本", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### 新增\n- 条目\n    EN : 空格\n");
    expect(out[0].sections.新增).toEqual([{ zh: "条目 EN : 空格" }]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("EN : 空格");
  });
  it("`En:` / `en:` 大小写变体同样命中（大小写不敏感）并告警", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### 新增\n- 条目\n  En: 首字母小写\n- 另一条\n  en: 全小写\n");
    expect(out[0].sections.新增).toEqual([{ zh: "条目 En: 首字母小写" }, { zh: "另一条 en: 全小写" }]);
    const msgs = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(msgs.some((m) => m.includes("En: 首字母小写"))).toBe(true);
    expect(msgs.some((m) => m.includes("en: 全小写"))).toBe(true);
  });
  it("英文文件里的 `EN: x` 残迹也告警（点名 SRC_FILE.en），内容并入英文条目文本", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n- entry\n  EN: stray\n", "en");
    expect(out[0].sections.Added).toEqual([{ en: "entry EN: stray" }]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = String(warnSpy.mock.calls[0][0]);
    expect(msg).toContain(SRC_FILE.en);
    expect(msg).toContain("EN: stray");
  });
  it("节首孤儿 `EN:` 行（无在先条目）告警但被丢弃", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### Added\n  EN: orphan\n- 条目\n");
    expect(out[0].sections.Added).toEqual([{ zh: "条目" }]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("EN: orphan");
  });
  it("边界：`- EN: …` 写成列表项 → 按本文件语言的普通条目原文解析、不告警", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const out = parseChangelog("## [x] - 2026-01-01\n### 新增\n- EN: written as a bullet\n");
    expect(out[0].sections.新增).toEqual([{ zh: "EN: written as a bullet" }]);
    expect(warnSpy).not.toHaveBeenCalled();
  });
  it("CRLF 行尾输入解析正确（\\r 不残留于版本号/日期/分区名/条目文本）", () => {
    const out = parseChangelog("## [x] - 2026-01-01\r\n### 新增\r\n- 条目一\r\n  续行\r\n- 条目二\r\n");
    expect(out).toEqual([{ version: "x", date: "2026-01-01", sections: { 新增: [{ zh: "条目一 续行" }, { zh: "条目二" }] } }]);
    expect(JSON.stringify(out)).not.toContain("\r");
  });
});

describe("langViolations：英文产物语言纯度闸门", () => {
  it("合法英文数据通过（返回 []）", () => {
    expect(langViolations(parseChangelog(mdEn, "en"), "en")).toEqual([]);
  });
  it("条目文本混入 Han → 返回「版本/分区」定位（v<version>/<section>: 文本前缀）", () => {
    const data = parseChangelog(mdEn, "en");
    data[0].sections.Added[0].en = "mixed 中文 entry";
    const bad = langViolations(data, "en");
    expect(bad).toHaveLength(1);
    expect(bad[0]).toContain(`v${data[0].version}/Added`);
    expect(bad[0]).toContain("mixed 中文 entry");
  });
  it("分区名含 Han → 返回「版本/分区」定位（v<version>/<section>）", () => {
    const data = parseChangelog(mdEn, "en");
    const rel = data[data.length - 1];
    rel.sections["新增"] = [{ en: "item under a Chinese section name" }];
    const bad = langViolations(data, "en");
    expect(bad).toContain(`v${rel.version}/新增`);
  });
  it("版本号含 Han 也命中（版本号同样渲染在 /en 页的 h2）", () => {
    const data = parseChangelog(mdEn, "en");
    data[0].version = "中文版";
    expect(langViolations(data, "en")).toContain("v中文版");
  });
  it("CJK 标点/全角形同样命中；曲引号/省略号不拦（字符类刻意收窄，见实现注释）", () => {
    const data = parseChangelog(mdEn, "en");
    data[0].sections.Added[0].en = "fullwidth！";                     // 全角叹号 \uff01
    data[0].sections.Added[1].en = "cjk punct、end";                  // 顿号 \u3001
    data[0].sections.Added[2].en = "curly ’quotes’ and ellipsis… are fine";  // 曲引号/省略号 = 正常英文排版
    expect(langViolations(data, "en")).toHaveLength(2);
  });
  it("lang=zh 恒返回 []（中文正文本就含 Han，不设对照闸门）", () => {
    expect(langViolations(parseChangelog(mdZh), "zh")).toEqual([]);
  });
});

describe("数据门禁：入 git 的两份 changelog 产物（随数据漂移自动跟随，不写死条数/版本号）", () => {
  // 「英文页不显示中文」钉在数据层：/en/changelog 的零 Han 硬红线挂在这份产物上，脏数据不该有机会上线。
  const prodZh = JSON.parse(read("../src/content/changelog.json"));
  const prodEn = JSON.parse(read("../src/content/changelog.en.json"));

  it("英文产物：每条目键集合恰为 [\"en\"]，无 zh 键残留", () => {
    for (const keys of itemKeySets(prodEn)) expect(keys).toEqual(["en"]);
  });
  it("英文产物：全部「分区名 + 条目文本」零 Han 计数，且 langViolations 通过", () => {
    let han = 0;
    for (const rel of prodEn) {
      for (const [sec, items] of Object.entries(rel.sections)) {
        han += (sec.match(/[\u4e00-\u9fff]/g) ?? []).length;
        for (const it of items) han += ((it.en ?? "").match(/[\u4e00-\u9fff]/g) ?? []).length;
      }
    }
    expect(han).toBe(0);
    expect(langViolations(prodEn, "en")).toEqual([]);
  });
  it("英文产物：每个分区至少一条条目（空分区 = 解析事故）", () => {
    for (const rel of prodEn) {
      for (const [sec, items] of Object.entries(rel.sections)) {
        expect(items.length, `v${rel.version}/${sec} 是空分区`).toBeGreaterThan(0);
      }
    }
  });
  it("中文产物：每条目键集合恰为 [\"zh\"]，无 en 残留键", () => {
    for (const keys of itemKeySets(prodZh)) expect(keys).toEqual(["zh"]);
  });
  it("中文产物：首版形状 { version: string, date: string, sections: object }（Hero/关于窗/演示看板只读 changelog[0].version）", () => {
    expect(prodZh.length).toBeGreaterThan(0);
    expect(typeof prodZh[0].version).toBe("string");
    expect(prodZh[0].version).not.toBe("");
    expect(typeof prodZh[0].date).toBe("string");
    expect(prodZh[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(prodZh[0].sections).toBeTypeOf("object");
  });
  it("中文产物：分区名 + 条目文本非空", () => {
    for (const rel of prodZh) {
      for (const [sec, items] of Object.entries(rel.sections)) {
        expect(sec.trim(), `v${rel.version} 有空分区名`).not.toBe("");
        for (const it of items) expect((it.zh ?? "").trim(), `v${rel.version}/${sec} 有空条目`).not.toBe("");
      }
    }
  });
  it("两产物关系：英文版本集合 ⊆ 中文版本集合（英文只列已译版本，每个版本都能在中文版找到）", () => {
    const zhVersions = new Set(prodZh.map((r) => r.version));
    expect(prodEn.length).toBeGreaterThan(0);
    expect(prodEn.length).toBeLessThanOrEqual(prodZh.length);
    for (const rel of prodEn) {
      expect(zhVersions.has(rel.version), `v${rel.version} 只在英文产物里出现——违反两文件逐版对齐契约`).toBe(true);
    }
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
