import type { SVGProps } from "react";
import { useLang } from "@/i18n/useLang";
import { AppWindowShell } from "./AppWindowShell";

/** WorkBuddy APP 窗（T35，对照 docs/design/p10-ref/workbuddy-real.png）：
 *  亮色双列——侧栏导航/任务(3)/空间(5)双列表 + Buddy 加油站浮卡，主区「你是什么模型」对话 + 绿↑输入行。 */

/** 自绘 12px 线性图标（P9 ResourcesScene 先例） */
const svgProps = {
  width: 12, height: 12, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": true,
} as const;
const Icon = {
  plus: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M12 5v14M5 12h14" /></svg>,
  user: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-5 8-5s6.5 1 8 5" /></svg>,
  grid: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>,
  timer: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>,
  book: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h14" /></svg>,
  dots: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>,
  search: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  share: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>,
  doc: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M6 2h9l5 5v15H6Z" /><path d="M14 2v6h6" /></svg>,
  panel: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>,
  copy: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>,
  like: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M7 11v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm0 0 4-8a2.4 2.4 0 0 1 2.4 2.4V9H19a2 2 0 0 1 2 2.4l-1.2 7A2 2 0 0 1 17.8 20H7" /></svg>,
  dislike: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M17 13V3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1Zm0 0-4 8a2.4 2.4 0 0 1-2.4-2.4V15H5a2 2 0 0 1-2-2.4l1.2-7A2 2 0 0 1 6.2 4H17" /></svg>,
  speaker: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M11 5 6 9H3v6h3l5 4Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" /></svg>,
  retry: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 3v6h-6" /></svg>,
  bell: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>,
  headset: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /></svg>,
  mic: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>,
};

/** 语言无关常量（真实产品英文 UI，zh/en 同显）：应用名/版本号/模型标签留常量，不进 COPY */
const APP_TITLE = "WorkBuddy";
const APP_VERSION = "5.7.6";
const MODEL_LABEL = "Hy4 preview ▾";

/** 导航角标位（语言无关）：按位对齐 COPY.nav——下标 i 的角标挂第 i 行，"assistant"/"more" 为 COPY.navBadge 的键；
 *  末位 more 角标靠右（原「中文键名 → 角标」映射改为语言无关键名）。
 *  ⚠ 硬约束：增删/重排 COPY.nav 必须同步本数组及下方图标数组（长度与下标都要对；越界即 undefined 崩溃）
 *  ——错位会把角标挂到别的行上。 */
const NAV_BADGE = [null, "assistant", null, null, null, "more"] as const;

/** 批次 3 COPY 模式（T3.3；模板说明见 copy.parity.test.ts 头注释）：
 *  窗内随语言变化的文案收进 COPY.{zh,en}，渲染处 const t = COPY[useLang()]；
 *  en 子树以 `: typeof ZH` 标注互校；zh 逐字保留现状（红线）；en 为产品英文版 UI 口径。 */
