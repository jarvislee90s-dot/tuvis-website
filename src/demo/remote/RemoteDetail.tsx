import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/i18n/useLang";
import { useDemo, setStateOf, msgDisplayText, type QuestionState } from "../store";
import { ArrowLeftIcon, RefreshCwIcon } from "../../components/Icons";
import { QA_MULTI, QA_SINGLE, submittedDisplayText } from "../ClaudeTui";

/** 思考展开态 3 行过程文本（会话数据，硬编码；tuvis 语境） */
const THINKING_STEPS = ["读取看板状态快照…", "计算托盘三态防抖窗口…", "生成调整方案"];
/** 工具调用行（02 定稿 A 段消息流要素，静态） */
const TOOL_CALL = { tag: "调用 Bash", cmd: 'grep -n "approve" src/remote/approve.rs' };
const APPROVE_CMD = "git commit -m 'feat: remote approve'";

/** 子 Agent chip 行（T43 保留项）：头像字母 + 名称 + 状态徽标，静态 + title 悬浮说明（状态色：绿/黄/红） */
const SUB_AGENTS: { name: string; letter: string; avatarCls: string; statusCls: string; statusKey: string; mark: string }[] = [
  { name: "scout", letter: "S", avatarCls: "bg-amber-500", statusCls: "text-[#1E7B34]", statusKey: "badge.idle", mark: "✓" },
  { name: "writer", letter: "W", avatarCls: "bg-sky-500", statusCls: "text-[#8A6D00]", statusKey: "badge.running", mark: "▶" },
  { name: "checker", letter: "C", avatarCls: "bg-violet-500", statusCls: "text-[#B3261E]", statusKey: "badge.waiting", mark: "⏸" },
];

/** 详情头/题卡/审批状态徽标（02 定稿淡底彩字） */
const STATE_BADGE: Record<string, string> = {
  waiting: "bg-[#FEE9E5] text-[#B3261E]",
  running: "bg-[#FBF3D9] text-[#8A6D00]",
  idle: "bg-[#E3F2E7] text-[#1E7B34]",
};

const ibtn =
  "flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-card text-inkdim hover:text-ink";

const chip = (active: boolean) =>
  `rounded-full border px-2.5 py-1 text-[11px] transition ${
    active ? "border-btnp bg-btnp text-btnpt" : "border-line bg-card text-inkdim hover:text-ink"
  }`;

/** 手机详情页（P13 对照 docs/design/p13-ref/02-详情层-定稿.html A/B/C 三段重做）：
 *  详情头（返回/标题/状态徽标/分屏/刷新）→ 书签·调试栏（过程展开联动）→ 消息流（暖灰用户气泡右 /
 *  助手纯文本左 / 工具调用行 / 思考行 / 计划卡 / 文件面板 / 审批红卡 / 问答卡）→ 信任·模式 chips + 输入行。
 *  屏幕比例锁定：消息区 flex 封顶裁剪旧消息，交互卡恒可见，无内滚。 */
