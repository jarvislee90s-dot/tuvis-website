import { useParams } from "react-router";
import type { Lang } from "@/i18n";

/** /:lang 参数归一为 Lang——全仓共享语言入口（品牌/demo/内容页共用；原 demo 侧钩子迁此，D7 单一来源）：
 *  以「en」开头视为英文，其余（缺失/非法，如 /fr）一律回退 zh。
 *  语言权威源 = URL，不用 i18next 实例语言 i18n.language（后者由 LangLayout effect 更新，切语首帧滞后一拍）。
 *  与同目录 index.ts 分工：index 是 i18next 适配层（含全局 init 副作用）；本 hook 是 URL 权威钩子，刻意不进
 *  barrel——否则 @/i18n 全量导入（parity 等）会把 react-router 一并拖入。
 *  全仓另有两次 LANGS.includes 判定，语义不同、刻意不合并：LangLayout 是路由守卫（非法值须重定向而非
 *  静默回退），LanguageSwitcher 是按钮目标语言推导（需与已注册语言严格一致，en-US 之类视为非法）。 */
export function useLang(): Lang {
  const { lang } = useParams();
  return lang?.startsWith("en") ? "en" : "zh";
}
