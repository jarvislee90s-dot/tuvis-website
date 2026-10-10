import { useTranslation } from "react-i18next";
import { ActivityIcon, AlertCircleIcon } from "../components/Icons";
import { useDemo } from "./store";
import type { Session } from "./types";
import { TOOLS } from "./tools";
import { ToolChip } from "./ToolChip";
import { SessionCard } from "./SessionCard";
import { WindowFrame } from "./WindowFrame";

/** 看板窗内点卡开窗：六工具各开对应原生窗（单槽互斥，P13 增 OpenCode）；openclaw/dsh 卡片 inert（无对应窗） */
const WINDOW_TOOLS = new Set(["claude", "codex", "opencode", "kimi", "workbuddy", "zcode"]);
function openWindow(s: Session): (() => void) | undefined {
  return WINDOW_TOOLS.has(s.tool) ? () => useDemo.getState().setWindows({ toolWin: s.tool }) : undefined;
}

/** 真应用看板窗（还原主仓 home.tsx:94-110 摘要行 + SessionGrid.tsx:24 网格，全部 app 令牌）。
 *  D1 场景（interactive）与首页静态展示窗（interactive=false：卡片不可开窗、X 不渲染，chips 仍可筛选）共用。
 *  columns=2 供首页 3 行 2 列布局（P12：与手机等高对齐）；卡片网格 auto-rows-fr 随窗高拉伸。 */
export function AppBoard({ interactive = true, columns = 3, className = "" }: {
  interactive?: boolean;
  columns?: 2 | 3;
  className?: string;
}) {
  const { t } = useTranslation();
  const sessions = useDemo((s) => s.sessions);
  const filter = useDemo((s) => s.filter);
  const setFilter = useDemo((s) => s.setFilter);
  const dismissed = useDemo((s) => s.dismissed);
  const setDismissed = useDemo((s) => s.setDismissed);
  const list = Object.values(sessions)
    .filter((s) => !dismissed.includes(s.id) && (!filter || s.tool === filter));
  const waiting = list.filter((s) => s.state === "waiting").length;

  return (
    <WindowFrame title={t("demo.win.board")} className={`flex flex-col ${className}`}>
      {/* 状态摘要行（无 tab）：Activity + N 会话 + 红色等待数 */}
      <div className="flex items-center gap-2 border-b border-app-line px-3 py-2 text-[11px] text-app-mut">
        <ActivityIcon size={14} />
        <span>{t("demo.board.sessions", { count: list.length })}</span>
        {waiting > 0 && (
          <span className="flex items-center gap-1 text-red-500" title={t("demo.board.waiting", { count: waiting })}>
            <AlertCircleIcon size={14} />{waiting}
          </span>
        )}
      </div>
      {/* 筛选 chips（共享 store.filter，静态展示窗内也可点） */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
        <ToolChip tool={null} active={filter === null} onClick={() => setFilter(null)} />
        {TOOLS.map((tool) => (
          <ToolChip key={tool.key} tool={tool.key} active={filter === tool.key}
            onClick={() => setFilter(filter === tool.key ? null : tool.key)} />
        ))}
      </div>
      {/* SessionGrid（columns=2：首页 4 行 2 列 auto-rows-fr；columns=3：演示 3 行 3 列，P13 用户裁决） */}
      <div className={`grid flex-1 grid-cols-1 gap-2 p-3 md:grid-cols-2 ${columns === 2 ? "auto-rows-fr" : "md:!grid-cols-3"}`}>
        {list.map((s) => (
          <SessionCard key={s.id} s={s}
            onOpen={interactive ? openWindow(s) : undefined}
            onDismiss={interactive ? (id) => setDismissed([...dismissed, id]) : undefined} />
        ))}
      </div>
    </WindowFrame>
  );
}
