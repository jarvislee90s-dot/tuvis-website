import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router";
import { applyLang, LANGS, type Lang } from "@/i18n";
import { ScrollManager } from "../ScrollManager";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

export function LangLayout() {
  const { lang } = useParams();
  useEffect(() => applyLang(lang as Lang), [lang]);
  if (!LANGS.includes(lang as Lang)) return <Navigate to="/zh" replace />;
  return (
    <div className="min-h-screen">
      <ScrollManager />
      <TopBar />
      <Outlet />
      <Footer />
    </div>
  );
}
