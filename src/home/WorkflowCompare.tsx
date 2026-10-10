import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";

/** 工作流对比区「没有兔维斯 vs 有兔维斯」（P13 重构）：问题与方案一一对应（左 5 = 右 5）。
 *  w2 = 原「错过审批」「出门失联」融合；w3 = 新增「移动端各自为政」；w4 方案半句拆入右列 t3；
 *  底部「兼容 …」文字行删除（被兼容矩阵区块替代）。 */
const WITHOUT_STEPS = [
  { icon: "🖥️", n: "1", t: "compare.w1t", d: "compare.w1d" },
  { icon: "⏸", n: "2", t: "compare.w2t", d: "compare.w2d" },
  { icon: "📵", n: "3", t: "compare.w3t", d: "compare.w3d" },
  { icon: "🧩", n: "4", t: "compare.w4t", d: "compare.w4d" },
  { icon: "🧾", n: "5", t: "compare.w5t", d: "compare.w5d" },
] as const;

const WITH_STEPS = [
  { icon: "📊", n: "1", t: "compare.t1t", d: "compare.t1d" },
  { icon: "📱", n: "2", t: "compare.t2t", d: "compare.t2d" },
  { icon: "🛰️", n: "3", t: "compare.t4t", d: "compare.t4d" },
  { icon: "🧩", n: "4", t: "compare.t3t", d: "compare.t3d" },
  { icon: "🧾", n: "5", t: "compare.t5t", d: "compare.t5d" },
] as const;

export function WorkflowCompare() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <SectionTitle tKey="compare.title" />
        <div className="grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* 左列卡「没有兔维斯」：红系 5 条（问题） */}
          <div className="rounded-[14px] border border-red-500/20 bg-red-500/[0.03] p-6">
            <h3 className="text-sm font-semibold text-red-700">🚦 {t("compare.without")}</h3>
            <div className="mt-4 space-y-4">
              {WITHOUT_STEPS.map((s) => (
                <div key={s.n} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/40 text-[11px] text-red-600">{s.n}</span>
                  <div>
                    <div className="text-base font-semibold">{s.icon} {t(s.t)}</div>
                    <p className="mt-0.5 text-sm text-inkdim">{t(s.d)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* VS 分隔：md+ 竖线 + 圆章；移动端横排分隔行 */}
          <div aria-hidden="true" className="flex h-10 w-full items-center md:h-auto md:w-10 md:flex-col">
            <span className="h-px flex-1 bg-line md:h-auto md:w-px" />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-line bg-card text-sm font-bold md:my-2">VS</span>
            <span className="h-px flex-1 bg-line md:h-auto md:w-px" />
          </div>
          {/* 右列卡「有兔维斯」：绿系 5 条（方案，与左列一一对应） */}
          <div className="rounded-[14px] border border-green-500/25 bg-green-500/[0.04] p-6">
            <h3 className="text-sm font-semibold text-green-700">✅ {t("compare.with")}</h3>
            <div className="mt-4 space-y-4">
              {WITH_STEPS.map((s) => (
                <div key={s.n} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-green-500/50 text-[11px] text-green-700">{s.n}</span>
                  <div>
                    <div className="text-base font-semibold">{s.icon} {t(s.t)}</div>
                    <p className="mt-0.5 text-sm text-inkdim">{t(s.d)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