const ZH = {
  discover: "发现应用",
  nav: ["新建任务", "助理", "专家·技能·连接器", "定时任务", "资料库", "更多"],
  /** 导航角标（键名与 NAV_BADGE 对齐）：助理 = BETA、更多 = 灵感 */
  navBadge: { assistant: "BETA", more: "灵感" },
  tasksLabel: "任务(3)",
  tasks: [
    { name: "规划看板红绿灯联动", date: "10月10日" },
    { name: "询问模型身份", date: "10月4日" },
    { name: "远程审批卡文案润色", date: "10月2日" },
  ],
  spacesLabel: "空间(5)",
  /** 空间列表：无日期行不写 date 键（③ 叶子非空，不用 "" 哨兵） */
  spaces: [
    { name: "tuvis-app·会话看板", date: "10月11日" },
    { name: "tuvis-website·首页文案", date: "10月9日" },
    { name: "tuvis-docs·手册精编" },
    { name: "账本分享图" },
  ],
  footerUser: "李佳卫",
  /** 加油站浮卡：en claimable 尾随空格承接加粗点数值（zh 直连无空格，故空格只能留在文案内） */
  station: { title: "Buddy加油站", claimable: "今日可领", points: "100 积分", claim: "立即领取" },
  chatTitle: "你是什么模型",
  userBubble: "你是什么模型",
  replyStatus: "已完成 15s ›",
  reply: [
    "我是 WorkBuddy 内置的助手 Hy4（Hybrid-4 preview）。",
    "由 Z.ai 训练的大语言模型驱动，当前以 preview 档位运行，上下文 128k。",
    "需要我继续处理「终稿 md 最后一段」吗？",
  ],
  costLabel: "共消耗 ◇3.08 · Hy4 preview",
  inputHint: "今天帮你做些什么？@ 添加上下文，/调用技能与指令",
  fullAccess: "⚠允许完全访问",
  aiFooter: "内容由 AI 生成，请核实重要信息",
};
const EN: typeof ZH = {
  discover: "Discover apps",
  nav: ["New task", "Assistant", "Experts · Skills · Connectors", "Scheduled tasks", "Library", "More"],
  navBadge: { assistant: "BETA", more: "Inspiration" },
  tasksLabel: "Tasks (3)",
  tasks: [
    { name: "Plan board status-light wiring", date: "Oct 10" },
    { name: "Ask about model identity", date: "Oct 4" },
    { name: "Remote approval card copy polish", date: "Oct 2" },
  ],
  spacesLabel: "Spaces (5)",
  spaces: [
    { name: "tuvis-app · Session board", date: "Oct 11" },
    { name: "tuvis-website · Homepage copy", date: "Oct 9" },
    { name: "tuvis-docs · Manual polish" },
    { name: "Ledger share graphic" },
  ],
  footerUser: "Li Jiawei",
  station: { title: "Buddy Boost", claimable: "Claimable today: ", points: "100 credits", claim: "Claim now" },
  chatTitle: "What model are you?",
  userBubble: "What model are you?",
  replyStatus: "Done in 15s ›",
  reply: [
    "I'm Hy4, the assistant built into WorkBuddy (Hybrid-4 preview).",
    "Powered by a large language model trained by Z.ai, running in preview mode with a 128k context.",
    "Want me to continue with the last paragraph of the final md?",
  ],
  costLabel: "Used ◇3.08 · Hy4 preview",
  inputHint: "What can I help you with today? @ to add context, / to invoke skills and commands",
  fullAccess: "⚠ Full access",
  aiFooter: "AI-generated content — please verify important information",
};
export const COPY = { zh: ZH, en: EN } as const;

/** WorkBuddy APP 任务窗（亮色）：窗底 #FFFFFF / 侧栏 #F6F8F5、识别绿 #4AD06A；d1 剧本 s6 与 workbuddy 卡开窗承接。
 *  窗内文案取 COPY（zh/en），侧栏图标/应用名/模型标签为语言无关常量。 */
