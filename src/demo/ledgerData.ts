import type { Lang } from "@/i18n";   // 仅类型：type-only 不把 i18next 运行时拖进纯数据模块

export interface DistRow { name: string; tokens: number }

/** 范围五档（自 LedgerSection 移入）：custom 为 last30d 别名（B30） */
export type RangeKey = "last5h" | "today" | "last7d" | "last30d" | "custom";

export interface LedgerMetrics {
  inputEst: number;             // 用户输入（估）· 含子代理（渲染加 "~" 前缀）
  output: number;
  reqInput: number;
  cacheHit: number;
  requests: number;
  asOf: string;
}

/** 工作小结六行（calls 为 "A | B" 竖线分组字符串，组件内 split） */
export interface LedgerWork {
  agents: string;
  sessions: number;
  turns: string;
  errors: string;
  longest: string;
  calls: string;
}

export interface LedgerDataset {
  metrics: LedgerMetrics;
  deltas: Record<string, string>;
  byTool: DistRow[];
  byProject: DistRow[];
  bySupplier: DistRow[];
  work: LedgerWork;
  trend: { labels: string[]; tokens: number[]; hit: number[] };
}

/** 近 5 小时（合成档）：totalTokens 576,020,000 */
const LAST5H: LedgerDataset = {
  metrics: {
    inputEst: 214,
    output: 2_410_000,
    reqInput: 573_610_000,
    cacheHit: 558_900_000,       // hit 97.4%
    requests: 2_742,
    asOf: "2026-10-11 15:43:01",
  },
  deltas: {   // 环比（数据值，硬编码）
    inputEst: "+12.4%", output: "+86.2%", reqInput: "+91.7%",
    cacheHit: "+92.0%", hitRate: "-0.4 pt", requests: "+88.5%", trend: "+74.6%",
  },
  byTool: [   // 三维合计 === totalTokens（不变式守护）
    { name: "Claude Code", tokens: 236_020_000 }, { name: "Codex", tokens: 128_410_000 },
    { name: "Kimi Code", tokens: 88_340_000 }, { name: "ZCode", tokens: 76_890_000 },
    { name: "WorkBuddy", tokens: 34_120_000 }, { name: "dsh", tokens: 12_240_000 },
  ],
  byProject: [
    { name: "tuvis-app", tokens: 284_150_000 }, { name: "tuvis-site", tokens: 132_660_000 },
    { name: "quant-chart", tokens: 108_530_000 }, { name: "landing", tokens: 50_680_000 },
  ],
  bySupplier: [
    { name: "Anthropic · claude-sonnet-4.5", tokens: 208_640_000 },
    { name: "OpenAI · gpt-5.2-codex", tokens: 128_410_000 },
    { name: "Moonshot · kimi-k2-thinking-turbo", tokens: 88_340_000 },
    { name: "Zhipu · glm-5.2", tokens: 76_890_000 },
    { name: "Anthropic · claude-opus-4.1", tokens: 43_120_000 },
    { name: "others", tokens: 30_620_000 },
  ],
  work: {
    agents: "4 active · 1 queued", sessions: 41,
    turns: "claude 96 · codex 37 · kimi 15",
    errors: "0 fatal · 1 retry · 0 timeout · 0 abort",
    longest: "p50 38s · max 212s",
    calls: "Read 68 · Edit 31 | Bash 19 · Grep 12",
  },
  trend: {   // 5 点小时标签 11:00–15:00，合计 === totalTokens，峰 165,240,000
    labels: ["11:00", "12:00", "13:00", "14:00", "15:00"],
    tokens: [96_400_000, 142_850_000, 88_120_000, 165_240_000, 83_410_000],
    hit: [0.972, 0.976, 0.969, 0.978, 0.974],
  },
};

