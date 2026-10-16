import { useTranslation } from "react-i18next";
import type { Lang } from "@/i18n";
import { useLang } from "@/i18n/useLang";
import { useDemo, QUEUED_MSG, msgDisplayText, type QuestionState, type RemoteMsg } from "../store";
import { setStateOf } from "../store";
import type { Bilingual } from "../types";
import { PlayerFrame } from "../PlayerFrame";
import { DesktopStage } from "../DesktopStage";
import { PhoneFrame } from "../PhoneFrame";
import { RemoteBoard } from "../remote/RemoteBoard";
import { RemoteDetail } from "../remote/RemoteDetail";
import { FilePreview } from "../remote/FilePreview";
import { ClaudeTui, type TuiLine, type TuiScene } from "../ClaudeTui";
import { d2Steps, d2Reset } from "../steps-d2";

/** TUI 联动行 v2（硬编码英文，真实感优先）：删 pending 分支（⏸/选项由 approval 场景块自含），保留 approved 与 queued 行。
 *  queued 回显取消息显示文本（D10：双语按 lang / {raw} 原文） */
function tuiLines(approval: "none" | "pending" | "approved", messages: RemoteMsg[], lang: Lang): TuiLine[] {
  const lines: TuiLine[] = approval === "approved"
    ? [
        { text: "✓ Approved from Tuvis Remote — resuming", tone: "ok" },
        { text: "  committing changes…", tone: "dim" },
      ]
    : [];
  for (const m of messages) {
    if (m.queued) {
      lines.push(
        { text: `> ${msgDisplayText(m, lang)}`, tone: "cmd" },
        { text: "  queued — terminal busy", tone: "dim" },
      );
    }
  }
  return lines;
}

/** 场景派生（T36）：审批 pending→approval；多选题→multiselect；单选题→select；计划模式→plan；否则 session */
function sceneOf(remote: { approval: "none" | "pending" | "approved"; planMode: boolean; question: QuestionState }): TuiScene {
  return remote.approval === "pending" ? "approval"
    : remote.question ? (remote.question.kind === "multi" ? "multiselect" : "select")
    : remote.planMode ? "plan" : "session";
}

const triggerBtn = "rounded-lg border border-app-line px-3 py-1 text-xs text-app-ink hover:bg-app-accent/50";

/** 批次 3 COPY 模式（B3-T8；模板说明见 copy.parity.test.ts 头注释）：
 *  场景内随语言变化的文案收进 COPY.{zh,en}，渲染处按语言取；en 以 `: typeof ZH` 标注互校；
 *  zh 逐字保留现状（红线），en 为产品英文版 UI 口径。
 *  语言无关项刻意不入 COPY：触发排五钮走既有 i18n 键 demo.remote.t.*；tuiLines 联动行与 plan mode
 *  底行是终端输出 / 产品英文 UI（「硬编码英文，真实感优先」既有裁决，见上方注释）。 */
const ZH = {
  /** ClaudeTui toast 正文（契约 = Bilingual，见 ClaudeTui） */
  toastBody: "远程审批 · 空闲",
};
const EN: typeof ZH = {
  toastBody: "Remote approval · idle",
};
export const COPY = { zh: ZH, en: EN } as const;

/** toast 契约（Bilingual，B3-T8）：zh/en 双支同源 COPY，ClaudeTui 侧按 lang 取 */
const TOAST_BODY: Bilingual = { zh: ZH.toastBody, en: EN.toastBody };

