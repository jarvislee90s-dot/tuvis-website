import { describe, expect, it } from "vitest";
import { LEDGERS, totalTokens, hitRate, formatCN, formatUnits, formatInt, smoothPath, type RangeKey } from "./ledgerData";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("ledger v4 invariants", () => {
  const KEYS = ["last5h", "today", "last7d", "last30d", "custom"] as const;
  const LENGTHS: Record<RangeKey, number> = { last5h: 5, today: 8, last7d: 7, last30d: 30, custom: 30 };
  const PEAKS: Record<RangeKey, number> = {
    last5h: 165_240_000, today: 512_400_000,
    last7d: 1_568_000_000, last30d: 1_568_000_000, custom: 1_568_000_000,
  };

  it("每档三个维度合计都等于该档 totalTokens", () => {
    for (const k of KEYS) {
      const d = LEDGERS[k];
      for (const dim of [d.byTool, d.byProject, d.bySupplier])
        expect(sum(dim.map((r) => r.tokens))).toBe(totalTokens(d.metrics));
    }
  });
  it("每档趋势合计等于 totalTokens、长度 = 5/8/7/30、峰值 = 数据最大值", () => {
    for (const k of KEYS) {
      const d = LEDGERS[k];
      expect(d.trend.tokens).toHaveLength(LENGTHS[k]);
      expect(d.trend.labels).toHaveLength(LENGTHS[k]);
      expect(d.trend.hit).toHaveLength(LENGTHS[k]);
      expect(sum(d.trend.tokens)).toBe(totalTokens(d.metrics));
      expect(Math.max(...d.trend.tokens)).toBe(PEAKS[k]);
      for (const h of d.trend.hit) { expect(h).toBeGreaterThan(0.95); expect(h).toBeLessThan(0.99); }
    }
  });
  it("每档命中率 = cacheHit/reqInput ∈ [0.95, 0.99]", () => {
    const EXPECT = { last5h: 0.974, today: 0.976, last7d: 0.973, last30d: 0.976, custom: 0.976 } as const;
    for (const k of KEYS) {
      const hr = hitRate(LEDGERS[k].metrics);
      expect(hr).toBeGreaterThanOrEqual(0.95);
      expect(hr).toBeLessThanOrEqual(0.99);
      expect(hr).toBeCloseTo(EXPECT[k], 2);
    }
  });
  it("占比合计 ≈ 100%（每档三维）", () => {
    for (const k of KEYS) {
      const d = LEDGERS[k];
      const T = totalTokens(d.metrics);
      for (const dim of [d.byTool, d.byProject, d.bySupplier])
        expect(sum(dim.map((r) => (r.tokens / T) * 100))).toBeCloseTo(100, 3);
    }
  });
  it("formatCN 三档 + formatInt 千分位（不变）", () => {
    expect(formatCN(4_374_410_324)).toBe("43.74亿");
    expect(formatCN(17_951_000)).toBe("1795.10万");
    expect(formatCN(608)).toBe("608");
    expect(formatInt(4_392_361_324)).toBe("4,392,361,324");
  });
  it("smoothPath：M 开头、n-1 段 C、无 NaN（不变）", () => {
    const d = smoothPath([{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: 3 }]);
    expect(d.startsWith("M0.0,0.0")).toBe(true);
    expect((d.match(/ C/g) ?? [])).toHaveLength(2);
    expect(d).not.toContain("NaN");
  });
  it("量级递增：last5h < today < last7d < last30d", () => {
    const T = (k: RangeKey) => totalTokens(LEDGERS[k].metrics);
    expect(T("last5h")).toBeLessThan(T("today"));
    expect(T("today")).toBeLessThan(T("last7d"));
    expect(T("last7d")).toBeLessThan(T("last30d"));
  });
  it("custom 为 last30d 别名 + 30 天标签首尾正确", () => {
    expect(LEDGERS.custom).toBe(LEDGERS.last30d);
    expect(LEDGERS.last30d.trend.labels[0]).toBe("9/12");
    expect(LEDGERS.last30d.trend.labels.at(-1)).toBe("10/11");
  });
});

describe("formatUnits 语种化单位（zh 万/亿不动；en K/M/B，D3）", () => {
  it("en 三档：两位小数 + 单位前空格", () => {
    expect(formatUnits(4_374_410_324, "en")).toBe("4.37 B");
    expect(formatUnits(17_951_000, "en")).toBe("17.95 M");
    expect(formatUnits(999, "en")).toBe("999");
  });
  it("en 原数分支镜像 zh：Math.round 且无千分位", () => {
    expect(formatUnits(999.5, "en")).toBe("1000");
    expect(formatUnits(0, "en")).toBe("0");
    expect(formatUnits(-999, "en")).toBe("-999");
  });
  it("en 档界：1e3/1e6/1e9 恰入档；999_999 舍入不跨档", () => {
    expect(formatUnits(1e3, "en")).toBe("1.00 K");
    expect(formatUnits(1e4, "en")).toBe("10.00 K");
    expect(formatUnits(999_999, "en")).toBe("1000.00 K");   // 机械口径：四舍五入不触发跨档进位
    expect(formatUnits(1e6, "en")).toBe("1.00 M");
    expect(formatUnits(1e9, "en")).toBe("1.00 B");
  });
  it("en 负数按 Math.abs 判档、输出保留负号（与 zh 按原值判档刻意不同）", () => {
    expect(formatUnits(-1_234, "en")).toBe("-1.23 K");
    expect(formatUnits(-17_951_000, "en")).toBe("-17.95 M");
    expect(formatUnits(-4_374_410_324, "en")).toBe("-4.37 B");
  });
  it("zh 全档回归：逐字等于 formatCN（B18 口径红线）", () => {
    const VS = [0, 608, 999, 999.5, 1e4, 17_951_000, 1e8, 4_374_410_324, -1_234, -4_374_410_324];
    for (const v of VS) expect(formatUnits(v, "zh")).toBe(formatCN(v));
    expect(formatUnits(1e4, "zh")).toBe("1.00万");
    expect(formatUnits(1e8, "zh")).toBe("1.00亿");
    expect(formatUnits(-4_374_410_324, "zh")).toBe("-4374410324");   // zh 负数恒落原数分支（现状不变）
  });
  it("formatCN 保留为 zh 向后兼容别名", () => {
    expect(formatCN(608)).toBe(formatUnits(608, "zh"));
    expect(formatCN(4_374_410_324)).toBe(formatUnits(4_374_410_324, "zh"));
  });
});