/** 当日（合成档）：totalTokens 1,410,320,000 */
const TODAY: LedgerDataset = {
  metrics: {
    inputEst: 386,
    output: 5_905_000,
    reqInput: 1_404_415_000,
    cacheHit: 1_370_220_000,     // hit 97.6%
    requests: 6_730,
    asOf: "2026-10-11 15:43:01",
  },
  deltas: {
    inputEst: "+218.6%", output: "+112.4%", reqInput: "+121.8%",
    cacheHit: "+120.3%", hitRate: "-0.5 pt", requests: "+138.2%", trend: "+115.9%",
  },
  byTool: [
    { name: "Claude Code", tokens: 586_420_000 }, { name: "Codex", tokens: 316_240_000 },
    { name: "Kimi Code", tokens: 212_680_000 }, { name: "ZCode", tokens: 184_310_000 },
    { name: "WorkBuddy", tokens: 76_940_000 }, { name: "dsh", tokens: 33_730_000 },
  ],
  byProject: [
    { name: "tuvis-app", tokens: 684_260_000 }, { name: "tuvis-site", tokens: 338_410_000 },
    { name: "quant-chart", tokens: 252_730_000 }, { name: "landing", tokens: 134_920_000 },
  ],
  bySupplier: [
    { name: "Anthropic · claude-sonnet-4.5", tokens: 518_240_000 },
    { name: "OpenAI · gpt-5.2-codex", tokens: 316_240_000 },
    { name: "Moonshot · kimi-k2-thinking-turbo", tokens: 212_680_000 },
    { name: "Zhipu · glm-5.2", tokens: 184_310_000 },
    { name: "Anthropic · claude-opus-4.1", tokens: 92_460_000 },
    { name: "others", tokens: 86_390_000 },
  ],
  work: {
    agents: "5 active · 2 queued", sessions: 74,
    turns: "claude 186 · codex 71 · kimi 28",
    errors: "0 fatal · 2 retry · 1 timeout · 0 abort",
    longest: "p50 41s · max 284s",
    calls: "Read 132 · Edit 58 | Bash 36 · Grep 22",
  },
  trend: {   // 8 点两小时桶 00:00–14:00，合计 === totalTokens，峰 512,400,000（午后高峰 + 末桶部分时段）
    labels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00"],
    tokens: [37_600_000, 20_100_000, 15_300_000, 24_800_000, 121_400_000, 268_900_000, 512_400_000, 409_820_000],
    hit: [0.961, 0.958, 0.955, 0.963, 0.969, 0.974, 0.979, 0.976],
  },
};

/** 近 7 天（默认范围，唯一真实档）：totalTokens 4,392,361,324（原 LEDGER/TREND 原样迁入） */
const LAST7D: LedgerDataset = {
  metrics: {
    inputEst: 608,                 // 用户输入（估）· 含子代理（渲染加 "~" 前缀）
    output: 17_951_000,            // 1795.10万
    reqInput: 4_374_410_324,       // 43.74亿
    cacheHit: 4_258_000_000,       // 42.58亿
    requests: 20_515,
    asOf: "2026-10-11 15:43:01",
  },
  deltas: {   // 环比（数据值，硬编码）
    inputEst: "+337.4%", output: "+103.6%", reqInput: "+136.5%",
    cacheHit: "+135.1%", hitRate: "-0.6 pt", requests: "+166.3%", trend: "+136.3%",
  },
  byTool: [   // 三维合计 === totalTokens（不变式守护）
    { name: "Claude Code", tokens: 1_860_000_000 }, { name: "Codex", tokens: 920_000_000 },
    { name: "Kimi Code", tokens: 640_000_000 }, { name: "ZCode", tokens: 530_000_000 },
    { name: "WorkBuddy", tokens: 290_000_000 }, { name: "dsh", tokens: 152_361_324 },
  ],
  byProject: [
    { name: "tuvis-app", tokens: 2_140_000_000 }, { name: "tuvis-site", tokens: 1_120_000_000 },
    { name: "quant-chart", tokens: 780_000_000 }, { name: "landing", tokens: 352_361_324 },
  ],
  bySupplier: [
    { name: "Anthropic · claude-sonnet-4.5", tokens: 1_620_000_000 },
    { name: "OpenAI · gpt-5.2-codex", tokens: 920_000_000 },
    { name: "Moonshot · kimi-k2-thinking-turbo", tokens: 640_000_000 },
    { name: "Zhipu · glm-5.2", tokens: 530_000_000 },
    { name: "Anthropic · claude-opus-4.1", tokens: 310_000_000 },
    { name: "others", tokens: 372_361_324 },
  ],
  work: {   // 不变（mono 数据硬编码英文）
    agents: "6 active · 2 queued", sessions: 128,
    turns: "claude 342 · codex 118 · kimi 47",
    errors: "0 fatal · 2 retry · 1 timeout · 1 abort",
    longest: "p50 42s · max 316s",
    calls: "Read 210 · Edit 96 | Bash 54 · Grep 38",
  },
  trend: {   // 7 点日标签 10/5–10/11，合计 === totalTokens，峰 15.68亿
    labels: ["10/5", "10/6", "10/7", "10/8", "10/9", "10/10", "10/11"],
    tokens: [412_000_000, 486_000_000, 524_000_000, 455_000_000, 562_000_000, 1_568_000_000, 385_361_324],
    hit: [0.968, 0.971, 0.966, 0.970, 0.974, 0.978, 0.973],
  },
};

