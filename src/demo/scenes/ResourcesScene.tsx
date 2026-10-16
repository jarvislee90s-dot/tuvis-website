import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/i18n/useLang";
import { toolOf } from "../tools";
import { ToolIcon } from "../ToolIcon";
import { PlayerFrame } from "../PlayerFrame";
import { WindowFrame } from "../WindowFrame";
import { FileTextIcon, FolderIcon, RefreshCwIcon, TrashIcon } from "../../components/Icons";
import { resSteps } from "../steps-res";

/* P13 对照 public/manual/img/presets.png + preset-create.png 重做：
   ① 矩阵列 = 真实 7 工具；② Skill 行 = superpowers 系真名；③ 预设组独立区块（Skill/MCP/插件区下方），
   预设卡 = 名称 + 资源数徽标 + 删除 + 7 工具开关行（对特定工具开启、互不影响）；
   ④ 「新建预设组」弹窗 = 类型(通用/工具私有) + 名称 + 描述 + Skill 勾选列表；
   ⑤ 剧本 4 步（导入 / 手动开关 / 前端设计→Kimi / Superpowers→Claude）经 "tuvis-d3" 事件驱动绝对状态。 */
const MATRIX_TOOLS = ["claude", "codex", "opencode", "kimi", "workbuddy", "zcode", "dsh"] as const;
interface ResRow { id: string; on: Record<string, boolean>; pinned?: Record<string, boolean> }
const SKILL_ROWS: ResRow[] = [
  { id: "ts-sdk-author",               on: { claude: true,  codex: true,  opencode: false, kimi: false, workbuddy: false, zcode: true,  dsh: false }, pinned: { claude: true, zcode: true } },
  { id: "ui-ux-pro-max",               on: { claude: true,  codex: false, opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: false }, pinned: { claude: true } },
  { id: "brainstorming",               on: { claude: true,  codex: false, opencode: false, kimi: true,  workbuddy: false, zcode: false, dsh: false }, pinned: {} },
  { id: "executing-plans",             on: { claude: true,  codex: true,  opencode: true,  kimi: false, workbuddy: false, zcode: false, dsh: false }, pinned: {} },
  { id: "test-driven-development",     on: { claude: true,  codex: false, opencode: false, kimi: true,  workbuddy: false, zcode: true,  dsh: false }, pinned: {} },
  { id: "systematic-debugging",        on: { claude: true,  codex: false, opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: false }, pinned: {} },
  { id: "requesting-code-review",      on: { claude: false, codex: true,  opencode: false, kimi: false, workbuddy: true,  zcode: false, dsh: false }, pinned: {} },
  { id: "verification-before-completion", on: { claude: true, codex: false, opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: true }, pinned: {} },
];
const SKILL_TOTAL = 105;   // 对照 preset-create.png「Skill (105)」（demo 只陈列 8 行，折叠头照显 105）
const SKILL_TOTAL_AFTER_IMPORT = 113;

const MCP_ROWS: ResRow[] = [
  { id: "filesystem",          on: { claude: true,  codex: true,  opencode: true,  kimi: true,  workbuddy: false, zcode: false, dsh: false } },
  { id: "context7",            on: { claude: true,  codex: false, opencode: false, kimi: true,  workbuddy: false, zcode: false, dsh: false } },
  { id: "desktop-commander",   on: { claude: false, codex: true,  opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: false } },
  { id: "tuvis-remote",        on: { claude: true,  codex: true,  opencode: false, kimi: true,  workbuddy: false, zcode: true,  dsh: false } },
  { id: "playwright",          on: { claude: false, codex: false, opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: false } },
  { id: "sequential-thinking", on: { claude: false, codex: false, opencode: false, kimi: false, workbuddy: false, zcode: true,  dsh: false } },
];
/** 插件行 id 为语言无关 slug（显示名取 COPY.pluginNames，键 = id；B3-T8）——与 Skill/MCP 行的真名 id 同构 */
const PLUGIN_ROWS: ResRow[] = [
  { id: "code-nav",       on: { claude: true,  codex: true,  opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: false } },
  { id: "sheet-engine",   on: { claude: true,  codex: false, opencode: false, kimi: true,  workbuddy: false, zcode: false, dsh: false } },
  { id: "chart-render",   on: { claude: true,  codex: true,  opencode: true,  kimi: false, workbuddy: false, zcode: false, dsh: false } },
  { id: "voice-annotate", on: { claude: false, codex: false, opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: false } },
  { id: "petdex-bridge",  on: { claude: false, codex: false, opencode: false, kimi: true,  workbuddy: false, zcode: false, dsh: false } },
];

