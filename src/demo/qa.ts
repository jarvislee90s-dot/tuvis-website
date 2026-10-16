import type { Lang } from "@/i18n";
import type { Bilingual } from "./types";

/** 题卡数据表与显示纯函数（M9：自 ClaudeTui.tsx 内联提取单文件收口）。
 *  ClaudeTui 场景（select/multiselect）与手机 RemoteDetail 题卡引用同一份，保证左右一致（P19）。
 *  D9 契约：picked 只存 id（语言无关）；title/desc/question 为 {zh,en} 双语（T3.3 COPY 化），显示时按 lang 取。
 *  id 只增不改——种子/脚本（steps-d2 等）的 picked 与它绑死；不得用显示串或数组下标当 id。
 *  zh 逐字保留现状（红线）；en 为产品英文版 UI 口径（批次 3）。 */

export type QaKind = "single" | "multi";

export interface QaOption {
  id: string;
  title: Bilingual;
  desc?: Bilingual;
}

/** 单选（ClaudeTui select 场景）：题目领域 + 三选项（带描述） */
export const QA_SINGLE: { question: Bilingual; options: readonly QaOption[] } = {
  question: { zh: "这道题属于哪个领域？", en: "Which topic does this question belong to?" },
  options: [
    {
      id: "finance",
      title: { zh: "金融/信用评级", en: "Finance / credit ratings" },
      desc: { zh: "宏观利率、行业景气与企业信用", en: "Macro rates, industry cycles and corporate credit" },
    },
    {
      id: "supply-chain",
      title: { zh: "产业/供应链", en: "Industries / supply chain" },
      desc: { zh: "上中下游产能、库存与价格传导", en: "Upstream–downstream capacity, inventory and price pass-through" },
    },
    {
      id: "methodology",
      title: { zh: "方法论/工程", en: "Methodology / engineering" },
      desc: { zh: "因子构造、回测框架与数据管道", en: "Factor construction, backtest frameworks and data pipelines" },
    },
  ],
};

/** 多选（ClaudeTui multiselect 场景）：六选项；末两项为真机英文项（zh/en 同显，逐字保留现状） */
export const QA_MULTI: { question: Bilingual; options: readonly QaOption[] } = {
  question: { zh: "想让我考你哪个领域的多选题？", en: "Which topic should I quiz you on?" },
  options: [
    {
      id: "finance",
      title: { zh: "金融/信用评级", en: "Finance / credit ratings" },
      desc: { zh: "贴合你的工作场景，比如债券、信用评级、持仓管理类题目", en: "Fit your day-to-day work — bonds, credit ratings, portfolio management" },
    },
    {
      id: "investing",
      title: { zh: "投资理财常识", en: "Personal investing" },
      desc: { zh: "股票、基金、个人理财等实用金融常识", en: "Practical basics on stocks, funds and personal finance" },
    },
    {
      id: "life-trivia",
      title: { zh: "生活/趣味常识", en: "Life / everyday trivia" },
      desc: { zh: "历史、地理、科学、生活百科等轻松题目", en: "Easy questions on history, geography, science and daily life" },
    },
    {
      id: "random",
      title: { zh: "随便来一道", en: "Surprise me" },
      desc: { zh: "我来随机选一个领域，给你出题", en: "I'll pick a random topic and quiz you" },
    },
    { id: "type-something", title: { zh: "Type something.", en: "Type something." } },
    { id: "chat", title: { zh: "Chat about this", en: "Chat about this" } },
  ],
};

/** D9：picked 存 id → 显示时按 id 取当前语言显示串（未登记 id 原样回退 + DEV 告警，防旧种子/脏脚本静默吞） */
export function qaOptionTitle(kind: QaKind, id: string, lang: Lang): string {
  const options = kind === "single" ? QA_SINGLE.options : QA_MULTI.options;
  const hit = options.find((o) => o.id === id);
  if (!hit && import.meta.env.DEV) console.warn(`[demo] 未登记的 QA 选项 id：${kind}/${id}——回退原样显示`);
  return hit?.title[lang] ?? id;
}

/** D9：提交回显 = picked id 列表 → 当前语言显示串；join 分隔符按语言（en「, 」/ zh「、」） */
export function pickedDisplayText(q: { kind: QaKind; picked: string | string[] | null }, lang: Lang): string {
  if (q.kind === "single") return typeof q.picked === "string" ? qaOptionTitle("single", q.picked, lang) : "";
  const ids = Array.isArray(q.picked) ? q.picked : [];
  return ids.map((id) => qaOptionTitle("multi", id, lang)).join(lang === "en" ? ", " : "、");
}

/** D9：提交回显整行 = 前缀（调用方传已翻译 label）+ 语言化分隔冒号 + 显示串；/en 不落全角「：」。
 *  无可显示项（空 picked）返回空串——调用方据此整行不渲染，防「已提交：」悬空标签（M5） */
export function submittedDisplayText(
  label: string,
  q: { kind: QaKind; picked: string | string[] | null },
  lang: Lang,
): string {
  const list = pickedDisplayText(q, lang);
  return list === "" ? "" : `${label}${lang === "en" ? ": " : "："}${list}`;
}
