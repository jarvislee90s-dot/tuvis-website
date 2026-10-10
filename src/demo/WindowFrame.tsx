import type { ReactNode } from "react";

/** macOS 系统红绿灯为拟物固定色，不随站点主题（A7） */
const LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

export function WindowFrame({ title, children, className = "", bodyClassName = "", onClose }: {
  title: string; children: ReactNode; className?: string; bodyClassName?: string; onClose?: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-app-line bg-app-bg shadow-soft ${className}`}>
      <div className="relative flex h-8 items-center border-b border-app-line bg-app-bg px-3">
        <span className="flex gap-2" aria-hidden={!onClose}>
          {LIGHTS.map((c, i) => (
            <button key={c} type="button" tabIndex={onClose ? 0 : -1} aria-hidden={!onClose}
              onClick={i === 0 && onClose ? onClose : undefined}
              className="h-[11px] w-[11px] rounded-full transition hover:brightness-95"
              style={{ background: c }} />
          ))}
        </span>
        <span className="pointer-events-none absolute inset-x-10 truncate text-center text-[11px] font-medium text-app-mut">
          {title}
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
