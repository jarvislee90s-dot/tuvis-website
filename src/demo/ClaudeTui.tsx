import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/i18n";
import { brandWord } from "@/components/Brand";
import { useLang } from "@/i18n/useLang";
import { QA_MULTI, QA_SINGLE } from "./qa";

export interface TuiLine { text: string; tone?: "cmd" | "ok" | "warn" | "dim" }
export interface TuiReply { headline: string; bullets: string[] }

/** 剧情行色值沿用 TerminalWindow 的 TONE：cmd 橙 / ok 绿 / warn 黄 / dim 灰 */
const TONE = {
  cmd: "text-[#D97757]",
  ok: "text-[#4EC98A]",
  warn: "text-[#EAB53D]",
  dim: "text-[#8B857A]",
} as const;

/** macOS 红绿灯为拟物固定色，不随主题（A7）；红灯 = 关窗 */
const LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

const MENU_ITEMS = ["Copy", "Paste", "Clear", "Settings"] as const;

/** session 态常量（对照用户 2026-10-12 提供的 Claude Code 真机截图：三行头部 + 中文正文，路径 tuvis 化） */
const SESSION_HEADER = [
  "Claude Code v2.1.287",
  "glm-5.3-flash[1M] with max effort · API Usage Billing",
  "cwd: E:\\LLMproject\\Github\\tuvis-app",
];
const THOUGHT_LINE = "✻ Thought for 9s (ctrl+o to expand)";
const STATUS_LINE = "※ Sautéed for 10s · done 15:48";
const DEFAULT_MODELINE = "» auto mode on (shift+tab to cycle) · < for agents";
/** 默认回复正文：品牌词按语言（D1/B3-T1 只动品牌词，其余中文文案待批次 3 后续整体 COPY 化）。 */
function defaultReply(lang: Lang): TuiReply {
  return {
    headline: "你好！👋",
    bullets: [
      `我已就绪，当前工作目录是 E:\\LLMproject\\Github\\tuvis-app（${brandWord(lang)}桌面端）。`,
      "• 3 个 Agent 会话在线，1 个等待批准",
      "• 远程通道已连接（MateBook16s · v0.5.6）",
      "• 今日账本入账 1240 万 tokens",
      "有什么我可以帮你的吗？",
    ],
  };
}

/** 头部像素兔（逐格对照用户 2026-10-12 参考图：太空侵略者式——宽方身圆角、白色竖眼、
 *  两侧中段凸出小方块（手臂）、底部四条短腿；身体 #D97757 单色，眼白 #F5F1E8 同终端正文色） */
const RABBIT_PIXELS = [
  "..XXXXXXXX..",
  ".XXXXXXXXXX.",
  ".XXEXXXXEXX.",
  ".XXEXXXXEXX.",
  "XXXXXXXXXXXX",
  ".XXXXXXXXXX.",
  ".XXXXXXXXXX.",
  "..X.X..X.X..",
  "..X.X..X.X..",
  "..X.X..X.X..",
];
const RABBIT_FILL: Record<string, string> = { X: "#D97757", E: "#F5F1E8" };
function PixelRabbit() {
  const P = 4;
  return (
    <svg width={RABBIT_PIXELS[0].length * P} height={RABBIT_PIXELS.length * P} viewBox={`0 0 ${RABBIT_PIXELS[0].length * P} ${RABBIT_PIXELS.length * P}`} aria-hidden="true" className="mb-2">
      {RABBIT_PIXELS.flatMap((row, y) =>
        [...row].map((c, x) => RABBIT_FILL[c] ? (
          <rect key={`${x}-${y}`} x={x * P} y={y * P} width={P} height={P} fill={RABBIT_FILL[c]} />
        ) : null),
      )}
    </svg>
  );
}

/** T36 场景常量区：approval/plan/select 按 Claude Code 官方交互范式近似（B27，真图补采后逐项校对）；
 *  multiselect 逐字对照 docs/design/p10-ref/claude-tui-multiselect.png（已入库唯一权威基准）。
 *  选中态高亮行统一：❯ 橙 + 编号正文色 + 整行底 #1F1D18 rounded px-1.5；未选行两空格缩进、编号次色 */
