import { useLocation, useNavigate, useParams } from "react-router";
import { LANGS, type Lang } from "@/i18n";

export function LanguageSwitcher() {
  const { lang } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  // 严格按 LANGS 白名单判定（按钮目标语言需与已注册语言严格一致，en-US 之类视为非法回退 zh）——
  // 与 useLang 的 en* 前缀归一语义不同，刻意不合并
  const cur = (LANGS.includes(lang as Lang) ? lang : "zh") as Lang;
  const other: Lang = cur === "zh" ? "en" : "zh";
  return (
    /* D8 裁决：可见 ZH/EN + aria 英文全名，故意不用 i18n 键（/en 零 CJK） */
    <button
      aria-label={`switch language to ${other === "zh" ? "Chinese (ZH)" : "English (EN)"}`}
      className="rounded-lg border border-line px-2 py-1 text-xs uppercase hover:opacity-70"
      onClick={() => nav(loc.pathname.replace(`/${cur}`, `/${other}`) + loc.search)}
    >
      {other === "zh" ? "ZH" : "EN"}
    </button>
  );
}
