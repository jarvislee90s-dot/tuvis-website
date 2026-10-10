import type { ReactNode } from "react";

/** macOS 红绿灯为拟物固定色，不随主题（A7）；红灯 = 关窗（语义同 TuiShell.tsx:29-39） */
const LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

/** APP 窗公用壳（T35，三 APP 窗共用）：macOS 侧栏窗——红绿灯坐在侧栏顶行，sidebar/main 双列。
 *  窗体自然高（不设固定高）；无右键菜单、无拖动横滚（APP 语义非终端，B24）。
 *  灯位：有 onClose 时红灯可点关窗，无则装饰性 aria-hidden。边色/底色由各窗 className 给。 */
export function AppWindowShell({ sidebar, sidebarClassName = "", mainClassName = "", className = "", onClose, children }: {
  sidebar: ReactNode; sidebarClassName?: string; mainClassName?: string; className?: string; onClose?: () => void; children: ReactNode;
}) {
  return (
    <div className={`flex overflow-hidden rounded-lg border shadow-soft ${className}`}>
      <div className={`w-[200px] shrink-0 border-r ${sidebarClassName}`}>
        {/* 灯位行：坐在侧栏顶部（真实 macOS 侧栏窗形态） */}
        <div className="flex h-8 shrink-0 items-center px-3">
          <span className="flex gap-2" aria-hidden={!onClose}>
            {LIGHTS.map((c, i) => (
              <button key={c} type="button" tabIndex={onClose ? 0 : -1} aria-hidden={!onClose}
                onClick={i === 0 && onClose ? onClose : undefined}
                className="h-[11px] w-[11px] rounded-full transition hover:brightness-95"
                style={{ background: c }} />
            ))}
          </span>
        </div>
        {sidebar}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${mainClassName}`}>{children}</div>
    </div>
  );
}
