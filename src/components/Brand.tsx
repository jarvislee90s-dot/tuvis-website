import type { Lang } from "@/i18n";
import { useDemoLang } from "@/demo/useDemoLang";

/** 品牌词单值（D1 裁决，批次 3 后续 demo COPY 化会复用）：zh 页「兔维斯 Tuvis」、en 页「Tuvis」。
 *  品牌词是按语言切换的单值数据，不走 i18n 键。 */
export function brandName(lang: Lang): string {
  return lang === "zh" ? "兔维斯 Tuvis" : "Tuvis";
}

/** 品牌名（D1）：zh「兔维斯 Tuvis」（Tuvis 次级色，与 TopBar 现状一致）、en 仅「Tuvis」。
 *  读 useDemoLang（须在 /:lang 路由树内渲染）；非 <a> 元素，可安全嵌入 TopBar 的 Link 内。 */
export function Brand() {
  const lang = useDemoLang();
  return lang === "zh" ? <>兔维斯 <span className="text-inkdim">Tuvis</span></> : <>Tuvis</>;
}
