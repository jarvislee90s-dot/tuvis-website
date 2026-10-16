import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlayIcon, PauseIcon } from "../components/Icons";
import { useLang } from "@/i18n/useLang";
import { useScriptPlayer, timeline } from "./player";
import type { Step } from "./types";

export function PlayerFrame({ steps, children, id, reset }: {
  steps: Step[]; children: ReactNode; id: string; reset?: () => void;
}) {
  const { t } = useTranslation();
  const p = useScriptPlayer(steps, reset);
  const [hover, setHover] = useState<number | null>(null);
  const { offsets, total } = timeline(steps);
  // 步条文案语言走 useLang（URL 权威；原 i18n.language 三元切语首帧滞后一拍——LangLayout effect 才更新实例语言）
  const lang = useLang();

  return (
    <div id={id} className="scroll-mt-20">
      {/* 演示区（P12：去统一定高——窗体按自身内容自然高，手机等一次性完整可见；交互即暂停） */}
      <div className="relative rounded-[14px] border border-line bg-surface/40"
        onPointerDown={() => p.pause()}>
        {children}
      </div>

      {/* 分段进度条 + 播放/暂停（常驻 chrome，站点令牌） */}
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => p.toggle()}
          aria-label={t(p.phase === "playing" ? "demo.pause" : "demo.play")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-btnp text-btnpt transition hover:opacity-90">
          {p.phase === "playing" ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="relative flex min-w-0 flex-1 gap-1" role="group" aria-label={t("demo.progress")}>
          {steps.map((s, i) => {
            const fill = i < p.seg ? 1 : i === p.seg ? Math.min(1, p.frac / s.dur) : 0;
            return (
              <button key={i} type="button" style={{ flexGrow: s.dur }}
                onClick={() => p.seek(i)}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                aria-current={i === p.seg ? "step" : undefined}
                aria-label={`${i + 1}/${steps.length} ${s.label[lang]}`}
                className={`relative h-8 min-w-0 overflow-hidden rounded-lg border bg-card text-left transition
                  ${i === p.seg ? "border-inkdim" : "border-line"}`}>
                <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-hud/30"
                  style={{ width: `${fill * 100}%` }} />
                <span className="relative z-10 block truncate px-1.5 text-[10px] leading-8 text-inkdim">
                  {s.label[lang]}
                </span>
              </button>
            );
          })}
          {hover != null && (
            <div role="tooltip"
              className="pointer-events-none absolute bottom-full z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-card p-2.5 text-xs leading-relaxed text-ink shadow-pop"
              style={{ left: `${Math.min(88, Math.max(12, ((offsets[hover] + steps[hover].dur / 2) / total) * 100))}%` }}>
              {t(steps[hover].detailKey)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
