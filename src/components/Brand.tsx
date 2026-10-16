import type { Lang } from "@/i18n";
import { useLang } from "@/i18n/useLang";

/** 品牌裸词（D1）：zh「兔维斯」、en「Tuvis」——品牌名不完整或嵌入长句的场景（版本号后缀、句中引用）用。 */
export function brandWord(lang: Lang): string {
  return lang === "zh" ? "兔维斯" : "Tuvis";
}

/** 品牌词单值（D1 裁决，批次 3 后续 demo COPY 化会复用）：zh 页「兔维斯 Tuvis」、en 页「Tuvis」。
 *  品牌词是按语言切换的单值数据，不走 i18n 键。 */
export function brandName(lang: Lang): string {
  return lang === "zh" ? `${brandWord(lang)} Tuvis` : brandWord(lang);
}

/** 品牌名（D1）：zh「兔维斯 Tuvis」（Tuvis 次级色，与 TopBar 现状一致）、en 仅「Tuvis」。
 *  读 useLang（@/i18n 共享语言入口——共享组件亦消费它，原 demo 侧钩子已迁此；须在 /:lang 路由树内渲染）；
 *  非 <a> 元素，可安全嵌入 TopBar 的 Link 内。 */
export function Brand() {
  const lang = useLang();
  const word = brandWord(lang);
  return lang === "zh" ? <>{word} <span className="text-inkdim">Tuvis</span></> : <>{word}</>;
}