export function RemoteDetail() {
  const { t } = useTranslation();
  const lang = useLang();
  const claude = useDemo((s) => s.sessions.claude);
  const remote = useDemo((s) => s.remote);
  const setRemote = useDemo((s) => s.setRemote);
  const [trust, setTrust] = useState(false);
  const [spin, setSpin] = useState(false);
  const [draft, setDraft] = useState("");

  /* 交互①：发消息——气泡上屏并标「已排队」；用户实时输入无法双语 → { raw }（D10） */
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setRemote({ messages: [...remote.messages, { role: "user", text: { raw: text }, queued: true }] });
    setDraft("");
  };

  /* 交互④：题卡点选 + 提交（D9：picked 存选项 id，不是显示串） */
  const pickOption = (id: string) => {
    const q = remote.question;
    if (!q || q.submitted) return;
    if (q.kind === "single") {
      setRemote({ question: { kind: "single", picked: id, submitted: false } });
    } else {
      const picked = q.picked.includes(id) ? q.picked.filter((p) => p !== id) : [...q.picked, id];
      setRemote({ question: { kind: "multi", picked, submitted: false } });
    }
  };
  const submitQuestion = () => {
    const q = remote.question;
    if (!q || q.submitted) return;
    if (q.kind === "single" ? q.picked === null : q.picked.length === 0) return;
    setRemote({ question: { ...q, submitted: true } });
  };

  const q: QuestionState = remote.question;
  const pickedEmpty = q === null || (q.kind === "single" ? q.picked === null : q.picked.length === 0);
  /** 提交回显整行；空 picked → 空串 → 整行不渲染（防「已提交：」悬空标签，审查 M5） */
  const submittedEcho = q !== null && q.submitted ? submittedDisplayText(t("demo.remote.submitted"), q, lang) : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col text-ink">
      {/* ① 详情头：返回 + 项目/会话名 + 状态徽标 + 分屏 + 刷新（点击图标转一圈） */}
      <div className="flex items-center gap-2 pb-2">
        <button type="button" aria-label={t("demo.phone.back")} onClick={() => setRemote({ page: "board" })}
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] border border-line bg-card text-inkdim hover:text-ink">
          <ArrowLeftIcon size={14} />
        </button>
        <span className="min-w-0">
          <div className="truncate text-[15px] font-bold leading-tight">{claude.project}</div>
          <div className="truncate text-[11.5px] text-inkdim">Claude · {t("demo.phone.title.claude")}</div>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className={`inline-flex items-center gap-[5px] rounded-full px-2 py-[3px] text-[10.5px] font-semibold ${STATE_BADGE[claude.state]}`}>
            <span aria-hidden="true" className={`h-[6px] w-[6px] rounded-full bg-current ${claude.state === "waiting" ? "animate-pulse motion-reduce:animate-none" : ""}`} />
            {t(`demo.pill.${claude.state}`)}
          </span>
          <button type="button" disabled title={t("demo.na")} aria-label={t("demo.remote.split")} className={ibtn}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="3" y="4" width="8" height="16" rx="2" /><rect x="13" y="4" width="8" height="16" rx="2" />
            </svg>
          </button>
          <button type="button" aria-label={t("demo.phone.refresh")}
            onClick={() => { setSpin(true); window.setTimeout(() => setSpin(false), 900); }} className={ibtn}>
            <RefreshCwIcon size={13} className={spin ? "animate-spin" : ""} />
          </button>
        </span>
      </div>

      {/* 1.5 子 Agent chip 行（T43 保留项） */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1.5">
        <span className="text-[10px] text-inkdim">{t("usage.ws.agents")}</span>
        {SUB_AGENTS.map((a) => (
          <span key={a.name} title={`${a.name} · ${t(a.statusKey)}`}
            className="flex items-center gap-1.5 rounded-full border border-line bg-card px-2 py-0.5">
            <span aria-hidden="true"
              className={`h-3.5 w-3.5 rounded-full text-center text-[8px] font-bold leading-[14px] text-white ${a.avatarCls}`}>
              {a.letter}
            </span>
            <span className="font-mono text-[10px]">{a.name}</span>
            <span className={`text-[9px] ${a.statusCls}`}>{a.mark} {t(a.statusKey)}</span>
          </span>
        ))}
      </div>

      {/* ② 书签 · 调试栏（02 定稿 bkm 行）+ 过程展开联动 */}
      <div className="flex items-center gap-2 border-y border-line px-1 py-1.5 text-[11.5px] text-inkdim">
        <span>＋ {t("demo.phone.bookmark")}</span>
        <span aria-hidden>·</span>
        <span>⚙ {t("demo.phone.debug")}</span>
        <button type="button" onClick={() => setRemote({ thinkingExpanded: !remote.thinkingExpanded })}
          className="ml-auto shrink-0 hover:text-ink">
          {remote.thinkingExpanded ? t("demo.phone.collapse") : t("demo.phone.expandAll")}
        </button>
      </div>

      {/* ③ 消息流：上半 = 气泡/工具行/思考（flex 封顶，溢出裁旧；排队消息不进气泡，走底部 chip）；下半 = 交互卡恒可见 */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-hidden py-2.5">
          {remote.thinkingExpanded ? (
            <div className="space-y-0.5 px-0.5 text-[11px] text-inkdim">
              {THINKING_STEPS.map((s) => <div key={s}>▶ {s}</div>)}
            </div>
          ) : (
            <div className="px-0.5 text-[11px] text-inkdim">▶ {t("demo.phone.thinking")} · 9 {t("demo.phone.seconds")}</div>
          )}
          {remote.messages.filter((m) => !m.queued).map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="max-w-[82%] self-end">
                <div className="rounded-[16px] rounded-br-[4px] bg-[#EDEBE4] px-3 py-2 text-[12px] text-[#33312B]">{msgDisplayText(m, lang)}</div>
                {m.queued && <div className="mt-0.5 text-right text-[10px] text-inkdim">{t("demo.phone.queued")}</div>}
              </div>
            ) : (
              <div key={i} className="max-w-[92%] self-start whitespace-pre-line px-0.5 text-[12px] leading-relaxed text-[#2A2925]">
                {msgDisplayText(m, lang)}
              </div>
            ),
          )}
          <div className="flex items-center gap-2 rounded-[10px] border border-line bg-card px-2.5 py-[7px] text-[11.5px] text-inkdim">
            <span aria-hidden className="text-[10px]">▶</span>
            <span className="shrink-0">{TOOL_CALL.tag}</span>
            <span className="truncate font-mono text-[11px] text-ink">{TOOL_CALL.cmd}</span>
          </div>
        </div>

        {/* 交互卡区（shrink-0：审批/计划/文件/题卡恒可见） */}
        <div className="space-y-2.5 pb-1">
          {/* 计划卡（02 定稿 plan 卡；planMode 联动） */}
          {remote.planMode && (
            <div className="rounded-xl border border-line bg-card p-3">
              <div className="text-[10.5px] font-bold tracking-[0.08em] text-inkdim">{t("demo.remote.planBadge")}</div>
              <p className="mt-1.5 text-[12px] leading-relaxed">{t("demo.remote.planBody")}</p>
              <div className="mt-1.5 text-[11px] text-[#8A6D00]">{t("demo.remote.planDesc")}</div>
            </div>
          )}

          {/* 审批红卡（02 定稿：全页唯一红边卡；允许放行续跑 / 拒绝收卡） */}
          {remote.approval === "pending" && (
            <div className="rounded-[14px] border-[1.5px] border-[#E5B9B2] bg-card p-3 shadow-[0_2px_10px_rgba(179,38,30,0.06)]">
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#B3261E]">
                <span aria-hidden="true" className="h-[6px] w-[6px] animate-pulse rounded-full bg-current motion-reduce:animate-none" />
                {t("demo.pill.waiting")}
              </div>
              <div className="mt-2 rounded-lg border border-line bg-[#F7F6F2] px-2.5 py-2 font-mono text-[11.5px] text-ink">${APPROVE_CMD}</div>
              <div className="mt-2.5 flex gap-2">
                <button type="button"
                  onClick={() => { setRemote({ approval: "approved" }); setStateOf("claude", "running"); }}
                  className="flex-1 rounded-[10px] bg-btnp py-2 text-[12.5px] font-semibold text-btnpt">
                  {t("demo.phone.approve")}
                </button>
                <button type="button" onClick={() => setRemote({ approval: "none" })}
                  className="flex-1 rounded-[10px] border border-line bg-card py-2 text-[12.5px] font-medium text-inkdim">
                  {t("demo.remote.deny")}
                </button>
              </div>
              <div className="mt-2 text-[10.5px] text-[#B3261E]/75">{t("demo.remote.apprFoot")}</div>
            </div>
          )}
          {remote.approval === "approved" && (
            <div className="px-0.5 text-[11px] font-medium text-[#1E7B34]">
              ✓ {t("demo.phone.approve")} — {t("demo.caption.running")}
            </div>
          )}

          {/* 问答卡（P19：题面与 TUI 场景共享同一份常量——左右一致；选项深蓝主题。D9：picked 只存选项 id） */}
          {q !== null && !q.submitted && (
            <div className="rounded-[14px] border-[1.5px] border-[#93B8F8] bg-[#F3F8FF] p-3 shadow-[0_2px_10px_rgba(37,99,235,0.08)]">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-[#E8F0FE] px-2 py-0.5 text-[10px] font-semibold text-[#1D4ED8]">
                  {q.kind === "single" ? t("demo.pill.question") : t("demo.pill.multi")}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                  {q.kind === "single" ? QA_SINGLE.question : QA_MULTI.question}
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {(q.kind === "single" ? QA_SINGLE.options : QA_MULTI.options).map((opt) => {
                  const picked = q.kind === "single" ? q.picked === opt.id : q.picked.includes(opt.id);
                  return (
                    <button key={opt.id} type="button" aria-pressed={picked} onClick={() => pickOption(opt.id)}
                      className={`flex w-full items-start gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[12px] ${
                        picked ? "border-[#2563EB] bg-[#DBEAFE] shadow-[0_0_0_1px_#2563EB]" : "border-[#BFDBFE] bg-[#E8F0FE]/70 hover:border-[#93B8F8]"
                      }`}>
                      {q.kind === "single" ? (
                        <span aria-hidden="true" className={`mt-px h-[15px] w-[15px] shrink-0 rounded-full border-[1.5px] ${
                          picked ? "border-[#2563EB] bg-[radial-gradient(circle,#2563EB_0_4.5px,#fff_5px)]" : "border-[#9DB8E8]"
                        }`} />
                      ) : (
                        <span aria-hidden="true" className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] text-[9px] leading-none ${
                          picked ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#9DB8E8] bg-card"
                        }`}>
                          {picked ? "✓" : ""}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-ink">{opt.title}</span>
                        {"desc" in opt && opt.desc && (
                          <span className="block text-[10px] leading-snug text-[#4B6BDB]">{opt.desc}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 rounded-[10px] border border-[#D7E3F8] bg-card px-2.5 py-2 text-[12px] text-app-mut">
                {t("demo.phone.inputPlaceholder")}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-app-mut">
                <span>{t("demo.remote.qaHint")}</span>
                {/* M6：aria 含可见文本「发送」语义（label-in-name），测试与读屏都按此稳定取钮 */}
                <button type="button" disabled={pickedEmpty} onClick={submitQuestion}
                  aria-label={t("demo.remote.submitQa")}
                  className="shrink-0 pl-2 font-semibold text-[#1D4ED8] disabled:opacity-40">
                  {t("demo.phone.send")} ↵
                </button>
              </div>
            </div>
          )}
          {submittedEcho !== "" && (
            <div className="rounded-[10px] border border-line bg-card px-2.5 py-[7px] text-[11.5px] text-inkdim">
              {submittedEcho}
            </div>
          )}
        </div>
      </div>

      {/* ④ 底部：排队 chip（真实产品机制：排队消息不进气泡，悬在这里）→ 信任/模式 chips → 输入行 */}
      <div className="shrink-0 space-y-2 border-t border-line pt-2">
        {remote.messages.filter((m) => m.queued).map((m, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-full border border-app-line bg-app-accent/50 px-2.5 py-1 text-[10.5px] text-app-mut">
            <span aria-hidden>⏳</span>
            <span className="truncate">{msgDisplayText(m, lang)}</span>
            <span className="shrink-0 font-medium text-inkdim">{t("demo.phone.queued")}</span>
          </div>
        ))}
        <div className="flex gap-1.5">
          <button type="button" aria-pressed={trust} onClick={() => setTrust(!trust)} className={chip(trust)}>
            {t("demo.phone.trust")}
          </button>
          <button type="button" onClick={() => setRemote({ planMode: !remote.planMode })} className={chip(false)}>
            {t("demo.phone.switchMode")}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-inkdim">＋</span>
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={t("demo.phone.inputPlaceholder")} aria-label={t("demo.phone.inputPlaceholder")}
            className="min-w-0 flex-1 rounded-xl border border-line bg-card px-3 py-2 text-xs text-ink outline-none placeholder:text-inkdim" />
          <button type="button" aria-label={t("demo.phone.send")} onClick={send}
            className="shrink-0 rounded-[11px] bg-btnp px-4 py-2 text-xs font-semibold text-btnpt">
            {t("demo.phone.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