export function RemoteScene() {
  const { t } = useTranslation();
  const lang = useLang();
  const claude = useDemo((s) => s.sessions.claude);
  const remote = useDemo((s) => s.remote);
  const setRemote = useDemo((s) => s.setRemote);

  /* 手动触发排（剧本外双通道；与 enter 不同，允许基于当前态 patch） */
  const fire = {
    approval: () => { setRemote({ page: "detail", approval: "pending" }); setStateOf("claude", "waiting"); },
    send: () => {
      const r = useDemo.getState().remote;
      if (!r.messages.includes(QUEUED_MSG)) setRemote({ messages: [...r.messages, QUEUED_MSG] });
    },
    plan: () => setRemote({ planMode: !useDemo.getState().remote.planMode }),
    question: () => {
      const cur = useDemo.getState().remote.question;
      const next: QuestionState = cur === null
        ? { kind: "single", picked: null, submitted: false }
        : cur.kind === "single"
          ? { kind: "multi", picked: [], submitted: false }
          : null;
      setRemote({ question: next });
    },
    files: () => setRemote({ files: !useDemo.getState().remote.files }),
  };

  /* 末条用户消息 → TUI 用户行（select 场景透传）；用户输入 {raw} 与双语种子都按 lang 取显示文本（D10）。
     无用户消息时不传：ClaudeTui 侧 userMsgDefault 按语言兜底（zh「你好」/ en「Hello」）——
     原 "HI" 硬编码兜底已删（B3-T8：/zh 显示英文 HI 的既有怪状）。 */
  const lastUser = [...remote.messages].reverse().find((m) => m.role === "user");
  const lastUserMsg = lastUser ? msgDisplayText(lastUser, lang) : undefined;

  /* P19 可选联动：TUI 选项行 ↔ 手机问答卡共享同一份 picked（D9：存选项 id；双向：点终端行回写手机卡） */
  const q = remote.question;
  const picked = !q || q.submitted ? [] : q.kind === "multi" ? q.picked : q.picked ? [q.picked] : [];
  const togglePick = (id: string) => {
    const cur = useDemo.getState().remote.question;
    if (!cur || cur.submitted) return;
    if (cur.kind === "single") {
      setRemote({ question: { ...cur, picked: cur.picked === id ? null : id } });
    } else {
      const next = cur.picked.includes(id) ? cur.picked.filter((p) => p !== id) : [...cur.picked, id];
      setRemote({ question: { ...cur, picked: next } });
    }
  };

  return (
    <PlayerFrame steps={d2Steps} id="d2-player" reset={d2Reset}>
      <DesktopStage>
        {/* 手动触发排（D4 先例）：五钮覆盖五交互 */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" className={triggerBtn} onClick={fire.approval}>{t("demo.remote.t.approval")}</button>
          <button type="button" className={triggerBtn} onClick={fire.send}>{t("demo.remote.t.send")}</button>
          <button type="button" className={triggerBtn} onClick={fire.plan}>{t("demo.remote.t.plan")}</button>
          <button type="button" className={triggerBtn} onClick={fire.question}>{t("demo.remote.t.question")}</button>
          <button type="button" className={triggerBtn} onClick={fire.files}>{t("demo.remote.t.files")}</button>
        </div>
        {/* 看板页比旧单卡宽：360px 列；P12 md:items-stretch + 同高：手机详情全展开、TUI h-full 同高（手机无内滚一次性完整可见）
            P15：终端 md+ 绝对定位填充——高度恒等于手机（场景切换时 TUI 内容变高不再撑大行高把手机"挤短"） */}
        <div className="grid gap-6 p-2 md:grid-cols-[360px_minmax(0,1fr)] md:items-stretch">
          <PhoneFrame>
            {/* P18：文件预览升级为独立整屏手机页（四态：总列表/代码/文字渲染/图片） */}
            {remote.files ? <FilePreview /> : remote.page === "board" ? <RemoteBoard /> : <RemoteDetail />}
          </PhoneFrame>
          <div className="relative min-w-0">
            <ClaudeTui mode="session" scene={sceneOf(remote)} className="h-full md:absolute md:inset-0"
              userMsg={lastUserMsg}
              picked={picked}
              onPick={togglePick}
              extraLines={tuiLines(remote.approval, remote.messages, lang)}
              waiting={remote.approval === "pending"}
              modeLine={remote.planMode ? "» plan mode on (shift+tab to cycle) · < for agents" : undefined}
              toast={claude.state === "idle" ? { title: "Claude", body: TOAST_BODY } : null} />
          </div>
        </div>
      </DesktopStage>
    </PlayerFrame>
  );
}
