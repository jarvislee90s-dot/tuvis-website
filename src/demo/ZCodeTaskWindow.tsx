import type { SVGProps } from "react";
import { AppWindowShell } from "./AppWindowShell";

/** ZCode 任务窗（T35 暗色版，对照 docs/design/p10-ref/zcode-real-dark.png；用户裁决 2026-10-11：按暗色系实现）：
 *  暗色双列——侧栏 #1B1B22（新建任务/搜索/自动化/插件市场/分组·项目 toggle/置顶/三项目组任务列表），
 *  主区 #15151A（任务标题栏 + 事件流：思考/终端/提问/待办/子智能体 + 黑↑输入条）。 */

/** 自绘 12px 线性图标（P9 ResourcesScene 先例） */
const svgProps = {
  width: 12, height: 12, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": true,
} as const;
const Icon = {
  arrowL: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M19 12H5m6-6-6 6 6 6" /></svg>,
  arrowR: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>,
  plus: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M12 5v14M5 12h14" /></svg>,
  search: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  zap: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6Z" /></svg>,
  grid: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>,
  star: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p} fill="currentColor" stroke="none"><path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 16.9 5.9 20.4l1.5-6.8L2.2 9l6.9-.7Z" /></svg>,
  gear: (p: SVGProps<SVGSVGElement>) => <svg {...svgProps} {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" /></svg>,
};

/** 文案常量区（侧栏/事件流真实内容，集中声明；中文照暗色截图原文，截断行由 truncate 呈现） */
const NEW_TASK = "新建任务";
const NEW_TASK_KBD = "Ctrl+N";
const SEARCH_PLACEHOLDER = "搜索";
const SEARCH_KBD = "Ctrl+K";
const SIDEBAR_NAV = ["自动化", "插件市场"];
const GROUP_TOGGLE = ["# 分组", "□ 项目"] as const;
const PINNED_LABEL = "已置顶";
const PINNED = { title: "Fork of 分析PR1550-继续追问", time: "44天" };
const PROJECTS_LABEL = "项目";

/** 三项目组：star 标记（红=运行中 / 灰=星标）、badge（等待确认 黄标）、more（显示更多）——tuvis 生态语境（P13） */
const PROJECTS = [
  {
    name: "tuvis-app",
    tasks: [
      { title: "远程审批状态机：允许后自动续跑", time: "刚刚", star: "red" as const },
      { title: "托盘图标三态防抖切换", time: "4天" },
      { title: "看板红绿灯与通知联动", time: "7天" },
      { title: "子 Agent 观察台数据接入", time: "8天" },
      { title: "清理feat/m2分支并拉取feat/m3", time: "25天" },
    ],
    more: true,
  },
  {
    name: "tuvis-docs",
    tasks: [
      { title: "用户手册第十三篇校对", time: "刚刚", star: "plain" as const },
      { title: "手册截图随 v0.5.6 更新", time: "6分" },
      { title: "FAQ 从 Issues 归档", time: "22小时" },
      { title: "docs 构建监控守夜", time: "22小时" },
      { title: "中英术语表对齐", time: "2天" },
    ],
    more: true,
  },
  {
    name: "tuvis-website",
    tasks: [
      { title: "执行 P13 计划：首页重排与上线准备", badge: "等待确认" },
      { title: "演示 D2 手机按 remote-ui 定稿重做", time: "1天" },
      { title: "兼容矩阵列序对齐", time: "12小时" },
      { title: "部署 workflow 三触发线", time: "12小时" },
      { title: "更新AgnesProject生图模型并转化为生", time: "1天" },
    ],
    more: false,
  },
] as const;
const FOOTER_USER = "Jarvis666 Pro";

const TASK_TITLE = "📁 执行 tuvis-website executor-prompt 计划";
const TITLE_BTNS = ["📁▾", "⬆", "?", "布局"] as const;
const WIN_CTRL = "— □ ×";
const MORE_LABEL = "显示更多";

