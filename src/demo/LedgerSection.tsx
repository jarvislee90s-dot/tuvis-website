import { Fragment, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/i18n/useLang";
import { Reveal } from "@/components/Reveal";
import { Maximize2Icon, CloseIcon } from "@/components/Icons";
import { LEDGERS, totalTokens, hitRate, formatUnits, formatInt, smoothPath, type DistRow, type RangeKey } from "./ledgerData";

type DimKey = "tool" | "project" | "supplier";

const RANGES: RangeKey[] = ["last5h", "today", "last7d", "last30d", "custom"];
const DIMS: DimKey[] = ["tool", "project", "supplier"];

// 趋势图 viewBox 880×150（真应用看板卡内可用宽度等比，fontSize 9 的 x 轴标签不放大失真）
const W = 880, H = 150, PT = 8, PB = 16, PX = 8;

// 窗头红绿灯（装饰，同 WindowFrame 灯位）
const LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

export function LedgerSection() {
  const { t } = useTranslation();
  // 语言走 useLang（en* → en，其余 → zh）：用量单位随语言切 万/亿 ↔ K/M/B（D3）；
  // URL 权威、切语首帧不滞后；须在 /:lang 路由树内渲染
  const lang = useLang();
  const [range, setRange] = useState<RangeKey>("last7d");
  const [dim, setDim] = useState<DimKey>("tool");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // 单源取数：范围 chips 切换 → 全卡片联动该档数据
  const data = LEDGERS[range];
  const rows: DistRow[] = dim === "tool" ? data.byTool : dim === "project" ? data.byProject : data.bySupplier;

  // 趋势几何：平滑贝塞尔曲线 + 面积 + 全点（静态演示数据）
  const n = data.trend.tokens.length;
  const stepX = (W - PX * 2) / (n - 1);
  const peak = Math.max(...data.trend.tokens);
  const max = peak * 1.15;
  const px = (i: number) => PX + i * stepX;
  const py = (v: number) => H - PB - (v / max) * (H - PT - PB);
  const pts = data.trend.tokens.map((v, i) => ({ x: px(i), y: py(v) }));
  const curvePath = smoothPath(pts);
  const areaPath = `${curvePath} L${(W - PX).toFixed(1)},${H - PB} L${PX},${H - PB} Z`;
  // x 轴标签（B30）：≤14 个全出；>14 抽稀每 ceil(n/10) 出 1 + 末点必出（30 点 → 每 3 出 1 + 末点）
  const labelIdx = n <= 14
    ? data.trend.labels.map((_, i) => i)
    : data.trend.labels.map((_, i) => i).filter((i) => i % Math.ceil(n / 10) === 0 || i === n - 1);

  // 概要卡：大数字 + 两列指标网格（行序固定，行主序即图中左右两列）
  const M = data.metrics;
  const metricCells: { label: string; value: string; cmp: string }[] = [
    { label: t("usage.metric.input"), value: `~${formatUnits(M.inputEst, lang)}`, cmp: data.deltas.inputEst },
    { label: t("usage.metric.output"), value: formatUnits(M.output, lang), cmp: data.deltas.output },
    { label: t("usage.metric.reqInput"), value: formatUnits(M.reqInput, lang), cmp: data.deltas.reqInput },
    { label: t("usage.metric.cacheHit"), value: formatUnits(M.cacheHit, lang), cmp: data.deltas.cacheHit },
    { label: t("usage.metric.hitRate"), value: `${(hitRate(M) * 100).toFixed(1)}%`, cmp: data.deltas.hitRate },
    { label: t("usage.metric.requests"), value: formatInt(M.requests), cmp: data.deltas.requests },
  ];

  function onTrendMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    setHoverIdx(Math.min(n - 1, Math.max(0, Math.round((x - PX) / stepX))));
  }

  const rangeChip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[11.5px] transition ${
      active ? "border-app-btnp bg-app-btnp font-semibold text-white"
             : "border-app-line bg-app-bg font-medium text-app-mut hover:bg-app-accent/50 hover:text-app-ink"}`;
  const dimBtn = (active: boolean) =>
    `rounded-md border px-2.5 py-1 text-xs transition ${
      active ? "border-app-btnp bg-app-btnp text-white"
             : "border-app-line bg-app-bg text-app-mut hover:bg-app-accent/50 hover:text-app-ink"}`;
  const exportBtn = "rounded-md border border-app-line px-2 py-0.5 text-[11px] text-app-mut disabled:cursor-not-allowed disabled:opacity-60";
  const card = "rounded-xl border border-app-line bg-app-card p-4";

  return (
    <Reveal>
      <section id="ledger" className="scroll-mt-20">
        <div className="overflow-hidden rounded-lg border border-app-line bg-app-bg shadow-soft">
          {/* ① 窗头：标题 + 右上放大/关闭（静态，B19） */}
          <div className="relative flex h-9 items-center border-b border-app-line bg-app-bg px-3">
            <span className="flex gap-2" aria-hidden="true">
              {LIGHTS.map((c) => (
                <span key={c} className="h-[11px] w-[11px] rounded-full" style={{ background: c }} />
              ))}
            </span>
            <span className="pointer-events-none absolute inset-x-16 truncate text-center text-[11px] font-medium text-app-mut">
              {t("usage.title")}
            </span>
            <span className="ml-auto flex items-center gap-0.5 text-app-mut">
              <button type="button" disabled title={t("demo.na")} aria-label={t("usage.win.max")}
                className="rounded p-1 disabled:cursor-not-allowed disabled:opacity-60">
                <Maximize2Icon size={12} />
              </button>
              <button type="button" disabled title={t("demo.na")} aria-label={t("usage.win.close")}
                className="rounded p-1 disabled:cursor-not-allowed disabled:opacity-60">
                <CloseIcon size={12} />
              </button>
            </span>
          </div>

          {/* 看板窗：全展开（T44，去固定高与内滚，页面随内容延长） */}
          <div>
            {/* 头：范围 chips 5 档（默认近 7 天）+ 导出按钮排（静态，B19）+ 页签两枚（记录置灰）；
                吸顶已裁定去掉（B40）——无内滚容器后 sticky 失效语义且与 TopBar 层叠争位 */}
            <div className="border-b border-app-line px-4 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {RANGES.map((r) => (
                    <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={rangeChip(range === r)}>
                      {t(`usage.range.${r}`)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["copyText", "image", "copyImage", "settings", "csv"] as const).map((k) => (
                    <button key={k} type="button" disabled title={t("demo.na")} className={exportBtn}>
                      {t(`usage.export.${k}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-end gap-3">
                <button aria-pressed className="border-b-2 border-app-ink px-1 pb-0.5 text-xs font-medium text-app-ink">
                  {t("usage.tab.board")}
                </button>
                <button type="button" disabled title={t("demo.na")}
                  className="cursor-not-allowed px-1 pb-0.5 text-xs text-app-mut/50">
                  {t("usage.tab.record")}
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {/* ③ 概要卡：token 大数字（千分位）+ 副标 + 两列指标网格 + 截止时间行 + 口径页脚 */}
              <section className={card}>
                <div className="text-[32px] font-semibold leading-tight tabular-nums text-app-ink">
                  {formatInt(totalTokens(M))}
                </div>
                <p className="mt-1 text-xs text-app-mut">{t("usage.summary.subtitle")}</p>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {metricCells.map((c) => (
                    <div key={c.label} className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[11px] text-app-mut">{c.label}</span>
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        <span className="text-sm font-semibold tabular-nums text-app-ink">{c.value}</span>
                        <span className={`text-[10px] ${c.cmp.startsWith("+") ? "text-green-600" : c.cmp.startsWith("-") ? "text-red-600" : "text-app-mut"}`}>
                          ({c.cmp})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-baseline justify-between gap-3">
                  <span className="text-[11px] text-app-mut">{t("usage.metric.asOf")}</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-app-ink">{M.asOf}</span>
                </div>
                <p className="mt-3 text-[10px] text-app-mut">{t("usage.note")}</p>
              </section>

              {/* ④ 趋势卡：平滑贝塞尔曲线（880×150），无 y 轴刻度，hover 出「日期 · token 量 · 命中率」 */}
              <section className={card}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-app-ink">{t("usage.trend")}</h3>
                  <p className="text-[10px] text-app-mut">
                    {t("usage.peak")} {formatUnits(peak, lang)} / {t("usage.rangeTotal")} {formatUnits(totalTokens(M), lang)} ({data.deltas.trend})
                  </p>
                </div>
                <div className="relative mt-2" onMouseMove={onTrendMove} onMouseLeave={() => setHoverIdx(null)}>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("usage.trend")}>
                    <defs>
                      <linearGradient id="ledger-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--app-chart-a)" stopOpacity="0.35" />
                        <stop offset="1" stopColor="var(--app-chart-b)" stopOpacity="0.04" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75].map((r) => (
                      <line key={r} x1={PX} x2={W - PX} y1={PT + r * (H - PT - PB)} y2={PT + r * (H - PT - PB)}
                        stroke="var(--app-line)" opacity="0.25" strokeWidth="1" />
                    ))}
                    <path d={areaPath} fill="url(#ledger-area)" />
                    <path d={curvePath} fill="none" stroke="var(--app-chart-a)" strokeWidth="1.5"
                      strokeLinejoin="round" strokeLinecap="round" />
                    {data.trend.tokens.map((v, i) => (
                      <circle key={i} cx={px(i)} cy={py(v)} r="2.5" fill="var(--app-chart-a)" />
                    ))}
                    {labelIdx.map((i) => (
                      <text key={i} x={px(i)} y={H - 3} fontSize="9" fill="var(--app-mut)"
                        textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
                        {data.trend.labels[i]}
                      </text>
                    ))}
                  </svg>
                  {hoverIdx != null && (
                    <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-app-line bg-app-bg px-2 py-1 text-[11px] font-medium text-app-ink shadow-pop"
                      style={{ left: `${Math.min(88, Math.max(12, ((hoverIdx + 0.5) / n) * 100))}%` }}>
                      {data.trend.labels[hoverIdx]} · {formatUnits(data.trend.tokens[hoverIdx], lang)} · {t("usage.metric.hitRate")} {Math.round(data.trend.hit[hoverIdx] * 100)}%
                    </div>
                  )}
                </div>
              </section>

              {/* 工作小结卡：六行标签/mono 值，工具调用 2×2（不变） */}
              <section className={card}>
                <h3 className="text-sm font-semibold text-app-ink">{t("usage.work")}</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-app-mut">{t("usage.ws.agents")}</span>
                    <span className="font-mono text-app-ink">{data.work.agents}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-app-mut">{t("usage.ws.sessions")}</span>
                    <span className="font-mono text-app-ink">{data.work.sessions}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-app-mut">{t("usage.ws.turns")}</span>
                    <span className="font-mono text-app-ink">{data.work.turns}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-app-mut">{t("usage.ws.errors")}</span>
                    <span className="font-mono text-app-ink">{data.work.errors}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-app-mut">{t("usage.ws.longest")}</span>
                    <span className="font-mono text-app-ink">{data.work.longest}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-app-mut">{t("usage.ws.calls")}</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-right font-mono text-app-ink">
                      {data.work.calls.split(" | ").flatMap((part) => part.split(" · ")).map((cell) => (
                        <span key={cell}>{cell}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ⑤ 分布卡：三维切换 + 名称/值（随语言：zh 万/亿 或 en K/M/B）/占比条（分母 = totalTokens） */}
              <section className={card}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-app-ink">{t("usage.dist")}</h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {DIMS.map((d) => (
                      <button key={d} onClick={() => setDim(d)} aria-pressed={dim === d} className={dimBtn(dim === d)}>
                        {t(`usage.dim.${d}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,auto)_auto_minmax(80px,1fr)] items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="text-app-mut">{t(`usage.dim.${dim}`)}</span>
                  <span aria-hidden="true" />
                  <span className="text-app-mut">{t("usage.share")}</span>
                  {rows.map((r) => (
                    <Fragment key={r.name}>
                      <span className="truncate text-app-ink" title={r.name}>{r.name}</span>
                      <span className="text-right tabular-nums text-app-ink">{formatUnits(r.tokens, lang)}</span>
                      <span className="h-1.5 rounded-full bg-app-track">
                        <span className="block h-full rounded-full bg-app-chart-a"
                          style={{ width: `${Math.max(4, (r.tokens / totalTokens(M)) * 100)}%` }} />
                      </span>
                    </Fragment>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