export type TuiScene = "session" | "approval" | "plan" | "select" | "multiselect";

const APPROVAL_TASK = "git commit -m 'feat: remote approve'";
const APPROVAL_OPTIONS = ["Yes", "Yes, and don't ask again", "No"];
const PLAN_PREFIX = "Planning:  ";
const PLAN_PATHS = "src/remote/approve.rs · src/remote/mod.rs";
const PLAN_TITLE = "Ready to code?";
const PLAN_OPTIONS = ["Yes, and auto-accept edits", "Yes, and manually approve edits", "No, keep planning"];
const SELECT_USER_LINE = "帮我把这道题归到题目领域";
const SELECT_CHIP = "题目领域";
const MULTI_RECAP =
  "※ recap: 远程审批卡文案已定稿，保存到 E:\\LLMproject\\Github\\tuvis-app\\docs\\remote-card.md。" +
  "下一步：等你确认后我把审批状态机接进看板红绿灯。(disable recaps in /config)";
const MULTI_HOOK_ERROR = "⎿ UserPromptSubmit hook error";
const MULTI_HOOK_DETAIL =
  "  ⎿ Failed with non-blocking status code: /usr/bin/bash: line 1: C:/Users/bunny/.tuvis/bin/tuvis-hook-listener.exe: Permission denied";
const MULTI_THOUGHT = "✻ Thought for 34s (ctrl+o to expand)";
const OPTION_FOOT = "Enter to select · ↑/↓ to navigate · Esc to cancel";

/** 场景选项行（approval/plan/select/multiselect 四处复用同一组件）；描述行次色、缩进 5 空格对齐标题列。
 *  P19 可选联动：传 onPick 时整行可点（与手机问答卡双向同步）；marker = 已选标记（多选 ✓）。 */
function OptionRow({ index, title, selected = false, description, marker, onClick }: {
  index: number; title: string; selected?: boolean; description?: string; marker?: string; onClick?: () => void;
}) {
  const line = (
    <div className={`whitespace-pre rounded px-1.5 ${selected ? "bg-[#1F1D18]" : ""}`}>
      {selected
        ? <><span className="text-[#D97757]">{"❯ "}</span>{marker && <span className="text-[#4EC98A]">{marker} </span>}<span>{index + ". " + title}</span></>
        : <><span className="text-[#8B857A]">{"  "}</span>{marker && <span className="text-[#4EC98A]">{marker} </span>}<span className="text-[#8B857A]">{index + ". "}</span><span>{title}</span></>}
    </div>
  );
  if (!onClick) return <div>{line}{description && <div className="whitespace-pre pl-1.5 text-[#8B857A]">{"     " + description}</div>}</div>;
  return (
    <button type="button" onClick={onClick} className="block w-full text-left transition hover:bg-[#1F1D18]/60">
      {line}
      {description && <div className="whitespace-pre pl-1.5 text-[#8B857A]">{"     " + description}</div>}
    </button>
  );
}

/** approval 场景：任务行 + ⏸ Permission needed + Yes/No 三选项（选中 ❯ 1. Yes 高亮行） */
function ApprovalScene() {
  return (
    <div className="mt-3">
      <div className="whitespace-pre"><span className="text-[#D97757]">{"❯ "}</span>{APPROVAL_TASK}</div>
      <div className="mt-1 whitespace-pre font-medium text-[#EAB53D]">{"⏸ Permission needed"}</div>
      <div className="mt-1 space-y-0.5">
        {APPROVAL_OPTIONS.map((o, i) => <OptionRow key={o} index={i + 1} title={o} selected={i === 0} />)}
      </div>
    </div>
  );
}

