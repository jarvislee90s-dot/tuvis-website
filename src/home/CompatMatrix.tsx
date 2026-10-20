import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { ToolIcon } from "@/demo/ToolIcon";
import { toolOf } from "@/demo/tools";
import cap from "@/content/capabilities.json";

/** 兼容矩阵板块（T40）：数据 = 同步产物 content/capabilities.json 单一源（列序/行组随 JSON 自动跟随）。
 *  文字态单元格（决策 8）：✓/✓/🧪/✕ + 文案；行级 note 走单元格 title/aria-label 悬浮，取值规则同 nameEn；
 *  Codex 列头 † 脚注（CLI 支持完整远程 / APP 仅查看）。
 *  *En 命名数据（组名/行名 nameEn、备注 noteEn）同一模式：JSON 数据源自带英译时优先、单向回退原中文；
 *  选择与界面语言无关（zh 页遇英译同样显示英文），语言相关文案一律走 i18n 键（品牌词例外：走 Brand/brandName）。 */
const LEGEND = ["yes", "partial", "experimental", "no"] as const;

const LEGEND_DOT: Record<string, string> = {
  yes: "bg-green-500",
  partial: "bg-amber-500",
  experimental: "bg-violet-500",
  no: "bg-zinc-400",
};

const CELL: Record<string, { mark: string; key: string; cls: string }> = {
  yes: { mark: "✓", key: "matrix.legend.yes", cls: "text-[11px] font-medium text-green-700" },
  partial: { mark: "✓", key: "matrix.legend.partial", cls: "text-[11px] font-medium text-amber-700" },
  experimental: { mark: "🧪", key: "matrix.legend.experimental", cls: "text-[11px] font-medium text-violet-700" },
  no: { mark: "✕", key: "matrix.legend.no", cls: "text-[11px] text-inkdim" },
};

export function CompatMatrix() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <SectionTitle tKey="matrix.title" />
        <p className="-mt-6 mb-8 text-center text-xs text-inkdim">{t("matrix.desc")}</p>
        {/* 图例行：四态图例（左）+ 更新日期（右） */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
          {LEGEND.map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${LEGEND_DOT[k]}`} />
              {t(`matrix.legend.${k}`)}
            </span>
          ))}
          <span className="ml-auto">{t("matrix.updated", { date: cap.updated })}</span>
        </div>
        {/* 三组卡：桌面提醒 / Skill·MCP 管理 / 远程操控 */}
        <div className="mt-4 space-y-4">
          {cap.groups.map((group) => (
            <div key={group.key} className="rounded-[14px] border border-line bg-card p-5">
              <h3 className="text-sm font-semibold">{group.nameEn ?? group.name}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] table-fixed border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 w-[22%] bg-card py-2 text-left font-medium text-inkdim">{t("matrix.colCap")}</th>
                      {cap.tools.map((tool) => (
                        <th key={tool} className="py-2 text-center font-medium"
                          title={tool === "codex" ? t("matrix.codexNote") : undefined}>
                          <span className="flex flex-col items-center gap-1">
                            <ToolIcon tool={tool} size={14} />
                            <span className="text-[10px]">
                              {toolOf(tool).label}
                              {tool === "codex" && <sup className="text-[9px] text-hud">†</sup>}
                            </span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => {
                      // noteEn 优先、单向回退原中文（与 nameEn 同模式，语言无关）；|| 兼防空串致 title 空串/aria 分叉
                      const note = row.noteEn || row.note;
                      return (
                        <tr key={row.key} className="border-t border-line">
                          <td className="sticky left-0 z-10 bg-card py-2 pr-3 text-inkdim">{row.nameEn ?? row.name}</td>
                          {cap.tools.map((tool) => {
                            const state = CELL[row.support[tool]] ?? CELL.no;
                            const label = t(state.key);
                            return (
                              <td key={tool} className="py-2 text-center" title={note}
                                aria-label={note ? `${label} · ${note}` : undefined}>
                                <span className={state.cls}>{state.mark} {label}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        {/* 尾注区：† 脚注 + 数据源声明 */}
        <div className="mt-4 space-y-1 text-[11px] text-inkdim">
          <p>{t("matrix.codexNote")}</p>
          <p>{t("matrix.source")}</p>
        </div>
      </section>
    </Reveal>
  );
}
