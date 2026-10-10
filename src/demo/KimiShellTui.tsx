import { TuiShell } from "./TuiShell";

/** 文案常量区（对照 docs/design/p11-ref/kimi-code-full-tui.png，结构 1:1、内容换 tuvis 语境——真实感优先，硬编码不入 i18n） */
const WELCOME = {
  title: "Welcome to Kimi CLI!",
  help: "Send /help for help information.",
  directory: "Directory: ~/code/tuvis-app",
  session: "Session: 4d244680",
  model: "Model: kimi-k2-thinking-turbo",
  version: "Version: 2.1.1",
  mcp: "MCP: 2 connected",
};
const PROMO = {
  title: "✦ Kimi Code Desktop is here",
  lead: "  Run ",
  cmd: "/desktop",
  tail: " to try the desktop app now.",
};
const MCP = ["● filesystem MCP server connected", "● tuvis-remote MCP server connected"];
const SESSION = {
  user: "帮我规划看板的远程审批卡",
  think: "Thinking… 先看现有卡片与审批流，再定文案与状态色",
  reply: [
    "好的，远程审批卡这样规划——审批通道已有基础（src/remote/approve.rs）：",
    "• 红卡 = 待批准，命令全文 mono 展示",
    "• 「允许」→ ✓ Approved 续跑，全程留痕",
    "• 结果自动记入用量账本",
    "要先把卡面草稿写进 docs/remote-card.md 吗？",
  ],
};
/** 回复正文路径高亮（split 带捕获组：奇数段 = 路径，蓝） */
const PATH_SPLIT = /(src\/remote\/approve\.rs|docs\/remote-card\.md)/;
const STATUS = {
  model: "GLM-5.3-Flash",
  gear: "· thinking: high",
  dir: "~/code/tuvis-app",
  context: "context: 4% (33k/977k)",
};

/** Kimi Code 完整 TUI 窗（T42）：蓝框七行欢迎盒 + Desktop 宣传段 + MCP 绿行 ×2 + ✻ 用户行 +
 *  斜体思考行 + 路径高亮回复 + > █ 输入框 + 底部三段状态栏。
 *  结构 1:1 对照 docs/design/p11-ref/kimi-code-full-tui.png；TuiShell 壳/拖动横滚/右键菜单/灯位全保留 */
export function KimiShellTui({ className = "", onClose }: { className?: string; onClose?: () => void }) {
  return (
    <TuiShell bodyClassName="bg-[#2B2B2B] text-[#D7D7DB]" className={className} onClose={onClose}
      footer={
        <div className="flex shrink-0 items-center justify-between border-t border-[#3A3A3E] bg-[#232326] px-3 py-1.5 text-[10.5px] text-[#9EA0A6]">
          <span className="whitespace-pre"><span className="text-[#D7D7DB]">{STATUS.model}</span> {STATUS.gear}</span>
          <span className="hidden whitespace-pre md:inline">{STATUS.dir}</span>
          <span className="whitespace-pre">{STATUS.context}</span>
        </div>
      }>
      {/* ① 蓝框欢迎盒：蓝方块 logo + 标题/帮助两行 + Directory/Session/Model/Version/MCP 五行（共 7 行） */}
      <div className="w-fit rounded-md border border-[#4C7CFF] p-3">
        <div className="flex items-center gap-2.5">
          <span className="h-3.5 w-3.5 shrink-0 rounded-[3px] bg-[#4C7CFF]" aria-hidden />
          <div>
            <div className="whitespace-pre font-semibold text-white">{WELCOME.title}</div>
            <div className="whitespace-pre text-[#9EA0A6]">{WELCOME.help}</div>
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <div className="whitespace-pre"><span className="text-[#9EA0A6]">{WELCOME.directory.slice(0, 10)}</span>{WELCOME.directory.slice(10)}</div>
          <div className="whitespace-pre"><span className="text-[#9EA0A6]">{WELCOME.session.slice(0, 8)}</span>{WELCOME.session.slice(8)}</div>
          <div className="whitespace-pre"><span className="text-[#9EA0A6]">{WELCOME.model.slice(0, 6)}</span>{WELCOME.model.slice(6)}</div>
          <div className="whitespace-pre"><span className="text-[#9EA0A6]">{WELCOME.version.slice(0, 8)}</span>{WELCOME.version.slice(8)}</div>
          <div className="whitespace-pre"><span className="text-[#9EA0A6]">{WELCOME.mcp.slice(0, 4)}</span>{WELCOME.mcp.slice(4)}</div>
        </div>
      </div>
      {/* ② 宣传段：✦ Kimi Code Desktop is here + Run /desktop（蓝）行 */}
      <div className="mt-3">
        <div className="whitespace-pre font-semibold text-white">{PROMO.title}</div>
        <div className="whitespace-pre text-[#9EA0A6]">
          {PROMO.lead}<span className="text-[#4C7CFF]">{PROMO.cmd}</span>{PROMO.tail}
        </div>
      </div>
      {/* ③ MCP 绿行 ×2 */}
      <div className="mt-3 space-y-0.5">
        {MCP.map((line) => <div key={line} className="whitespace-pre text-[#4EC98A]">{line}</div>)}
      </div>
      {/* ④ 用户消息行：✻ 灰 + 正文 */}
      <div className="mt-3 whitespace-pre"><span className="text-[#9EA0A6]">✻ </span>{SESSION.user}</div>
      {/* ⑤ 斜体思考行 */}
      <div className="mt-2 whitespace-pre italic text-[#9EA0A6]">{SESSION.think}</div>
      {/* ⑥ 回复正文 5 行：路径蓝高亮 */}
      <div className="mt-2 space-y-0.5">
        {SESSION.reply.map((line) => (
          <div key={line} className="whitespace-pre">
            {line.split(PATH_SPLIT).map((seg, i) => i % 2 === 1
              ? <span key={i} className="text-[#4C7CFF]">{seg}</span>
              : <span key={i}>{seg}</span>)}
          </div>
        ))}
      </div>
      {/* ⑦ 底部输入框：> 正文色 + █ 光标 blink（同现状光标） */}
      <div className="mt-3 rounded-md border border-[#3A3A3E] px-3 py-2">
        <span className="whitespace-pre">{"> "}
          <span className="inline-block h-[14px] w-[7px] bg-[#D7D7DB]"
            style={{ animation: "blink 1.1s steps(1) infinite" }} />
        </span>
      </div>
    </TuiShell>
  );
}