/** 日期标签：start 起第 i 天 → "9/12"（纯函数，近 30 天档标签生成） */
export function dateLabel(start: Date, i: number): string {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 近 30 天（合成档）：totalTokens 16,404,361,324 */
const LAST30D: LedgerDataset = {
  metrics: {
    inputEst: 2_486,
    output: 68_241_324,
    reqInput: 16_336_120_000,
    cacheHit: 15_942_800_000,    // hit 97.6%
    requests: 81_640,
    asOf: "2026-10-11 15:43:01",
  },
  deltas: {
    inputEst: "+412.6%", output: "+38.4%", reqInput: "+52.8%",
    cacheHit: "+51.2%", hitRate: "-0.8 pt", requests: "+64.7%", trend: "+46.1%",
  },
  byTool: [   // 三维合计 === totalTokens（dsh 尾行挂余数）
    { name: "Claude Code", tokens: 6_842_600_000 }, { name: "Codex", tokens: 3_412_400_000 },
    { name: "Kimi Code", tokens: 2_316_800_000 }, { name: "ZCode", tokens: 1_984_300_000 },
    { name: "WorkBuddy", tokens: 1_026_900_000 }, { name: "dsh", tokens: 821_361_324 },
  ],
  byProject: [
    { name: "tuvis-app", tokens: 7_684_200_000 }, { name: "tuvis-site", tokens: 4_126_400_000 },
    { name: "quant-chart", tokens: 2_984_700_000 }, { name: "landing", tokens: 1_609_061_324 },
  ],
  bySupplier: [
    { name: "Anthropic · claude-sonnet-4.5", tokens: 5_826_400_000 },
    { name: "OpenAI · gpt-5.2-codex", tokens: 3_412_400_000 },
    { name: "Moonshot · kimi-k2-thinking-turbo", tokens: 2_316_800_000 },
    { name: "Zhipu · glm-5.2", tokens: 1_984_300_000 },
    { name: "Anthropic · claude-opus-4.1", tokens: 1_688_200_000 },
    { name: "others", tokens: 1_176_261_324 },
  ],
  work: {
    agents: "6 active · 2 queued", sessions: 512,
    turns: "claude 1,342 · codex 516 · kimi 204",
    errors: "1 fatal · 6 retry · 3 timeout · 2 abort",
    longest: "p50 44s · max 582s",
    calls: "Read 8,240 · Edit 3,610 | Bash 2,180 · Grep 1,320",
  },
  trend: {   // 30 点日标签 9/12–10/11，四周 + 末两日，合计 === totalTokens，峰 15.68亿（与 7d 档同日尖峰自洽）
    labels: Array.from({ length: 30 }, (_, i) => dateLabel(new Date(2026, 8, 12), i)),
    tokens: [
      // W1 9/12–9/18
      412_600_000, 538_200_000, 605_400_000, 448_900_000, 596_100_000, 705_800_000, 349_400_000,
      // W2 9/19–9/25
      458_400_000, 512_700_000, 664_300_000, 470_800_000, 611_500_000, 784_200_000, 390_900_000,
      // W3 9/26–10/2
      502_600_000, 568_400_000, 622_100_000, 486_300_000, 655_200_000, 806_400_000, 379_200_000,
      // W4 10/3–10/9（低谷周）
      386_400_000, 422_800_000, 510_600_000, 402_500_000, 478_900_000, 425_400_000, 255_000_000,
      // 末两日 10/10–10/11（10/10 尖峰与 7d 档同值）
      1_568_000_000, 385_361_324,
    ],
    hit: [
      // W1
      0.971, 0.969, 0.972, 0.966, 0.970, 0.973, 0.964,
      // W2
      0.968, 0.970, 0.974, 0.967, 0.971, 0.975, 0.965,
      // W3
      0.969, 0.972, 0.975, 0.968, 0.973, 0.977, 0.962,
      // W4（低谷周偏低）
      0.958, 0.955, 0.960, 0.956, 0.959, 0.957, 0.956,
      // 末两日
      0.978, 0.973,
    ],
  },
};

/** 五档数据集（custom = last30d 别名引用，同一对象） */
export const LEDGERS: Record<RangeKey, LedgerDataset> = {
  last5h: LAST5H,
  today: TODAY,
  last7d: LAST7D,
  last30d: LAST30D,
  custom: LAST30D,   // B30：LEDGERS.custom === LEDGERS.last30d
};

/** 大数字口径 = 请求输入 + 产出（usage.png 副标），如 last7d：4,392,361,324 */
export const totalTokens = (m: LedgerMetrics) => m.reqInput + m.output;
/** 命中率口径 v3 = cacheHit / reqInput（对齐真图 97.3%，B17） */
export const hitRate = (m: LedgerMetrics) => m.cacheHit / m.reqInput;

/** 千分位：4392361324 → "4,392,361,324" */
export const formatInt = (v: number) => v.toLocaleString("en-US");

/** 用量数字本地化（D3，渲染层按语言选口径，ledger 数据本身保持纯数字）：
 *  zh = B18 现口径不变（≥1亿 → "43.74亿"、≥1万 → "1795.10万"，两位小数；否则原数 Math.round）；
 *  en = K/M/B 两位小数 + 单位前空格（≥1e9 → "4.37 B"、≥1e6 → "17.95 M"、≥1e3 → "1.23 K"），
 *  原数分支镜像 zh 的 Math.round（无千分位，999.5 → "1000"）。
 *  负数口径两语言刻意不同（测试锁死）：zh 判档用原值 v，故负数恒落原数分支（-4_374_410_324 → "-4374410324"，
 *  B18 红线不动）；en 判档用 Math.abs(v) 且输出保留负号（-1_234 → "-1.23 K"、-4_374_410_324 → "-4.37 B"）。 */
export function formatUnits(v: number, lang: Lang): string {
  if (lang === "zh") {
    if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
    if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
    return String(Math.round(v));
  }
  const a = Math.abs(v);
  if (a >= 1e9) return `${(v / 1e9).toFixed(2)} B`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(2)} M`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(2)} K`;
  return String(Math.round(v));
}

/** B18 中文单位别名：保留为 formatUnits(v, "zh") 的向后兼容入口，一个版本周期后移除 */
export function formatCN(v: number): string {
  return formatUnits(v, "zh");
}

/** Catmull-Rom → 三次贝塞尔平滑路径（零依赖，真图圆滑曲线） */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}`
       + ` ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}`
       + ` ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}
