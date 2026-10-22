import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router";
import { applyLang, LANGS, type Lang } from "@/i18n";
import { resolveLangEntryFromBrowser } from "@/utils/langRedirect";
import { ScrollManager } from "../ScrollManager";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

export function LangLayout() {
  const { lang } = useParams();
  useEffect(() => applyLang(lang as Lang), [lang]);
  // 非法 lang 段（/fr、/nonexistent 等单段未知路径落此处）：原先硬编码回 /zh，
  // 现按「手动偏好 → 浏览器语言」归流（W1/W2），与 / 与 * 入口的分流语义保持一致
  if (!LANGS.includes(lang as Lang)) return <Navigate to={`/${resolveLangEntryFromBrowser()}`} replace />;
  return (
    <div className="min-h-screen">
      <ScrollManager />
      <TopBar />
      <Outlet />
      <Footer />
    </div>
  );
}
