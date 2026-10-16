import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { useLang } from "@/i18n/useLang";
import { useDemo } from "../store";

/** 文件预览整屏页（P18 对照用户四帧真机截图：① 总列表 ② 代码源码 ③ 文字渲染 ④ 图片）：
 *  顶栏「文件」紫 pill + 分屏/全屏/×；总列表 = 追溯范围/文件来源/文件类型下拉 + 按文件名搜索 +
 *  行（文件名 + 来源徽标 + 路径 + 时间）+ 可预览说明；点行进详情——md/html 双视图（源码|渲染）、
 *  图片直显。文件名/路径为语言无关常量（tuvis 语境）；文件内文取本文件 COPY（zh/en，B3-T7）。 */

type FileKind = "code" | "md" | "image";
type FileSource = "write" | "read" | "mine";
interface FileMeta { name: string; kind: FileKind; source: FileSource; path: string; minutes: number }

const FILES: FileMeta[] = [
  { name: "remote-card.html", kind: "code", source: "write", path: "E:/LLMproject/Github/tuvis-app/docs/remote-card.html", minutes: 1 },
  { name: "approve-notes.md", kind: "md", source: "write", path: "E:/LLMproject/Github/tuvis-app/docs/approve-notes.md", minutes: 11 },
  { name: "prompt-attachment.md", kind: "md", source: "mine", path: "C:/Users/bunny/.tuvis/artifacts/prompt-attachment.md", minutes: 28 },
  { name: "ledger-trend.ts", kind: "code", source: "write", path: "E:/LLMproject/Github/tuvis-app/src/tray/ledger-trend.ts", minutes: 37 },
  { name: "board-cover.png", kind: "image", source: "read", path: "E:/LLMproject/Github/tuvis-app/public/img/board-cover.png", minutes: 39 },
  { name: "tuvis-icon.png", kind: "image", source: "write", path: "E:/LLMproject/Github/tuvis-app/public/img/tuvis-icon.png", minutes: 39 },
];

/** 批次 3 COPY 模式（B3-T7；模板说明见 copy.parity.test.ts 头注释）：
 *  窗体 chrome（筛选/徽标/说明/视图切换）走既有 i18n 键（demo.fp.*，双语已在册），
 *  本 COPY 收仿真文件内文——源码帧 / 渲染帧 / md 渲染态三段；
 *  en 以 `: typeof ZH` 标注互校；zh 逐字保留现状（红线），en 为产品英文版 UI 口径。 */
const ZH = {
  /** 源码帧 chip（remote-card.html 的 span.chip） */
  codeChip: "VideoToDoc-skills · 三个协同 Skill",
  /** 渲染帧 chip（同文件渲染态；与源码帧的差异为现状，不顺手统一） */
  renderChip: "Tuvis-skills · 三个协同 Skill",
  /** 大标题三段：h1 起句 / <br> 后承接句（尾随空格接强调段）/ <em> 强调段 */
  h1Lead: "一段 1 小时视频",
  h1Link: "变成 ",
  h1Em: "7 章图文讲义",
  /** 副行（p.sub） */
  subline: "下载 → 转录 → 截图去重 → 图文对齐",
  /** 渲染帧脚注（渲染态独有，源码里没有这一行） */
  footNote: "本地批跑 · 数据不出机 · 全程零付费接口",
  /** approve-notes.md 渲染态正文（源码视图显示同一份原文） */
  md: `## 远程审批「有效提问」清单（目标 8 条 · 候选 11 条）

- **审批卡文案**：命令全文 \`mono\` 展示，允许 / 拒绝双钮，全程留痕
- **排队机制**：未读消息在输入区上方挂 \`⏳ 已排队\` chip，不占对话流
- **状态灯联动**：批准后看板红转绿，托盘三态同步换图
- **文件面板**：\`md/html\` 支持渲染切换，图片 ≤5MB 直显

**发布口径**：文案经用户过目后由助手代发（每帖一条，回车发送）`,
};
const EN: typeof ZH = {
  codeChip: "VideoToDoc-skills · three Skills working together",
  renderChip: "Tuvis-skills · three Skills working together",
  h1Lead: "A one-hour video",
  h1Link: "becomes ",
  h1Em: "a 7-chapter illustrated guide",
  subline: "Download → Transcribe → Dedupe screenshots → Align text to images",
  footNote: "Runs locally · your data never leaves the machine · zero paid APIs",
  md: `## Remote approval checklist for a "good question" (target 8 · candidates 11)

- **Approval card copy**: the full command in \`mono\`, Allow / Deny buttons, every move on the record
- **Queueing**: unread messages park as a \`⏳ Queued\` chip above the input row, clear of the thread
- **Status lights**: on approval the board flips red to green and the tray icon follows all three states
- **File panel**: \`md/html\` toggles between source and rendered, images up to 5MB show inline

**Release rule**: the user reviews the copy first, then the assistant posts it (one message each, press Enter to send)`,
};
export const COPY = { zh: ZH, en: EN } as const;

