// GH Pages 404 兜底：把 404.html 存下的原始 URL 解析为 router 相对路径（剥 base 前缀，保留 search/hash）。
// base 尾斜杠可带可不带（内部归一化，兼容直传 import.meta.env.BASE_URL）；origin 需调用侧传 window.location.origin，不符即拒绝（防纵深）。
export function resolveBootPath(
  href: string,
  opts: { base: string; origin: string },
): string {
  // 归一化去尾斜杠：调用方可能直接传 import.meta.env.BASE_URL（"/tuvis-website/"），不归一则 startsWith 静默全量回根
  const base = opts.base.replace(/\/+$/, "");
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return "/";
  }
  if (u.origin !== opts.origin) return "/";
  // pathname 只认 base 自身或 base 下路径，其余一律回根，交给 router 兜底重定向；
  // base 自身命中一律裸回根，query 交由 router 重定向丢弃
  if (u.pathname === base || u.pathname === base + "/") return "/";
  if (u.pathname.startsWith(base + "/")) {
    return u.pathname.slice(base.length) + u.search + u.hash;
  }
  return "/";
}
