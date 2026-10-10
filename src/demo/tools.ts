// tools.ts —— 色值来自主仓 docs/design/tool-color-ledger.md（唯一权威表）
import type { CSSProperties } from "react";

export interface ToolMeta { key: string; label: string; color: string; ringInDark?: boolean }
export const TOOLS: ToolMeta[] = [
  { key: "claude", label: "Claude Code", color: "#D97757" },
  { key: "codex", label: "Codex", color: "#10A37F" },
  { key: "opencode", label: "OpenCode", color: "#6B6B6B" },
  { key: "openclaw", label: "OpenClaw", color: "#D2453C" },
  { key: "kimi", label: "Kimi Code", color: "#0B0E1A", ringInDark: true },
  { key: "workbuddy", label: "WorkBuddy", color: "#4AD06A" },
  { key: "zcode", label: "ZCode", color: "#141413", ringInDark: true },
  { key: "dsh", label: "dsh", color: "#4D6BFE" },
];
export const toolOf = (key: string): ToolMeta =>
  // I3：兜底中性对象——上游改工具键名时矩阵列头降级为键名文本，不再把首页整页打崩（与 I2 闸门双保险）
  TOOLS.find((t) => t.key === key) ?? { key, label: key, color: "#6B6B6B" };

/** 卡片彩檐样式：走 CSS 变量，暗色自动应用台账夜间提亮 */
export function edgeStyle(key: string): CSSProperties {
  return { "--ec": `var(--edge-${key})` } as CSSProperties;
}
