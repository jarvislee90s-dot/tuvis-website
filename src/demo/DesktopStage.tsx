import type { ReactNode } from "react";

/** 桌面舞台：点阵底衬托浮窗层级（多窗场景容器） */
export function DesktopStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`stage-dots relative overflow-hidden rounded-[26px] border border-line p-4 md:p-6 ${className}`}>
      {children}
    </div>
  );
}
