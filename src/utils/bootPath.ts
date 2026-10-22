// GH Pages 404 兜底：把 404.html 存下的原始 URL 解析为 router 相对路径（剥 base 前缀，保留 search/hash）。
// base 尾斜杠可带可不带（内部归一化，兼容直传 import.meta.env.BASE_URL）；origin 需调用侧传 window.location.origin，不符即拒绝（防纵深）。
export function resolveBootPath(
  href: string,
  opts: { base: string; origin: string },
): string {
  // 归一化去尾斜杠：调用方可能直接传 import.meta.env.BASE_URL（base "/" 时为 "/"），不归一则 startsWith 静默全量回根
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

/** 与 scripts/make-404.mjs 注入脚本约定的存储键（该脚本是字面量，两侧保持一致，勿单改一处） */
export const REDIRECT_KEY = "tuvis-redirect";

/** restoreBootLocation 所需的最小 router 面——结构类型，不 import @/router，本文件保持零依赖 */
interface NavigateLike {
  navigate(to: string, opts?: { replace?: boolean }): void | Promise<void>;
}

/**
 * GH Pages 404 兜底第二跳：读 404.html 存下的原始 URL，经 resolveBootPath 解析后
 * 用 router.navigate（replace）恢复深链。必须在 RouterProvider render 前调用——
 * data router 在模块求值时即创建并初始化，此后再 history.replaceState 它不感知（不触发重导航），
 * 深链会坍缩到 /zh；router.navigate 则让 router 自身记下新位置。行为由 boot.integration.test.tsx 锁定。
 * 值只读一次、读后即清（先于 navigate），无论解析/navigate 结果如何都不留脏键，防 404→根→404 死循环。
 * 存储本身不可用（如 Chrome/Edge「屏蔽所有 Cookie」下访问器抛 SecurityError）则静默放弃恢复，
 * 不留键、不 navigate，交由 router 兜底（Navigate to /zh）——本函数在 main.tsx render 前的
 * 模块顶层同步调用，此处若抛出则后续 render 永不执行（整站白屏）。
 */
export function restoreBootLocation(
  router: NavigateLike,
  opts: { base: string; origin: string },
): void {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(REDIRECT_KEY);
    if (raw) sessionStorage.removeItem(REDIRECT_KEY);
  } catch {
    return; // 存储不可用：放弃恢复，交由 router 兜底（Navigate to /zh）
  }
  if (!raw) return;
  router.navigate(resolveBootPath(raw, opts), { replace: true });
}
