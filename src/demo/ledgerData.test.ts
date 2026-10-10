import { describe, expect, it } from "vitest";
import { LEDGERS, totalTokens, hitRate, formatCN, formatInt, smoothPath, type RangeKey } from "./ledgerData";

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
