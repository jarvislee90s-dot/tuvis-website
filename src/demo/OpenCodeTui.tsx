import { useLang } from "@/i18n/useLang";
import { TuiShell } from "./TuiShell";

/** OpenCode TUI 窗（P13 新增，站内近似模拟——暂无官方截图基准，用户提供截图后再校准）：
 *  灰调终端（品牌灰 #6B6B6B 系）——灰框欢迎盒 + MCP 行 + ✻ 用户行 + 斜体思考 + 路径高亮回复 +
 *  > █ 输入框 + 底部三段状态栏，结构对齐 KimiShellTui 的七段式。
 *  欢迎盒/MCP/状态栏为语言无关的真实产品英文 UI——留常量，不进 COPY */
const WELCOME = {
  title: "OpenCode",
  version: "v0.6.0",
  help: "type /help for help, /init to create AGENTS.md",
  directory: "Directory: ~/code/tuvis-app",
  session: "Session: 7f3a91c2",
  model: "Model: glm-5.3-flash",
  mcp: "MCP: 1 connected",
};
const MCP = ["● tuvis-remote MCP server connected"];
const PATH_SPLIT = /(src\/tray\/states\.ts)/;
const STATUS = {
  model: "GLM-5.3-Flash",
  gear: "· opencode v0.6.0",
  dir: "~/code/tuvis-app",
  context: "context: 6% (58k/977k)",
};

/** 批次 3 COPY 模式（T3.3；模板说明见 copy.parity.test.ts 头注释）：
 *  仿真会话三段（用户行/思考行/回复）随语言变化，收进 COPY.{zh,en}；en 以 `: typeof ZH` 互校；
 *  zh 逐字保留现状（红线）。en 回复行内的路径与 zh 相同（PATH_SPLIT 高亮依赖）。 */
const ZH = {
  session: {
    user: "托盘图标三态怎么组织状态机？",
    think: "Thinking… 先盘现有 tray 菜单与三态素材，再定状态归一",
    reply: [
      "建议用一个枚举收口三态，渲染层只查表（src/tray/states.ts）：",
      "• green = 全部空闲，yellow = 有会话等待批准，red = 有会话出错",
      "• 状态源唯一：看板 store 派生，托盘只订阅不自行计算",
      "• 切换走防抖 300ms，避免多会话同帧抖动",
      "要先把状态表写进 src/tray/states.ts 吗？",
    ],
  },
};
const EN: typeof ZH = {
  session: {
    user: "How should the tray icon's three states be organized as a state machine?",
    think: "Thinking… first the existing tray menu and the three-state assets, then the state model",
    reply: [
      "I'd funnel the three states into one enum and let the view just look it up (src/tray/states.ts):",
      "• green = all idle, yellow = a session awaits approval, red = a session errored",
      "• Single source of truth: derived in the board store; the tray only subscribes, never computes",
      "• Debounce transitions by 300ms so concurrent sessions don't flicker in the same frame",
      "Want me to write the state table into src/tray/states.ts first?",
    ],
  },
};
export const COPY = { zh: ZH, en: EN } as const;

/** OpenCode TUI 窗：TuiShell 壳/拖动横滚/右键菜单/灯位全保留；底色 #232323、品牌灰框。 */
export function OpenCodeTui({ className = "", onClose }: { className?: string; onClose?: () => void }) {
  const SESSION = COPY[useLang()].session;
  return (
    <TuiShell bodyClassName="bg-[#232323] text-[#D4D4D4]" className={className} onClose={onClose}
      footer={
        <div className="flex shrink-0 items-center justify-between border-t border-[#333] bg-[#1D1D1D] px-3 py-1.5 text-[10.5px] text-[#9A9A9A]">
          <span className="whitespace-pre"><span className="text-[#D4D4D4]">{STATUS.model}</span> {STATUS.gear}</span>
          <span className="hidden whitespace-pre md:inline">{STATUS.dir}</span>
          <span className="whitespace-pre">{STATUS.context}</span>
        </div>
      }>
      {/* ① 灰框欢迎盒 */}
      <div className="w-fit rounded-md border border-[#6B6B6B] p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] bg-[#6B6B6B] text-[8px] font-bold text-white" aria-hidden>O</span>
          <div>
            <div className="whitespace-pre font-semibold text-white">{WELCOME.title} <span className="font-normal text-[#9A9A9A]">{WELCOME.version}</span></div>
            <div className="whitespace-pre text-[#9A9A9A]">{WELCOME.help}</div>
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <div className="whitespace-pre"><span className="text-[#9A9A9A]">{WELCOME.directory.slice(0, 10)}</span>{WELCOME.directory.slice(10)}</div>
          <div className="whitespace-pre"><span className="text-[#9A9A9A]">{WELCOME.session.slice(0, 8)}</span>{WELCOME.session.slice(8)}</div>
          <div className="whitespace-pre"><span className="text-[#9A9A9A]">{WELCOME.model.slice(0, 6)}</span>{WELCOME.model.slice(6)}</div>
          <div className="whitespace-pre"><span className="text-[#9A9A9A]">{WELCOME.mcp.slice(0, 4)}</span>{WELCOME.mcp.slice(4)}</div>
        </div>
      </div>
      {/* ② MCP 绿行 */}
      <div className="mt-3 space-y-0.5">
        {MCP.map((line) => <div key={line} className="whitespace-pre text-[#4EC98A]">{line}</div>)}
      </div>
      {/* ③ 用户消息行 */}
      <div className="mt-3 whitespace-pre"><span className="text-[#9A9A9A]">✻ </span>{SESSION.user}</div>
      {/* ④ 斜体思考行 */}
      <div className="mt-2 whitespace-pre italic text-[#9A9A9A]">{SESSION.think}</div>
      {/* ⑤ 回复正文：路径灰白高亮 */}
      <div className="mt-2 space-y-0.5">
        {SESSION.reply.map((line) => (
          <div key={line} className="whitespace-pre">
            {line.split(PATH_SPLIT).map((seg, i) => i % 2 === 1
              ? <span key={i} className="font-semibold text-white">{seg}</span>
              : <span key={i}>{seg}</span>)}
          </div>
        ))}
      </div>
      {/* ⑥ 输入框 */}
      <div className="mt-3 rounded-md border border-[#3A3A3A] px-3 py-2">
        <span className="whitespace-pre">{"> "}
          <span className="inline-block h-[14px] w-[7px] bg-[#D4D4D4]"
            style={{ animation: "blink 1.1s steps(1) infinite" }} />
        </span>
      </div>
    </TuiShell>
  );
}