type ResType = "skill" | "mcp" | "plugin";
const TYPE_TAB_KEY: Record<ResType, string> = { skill: "res.tab.skill", mcp: "res.tab.mcp", plugin: "res.tab.plugin" };
const TYPE_COUNT: Record<ResType, number> = { skill: SKILL_TOTAL, mcp: 6, plugin: 5 };
/** MCP/插件表列表头小注：点亮 = 已写入该工具配置文件 */
const CONFIG_NOTE: Record<string, string> = {
  claude: ".mcp.json", codex: "config.toml", opencode: "opencode.json", kimi: "mcp.json",
  workbuddy: "config.json", zcode: "settings.json", dsh: "dsh.json",
};

/** 新建弹窗 Skill 勾选目录（对照 preset-create.png 真名） */
const SKILL_CATALOG = [
  "context7-docs", "context7-mcp", "context7-cli", "find-docs", "brainstorming",
  "dispatching-parallel-agents", "executing-plans", "finishing-a-development-branch",
  "receiving-code-review", "requesting-code-review", "subagent-driven-development",
  "systematic-debugging", "test-driven-development", "using-git-worktrees",
  "using-superpowers", "verification-before-completion", "writing-plans",
];

/** 预设组卡（presets.png 真实结构）：名称 + 资源数 + 7 工具开关；resources 用于「对特定工具开启」时覆写该工具列。
 *  内置预设名取 COPY.presetNames（键 = id，B3-T8）；name 仅自定义预设持有（用户输入原文，语言无关，不走 COPY）。 */
interface PresetCard { id: string; name?: string; resources: string[]; tools: Record<string, boolean> }
const FRONTEND_PRESET: PresetCard = {
  id: "frontend", resources: ["ui-ux-pro-max", "brainstorming", "executing-plans", "test-driven-development", "requesting-code-review", "verification-before-completion"],
  tools: { claude: false, codex: false, opencode: false, kimi: true, workbuddy: false, zcode: false, dsh: false },
};
const SUPERPOWERS_PRESET: PresetCard = {
  id: "superpowers", resources: SKILL_CATALOG.slice(4),
  tools: { claude: true, codex: false, opencode: false, kimi: false, workbuddy: false, zcode: false, dsh: false },
};

/** 批次 3 COPY 模式（B3-T8；模板说明见 copy.parity.test.ts 头注释）：
 *  场景内随语言变化的文案收进 COPY.{zh,en}，渲染处按语言取；en 以 `: typeof ZH` 标注互校；
 *  zh 逐字保留现状（红线），en 为产品英文版 UI 口径。
 *  窗体 chrome（体检卡/仓库大卡/预设区/新建弹窗）走既有 i18n 键 res.*；本 COPY 只收两张数据表的显示名——
 *  插件行与内置预设名，表内 id 保持语言无关（新增行/预设须同时补 zh/en 译名，键集合由 parity 门禁兜底）。 */
const ZH = {
  /** 插件行显示名（键 = PLUGIN_ROWS.id；skill/mcp 行的 id 即真名，不经此表） */
  pluginNames: {
    "code-nav": "代码导航",
    "sheet-engine": "表格引擎",
    "chart-render": "图表渲染",
    "voice-annotate": "语音批注",
    "petdex-bridge": "petdex 桥",
  },
  /** 内置预设组名（键 = 预设 id；自定义预设用用户输入，见 PresetCard.name） */
  presetNames: { frontend: "前端设计", superpowers: "Superpowers 开发组件" },
};
const EN: typeof ZH = {
  pluginNames: {
    "code-nav": "Code navigation",
    "sheet-engine": "Sheet engine",
    "chart-render": "Chart rendering",
    "voice-annotate": "Voice annotation",
    "petdex-bridge": "petdex bridge",
  },
  presetNames: { frontend: "Frontend design", superpowers: "Superpowers dev kit" },
};
export const COPY = { zh: ZH, en: EN } as const;