export function WorkBuddyAppWindow({ className = "", onClose }: { className?: string; onClose?: () => void }) {
  const t = COPY[useLang()];
  return (
    <AppWindowShell className={`border-[#E5E5E5] bg-white text-[#1F2321] ${className}`}
      sidebarClassName="border-[#E7EBE6] bg-[#F6F8F5]"
      onClose={onClose}
      sidebar={
        <div className="relative flex h-full flex-col px-3 pb-2 text-[11px]">
          <div className="min-h-0 flex-1 overflow-hidden">
          {/* ② 标题 + 版本 + 发现应用胶囊 */}
          <div className="flex items-start gap-2">
            <div>
              <div className="text-xs font-semibold">{APP_TITLE}</div>
              <div className="text-[10px] text-[#6B7280]">{APP_VERSION}</div>
            </div>
            <span className="ml-auto rounded-full border border-[#4AD06A]/40 bg-[#4AD06A]/10 px-2.5 py-1 text-[#2E9E52]">
              {t.discover} <span aria-hidden>▾</span>
            </span>
          </div>
          {/* ④ 导航 6 行（自绘 12px 图标位；角标位取 NAV_BADGE，文案取 COPY） */}
          <div className="mt-3 space-y-2">
            {t.nav.map((label, i) => {
              const I = [Icon.plus, Icon.user, Icon.grid, Icon.timer, Icon.book, Icon.dots][i];
              const badgeKey = NAV_BADGE[i];
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[#6B7280]"><I /></span>{label}
                  {badgeKey && (
                    <span className={`text-[9px] text-[#6B7280] ${badgeKey === "more" ? "ml-auto" : ""}`}>{t.navBadge[badgeKey]}</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* ⑤ 任务(3) */}
          <div className="mt-4 text-[#9CA3AF]">{t.tasksLabel}</div>
          <div className="mt-1 space-y-1.5">
            {t.tasks.map((task) => (
              <div key={task.name} className="flex items-center gap-2">
                <span className="truncate">{task.name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-[#9CA3AF]">{task.date}</span>
              </div>
            ))}
          </div>
          {/* ⑥ 空间(5) */}
          <div className="mt-4 text-[#9CA3AF]">{t.spacesLabel}</div>
          <div className="mt-1 space-y-1.5">
            {t.spaces.map((space) => (
              <div key={space.name} className="flex items-center gap-2">
                <span className="truncate">{space.name}</span>
                {space.date && <span className="ml-auto shrink-0 text-[10px] text-[#9CA3AF]">{space.date}</span>}
              </div>
            ))}
          </div>
          {/* ⑦ footer（钉底：侧栏中部超限时截断，P13 统一定高） */}
          </div>
          <div className="mt-2 flex shrink-0 items-center gap-1.5 border-t border-[#E7EBE6] pt-2">
            <span aria-hidden className="h-5 w-5 shrink-0 rounded-full bg-[#4AD06A]" />
            <span className="truncate">{t.footerUser}</span>
            <span className="ml-auto flex items-center gap-2 text-[#6B7280]"><Icon.bell /><Icon.headset /></span>
          </div>
          {/* ⑧ Buddy 加油站浮卡（绝对定位于侧栏 relative 内） */}
          <div className="absolute bottom-10 left-2 right-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px]">
            <div className="font-semibold">{t.station.title} <span aria-hidden className="float-right text-[#9CA3AF]">×</span></div>
            <div className="mt-0.5 text-[#6B7280]">{t.station.claimable}<span className="font-semibold text-amber-600">{t.station.points}</span></div>
            <div className="mt-1.5 w-fit rounded-md bg-[#1F2321] px-2 py-1 text-white">{t.station.claim}</div>
          </div>
        </div>
      }>
      {/* ① 标题条 + 右侧五图标 */}
      <div className="flex h-10 items-center border-b border-[#E5E5E5] px-3">
        <span className="truncate text-xs font-medium">{t.chatTitle}</span>
        <span className="ml-auto flex items-center gap-2.5 text-[#9CA3AF]">
          <Icon.search width={13} height={13} /><Icon.share width={13} height={13} />
          <Icon.timer width={13} height={13} /><Icon.doc width={13} height={13} />
          <Icon.panel width={13} height={13} />
        </span>
      </div>
      {/* ② 聊天区：用户气泡 + 助手块（flex-1 撑满定高窗） */}
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-4">
        <div className="ml-auto w-fit max-w-[75%] rounded-2xl rounded-tr-md bg-[#F2F3F5] px-3 py-2 text-xs">{t.userBubble}</div>
        <div className="flex gap-2">
          <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4AD06A] text-[10px] font-bold text-white">W</span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[#9CA3AF]">{t.replyStatus}</div>
            <div className="mt-1 space-y-1.5 text-xs leading-relaxed">
              {t.reply.map((para) => <div key={para}>{para}</div>)}
            </div>
            {/* 操作排：复制/赞/踩/喇叭/重试/分享/⋯ + 消耗 */}
            <div className="mt-2 flex items-center gap-2.5 text-[#9CA3AF]">
              <Icon.copy /><Icon.like /><Icon.dislike /><Icon.speaker /><Icon.retry /><Icon.share />
              <Icon.dots />
              <span className="ml-auto text-[10px]">{t.costLabel}</span>
            </div>
          </div>
        </div>
      </div>
      {/* ③ 输入区 */}
      <div className="shrink-0 border-t border-[#E5E5E5] p-3">
        <div className="rounded-2xl border border-[#E5E5E5] p-2">
          <div className="text-[11px] text-[#6B7280]">{t.inputHint}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span aria-hidden className="text-[#6B7280]">＋</span>
            <span className="text-[#D92D20]">{t.fullAccess} <span aria-hidden>▾</span></span>
            <span className="ml-auto text-[#6B7280]">{MODEL_LABEL}</span>
            <span className="text-[#6B7280]"><Icon.mic /></span>
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4AD06A] text-white">↑</span>
          </div>
        </div>
      </div>
      {/* ④ 页脚 */}
      <div className="shrink-0 py-1.5 text-center text-[10px] text-[#9CA3AF]">{t.aiFooter}</div>
    </AppWindowShell>
  );
}
