import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-line py-8 text-sm text-inkdim">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5">
        <span>🥕 {t("footer.slogan")} · © 2026 Tuvis</span>
        <span className="flex items-center gap-4">
          <a href="https://github.com/jarvislee90s-dot/tuvis" target="_blank" rel="noopener noreferrer" className="hover:text-ink">GitHub</a>
          <span>{t("footer.right")}</span>
          <LanguageSwitcher />
        </span>
      </div>
    </footer>
  );
}
