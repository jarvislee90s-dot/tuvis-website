import type { Step } from "./types";

/** D3 剧本 → 场景动作通道：场景 state 在组件本地，enter 经 CustomEvent 派发「绝对状态」动作（seek 幂等，B16） */
const fire = (action: string) => window.dispatchEvent(new CustomEvent("tuvis-d3", { detail: action }));

export const resSteps: Step[] = [
  { dur: 3200, enter: () => fire("reset"),
    label: { zh: "统一仓库：兔维斯仓库 + ~/.agents + Manifest", en: "One repository: Tuvis repo + ~/.agents + Manifest" },
    detailKey: "demo.detail.d3s1" },
  { dur: 3200, enter: () => fire("import"),
    label: { zh: "从各工具集导入 Skill / MCP——扫描后计数上涨", en: "Import Skills / MCPs from every tool — the counts climb after a scan" },
    detailKey: "demo.detail.d3s2" },
  { dur: 3200, enter: () => fire("toggle"),
    label: { zh: "手动开关：只动某一格，某工具启用/禁用互不影响", en: "Manual toggle: flip one cell — enabling one tool never touches the others" },
    detailKey: "demo.detail.d3s3" },
  { dur: 3600, enter: () => fire("preset-frontend"),
    label: { zh: "新建「前端设计」预设组——一键只给 Kimi Code 开启", en: "Create the Frontend preset — enable it for Kimi Code only, one click" },
    detailKey: "demo.detail.d3s4" },
  { dur: 3600, enter: () => fire("preset-superpowers"),
    label: { zh: "再建「Superpowers 开发组件」——只给 Claude Code，互不影响", en: "Then the Superpowers kit — for Claude Code only; the two never interfere" },
    detailKey: "demo.detail.d3s5" },
];
