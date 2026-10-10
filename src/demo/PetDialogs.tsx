import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CloseIcon, ExternalLinkIcon, VolumeIcon } from "../components/Icons";
import { frameStyle, type PetId } from "./petAnimations";

/** 切换宠物网格条目：只收真实素材——内置贝贝/Starry Dew 用真精灵表；petdex 导入条目用 emoji 占位（不做 CSS 换色假宠物，P18 用户裁决） */
export type SwitchPetEntry = {
  id: string;
  label: string;
  sprite?: PetId;       // 真实精灵表条目
  emoji?: string;       // 导入条目占位（无真素材，不伪造精灵）
  version: string;      // 徽标版本号（v1/v2，硬编码）
  builtin?: boolean;    // 内置徽标
};

/** 弹窗壳（T44，两弹窗共用）：受控 open/onClose；背景点击 / Esc 关闭；打开时聚焦容器 */
function DialogShell({ open, onClose, label, children }: {
  open: boolean; onClose: () => void; label: string; children: ReactNode;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onPointerDown={onClose} aria-hidden="true" />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label}
        className="absolute left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-app-line bg-app-bg p-4 shadow-pop outline-none">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-app-ink">{label}</h3>
          <button type="button" onClick={onClose} aria-label={t("usage.win.close")}
            className="rounded p-1 text-app-mut transition hover:bg-app-accent/50 hover:text-app-ink">
            <CloseIcon size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** 自绘字幕（CC）小图标 */
function CcIcon() {
  return (
    <span aria-hidden="true"
      className="flex h-[13px] w-[17px] items-center justify-center rounded-[3px] border border-current text-[7px] font-bold leading-none">
      CC
    </span>
  );
}

/** 切换宠物弹窗（对照 pet-switch-grid.png）：2 列网格卡，当前卡 ring 高亮，点卡切换并关窗 */
export function SwitchPetDialog({ open, onClose, entries, activeId, onPick }: {
  open: boolean;
  onClose: () => void;
  entries: SwitchPetEntry[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <DialogShell open={open} onClose={onClose} label={t("pet.menu.switch")}>
      <div className="grid grid-cols-2 gap-3">
        {entries.map((e) => {
          const current = e.id === activeId;
          return (
            <button key={e.id} type="button" onClick={() => { onPick(e.id); onClose(); }} aria-pressed={current}
              className={`rounded-xl border p-2.5 text-left transition hover:bg-app-accent/50 ${
                current ? "border-app-line bg-app-accent/30 ring-2 ring-app-btnp" : "border-app-line bg-app-card"}`}>
              {e.emoji ? (
                <span aria-hidden="true"
                  className="flex h-[104px] items-center justify-center rounded-lg bg-app-accent/40 text-5xl">
                  {e.emoji}
                </span>
              ) : (
                <span className="overflow-hidden rounded-lg" aria-hidden="true">
                  <span className="block" style={frameStyle("idle", 0, 0.5, e.sprite!)} />
                </span>
              )}
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-app-ink">{e.label}</span>
                {e.builtin && (
                  <span className="rounded-full border border-app-line px-1.5 text-[9px] text-app-mut">
                    {t("pet.badge.builtin")}
                  </span>
                )}
                <span className="rounded-full border border-app-line px-1.5 text-[9px] text-app-mut">{e.version}</span>
              </span>
              <span className="mt-1.5 flex items-center gap-2 text-app-mut">
                <span title={t("pet.behavior.voice")}><VolumeIcon size={13} /></span>
                <span title={t("pet.subtitle")}><CcIcon /></span>
              </span>
            </button>
          );
        })}
      </div>
    </DialogShell>
  );
}

type ImportTab = "codex" | "folder" | "petdex";

/** 导入宠物弹窗（对照 pet-import-dialog.png）：三 tab，petdex 在线导入默认选中，浏览钮为真实外链 */
export function ImportPetDialog({ open, onClose, onImported }: {
  open: boolean;
  onClose: () => void;
  /** 模拟导入完成（✓ 出现时）回调——把新条目加入切换列表（T44 任务口径） */
  onImported: () => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ImportTab>("petdex");
  const [link, setLink] = useState("");
  const [phase, setPhase] = useState<"idle" | "importing" | "done">("idle");

  const tabs: { id: ImportTab; label: string }[] = [
    { id: "codex", label: t("pet.import.codex") },
    { id: "folder", label: t("pet.import.folder") },
    { id: "petdex", label: t("pet.import.petdex") },
  ];

  /** 下载并暂存（纯模拟，不解析真链接）：pulse 800ms → ✓ 已导入 disabled 态 */
  function download() {
    if (!link.trim() || phase !== "idle") return;
    setPhase("importing");
    window.setTimeout(() => {
      setPhase("done");
      onImported();
    }, 800);
  }

  return (
    <DialogShell open={open} onClose={onClose} label={t("pet.import.title")}>
      <div className="flex border-b border-app-line">
        {tabs.map((tb) => (
          <button key={tb.id} type="button" onClick={() => setTab(tb.id)} aria-pressed={tab === tb.id}
            className={`px-3 pb-1.5 text-xs transition ${
              tab === tb.id ? "border-b-2 border-app-btnp font-semibold text-app-ink" : "text-app-mut hover:text-app-ink"}`}>
            {tb.label}
          </button>
        ))}
      </div>
      {tab !== "petdex" ? (
        <div className="mt-3 rounded-lg border border-dashed border-app-line p-4 text-center text-xs text-app-mut"
          title={t("demo.na")}>
          {t("demo.na")}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs leading-relaxed text-app-mut">{t("pet.import.hint")}</p>
          <div className="mt-2 flex items-center gap-2">
            <input value={link}
              onChange={(e) => { setLink(e.target.value); if (phase === "done") setPhase("idle"); }}
              placeholder={t("pet.import.placeholder")} aria-label={t("pet.import.placeholder")}
              className="min-w-0 flex-1 rounded-lg border border-app-line bg-app-card px-3 py-1.5 text-xs text-app-ink placeholder:text-app-mut focus:outline-none focus:ring-1 focus:ring-app-btnp" />
            <a href="https://petdex.dev/" target="_blank" rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-app-line px-3 py-1.5 text-xs font-medium text-app-ink transition hover:bg-app-accent/50">
              <ExternalLinkIcon size={12} />
              {t("pet.import.browse")}
            </a>
          </div>
          <button type="button" onClick={download} disabled={!link.trim() || phase !== "idle"}
            className={`mt-3 rounded-lg bg-app-btnp px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              phase === "importing" ? "animate-pulse" : ""}`}>
            {phase === "done" ? `✓ ${t("pet.repo.imported")}` : t("pet.import.download")}
          </button>
        </div>
      )}
    </DialogShell>
  );
}