/** plan 场景：Planning 路径行 + Ready to code? + 官方 plan-mode 三选项 */
function PlanScene() {
  return (
    <div className="mt-3">
      <div className="whitespace-pre"><span className="text-[#8B857A]">{PLAN_PREFIX}</span>{PLAN_PATHS}</div>
      <div className="mt-1 whitespace-pre font-bold">{PLAN_TITLE}</div>
      <div className="mt-1 space-y-0.5">
        {PLAN_OPTIONS.map((o, i) => <OptionRow key={o} index={i + 1} title={o} selected={i === 0} />)}
      </div>
    </div>
  );
}

/** select 场景（单选近似）：题目领域 chip + 粗体问题 + 带描述编号选项 + Enter-to-select 底行。
 *  P19 联动：picked[0] = 手机卡选中项的 id（无选中时 ❯ 停在第一行）；onPick 传入则整行可点。
 *  题面/选项文案取自 qa.ts（共享表，按 lang 取；M9） */
function SelectScene({ lang, picked, onPick }: { lang: Lang; picked?: string[]; onPick?: (id: string) => void }) {
  return (
    <div className="mt-3">
      <div><span className="rounded bg-[#2A2824] px-1.5 text-[#D97757]">{SELECT_CHIP}</span></div>
      <div className="mt-1 whitespace-pre font-bold">{QA_SINGLE.question[lang]}</div>
      <div className="mt-1 space-y-0.5">
        {QA_SINGLE.options.map((o, i) => {
          const selected = picked && picked.length > 0 ? picked[0] === o.id : i === 0;
          return (
            <OptionRow key={o.id} index={i + 1} title={o.title[lang]} description={o.desc?.[lang]} selected={selected}
              onClick={onPick ? () => onPick(o.id) : undefined} />
          );
        })}
      </div>
      <div className="mt-1 whitespace-pre text-[#8B857A]">{OPTION_FOOT}</div>
    </div>
  );
}

/** multiselect 场景：逐字对照 claude-tui-multiselect.png——
 *  ※ recap（用户行上方）→ hook error 树 → Thought 34s → chip → 粗体问题 → 编号选项 1-6 → 底行。
 *  P19 联动：picked = 手机卡勾选集（选项 id；✓ 绿标 + 行高亮）；onPick 传入则整行可点。
 *  题面/选项文案取自 qa.ts（共享表，按 lang 取；M9） */
function MultiselectScene({ lang, picked, onPick }: { lang: Lang; picked?: string[]; onPick?: (id: string) => void }) {
  const hasPick = !!picked && picked.length > 0;
  return (
    <div className="mt-3">
      <div className="whitespace-pre text-[#EAB53D]">{MULTI_HOOK_ERROR}</div>
      <div className="whitespace-pre text-[#8B857A]">{MULTI_HOOK_DETAIL}</div>
      <div className="mt-2 whitespace-pre text-[#8B857A]">{MULTI_THOUGHT}</div>
      <div className="mt-2"><span className="rounded bg-[#2A2824] px-1.5 text-[#D97757]">{SELECT_CHIP}</span></div>
      <div className="mt-1 whitespace-pre font-bold">{QA_MULTI.question[lang]}</div>
      <div className="mt-1 space-y-0.5">
        {QA_MULTI.options.map((o, i) => {
          const selected = hasPick && picked!.includes(o.id);
          return (
            <div key={o.id}>
              {i === 5 && <div className="my-1 h-px bg-[#2A2824]" />}
              <OptionRow index={i + 1} title={o.title[lang]} description={o.desc?.[lang]} selected={selected}
                marker={selected ? "✓" : undefined}
                onClick={onPick ? () => onPick(o.id) : undefined} />
            </div>
          );
        })}
      </div>
      <div className="mt-1 whitespace-pre text-[#8B857A]">{OPTION_FOOT}</div>
    </div>
  );
}

/** Claude Code TUI 终端窗（D1 右区 / D2 右侧共用）。窗体近黑、内容硬编码英文（真实感）。
 *  宽行不折行：按住拖动横向滚动；右键弹模拟配置菜单。视觉 1:1 对照 docs/design/claude-tui-ref.png
 *  mode="session"（默认）渲染完整会话态（三行头部/灰底用户消息/思考折叠/回复/※ 状态行/auto mode 底行/右下 toast）；
 *  mode="welcome" 保留 P8 欢迎盒态（当前无调用方，组件 API 预留）。
 *  scene（默认 "session"）：场景块替换 ③Thought+⑤Reply，header/用户行/extraLines/状态行/输入行/modeLine/toast 全保留；
 *  select/multiselect 接管用户行内容（透传覆盖）。 */
