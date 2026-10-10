import type { ReactNode } from "react";

/** 状态栏右侧图标组：信号 / 蓝牙 / Wi-Fi / 电量（手绘线性 SVG，零依赖） */
function StatusIcons() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {/* 信号 4 柱 */}
      <svg width="14" height="10" viewBox="0 0 14 10">
        <g fill="currentColor">
          <rect x="0" y="6" width="2" height="4" rx="0.5" />
          <rect x="4" y="4" width="2" height="6" rx="0.5" />
          <rect x="8" y="2" width="2" height="8" rx="0.5" />
          <rect x="12" y="0" width="2" height="10" rx="0.5" opacity="0.35" />
        </g>
      </svg>
      {/* 蓝牙 */}
      <svg width="9" height="12" viewBox="0 0 9 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M1 3.5 8 9 4.5 11.5V.5L8 3 1 8.5" />
      </svg>
      {/* Wi-Fi */}
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M1 3.5a8 8 0 0 1 11 0" />
        <path d="M3 5.8a5.2 5.2 0 0 1 7 0" />
        <path d="M5 8a2.6 2.6 0 0 1 3 0" />
      </svg>
      {/* 电量 */}
      <svg width="20" height="10" viewBox="0 0 20 10">
        <rect x="0.5" y="0.5" width="16" height="9" rx="2.5" fill="none" stroke="currentColor" opacity="0.5" />
        <rect x="2" y="2" width="11" height="6" rx="1.2" fill="currentColor" />
        <rect x="17.5" y="3" width="1.8" height="4" rx="0.9" fill="currentColor" opacity="0.5" />
      </svg>
    </span>
  );
}

/** 手机窗壳（P13）：bezel + 侧键 + **比例锁定屏幕**（78:163.4，iPhone 18 Pro Max 形态——
 *  大小固定、不随筛选卡片/内容变化）+ 状态栏（时间 18:37 / 前摄挖孔 / 信号·蓝牙·Wi-Fi·电量）。
 *  全站手机页一次性完整可见——屏幕不提供内滚，内容 flex 排布、超限由调用方封顶裁剪。
 *  maxWidth：首页 340px / 演示页 360px（默认 390 兜底），窄屏等比缩放。 */
export function PhoneFrame({ children, maxWidth = "max-w-[390px]" }: { children: ReactNode; maxWidth?: string }) {
  return (
    <div className={`mx-auto w-full ${maxWidth}`}>
      <div className="relative rounded-[44px] bg-btnp p-2 shadow-pop">
        {/* 侧键：电源 / 音量 */}
        <span aria-hidden="true" className="absolute -right-[2.5px] top-28 h-12 w-[3px] rounded-r bg-black/50" />
        <span aria-hidden="true" className="absolute -left-[2.5px] top-24 h-16 w-[3px] rounded-l bg-black/50" />
        {/* 屏幕：比例锁定 163.4:78，状态栏 + 内容纵向排布；底色白（P18 用户裁决：米黄屏与米黄页面底色分不清） */}
        <div className="flex aspect-[78/163.4] flex-col overflow-hidden rounded-[36px] bg-app-bg">
          {/* 状态栏：时间 + 前摄挖孔 + 图标组 */}
          <div className="relative flex shrink-0 items-center justify-between px-6 pb-1 pt-2.5 text-app-ink">
            <span className="text-[11px] font-semibold">18:37</span>
            <span aria-hidden="true" className="absolute left-1/2 top-1 h-[18px] w-[18px] -translate-x-1/2 rounded-full bg-[#1A1915]">
              <span aria-hidden="true" className="absolute inset-[4.5px] rounded-full bg-[#3A3A40]" />
            </span>
            <StatusIcons />
          </div>
          {/* 真应用面板：01 定稿 padding 16；flex 封顶、无内滚 */}
          <div className="flex min-h-0 flex-1 flex-col p-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
