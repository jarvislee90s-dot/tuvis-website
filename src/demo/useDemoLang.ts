import { useParams } from "react-router";
import type { Lang } from "@/i18n";

/** /:lang 参数归一为 Lang（批次 3 B3-T2 起为 demo 侧统一语言入口，判定同 DocsArticlePage）：
 *  以「en」开头视为英文，其余（缺失/非法）一律回退 zh。 */
export function useDemoLang(): Lang {
  const { lang } = useParams();
  return lang?.startsWith("en") ? "en" : "zh";
}
