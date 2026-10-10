import type { SVGProps } from "react";
import { AppWindowShell } from "./AppWindowShell";

/** Codex APP 窗（T35，对照 docs/design/p10-ref/codex-app-real.png）：
 *  ChatGPT Work 亮色双列——侧栏账户胶囊/Projects 任务树，主区标题条/树状计划卡/黑↑输入行。 */

/** 自绘 12px 线性图标（P9 ResourcesScene 先例，不入 components/Icons.tsx） */
const svgProps = {
  width: 12, height: 12, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": true,
} as const;
const Icon = {
  search: (p: SVGProps<SVGSVGElement>) => (
    <svg {...svgProps} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  ),
  pencil: (p: SVGProps<SVGSVGElement>) => (
    <svg {...svgProps} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
  ),
  clock: (p: SVGProps<SVGSVGElement>) => (
    <svg {...svgProps} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  compass: (p: SVGProps<SVGSVGElement>) => (
    <svg {...svgProps} {...p}><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-4 2 2-5Z" /></svg>
  ),
  panel: (p: SVGProps<SVGSVGElement>) => (
    <svg {...svgProps} {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>
  ),
  folder: (p: SVGProps<SVGSVGElement>) => (
    <svg {...svgProps} {...p}><path d="M3 7V5h6l2 2h10v12H3Z" /></svg>
  ),
};

/** 文案常量区（侧栏/主区真实内容，集中声明；中文照截图原文） */
const ACCOUNT = "ChatGPT Work";
const NAV = [
  { icon: "pencil", label: "New chat", medium: true },
  { icon: "clock", label: "Scheduled", medium: false },
  { icon: "compass", label: "Plugins", medium: false },
] as const;
const SEARCH_PLACEHOLDER = "搜索";
const PROJECTS = [
  { name: "tuvis-website", tasks: ["$agnes-image 生成参考图", "首页产品形态改版", "…任务树"] },
  { name: "tuvis-app", tasks: ["远程审批卡文案", "托盘三态接线", "测试一下", "你好", "Show more"] },
  { name: "tuvis-docs", tasks: ["快速上手精编", "FAQ 收集", "…"] },
];
const API_MONITOR = "ApiMonitor";
const FOOTER_USER = "zhipu_glm";

const CHAT_TITLE = "这个项目的作用是什么来着？…";
const TREE_TITLE = "项目结构";
const TREE = [
  "├─ docs/ 计划与参考图",
  "├─ src/ 站点与演示",
  "│  ├─ home/ 首页区块",
  "│  ├─ demo/ 四场景+账本",
  "│  └─ components/ 公共组件",
  "├─ public/img 静态资源",
  "├─ scripts/ 构建脚本",
  "└─ package.json",
];
const NOTES_TITLE = "几个说明";
const NOTES = [
  "这个仓库是兔维斯官网（Vite + React）",
  "演示数据全部本地模拟，无网络请求",
  "计划文档在 docs/superpowers/plans/",
];
const INPUT_HINT = "Work with ChatGPT";
const FULL_ACCESS = "⚠ Full access";
const MODEL_LABEL = "GLM-5.3-Flash High ▾";

/** Codex APP 任务窗（亮色）：窗底 #FFFFFF / 侧栏 #F9F9F9；d1 剧本 s4 与 codex 卡开窗承接。 */
export function CodexAppWindow({ className = "", onClose }: { className?: string; onClose?: () => void }) {
  return (
    <AppWindowShell className={`border-[#E5E5E5] bg-white text-[#18181B] ${className}`}
      sidebarClassName="border-[#ECECEC] bg-[#F9F9F9]"
      onClose={onClose}
      sidebar={
        <div className="flex h-full flex-col px-3 pb-3 text-[11px]">
          <div className="min-h-0 flex-1 overflow-hidden">
          {/* ② 账户胶囊 */}
          <button type="button" className="flex w-fit items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold">
            {ACCOUNT} <span aria-hidden className="text-[#71717A]">▾</span>
          </button>
          {/* ③ 搜索行 */}
          <div className="mt-3 flex items-center gap-2 text-[#71717A]">
            <Icon.search />
            <span>{SEARCH_PLACEHOLDER}</span>
          </div>
          {/* ④⑤⑥ 导航三行 */}
          <div className="mt-3 space-y-2">
            {NAV.map((item) => {
              const I = Icon[item.icon];
              return (
                <div key={item.label} className={`flex items-center gap-2 ${item.medium ? "font-medium" : ""}`}>
                  <span className="text-[#71717A]"><I /></span>{item.label}
                </div>
              );
            })}
          </div>
          {/* ⑦ Projects 组 + 三项目任务树（数据常量渲染，truncate） */}
          <div className="mt-4 text-[#A1A1AA]">Projects</div>
          <div className="mt-1.5 space-y-3">
            {PROJECTS.map((proj) => (
              <div key={proj.name}>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="text-[#71717A]"><Icon.folder /></span>{proj.name}
                </div>
                <div className="mt-1 space-y-1">
                  {proj.tasks.map((task) => (
                    <div key={task} className="truncate pl-[18px] text-[#71717A]">{task}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* ⑧ ApiMonitor */}
          <div className="mt-4 flex items-center gap-1.5 font-semibold">
            <span className="text-[#71717A]"><Icon.folder /></span>{API_MONITOR}
          </div>
          </div>
          {/* ⑨ footer（钉底：侧栏中部超限时截断，P13 统一定高） */}
          <div className="mt-2 flex shrink-0 items-center gap-1.5 border-t border-[#ECECEC] pt-2 text-[#71717A]">
            <span aria-hidden>⚙</span>{FOOTER_USER}
          </div>
        </div>
      }>
      {/* ① 标题条 */}
      <div className="flex h-10 items-center gap-2 border-b border-[#E5E5E5] px-3">
        <span className="truncate text-xs font-medium">{CHAT_TITLE}</span>
        <span aria-hidden className="text-[#71717A]">⋯</span>
        <span className="ml-auto text-[#71717A]"><Icon.panel width={13} height={13} /></span>
      </div>
      {/* ② 内容区：树状计划卡 + 几个说明（flex-1 撑满定高窗，输入条贴底） */}
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-4">
        <div className="rounded-lg border border-[#E5E5E5] p-3">
          <div className="text-xs font-semibold">{TREE_TITLE}</div>
          <div className="mt-1.5 space-y-0.5 font-mono text-[11px] text-[#71717A]">
            {TREE.map((line) => <div key={line} className="whitespace-pre">{line}</div>)}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold">{NOTES_TITLE}</div>
          <div className="mt-1.5 space-y-1 text-[11px] leading-relaxed">
            {NOTES.map((note) => <div key={note}>• {note}</div>)}
          </div>
        </div>
      </div>
      {/* ③ 底部输入行 */}
      <div className="shrink-0 border-t border-[#F0F0F0] p-3">
        <div className="rounded-2xl border border-[#E5E5E5] px-3 py-2 shadow-sm">
          <div className="text-[11px] text-[#71717A]">{INPUT_HINT}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <span aria-hidden className="text-[#71717A]">＋</span>
            <span className="text-[11px] text-[#D92D20]">{FULL_ACCESS}</span>
            <span className="ml-auto text-[11px] text-[#71717A]">{MODEL_LABEL}</span>
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[11px] text-white">↑</span>
          </div>
        </div>
      </div>
    </AppWindowShell>
  );
}