export function ClaudeTui({
  mode = "session", scene = "session", userMsg = "你好", reply, modeLine = DEFAULT_MODELINE,
  extraLines = [], waiting = false, toast = null, className = "", onClose,
  picked, onPick,
}: {
  mode?: "welcome" | "session"; scene?: TuiScene; userMsg?: string; reply?: TuiReply; modeLine?: string;
  extraLines?: TuiLine[]; waiting?: boolean; toast?: { title: string; body: string } | null;
  /** P19 可选联动：picked = 手机问答卡的选项 id 集；onPick = 点终端选项行按 id 回写手机卡 */
  picked?: string[]; onPick?: (id: string) => void;
  className?: string; onClose?: () => void;
}) {
  const lang = useLang();
  /* 未显式传 reply 时按语言生成默认正文（品牌词随语言，B3-T1） */
  const replyText = reply ?? defaultReply(lang);
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

  /* ⑨ 底行配色：mode 引导段橙（同 TONE.cmd）、括号说明灰——对照基准图 */
  const parenAt = modeLine.indexOf(" (");
  const modeLead = parenAt === -1 ? modeLine : modeLine.slice(0, parenAt);
  const modeRest = parenAt === -1 ? "" : modeLine.slice(parenAt);

  const inputLine = (
    <div className="mt-3 rounded-md border border-[#2A2824] px-3 py-2">
      <div className="flex items-center whitespace-pre">
        <span>&gt; </span>
        <span className="text-[#8B857A]">Try "edit &lt;filepath&gt; to..."</span>
        <span className="inline-block h-[14px] w-[7px] bg-[#D8D3C8]"
          style={{ animation: waiting ? "none" : "blink 1.1s steps(1) infinite" }} />
      </div>
    </div>
  );

  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-lg border border-[#2A2824] bg-[#0E0D0B] shadow-soft ${className}`}>
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

      {/* 终端主体：宽行不折行，按住拖动横向滚动（不 preventDefault，卡片级点击不受影响）；定高时补全余量 */}
      <div ref={scrollRef}
        className={`min-h-0 flex-1 cursor-grab select-none overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-[#D8D3C8] ${grabbing ? "cursor-grabbing" : ""}`}
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
        <div className="w-max min-w-full">
          {mode === "session" ? (
            <>
              {/* ⓪ 头部像素兔（对照真机截图，仅 session 态） */}
              <PixelRabbit />
              {/* ① header 三行 */}
              <div className="space-y-0.5 text-[10px] leading-tight text-[#8B857A]">
                {SESSION_HEADER.map((line) => <div key={line} className="whitespace-pre">{line}</div>)}
              </div>
              {/* multiselect：※ recap 位于最上（对照截图顺序；P15 用户行删除） */}
              {scene === "multiselect" && (
                <div className="mt-3 whitespace-pre italic text-[#8B857A]">{MULTI_RECAP}</div>
              )}
              {/* ② 用户消息行：灰底高亮全宽；multiselect 场景不渲染（P15），select 场景接管内容 */}
              {scene !== "multiselect" && (
                <div className="mt-3 rounded bg-[#2A2824] px-1.5 py-0.5">
                  <div className="whitespace-pre">
                    <span className="text-[#8B857A]">&gt; </span>
                    {scene === "select" ? SELECT_USER_LINE : userMsg}
                  </div>
                </div>
              )}
              {/* ③ 思考折叠行（仅 session） */}
              {scene === "session" && <div className="mt-3 whitespace-pre text-[#8B857A]">{THOUGHT_LINE}</div>}
              {/* ③⑤ 场景块：approval/plan/select/multiselect 替换 Thought+Reply（占 ③ 位，对照截图用户行下即场景内容） */}
              {scene === "approval" && <ApprovalScene />}
              {scene === "plan" && <PlanScene />}
              {scene === "select" && <SelectScene lang={lang} picked={picked} onPick={onPick} />}
              {scene === "multiselect" && <MultiselectScene lang={lang} picked={picked} onPick={onPick} />}
              {/* ④ 剧情行（D2 联动，全场景保留） */}
              {extraLines.map((l, i) => (
                <div key={i} className={`whitespace-pre ${l.tone ? TONE[l.tone] : ""}`}>{l.text}</div>
              ))}
              {/* ⑤ 助手回复块（仅 session；场景态由上方场景块替换） */}
              {scene === "session" && (
                <>
                  <div className="mt-3 whitespace-pre">{replyText.headline}</div>
                  <div className="space-y-0.5">
                    {replyText.bullets.map((b) => <div key={b} className="whitespace-pre">{b}</div>)}
                  </div>
                </>
              )}
              {/* ⑥ ※ 状态行 */}
              <div className="mt-3 whitespace-pre text-[#8B857A]">{STATUS_LINE}</div>
              {/* ⑦ 分隔线 */}
              <div className="mt-3 h-px bg-[#2A2824]" />
              {/* ⑧ 输入行（既有，waiting 停闪） */}
              {inputLine}
              {/* ⑨ 底行：auto / plan mode */}
              <div className="mt-1.5 whitespace-pre">
                <span className="text-[#D97757]">{modeLead}</span>
                <span className="text-[#8B857A]">{modeRest}</span>
              </div>
            </>
          ) : (
            <>
              {/* 1. 橙框欢迎盒 */}
              <div className="mb-3 w-fit rounded-md border border-[#D97757] p-3">
                <div className="whitespace-pre"><span className="text-[#D97757]">✻</span> Welcome to Claude Code!</div>
                <div className="whitespace-pre italic text-[#8B857A]">  /help for help, /status for your current setup</div>
                <div className="whitespace-pre">cwd: ~/projects/tuvis-app</div>
                <div className="my-3 h-px bg-[#8B857A]/60" />
                <div className="whitespace-pre">Overrides: API Base URL (https://api…)</div>
              </div>
              {/* 2. Tips for getting started */}
              <div className="whitespace-pre">Tips for getting started:</div>
              <div className="whitespace-pre"> </div>
              <div className="whitespace-pre">1. Run /init to create a CLAUDE.md file with instructions for Claude</div>
              <div className="whitespace-pre">2. Use Claude to help with file analysis, editing, bash commands and git</div>
              <div className="whitespace-pre">3. Be as specific as you would with another engineer for the best results</div>
              {/* 3. 黄色 Note */}
              <div className="whitespace-pre text-[#EAB53D]">Note: You have launched claude in your home directory. For the best experience, launch it in a project directory instead.</div>
              {/* 4. 灰色 ※ Tip */}
              <div className="whitespace-pre text-[#8B857A]">※ Tip: Hit Enter to queue up additional messages while Claude is working.</div>
              {/* 5. 剧情行（D1/D2） */}
              {extraLines.map((l, i) => (
                <div key={i} className={`whitespace-pre ${l.tone ? TONE[l.tone] : ""}`}>{l.text}</div>
              ))}
              {/* 6. 底部输入行 + ? for shortcuts */}
              {inputLine}
              <div className="mt-1.5 whitespace-pre text-right text-[#8B857A]">? for shortcuts</div>
            </>
          )}
        </div>
      </div>

      {/* ⑩ 右下 toast 通知卡 */}
      {toast && (
        <div className="absolute bottom-3 right-3 rounded-md border border-[#333] bg-[#1A1A1A] p-2 text-[10px] shadow-pop">
          <div className="flex items-center gap-1.5 whitespace-pre">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4EC98A]" aria-hidden />
            <span className="font-semibold text-[#D8D3C8]">{toast.title}</span>
            <span className="text-[#8B857A]">· {toast.body}</span>
          </div>
        </div>
      )}

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
