import { useEffect, useRef, useState, type ReactNode } from "react";

/** macOS 红绿灯为拟物固定色，不随主题（A7）；红灯 = 关窗 */
const LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

const MENU_ITEMS = ["Copy", "Paste", "Clear", "Settings"] as const;

/** TUI 公用窗壳（自 ClaudeTui.tsx:36-70,108-121 抽出，逻辑零改动）：灯位条 + 近黑底 + 拖动横滚 + 右键菜单。
 *  bodyClassName 由调用方给内容底色/正文色；header/footer 为全宽贴顶/贴底插槽（Kimi/ZCode 状态栏、tab 条用，
 *  不参与拖动横滚）。有 onClose 时红灯可点关窗，无则装饰性。ClaudeTui 不回迁本壳（B13）。 */
export function TuiShell({ bodyClassName = "", className = "", onClose, header, footer, children }: {
  bodyClassName?: string; className?: string; onClose?: () => void;
  header?: ReactNode; footer?: ReactNode; children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [grabbing, setGrabbing] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <div className={`flex flex-col overflow-hidden rounded-lg border border-[#2A2824] shadow-soft ${bodyClassName} ${className}`}>
      {/* 灯位条：沿用 WindowFrame 灯位，供 D1 关窗；无 onClose 时装饰性 */}
      <div className="relative flex h-8 shrink-0 items-center border-b border-[#2A2824] px-3">
        <span className="flex gap-2" aria-hidden={!onClose}>
          {LIGHTS.map((c, i) => (
            <button key={c} type="button" tabIndex={onClose ? 0 : -1} aria-hidden={!onClose}
              onClick={i === 0 && onClose ? onClose : undefined}
              className="h-[11px] w-[11px] rounded-full transition hover:brightness-95"
              style={{ background: c }} />
          ))}
        </span>
      </div>

      {header}

      {/* 终端主体：宽行不折行，按住拖动横向滚动（不 preventDefault，卡片级点击不受影响） */}
      <div ref={scrollRef}
        className={`min-h-0 flex-1 cursor-grab select-none overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed ${bodyClassName} ${grabbing ? "cursor-grabbing" : ""}`}
        onPointerDown={(e) => {
          dragging.current = true;
          setGrabbing(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const el = scrollRef.current;
          if (el) el.scrollLeft -= e.movementX;
        }}
        onPointerUp={() => { dragging.current = false; setGrabbing(false); }}
        onPointerCancel={() => { dragging.current = false; setGrabbing(false); }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({
            x: Math.min(e.clientX, window.innerWidth - 150),
            y: Math.min(e.clientY, window.innerHeight - 130),
          });
        }}
      >
        <div className="flex h-full w-max min-w-full flex-col">
          {children}
        </div>
      </div>

      {footer}

      {/* 右键模拟配置菜单：点外 / Esc 关闭，点击项即关闭 = 模拟生效 */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onPointerDown={() => setMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
          <div role="menu" className="fixed z-50 min-w-[128px] rounded-md border border-[#333] bg-[#1A1A1A] py-1 text-xs text-[#DDD] shadow-pop"
            style={{ left: menu.x, top: menu.y }}>
            {MENU_ITEMS.map((item) => (
              <button key={item} type="button" role="menuitem" onClick={() => setMenu(null)}
                className="block w-full px-3 py-1 text-left hover:bg-[#333]">{item}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
