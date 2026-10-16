// GH Pages 404 兜底：把 404.html 存下的原始 URL 解析为 router 相对路径（剥 base 前缀，保留 search/hash）。
// base 无尾斜杠（如 "/tuvis-website"）；origin 需调用侧传 window.location.origin，不符即拒绝（防纵深）。
export function resolveBootPath(
  href: string,
  opts: { base: string; origin: string },
): string {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return "/";
  }
  if (u.origin !== opts.origin) return "/";
  // pathname 只认 base 自身或 base 下路径，其余一律回根，交给 router 兜底重定向
  if (u.pathname === opts.base || u.pathname === opts.base + "/") return "/";
  if (u.pathname.startsWith(opts.base + "/")) {
    return u.pathname.slice(opts.base.length) + u.search + u.hash;
  }
  return "/";
}