/** 译名表按键查表（Record 视图：id 是运行时字符串，字面量键表无法直索引）；未登记的行返回 undefined，调用方落回 id */
function nameOf(names: object, id: string): string | undefined {
  return (names as Record<string, string | undefined>)[id];
}

/* 手绘补图标（lucide 风格简化版，同 components/Icons.tsx 口径；不引入图标库——红线） */
function svgProps(size: number, className: string) {
  return {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, className,
  } as const;
}
function HeartIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
  );
}
function SearchIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function PackageIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="m7.5 4.27 9 5.15" />
    </svg>
  );
}
function ChevronDownIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}><path d="m6 9 6 6 6-6" /></svg>
  );
}
function SortIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" />
    </svg>
  );
}
function ListIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
      <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" />
    </svg>
  );
}
function GridIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
function ScanIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
  );
}
function LayersIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" />
    </svg>
  );
}
function XIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg {...svgProps(size, className)}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
  );
}

/** 开关（presets.png 同款 iOS 风）：on = 近黑底白钮 */
function Switch({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={`relative h-[18px] w-8 shrink-0 rounded-full transition ${on ? "bg-btnp" : "border border-app-line bg-app-accent"}`}>
      <span aria-hidden="true"
        className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-all ${on ? "left-[16px]" : "left-[2px]"}`} />
    </button>
  );
}

type View = "resource" | "tool";
type D3Action = "reset" | "import" | "toggle" | "preset-frontend" | "preset-superpowers";

export function ResourcesScene() {
  const { t } = useTranslation();
  /* 双机制说明：i18n 的 t 管窗体 chrome（既有 res.* 键），COPY 管两张数据表的显示名（B3-T8） */
  const copy = COPY[useLang()];
  const [tables, setTables] = useState<Record<ResType, ResRow[]>>({ skill: SKILL_ROWS, mcp: MCP_ROWS, plugin: PLUGIN_ROWS });
  const [type, setType] = useState<ResType>("skill");
  const [view, setView] = useState<View>("resource");
  const [query, setQuery] = useState("");
  const [dir, setDir] = useState<"repo" | "agents">("repo");
  const [collapsed, setCollapsed] = useState(false);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [checking, setChecking] = useState(false);
  /* P13 预设组状态：已创建预设卡 + 导入闪动 + 新建弹窗表单 */
  const [presets, setPresets] = useState<PresetCard[]>([]);
  const [importFlash, setImportFlash] = useState(false);
  const [skillTotal, setSkillTotal] = useState(SKILL_TOTAL);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgType, setDlgType] = useState<"general" | "private">("general");
  const [dlgName, setDlgName] = useState("");
  const [dlgDesc, setDlgDesc] = useState("");
  const [dlgChecked, setDlgChecked] = useState<string[]>([]);

  const rows = tables[type];
  const q = query.trim().toLowerCase();
  /* 显示名（B3-T8）：插件行/内置预设取 COPY 译名，其余行 id 即真名、自定义预设用用户输入原名 */
  const rowLabel = (r: ResRow) => nameOf(copy.pluginNames, r.id) ?? r.id;
  const presetLabel = (p: PresetCard) => p.name ?? nameOf(copy.presetNames, p.id) ?? p.id;
  /* 搜索匹配 id 与显示名两路（插件行 id 为 slug：zh 下按「代码导航」这类中文名仍搜得到）；排序同按显示名（zh 序不变） */
  const visible = rows
    .filter((r) => q === "" || r.id.toLowerCase().includes(q) || rowLabel(r).toLowerCase().includes(q))
    .sort((a, b) => (sort === "asc" ? rowLabel(a).localeCompare(rowLabel(b)) : rowLabel(b).localeCompare(rowLabel(a))));

  const ALL_ON = Object.fromEntries(MATRIX_TOOLS.map((t2) => [t2, true]));

  /* 当前 type 表的变更通道（toggle/allOn/删除对三类同构复用） */
  const mutateRows = (fn: (rs: ResRow[]) => ResRow[]) =>
    setTables((ts) => ({ ...ts, [type]: fn(ts[type]) }));
  const toggleCell = (id: string, tool: string) =>
    mutateRows((rs) => rs.map((r) => (r.id === id ? { ...r, on: { ...r.on, [tool]: !r.on[tool] } } : r)));
  const allOn = (id: string) =>
    mutateRows((rs) => rs.map((r) => (r.id === id ? { ...r, on: { ...ALL_ON } } : r)));
  const removeRow = (id: string) => mutateRows((rs) => rs.filter((r) => r.id !== id));
  const checkNow = () => {
    if (checking) return;
    setChecking(true);
    setTimeout(() => setChecking(false), 1000);
  };

  /** 预设「对特定工具开启」：开 = 该工具列覆写为预设资源表（不影响其他工具列）；关 = 该工具列全灭 */
  const applyPresetTool = (preset: PresetCard, tool: string, on: boolean) => {
    setTables((ts) => ({
      ...ts,
      skill: ts.skill.map((r) => ({ ...r, on: { ...r.on, [tool]: on && preset.resources.includes(r.id) } })),
    }));
  };
  const togglePresetTool = (presetId: string, tool: string) => {
    setPresets((ps) => ps.map((p) => {
      if (p.id !== presetId) return p;
      const next = !p.tools[tool];
      applyPresetTool({ ...p, tools: { ...p.tools, [tool]: next } }, tool, next);
      return { ...p, tools: { ...p.tools, [tool]: next } };
    }));
  };
  const createPreset = () => {
    const name = dlgName.trim();
    if (!name) return;
    setPresets((ps) => [...ps, {
      id: `custom-${Date.now()}`, name, resources: [...dlgChecked],
      tools: Object.fromEntries(MATRIX_TOOLS.map((t2) => [t2, false])),
    }]);
    setDlgOpen(false);
    setDlgName(""); setDlgDesc(""); setDlgChecked([]);
  };

  /* 剧本通道："tuvis-d3" CustomEvent → 绝对状态（seek 幂等，B16） */
  useEffect(() => {
    const onEvt = (e: Event) => {
      const action = (e as CustomEvent).detail as D3Action;
      if (action === "reset") {
        setTables({ skill: SKILL_ROWS, mcp: MCP_ROWS, plugin: PLUGIN_ROWS });
        setPresets([]); setSkillTotal(SKILL_TOTAL); setImportFlash(false); setType("skill");
      } else if (action === "import") {
        setImportFlash(true);
        setSkillTotal(SKILL_TOTAL_AFTER_IMPORT);
        window.setTimeout(() => setImportFlash(false), 1200);
      } else if (action === "toggle") {
        setType("mcp");
        setTables((ts) => ({
          ...ts,
          mcp: ts.mcp.map((r) => (r.id === "playwright" ? { ...r, on: { ...r.on, kimi: true } } : r)),
        }));
      } else if (action === "preset-frontend") {
        setPresets([FRONTEND_PRESET]);
        applyPresetTool(FRONTEND_PRESET, "kimi", true);
        setType("skill");
      } else if (action === "preset-superpowers") {
        setPresets([FRONTEND_PRESET, SUPERPOWERS_PRESET]);
        applyPresetTool(SUPERPOWERS_PRESET, "claude", true);
        setType("skill");
      }
    };
    window.addEventListener("tuvis-d3", onEvt);
    return () => window.removeEventListener("tuvis-d3", onEvt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PlayerFrame steps={resSteps} id="d3-player">
      <WindowFrame title={t("demo.win.resources")}>
        <div className="space-y-4 p-4">
          {/* 1. 体检卡（导入动效：闪一圈绿） */}
          <div className={`flex items-center gap-3 rounded-xl border p-3 transition ${importFlash ? "border-green-500/50 bg-green-500/[0.06]" : "border-app-line bg-app-card"}`}>
            <HeartIcon size={18} className={`shrink-0 ${importFlash ? "animate-pulse text-green-500" : "text-green-500"}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-app-ink">{t("res.health")}</div>
              <div className={`text-xs ${checking ? "text-app-mut" : "text-app-ink"}`}>
                {checking ? t("res.checking") : importFlash ? t("res.imported") : t("res.healthOk")}
              </div>
            </div>
            <button type="button" onClick={checkNow} aria-label={t("res.checkNow")}
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-app-line px-3 py-1 text-xs text-app-ink hover:bg-app-accent/50">
              <RefreshCwIcon size={13} />
              {t("res.checkNow")}
            </button>
          </div>

          {/* 2. 按资源/按工具 toggle + 扫描原生资源（B19：静态 disabled + title） */}
          <div className="flex items-center justify-between">
            <div className="flex overflow-hidden rounded-lg border border-app-line">
              <button type="button" aria-pressed={view === "resource"} onClick={() => setView("resource")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition ${view === "resource" ? "bg-app-btnp text-white" : "bg-app-bg text-app-mut hover:text-app-ink"}`}>
                <ListIcon size={13} />
                {t("res.byResource")}
              </button>
              <button type="button" aria-pressed={view === "tool"} onClick={() => setView("tool")}
                className={`flex items-center gap-1.5 border-l border-app-line px-3 py-1.5 text-xs transition ${view === "tool" ? "bg-app-btnp text-white" : "bg-app-bg text-app-mut hover:text-app-ink"}`}>
                <GridIcon size={13} />
                {t("res.byTool")}
              </button>
            </div>
            <button type="button" disabled title={t("demo.na")}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-app-line px-3 py-1.5 text-xs text-app-ink">
              <ScanIcon size={13} />
              {t("res.scan")}
            </button>
          </div>

          {/* 3. 兔维斯仓库大卡（Skill/MCP/插件矩阵） */}
          <div className="space-y-3 rounded-xl border border-app-line bg-app-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-app-ink">{t("res.repo")}</span>
              {(["repo", "agents"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDir(d)} aria-pressed={dir === d}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] transition ${
                    dir === d ? "border-app-btnp bg-app-btnp font-semibold text-white"
                              : "border-app-line bg-app-bg font-medium text-app-mut hover:bg-app-accent/50 hover:text-app-ink"}`}>
                  <FolderIcon size={13} />
                  {t(d === "repo" ? "res.dir.repo" : "res.dir.agents")}
                </button>
              ))}
              <div className="flex overflow-hidden rounded-lg border border-app-line">
                {(["skill", "mcp", "plugin"] as const).map((tp) => (
                  <button key={tp} type="button" aria-pressed={type === tp} onClick={() => setType(tp)}
                    className={`px-3 py-1.5 text-xs transition ${tp !== "skill" ? "border-l border-app-line " : ""}${
                      type === tp ? "bg-app-btnp text-white" : "bg-app-bg text-app-mut hover:text-app-ink"}`}>
                    {t(TYPE_TAB_KEY[tp])} ({tp === "skill" ? skillTotal : TYPE_COUNT[tp]})
                  </button>
                ))}
              </div>
              <button type="button" disabled title={t("demo.na")}
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-app-line px-3 py-1.5 text-xs text-app-ink">
                <FileTextIcon size={13} />
                {t("res.installManifest")}
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-app-mut">{t("res.repoDesc")}</p>
            <div className="flex items-center gap-2 rounded-lg border border-app-line px-2.5 py-1.5">
              <SearchIcon size={13} className="shrink-0 text-app-mut" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t("res.searchPlaceholder")} aria-label={t("res.searchPlaceholder")}
                className="w-full bg-transparent text-xs text-app-ink outline-none placeholder:text-app-mut" />
            </div>

            <button type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}
              className="flex cursor-pointer select-none items-center gap-1.5 text-xs font-medium text-app-ink">
              <PackageIcon size={13} />
              <span>{t("res.skillCount", { count: skillTotal })}</span>
              <ChevronDownIcon size={13} className={`transition ${collapsed ? "-rotate-90" : ""}`} />
            </button>

            {!collapsed && view === "resource" && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-app-line text-app-mut">
                    <th className="py-1.5 text-left font-medium">
                      <button type="button" aria-label={t("res.sortByName")} onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
                        className="flex items-center gap-1 text-app-mut transition hover:text-app-ink">
                        {t("res.colName")}
                        <SortIcon size={12} />
                      </button>
                    </th>
                    {MATRIX_TOOLS.map((tool) => (
                      <th key={tool} className="py-1.5 text-center font-medium">
                        <span className="flex flex-col items-center gap-0.5">
                          <ToolIcon tool={tool} size={13} />
                          {toolOf(tool).label}
                          {type !== "skill" && <span className="text-[9px] font-mono text-app-mut">{CONFIG_NOTE[tool]}</span>}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id} className="border-b border-app-line last:border-0">
                      <td>
                        <div className="flex items-center gap-1.5 py-1.5 font-mono text-[11px] text-app-ink">
                          <span className="truncate">{rowLabel(row)}</span>
                          <button type="button" aria-label={t("res.deleteSkill")} onClick={() => removeRow(row.id)}
                            className="shrink-0 text-red-500/70 hover:text-red-600">
                            <TrashIcon size={12} />
                          </button>
                          <button type="button" aria-label={t("res.allOn")} onClick={() => allOn(row.id)}
                            className="shrink-0 text-[10px] text-app-mut underline underline-offset-2 hover:text-app-ink">
                            {t("res.allOn")}
                          </button>
                        </div>
                      </td>
                      {MATRIX_TOOLS.map((tool) => {
                        const lit = row.on[tool];
                        return (
                          <td key={tool} className="py-1.5 text-center">
                            <button type="button" aria-pressed={lit} aria-label={`${rowLabel(row)}:${tool}${row.pinned?.[tool] ? " " + t("res.pinned") : ""}`}
                              onClick={() => toggleCell(row.id, tool)}
                              className={`inline-flex flex-col items-center gap-0.5 ${lit ? "" : "opacity-30 grayscale"}`}>
                              <ToolIcon tool={tool} size={15} />
                              {row.pinned?.[tool] && <span className="text-[9px] text-app-mut">{t("res.pinned")}</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!collapsed && view === "tool" && (
              <div className="space-y-3">
                {MATRIX_TOOLS.map((tool) => {
                  const litRows = visible.filter((r) => r.on[tool]);
                  return (
                    <div key={tool}>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-app-ink">
                        <ToolIcon tool={tool} size={14} />
                        {toolOf(tool).label}
                        <span className="text-app-mut">{litRows.length}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {litRows.map((r) => (
                          <span key={r.id}
                            className="flex items-center gap-1 rounded-full border border-app-line bg-app-bg px-2.5 py-0.5 font-mono text-[11px] text-app-ink">
                            {rowLabel(r)}
                            {r.pinned?.[tool] && <span className="text-[9px] text-app-mut">{t("res.pinned")}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. 预设组独立区块（presets.png：Skill/MCP/插件区下方）——名称 + 资源数徽标 + 删除 + 7 工具开关行 */}
          <div className="space-y-2.5 rounded-xl border border-app-line bg-app-card p-4">
            <div className="flex items-center gap-2">
              <LayersIcon size={15} className="text-app-ink" />
              <span className="text-sm font-semibold text-app-ink">{t("res.preset")} ({presets.length})</span>
              <button type="button" onClick={() => setDlgOpen(true)}
                className="ml-auto flex items-center gap-1 rounded-lg border border-app-line px-3 py-1.5 text-xs font-medium text-app-ink hover:bg-app-accent/50">
                ＋ {t("res.create")}
              </button>
            </div>
            {presets.length === 0 ? (
              <p className="text-[11px] text-app-mut">{t("res.presetEmpty")}</p>
            ) : (
              <>
                <p className="text-[11px] text-app-mut">{t("res.presetGeneral")}</p>
                <div className="space-y-3">
                  {presets.map((p) => (
                    <div key={p.id} className="rounded-xl border border-app-line bg-app-bg p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-app-ink">{presetLabel(p)}</span>
                        <span className="ml-auto rounded bg-app-accent px-1.5 py-0.5 text-[10px] text-app-mut">{p.resources.length}</span>
                        <button type="button" aria-label={t("res.deleteSkill")}
                          onClick={() => setPresets((ps) => ps.filter((x) => x.id !== p.id))}
                          className="shrink-0 text-red-500/70 hover:text-red-600">
                          <TrashIcon size={12} />
                        </button>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
                        {MATRIX_TOOLS.map((tool) => (
                          <span key={tool} className="flex items-center gap-1.5">
                            <ToolIcon tool={tool} size={13} />
                            <span className={`text-[11px] ${p.tools[tool] ? "font-medium text-app-ink" : "text-app-mut"}`}>{toolOf(tool).label}</span>
                            <Switch on={p.tools[tool]} label={`${presetLabel(p)} × ${toolOf(tool).label}`}
                              onClick={() => togglePresetTool(p.id, tool)} />
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </WindowFrame>

      {/* 5. 新建预设组弹窗（preset-create.png：类型 radio + 名称 + 描述 + Skill 勾选列表 + 创建） */}
      {dlgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onPointerDown={() => setDlgOpen(false)}>
          <div role="dialog" aria-label={t("res.createTitle")} onPointerDown={(e) => e.stopPropagation()}
            className="max-h-[82vh] w-[min(94vw,560px)] overflow-y-auto rounded-xl border border-app-line bg-app-card p-4 shadow-pop">
            <div className="flex items-center">
              <span className="text-base font-semibold text-app-ink">{t("res.createTitle")}</span>
              <button type="button" aria-label={t("demo.remote.close")} onClick={() => setDlgOpen(false)}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-app-mut hover:bg-app-accent/50 hover:text-app-ink">
                <XIcon size={14} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-app-ink">
              <span className="font-medium">{t("res.presetType")}</span>
              {(["general", "private"] as const).map((tp) => (
                <label key={tp} className="flex cursor-pointer items-center gap-1.5">
                  <input type="radio" name="preset-type" checked={dlgType === tp} onChange={() => setDlgType(tp)} className="accent-black" />
                  {t(tp === "general" ? "res.type.general" : "res.type.private")}
                </label>
              ))}
            </div>
            <input value={dlgName} onChange={(e) => setDlgName(e.target.value)} placeholder={t("res.presetNamePH")}
              aria-label={t("res.presetNamePH")}
              className="mt-3 w-full rounded-lg border border-app-line bg-app-bg px-3 py-2 text-sm font-semibold text-app-ink outline-none placeholder:font-normal placeholder:text-app-mut focus:border-app-mut" />
            <textarea value={dlgDesc} onChange={(e) => setDlgDesc(e.target.value)} placeholder={t("res.presetDescPH")}
              aria-label={t("res.presetDescPH")} rows={2}
              className="mt-2 w-full resize-y rounded-lg border border-app-line bg-app-bg px-3 py-2 text-xs text-app-ink outline-none placeholder:text-app-mut" />
            <div className="mt-3 text-xs font-semibold text-app-mut">{t("res.skillCount", { count: SKILL_TOTAL })}</div>
            <div className="mt-1.5 max-h-44 space-y-0.5 overflow-y-auto pr-1">
              {SKILL_CATALOG.map((s) => {
                const checked = dlgChecked.includes(s);
                return (
                  <label key={s} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 font-mono text-[11.5px] text-app-ink hover:bg-app-accent/40">
                    <input type="checkbox" checked={checked} className="accent-black"
                      onChange={() => setDlgChecked((c) => (checked ? c.filter((x) => x !== s) : [...c, s]))} />
                    {s}
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" disabled={!dlgName.trim()} onClick={createPreset}
                className="rounded-lg bg-app-btnp px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                ＋ {t("res.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PlayerFrame>
  );
}
