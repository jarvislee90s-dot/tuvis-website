// W1–W4（主仓《2026-10-22 三终端语言自适应需求说明书》§3）：首访按浏览器语言分流中英文。
// 判定只存在于路由的 / 与 * 两个入口（router.tsx 的 LangEntry）：
// - 合法深链（/zh|en/*）由路由结构天然豁免，不经本模块（W3 深链不覆盖）；
// - tuvis-redirect 深链回放发生在 render 之前的 restoreBootLocation，优先级恒高于分流（W3）；
// - 简繁中文系一律归中文站（§1.3 归流，不做繁体版）。
//
// ⚠️ 存储参数一律可选、并在函数体 try 内才取用全局 localStorage：Chrome/Edge「屏蔽所有
// Cookie」及 opaque origin 环境下，读取 window.localStorage **属性本身**即抛 SecurityError
// （同 bootPath 的防区），默认参数在 try 外求值会绕过防护炸掉全部归流入口——勿改回默认参数写法。

export type SiteLang = "zh" | "en";

/** W2 手动偏好键：仅站内手动切换写入；自动检测结果一律不落盘 */
export const LANG_PREF_KEY = "tuvis-lang-pref";

export function readManualLang(storage?: Pick<Storage, "getItem">): SiteLang | null {
  try {
    const raw = (storage ?? localStorage).getItem(LANG_PREF_KEY);
    // 脏值按无偏好处理（回自动跟随），与白名单语言集严格一致
    return raw === "zh" || raw === "en" ? raw : null;
  } catch {
    // 「屏蔽所有 Cookie」等存储不可用环境：视为无手动偏好
    return null;
  }
}

export function rememberManualLang(lang: SiteLang, storage?: Pick<Storage, "setItem">): void {
  try {
    (storage ?? localStorage).setItem(LANG_PREF_KEY, lang);
  } catch {
    // 存储不可用：本次切换照常生效（路由已换），仅下次访问回到自动跟随
  }
}

/** W1 归流：任一标签 zh 开头（不分大小写，覆盖 zh/zh-CN/zh-TW/zh-HK/zh-SG/zh-Hans/zh-Hant…）→ 中文；其余任何语言（含列表不可得）→ 英文 */
export function detectSiteLang(browserLangs: readonly string[] | undefined): SiteLang {
  return (browserLangs ?? []).some((tag) => tag.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

/** 入口分流：手动偏好优先（W2，有偏好即不做检测），否则浏览器语言检测（W1，结果不落盘） */
export function resolveLangEntry(
  browserLangs: readonly string[] | undefined,
  storage?: Pick<Storage, "getItem">,
): SiteLang {
  return readManualLang(storage) ?? detectSiteLang(browserLangs);
}

/** 组件侧封装：navigator.languages 缺失/为空时回退 navigator.language，再不行按「其余语言」归英文 */
export function resolveLangEntryFromBrowser(
  nav: Partial<Pick<Navigator, "languages" | "language">> = navigator,
): SiteLang {
  const langs = nav.languages?.length ? nav.languages : nav.language ? [nav.language] : undefined;
  return resolveLangEntry(langs);
}
