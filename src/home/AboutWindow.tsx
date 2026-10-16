import { useState } from "react";
import { Link } from "react-router";
import { brandName, brandWord } from "@/components/Brand";
import { useLang } from "@/i18n/useLang";
import { WindowFrame } from "@/demo/WindowFrame";
import changelog from "@/content/changelog.json";

/** 「关于」仿真窗（P14，对照用户提供的 CC Switch 关于页截图，内容换兔维斯语境）：
 *  应用卡（logo + 名称 + 当前版本 + 「更新到 v{LATEST}」）→ 检测行 → 官方网站/更新日志/近期更新 链接行 →
 *  ★ 求 Star 橙底横幅（去点 Star + × 可关，关闭仅本视图）。
 *  批次 3 COPY 模式（B3-T7；模板说明见 copy.parity.test.ts 头注释）：整窗文案收进 COPY.{zh,en}，
 *  窗标题也归本文件的 COPY（WindowFrame 只透传 title）；品牌裸词走 {{brand}} 占位（B3-T1）；
 *  品牌位取品牌单值 brandName（zh「兔维斯 Tuvis」/ en 仅「Tuvis」），M1 红线锚点 = data-testid="about-brand"。 */
const REPO = "https://github.com/jarvislee90s-dot/tuvis";
const LATEST_URL = `${REPO}/releases/latest`;
const LATEST = `v${changelog[0]?.version ?? "0.0.0"}`;
/** 演示用的「当前版本」= 最新 release 的前一个版本号（仅一条历史时与最新相同） */
const PREV = `v${changelog[1]?.version ?? changelog[0]?.version ?? "0.0.0"}`;

const linkBtn =
  "flex items-center gap-1.5 rounded-lg border border-app-line bg-app-bg px-3 py-1.5 text-xs font-medium text-app-ink transition hover:bg-app-accent/50";

/** 批次 3 COPY 模式：zh 逐字保留现状（红线），en 为产品英文版 UI 口径；en 以 `: typeof ZH` 标注互校 */
const ZH = {
  windowTitle: "关于",
  versionLabel: "版本",
  updateTo: "更新到",
  newVersion: "检测到新版本：",
  linkWebsite: "官方网站",
  linkChangelog: "更新日志",
  linkRecent: "近期更新",
  /** 求 Star 横幅整句（{{brand}} = brandWord(lang)，B3-T1 品牌裸词） */
  starText: "如果{{brand}}帮到了你，请在 GitHub 点个 Star，这对我们意义重大",
  starCta: "去点 Star",
  starClose: "关闭提醒",
};
const EN: typeof ZH = {
  windowTitle: "About",
  versionLabel: "Version",
  updateTo: "Update to",
  /** 尾随空格：JSX 里 {newVersion} 直连版本号 <span>，en 须空格分词（zh 的「：」直连版本号是现状） */
  newVersion: "New version detected: ",
  linkWebsite: "Website",
  linkChangelog: "Changelog",
  linkRecent: "Recent updates",
  starText: "If {{brand}} has helped you, a Star on GitHub would mean a lot to us",
  starCta: "Star on GitHub",
  starClose: "Dismiss",
};
export const COPY = { zh: ZH, en: EN } as const;

export function AboutWindow({ className = "" }: { className?: string }) {
  const lang = useLang();
  const t = COPY[lang];
  const [starOpen, setStarOpen] = useState(true);
  return (
    <WindowFrame title={t.windowTitle} className={className}>
      <div className="space-y-3 p-4">
        {/* ① 应用卡：logo + 名称/版本 + 更新按钮 */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-app-line bg-app-bg p-3">
          <img src={`${import.meta.env.BASE_URL}img/appicon-dark.png`} alt="" className="h-9 w-9 rounded-xl" />
          <div className="min-w-0">
            {/* M1 品牌红线锚点：/en 恰「Tuvis」、/zh 恰「兔维斯 Tuvis」 */}
            <div className="text-sm font-bold text-app-ink" data-testid="about-brand">{brandName(lang)}</div>
            <div className="font-mono text-[11px] text-app-mut">{t.versionLabel} {PREV}</div>
          </div>
          <a href={LATEST_URL} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-app-btnp px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
            <span aria-hidden>⬇</span> {t.updateTo} {LATEST}
          </a>
        </div>
        {/* ② 检测行 */}
        <div className="rounded-lg border border-app-line bg-app-bg px-3 py-2 text-xs text-app-ink">
          {t.newVersion}<span className="font-mono font-semibold">{LATEST}</span>
        </div>
        {/* ③ 链接行 */}
        <div className="flex flex-wrap gap-2">
          <a href={REPO} target="_blank" rel="noopener noreferrer" className={linkBtn}>
            <span aria-hidden>🌐</span> {t.linkWebsite}
          </a>
          <Link to={`/${lang}/changelog`} className={linkBtn}>
            <span aria-hidden>↗</span> {t.linkChangelog}
          </Link>
          <a href={`${REPO}/releases`} target="_blank" rel="noopener noreferrer" className={linkBtn}>
            <span aria-hidden>⟳</span> {t.linkRecent}
          </a>
        </div>
        {/* ④ 求 Star 横幅（CC Switch 同款：★ 文案 + 去点 Star + ×） */}
        {starOpen && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
            <span aria-hidden className="text-base">⭐</span>
            <span className="min-w-0 flex-1 text-xs font-medium text-app-ink">
              {t.starText.replace("{{brand}}", brandWord(lang))}
            </span>
            <a href={REPO} target="_blank" rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-app-line bg-app-card px-3 py-1.5 text-xs font-semibold text-app-ink shadow-sm transition hover:bg-app-accent/50">
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              {t.starCta}
            </a>
            <button type="button" aria-label={t.starClose} onClick={() => setStarOpen(false)}
              className="shrink-0 rounded p-1 text-app-mut transition hover:bg-app-accent/50 hover:text-app-ink">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </WindowFrame>
  );
}