/** 事件流（暗色图真实条目，自上而下）：think 思考行 / text 正文 / term 终端块 / ask 提问 / todo 待办 / sub 子智能体 / done 已完成 */
const EVENT_STREAM: (
  | { k: "think" }
  | { k: "text"; t: string }
  | { k: "term"; t: string }
  | { k: "ask"; t: string }
  | { k: "todo"; t: string }
  | { k: "sub"; agent: string; t: string }
  | { k: "done"; t: string }
)[] = [
  { k: "think" },
  { k: "text", t: "P10 计划落盘（662 行，T34–T39 六任务）。入库并请你批准。" },
  { k: "term", t: "git add docs/superpowers/plans/2026-10-11-tuvis-website-p10-final-polish.md docs/design/p10-ref/ && git commit -m \"docs: p10 final-polish plan draft\"" },
  { k: "ask", t: "已询问 1 个问题" },
  { k: "todo", t: "待办 T34: 首页 CC Switch 式重构 2/8" },
  { k: "sub", agent: "general-purpose", t: "实现 T34 首页重构" },
  { k: "text", t: "T34 完成（241 key）。浏览器自检新首页，然后提交派 T35。" },
  { k: "term", t: "pnpm exec tsc --noEmit && echo TSC_OK && pnpm test 2>&1 | grep -E \"Tests *\" && pnpm build 2>&1 | tail -1" },
  { k: "done", t: "自检 CC Switch 式新首页" },
  { k: "think" },
  { k: "text", t: "新首页结构正确。截图捕捉在入场动画半透明期，海报缩略图看起来是空白框——确认图片是否真实渲染。" },
  { k: "done", t: "核查海报缩略渲染" },
  { k: "think" },
  { k: "text", t: "海报缩略（140×200）与三色灯行渲染完美。提交 T34，派 T35。" },
  { k: "term", t: "pkill -f vite 2>/dev/null; sleep 2; netstat -ano | grep LISTENING | grep -E \":517[0-9]\" | awk '{print $5}' | sort -u" },
  { k: "todo", t: "待办 T35: D1 宽幅 + 三 APP 窗 3/8" },
  { k: "sub", agent: "general-purpose", t: "实现 T35 三 APP 窗" },
];
const THINK_LABEL = "思考";
const THINK_DUR = "持续了几秒";
const TERM_LABEL = "终端";
const DONE_LABEL = "已完成";
const SUB_LABEL = "子智能体";

const INPUT_ACCESS = "🛡完全访问 ▾";
const INPUT_COMPUTER = "🖥电脑操作";
const INPUT_MODEL = "GLM-5.3-Flash ▾";
const INPUT_EFFORT = "🧠最高 ▾";

