import { useTranslation } from "react-i18next";
import { useDemo, QUEUED_MSG, type QuestionState, type RemoteMsg } from "../store";
import { setStateOf } from "../store";
import { PlayerFrame } from "../PlayerFrame";
import { DesktopStage } from "../DesktopStage";
import { PhoneFrame } from "../PhoneFrame";
import { RemoteBoard } from "../remote/RemoteBoard";
import { RemoteDetail } from "../remote/RemoteDetail";
import { FilePreview } from "../remote/FilePreview";
import { ClaudeTui, type TuiLine, type TuiScene } from "../ClaudeTui";
import { d2Steps, d2Reset } from "../steps-d2";

/** TUI 联动行 v2（硬编码英文，真实感优先）：删 pending 分支（⏸/选项由 approval 场景块自含），保留 approved 与 queued 行 */
function tuiLines(approval: "none" | "pending" | "approved", messages: RemoteMsg[]): TuiLine[] {
  const lines: TuiLine[] = approval === "approved"
    ? [
        { text: "✓ Approved from Tuvis Remote — resuming", tone: "ok" },
        { text: "  committing changes…", tone: "dim" },
      ]
    : [];
  for (const m of messages) {
    if (m.queued) {
      lines.push(
        { text: `> ${m.text}`, tone: "cmd" },
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

export function RemoteScene() {
  const { t } = useTranslation();
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

  const lastUserMsg = [...remote.messages].reverse().find((m) => m.role === "user")?.text ?? "HI";

  /* P19 可选联动：TUI 选项行 ↔ 手机问答卡共享同一份 picked（双向：点终端行回写手机卡） */
  const q = remote.question;
  const picked = !q || q.submitted ? [] : q.kind === "multi" ? q.picked : q.picked ? [q.picked] : [];
  const togglePick = (title: string) => {
    const cur = useDemo.getState().remote.question;
    if (!cur || cur.submitted) return;
    if (cur.kind === "single") {
      setRemote({ question: { ...cur, picked: cur.picked === title ? null : title } });
    } else {
      const next = cur.picked.includes(title) ? cur.picked.filter((p) => p !== title) : [...cur.picked, title];
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
              extraLines={tuiLines(remote.approval, remote.messages)}
              waiting={remote.approval === "pending"}
              modeLine={remote.planMode ? "» plan mode on (shift+tab to cycle) · < for agents" : undefined}
              toast={claude.state === "idle" ? { title: "Claude", body: "远程审批 · 空闲" } : null} />
          </div>
        </div>
      </DesktopStage>
    </PlayerFrame>
  );
}
