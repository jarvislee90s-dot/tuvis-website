import { useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { brandWord } from "@/components/Brand";
import { useLang } from "@/i18n/useLang";
import { useDemo } from "../store";
import { edgeStyle, toolOf } from "../tools";
import { ToolIcon } from "../ToolIcon";
import changelog from "@/content/changelog.json";
import { HistoryIcon, MoonIcon, VolumeIcon } from "../../components/Icons";

/** 手机端卡片时间戳（mono 时间列；演示静态数据，P13 补 opencode） */
const PHONE_META: Record<string, { time: string }> = {
  claude: { time: "14:32" }, codex: { time: "13:05" }, kimi: { time: "11:47" },
  opencode: { time: "11:20" }, workbuddy: { time: "14:10" }, zcode: { time: "09:58" }, dsh: { time: "08:15" },
};

/** 状态徽标三色（01 定稿淡底彩字：等待批准 红 / 运行中 黄 / 空闲 绿） */
const BADGE_CLS: Record<string, string> = {
  waiting: "bg-[#FEE9E5] text-[#B3261E]",
  running: "bg-[#FBF3D9] text-[#8A6D00]",
  idle: "bg-[#E3F2E7] text-[#1E7B34]",
};

const ibtn =
  "flex h-[27px] w-[27px] items-center justify-center rounded-lg border border-line bg-card text-inkdim hover:text-ink";

const chip = (active: boolean) =>
  `rounded-full border px-[11px] py-1 text-[11.5px] font-medium transition ${
    active ? "border-btnp bg-btnp font-semibold text-btnpt" : "border-line bg-card text-inkdim hover:text-ink"
  }`;

/** 手机看板完整页（P13 对照 docs/design/p13-ref/01-看板-定稿.html 逐要素重做）：
 *  品牌行（兔维斯+版本+本机名）/ 标题行（三 SVG 图标钮）/ 中性 chips（选中近黑）/
 *  白卡彩檐会话卡（檐色=台账识别色，mono 时间戳）/ 淡底彩字状态徽标。卡列表最多 4 张，无内滚。
 *  onOpenDetail 注入通道（B35）：首页复用时接管「点卡」跳 /:lang/demo#d2。 */
export function RemoteBoard({ onOpenDetail }: { onOpenDetail?: () => void }) {
  const { t } = useTranslation();
  const lang = useLang();
  const sessions = useDemo((s) => s.sessions);
  const remote = useDemo((s) => s.remote);
  const setRemote = useDemo((s) => s.setRemote);
  const [sound, setSound] = useState(false);
  const [moon, setMoon] = useState(false);

  const list = Object.values(sessions).filter(
    (s) => !remote.deleted.includes(s.id) && (!remote.filter || s.tool === remote.filter),
  );
  /* 手机屏一次性完整可见——比例锁定屏实测 3 张为安全上限（4 张在窄列会裁边），不提供内滚 */
  const shown = list.slice(0, 3);
  const tools = [...new Set(Object.values(sessions).map((s) => s.tool))];

  return (
    <div className="flex min-h-0 flex-1 flex-col text-ink">
      {/* 1. 品牌行：品牌词按语言（D1，zh 兔维斯 / en Tuvis）+ 版本（动态，同 Hero 徽章源）+ 本机名 */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-extrabold">{brandWord(lang)}</span>
        <span className="font-mono text-[10px] text-inkdim">v{changelog[0]?.version ?? "0.5.6"}</span>
        <span className="ml-auto text-[12px] text-inkdim">MateBook16s</span>
      </div>

      {/* 2. 标题行：会话看板 + 计数 + 三图标钮（历史/声音/夜间，声音与夜间本地 toggle） */}
      <div className="mb-2.5 mt-3 flex items-center gap-1.5">
        <span className="text-base font-bold">{t("demo.phone.boardTitle")}</span>
        <span className="text-[11px] text-inkdim">{t("demo.board.sessions", { count: list.length })}</span>
        <div className="ml-auto flex gap-1.5">
          <button type="button" disabled title={t("demo.na")} aria-label={t("demo.phone.history")} className={ibtn}>
            <HistoryIcon size={13} />
          </button>
          <button type="button" aria-label={t("demo.phone.sound")} aria-pressed={sound}
            onClick={() => setSound(!sound)} className={ibtn}>
            <VolumeIcon size={13} />
          </button>
          <button type="button" aria-label={t("demo.phone.moon")} aria-pressed={moon}
            onClick={() => setMoon(!moon)} className={ibtn}>
            <MoonIcon size={13} />
          </button>
        </div>
      </div>

      {/* 3. 中性筛选 chips：全部 + 会话所涉工具（手机端独立 filter，不与桌面互扰） */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={remote.filter === null} className={chip(remote.filter === null)}
          onClick={() => setRemote({ filter: null })}>
          {t("demo.filter.all")}
        </button>
        {tools.map((tool) => (
          <button key={tool} type="button" aria-pressed={remote.filter === tool} className={chip(remote.filter === tool)}
            onClick={() => setRemote({ filter: tool })}>
            {toolOf(tool).label}
          </button>
        ))}
      </div>

      {/* 4. 白卡彩檐会话卡（檐色 = 台账识别色 --edge-*；最多 4 张，无内滚）。
          P18：多选题激活时 Claude 卡变蓝色题卡——蓝檐 + 蓝色「新问题」徽标（真实产品机制） */}
      <div className="min-h-0 space-y-2.5 overflow-hidden">
        {shown.map((s) => {
          const isQuestion = s.id === "claude" && remote.question !== null && !remote.question.submitted;
          return (
            <div key={s.id}
              style={(isQuestion ? { ...edgeStyle(s.tool), "--ec": "#2563eb" } : edgeStyle(s.tool)) as CSSProperties}
              className="relative cursor-pointer overflow-hidden rounded-[14px] border-[1.5px] border-line bg-card py-2.5 pl-4 pr-3 active:bg-app-accent/30"
              onClick={() => (onOpenDetail ? onOpenDetail() : setRemote({ page: "detail" }))}>
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[var(--ec)]" />
              <div className="flex items-center gap-1.5">
                <ToolIcon tool={s.tool} size={19} />
                <span className="text-[12.5px] font-semibold">{toolOf(s.tool).label}</span>
                <span className="truncate text-[11px] text-inkdim">{s.project}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-inkdim">{PHONE_META[s.id]?.time}</span>
              </div>
              <div className="mt-[5px] truncate text-[13.5px] font-semibold">{t(`demo.phone.title.${s.id}`)}</div>
              <div className="mt-[3px] truncate text-[11.5px] text-inkdim">{s.messages[0]}</div>
              <span className={`mt-2 inline-flex items-center gap-[5px] rounded-full px-[9px] py-[2.5px] text-[10.5px] font-medium ${
                isQuestion ? "bg-[#E8F0FE] text-[#1D4ED8]" : BADGE_CLS[s.state]}`}>
                <span aria-hidden="true" className={`h-[5px] w-[5px] rounded-full bg-current ${isQuestion ? "animate-pulse motion-reduce:animate-none" : ""}`} />
                {isQuestion ? t("demo.pill.question") : t(`demo.pill.${s.state}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