/** ZCode 任务窗（暗色）：侧栏 #1B1B22 / 主区 #15151A / 蓝 #3B82F6；d1 剧本 s7 与 zcode 卡开窗承接。 */
export function ZCodeTaskWindow({ className = "", onClose }: { className?: string; onClose?: () => void }) {
  return (
    <AppWindowShell className={`border-[#2E2E33] bg-[#15151A] text-[#D4D4D8] ${className}`}
      sidebarClassName="border-[#2E2E33] bg-[#1B1B22]"
      onClose={onClose}
      sidebar={
        <div className="flex h-full flex-col px-2.5 pb-2 text-[11px]">
          <div className="min-h-0 flex-1 overflow-hidden">
          {/* ② 顶行：Z logo + ←/→ */}
          <div className="flex items-center gap-2 px-0.5">
            <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded bg-[#3B82F6] text-[11px] font-bold text-white">Z</span>
            <span className="ml-1 text-[#8B8F98]"><Icon.arrowL /></span>
            <span className="text-[#8B8F98]"><Icon.arrowR /></span>
          </div>
          {/* ③ 新建任务 + Ctrl+N */}
          <div className="mt-3 flex items-center gap-2 rounded-md bg-[#26262E] px-2 py-1.5">
            <span className="text-[#8B8F98]"><Icon.plus /></span>
            <span>{NEW_TASK}</span>
            <span className="ml-auto font-mono text-[10px] text-[#8B8F98]">{NEW_TASK_KBD}</span>
          </div>
          {/* ④ 搜索框 + Ctrl+K */}
          <div className="mt-1.5 flex items-center gap-2 rounded-md border border-[#2E2E33] px-2 py-1 text-[#8B8F98]">
            <Icon.search />
            <span>{SEARCH_PLACEHOLDER}</span>
            <span className="ml-auto font-mono text-[10px]">{SEARCH_KBD}</span>
          </div>
          {/* ⑤ 自动化 / 插件市场 */}
          <div className="mt-2 space-y-1.5 px-0.5">
            {SIDEBAR_NAV.map((label, i) => {
              const I = i === 0 ? Icon.zap : Icon.grid;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[#8B8F98]"><I /></span>{label}
                </div>
              );
            })}
          </div>
          {/* ⑥ toggle：□ 项目 选中（暗色图） */}
          <div className="mt-2.5 flex items-center gap-1 px-0.5 text-[#8B8F98]">
            <span>{GROUP_TOGGLE[0]}</span>
            <span className="rounded bg-[#26262E] px-1.5 py-0.5 text-white">{GROUP_TOGGLE[1]}</span>
          </div>
          {/* ⑦ 已置顶 */}
          <div className="mt-3 px-0.5 text-[10px] text-[#8B8F98]">{PINNED_LABEL}</div>
          <div className="mt-1 flex items-center gap-1.5 px-0.5">
            <span aria-hidden className="text-[10px]">📌</span>
            <span className="truncate">{PINNED.title}</span>
            <span className="ml-auto shrink-0 text-[10px] text-[#8B8F98]">{PINNED.time}</span>
          </div>
          {/* ⑧ 项目组 ×3（数据常量渲染；星标/黄标/显示更多） */}
          <div className="mt-3 px-0.5 text-[10px] text-[#8B8F98]">{PROJECTS_LABEL}</div>
          <div className="mt-1 space-y-3">
            {PROJECTS.map((proj) => (
              <div key={proj.name}>
                <div className="truncate px-0.5 font-semibold">{proj.name}</div>
                <div className="mt-1 space-y-1">
                  {proj.tasks.map((task) => (
                    <div key={task.title} className="flex items-center gap-1.5 px-0.5">
                      {"star" in task && task.star === "red" && <Icon.star className="shrink-0 text-[#E5645A]" />}
                      {"star" in task && task.star === "plain" && <Icon.star className="shrink-0 text-[#8B8F98]" />}
                      <span className="truncate">{task.title}</span>
                      {"badge" in task && task.badge
                        ? <span className="ml-auto shrink-0 rounded-full bg-[#3A3323] px-1.5 text-[10px] text-[#E5C07B]">{task.badge}</span>
                        : <span className="ml-auto shrink-0 text-[10px] text-[#8B8F98]">{"time" in task ? task.time : ""}</span>}
                    </div>
                  ))}
                  {proj.more && <div className="px-0.5 text-[#8B8F98]">{MORE_LABEL}</div>}
                </div>
              </div>
            ))}
          </div>
          {/* ⑨ footer（钉底：侧栏中部超限时截断，P13 统一定高） */}
          </div>
          <div className="mt-2 flex shrink-0 items-center gap-1.5 border-t border-[#2E2E33] pt-2">
            <span aria-hidden className="h-5 w-5 shrink-0 rounded-full bg-[#3B82F6]/70" />
            <span className="truncate text-[#E5C07B]">{FOOTER_USER}</span>
            <span className="ml-auto text-[#8B8F98]"><Icon.gear /></span>
          </div>
        </div>
      }>
      {/* ① 任务标题栏：📁 标题 + ⋯ + 📁▾/⬆/?/布局 + —□× */}
      <div className="flex h-9 items-center gap-2 border-b border-[#2E2E33] px-3">
        <span className="truncate text-xs font-medium">{TASK_TITLE}</span>
        <span aria-hidden className="text-[#8B8F98]">⋯</span>
        <span className="ml-auto flex shrink-0 items-center gap-2.5 text-[12px] text-[#8B8F98]">
          {TITLE_BTNS.map((b) => <span key={b}>{b}</span>)}
        </span>
        <span aria-hidden className="shrink-0 text-[10px] text-[#8B8F98]">{WIN_CTRL}</span>
      </div>
      {/* ② 事件流（真实条目；flex-1 撑满定高窗，输入条贴底） */}
      <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden p-3 text-[11px]">
        {EVENT_STREAM.map((ev, i) => {
          switch (ev.k) {
            case "think":
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span aria-hidden>🧠</span>
                  <span>{THINK_LABEL}</span>
                  <span className="rounded-full bg-[#24242C] px-1.5 text-[10px] text-[#8B8F98]">{THINK_DUR}</span>
                </div>
              );
            case "text":
              return <div key={i}>{ev.t}</div>;
            case "term":
              return (
                <div key={i} className="space-y-0.5 rounded-md bg-[#101014] px-2 py-1 font-mono text-[#8B8F98]">
                  <div className="flex items-center gap-1.5"><span aria-hidden>▢</span>{TERM_LABEL}</div>
                  <div className="truncate">{ev.t}</div>
                </div>
              );
            case "ask":
              return <div key={i} className="text-[#8B8F98]"><span aria-hidden>❓</span> {ev.t}</div>;
            case "todo":
              return <div key={i}><span aria-hidden>☑</span> {ev.t}</div>;
            case "sub":
              return (
                <div key={i}>
                  <span aria-hidden>👤</span> {SUB_LABEL} <span className="text-[#3B82F6]">{ev.agent}</span>
                  <span className="text-[#8B8F98]"> · {ev.t}</span>
                </div>
              );
            case "done":
              return (
                <div key={i} className="flex items-center gap-1.5 text-[#8B8F98]">
                  <span aria-hidden>🔍</span>{ev.t}
                  <span className="rounded-full bg-[#24242C] px-1.5 text-[10px]">{DONE_LABEL}</span>
                </div>
              );
          }
        })}
      </div>
      {/* ③ 底部输入条 */}
      <div className="shrink-0 p-3">
        <div className="flex items-center gap-2 rounded-full bg-[#1E1E26] px-3 py-2 text-[11px]">
          <span aria-hidden className="text-[#8B8F98]">＋</span>
          <span>{INPUT_ACCESS}</span>
          <span>{INPUT_COMPUTER}</span>
          <span className="ml-auto">{INPUT_MODEL}</span>
          <span>{INPUT_EFFORT}</span>
          <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[11px] text-white">↑</span>
        </div>
      </div>
    </AppWindowShell>
  );
}
