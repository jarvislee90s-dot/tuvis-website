import { useEffect } from "react";

/** 双语页签：把当前页的 title / description 写进 document（每页组件顶层调用一次）。
 *  StrictMode 双执行只是重复写同样的值，幂等无害；SPA 常驻单页应用，路由切换后
 *  上一页的值由下一页的调用覆盖，故卸载时不恢复旧值。 */
export function usePageMeta(meta: { title: string; description: string }): void {
  const { title, description } = meta;
  useEffect(() => {
    document.title = title;
    // 生产 index.html 恒有 meta[name=description]，创建分支只是 jsdom/防御兜底
    let el = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", description);
  }, [title, description]);
}
