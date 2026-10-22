import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { LangLayout } from "@/components/layout/LangLayout";
import { resolveLangEntryFromBrowser } from "@/utils/langRedirect";
import Home from "@/pages/Home";
import DemoPage from "@/pages/DemoPage";
import DocsArticlePage from "@/pages/DocsArticlePage";
import ChangelogPage from "@/pages/ChangelogPage";

const WorldPage = lazy(() => import("@/pages/WorldPage"));
const WorkshopPage = lazy(() => import("@/pages/WorkshopPage"));

export const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "/" → ""（根路径部署）

/** W1/W2 首访语言分流入口（/ 与 * 共用）。
 *  「仅根路径」由路由结构保证：合法深链（/:lang/*）不会挂载本组件；tuvis-redirect 深链回放
 *  发生在 render 之前的 restoreBootLocation，改写完路径后根入口根本不挂载（W3 深链不覆盖）。
 *  * 兜底（未知路径）原先硬编码跳 /zh，现同样按「手动偏好 → 浏览器语言」归流（§1.3）。 */
function LangEntry() {
  return <Navigate to={`/${resolveLangEntryFromBrowser()}`} replace />;
}

const worldFallback = (
  <main className="mx-auto max-w-5xl px-5 py-24 text-center text-inkdim" aria-busy="true">
    兔维斯世界加载中…
  </main>
);

/** 路由表提为命名导出：boot 集成测试/未来门禁需复用同一份 routes 建 router（单例在模块求值时即创建，测试无法复用） */
export const routes = [
  { path: "/", element: <LangEntry /> },
  {
    path: "/:lang",
    element: <LangLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "world",
        element: <Suspense fallback={worldFallback}><WorldPage /></Suspense>,
      },
      {
        path: "world/workshop",
        element: <Suspense fallback={worldFallback}><WorkshopPage /></Suspense>,
      },
      { path: "demo", element: <DemoPage /> },
      /* P13：/docs 直达 01-overview（总体导航卡片落地页按用户裁决移除） */
      { path: "docs", element: <Navigate to="01-overview" replace /> },
      { path: "docs/:slug", element: <DocsArticlePage /> },
      { path: "changelog", element: <ChangelogPage /> },
    ],
  },
  { path: "*", element: <LangEntry /> },
];

export const router = createBrowserRouter(routes, { basename: BASE });
