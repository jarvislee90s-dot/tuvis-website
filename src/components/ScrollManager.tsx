import { useEffect } from "react";
import { useLocation } from "react-router";

/** SPA 路由切换回顶（B11）；带 hash 时滚动到锚点（修 demo#d1..#d4 落位）。 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" })); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
