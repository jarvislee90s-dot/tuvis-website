import { useLocation, useNavigate, useParams } from "react-router";
import { LANGS, type Lang } from "@/i18n";

export function LanguageSwitcher() {
  const { lang } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const cur = (LANGS.includes(lang as Lang) ? lang : "zh") as Lang;
  const other: Lang = cur === "zh" ? "en" : "zh";
  return (
    <button
      aria-label={`switch language to ${other === "zh" ? "Chinese (ZH)" : "English (EN)"}`}
      className="rounded-lg border border-line px-2 py-1 text-xs uppercase hover:opacity-70"
      onClick={() => nav(loc.pathname.replace(`/${cur}`, `/${other}`) + loc.search)}
    >
      {other === "zh" ? "ZH" : "EN"}
    </button>
  );
}
