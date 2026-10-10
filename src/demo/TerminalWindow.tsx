import { useTranslation } from "react-i18next";
import { WindowFrame } from "./WindowFrame";

export interface TermLine { text: string; tone?: "cmd" | "ok" | "warn" | "dim" }
const TONE = {
  cmd: "text-[#D97757]",
  ok: "text-[#4EC98A]",
  warn: "text-[#EAB53D]",
  dim: "text-[#8B857A]",
} as const;

/** 终端窗壳：底色/提示符为拟物固定色（真实终端观感，日夜恒定）；行内容由调用方给（模拟代码可硬编码英文）。 */
export function TerminalWindow({ lines, titleKey = "demo.win.claudeTerm", className = "", cursor = true, onClose }: {
  lines: TermLine[]; titleKey?: string; className?: string; cursor?: boolean; onClose?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <WindowFrame title={t(titleKey)} className={className} onClose={onClose}
      bodyClassName="bg-[#0E0D0B] px-4 py-3 font-mono text-[12px] leading-relaxed text-[#D8D3C8]">
      {lines.map((l, i) => (
        <div key={i} className={`whitespace-pre-wrap ${l.tone ? TONE[l.tone] : ""}`}>
          {l.tone === "cmd" ? `❯ ${l.text}` : l.text}
        </div>
      ))}
      {cursor && (
        <span className="inline-block h-[14px] w-[7px] translate-y-[2px] bg-[#D8D3C8]"
          style={{ animation: "blink 1.1s steps(1) infinite" }} />
      )}
    </WindowFrame>
  );
}
