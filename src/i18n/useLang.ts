import { useParams } from "react-router";
import type { Lang } from "./index";

/** /:lang 参数归一为 Lang——全仓共享语言入口（品牌/demo/内容页共用；原 demo 侧钩子迁此，D7 单一来源）：
 *  以「en」开头视为英文，其余（缺失/非法，如 /fr）一律回退 zh。
 *  语言权威源 = URL，不用 i18next 实例语言 i18n.language（后者由 LangLayout effect 更新，切语首帧滞后一拍）。
 *  全仓另有两次 LANGS.includes 判定，语义不同、刻意不合并：LangLayout 是路由守卫（非法值须重定向而非
 *  静默回退），LanguageSwitcher 是按钮目标语言推导（需与已注册语言严格一致，en-US 之类视为非法）。 */
export function useLang(): Lang {
  const { lang } = useParams();
  return lang?.startsWith("en") ? "en" : "zh";
}
