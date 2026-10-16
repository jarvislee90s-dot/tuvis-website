import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Brand } from "@/components/Brand";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/i18n/useLang";

/** 导航项（P13：首页/产品形态/功能/演示/文档/更新日志 + EN；GitHub 入口在 Hero/Footer） */
export function TopBar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // N2：链接语言段统一走归一产物（原 `lang ?? "zh"` 裸参会把 /fr 等非法值拼进链接；LangLayout 重定向掩盖了它）
  const lang = useLang();
  const links = [
    { to: `/${lang}`, key: "nav.home" },
    { to: `/${lang}#product`, key: "nav.product" },
    { to: `/${lang}#features`, key: "nav.features" },
    { to: "demo", key: "nav.demo" },
    { to: "docs", key: "nav.docs" },
    { to: "changelog", key: "nav.changelog" },
  ];
  const linkCls = "flex h-14 min-w-6 items-center justify-center px-1 font-medium hover:text-ink";
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link to={`/${lang}`} className="flex items-center gap-2 font-bold">
          <img src={`${import.meta.env.BASE_URL}img/appicon-dark.png`} alt="Tuvis" className="h-7 w-7 rounded-lg" />
          <Brand />
        </Link>
        {/* 桌面导航（P13 字号加大 text-sm → text-base） */}
        <div className="hidden items-center gap-6 text-base text-inkdim md:flex">
          {links.map((l) => (
            <Link key={l.key} to={l.to} className={linkCls}>{t(l.key)}</Link>
          ))}
          <LanguageSwitcher />
        </div>
        {/* 移动端折叠菜单（P13：导航项增多后 375px 必溢出，补 md 以下折叠） */}
        <button type="button" aria-label={t("nav.menu")} aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-inkdim md:hidden">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" aria-hidden="true">
            {open ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-surface px-5 pb-3 md:hidden">
          <div className="flex flex-col text-base text-inkdim">
            {links.map((l) => (
              <Link key={l.key} to={l.to} onClick={() => setOpen(false)} className="flex h-11 items-center font-medium hover:text-ink">
                {t(l.key)}
              </Link>
            ))}
            <div className="flex h-11 items-center"><LanguageSwitcher /></div>
          </div>
        </div>
      )}
    </nav>
  );
}
