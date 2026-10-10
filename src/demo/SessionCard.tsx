import { useTranslation } from "react-i18next";
import type { Session, SessionState } from "./types";
import { toolOf } from "./tools";
import { CpuIcon, ClockIcon, BotIcon, ExternalLinkIcon, ChevronRightIcon } from "../components/Icons";

/** 8 工具徽标 tailwind 色板（还原主仓 agentBadge.tsx:41-85） */
const BADGE_PALETTE: Record<string, string> = {
  claude:    "border-orange-500/30 bg-orange-500/15 text-orange-800",
  codex:     "border-purple-500/30 bg-purple-500/15 text-purple-700",
  opencode:  "border-zinc-500/30 bg-zinc-500/15 text-zinc-700",
  openclaw:  "border-gray-500/30 bg-gray-500/15 text-gray-700",
  kimi:      "border-sky-500/30 bg-sky-500/15 text-sky-700",
  workbuddy: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700",
  zcode:     "border-indigo-500/30 bg-indigo-500/15 text-indigo-700",
  dsh:       "border-blue-500/30 bg-blue-500/15 text-blue-700",
};

/** 徽标显示名（codex 分 Codex APP/CLI；其余用 TOOLS label） */
const DISPLAY_NAME: Record<string, string> = { codex: "Codex APP" };

const LIGHT_BADGE_KEY = { running: "badge.running", waiting: "badge.waiting", idle: "badge.idle" } as const;

/** 状态灯（还原主仓 StatusLight）：实心圆点——waiting 红 + 呼吸 + 光晕 / running 黄 + 光晕 / idle 绿素点 */
function StatusLight({ state }: { state: SessionState }) {
  const { t } = useTranslation();
  const cls = {
    waiting: "bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)] animate-pulse motion-reduce:animate-none",
    running: "bg-yellow-500 shadow-[0_0_8px_2px_rgba(234,179,61,0.5)]",
    idle: "bg-green-500",
  }[state];
  return <span role="img" aria-label={t(LIGHT_BADGE_KEY[state])} className={`h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

/** 真应用会话卡（还原主仓 SessionCard.tsx:125-243，全部 app 令牌；无彩檐、无批准按钮）。
 *  onOpen 缺省 = 卡片 inert（cursor-default，不响应点击）；onDismiss 缺省 = X 不渲染。 */
export function SessionCard({ s, onOpen, onDismiss }: {
  s: Session; onOpen?: () => void; onDismiss?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const waiting = s.state === "waiting";
  return (
    <div onClick={onOpen}
      className={`group rounded-xl border bg-app-card p-3 text-app-ink transition hover:bg-app-accent/50 ${
        waiting ? "border-red-500/40" : "border-app-line"} ${onOpen ? "cursor-pointer" : "cursor-default"}`}>
      {/* 顶行：工具徽标 + 项目名 + 灰 mono 标题尾 + 分支 + 状态灯 + X */}
      <div className="flex items-center gap-1.5">
        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_PALETTE[s.tool]}`}>
          {DISPLAY_NAME[s.tool] ?? toolOf(s.tool).label}
        </span>
        <span className="truncate text-[13px] font-medium">{s.project}</span>
        <span className="truncate font-mono text-[10px] text-app-mut">{s.slug}</span>
        <span className="hidden truncate font-mono text-[10px] text-app-mut sm:block">{s.branch}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <StatusLight state={s.state} />
          {onDismiss && (
            <button type="button" aria-label="close"
              onClick={(e) => { e.stopPropagation(); onDismiss(s.id); }}
              className="text-app-mut/50 transition hover:text-app-ink">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </span>
      </div>
      {/* 中部：两行消息预览 */}
      <p className="mb-2 mt-1.5 line-clamp-2 min-h-[2.3rem] whitespace-pre-line text-[11px] text-app-mut">
        {s.messages.join("\n")}
      </p>
      {/* 底行：CPU · 时长 · 子代理 · ExternalLink · hover ChevronRight */}
      <div className="flex items-center gap-3 text-[10px] text-app-mut">
        <span className="flex items-center gap-1"><CpuIcon size={10} />{s.cpu}%</span>
        <span className="flex items-center gap-1"><ClockIcon size={10} />{s.minutes}m</span>
        <span className="flex items-center gap-1"><BotIcon size={10} />{s.agents}</span>
        <span className="ml-auto flex items-center gap-1">
          <button type="button" aria-label={t("demo.card.open")}
            onClick={(e) => { e.stopPropagation(); onOpen?.(); }} className="transition hover:text-app-ink">
            <ExternalLinkIcon size={10} />
          </button>
          <ChevronRightIcon size={10} className="opacity-0 transition group-hover:opacity-100" />
        </span>
      </div>
    </div>
  );
}
