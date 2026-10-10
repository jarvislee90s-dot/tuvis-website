import type { ReactNode } from "react";

/** 浏览器窗口拟物：顶部地址栏条 + 内容区（非 macOS 红绿灯框）——站点令牌承载 chrome。 */
export function BrowserFrame({ url = "tuvis.local", children, className = "" }: {
  url?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[14px] border-[1.5px] border-line bg-card shadow-pop ${className}`}>
      <div className="flex h-10 items-center gap-3 border-b border-line/60 bg-surface/70 px-3.5 backdrop-blur">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-[9px] w-[9px] rounded-full bg-line" />
          <span className="h-[9px] w-[9px] rounded-full bg-line" />
        </span>
        <div className="mx-auto flex h-6 max-w-[70%] flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-card px-3">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"
            className="shrink-0 text-inkdim" aria-hidden="true">
            <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="truncate font-mono text-[10px] text-inkdim">{url}</span>
        </div>
        <span className="w-[26px]" aria-hidden="true" />
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}
