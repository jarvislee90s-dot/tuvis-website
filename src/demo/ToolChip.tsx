import { useTranslation } from "react-i18next";
import { toolOf } from "./tools";
import { ToolIcon } from "./ToolIcon";

/** tool=null 即「全部」chip（无图标，AppBoard chips 行首位） */
export function ToolChip({ tool, active, onClick }: { tool: string | null; active: boolean; onClick: () => void }) {
  const { t } = useTranslation();
  const meta = tool === null ? null : toolOf(tool);
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] transition ${
        active ? "border-app-btnp bg-app-btnp font-semibold text-white"
               : "border-app-line bg-app-bg font-medium text-app-mut hover:bg-app-accent/50 hover:text-app-ink"}`}>
      {meta && <ToolIcon tool={meta.key} size={14} />}
      {meta ? meta.label : t("demo.filter.all")}
    </button>
  );
}