/** 代码帧内容（remote-card.html 头部，手工着色 JSX——真实感优先；内文取 COPY，zh/en 传当前语言表） */
function CodeLines({ copy: t }: { copy: typeof ZH }): ReactNode {
  const T = ({ c }: { c: string }) => <span className="text-[#0550AE]">{c}</span>;      // 标签名
  const A = ({ c }: { c: string }) => <span className="text-[#953800]">{c}</span>;      // 属性
  const S = ({ c }: { c: string }) => <span className="text-[#0A7C5A]">{c}</span>;      // 字符串
  return (
    <div className="whitespace-pre font-mono text-[10.5px] leading-relaxed">
      <div>{"<"}<T c="!DOCTYPE" /> <T c="html" />{">"}</div>
      <div>{"<"}<T c="html" /> <A c="lang" />={<S c='"zh-CN"' />}{">"}</div>
      <div>{"<"}<T c="head" />{">"}</div>
      <div>{"  "}{"<"}<T c="meta" /> <A c="charset" />={<S c='"utf-8"' />}{">"}</div>
      <div>{"  "}{"<"}<T c="style" />{">"}</div>
      <div>{"    * {{ margin:0; padding:0; box-sizing:border-box; }}"}</div>
      <div>{"    body {{ background:#f7f8fa; display:flex; align-items:center; }}"}</div>
      <div>{"    .chip {{ font-size:17px; font-weight:600; color:"}<S c="#0f9b74" />{"; }}"}</div>
      <div>{"    h1  {{ font-size:47px; line-height:1.26; color:"}<S c="#1b1f24" />{"; }}"}</div>
      <div>{"    .sub {{ font-size:21px; color:"}<S c="#5a6472" />{"; margin-top:20px; }}"}</div>
      <div>{"  "}{"</"}<T c="style" />{">"}</div>
      <div>{"</"}<T c="head" />{">"}</div>
      <div>{"<"}<T c="body" />{">"}</div>
      <div>{"  "}{"<"}<T c="span" /> <A c="class" />={<S c='"chip"' />}{">"}{t.codeChip}{"</"}<T c="span" />{">"}</div>
      <div>{"  "}{"<"}<T c="h1" />{">"}{t.h1Lead}{"<"}<T c="br" />{">"}{t.h1Link}<T c="em" />{t.h1Em}{"</"}<T c="em" />{"</"}<T c="h1" />{">"}</div>
      <div>{"  "}{"<"}<T c="p" /> <A c="class" />={<S c='"sub"' />}{">"}{t.subline}{"</"}<T c="p" />{">"}</div>
      <div>{"</"}<T c="body" />{">"}</div>
      <div>{"</"}<T c="html" />{">"}</div>
    </div>
  );
}

/** 图片帧：用站点真素材（演示语境的封面图） */
const IMAGE_SRC = `${import.meta.env.BASE_URL}img/hero-poster.png`;

const badge = "rounded px-1.5 py-px text-[9.5px]";

export function FilePreview() {
  const { t } = useTranslation();
  const lang = useLang();
  /* 双机制说明：i18n 的 t 管窗体 chrome（既有多语键），COPY 管仿真文件内文（B3-T7） */
  const copy = COPY[lang];
  const setRemote = useDemo((s) => s.setRemote);
  const [openName, setOpenName] = useState<string | null>(null);
  const [view, setView] = useState<"src" | "render">("render");
  const [srcFilter, setSrcFilter] = useState<"all" | FileSource>("all");
  const [query, setQuery] = useState("");

  const openFile = FILES.find((f) => f.name === openName) ?? null;
  const q = query.trim().toLowerCase();
  const list = FILES.filter(
    (f) => (srcFilter === "all" || f.source === srcFilter) && (q === "" || f.name.toLowerCase().includes(q)),
  );
  const timeText = (m: number) => `${m} ${t("demo.fp.min")}`;
  const selectCls = "rounded-md border border-app-line bg-app-card px-1.5 py-1 text-[10.5px] text-app-ink outline-none";

  return (
    <div className="flex min-h-0 flex-1 flex-col text-ink">
      {/* 顶栏：「文件」紫 pill + 分屏/全屏（装饰）+ × 关闭回详情 */}
      <div className="flex items-center gap-2 pb-2">
        <span className="rounded-full bg-violet-600 px-3 py-1 text-[11.5px] font-semibold text-white">📄 {t("demo.fp.pill")}</span>
        <span className="ml-auto flex items-center gap-1 text-app-mut">
          <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded border border-app-line text-[10px]">▭</span>
          <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded border border-app-line text-[10px]">⛶</span>
          <button type="button" aria-label={t("demo.remote.close")} onClick={() => setRemote({ files: false })}
            className="flex h-6 w-6 items-center justify-center rounded text-app-mut hover:text-app-ink">✕</button>
        </span>
      </div>

      {openFile === null ? (
        <>
          {/* ① 总界面：三下拉筛选 + 搜索 */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1.5 text-[10.5px] text-app-mut">
            <span>{t("demo.fp.trace")}</span>
            <select className={selectCls} aria-label={t("demo.fp.trace")} defaultValue="200">
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
            <span>{t("demo.fp.source")}</span>
            <select className={selectCls} aria-label={t("demo.fp.source")} value={srcFilter}
              onChange={(e) => setSrcFilter(e.target.value as typeof srcFilter)}>
              <option value="all">{t("demo.filter.all")}</option>
              <option value="mine">{t("demo.fp.badge.mine")}</option>
              <option value="read">{t("demo.fp.badge.read")}</option>
              <option value="write">{t("demo.fp.badge.write")}</option>
            </select>
            <span>{t("demo.fp.type")}</span>
            <select className={selectCls} aria-label={t("demo.fp.type")} defaultValue="all">
              <option value="all">{t("demo.filter.all")}</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 pb-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t("demo.fp.searchPH")} aria-label={t("demo.fp.searchPH")}
              className="min-w-0 flex-1 rounded-md border border-app-line bg-app-card px-2 py-1 text-[11px] outline-none placeholder:text-app-mut" />
            <span className="rounded-md border border-app-line bg-app-card px-2 py-1 text-[11px] text-app-ink">{t("demo.fp.search")}</span>
          </div>
          {/* 文件列表：图标 + 名 + 来源徽标 + 路径 + 时间；点行进详情帧 */}
          <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
            {list.map((f) => (
              <button key={f.name} type="button" onClick={() => { setOpenName(f.name); setView(f.kind === "md" ? "render" : "src"); }}
                className="block w-full rounded-lg px-1.5 py-1.5 text-left transition hover:bg-app-accent/40">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="text-[11px]">{f.kind === "image" ? "🖼" : "📄"}</span>
                  <span className="truncate text-[12px] font-semibold">{f.name}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className={`${badge} ${f.source === "mine" ? "bg-violet-100 text-violet-700" : f.source === "read" ? "bg-app-accent text-app-mut" : "bg-app-accent text-app-ink"}`}>
                    {t(`demo.fp.badge.${f.source}`)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[10px] text-app-mut">{f.path}</span>
                  <span className="shrink-0 text-[10px] text-app-mut">{timeText(f.minutes)}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="shrink-0 pt-1.5 text-[9.5px] leading-relaxed text-app-mut">{t("demo.fp.note")}</p>
        </>
      ) : (
        <>
          {/* ②③④ 详情帧：返回 + 文件名 +（md/html）源码|渲染 切换 */}
          <div className="flex items-center gap-2 pb-2">
            <button type="button" aria-label={t("demo.phone.back")} onClick={() => setOpenName(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-app-line bg-app-card text-app-mut hover:text-app-ink">←</button>
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{openFile.name}</span>
            {openFile.kind !== "image" && (
              <span className="flex shrink-0 overflow-hidden rounded-full border border-app-line text-[10.5px]">
                {(["src", "render"] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
                    className={`px-2.5 py-1 transition ${view === v ? "bg-app-btnp font-semibold text-white" : "bg-app-card text-app-mut hover:text-app-ink"}`}>
                    {t(v === "src" ? "demo.fp.src" : "demo.fp.render")}
                  </button>
                ))}
              </span>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-app-line bg-app-card p-2">
            {openFile.kind === "image" && (
              <div className="flex h-full items-start justify-center overflow-hidden rounded bg-app-accent/40 p-2">
                <img src={IMAGE_SRC} alt={openFile.name} className="max-h-full max-w-full rounded object-contain" />
              </div>
            )}
            {openFile.kind === "code" && (view === "src"
              ? <div className="h-full overflow-hidden"><CodeLines copy={copy} /></div>
              : <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg bg-[#f7f8fa] p-4 text-center">
                  <span className="rounded-full bg-[#e4f8f0] px-3 py-1 text-[10px] font-semibold text-[#0f9b74]">{copy.renderChip}</span>
                  <span className="text-[15px] font-bold leading-snug">{copy.h1Lead}<br />{copy.h1Link}{copy.h1Em}</span>
                  <span className="text-[10.5px] text-app-mut">{copy.subline}</span>
                  <span className="text-[9.5px] text-app-mut">{copy.footNote}</span>
                </div>)}
            {openFile.kind === "md" && (view === "render"
              ? <div className="h-full overflow-hidden text-[11px] leading-relaxed [&_h2]:mb-1 [&_h2]:text-[13px] [&_h2]:font-bold [&_li]:my-0.5 [&_p]:my-1 [&_code]:rounded [&_code]:bg-app-accent [&_code]:px-0.5">
                  <ReactMarkdown>{copy.md}</ReactMarkdown>
                </div>
              : <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-app-ink">{copy.md}</pre>)}
          </div>
        </>
      )}
    </div>
  );
}
